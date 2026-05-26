/**
 * GET  /api/courses/[courseId] — Get full course details with chapters + lessons
 * PATCH /api/courses/[courseId] — Update course (coach only)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateCourseSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().max(10000).optional(),
  short_description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  price_usd: z.number().min(0).optional(),
  is_published: z.boolean().optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  preview_video_url: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  what_you_will_learn: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  target_audience: z.string().max(500).optional(),
  estimated_hours: z.number().min(0).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();

    // Get course with chapters
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select(`
        *,
        chapters:chapters(
          id, title, description, order_index, is_locked, is_free_preview,
          lessons:lessons(
            id, title, type, duration_mins, is_free_preview, is_graded, order_index, lesson_order_in_chapter
          )
        )
      `)
      .eq("id", courseId)
      .is("deleted_at", null)
      .single();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    // Sort chapters by order_index, lessons by lesson_order_in_chapter
    if (course.chapters) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (course.chapters as any[]).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (course.chapters as any[]).forEach((ch: any) => {
        if (ch.lessons) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ch.lessons.sort((a: any, b: any) =>
            (a.lesson_order_in_chapter ?? a.order_index ?? 0) - (b.lesson_order_in_chapter ?? b.order_index ?? 0),
          );
        }
      });
    }

    return NextResponse.json({ course });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();

    // Auth + ownership check
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id, coach_id")
      .eq("id", courseId)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (course.coach_id !== authData.user.id) {
      return NextResponse.json({ error: "You can only edit your own courses." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

    // If publishing, set published_at
    if (parsed.data.is_published === true) {
      updates.published_at = new Date().toISOString();
      updates.status = "published";
    }

    const { data: updated, error: updateErr } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", courseId)
      .select()
      .single();

    if (updateErr || !updated) {
      return NextResponse.json({ error: "Could not update course." }, { status: 500 });
    }

    return NextResponse.json({ course: updated });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
