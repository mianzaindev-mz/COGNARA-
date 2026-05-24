import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/uuid";

export type EnrolledCourse = {
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  category: string | null;
  progressPct: number;
  progressDone: number;
  totalLessons: number;
  completedAt: string | null;
};

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  total_lessons: number;
};

export const loadStudentEnrollments = cache(async (userId: string): Promise<EnrolledCourse[]> => {
  if (!isValidUUID(userId)) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        `
        id,
        progress_pct,
        completed_at,
        courses (
          id,
          title,
          slug,
          category,
          total_lessons
        )
      `,
      )
      .eq("student_id", userId)
      .order("enrolled_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    const rows: EnrolledCourse[] = [];

    for (const row of data) {
      const course = row.courses as CourseRow | CourseRow[] | null;
      const c = Array.isArray(course) ? course[0] : course;
      if (!c?.id) continue;

      const total = Math.max(c.total_lessons ?? 0, 1);
      const pct = row.progress_pct ?? 0;
      const done = Math.min(total, Math.round((pct / 100) * total));

      rows.push({
        enrollmentId: row.id,
        courseId: c.id,
        title: c.title,
        slug: c.slug,
        category: c.category,
        progressPct: pct,
        progressDone: done,
        totalLessons: total,
        completedAt: row.completed_at,
      });
    }

    return rows;
  } catch {
    return [];
  }
});
