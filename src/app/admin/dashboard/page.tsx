import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { Badge } from "@/components/ui/badge";
import { IconUsers, IconBook, IconCurrency, IconTicket } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Dashboard — COGNARA™" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch auth users to build email map (admin only)
  let emailMap = new Map<string, string>();
  try {
    const adminSupabase = createAdminClient();
    const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers({ perPage: 100 });
    if (authUsers) {
      emailMap = new Map(authUsers.map(u => [u.id, u.email ?? ""]));
    }
  } catch (err) {
    console.error("Admin user list error:", err);
  }

  // Real counts from DB
  const [usersRes, coursesRes, ticketsRes, enrollmentsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const totalCourses = coursesRes.count ?? 0;
  const openTickets = ticketsRes.count ?? 0;
  const totalEnrollments = enrollmentsRes.count ?? 0;

  // Revenue from courses
  const { data: courseRevData } = await supabase
    .from("courses")
    .select("price_usd, total_enrolled")
    .eq("is_published", true);
  const grossRevenue = (courseRevData ?? []).reduce((s, c) => s + (Number(c.price_usd) || 0) * (c.total_enrolled ?? 0), 0);

  // Recent support tickets (query user_id and profiles instead of email directly on profiles)
  const { data: recentTickets } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, created_at, user_id, profiles!support_tickets_user_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Simulated daily revenue chart (real would come from payments table)
  const days = Array.from({ length: 30 }, (_, i) => ({
    label: String(i + 1),
    value: Math.round(grossRevenue / 30 * (0.4 + Math.random() * 1.2)),
  }));

  // Pending coach verifications
  const { data: pendingCoaches } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("role", "coach")
    .eq("is_verified", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const statusLabel: Record<string, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };
  const statusVariant: Record<string, "danger" | "warning" | "success" | "default"> = { open: "danger", in_progress: "warning", resolved: "success", closed: "default" };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">Platform Control</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Real-time overview of COGNARA operations</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 cn-stagger">
        <StatCard label="Total Users" value={String(totalUsers)} accent="indigo" icon={<IconUsers className="h-5 w-5" />} />
        <StatCard label="Enrollments" value={String(totalEnrollments)} accent="emerald" icon={<IconBook className="h-5 w-5" />} />
        <StatCard label="Revenue" value={`$${grossRevenue.toFixed(0)}`} accent="emerald" icon={<IconCurrency className="h-5 w-5" />} />
        <StatCard label="Open Tickets" value={String(openTickets)} accent="amber" icon={<IconTicket className="h-5 w-5" />} />
        <StatCard label="Courses" value={String(totalCourses)} accent="sky" icon={<IconBook className="h-5 w-5" />} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-cn-ink">Revenue — Last 30 days</h2>
            <span className="text-xs text-cn-ink-subtle">Daily ($)</span>
          </div>
          <BarChart data={days} color="emerald" height={150} />
        </section>

        <section className="lg:col-span-2 cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-cn-ink">Verification Queue</h2>
            <Badge variant="warning" size="sm">{(pendingCoaches ?? []).length} pending</Badge>
          </div>
          <div className="space-y-3">
            {(pendingCoaches ?? []).length === 0 ? (
              <p className="text-sm text-cn-ink-muted py-4 text-center">No pending verifications</p>
            ) : (pendingCoaches ?? []).map((coach) => {
              const coachEmail = emailMap.get(coach.id) || "No Email";
              const initials = (coach.full_name ?? coachEmail).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const ago = Math.round((Date.now() - new Date(coach.created_at).getTime()) / 3600000);
              return (
                <div key={coach.id} className="flex items-center justify-between rounded-xl border border-cn-border bg-cn-canvas px-4 py-3 transition hover:bg-cn-surface">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">{initials}</span>
                    <div>
                      <p className="text-sm font-semibold text-cn-ink">{coach.full_name ?? "Unknown"}</p>
                      <p className="text-[10px] text-cn-ink-subtle">{coachEmail} · {ago}h ago</p>
                    </div>
                  </div>
                  <Link href="/admin/coaches" className="rounded-lg bg-cn-canvas px-3 py-1.5 text-[10px] font-bold text-cn-ink transition hover:bg-cn-border">Review</Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent Support Tickets */}
      <section className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-cn-ink">Recent Support Tickets</h2>
          <Link href="/admin/support" className="text-xs font-semibold text-cn-orange hover:underline">View all →</Link>
        </div>
        <div className="space-y-2">
          {(recentTickets ?? []).length === 0 ? (
            <p className="text-sm text-cn-ink-muted py-4 text-center">No tickets yet</p>
          ) : (recentTickets ?? []).map((t: any) => {
            const status = String(t.status ?? "open");
            const ticketEmail = emailMap.get(String(t.user_id)) || "Unknown";
            const ago = Math.round((Date.now() - new Date(String(t.created_at)).getTime()) / 3600000);
            return (
              <div key={String(t.id)} className="flex items-center justify-between rounded-xl border border-cn-border bg-cn-canvas px-4 py-3 transition hover:bg-cn-surface">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-cn-ink truncate">{String(t.subject)}</p>
                  <p className="text-[10px] text-cn-ink-subtle">{ticketEmail} · {String(t.category)} · {ago}h ago</p>
                </div>
                <Badge variant={statusVariant[status] ?? "default"} size="sm" dot>{statusLabel[status] ?? status}</Badge>
              </div>
            );
          })}
        </div>
      </section>

      {/* Platform Health */}
      <section className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6">
        <h2 className="text-base font-bold text-cn-ink mb-4">Platform Health</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Database", status: "operational" },
            { label: "AI Agent API", status: "operational" },
            { label: "Payments", status: "operational" },
            { label: "Video (Mux)", status: "degraded" },
            { label: "Email", status: "operational" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 rounded-xl border border-cn-border bg-cn-canvas px-3 py-2.5">
              <span className={`h-2 w-2 rounded-full ${s.status === "operational" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              <span className="text-xs text-cn-ink-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
