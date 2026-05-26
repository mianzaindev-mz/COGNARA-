/**
 * POST /api/progress/lesson-complete — Mark a lesson as completed
 *
 * Triggers the unlock chain: next lesson → chapter completion → next chapter unlock.
 * Also recalculates course progress percentage.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calculateCourseProgress } from "@/lib/courses/progress";
import { checkAndUnlockNextLesson } from "@/lib/courses/unlock";

const completeSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID."),
  quizScore: z.number().int().min(0).max(100).optional(),
  quizPassed: z.boolean().optional(),
  timeSpentMins: z.number().int().min(0).max(600).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "You must be signed in to track progress." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const studentId = authData.user.id;
    const { lessonId, quizScore, quizPassed, timeSpentMins } = parsed.data;

    // Get lesson to know its course_id and chapter_id
    const { data: lesson, error: lessonErr } = await supabase
      .from("lessons")
      .select("id, course_id, chapter_id")
      .eq("id", lessonId)
      .single();

    if (lessonErr || !lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    // Verify student is enrolled in this course
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", lesson.course_id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this course." },
        { status: 403 },
      );
    }

    // Upsert lesson_progress — mark as completed
    const { error: progressErr } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          student_id: studentId,
          lesson_id: lessonId,
          chapter_id: lesson.chapter_id ?? null,
          completed: true,
          completed_at: new Date().toISOString(),
          time_spent_mins: timeSpentMins ?? 0,
          is_unlocked: true,
          quiz_score: quizScore ?? null,
          quiz_passed: quizPassed ?? null,
          quiz_attempts_count: quizScore !== undefined ? 1 : 0,
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: "student_id,lesson_id" },
      );

    if (progressErr) {
      return NextResponse.json(
        { error: "Could not save progress. Please try again." },
        { status: 500 },
      );
    }

    // Trigger unlock chain (non-blocking errors won't fail the request)
    let unlockMessage: string | null = null;
    try {
      const unlockResult = await checkAndUnlockNextLesson(studentId, lessonId);
      if (unlockResult.ok) {
        unlockMessage = unlockResult.message;
      }
    } catch {
      // Non-critical — progress is already saved
    }

    // Recalculate course progress
    let progressPct = 0;
    let isCourseComplete = false;
    try {
      const progressResult = await calculateCourseProgress(studentId, lesson.course_id);
      if (progressResult.ok) {
        progressPct = progressResult.progressPct;
        isCourseComplete = progressResult.isComplete;
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      message: "Lesson completed!",
      progressPct,
      isCourseComplete,
      unlockMessage,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
