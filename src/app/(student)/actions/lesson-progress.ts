"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/uuid";

export type LessonProgressResult = { ok: true; progressPct: number } | { ok: false; error: string };

export async function markLessonComplete(
  lessonId: string,
  courseId: string,
  slug: string,
): Promise<LessonProgressResult> {
  if (!isValidUUID(lessonId)) {
    return { ok: false, error: "Invalid lesson ID" };
  }
  if (!isValidUUID(courseId)) {
    return { ok: false, error: "Invalid course ID" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to save progress." };
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment) {
    return { ok: false, error: "You must be enrolled in this course." };
  }

  const { error: progressError } = await supabase.from("lesson_progress").upsert(
    {
      student_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,lesson_id" },
  );

  if (progressError) {
    return { ok: false, error: progressError.message };
  }

  const { data: lessons } = await supabase.from("lessons").select("id").eq("course_id", courseId);

  const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
  const total = lessonIds.length;

  let completedCount = 0;
  if (total > 0) {
    const { count } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("completed", true)
      .in("lesson_id", lessonIds);

    completedCount = count ?? 0;
  }

  const progressPct = total > 0 ? Math.min(100, Math.round((completedCount / total) * 100)) : 0;

  await supabase
    .from("enrollments")
    .update({
      progress_pct: progressPct,
      completed_at: progressPct >= 100 ? new Date().toISOString() : null,
    })
    .eq("student_id", user.id)
    .eq("course_id", courseId);

  revalidatePath("/dashboard");
  revalidatePath("/my-courses");
  revalidatePath("/progress");
  revalidatePath(`/learn/${slug}`);
  revalidatePath(`/learn/${slug}/lesson`);

  return { ok: true, progressPct };
}
