import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type LessonOutline = {
  id: string;
  title: string;
  content: string | null;
  orderIndex: number;
  durationMins: number | null;
  type: string;
  isGraded: boolean;
};

export type CourseLearnContext = {
  courseId: string;
  title: string;
  slug: string;
  category: string | null;
  totalLessons: number;
  lessons: LessonOutline[];
  progressPct: number;
  completedLessonIds: string[];
};

export const loadCourseLearnContext = cache(
  async (slug: string, userId: string): Promise<CourseLearnContext | null> => {
    try {
      const supabase = await createClient();

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, title, slug, category, total_lessons")
        .eq("slug", slug)
        .is("deleted_at", null)
        .maybeSingle();

      if (courseError || !course) return null;

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("progress_pct")
        .eq("student_id", userId)
        .eq("course_id", course.id)
        .maybeSingle();

      if (!enrollment) return null;

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, content, order_index, duration_mins, type, is_graded")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      const lessonRows = lessons ?? [];
      const lessonIds = lessonRows.map((l) => l.id);

      let completedLessonIds: string[] = [];
      if (lessonIds.length > 0) {
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("student_id", userId)
          .eq("completed", true)
          .in("lesson_id", lessonIds);

        completedLessonIds = (progress ?? []).map((p) => p.lesson_id);
      }

      return {
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        category: course.category,
        totalLessons: course.total_lessons ?? lessonRows.length,
        lessons: lessonRows.map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          orderIndex: l.order_index,
          durationMins: l.duration_mins,
          type: l.type ?? "text",
          isGraded: !!l.is_graded,
        })),
        progressPct: enrollment.progress_pct ?? 0,
        completedLessonIds,
      };
    } catch {
      return null;
    }
  },
);
