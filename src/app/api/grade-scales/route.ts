// src/app/api/grade-scales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGradeScaleSchema } from "@/lib/validation/schemas/enhanced-skills.schema";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";

/** GET — List grade scales */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // List scales for this coach plus default scales
    const { data: scales, error } = await supabase
      .from("grade_scales")
      .select("*")
      .or(`coach_id.eq.${user.id},is_default.eq.true`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ scales: scales || [] }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Grade Scales GET Error]", err);
    return NextResponse.json({ error: err.message || "Failed to list grade scales" }, { status: 500, headers: SECURITY_HEADERS });
  }
}

/** POST — Create a new grade scale */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // RBAC: Verify Coach or Admin privilege
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "coach" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Coaches and Admins only" }, { status: 403, headers: SECURITY_HEADERS });
    }

    const body = await request.json();
    const parsed = createGradeScaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid grade scale structure", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const scale = parsed.data;

    // If setting as default, unset other default scales for this coach first
    if (scale.is_default) {
      await supabase
        .from("grade_scales")
        .update({ is_default: false })
        .eq("coach_id", user.id);
    }

    const { data: newScale, error } = await supabase
      .from("grade_scales")
      .insert({
        coach_id: user.id,
        name: scale.name,
        is_default: scale.is_default,
        grades: scale.grades,
        passing_grade: scale.passing_grade
      })
      .select("*")
      .single();

    if (error) throw error;

    // Log Audit Event
    void logAuditEvent({
      userId: user.id,
      action: "grade_scale.create",
      resource: "grade_scale",
      resourceId: newScale.id,
      metadata: { name: scale.name }
    });

    return NextResponse.json({ success: true, scale: newScale }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Grade Scales POST Error]", err);
    return NextResponse.json({ error: err.message || "Failed to create grade scale" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
