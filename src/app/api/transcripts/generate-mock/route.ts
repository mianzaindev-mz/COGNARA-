// src/app/api/transcripts/generate-mock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * POST — Generate a realistic AI mock transcript for demo / fallback purposes
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
    const { lesson_id } = body;

    if (!lesson_id) {
      return NextResponse.json({ error: "Missing lesson_id" }, { status: 400, headers: SECURITY_HEADERS });
    }

    // Fetch lesson title
    const { data: lesson } = await supabase
      .from("lessons")
      .select("title, content")
      .eq("id", lesson_id)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    const groqKey = process.env.GROQ_API_KEY;
    let transcriptText = "";
    let segments: any[] = [];

    if (groqKey) {
      try {
        const GroqModule = await import("groq-sdk");
        const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
        const groq = new Groq({ apiKey: groqKey });

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an educational video scriptwriter.
Generate a realistic 5-minute video transcript for a lecture titled: "${lesson.title}".
Format the output as a JSON object containing:
1. "transcript_text": A full string of the transcript.
2. "segments": An array of objects, each containing:
   - "start_secs": number (seconds from video start)
   - "end_secs": number
   - "text": string (the sentence spoken)
   - "is_final": true

Generate at least 8-10 distinct chronological segments covering major points of the topic, spanning from 0 to 180 seconds.
Return ONLY valid JSON. Start directly with {.`
            },
            {
              role: "user",
              content: `Lesson Title: ${lesson.title}`
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
        transcriptText = parsed.transcript_text || "";
        segments = parsed.segments || [];
      } catch (err) {
        console.error("[Mock Transcript API] Groq mock generation failed:", err);
      }
    }

    // Local fallback if Groq failed or key missing
    if (!transcriptText || segments.length === 0) {
      transcriptText = `Welcome back class. Today we are focusing on our core topic, ${lesson.title}. Let's break down the foundational principles. First, we must understand the structure and syntax. Second, we apply the logical patterns. Finally, we implement error handling and verification. Let's dive deep into our examples and explore these workflows together. Thank you for listening.`;
      segments = [
        { start_secs: 0, end_secs: 15, text: `Welcome back class. Today we are focusing on our core topic, ${lesson.title}.`, is_final: true },
        { start_secs: 15, end_secs: 35, text: "Let's break down the foundational principles of this technology.", is_final: true },
        { start_secs: 35, end_secs: 65, text: "First, we must understand the structure, data models, and primary syntax.", is_final: true },
        { start_secs: 65, end_secs: 95, text: "Second, we apply the logical patterns and map our controller pipelines.", is_final: true },
        { start_secs: 95, end_secs: 130, text: "Finally, we implement thorough error handling, validation checks, and manual verification.", is_final: true },
        { start_secs: 130, end_secs: 160, text: "Let's dive deep into our examples and explore these workflows together.", is_final: true },
        { start_secs: 160, end_secs: 180, text: "Thank you for listening. Make sure to complete the study notes and quiz challenges.", is_final: true }
      ];
    }

    const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;

    // Check if one exists
    const { data: existing } = await supabase
      .from("video_transcripts")
      .select("id")
      .eq("lesson_id", lesson_id)
      .eq("student_id", user.id)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("video_transcripts")
        .update({
          transcript_text: transcriptText,
          transcript_segments: segments,
          source: "whisper",
          language: "en",
          word_count: wordCount,
          duration_secs: 180
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("video_transcripts")
        .insert({
          lesson_id,
          student_id: user.id,
          transcript_text: transcriptText,
          transcript_segments: segments,
          source: "whisper",
          language: "en",
          word_count: wordCount,
          duration_secs: 180
        })
        .select("*")
        .single();
      if (error) throw error;
      result = data;
    }

    void logAuditEvent({
      userId: user.id,
      action: "transcript.mock_generate",
      resource: "video_transcripts",
      resourceId: result.id,
      metadata: { lessonTitle: lesson.title }
    });

    return NextResponse.json({ success: true, transcript: result }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Mock Transcript Error]", err);
    return NextResponse.json({ error: err.message || "Failed to generate mock transcript" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
