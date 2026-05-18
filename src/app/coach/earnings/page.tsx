import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { IconCurrency, IconBuilding, IconSparkle, IconUsers } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Earnings — Coach — COGNARA™" };

export default async function CoachEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get courses with prices and enrollment counts
  const { data: courses } = await supabase
    .from("courses")
    .select("title, price_usd, total_enrolled, is_published")
    .eq("coach_id", user.id);

  const list = courses ?? [];
  const grossRevenue = list.reduce((sum, c) => sum + (Number(c.price_usd) || 0) * (c.total_enrolled ?? 0), 0);
  const platformFee = grossRevenue * 0.20;
  const netEarnings = grossRevenue - platformFee;
  const totalStudents = list.reduce((sum, c) => sum + (c.total_enrolled ?? 0), 0);

  // Simulated monthly chart (in production this would come from a payments table)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyData = months.map((label, i) => ({
    label,
    value: Math.round(netEarnings / 6 * (0.5 + Math.sin(i) * 0.5 + Math.random() * 0.3)),
  }));

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Earnings</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Track your revenue and payouts</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 cn-stagger">
        <StatCard label="Gross Revenue" value={`$${grossRevenue.toFixed(2)}`} accent="emerald" icon={<IconCurrency className="h-5 w-5" />} />
        <StatCard label="Platform Fee (20%)" value={`−$${platformFee.toFixed(2)}`} accent="amber" icon={<IconBuilding className="h-5 w-5" />} />
        <StatCard label="Net Earnings" value={`$${netEarnings.toFixed(2)}`} accent="indigo" icon={<IconSparkle className="h-5 w-5" />} />
        <StatCard label="Paying Students" value={String(totalStudents)} accent="lavender" icon={<IconUsers className="h-5 w-5" />} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-5">Monthly Earnings</h2>
          <BarChart data={monthlyData} color="indigo" height={140} />
        </section>

        <section className="lg:col-span-2 cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Revenue by Course</h2>
          <div className="space-y-3">
            {list.length === 0 ? (
              <p className="text-sm text-cn-ink-muted">No courses yet.</p>
            ) : list.map(c => {
              const rev = (Number(c.price_usd) || 0) * (c.total_enrolled ?? 0);
              return (
                <div key={c.title} className="flex items-center justify-between cn-row-hover rounded-xl px-3 py-2.5 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cn-ink truncate">{c.title}</p>
                    <p className="text-[10px] text-cn-ink-subtle">{c.total_enrolled ?? 0} students × ${Number(c.price_usd || 0).toFixed(2)}</p>
                  </div>
                  <span className="text-sm font-bold text-cn-ink tabular-nums">${rev.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl bg-cn-canvas p-3 text-xs text-cn-ink-muted space-y-1">
            <div className="flex justify-between"><span>Gross</span><span className="font-semibold text-cn-ink">${grossRevenue.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Platform (20%)</span><span className="text-rose-500">−${platformFee.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-cn-border pt-1 mt-1"><span className="font-bold text-cn-ink">Net payout</span><span className="font-bold text-emerald-600 dark:text-emerald-400">${netEarnings.toFixed(2)}</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
