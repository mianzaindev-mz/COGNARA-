/**
 * Lightweight audit logging for API routes.
 * Inserts into the `audit_logs` table. Fire-and-forget — never throws.
 */

type AuditParams = {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Log an action to the audit trail. This is fire-and-forget:
 * failures are silently ignored in production, logged in development.
 */
export async function logAuditEvent(params: AuditParams): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await supabase.from("audit_logs").insert({
      user_id: params.userId,
      action: params.action,
      resource: params.resource ?? null,
      resource_id: params.resourceId ?? null,
      metadata: params.metadata ?? {},
      created_at: new Date().toISOString(),
    });
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUDIT] ${params.action} | user=${params.userId.slice(0, 8)} | resource=${params.resource ?? "—"}`);
    }
  }
}
