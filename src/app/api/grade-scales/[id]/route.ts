// src/app/api/grade-scales/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGradeScaleSchema, updateGradeScaleSchema } from "@/lib/validation/schemas/enhanced-skills.schema";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/** PATCH — Update grade scale */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // Verify ownership
    const { data: oldScale } = await supabase
      .from("grade_scales")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!oldScale) {
      return NextResponse.json({ error: "Grade scale not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    if (oldScale.coach_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403, headers: SECURITY_HEADERS });
    }

    const body = await request.json();
    const parsed = updateGradeScaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid grade scale values", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const updates = parsed.data;

    if (updates.is_default) {
      // Set all other scales as non-default first
      await supabase
        .from("grade_scales")
        .update({ is_default: false })
        .eq("coach_id", user.id);
    }

    const { data: updatedScale, error } = await supabase
      .from("grade_scales")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    void logAuditEvent({
      userId: user.id,
      action: "grade_scale.update",
      resource: "grade_scale",
      resourceId: id,
      metadata: { previous: oldScale, updated: updatedScale }
    });

    return NextResponse.json({ success: true, scale: updatedScale }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Grade Scale PATCH Error]", err);
    return NextResponse.json({ error: err.message || "Failed to update grade scale" }, { status: 500, headers: SECURITY_HEADERS });
  }
}

/** DELETE — Delete grade scale */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // Verify ownership
    const { data: oldScale } = await supabase
      .from("grade_scales")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!oldScale) {
      return NextResponse.json({ error: "Grade scale not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    if (oldScale.coach_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403, headers: SECURITY_HEADERS });
    }

    // Verify if any active submissions are using it (soft-check / reference check)
    const { count: submissionUsageCount } = await supabase
      .from("graded_submissions")
      .select("id", { count: "exact", head: true })
      .eq("grade_scale_id", id);

    if (submissionUsageCount && submissionUsageCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete this scale. It is referenced by existing graded submissions." },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const { error } = await supabase
      .from("grade_scales")
      .delete()
      .eq("id", id);

    if (error) throw error;

    void logAuditEvent({
      userId: user.id,
      action: "grade_scale.delete",
      resource: "grade_scale",
      resourceId: id,
      metadata: { name: oldScale.name }
    });

    return NextResponse.json({ success: true }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    console.error("[Grade Scale DELETE Error]", err);
    return NextResponse.json({ error: err.message || "Failed to delete grade scale" }, { status: 500, headers: SECURITY_HEADERS });
  }
}
