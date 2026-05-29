// src/app/api/transcripts/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNotes } from "@/lib/ai/agents/transcript-agent";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * POST — Trigger AI lecture notes synthesis for a transcript
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // 1. Fetch transcript details
    const { data: transcript, error: transcriptErr } = await supabase
      .from("video_transcripts")
      .select(`
        *,
        lesson:lesson_id (
          id,
          title
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (transcriptErr || !transcript) {
      return NextResponse.json({ error: "Transcript record not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    // Ensure access control (students read own notes / public transcripts)
    if (transcript.student_id !== user.id && !transcript.is_public) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: SECURITY_HEADERS });
    }

    const lessonTitle = transcript.lesson?.title || "Lecture";
    const transcriptText = transcript.transcript_text;

    // 2. Invoke note synthesizer agent
    const notes = await generateNotes(
      transcriptText,
      lessonTitle,
      user.id,
      transcript.lesson_id,
      transcript.id
    );

    if (!notes) {
      return NextResponse.json({ error: "Notes generation failed in AI pipeline" }, { status: 500, headers: SECURITY_HEADERS });
    }

    void logAuditEvent({
      userId: user.id,
      action: "lecture_notes.generate",
      resource: "lecture_notes",
      resourceId: notes.id,
      metadata: { lessonId: transcript.lesson_id }
    });

    return NextResponse.json({ success: true, notes }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Transcripts Notes POST Error]", err);
    return NextResponse.json({ error: err.message || "Failed to generate lecture notes" }, { status: 500, headers: SECURITY_HEADERS });
  }
}

/**
 * GET — Retrieve lecture notes associated with a transcript
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    const { data: notes, error } = await supabase
      .from("lecture_notes")
      .select("*")
      .eq("transcript_id", id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!notes) {
      return NextResponse.json({ error: "Notes not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    return NextResponse.json({ success: true, notes }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Transcripts Notes GET Error]", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve lecture notes" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
