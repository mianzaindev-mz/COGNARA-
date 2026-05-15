import type { Metadata } from "next";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";

export const metadata: Metadata = { title: "Reports — Admin — COGNARA™" };

const userGrowth = [
  { label: "Jan", value: 120 }, { label: "Feb", value: 280 },
  { label: "Mar", value: 450 }, { label: "Apr", value: 680 },
  { label: "May", value: 890 },
];

const revenueBreakdown = [
  { label: "Courses", value: 2800 }, { label: "Credits", value: 950 },
  { label: "Live", value: 320 }, { label: "Peer", value: 131 },
];

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-white">Reports</h1>
        <p className="mt-1 text-sm text-neutral-400">Platform analytics and growth metrics</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value="$4,201" accent="emerald" trend={{ value: "+34%", positive: true }} icon={<span className="text-lg">💰</span>} />
        <StatCard label="User Growth" value="+210" hint="This month" accent="indigo" trend={{ value: "+31%", positive: true }} icon={<span className="text-lg">📈</span>} />
        <StatCard label="Churn Rate" value="2.1%" accent="rose" trend={{ value: "-0.3%", positive: true }} icon={<span className="text-lg">📉</span>} />
        <StatCard label="Agent Usage" value="4,821" hint="Sessions this month" accent="lavender" icon={<span className="text-lg">🤖</span>} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
          <h2 className="text-base font-bold text-white mb-5">User Growth (Monthly)</h2>
          <BarChart data={userGrowth} color="indigo" height={150} />
        </section>
        <section className="rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
          <h2 className="text-base font-bold text-white mb-5">Revenue by Category ($)</h2>
          <BarChart data={revenueBreakdown} color="emerald" height={150} />
        </section>
      </div>

      {/* Top Coaches */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
        <h2 className="text-base font-bold text-white mb-4">Top Coaches by Earnings</h2>
        <div className="space-y-3">
          {[
            { name: "Demo Coach", earnings: 1153, rating: 4.8, students: 124 },
            { name: "Zara N.", earnings: 842, rating: 4.9, students: 95 },
            { name: "Ali Hassan", earnings: 620, rating: 4.6, students: 78 },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">#{i + 1}</span>
                <span className="font-semibold text-white">{c.name}</span>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <span className="text-emerald-400 font-bold">${c.earnings}</span>
                <span className="text-amber-400">{c.rating} ★</span>
                <span className="text-neutral-400">{c.students} students</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
