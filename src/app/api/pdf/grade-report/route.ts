// src/app/api/pdf/grade-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGradeReportPdf } from "@/lib/pdf/generators/grade-report";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    // Optional: allow admin/coach to generate for another student
    const body = await request.json();
    const targetStudentId = body.studentId || user.id;

    // RBAC check: only own report, or admin, or coach
    if (targetStudentId !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || (profile.role !== "admin" && profile.role !== "coach")) {
        return NextResponse.json(
          { error: "Forbidden: Only admins/coaches can generate reports for other students" },
          { status: 403, headers: SECURITY_HEADERS }
        );
      }
    }

    // 1. Fetch student profile
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", targetStudentId)
      .maybeSingle();

    // 2. Fetch all graded submissions for this student
    const { data: submissions, error: subErr } = await supabase
      .from("graded_submissions")
      .select(`
        *,
        quiz:quiz_id (title),
        course:course_id (title)
      `)
      .eq("student_id", targetStudentId)
      .order("created_at", { ascending: false });

    if (subErr) throw subErr;

    const grades = (submissions || []).map((s: any) => ({
      quizTitle: s.quiz?.title || "Assessment",
      courseTitle: s.course?.title || "Independent",
      percentage: Number(s.percentage) || 0,
      letterGrade: s.letter_grade || "—",
      gradePoint: Number(s.grade_point) || 0,
      passed: !!s.passed,
      gradedAt: s.created_at,
    }));

    // 3. Calculate cumulative stats
    const totalQuizzes = grades.length;
    const totalPassed = grades.filter((g: any) => g.passed).length;
    const averagePercentage =
      totalQuizzes > 0
        ? grades.reduce((sum: number, g: any) => sum + g.percentage, 0) / totalQuizzes
        : 0;
    const cumulativeGPA =
      totalQuizzes > 0
        ? grades.reduce((sum: number, g: any) => sum + g.gradePoint, 0) / totalQuizzes
        : 0;

    // 4. Compile PDF
    const pdfBuffer = await generateGradeReportPdf({
      studentName: studentProfile?.full_name || "Cognara Student",
      studentEmail: studentProfile?.email || undefined,
      cumulativeGPA,
      totalQuizzes,
      totalPassed,
      averagePercentage,
      grades,
      dateStr: new Date().toLocaleDateString(),
    });

    // 5. Track export
    await supabase.from("generated_pdfs").insert({
      user_id: user.id,
      title: `Grade Report — ${studentProfile?.full_name || "Student"}`,
      type: "grade_report",
      source_id: null,
      storage_path: `pdf/grades/${targetStudentId}/${Date.now()}.pdf`,
      page_count: 1,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Grade_Report_${encodeURIComponent(studentProfile?.full_name || "Student")}.pdf"`,
        ...SECURITY_HEADERS,
      },
    });
  } catch (err: any) {
    console.error("[Grade Report PDF Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate grade report" },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
