/**
 * POST /api/courses/[courseId]/chapters/[chapterId]/lessons — Add a lesson to a chapter
 * GET  /api/courses/[courseId]/chapters/[chapterId]/lessons — List lessons in a chapter
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createLessonSchema = z.object({
  title: z.string().min(2).max(300),
  content: z.string().max(100000).optional(),
  type: z.enum(["text", "video", "code", "quiz", "mini_activity"]).optional(),
  video_url: z.string().url().optional().nullable(),
  duration_mins: z.number().int().min(0).optional(),
  is_free_preview: z.boolean().optional(),
  is_graded: z.boolean().optional(),
  estimated_mins: z.number().int().min(0).optional(),
  lesson_order_in_chapter: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const { courseId, chapterId } = await params;
    const supabase = await createClient();

    // Auth + ownership
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id, coach_id")
      .eq("id", courseId)
      .single();

    if (!course || course.coach_id !== authData.user.id) {
      return NextResponse.json({ error: "Course not found or you don't own it." }, { status: 403 });
    }

    // Verify chapter belongs to this course
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("id", chapterId)
      .eq("course_id", courseId)
      .single();

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found in this course." }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Auto-calculate order if not provided
    let orderInChapter = parsed.data.lesson_order_in_chapter;
    if (orderInChapter === undefined) {
      const { data: lastLesson } = await supabase
        .from("lessons")
        .select("lesson_order_in_chapter")
        .eq("chapter_id", chapterId)
        .order("lesson_order_in_chapter", { ascending: false })
        .limit(1)
        .maybeSingle();

      orderInChapter = (lastLesson?.lesson_order_in_chapter ?? -1) + 1;
    }

    // Also auto-calculate course-level order_index
    const { data: lastCourseLesson } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const courseOrderIndex = (lastCourseLesson?.order_index ?? -1) + 1;

    const { data: lesson, error: insertErr } = await supabase
      .from("lessons")
      .insert({
        course_id: courseId,
        chapter_id: chapterId,
        title: parsed.data.title,
        content: parsed.data.content ?? null,
        type: parsed.data.type ?? "text",
        video_url: parsed.data.video_url ?? null,
        duration_mins: parsed.data.duration_mins ?? null,
        is_free_preview: parsed.data.is_free_preview ?? false,
        is_graded: parsed.data.is_graded ?? false,
        estimated_mins: parsed.data.estimated_mins ?? null,
        lesson_order_in_chapter: orderInChapter,
        order_index: courseOrderIndex,
      })
      .select()
      .single();

    if (insertErr || !lesson) {
      return NextResponse.json({ error: "Could not create lesson." }, { status: 500 });
    }

    return NextResponse.json({ lesson }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const { chapterId } = await params;
    const supabase = await createClient();

    const { data: lessons, error } = await supabase
      .from("lessons")
      .select("id, title, type, content, video_url, duration_mins, is_free_preview, is_graded, estimated_mins, lesson_order_in_chapter, order_index")
      .eq("chapter_id", chapterId)
      .order("lesson_order_in_chapter", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Could not load lessons." }, { status: 500 });
    }

    return NextResponse.json({ lessons: lessons ?? [] });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
