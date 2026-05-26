/**
 * PATCH /api/enrollments/[enrollmentId]/drop — Drop a course enrollment
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dropCourse } from "@/lib/courses/enrollment";

const dropSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    const { enrollmentId } = await params;

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "You must be signed in to drop a course." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = dropSchema.safeParse(body);

    const result = await dropCourse(
      authData.user.id,
      enrollmentId,
      parsed.success ? parsed.data.reason : undefined,
    );

    if (!result.ok) {
      const status = result.error.status ?? 400;
      return NextResponse.json({ error: result.error.message }, { status });
    }

    return NextResponse.json({ message: "Course dropped successfully." });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
