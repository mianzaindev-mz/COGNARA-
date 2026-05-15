import type { Metadata } from "next";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { ProgressBar } from "@/components/ui/progress-bar";

export const metadata: Metadata = { title: "Earnings — Coach — COGNARA™" };

const monthlyData = [
  { label: "Jan", value: 180 }, { label: "Feb", value: 220 },
  { label: "Mar", value: 195 }, { label: "Apr", value: 310 },
  { label: "May", value: 248 }, { label: "Jun", value: 0 },
];

const transactions = [
  { date: "May 14", desc: "Python course enrollment × 3", amount: 0, type: "free" },
  { date: "May 13", desc: "React course — Sara M.", amount: 29.99, type: "course" },
  { date: "May 12", desc: "React course — Bilal K.", amount: 29.99, type: "course" },
  { date: "May 10", desc: "Data Science — Ahmed R.", amount: 19.99, type: "course" },
  { date: "May 8", desc: "Platform payout (April)", amount: -195.40, type: "payout" },
];

export default function CoachEarningsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Earnings</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Track your revenue and payouts</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="This Month" value="$247.50" accent="emerald" trend={{ value: "+8%", positive: true }} icon={<span className="text-lg">💰</span>} />
        <StatCard label="Lifetime" value="$1,153.00" accent="indigo" icon={<span className="text-lg">📈</span>} />
        <StatCard label="Pending Payout" value="$247.50" hint="Auto-pays on 1st" accent="amber" icon={<span className="text-lg">⏳</span>} />
        <StatCard label="Platform Fee" value="20%" hint="Performance bonuses can offset" accent="rose" icon={<span className="text-lg">🏷️</span>} />
      </section>

      <section className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
        <h2 className="text-base font-bold text-cn-ink mb-5">Monthly Revenue</h2>
        <BarChart data={monthlyData} color="emerald" height={150} />
      </section>

      {/* Earnings Calculator Preview */}
      <section className="rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-6 dark:border-indigo-500/20 dark:from-indigo-950/20 dark:to-purple-950/10">
        <h2 className="text-base font-bold text-cn-ink mb-4">💡 Earnings Calculator</h2>
        <div className="rounded-xl bg-cn-surface border border-cn-border p-5 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-cn-ink-muted">You set price:</span><span className="font-bold text-cn-ink">$49.00</span></div>
          <div className="flex justify-between text-sm"><span className="text-cn-ink-muted">Platform fee (20%):</span><span className="text-rose-500 font-semibold">−$9.80</span></div>
          <div className="flex justify-between text-sm"><span className="text-cn-ink-muted">Stripe processing*:</span><span className="text-rose-500 font-semibold">−$1.72</span></div>
          <div className="border-t border-cn-border pt-2 flex justify-between text-sm"><span className="font-bold text-cn-ink">Base earnings:</span><span className="font-bold text-cn-ink">$37.48</span></div>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-cn-ink-muted">Rating ≥ 4.8 bonus:</span><span className="text-emerald-600 font-semibold">+$1.12 ✓</span></div>
            <div className="flex justify-between text-xs"><span className="text-cn-ink-muted">Completion ≥ 80%:</span><span className="text-cn-ink-subtle">+$1.87 ?</span></div>
            <div className="flex justify-between text-xs"><span className="text-cn-ink-muted">100+ students:</span><span className="text-cn-ink-subtle">+$0.75 ?</span></div>
          </div>
          <div className="border-t border-cn-border pt-2 flex justify-between text-sm"><span className="font-bold text-cn-ink">Potential earnings:</span><span className="font-bold text-emerald-600 dark:text-emerald-400">$41.22</span></div>
          <p className="text-[10px] text-cn-ink-subtle mt-2">*Stripe: ~2.9% + $0.30 per transaction. Shown transparently.</p>
        </div>
      </section>

      {/* Transactions */}
      <section className="rounded-2xl border border-cn-border bg-cn-surface shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cn-border">
          <h2 className="text-base font-bold text-cn-ink">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-cn-border">
          {transactions.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-cn-canvas/60 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-lg">{t.type === "payout" ? "🏦" : t.type === "free" ? "🆓" : "💳"}</span>
                <div>
                  <p className="text-sm text-cn-ink">{t.desc}</p>
                  <p className="text-xs text-cn-ink-subtle">{t.date}</p>
                </div>
              </div>
              <span className={`text-sm font-bold tabular-nums ${t.amount < 0 ? "text-rose-500" : t.amount === 0 ? "text-cn-ink-subtle" : "text-emerald-600 dark:text-emerald-400"}`}>
                {t.amount === 0 ? "Free" : t.amount < 0 ? `−$${Math.abs(t.amount).toFixed(2)}` : `+$${t.amount.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
