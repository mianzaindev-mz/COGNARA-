// src/app/api/grading/[submissionId]/override/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeOverrideSchema } from "@/lib/validation/schemas/enhanced-skills.schema";
import { getStandardGradeScale } from "@/lib/ai/agents/grading-agent";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";

type Params = {
  params: Promise<{
    submissionId: string;
  }>;
};

/** PATCH — Coach grade override with instructor note */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { submissionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // RBAC: Verify Coach or Admin privilege
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "coach" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403, headers: SECURITY_HEADERS });
    }

    // Fetch existing submission
    const { data: sub } = await supabase
      .from("graded_submissions")
      .select(`
        *,
        grade_scale:grade_scale_id (grades, passing_grade)
      `)
      .eq("id", submissionId)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    // Verify coach owns the quiz or is admin
    if (profile?.role !== "admin" && sub.coach_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403, headers: SECURITY_HEADERS });
    }

    const body = await request.json();
    const parsed = gradeOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid override data", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const { instructor_override, instructor_note } = parsed.data;

    const updates: Record<string, any> = {};
    if (instructor_note !== undefined) updates.instructor_note = instructor_note;

    if (instructor_override !== undefined) {
      updates.instructor_override = instructor_override;
      updates.grading_method = "hybrid";

      // Recalculate letter grade and grade point
      let gradesArray = getStandardGradeScale();
      let passingLetter = "D";

      if (sub.grade_scale) {
        if (Array.isArray(sub.grade_scale.grades)) {
          gradesArray = sub.grade_scale.grades;
        }
        if (sub.grade_scale.passing_grade) {
          passingLetter = sub.grade_scale.passing_grade;
        }
      }

      const matchedGrade = gradesArray
        .filter((g: any) => instructor_override >= g.min_pct && instructor_override <= g.max_pct)
        .sort((a: any, b: any) => b.min_pct - a.min_pct)[0] || { letter: "F", grade_point: 0.0 };

      updates.letter_grade = matchedGrade.letter;
      updates.grade_point = matchedGrade.grade_point;

      const lettersOrder = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
      const attemptIndex = lettersOrder.indexOf(matchedGrade.letter);
      const passingIndex = lettersOrder.indexOf(passingLetter);
      updates.passed = attemptIndex <= passingIndex && matchedGrade.letter !== "F";

      // Update quiz_attempts score
      if (sub.attempt_id) {
        await supabase
          .from("quiz_attempts")
          .update({
            score: Math.round(instructor_override),
            passed: updates.passed
          })
          .eq("id", sub.attempt_id);
      }
    }

    const { data: updatedSub, error } = await supabase
      .from("graded_submissions")
      .update(updates)
      .eq("id", submissionId)
      .select("*")
      .single();

    if (error) throw error;

    void logAuditEvent({
      userId: user.id,
      action: "grading.override",
      resource: "graded_submission",
      resourceId: submissionId,
      metadata: { previous: sub, updated: updatedSub }
    });

    // Notify student of grade override
    if (sub.student_id) {
      await supabase.from("notifications").insert({
        user_id: sub.student_id,
        type: "system",
        title: "Grade Updated by Coach",
        message: `Your grade for attempt on quiz has been overridden by your instructor.`,
        is_read: false,
      });
    }

    return NextResponse.json({ success: true, submission: updatedSub }, { headers: SECURITY_HEADERS });

  } catch (err: any) {
    console.error("[Grading Override Error]", err);
    return NextResponse.json({ error: err.message || "Failed to override grade" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
