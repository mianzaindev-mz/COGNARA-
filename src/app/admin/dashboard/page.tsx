import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarChart } from "@/components/ui/chart-bar";
import { AdminInteractiveEffects } from "@/components/admin/interactive-effects";

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
  const grossRevenue = (courseRevData ?? []).reduce((s: number, c: any) => s + (Number(c.price_usd) || 0) * (c.total_enrolled ?? 0), 0);

  // Recent support tickets
  const { data: recentTickets } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, created_at, user_id, profiles!support_tickets_user_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Simulated daily revenue chart
  const days = Array.from({ length: 30 }, (_, i) => ({
    label: String(i + 1).padStart(2, "0"),
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

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex flex-col gap-3 animate-float-up">
        <div className="flex items-center gap-4">
          <div className="h-[1px] w-12 bg-[#dc143c]/60"></div>
          <span className="text-[#dc143c] font-label-caps text-[10px] tracking-[0.4em] uppercase font-bold">Operational Overview</span>
        </div>
        <h2 className="font-headline-lg text-5xl text-[var(--admin-card-text-primary)] tracking-tight">Control Center</h2>
        <p className="text-[var(--admin-card-text-muted)] font-body-lg max-w-2xl">Real-time telemetry and architectural monitoring for the core ecosystem.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Metric Card 1: Users */}
        <div className="glass-card rounded-3xl p-8 animate-float-up stagger-1">
          <div className="flex justify-between items-start mb-10">
            <span className="font-label-caps text-[10px] text-[var(--admin-card-text-subtle)] tracking-[0.2em] uppercase font-bold">Total Users</span>
            <span className="material-symbols-outlined text-indigo-500/50 dark:text-indigo-400/50">group</span>
          </div>
          <div className="baseline-align gap-2">
            <div className="font-display-lg text-4xl text-[var(--admin-card-text-primary)]">
              {totalUsers >= 1000 ? `${(totalUsers / 1000).toFixed(1)}k` : totalUsers}
            </div>
            <div className="text-[10px] text-[var(--admin-teal)] font-bold tracking-wider">+12%</div>
          </div>
        </div>

        {/* Metric Card 2: Enrollments */}
        <div className="glass-card rounded-3xl p-8 animate-float-up stagger-2">
          <div className="flex justify-between items-start mb-10">
            <span className="font-label-caps text-[10px] text-[var(--admin-card-text-subtle)] tracking-[0.2em] uppercase font-bold">Enrollments</span>
            <span className="material-symbols-outlined text-teal-600/50 dark:text-teal-400/50">school</span>
          </div>
          <div className="baseline-align gap-2">
            <div className="font-display-lg text-4xl text-[var(--admin-card-text-primary)]">
              {totalEnrollments}
            </div>
            <div className="text-[10px] text-[var(--admin-teal)] font-bold tracking-wider">NEW</div>
          </div>
        </div>

        {/* Metric Card 3: Revenue */}
        <div className="glass-card rounded-3xl p-8 animate-float-up stagger-3 bg-[#dc143c]/[0.02] dark:bg-[#dc143c]/[0.03] border-[#dc143c]/10 dark:border-[#dc143c]/15">
          <div className="flex justify-between items-start mb-10">
            <span className="font-label-caps text-[10px] text-[#dc143c]/80 dark:text-[#dc143c]/60 tracking-[0.2em] uppercase font-bold">Revenue</span>
            <span className="material-symbols-outlined text-[#dc143c]/80 dark:text-[#dc143c]/60">payments</span>
          </div>
          <div className="baseline-align gap-2">
            <div className="font-display-lg text-4xl text-[var(--admin-card-text-primary)]">
              ${grossRevenue >= 1000 ? `${(grossRevenue / 1000).toFixed(1)}k` : grossRevenue.toFixed(0)}
            </div>
            <div className="text-[10px] text-[#dc143c] font-bold tracking-wider">LIVE</div>
          </div>
        </div>

        {/* Metric Card 4: Tickets */}
        <div className="glass-card rounded-3xl p-8 animate-float-up stagger-4">
          <div className="flex justify-between items-start mb-10">
            <span className="font-label-caps text-[10px] text-[var(--admin-card-text-subtle)] tracking-[0.2em] uppercase font-bold">Tickets</span>
            <span className="material-symbols-outlined text-amber-600/50 dark:text-amber-400/50">support_agent</span>
          </div>
          <div className="baseline-align gap-2">
            <div className="font-display-lg text-4xl text-[var(--admin-card-text-primary)]">
              {openTickets}
            </div>
            <div className={`text-[10px] ${openTickets > 0 ? "text-[var(--admin-amber)]" : "text-[var(--admin-teal)]"} font-bold tracking-wider`}>
              {openTickets > 0 ? "URGENT" : "STABLE"}
            </div>
          </div>
        </div>

        {/* Metric Card 5: Courses */}
        <div className="glass-card rounded-3xl p-8 animate-float-up stagger-5">
          <div className="flex justify-between items-start mb-10">
            <span className="font-label-caps text-[10px] text-[var(--admin-card-text-subtle)] tracking-[0.2em] uppercase font-bold">Courses</span>
            <span className="material-symbols-outlined text-fuchsia-500/50 dark:text-fuchsia-400/50">auto_stories</span>
          </div>
          <div className="baseline-align gap-2">
            <div className="font-display-lg text-4xl text-[var(--admin-card-text-primary)]">
              {totalCourses}
            </div>
            <div className="text-[10px] text-[var(--admin-card-text-subtle)] font-bold tracking-wider">STABLE</div>
          </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Revenue Growth Chart Card */}
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-10 flex flex-col h-[520px] animate-float-up stagger-2">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-2xl font-bold text-[var(--admin-card-text-primary)] tracking-tight">Revenue Growth</h3>
              <p className="text-sm text-[var(--admin-card-text-subtle)] mt-1">Operational performance metrics</p>
            </div>
            <div className="flex bg-[var(--admin-card-text-primary)]/[0.04] p-1 rounded-full border border-[var(--admin-border)]">
              <button className="px-6 py-2 rounded-full text-[10px] font-bold tracking-widest text-[var(--admin-card-text-muted)] hover:text-[var(--admin-card-text-primary)] transition-colors cursor-pointer">WEEKLY</button>
              <button className="px-6 py-2 rounded-full text-[10px] font-bold tracking-widest bg-[#dc143c] text-white shadow-md shadow-[#dc143c]/10 dark:shadow-[#dc143c]/20 cursor-pointer">MONTHLY</button>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <BarChart data={days} color="emerald" height={260} showValues={false} />
          </div>
          <div className="flex justify-between mt-8">
            <span className="text-[10px] text-[var(--admin-card-text-subtle)]/60 font-data-mono tracking-widest uppercase">Day 01</span>
            <span className="text-[10px] text-[var(--admin-card-text-subtle)]/60 font-data-mono tracking-widest uppercase">Day 15</span>
            <span className="text-[10px] text-[var(--admin-card-text-subtle)]/60 font-data-mono tracking-widest uppercase">Day 30</span>
          </div>
        </div>

        {/* Compliance verifications card */}
        <div className="glass-card rounded-[2.5rem] p-10 flex flex-col h-[520px] animate-float-up stagger-3 border-amber-500/5">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-bold text-[var(--admin-card-text-primary)] tracking-tight">Compliance</h3>
            <div className="text-[10px] font-bold text-[var(--admin-amber)] bg-[var(--admin-amber)]/10 px-3 py-1 rounded-full border border-[var(--admin-amber)]/15 tracking-widest uppercase">
              {(Array.isArray(pendingCoaches) ? pendingCoaches : []).length} Pending
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
            {(Array.isArray(pendingCoaches) ? pendingCoaches : []).length === 0 ? (
              <p className="text-sm text-[var(--admin-card-text-subtle)] py-8 text-center">No pending verifications</p>
            ) : (
              (Array.isArray(pendingCoaches) ? pendingCoaches : []).map((coach: any) => {
                const coachEmail = emailMap.get(coach.id) || "No Email";
                const initials = (coach.full_name ?? coachEmail)
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const ago = Math.round((Date.now() - new Date(coach.created_at).getTime()) / 3600000);
                return (
                  <div key={coach.id} className="p-6 rounded-2xl bg-[var(--admin-card-text-primary)]/[0.02] border border-[var(--admin-border)] hover:border-[var(--admin-amber)]/30 hover:bg-[var(--admin-card-text-primary)]/[0.04] transition-all cursor-pointer flex items-center gap-5 group/item">
                    <div className="w-10 h-10 rounded-xl bg-[var(--admin-card-text-primary)]/[0.06] border border-[var(--admin-border)] flex items-center justify-center group-hover/item:scale-110 transition-transform text-xs font-bold text-[var(--admin-amber)]">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[var(--admin-card-text-primary)]">{coach.full_name ?? "Unknown Coach"}</div>
                      <div className="text-[10px] text-[var(--admin-card-text-subtle)] tracking-wider font-bold uppercase mt-1">
                        Coach Verification · {ago}h ago
                      </div>
                    </div>
                    <Link href="/admin/coaches" className="material-symbols-outlined text-[var(--admin-card-text-subtle)]/30 text-sm group-hover/item:translate-x-1 hover:text-[var(--admin-amber)] transition-colors">
                      arrow_forward_ios
                    </Link>
                  </div>
                );
              })
            )}
          </div>
          <Link href="/admin/coaches" className="mt-10 w-full text-center py-4 rounded-2xl bg-[var(--admin-card-text-primary)]/[0.04] hover:bg-[var(--admin-card-text-primary)]/[0.08] text-[var(--admin-card-text-primary)] text-[10px] font-black tracking-[0.25em] transition-all border border-[var(--admin-border)] uppercase block">
            Access Compliance Hub
          </Link>
        </div>
      </div>

      {/* System Tickets Dashboard */}
      <section className="glass-card rounded-[2.5rem] p-10 animate-float-up stagger-4">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-[#dc143c]/10 rounded-xl border border-[#dc143c]/20">
              <span className="material-symbols-outlined text-[#dc143c]">forum</span>
            </div>
            <h3 className="text-2xl font-bold text-[var(--admin-card-text-primary)] tracking-tight">System Tickets</h3>
          </div>
          <Link href="/admin/support" className="text-[10px] font-black tracking-[0.25em] text-[#dc143c] hover:brightness-125 transition-all flex items-center gap-3 group uppercase">
            Command Center
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
          </Link>
        </div>

        {recentTickets && recentTickets.length > 0 ? (
          <div className="space-y-4">
            {recentTickets.map((t: any) => {
              const status = String(t.status ?? "open");
              const ticketEmail = emailMap.get(String(t.user_id)) || "Unknown";
              const ago = Math.round((Date.now() - new Date(String(t.created_at)).getTime()) / 3600000);
              
              // Determine status colors matching Midnight Onyx design
              const statusColor = status === "open"
                ? "text-[#dc143c] bg-[#dc143c]/10 border-[#dc143c]/20 dark:text-[#ffb4ab] dark:bg-[#93000a]/30 dark:border-[#ffb4ab]/20" 
                : status === "in_progress"
                  ? "text-[var(--admin-amber)] bg-[var(--admin-amber)]/10 border-[var(--admin-amber)]/20 dark:text-[#fbbc00] dark:bg-[#8f6a00]/30 dark:border-[#fbbc00]/20"
                  : "text-[var(--admin-teal)] bg-[var(--admin-teal)]/10 border-[var(--admin-teal)]/20 dark:text-[#63f7ff] dark:bg-[#006c71]/30 dark:border-[#63f7ff]/20";

              return (
                <div key={String(t.id)} className="p-6 rounded-2xl bg-[var(--admin-card-text-primary)]/[0.02] border border-[var(--admin-border)] hover:border-[#dc143c]/30 hover:bg-[var(--admin-card-text-primary)]/[0.04] transition-all flex items-center justify-between gap-5 group/item">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--admin-card-text-primary)] truncate">{String(t.subject)}</p>
                    <p className="text-[10px] text-[var(--admin-card-text-subtle)] tracking-wider font-bold mt-1 uppercase">
                      {ticketEmail} · {String(t.category)} · {ago}h ago
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${statusColor}`}>
                      {status}
                    </span>
                    <Link href="/admin/support" className="material-symbols-outlined text-[var(--admin-card-text-subtle)]/30 text-sm group-hover/item:translate-x-1 hover:text-[#dc143c] transition-colors">
                      arrow_forward_ios
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 border border-dashed border-[var(--admin-border)] rounded-3xl bg-[var(--admin-card-text-primary)]/[0.01] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-25 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
              <span className="material-symbols-outlined text-4xl text-[var(--admin-card-text-primary)]">task_alt</span>
              <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-[var(--admin-card-text-primary)]">All Systems Nominal</p>
            </div>
          </div>
        )}
      </section>

      {/* Interactive 3D and Glow mouse listeners */}
      <AdminInteractiveEffects />
    </div>
  );
}
