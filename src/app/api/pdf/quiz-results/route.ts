// src/app/api/pdf/quiz-results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuizResultsPdf } from "@/lib/pdf/generators/quiz-results";
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
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400, headers: SECURITY_HEADERS });
    }

    // 1. Fetch graded submission details
    const { data: sub, error: subErr } = await supabase
      .from("graded_submissions")
      .select(`
        *,
        student:student_id (full_name),
        quiz:quiz_id (title)
      `)
      .eq("id", submissionId)
      .maybeSingle();

    if (subErr || !sub) {
      return NextResponse.json({ error: "Graded submission record not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    // RBAC access check
    const isOwner = sub.student_id === user.id;
    const isCoach = sub.coach_id === user.id;
    
    // Fetch profile role if not owner or coach
    let isAdmin = false;
    if (!isOwner && !isCoach) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin") isAdmin = true;
    }

    if (!isOwner && !isCoach && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403, headers: SECURITY_HEADERS });
    }

    // 2. Compile PDF buffer
    const pdfBuffer = await generateQuizResultsPdf({
      quizTitle: sub.quiz?.title || "Quiz Evaluation",
      studentName: sub.student?.full_name || "Cognara Student",
      rawScore: Number(sub.raw_score),
      maxScore: Number(sub.max_score),
      percentage: Number(sub.percentage),
      letterGrade: sub.letter_grade || "F",
      gradePoint: Number(sub.grade_point),
      passed: !!sub.passed,
      overallFeedback: sub.overall_feedback || "No feedback logged.",
      strengths: sub.strengths || [],
      areas_for_improvement: sub.areas_for_improvement || [],
      recommended_resources: sub.recommended_resources || [],
      questionGrades: sub.question_grades || [],
      dateStr: new Date(sub.created_at).toLocaleDateString()
    });

    // 3. Return response with download headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Quiz_Result_${encodeURIComponent(sub.quiz?.title || "Graded_Submission")}.pdf"`,
        ...SECURITY_HEADERS,
      },
    });

  } catch (err: any) {
    console.error("[Quiz Results PDF API Error]", err);
    return NextResponse.json({ error: err.message || "Failed to compile quiz report" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
