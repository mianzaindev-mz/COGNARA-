import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coach dashboard — COGNARA™",
};

/* Mock earnings data for demo — replaced with Supabase once wired */
const earningsData = [
  { label: "1", value: 12 }, { label: "2", value: 8 }, { label: "3", value: 24 },
  { label: "4", value: 18 }, { label: "5", value: 32 }, { label: "6", value: 28 },
  { label: "7", value: 15 }, { label: "8", value: 22 }, { label: "9", value: 35 },
  { label: "10", value: 42 }, { label: "11", value: 38 }, { label: "12", value: 29 },
  { label: "13", value: 45 }, { label: "14", value: 31 }, { label: "15", value: 19 },
  { label: "16", value: 27 }, { label: "17", value: 50 }, { label: "18", value: 44 },
  { label: "19", value: 36 }, { label: "20", value: 22 }, { label: "21", value: 41 },
  { label: "22", value: 33 }, { label: "23", value: 48 }, { label: "24", value: 39 },
  { label: "25", value: 26 }, { label: "26", value: 55 }, { label: "27", value: 47 },
  { label: "28", value: 30 }, { label: "29", value: 52 }, { label: "30", value: 43 },
];

const recentActivity = [
  { text: "Ahmed completed Lesson 4 of Python Basics", time: "2m ago", type: "completion" },
  { text: "Sara scored 92% on your Variables Quiz", time: "15m ago", type: "quiz" },
  { text: 'Bilal left a 5-star review: "Best course!"', time: "1h ago", type: "review" },
  { text: "New enrollment: Fatima joined React Course", time: "3h ago", type: "enrollment" },
  { text: "Peer session request for Data Structures", time: "5h ago", type: "peer" },
];

const activityIcons: Record<string, string> = {
  completion: "✅",
  quiz: "📝",
  review: "⭐",
  enrollment: "🎉",
  peer: "👥",
};

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch coach's courses for the performance table
  const { data: courses } = await supabase
    .from("courses")
    .select("title, total_enrolled, avg_rating, price_usd, is_published")
    .eq("coach_id", user.id)
    .order("total_enrolled", { ascending: false })
    .limit(5);

  const coachCourses = (courses ?? []).map(c => ({
    title: c.title,
    students: c.total_enrolled ?? 0,
    rating: Number(c.avg_rating) || 0,
    revenue: (c.total_enrolled ?? 0) * Number(c.price_usd || 0),
    status: c.is_published ? ("published" as const) : ("draft" as const),
  }));

  const firstName = profile?.full_name?.split(/\s+/)[0] || user.email?.split("@")[0] || "Coach";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-cn-ink-muted">
          Here&apos;s how your courses are performing this month.
        </p>
      </section>

      {/* Verification Banner */}
      {!profile?.is_verified && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber-300/30 bg-amber-50 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Your account is pending verification
            </p>
            <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/60">
              You can build courses but cannot publish until verified.
            </p>
          </div>
          <Link
            href="/coach/verification"
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
          >
            Upload Documents →
          </Link>
        </div>
      )}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Students"
          value="124"
          hint="All-time enrolled"
          accent="indigo"
          trend={{ value: "+12%", positive: true }}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.433-2.367M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard
          label="Active This Month"
          value="89"
          hint="Currently learning"
          accent="emerald"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Monthly Earnings"
          value="$247.50"
          hint="After platform fee"
          accent="emerald"
          trend={{ value: "+8%", positive: true }}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Avg Rating"
          value="4.8 ★"
          hint="From 47 reviews"
          accent="amber"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
        />
        <StatCard
          label="Completion Rate"
          value="78%"
          hint="+5% bonus earned"
          accent="lavender"
          trend={{ value: "+5%", positive: true }}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </section>

      {/* AI Coach Agent Tools */}
      <section className="rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 p-6 dark:border-indigo-500/20 dark:from-indigo-950/30 dark:via-cn-surface dark:to-purple-950/20">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🤖</span>
          <h2 className="text-base font-bold text-cn-ink">Coach Agent Tools</h2>
          <Badge variant="success" size="sm">FREE for coaches</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: "📄", title: "PDF → Course Outline", desc: "AI drafts a full course from your PDF" },
            { icon: "📝", title: "Generate Quiz Bank", desc: "Create quizzes from any topic instantly" },
            { icon: "📊", title: "Analyze My Students", desc: "AI insights on student performance" },
          ].map(tool => (
            <button
              key={tool.title}
              className="group flex flex-col gap-2 rounded-xl border border-cn-border bg-cn-surface p-4 text-left transition-all hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-500/40"
            >
              <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{tool.icon}</span>
              <span className="text-sm font-bold text-cn-ink">{tool.title}</span>
              <span className="text-xs text-cn-ink-muted">{tool.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Earnings Chart + Performance */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-cn-ink">Earnings — Last 30 days</h2>
            <span className="text-xs text-cn-ink-subtle">Daily revenue ($)</span>
          </div>
          <BarChart data={earningsData} color="indigo" height={140} />
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Performance Multiplier</h2>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">1.08×</span>
            <Badge variant="success" size="sm">+8% this month</Badge>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-cn-ink-muted">Completion rate</span>
                <span className="font-semibold text-cn-ink">78% <span className="text-emerald-500">+5%</span></span>
              </div>
              <ProgressBar value={78} color="emerald" size="sm" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-cn-ink-muted">Avg rating</span>
                <span className="font-semibold text-cn-ink">4.8/5 <span className="text-emerald-500">+3%</span></span>
              </div>
              <ProgressBar value={96} color="amber" size="sm" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-cn-ink-muted">Student volume</span>
                <span className="font-semibold text-cn-ink">89 active</span>
              </div>
              <ProgressBar value={45} color="indigo" size="sm" />
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-cn-canvas p-3 text-xs text-cn-ink-muted space-y-1">
            <div className="flex justify-between"><span>Gross revenue</span><span className="font-semibold text-cn-ink">$297.62</span></div>
            <div className="flex justify-between"><span>Platform fee (20%)</span><span className="text-rose-500">−$59.52</span></div>
            <div className="flex justify-between border-t border-cn-border pt-1 mt-1"><span className="font-bold text-cn-ink">Net payout</span><span className="font-bold text-emerald-600 dark:text-emerald-400">$247.50</span></div>
          </div>
        </section>
      </div>

      {/* Course Performance Table */}
      <section className="rounded-2xl border border-cn-border bg-cn-surface shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cn-border flex items-center justify-between">
          <h2 className="text-base font-bold text-cn-ink">Course Performance</h2>
          <Link href="/coach/courses" className="text-xs font-semibold text-indigo-500 hover:underline">
            Manage courses →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cn-canvas/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Students</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cn-border">
              {coachCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-cn-ink-muted">No courses yet — create your first course to see performance data.</td>
                </tr>
              ) : coachCourses.map(c => (
                <tr key={c.title} className="hover:bg-cn-canvas/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-cn-ink">{c.title}</td>
                  <td className="px-4 py-4 text-cn-ink-muted">{c.students}</td>
                  <td className="px-4 py-4 text-cn-ink-muted">{c.rating > 0 ? `${c.rating.toFixed(1)} ★` : "—"}</td>
                  <td className="px-4 py-4 font-semibold text-cn-ink">{c.revenue > 0 ? `$${c.revenue.toFixed(2)}` : "Free"}</td>
                  <td className="px-4 py-4">
                    <Badge variant={c.status === "published" ? "success" : "warning"} dot>
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
        <h2 className="text-base font-bold text-cn-ink mb-4">Recent Student Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-cn-canvas/60">
              <span className="mt-0.5 text-lg">{activityIcons[item.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cn-ink">{item.text}</p>
                <p className="mt-0.5 text-xs text-cn-ink-subtle">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
