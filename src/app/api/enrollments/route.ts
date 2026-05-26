/**
 * POST /api/enrollments — Enroll in a course
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enrollStudent } from "@/lib/courses/enrollment";

const enrollSchema = z.object({
  courseId: z.string().uuid("Invalid course ID."),
  paymentIntentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "You must be signed in to enroll." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await enrollStudent(
      authData.user.id,
      parsed.data.courseId,
      parsed.data.paymentIntentId,
    );

    if (!result.ok) {
      const status = result.error.status ?? 400;
      return NextResponse.json({ error: result.error.message }, { status });
    }

    return NextResponse.json(
      { enrollment: result.enrollment, message: "Successfully enrolled!" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
