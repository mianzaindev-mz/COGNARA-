import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routeAgentRequest, type AgentSkill } from "@/lib/ai/master-agent";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";

export async function POST(request: NextRequest) {
  const secret = process.env.AGENT_WORKER_SECRET || process.env.CRON_SECRET;
  const provided = request.headers.get("x-agent-worker-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
  }

  try {
    const supabase = createAdminClient();
    const { data: jobs, error } = await supabase
      .from("agent_jobs")
      .select("id, user_id, skill, prompt, audience, context")
      .eq("status", "queued")
      .lte("run_after", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) throw error;

    const processed = [];

    for (const job of jobs ?? []) {
      await supabase
        .from("agent_jobs")
        .update({ status: "running", started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", job.id);

      try {
        const result = await routeAgentRequest({
          studentId: job.user_id ?? "background-agent",
          skill: job.skill as AgentSkill,
          message: job.prompt,
          context: {
            ...(typeof job.context === "object" && job.context ? job.context : {}),
            current_page: "background_agent_job",
            audience: job.audience,
          },
        });

        await supabase
          .from("agent_jobs")
          .update({
            status: "completed",
            result: {
              content: result.response.content,
              skill: result.skill,
              creditsUsed: result.creditsUsed,
              memoryUpdated: result.memoryUpdated,
            },
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        processed.push({ id: job.id, status: "completed" });
      } catch (err) {
        await supabase
          .from("agent_jobs")
          .update({
            status: "failed",
            error: err instanceof Error ? err.message : "Agent job failed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        processed.push({ id: job.id, status: "failed" });
      }
    }

    return NextResponse.json({ processed }, { headers: SECURITY_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Worker failed";
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}
