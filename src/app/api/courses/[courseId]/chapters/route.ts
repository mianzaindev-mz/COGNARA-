/**
 * POST /api/courses/[courseId]/chapters — Add a chapter to a course (coach only)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createChapterSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  order_index: z.number().int().min(0).optional(),
  is_free_preview: z.boolean().optional(),
  estimated_mins: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params;
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

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (course.coach_id !== authData.user.id) {
      return NextResponse.json({ error: "You can only add chapters to your own courses." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = createChapterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // If no order_index, auto-calculate as last
    let orderIndex = parsed.data.order_index;
    if (orderIndex === undefined) {
      const { data: lastChapter } = await supabase
        .from("chapters")
        .select("order_index")
        .eq("course_id", courseId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      orderIndex = (lastChapter?.order_index ?? -1) + 1;
    }

    const { data: chapter, error: insertErr } = await supabase
      .from("chapters")
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        order_index: orderIndex,
        is_free_preview: parsed.data.is_free_preview ?? false,
        estimated_mins: parsed.data.estimated_mins ?? null,
      })
      .select()
      .single();

    if (insertErr || !chapter) {
      return NextResponse.json({ error: "Could not create chapter." }, { status: 500 });
    }

    return NextResponse.json({ chapter }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();

    const { data: chapters, error } = await supabase
      .from("chapters")
      .select("id, title, description, order_index, is_locked, is_free_preview, total_lessons, estimated_mins")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Could not load chapters." }, { status: 500 });
    }

    return NextResponse.json({ chapters: chapters ?? [] });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
