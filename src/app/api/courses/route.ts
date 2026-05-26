/**
 * POST /api/courses  — Create a new course (coach only)
 * GET  /api/courses  — List courses (public for published, filtered)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createCourseSchema,
  listCoursesQuerySchema,
} from "@/lib/validation/schemas/course.schema";
import { ZodError } from "zod";

// ─── POST — Create course ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "You must be signed in to create a course." },
        { status: 401 },
      );
    }

    // Role check — only coaches can create courses
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (!profile || profile.role !== "coach") {
      return NextResponse.json(
        { error: "Only coaches can create courses." },
        { status: 403 },
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = createCourseSchema.parse(body);

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", parsed.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A course with this slug already exists. Choose a different slug." },
        { status: 409 },
      );
    }

    // Insert
    const { data: course, error: insertErr } = await supabase
      .from("courses")
      .insert({
        coach_id: authData.user.id,
        title: parsed.title,
        slug: parsed.slug,
        description: parsed.description ?? null,
        category: parsed.category ?? null,
        difficulty: parsed.difficulty ?? "beginner",
        price_usd: parsed.price_usd,
        is_published: parsed.is_published,
        thumbnail_url: parsed.thumbnail_url ?? null,
        preview_video_url: parsed.preview_video_url ?? null,
        tags: parsed.tags,
        language: parsed.language,
      })
      .select()
      .single();

    if (insertErr || !course) {
      return NextResponse.json(
        { error: "Could not create the course. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", details: e.flatten().fieldErrors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

// ─── GET — List courses ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = request.nextUrl;

    // Parse query params
    const params = listCoursesQuerySchema.parse({
      search: url.searchParams.get("search") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      difficulty: url.searchParams.get("difficulty") ?? undefined,
      is_published: url.searchParams.get("is_published") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    // Check if user is authenticated (for coach-specific filtering)
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    let query = supabase
      .from("courses")
      .select(
        "id, coach_id, title, slug, description, category, difficulty, price_usd, is_published, total_lessons, total_enrolled, avg_rating, created_at, updated_at",
      );

    // Public users only see published courses
    // Authenticated coaches see their own (published or not)
    if (params.is_published !== undefined) {
      query = query.eq("is_published", params.is_published === "true");
    } else if (!userId) {
      // Unauthenticated → only published
      query = query.eq("is_published", true);
    }

    // Soft-delete filter
    query = query.is("deleted_at", null);

    // Optional filters
    if (params.search) {
      query = query.ilike("title", `%${params.search}%`);
    }
    if (params.category) {
      query = query.eq("category", params.category);
    }
    if (params.difficulty) {
      query = query.eq("difficulty", params.difficulty);
    }

    // Pagination + ordering
    const { data: courses, error } = await query
      .order("created_at", { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (error) {
      return NextResponse.json(
        { error: "Could not load courses." },
        { status: 500 },
      );
    }

    return NextResponse.json({ courses: courses ?? [], count: courses?.length ?? 0 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters.", details: e.flatten().fieldErrors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
