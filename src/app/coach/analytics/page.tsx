import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { IconChartBar, IconTarget, IconStar, IconBook } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics — Coach — COGNARA™" };

export default async function CoachAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch coach's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, total_enrolled, total_lessons, avg_rating")
    .eq("coach_id", user.id);

  const list = courses ?? [];
  const totalEnrolled = list.reduce((s: number, c: any) => s + (c.total_enrolled ?? 0), 0);
  const avgRating = list.length > 0
    ? list.reduce((s: number, c: any) => s + (Number(c.avg_rating) || 0), 0) / list.filter((c: any) => Number(c.avg_rating) > 0).length || 0
    : 0;

  // Get enrollments with progress for funnel
  const courseIds = list.map((c: any) => c.id);
  let progressData: { progress_pct: number }[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select("progress_pct")
      .in("course_id", courseIds);
    progressData = data ?? [];
  }

  const started = progressData.filter((e: any) => e.progress_pct > 0).length;
  const half = progressData.filter((e: any) => e.progress_pct >= 50).length;
  const threeQ = progressData.filter((e: any) => e.progress_pct >= 75).length;
  const completed = progressData.filter((e: any) => e.progress_pct >= 100).length;
  const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;

  const funnelData = [
    { label: "Enrolled", value: totalEnrolled },
    { label: "Started", value: started },
    { label: "50%+", value: half },
    { label: "75%+", value: threeQ },
    { label: "Completed", value: completed },
  ];

  // Per-course enrollment chart
  const courseChart = list.slice(0, 8).map((c: any) => ({
    label: c.title.length > 12 ? c.title.slice(0, 12) + "…" : c.title,
    value: c.total_enrolled ?? 0,
  }));

  // ── AI Insights Generation (server-side, no API call) ──
  const insights: { emoji: string; title: string; body: string; severity: "info" | "warning" | "success" }[] = [];

  if (totalEnrolled > 0 && started < totalEnrolled * 0.5) {
    insights.push({
      emoji: "⚠️",
      title: "Low activation rate",
      body: `Only ${Math.round((started / totalEnrolled) * 100)}% of enrolled students have started. Consider adding a welcome email or onboarding lesson.`,
      severity: "warning",
    });
  }

  if (half > 0 && completed < half * 0.4) {
    const dropOff = Math.round(((half - completed) / half) * 100);
    insights.push({
      emoji: "📉",
      title: `${dropOff}% drop-off after halfway`,
      body: "Students are engaged but not finishing. The second half of your courses may need more interactive content or shorter lessons.",
      severity: "warning",
    });
  }

  if (completionRate >= 70) {
    insights.push({
      emoji: "🏆",
      title: `${completionRate}% completion rate — excellent!`,
      body: "Your courses have outstanding retention. Consider creating advanced follow-up courses for these engaged students.",
      severity: "success",
    });
  }

  if (avgRating > 0 && avgRating < 3.5) {
    insights.push({
      emoji: "⭐",
      title: `Average rating: ${avgRating.toFixed(1)}/5`,
      body: "Below 3.5 suggests content or pacing issues. Review student feedback and consider restructuring low-rated lessons.",
      severity: "warning",
    });
  } else if (avgRating >= 4.5) {
    insights.push({
      emoji: "🌟",
      title: `Average rating: ${avgRating.toFixed(1)}/5`,
      body: "Outstanding student satisfaction! Your teaching methodology is highly effective.",
      severity: "success",
    });
  }

  if (list.length > 0 && totalEnrolled === 0) {
    insights.push({
      emoji: "📣",
      title: "No enrollments yet",
      body: "Your courses are published but have no students. Share course links, add descriptions, and ensure thumbnails are compelling.",
      severity: "info",
    });
  }

  // Always add a tip
  if (insights.length === 0) {
    insights.push({
      emoji: "💡",
      title: "Keep growing",
      body: "Publish courses and monitor student progress here. The AI Coach Agent can help generate quizzes, rubrics, and lesson plans.",
      severity: "info",
    });
  }

  const severityStyles = {
    warning: "border-l-amber-500 bg-amber-500/5",
    success: "border-l-emerald-500 bg-emerald-500/5",
    info: "border-l-blue-500 bg-blue-500/5",
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Analytics</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Understand how your students learn</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 cn-stagger">
        <StatCard label="Total Enrolled" value={String(totalEnrolled)} accent="indigo" icon={<IconChartBar className="h-5 w-5" />} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} accent="emerald" icon={<IconTarget className="h-5 w-5" />} />
        <StatCard label="Avg Rating" value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—"} accent="amber" icon={<IconStar className="h-5 w-5" />} />
        <StatCard label="Courses" value={String(list.length)} accent="lavender" icon={<IconBook className="h-5 w-5" />} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-5">Completion Funnel</h2>
          {totalEnrolled > 0 ? (
            <BarChart data={funnelData} color="indigo" height={140} />
          ) : (
            <p className="text-sm text-cn-ink-muted py-8 text-center">No enrollment data yet.</p>
          )}
        </section>
        <section className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-5">Students per Course</h2>
          {courseChart.length > 0 ? (
            <BarChart data={courseChart} color="emerald" height={140} />
          ) : (
            <p className="text-sm text-cn-ink-muted py-8 text-center">Create courses to see data.</p>
          )}
        </section>
      </div>

      {/* AI Coach Insights */}
      <section className="cn-card-lift rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink shadow-sm">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-cn-ink">AI Coach Insights</h2>
          </div>
          <Link
            href="/coach/agent"
            className="inline-flex items-center gap-1.5 rounded-xl border border-cn-orange/30 bg-cn-orange/10 px-4 py-2 text-xs font-bold text-cn-orange transition hover:bg-cn-orange/20"
          >
            Ask Coach Agent →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`rounded-xl border-l-4 p-4 ${severityStyles[insight.severity]} transition-all`}
            >
              <p className="text-sm font-bold text-cn-ink mb-1">
                {insight.emoji} {insight.title}
              </p>
              <p className="text-xs text-cn-ink-muted leading-relaxed">
                {insight.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
