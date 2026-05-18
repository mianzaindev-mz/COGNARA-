import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { IconUsers } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users — Admin — COGNARA™" };

const roleVariant: Record<string, "indigo" | "success" | "danger"> = { student: "indigo", coach: "success", admin: "danger" };
const statusVariant: Record<string, "success" | "danger" | "warning"> = { active: "success", banned: "danger", pending: "warning" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profiles, count } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_banned, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  const users = (profiles ?? []).map(p => ({
    name: p.full_name || p.email?.split("@")[0] || "User",
    email: p.email ?? "",
    role: p.role ?? "student",
    status: p.is_banned ? "banned" : "active",
    joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">User Management</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">{count ?? users.length} total users</p>
        </div>
      </section>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconUsers className="h-6 w-6" />
          <h2 className="text-lg font-bold text-cn-ink">No users yet</h2>
          <p className="mt-1 text-sm text-cn-ink-muted">Users will appear here when they register.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cn-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {users.map((u, i) => (
                  <tr key={i} className="transition-colors hover:bg-cn-canvas">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
                          {u.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-cn-ink">{u.name}</p>
                          <p className="text-xs text-cn-ink-subtle">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Badge variant={roleVariant[u.role] || "default"}>{u.role}</Badge></td>
                    <td className="px-4 py-3.5"><Badge variant={statusVariant[u.status] || "default"} dot>{u.status}</Badge></td>
                    <td className="px-4 py-3.5 text-xs text-cn-ink-muted">{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
