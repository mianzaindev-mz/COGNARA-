import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_HEADERS, sanitizeMessage } from "@/lib/security/sanitize";

const jobSchema = z.object({
  skill: z.enum(["teach", "debug", "quiz", "voice", "path", "support", "verify", "coach", "admin"]),
  prompt: z.string().min(1).max(10000),
  audience: z.enum(["student", "coach", "admin"]).default("student"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  runAfter: z.string().datetime().optional(),
  context: z.record(z.unknown()).optional(),
});

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
      .select("id, status, run_after")
      .single();

    if (error) throw error;
    return NextResponse.json({ job: data }, { headers: SECURITY_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create agent job";
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS });
  }
}
