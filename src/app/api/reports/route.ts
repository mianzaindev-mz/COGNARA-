import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReportSchema } from "@/lib/validation/schemas/enhanced-skills.schema";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { SECURITY_HEADERS, sanitizeMessage } from "@/lib/security/sanitize";
import { logAuditEvent } from "@/lib/security/audit";
import { evaluateReport } from "@/lib/ai/agents/bug-eval-agent";

/** POST — Submit a new bug / abuse report */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting by IP (10/hour is standard, using general or custom)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip, { maxRequests: 10, windowMs: 3600_000, prefix: "reports" });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "You have submitted too many reports recently. Please wait." },
        { status: 429, headers: SECURITY_HEADERS }
      );
    }

    // 2. Validate session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report data", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const report = parsed.data;

    // 3. User Identification
    const reporterId = user?.id || null;

    // 4. Save to database
    const { data: newReport, error } = await supabase
      .from("bug_reports")
      .insert({
        reporter_id: reporterId,
        category: report.category,
        title: report.title,
        description: sanitizeMessage(report.description, 5000),
        page_url: report.page_url,
        page_route: report.page_route,
        dom_selector: report.dom_selector,
        video_timestamp_secs: report.video_timestamp_secs,
        lesson_id: report.lesson_id,
        course_id: report.course_id,
        reported_user_id: report.reported_user_id,
        screenshot_path: report.screenshot_path,
        browser_info: report.browser_info || {},
        reproduction_steps: report.reproduction_steps ? sanitizeMessage(report.reproduction_steps, 2000) : null,
      })
      .select("id")
      .single();

    if (error) throw error;

    // 5. Trigger AI evaluation pipeline asynchronously in a background promise
    if (newReport) {
      // Fire-and-forget: Evaluate report in background using Groq
      evaluateReport(newReport.id).catch((err) => {
        console.error("[Triage Worker Error]", err);
      });

      // Log Audit Event
      if (reporterId) {
        void logAuditEvent({
          userId: reporterId,
          action: "report.submit",
          resource: "report",
          resourceId: newReport.id,
          metadata: { category: report.category, title: report.title },
        });
      }
    }

    return NextResponse.json({ success: true, reportId: newReport.id }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    const message = err.message || "Failed to submit report";
    console.error("[Reports API POST Error]", err);
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}

/** GET — Retrieve bug reports (reporter retrieves own; admin retrieves all) */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const severity = url.searchParams.get("severity");
    const validity = url.searchParams.get("validity");
    const status = url.searchParams.get("status");

    let query = supabase.from("bug_reports").select("*");

    if (!isAdmin) {
      // Students only see reports they submitted
      query = query.eq("reporter_id", user.id);
    } else {
      // Admins can filter
      if (category) query = query.eq("category", category);
      if (severity) query = query.eq("ai_severity", severity);
      if (validity) query = query.eq("ai_validity", validity);
      if (status) query = query.eq("status", status);
    }

    const { data: reports, error } = await query
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ reports: reports || [] }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    const message = err.message || "Failed to list reports";
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}
