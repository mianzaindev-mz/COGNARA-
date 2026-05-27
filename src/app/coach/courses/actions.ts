"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/uuid";

type CreateCoachCourseInput = {
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  price: number;
  description?: string;
};

type CreateCoachCourseResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

function toSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${base || "course"}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createCoachCourse(
  input: CreateCoachCourseInput,
): Promise<CreateCoachCourseResult> {
  const trimmedTitle = input.title.trim();
  const category = input.category.trim() || "General";
  const price = Number(input.price);
  const description = (input.description ?? "").trim();

  if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
    return { ok: false, error: "Course title must be between 5 and 200 characters." };
  }

  if (!["beginner", "intermediate", "advanced"].includes(input.difficulty)) {
    return { ok: false, error: "Please choose a valid difficulty level." };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Price must be a valid non-negative number." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Authenticated session expired. Please log in again." };
    }

    if (!isValidUUID(user.id)) {
      return { ok: false, error: "Invalid user ID" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? user.user_metadata?.role;
    if (role && role !== "coach" && role !== "admin") {
      return { ok: false, error: "Only coaches and admins can create courses." };
    }

    const slug = toSlug(trimmedTitle);
    const { data: course, error: insertError } = await supabase
      .from("courses")
      .insert({
        coach_id: user.id,
        title: trimmedTitle,
        slug,
        category,
        difficulty: input.difficulty,
        price_usd: price,
        is_published: false,
        ...(description ? { description } : {}),
      })
      .select("slug")
      .single();

    if (insertError || !course) {
      return {
        ok: false,
        error:
          insertError?.message ||
          "Failed to create course. Please check your coach permissions and try again.",
      };
    }

    revalidatePath("/coach/courses");
    revalidatePath(`/coach/courses/${course.slug}`);

    return { ok: true, slug: course.slug };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected course creation error.",
    };
  }
}
