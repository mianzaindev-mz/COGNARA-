"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const CREDIT_PACKS = [
  { id: "starter", credits: 100, price: "$1.99", perCredit: "$0.020", popular: false },
  { id: "plus", credits: 500, price: "$7.99", perCredit: "$0.016", popular: true },
  { id: "pro", credits: 2000, price: "$24.99", perCredit: "$0.012", popular: false },
  { id: "max", credits: 10000, price: "$99.99", perCredit: "$0.010", popular: false },
];

const CREDIT_COSTS = [
  { action: "Ask a question", cost: 1, icon: "✦" },
  { action: "Explain concept", cost: 2, icon: "✶" },
  { action: "Debug code", cost: 2, icon: "⚐" },
  { action: "AI note-taking", cost: 2, icon: "✎" },
  { action: "Generate quiz", cost: 3, icon: "☷" },
  { action: "Learning path", cost: 3, icon: "→" },
  { action: "Voice (per min)", cost: 1, icon: "♪" },
];

type Transaction = {
  id: string;
  action: string;
  amount: number;
  balance: number;
  date: string;
};

export default function BillingPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load credit balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("ai_credits")
        .eq("id", user.id)
        .maybeSingle();

      setBalance(profile?.ai_credits ?? 20);

      // Load credit transactions
      const { data: txns } = await supabase
        .from("credit_transactions")
        .select("id, action, amount, balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txns && txns.length > 0) {
        setTransactions(txns.map((t: { id: string; action: string; amount: number; balance_after: number; created_at: string }) => {
          const ago = Math.round((Date.now() - new Date(t.created_at).getTime()) / 3600000);
          const timeStr = ago < 1 ? "Just now" : ago < 24 ? `${ago}h ago` : `${Math.round(ago / 24)}d ago`;
          return {
            id: t.id,
            action: t.action,
            amount: t.amount,
            balance: t.balance_after,
            date: timeStr,
          };
        }));
      }

      setLoading(false);
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cn-orange border-t-transparent" />
      </div>
    );
  }

  const creditBalance = balance ?? 20;

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
          <p className="mt-1 text-4xl font-bold tabular-nums">{creditBalance}</p>
          <p className="mt-0.5 text-xs text-white/40">
            20 free credits reset daily at midnight UTC
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cn-orange to-cn-pink transition-all"
                style={{ width: `${Math.min(100, (creditBalance / 100) * 100)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-white/50">{creditBalance}/100</span>
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
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-12 text-center">
            <span className="text-xl mb-3 text-cn-ink-muted">∷</span>
            <h3 className="font-bold text-cn-ink">No transactions yet</h3>
            <p className="mt-1 text-sm text-cn-ink-muted max-w-xs">Your credit usage history will appear here as you use the AI agent.</p>
          </div>
        ) : (
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
                {transactions.map((tx, i) => (
                  <tr key={tx.id} className={i < transactions.length - 1 ? "border-b border-cn-border" : ""}>
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
        )}
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
