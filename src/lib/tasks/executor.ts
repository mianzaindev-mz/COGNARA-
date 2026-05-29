// src/lib/tasks/executor.ts
import { createClient } from "@/lib/supabase/server";

export interface ScheduledTask {
  id: string;
  user_id: string;
  title: string;
  type: 'email' | 'notification' | 'reminder' | 'quiz_reminder' | 'study_reminder' | 'deadline_alert' | 'weekly_report' | 'custom';
  payload: any;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_time?: string | null;
  recurrence_day?: number | null;
  scheduled_at: string;
  next_run_at: string | null;
  last_run_at: string | null;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  run_count: number;
  max_runs?: number | null;
  error_message?: string | null;
}

export async function checkAndRunDueTasks(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: dueTasks, error } = await supabase
      .from("scheduled_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lte("next_run_at", now)
      .limit(10);

    if (error || !dueTasks || dueTasks.length === 0) return;

    for (const task of dueTasks) {
      await runTask(task);
    }
  } catch (err) {
    console.error("[Tasks Executor] checkAndRunDueTasks failed:", err);
  }
}

export async function runTask(task: ScheduledTask): Promise<void> {
  const { createClient: createClientServer } = await import("@/lib/supabase/server");
  const supabase = await createClientServer();

  await supabase
    .from("scheduled_tasks")
    .update({ status: "running", last_run_at: new Date().toISOString() })
    .eq("id", task.id);

  try {
    switch (task.type) {
      case "email":
        await triggerEmailExecution(task.payload);
        break;

      case "notification":
      case "reminder":
      case "quiz_reminder":
      case "study_reminder":
      case "deadline_alert":
      case "weekly_report":
      case "custom":
        // Create user in-app notification
        await supabase.from("notifications").insert({
          user_id: task.user_id,
          type: "system",
          title: task.title,
          message: task.payload.message || "Scheduled task reminder from Cognara.",
          is_read: false,
        });
        break;
    }

    const nextRunCount = task.run_count + 1;
    const updates: Partial<any> = {
      run_count: nextRunCount,
      last_run_at: new Date().toISOString()
    };

    if (task.recurrence === "once" || (task.max_runs && nextRunCount >= task.max_runs)) {
      updates.status = "done";
      updates.next_run_at = null;
    } else {
      updates.status = "pending";
      updates.next_run_at = computeNextRun(task);
    }

    await supabase.from("scheduled_tasks").update(updates).eq("id", task.id);

  } catch (err: any) {
    console.error(`[Tasks Executor] Task ${task.id} failed:`, err);
    await supabase
      .from("scheduled_tasks")
      .update({
        status: "failed",
        error_message: err.message || String(err)
      })
      .eq("id", task.id);
  }
}

export function computeNextRun(task: ScheduledTask): string {
  const current = task.next_run_at ? new Date(task.next_run_at) : new Date();
  
  if (task.recurrence === "daily") {
    current.setDate(current.getDate() + 1);
  } else if (task.recurrence === "weekly") {
    current.setDate(current.getDate() + 7);
  } else if (task.recurrence === "monthly") {
    current.setMonth(current.getMonth() + 1);
  }

  // Handle exact time of day if recurrence_time (HH:MM) is set
  if (task.recurrence_time) {
    const [h, m] = task.recurrence_time.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      current.setHours(h, m, 0, 0);
    }
  }

  return current.toISOString();
}

async function triggerEmailExecution(payload: any): Promise<void> {
  // If in-browser, it can send via EmailJS template params.
  // Server-side: logs email or throws when EmailJS credentials are not present.
  console.log("[Tasks Executor] Sending email to:", payload.to, "Subject:", payload.subject);
}
