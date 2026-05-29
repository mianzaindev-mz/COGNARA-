// src/app/api/pdf/lecture-notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLectureNotesPdf } from "@/lib/pdf/generators/lecture-notes";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";

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
    const { notesId } = body;

    if (!notesId) {
      return NextResponse.json({ error: "Missing notesId" }, { status: 400, headers: SECURITY_HEADERS });
    }

    // 1. Fetch lecture notes from database
    const { data: note, error: noteErr } = await supabase
      .from("lecture_notes")
      .select(`
        *,
        lesson:lesson_id (
          title,
          course:course_id (
            title
          )
        )
      `)
      .eq("id", notesId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (noteErr || !note) {
      return NextResponse.json({ error: "Lecture notes not found or access denied" }, { status: 404, headers: SECURITY_HEADERS });
    }

    // 2. Fetch student name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const studentName = profile?.full_name || "Cognara Student";
    const courseTitle = note.lesson?.course?.title || "Cognara Course";

    // 3. Compile PDF buffer
    const pdfBuffer = await generateLectureNotesPdf({
      title: note.title || note.lesson?.title || "Lecture Notes",
      summary: note.summary || "",
      key_points: note.key_points || [],
      key_terms: note.key_terms || {},
      full_notes_md: note.full_notes_md || "",
      courseTitle,
      studentName,
      dateStr: new Date(note.created_at).toLocaleDateString(),
    });

    // 4. Return PDF stream with download headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(note.title || "Lecture_Notes")}.pdf"`,
        ...SECURITY_HEADERS,
      },
    });
  } catch (err: any) {
    console.error("[Lecture Notes PDF API Error]", err);
    return NextResponse.json({ error: err.message || "Failed to generate PDF" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
