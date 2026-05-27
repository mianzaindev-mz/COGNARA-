/**
 * Agent Jobs — persistent background task queue.
 * Jobs survive browser close and store results for later retrieval.
 *
 * Uses Supabase `agent_jobs` table with states:
 * pending → running → completed | failed
 */

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface AgentJob {
  id: string;
  user_id: string;
  skill: string;
  prompt: string;
  status: JobStatus;
  priority: "low" | "normal" | "high";
  result: string | null;
  error: string | null;
  context: Record<string, unknown>;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Create a new background job.
 * The job is stored in Supabase and can be polled or processed by a worker.
 */
export async function createJob(params: {
  userId: string;
  skill: string;
  prompt: string;
  priority?: "low" | "normal" | "high";
  context?: Record<string, unknown>;
}): Promise<AgentJob | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("agent_jobs")
      .insert({
        user_id: params.userId,
        skill: params.skill,
        prompt: params.prompt,
        status: "pending" as JobStatus,
        priority: params.priority ?? "normal",
        context: params.context ?? {},
      })
      .select()
      .single();

    if (error) {
      console.error("[agent-jobs] Create error:", error.message);
      return null;
    }

    return data as AgentJob;
  } catch (err) {
    console.error("[agent-jobs] Create exception:", err);
    return null;
  }
}

/**
 * Get all jobs for a user, ordered by creation time (newest first).
 */
export async function getUserJobs(
  userId: string,
  limit = 20,
): Promise<AgentJob[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("agent_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[agent-jobs] List error:", error.message);
      return [];
    }

    return (data ?? []) as AgentJob[];
  } catch {
    return [];
  }
}

/**
 * Get a single job by ID (with user ownership check).
 */
export async function getJob(
  jobId: string,
  userId: string,
): Promise<AgentJob | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("agent_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as AgentJob;
  } catch {
    return null;
  }
}

/**
 * Update a job's status and optionally set result/error.
 */
export async function updateJobStatus(
  jobId: string,
  updates: {
    status: JobStatus;
    result?: string;
    error?: string;
    started_at?: string;
    completed_at?: string;
  },
): Promise<boolean> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase
      .from("agent_jobs")
      .update(updates)
      .eq("id", jobId);

    return !error;
  } catch {
    return false;
  }
}
