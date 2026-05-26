/**
 * Chapter and lesson unlock logic.
 *
 * Unlock rules:
 *  - First chapter + first lesson auto-unlock on enrollment (handled in enrollment.ts)
 *  - Next chapter unlocks when all lessons in the current chapter are completed
 *  - Next lesson unlocks automatically (quiz gate: must pass quiz on graded lessons)
 *  - Chapters with is_locked=true are locked; lessons inherit lock from their chapter
 */

import { createClient } from "@/lib/supabase/server";
import { err, type CourseError } from "./types";

type UnlockResult =
  | { ok: true; unlockedId: string | null; message: string }
  | { ok: false; error: CourseError };

// ─── checkAndUnlockNextChapter ───────────────────────────────────────────────

/**
 * When a student completes all lessons in a chapter, unlock the next chapter.
 *
 * Steps:
 *  1. Find all lessons in the completed chapter
 *  2. Check if all are marked completed in lesson_progress
 *  3. If yes, find the next chapter by order_index and set is_locked=false
 */
export async function checkAndUnlockNextChapter(
  studentId: string,
  completedChapterId: string,
): Promise<UnlockResult> {
  const supabase = await createClient();

  // Get the completed chapter to know its course and order
  const { data: chapter, error: chapterErr } = await supabase
    .from("chapters")
    .select("id, course_id, order_index")
    .eq("id", completedChapterId)
    .single();

  if (chapterErr || !chapter) {
    return { ok: false, error: err("CHAPTER_NOT_FOUND", "Chapter not found.", 404) };
  }

  // Get all lessons in this chapter
  const { data: chapterLessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("chapter_id", completedChapterId);

  if (!chapterLessons || chapterLessons.length === 0) {
    // No lessons means chapter is trivially complete; unlock next
    return await unlockNextChapterByOrder(supabase, chapter.course_id, chapter.order_index);
  }

  // Check if all lessons are completed
  const lessonIds = chapterLessons.map((l: { id: string }) => l.id);
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("student_id", studentId)
    .in("lesson_id", lessonIds)
    .eq("completed", true);

  const completedCount = progress?.length ?? 0;

  if (completedCount < chapterLessons.length) {
    return {
      ok: true,
      unlockedId: null,
      message: `${completedCount}/${chapterLessons.length} lessons completed. Finish all to unlock the next chapter.`,
    };
  }

  // All lessons complete → unlock next chapter
  return await unlockNextChapterByOrder(supabase, chapter.course_id, chapter.order_index);
}

/**
 * Internal: find and unlock the chapter after the given order_index.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function unlockNextChapterByOrder(
  supabase: any,
  courseId: string,
  currentOrderIndex: number,
): Promise<UnlockResult> {
  const { data: nextChapter } = await supabase
    .from("chapters")
    .select("id, title")
    .eq("course_id", courseId)
    .gt("order_index", currentOrderIndex)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextChapter) {
    return {
      ok: true,
      unlockedId: null,
      message: "All chapters in this course are now complete!",
    };
  }

  // Unlock the next chapter
  await supabase
    .from("chapters")
    .update({ is_locked: false })
    .eq("id", nextChapter.id);

  return {
    ok: true,
    unlockedId: nextChapter.id,
    message: `Chapter "${nextChapter.title}" has been unlocked!`,
  };
}

// ─── checkAndUnlockNextLesson ────────────────────────────────────────────────

/**
 * After a student completes a lesson, determines if the next lesson is accessible.
 *
 * Rules:
 *  - If the completed lesson is graded, the student must have passed the quiz
 *  - If all checks pass, the next lesson (by order_index within the same chapter or course)
 *    is considered unlocked (lesson_progress row exists or can be created)
 *  - If this was the last lesson in a chapter, triggers chapter-level unlock check
 */
export async function checkAndUnlockNextLesson(
  studentId: string,
  completedLessonId: string,
): Promise<UnlockResult> {
  const supabase = await createClient();

  // Get the lesson details
  const { data: lesson, error: lessonErr } = await supabase
    .from("lessons")
    .select("id, course_id, chapter_id, order_index, is_graded")
    .eq("id", completedLessonId)
    .single();

  if (lessonErr || !lesson) {
    return { ok: false, error: err("LESSON_NOT_FOUND", "Lesson not found.", 404) };
  }

  // If the lesson is graded, check that the student passed the quiz
  if (lesson.is_graded) {
    const passed = await hasPassedQuiz(supabase, studentId, completedLessonId);
    if (!passed) {
      return {
        ok: true,
        unlockedId: null,
        message: "You need to pass the quiz for this lesson before advancing.",
      };
    }
  }

  // Find the next lesson in the same chapter (or course if no chapter)
  const nextLesson = await findNextLesson(supabase, lesson);

  if (!nextLesson) {
    // Last lesson in chapter — try to unlock next chapter
    if (lesson.chapter_id) {
      return await checkAndUnlockNextChapter(studentId, lesson.chapter_id);
    }
    return {
      ok: true,
      unlockedId: null,
      message: "You have completed all lessons!",
    };
  }

  return {
    ok: true,
    unlockedId: nextLesson.id,
    message: `Next lesson "${nextLesson.title}" is now available.`,
  };
}

/**
 * Check if the student has passed the quiz associated with a graded lesson.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hasPassedQuiz(supabase: any, studentId: string, lessonId: string): Promise<boolean> {
  // Find quiz linked to this lesson
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (!quiz) {
    // No quiz attached — treat as passed
    return true;
  }

  // Check for a passing attempt
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, passed")
    .eq("student_id", studentId)
    .eq("quiz_id", quiz.id)
    .eq("passed", true)
    .limit(1)
    .maybeSingle();

  return !!attempt;
}

/**
 * Find the next lesson after the current one by order_index.
 * Searches within the same chapter first, then falls back to course-level ordering.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findNextLesson(supabase: any, currentLesson: { course_id: string; chapter_id: string | null; order_index: number }) {
  // If the lesson belongs to a chapter, look within the chapter first
  if (currentLesson.chapter_id) {
    const { data: next } = await supabase
      .from("lessons")
      .select("id, title")
      .eq("chapter_id", currentLesson.chapter_id)
      .gt("order_index", currentLesson.order_index)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) return next;
  }

  // Fallback: search at the course level
  const { data: next } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("course_id", currentLesson.course_id)
    .gt("order_index", currentLesson.order_index)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  return next ?? null;
}
