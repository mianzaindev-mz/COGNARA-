// src/app/api/transcripts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * POST — Save or update transcript
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    const body = await request.json();
    const { lesson_id, transcript_text, segments, source, language, duration_secs } = body;

    if (!lesson_id || !transcript_text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: SECURITY_HEADERS });
    }

    const wordCount = transcript_text.split(/\s+/).filter(Boolean).length;

    // Check if a transcript already exists for this lesson & student
    const { data: existing } = await supabase
      .from("video_transcripts")
      .select("id")
      .eq("lesson_id", lesson_id)
      .eq("student_id", user.id)
      .maybeSingle();

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("video_transcripts")
        .update({
          transcript_text,
          transcript_segments: segments || [],
          source: source || "web_speech",
          language: language || "en",
          word_count: wordCount,
          duration_secs: duration_secs || 0,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("video_transcripts")
        .insert({
          lesson_id,
          student_id: user.id,
          transcript_text,
          transcript_segments: segments || [],
          source: source || "web_speech",
          language: language || "en",
          word_count: wordCount,
          duration_secs: duration_secs || 0,
        })
        .select("*")
        .single();

      if (error) throw error;
      result = data;
    }

    void logAuditEvent({
      userId: user.id,
      action: "transcript.save",
      resource: "video_transcripts",
      resourceId: result.id,
      metadata: { wordCount, source: result.source }
    });

    return NextResponse.json({ success: true, transcript: result }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Transcripts POST Error]", err);
    return NextResponse.json({ error: err.message || "Failed to save transcript" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
