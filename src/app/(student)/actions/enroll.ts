"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EnrollResult = { ok: true } | { ok: false; error: string };

export async function enrollInCourse(courseId: string): Promise<EnrollResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to enroll." };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, is_published")
    .eq("id", courseId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!course?.is_published) {
    return { ok: false, error: "Course is not available." };
  }

  const { error } = await supabase.from("enrollments").insert({
    student_id: user.id,
    course_id: courseId,
    progress_pct: 0,
  });

  if (error) {
    if (error.code === "23505") {
      revalidatePath("/dashboard");
      revalidatePath("/my-courses");
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-courses");
  revalidatePath(`/learn`);

  return { ok: true };
}
