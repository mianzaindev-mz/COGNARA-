import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Support — Admin — COGNARA™" };

const tickets = [
  { id: "TKT-0047", subject: "Cannot access purchased course", user: "ahmed@example.com", category: "technical", priority: "high", status: "open", created: "1h ago" },
  { id: "TKT-0046", subject: "Refund request for React course", user: "sara@example.com", category: "billing", priority: "normal", status: "in_progress", created: "3h ago" },
  { id: "TKT-0045", subject: "Coach impersonation report", user: "fatima@example.com", category: "abuse_report", priority: "urgent", status: "open", created: "5h ago" },
  { id: "TKT-0044", subject: "Password reset not working", user: "usman@example.com", category: "account", priority: "normal", status: "ai_resolved", created: "1d ago" },
  { id: "TKT-0043", subject: "Course video not loading", user: "bilal@example.com", category: "technical", priority: "low", status: "resolved", created: "2d ago" },
];

const priorityVariant: Record<string, "danger" | "warning" | "default" | "info"> = { urgent: "danger", high: "warning", normal: "default", low: "info" };
const statusVariant: Record<string, "danger" | "warning" | "success" | "indigo" | "default"> = { open: "danger", in_progress: "warning", ai_resolved: "indigo", resolved: "success", closed: "default" };

export default function AdminSupportPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support Tickets</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">{tickets.filter(t => t.status === "open").length} open · {tickets.length} total</p>
      </section>

      <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cn-border">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cn-border">
              {tickets.map(t => (
                <tr key={t.id} className="transition-colors hover:bg-cn-canvas cursor-pointer">
                  <td className="px-5 py-3.5 font-mono text-xs text-indigo-400">{t.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-cn-ink">{t.subject}</p>
                    <p className="text-xs text-cn-ink-subtle">{t.user} · {t.category}</p>
                  </td>
                  <td className="px-4 py-3.5"><Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge></td>
                  <td className="px-4 py-3.5"><Badge variant={statusVariant[t.status] || "default"} dot>{t.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3.5 text-xs text-cn-ink-subtle">{t.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
