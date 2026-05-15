import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type LessonOutline = {
  id: string;
  title: string;
  orderIndex: number;
  durationMins: number | null;
  type: string;
};

export type CourseLearnContext = {
  courseId: string;
  title: string;
  slug: string;
  category: string | null;
  totalLessons: number;
  lessons: LessonOutline[];
  progressPct: number;
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
        .select("id, title, order_index, duration_mins, type")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      return {
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        category: course.category,
        totalLessons: course.total_lessons ?? lessons?.length ?? 0,
        lessons: (lessons ?? []).map((l) => ({
          id: l.id,
          title: l.title,
          orderIndex: l.order_index,
          durationMins: l.duration_mins,
          type: l.type ?? "text",
        })),
        progressPct: enrollment.progress_pct ?? 0,
      };
    } catch {
      return null;
    }
  },
);
