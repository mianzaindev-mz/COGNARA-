import type { Metadata } from "next";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { ProgressBar } from "@/components/ui/progress-bar";

export const metadata: Metadata = { title: "Analytics — Coach — COGNARA™" };

const funnelData = [
  { label: "Enrolled", value: 124 }, { label: "Started", value: 108 },
  { label: "50%+", value: 82 }, { label: "75%+", value: 61 },
  { label: "Completed", value: 45 },
];

const lessonDropoff = [
  { label: "L1", value: 108 }, { label: "L2", value: 102 }, { label: "L3", value: 96 },
  { label: "L4", value: 91 }, { label: "L5", value: 85 }, { label: "L6", value: 80 },
  { label: "L7", value: 72 }, { label: "L8", value: 68 }, { label: "L9", value: 62 },
  { label: "L10", value: 58 }, { label: "L11", value: 55 }, { label: "L12", value: 52 },
];

export default function CoachAnalyticsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Analytics</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Understand how your students learn</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Retention Rate" value="72%" accent="emerald" trend={{ value: "+3%", positive: true }} icon={<span className="text-lg">🔄</span>} />
        <StatCard label="Avg Completion" value="68%" accent="indigo" icon={<span className="text-lg">📊</span>} />
        <StatCard label="Avg Quiz Score" value="76%" accent="amber" icon={<span className="text-lg">📝</span>} />
        <StatCard label="Agent Quality" value="84/100" hint="AI content quality" accent="lavender" icon={<span className="text-lg">🤖</span>} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-5">Completion Funnel</h2>
          <BarChart data={funnelData} color="indigo" height={140} />
        </section>
        <section className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-5">Lesson Retention</h2>
          <BarChart data={lessonDropoff} color="emerald" height={140} />
        </section>
      </div>
    </div>
  );
}
