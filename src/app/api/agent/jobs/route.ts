import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_HEADERS, sanitizeMessage } from "@/lib/security/sanitize";

const jobSchema = z.object({
  skill: z.enum([
    "teach", "debug", "quiz", "voice", "path", "support", "verify",
    "coach", "admin", "flashcard", "challenge", "eli5",
    "generate_course", "summarize", "progress_report", "search_courses",
  ]),
  prompt: z.string().min(1).max(10000),
  audience: z.enum(["student", "coach", "admin"]).default("student"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  runAfter: z.string().datetime().optional(),
  context: z.record(z.unknown()).optional(),
});

/** POST — Create a new background job */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    const parsed = jobSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid job", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    const job = parsed.data;
    const { data, error } = await supabase
      .from("agent_jobs")
      .insert({
        user_id: user.id,
        skill: job.skill,
        prompt: sanitizeMessage(job.prompt, 10000),
        audience: job.audience,
        priority: job.priority,
        context: job.context ?? {},
        run_after: job.runAfter ?? new Date().toISOString(),
      })
      .select("id, status, skill, run_after, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ job: data }, { headers: SECURITY_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create agent job";
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}

/** GET — List user's jobs (latest 20) */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    const { data: jobs, error } = await supabase
      .from("agent_jobs")
      .select("id, skill, status, priority, created_at, completed_at, result, error")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({
      jobs: jobs ?? [],
      count: jobs?.length ?? 0,
    }, { headers: SECURITY_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not list jobs";
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}
