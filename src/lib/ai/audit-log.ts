/**
 * AI Agent Audit Logging — records every agent interaction for
 * security monitoring, analytics, and anomaly detection.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuditEntry {
  user_id: string;
  skill: string;
  input_length: number;
  output_length: number;
  credits_used: number;
  status: "success" | "error" | "blocked" | "rate_limited";
  flags: string[];
  duration_ms: number;
}

// ─── In-memory tracking for anomaly detection ───────────────────────────────

interface UserActivity {
  timestamps: number[];
  inputLengths: number[];
}

const recentActivity = new Map<string, UserActivity>();

/** Keep only the last 5 minutes of data */
function trimActivity(activity: UserActivity) {
  const cutoff = Date.now() - 5 * 60_000;
  const startIdx = activity.timestamps.findIndex((t) => t > cutoff);
  if (startIdx > 0) {
    activity.timestamps = activity.timestamps.slice(startIdx);
    activity.inputLengths = activity.inputLengths.slice(startIdx);
  } else if (startIdx === -1) {
    activity.timestamps = [];
    activity.inputLengths = [];
  }
}

// ─── Log Agent Action ───────────────────────────────────────────────────────

/**
 * Log an agent interaction to the audit trail.
 * Attempts to insert into Supabase `agent_audit_log` table.
 * Falls back to console logging if Supabase is unavailable.
 * This function is fire-and-forget — callers should not await it.
 */
export async function logAgentAction(entry: AuditEntry): Promise<void> {
  // Track in-memory for anomaly detection
  const activity = recentActivity.get(entry.user_id) ?? {
    timestamps: [],
    inputLengths: [],
  };
  activity.timestamps.push(Date.now());
  activity.inputLengths.push(entry.input_length);
  trimActivity(activity);
  recentActivity.set(entry.user_id, activity);

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await supabase.from("audit_logs").insert({
      user_id: entry.user_id,
      action: `agent.${entry.skill}`,
      resource: "agent",
      metadata: {
        skill: entry.skill,
        input_length: entry.input_length,
        output_length: entry.output_length,
        credits_used: entry.credits_used,
        status: entry.status,
        flags: entry.flags,
        duration_ms: entry.duration_ms,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Supabase not configured or table doesn't exist — log in dev only
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[AUDIT] ${entry.status} | user=${entry.user_id.slice(0, 8)} | skill=${entry.skill} | credits=${entry.credits_used} | ${entry.duration_ms}ms${
          entry.flags.length > 0 ? ` | flags=${entry.flags.join(",")}` : ""
        }`,
      );
    }
  }
}

// ─── Anomaly Detection ──────────────────────────────────────────────────────

/**
 * Check if a user's recent activity is anomalous.
 * Looks at request rate and average input length over the last 5 minutes.
 */
export function checkAnomaly(userId: string): {
  suspicious: boolean;
  reason?: string;
} {
  const activity = recentActivity.get(userId);
  if (!activity || activity.timestamps.length === 0) {
    return { suspicious: false };
  }

  trimActivity(activity);

  // Flag 1: Too many requests in 5 minutes
  if (activity.timestamps.length > 20) {
    return {
      suspicious: true,
      reason: `High request rate: ${activity.timestamps.length} requests in 5 minutes`,
    };
  }

  // Flag 2: Unusually long average input
  if (activity.inputLengths.length > 3) {
    const avg =
      activity.inputLengths.reduce((s, l) => s + l, 0) /
      activity.inputLengths.length;
    if (avg > 2000) {
      return {
        suspicious: true,
        reason: `Unusually long inputs: average ${Math.round(avg)} chars`,
      };
    }
  }

  // Flag 3: Rapid-fire requests (< 1 second apart, 5+ times)
  let rapidCount = 0;
  for (let i = 1; i < activity.timestamps.length; i++) {
    if (activity.timestamps[i] - activity.timestamps[i - 1] < 1000) {
      rapidCount++;
    }
  }
  if (rapidCount >= 5) {
    return {
      suspicious: true,
      reason: `Rapid-fire requests: ${rapidCount} requests under 1 second apart`,
    };
  }

  return { suspicious: false };
}
