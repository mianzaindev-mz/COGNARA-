"use client";

import { useState } from "react";

const CREDIT_PACKS = [
  { id: "starter", credits: 100, price: "$1.99", perCredit: "$0.020", popular: false },
  { id: "plus", credits: 500, price: "$7.99", perCredit: "$0.016", popular: true },
  { id: "pro", credits: 2000, price: "$24.99", perCredit: "$0.012", popular: false },
  { id: "max", credits: 10000, price: "$99.99", perCredit: "$0.010", popular: false },
];

const CREDIT_COSTS = [
  { action: "Ask a question", cost: 1, icon: "🧠" },
  { action: "Explain concept", cost: 2, icon: "💡" },
  { action: "Debug code", cost: 2, icon: "🐛" },
  { action: "AI note-taking", cost: 2, icon: "📝" },
  { action: "Generate quiz", cost: 3, icon: "📄" },
  { action: "Learning path", cost: 3, icon: "🗺️" },
  { action: "Voice (per min)", cost: 1, icon: "🎤" },
];

const DEMO_TRANSACTIONS = [
  { id: "1", action: "Ask question", amount: -1, balance: 49, date: "2 hours ago" },
  { id: "2", action: "Debug code", amount: -2, balance: 50, date: "5 hours ago" },
  { id: "3", action: "Daily free reset", amount: 20, balance: 52, date: "Today 00:00" },
  { id: "4", action: "Generate quiz", amount: -3, balance: 32, date: "Yesterday" },
  { id: "5", action: "Credit pack (100)", amount: 100, balance: 35, date: "3 days ago" },
];

export default function BillingPage() {
  const [balance] = useState(47);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">
          Credits &amp; Billing
        </h1>
        <p className="mt-0.5 text-sm text-cn-ink-muted">
          Manage your AI credits and subscription.
        </p>
      </div>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cn-sidebar via-[#1a1a2e] to-[#16213e] p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cn-orange/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-white/60">AI Credit Balance</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{balance}</p>
          <p className="mt-0.5 text-xs text-white/40">
            20 free credits reset daily at midnight UTC
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cn-orange to-cn-pink transition-all"
                style={{ width: `${Math.min(100, (balance / 100) * 100)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-white/50">{balance}/100</span>
          </div>
        </div>
      </div>

      {/* Credit packs */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-cn-ink">Top Up Credits</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative flex flex-col rounded-2xl border p-5 transition hover:border-cn-orange/40 ${
                pack.popular
                  ? "border-cn-orange bg-cn-orange/5 shadow-md"
                  : "border-cn-border bg-cn-surface shadow-[var(--cn-shadow-card)]"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-cn-orange px-2.5 py-0.5 text-[10px] font-bold text-white">
                  BEST VALUE
                </span>
              )}
              <p className="text-3xl font-bold text-cn-ink">{pack.credits.toLocaleString()}</p>
              <p className="text-xs text-cn-ink-muted">credits</p>
              <div className="mt-auto pt-4">
                <p className="text-xl font-bold text-cn-ink">{pack.price}</p>
                <p className="text-[11px] text-cn-ink-subtle">{pack.perCredit} per credit</p>
                <button
                  type="button"
                  className={`mt-3 w-full rounded-xl py-2.5 text-sm font-bold transition ${
                    pack.popular
                      ? "bg-cn-orange text-white hover:bg-cn-orange-hover"
                      : "border border-cn-border text-cn-ink hover:bg-cn-border/30"
                  }`}
                >
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-cn-ink-subtle">
          Purchased credits never expire. Payments processed securely via Stripe.
        </p>
      </section>

      {/* Credit costs */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-cn-ink">Credit Costs</h2>
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cn-border bg-cn-canvas/50">
                <th className="px-4 py-3 text-left font-semibold text-cn-ink-muted">Action</th>
                <th className="px-4 py-3 text-right font-semibold text-cn-ink-muted">Cost</th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_COSTS.map((item, i) => (
                <tr key={item.action} className={i < CREDIT_COSTS.length - 1 ? "border-b border-cn-border" : ""}>
                  <td className="px-4 py-3 text-cn-ink">
                    <span className="mr-2">{item.icon}</span>
                    {item.action}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-cn-orange">
                    {item.cost} credit{item.cost > 1 ? "s" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transaction history */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-cn-ink">Recent Transactions</h2>
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cn-border bg-cn-canvas/50">
                <th className="px-4 py-3 text-left font-semibold text-cn-ink-muted">Action</th>
                <th className="px-4 py-3 text-right font-semibold text-cn-ink-muted">Amount</th>
                <th className="hidden px-4 py-3 text-right font-semibold text-cn-ink-muted sm:table-cell">Balance After</th>
                <th className="px-4 py-3 text-right font-semibold text-cn-ink-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_TRANSACTIONS.map((tx, i) => (
                <tr key={tx.id} className={i < DEMO_TRANSACTIONS.length - 1 ? "border-b border-cn-border" : ""}>
                  <td className="px-4 py-3 text-cn-ink">{tx.action}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${tx.amount > 0 ? "text-emerald-500" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono text-cn-ink-muted sm:table-cell">
                    {tx.balance}
                  </td>
                  <td className="px-4 py-3 text-right text-cn-ink-subtle">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Free tier info */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Free Tier — Always Available
        </h3>
        <div className="grid gap-2 text-sm text-cn-ink-muted sm:grid-cols-2">
          <div>✅ Browse courses &amp; resources</div>
          <div>✅ Code editor — unlimited runs</div>
          <div>✅ Notebook — unlimited notes</div>
          <div>✅ 20 AI credits per day (auto-reset)</div>
          <div>✅ Public profile &amp; portfolio</div>
          <div>✅ Certificate verification links</div>
        </div>
      </div>
    </div>
  );
}
