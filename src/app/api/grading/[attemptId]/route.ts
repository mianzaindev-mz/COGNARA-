// src/app/api/grading/[attemptId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeQuizAttempt } from "@/lib/ai/agents/grading-agent";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";

type Params = {
  params: Promise<{
    attemptId: string;
  }>;
};

/** POST — Run full grading pipeline for a quiz attempt */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { attemptId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // Verify user owns attempt or is admin/coach
    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        quiz:quiz_id (coach_id)
      `)
      .eq("id", attemptId)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    // Fetch user profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isCoachOrAdmin = profile?.role === "coach" || profile?.role === "admin";
    const isOwner = attempt.student_id === user.id;

    if (!isOwner && !isCoachOrAdmin) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403, headers: SECURITY_HEADERS });
    }

    // Trigger grading pipeline
    const gradedSubmission = await gradeQuizAttempt(attemptId);
    if (!gradedSubmission) {
      return NextResponse.json({ error: "Grading pipeline failed to produce results" }, { status: 500, headers: SECURITY_HEADERS });
    }

    return NextResponse.json({
      success: true,
      submissionId: gradedSubmission.id,
      percentage: gradedSubmission.percentage,
      letterGrade: gradedSubmission.letter_grade
    }, { headers: SECURITY_HEADERS });

  } catch (err: any) {
    console.error("[Grading Run POST Error]", err);
    return NextResponse.json({ error: err.message || "Failed to run grading" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
