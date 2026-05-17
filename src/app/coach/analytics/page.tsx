import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";

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
  const totalEnrolled = list.reduce((s, c) => s + (c.total_enrolled ?? 0), 0);
  const avgRating = list.length > 0
    ? list.reduce((s, c) => s + (Number(c.avg_rating) || 0), 0) / list.filter(c => Number(c.avg_rating) > 0).length || 0
    : 0;

  // Get enrollments with progress for funnel
  const courseIds = list.map(c => c.id);
  let progressData: { progress_pct: number }[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select("progress_pct")
      .in("course_id", courseIds);
    progressData = data ?? [];
  }

  const started = progressData.filter(e => e.progress_pct > 0).length;
  const half = progressData.filter(e => e.progress_pct >= 50).length;
  const threeQ = progressData.filter(e => e.progress_pct >= 75).length;
  const completed = progressData.filter(e => e.progress_pct >= 100).length;
  const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;

  const funnelData = [
    { label: "Enrolled", value: totalEnrolled },
    { label: "Started", value: started },
    { label: "50%+", value: half },
    { label: "75%+", value: threeQ },
    { label: "Completed", value: completed },
  ];

  // Per-course enrollment chart
  const courseChart = list.slice(0, 8).map(c => ({
    label: c.title.length > 12 ? c.title.slice(0, 12) + "…" : c.title,
    value: c.total_enrolled ?? 0,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Analytics</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Understand how your students learn</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 cn-stagger">
        <StatCard label="Total Enrolled" value={String(totalEnrolled)} accent="indigo" icon={<span className="text-lg">📊</span>} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} accent="emerald" icon={<span className="text-lg">🎯</span>} />
        <StatCard label="Avg Rating" value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—"} accent="amber" icon={<span className="text-lg">⭐</span>} />
        <StatCard label="Courses" value={String(list.length)} accent="lavender" icon={<span className="text-lg">📚</span>} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-5">Completion Funnel</h2>
          {totalEnrolled > 0 ? (
            <BarChart data={funnelData} color="indigo" height={140} />
          ) : (
            <p className="text-sm text-cn-ink-muted py-8 text-center">No enrollment data yet.</p>
          )}
        </section>
        <section className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-5">Students per Course</h2>
          {courseChart.length > 0 ? (
            <BarChart data={courseChart} color="emerald" height={140} />
          ) : (
            <p className="text-sm text-cn-ink-muted py-8 text-center">Create courses to see data.</p>
          )}
        </section>
      </div>
    </div>
  );
}
