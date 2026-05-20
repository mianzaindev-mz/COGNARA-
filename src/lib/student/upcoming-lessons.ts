import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type UpcomingLessonRow = {
  lessonLabel: string;
  courseTitle: string;
  courseSlug: string;
  teacherInitial: string;
  durationLabel: string;
  href: string;
};

export const loadStudentUpcomingLessons = cache(
  async (userId: string, limit = 5): Promise<UpcomingLessonRow[]> => {
    if (!isSupabaseConfigured()) return [];

    try {
      const supabase = await createClient();

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses ( title, slug )")
        .eq("student_id", userId);

      if (!enrollments?.length) return [];

      const courseIds = enrollments
        .map((e: any) => e.course_id)
        .filter((id: any): id is string => Boolean(id));

      if (courseIds.length === 0) return [];

      const [{ data: lessons }, { data: completed }] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, title, order_index, duration_mins, course_id")
          .in("course_id", courseIds)
          .order("order_index", { ascending: true }),
        supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("student_id", userId)
          .eq("completed", true),
      ]);

      const completedIds = new Set((completed ?? []).map((r: any) => r.lesson_id));
      const courseMeta = new Map<string, { title: string; slug: string }>();

      for (const e of enrollments) {
        const c = e.courses as { title: string; slug: string } | { title: string; slug: string }[] | null;
        const row = Array.isArray(c) ? c[0] : c;
        if (row?.title && e.course_id) {
          courseMeta.set(e.course_id, { title: row.title, slug: row.slug });
        }
      }

      const rows: UpcomingLessonRow[] = [];
      const seenCourse = new Set<string>();

      for (const lesson of lessons ?? []) {
        if (seenCourse.has(lesson.course_id)) continue;
        if (completedIds.has(lesson.id)) continue;

        const meta = courseMeta.get(lesson.course_id);
        if (!meta) continue;

        seenCourse.add(lesson.course_id);
        rows.push({
          lessonLabel: `Lesson ${lesson.order_index} · ${lesson.title}`,
          courseTitle: meta.title,
          courseSlug: meta.slug,
          teacherInitial: meta.title.charAt(0).toUpperCase(),
          durationLabel: lesson.duration_mins ? `${lesson.duration_mins} min` : "—",
          href: `/learn/${meta.slug}/lesson/${lesson.order_index}`,
        });

        if (rows.length >= limit) break;
      }

      return rows;
    } catch {
      return [];
    }
  },
);
