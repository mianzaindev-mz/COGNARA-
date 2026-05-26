/**
 * Progress calculation — course-level and chapter-level.
 *
 * Keeps enrollment.progress_pct in sync with actual lesson completion.
 * Called after every lesson-complete event.
 */

import { createClient } from "@/lib/supabase/server";
import { err, type CourseError } from "./types";

type ProgressResult =
  | { ok: true; progressPct: number; isComplete: boolean }
  | { ok: false; error: CourseError };

type ChapterProgressResult =
  | { ok: true; completedLessons: number; totalLessons: number; isChapterComplete: boolean }
  | { ok: false; error: CourseError };

// ─── calculateCourseProgress ─────────────────────────────────────────────────

/**
 * Recalculates and updates enrollment.progress_pct based on completed lessons.
 *
 * Formula: progress_pct = ROUND((completed / total) * 100)
 *
 * If 100%, also sets enrollment.completed_at.
 */
export async function calculateCourseProgress(
  studentId: string,
  courseId: string,
): Promise<ProgressResult> {
  const supabase = await createClient();

  // Count total lessons in the course
  const { data: allLessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);

  if (lessonsErr) {
    return { ok: false, error: err("LESSONS_FETCH_FAILED", "Could not load lessons.", 500) };
  }

  const totalLessons = allLessons?.length ?? 0;

  if (totalLessons === 0) {
    // Edge case: course with no lessons is trivially complete
    return { ok: true, progressPct: 100, isComplete: true };
  }

  // Count completed lessons for this student
  const lessonIds = allLessons!.map((l: { id: string }) => l.id);
  const { data: completedProgress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", studentId)
    .in("lesson_id", lessonIds)
    .eq("completed", true);

  const completedCount = completedProgress?.length ?? 0;
  const progressPct = Math.round((completedCount / totalLessons) * 100);
  const isComplete = progressPct >= 100;

  // Update the enrollment row
  const updatePayload: Record<string, unknown> = { progress_pct: progressPct };
  if (isComplete) {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error: updateErr } = await supabase
    .from("enrollments")
    .update(updatePayload)
    .eq("student_id", studentId)
    .eq("course_id", courseId);

  if (updateErr) {
    return { ok: false, error: err("PROGRESS_UPDATE_FAILED", "Could not update progress.", 500) };
  }

  return { ok: true, progressPct, isComplete };
}

// ─── calculateChapterProgress ────────────────────────────────────────────────

/**
 * Checks how many lessons in a chapter are completed by the student.
 *
 * Returns the count and whether the chapter is fully complete.
 * Does NOT mutate any data — it's a read-only check used by the unlock system.
 */
export async function calculateChapterProgress(
  studentId: string,
  chapterId: string,
): Promise<ChapterProgressResult> {
  const supabase = await createClient();

  // Get all lessons in this chapter
  const { data: chapterLessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("id")
    .eq("chapter_id", chapterId);

  if (lessonsErr) {
    return { ok: false, error: err("LESSONS_FETCH_FAILED", "Could not load chapter lessons.", 500) };
  }

  const totalLessons = chapterLessons?.length ?? 0;

  if (totalLessons === 0) {
    return { ok: true, completedLessons: 0, totalLessons: 0, isChapterComplete: true };
  }

  // Count completed
  const lessonIds = chapterLessons!.map((l: { id: string }) => l.id);
  const { data: completedProgress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", studentId)
    .in("lesson_id", lessonIds)
    .eq("completed", true);

  const completedLessons = completedProgress?.length ?? 0;

  return {
    ok: true,
    completedLessons,
    totalLessons,
    isChapterComplete: completedLessons >= totalLessons,
  };
}
