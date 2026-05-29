import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/** GET — Fetch a single report (reporter or admin only) */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // Fetch user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    const { data: report, error } = await supabase
      .from("bug_reports")
      .select(`
        *,
        reporter:reporter_id (
          full_name,
          username
        ),
        reported:reported_user_id (
          full_name,
          username
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404, headers: SECURITY_HEADERS });
    }

    // Access control: only reporter or admin
    if (!isAdmin && report.reporter_id !== user.id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403, headers: SECURITY_HEADERS });
    }

    return NextResponse.json({ report }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    const message = err.message || "Failed to retrieve report";
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}

/** PATCH — Update report status (admin only) */
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

    // RBAC: Verify Admin privilege
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403, headers: SECURITY_HEADERS });
    }

    const body = await request.json();
    const { status, assigned_to, resolution_note, priority, ai_severity_override } = body;

    // Fetch report state before changes for comparative audit log
    const { data: oldReport } = await supabase
      .from("bug_reports")
      .select("status, assigned_to, priority, ai_severity")
      .eq("id", id)
      .maybeSingle();

    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (resolution_note !== undefined) {
      updates.resolution_note = resolution_note;
      updates.resolved_by = user.id;
      updates.resolved_at = new Date().toISOString();
    }
    if (priority !== undefined) updates.priority = priority;
    if (ai_severity_override !== undefined) updates.ai_severity = ai_severity_override;

    updates.updated_at = new Date().toISOString();

    const { data: updatedReport, error } = await supabase
      .from("bug_reports")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    // 19. Audit Trail Logging for Admin action
    void logAuditEvent({
      userId: user.id,
      action: "report.update",
      resource: "report",
      resourceId: id,
      metadata: {
        previous: oldReport,
        updated: {
          status: updatedReport.status,
          assigned_to: updatedReport.assigned_to,
          priority: updatedReport.priority,
          ai_severity: updatedReport.ai_severity,
        },
      },
    });

    // Notify student on state changes
    if (status !== undefined && updatedReport.reporter_id) {
      await supabase.from("notifications").insert({
        user_id: updatedReport.reporter_id,
        type: "system",
        title: `Report Status Updated: ${status.replace("_", " ")}`,
        message: `Your report regarding "${updatedReport.title}" has been set to ${status.replace("_", " ")}.`,
        is_read: false,
      });
    }

    return NextResponse.json({ success: true, report: updatedReport }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    const message = err.message || "Failed to update report";
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}
