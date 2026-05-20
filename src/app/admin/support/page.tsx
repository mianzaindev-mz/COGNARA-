import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { IconTicket } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support — Admin — COGNARA™" };

const statusMap: Record<string, "danger" | "warning" | "success" | "indigo" | "default"> = { open: "danger", in_progress: "warning", ai_resolved: "indigo", resolved: "success", closed: "default" };
const statusLabel: Record<string, string> = { open: "Open", in_progress: "In progress", ai_resolved: "AI resolved", resolved: "Resolved", closed: "Closed" };

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, created_at, profiles!support_tickets_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = ((tickets ?? []) as unknown) as Array<{
    id: string;
    subject: string;
    category: string;
    status: string;
    created_at: string;
    profiles: { full_name: string | null; email: string | null } | null;
  }>;

  const openCount = list.filter(t => t.status === "open").length;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support Tickets</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">{openCount} open · {list.length} total</p>
      </section>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconTicket className="h-6 w-6" />
          <h2 className="text-lg font-bold text-cn-ink">No tickets yet</h2>
          <p className="mt-1 text-sm text-cn-ink-muted">Support tickets from students and coaches will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cn-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {list.map(t => {
                  const profile = t.profiles;
                  const ago = Math.round((Date.now() - new Date(t.created_at).getTime()) / 3600000);
                  const timeStr = ago < 1 ? "Just now" : ago < 24 ? `${ago}h ago` : `${Math.round(ago / 24)}d ago`;
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-cn-canvas">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-cn-ink truncate max-w-[260px]">{t.subject}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-cn-ink-muted">{profile?.email ?? "Unknown"}</td>
                      <td className="px-4 py-3.5"><Badge variant="default" size="sm">{t.category}</Badge></td>
                      <td className="px-4 py-3.5"><Badge variant={statusMap[t.status] ?? "default"} size="sm" dot>{statusLabel[t.status] ?? t.status}</Badge></td>
                      <td className="px-4 py-3.5 text-xs text-cn-ink-subtle">{timeStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
