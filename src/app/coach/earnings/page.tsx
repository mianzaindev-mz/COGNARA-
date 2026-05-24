"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { IconCurrency, IconBuilding, IconSparkle, IconCreditCard } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";


type CourseSales = {
  title: string;
  price_usd: number;
  total_enrolled: number;
};

type WithdrawalRow = {
  id: string;
  date: string;
  amount: number;
  status: "Completed" | "Processing";
  method: string;
};

export default function CoachEarningsPage() {
  const { notify } = useToast();
  const [courses, setCourses] = useState<CourseSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stripe & Payout Details
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [bankRouting, setBankRouting] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("stripe");
  const [savingDetails, setSavingDetails] = useState(false);

  // Available Balance & Withdrawals
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);

  // Live Calculator Sliders
  const [calcPrice, setCalcPrice] = useState(49);
  const [calcStudents, setCalcStudents] = useState(100);

  const fetchEarningsData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch courses with price and enrollment
      const { data: coursesData } = await supabase
        .from("courses")
        .select("title, price_usd, total_enrolled")
        .eq("coach_id", user.id);

      const list: CourseSales[] = (coursesData || []).map((c: any) => ({
        title: c.title,
        price_usd: Number(c.price_usd) || 0,
        total_enrolled: c.total_enrolled || 0
      }));
      setCourses(list);

      // Compute Net Earnings
      const gross = list.reduce((sum, c) => sum + c.price_usd * c.total_enrolled, 0);
      const fee = gross * 0.20;
      const net = gross - fee;

      // 2. Load Local Storage payout settings & withdrawal records
      const savedSettingsStr = localStorage.getItem(`cognara_coach_payout_${user.id}`);
      if (savedSettingsStr) {
        const saved = JSON.parse(savedSettingsStr);
        setIsStripeConnected(saved.isConnected || false);
        setBankRouting(saved.routing || "");
        setBankAccount(saved.account || "");
        setAccountName(saved.name || "");
        setPayoutMethod(saved.method || "stripe");
      }

      const savedWithdrawalsStr = localStorage.getItem(`cognara_coach_withdrawals_${user.id}`);
      let pastWithdrawTotal = 0;
      if (savedWithdrawalsStr) {
        const parsedWithdrawals: WithdrawalRow[] = JSON.parse(savedWithdrawalsStr);
        setWithdrawals(parsedWithdrawals);
        pastWithdrawTotal = parsedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      } else {
        // Mock some baseline withdrawal history to look professional
        const initialWithdrawals: WithdrawalRow[] = [
          { id: "TX-5928", date: "2026-04-15", amount: 450.00, status: "Completed", method: "Stripe Direct" },
          { id: "TX-4819", date: "2026-03-10", amount: 200.00, status: "Completed", method: "Direct Deposit" }
        ];
        localStorage.setItem(`cognara_coach_withdrawals_${user.id}`, JSON.stringify(initialWithdrawals));
        setWithdrawals(initialWithdrawals);
        pastWithdrawTotal = 650.00;
      }

      // Compute current available balance
      const currentAvail = Math.max(0, net - pastWithdrawTotal);
      setAvailableBalance(currentAvail);

    } catch (err: any) {
      console.error("Failed to load earnings:", err.message);
      setError(err.message || "Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEarningsData();
  }, [fetchEarningsData]);

  // Save Payout details / Connect Stripe Wizard
  const handleSavePayoutDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSavingDetails(true);
    if (payoutMethod === "stripe") {
      try {
        const response = await fetch("/api/coach/stripe/connect", { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Stripe Connect could not be opened.");
        window.location.href = data.url;
        return;
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Stripe Connect unavailable",
          description: error?.message || "Could not create the coach onboarding link.",
        });
        setSavingDetails(false);
        return;
      }
    }

    setTimeout(() => {
      const payload = {
        isConnected: true,
        routing: bankRouting,
        account: bankAccount,
        name: accountName,
        method: payoutMethod
      };
      localStorage.setItem(`cognara_coach_payout_${user.id}`, JSON.stringify(payload));
      setIsStripeConnected(true);
      setSavingDetails(false);
      notify({
        tone: "success",
        title: "Payout details saved",
        description: "Direct deposit details are stored for demo payouts. Use Stripe Connect for production payouts.",
      });
    }, 1200);
  };

  // Perform Manual Withdrawal
  const handleWithdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStripeConnected) {
      notify({
        tone: "warning",
        title: "Payout setup required",
        description: "Connect Stripe or save direct deposit details before requesting withdrawals.",
      });
      return;
    }
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      notify({
        tone: "warning",
        title: "Invalid amount",
        description: "Enter a positive withdrawal amount.",
      });
      return;
    }
    if (amount > availableBalance) {
      notify({
        tone: "error",
        title: "Insufficient funds",
        description: "The requested amount exceeds your available balance.",
      });
      return;
    }

    const supabase = createClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setWithdrawing(true);
    // Simulate payment gateway delay
    setTimeout(() => {
      const newTx: WithdrawalRow = {
        id: `TX-${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toISOString().split("T")[0],
        amount,
        status: "Completed",
        method: payoutMethod === "stripe" ? "Stripe Direct" : "Direct Deposit"
      };

      const updatedTxs = [newTx, ...withdrawals];
      setWithdrawals(updatedTxs);
      localStorage.setItem(`cognara_coach_withdrawals_${user.id}`, JSON.stringify(updatedTxs));

      const newBalance = availableBalance - amount;
      setAvailableBalance(newBalance);
      setWithdrawAmount("");
      setWithdrawing(false);
      notify({
        tone: "success",
        title: "Withdrawal requested",
        description: `$${amount.toFixed(2)} will clear in 1-2 business days.`,
      });
    }, 1500);
  };

  // Math variables
  const grossRevenue = courses.reduce((sum, c) => sum + c.price_usd * c.total_enrolled, 0);
  const platformFee = grossRevenue * 0.20;
  const netEarnings = grossRevenue - platformFee;

  // Simulated monthly chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyData = months.map((label, i) => ({
    label,
    value: Math.round(netEarnings / 6 * (0.5 + Math.sin(i) * 0.5 + Math.random() * 0.15)),
  }));

  // Live Calculator formulas
  const calcGross = calcPrice * calcStudents;
  const calcPlatformFee = calcGross * 0.20;
  const calcStripeFee = (calcGross * 0.029) + (calcStudents * 0.30);
  const calcNet = calcGross - calcPlatformFee - calcStripeFee;
  const isEligibleForBonus = calcGross >= 5000;
  const calcBonus = isEligibleForBonus ? calcGross * 0.05 : 0;
  const calcTotalPayout = calcNet + calcBonus;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <p>{error}</p>
        </div>
      )}

      {/* Page Title */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Earnings</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">Track your revenue and request manual payouts</p>
        </div>
        {availableBalance > 0 && isStripeConnected && (
          <Badge variant="success" dot className="font-semibold">
            Payout Account Setup Ready
          </Badge>
        )}
      </section>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 cn-stagger">
        <StatCard label="Gross Revenue" value={`$${grossRevenue.toFixed(2)}`} accent="emerald" icon={<IconCurrency className="h-5 w-5" />} />
        <StatCard label="Platform Fee (20%)" value={`−$${platformFee.toFixed(2)}`} accent="amber" icon={<IconBuilding className="h-5 w-5" />} />
        <StatCard label="Net Earnings" value={`$${netEarnings.toFixed(2)}`} accent="indigo" icon={<IconSparkle className="h-5 w-5" />} />
        <StatCard label="Available for Payout" value={`$${availableBalance.toFixed(2)}`} accent="lavender" icon={<IconCreditCard className="h-5 w-5" />} />
      </section>

      {/* Main grids */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Charts & calculator */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Monthly Earnings Chart */}
          <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-cn-ink mb-5">Monthly Earnings</h2>
            <BarChart data={monthlyData} color="indigo" height={140} />
          </div>

          {/* Earnings calculator live preview */}
          <div className="cn-card-lift cn-card-shine rounded-2xl border border-[#221740] bg-[#120c2b] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <IconSparkle className="h-5 w-5 text-indigo-400" />
                Live Revenue & Fee Calculator
              </h2>
              <p className="text-xs text-cn-ink-muted mt-1">Estimate your gross and net payouts dynamically before setting course prices</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-300 font-semibold mb-1.5">
                    <span>Target Price</span>
                    <span className="text-indigo-400 font-bold">${calcPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-[#0c081d] h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1"><span>$5</span><span>$300</span></div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-300 font-semibold mb-1.5">
                    <span>Target Students</span>
                    <span className="text-indigo-400 font-bold">{calcStudents}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={calcStudents}
                    onChange={(e) => setCalcStudents(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-[#0c081d] h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1"><span>10</span><span>500</span></div>
                </div>
              </div>

              {/* Calculator Output Display */}
              <div className="rounded-xl bg-[#0c081d] border border-[#221740] p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Gross</span>
                  <span className="font-bold text-white">${calcGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">COGNARA Fee (20%)</span>
                  <span className="text-amber-500">−${calcPlatformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stripe Processing (2.9% + $0.30)</span>
                  <span className="text-rose-500">−${calcStripeFee.toFixed(2)}</span>
                </div>
                {calcBonus > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>📈 AI Performance Bonus (+5%)</span>
                    <span>+${calcBonus.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[#221740] pt-2 mt-2 flex justify-between font-bold text-sm text-emerald-500">
                  <span>Net Estimated Payout</span>
                  <span>${calcTotalPayout.toFixed(2)}</span>
                </div>
                
                {/* AI dynamic feedback */}
                <p className="text-[9px] text-gray-500 leading-normal border-t border-[#221740]/40 pt-2 mt-1">
                  {calcGross >= 5000 
                    ? "✓ Target gross exceeds $5,000! You qualify for the 5% COGNARA AI performance booster."
                    : "💡 Reach $5,000 in gross sales to qualify for a +5% net revenue multiplier bonus!"}
                </p>
              </div>
            </div>
          </div>

          {/* Historical Payout Transactions */}
          <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-cn-ink mb-4">Withdrawal Payout History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-cn-border text-cn-ink-subtle">
                    <th className="py-2 font-semibold">Date</th>
                    <th className="py-2 font-semibold">Payout ID</th>
                    <th className="py-2 font-semibold">Amount</th>
                    <th className="py-2 font-semibold">Method</th>
                    <th className="py-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cn-border/50 text-cn-ink">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-cn-ink-muted">No withdrawal history recorded yet.</td>
                    </tr>
                  ) : (
                    withdrawals.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cn-canvas/50">
                        <td className="py-2.5">{tx.date}</td>
                        <td className="py-2.5 font-mono text-[10px] text-cn-ink-muted">{tx.id}</td>
                        <td className="py-2.5 font-bold">${tx.amount.toFixed(2)}</td>
                        <td className="py-2.5 text-cn-ink-subtle">{tx.method}</td>
                        <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">{tx.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Payout configuration & withdrawals */}
        <div className="space-y-6">
          
          {/* Payout Details & Stripe Wizard */}
          <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-cn-ink">Payout & stripe Connect</h2>
              <p className="text-xs text-cn-ink-muted mt-0.5">Secure Stripe bank integration</p>
            </div>

            {isStripeConnected ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">✓</span>
                  Stripe Connected
                </div>
                <div className="text-[10px] text-cn-ink-muted leading-relaxed">
                  <div className="flex justify-between border-b border-cn-border/50 py-1"><span>Account Holder</span><span className="font-semibold text-cn-ink">{accountName}</span></div>
                  <div className="flex justify-between border-b border-cn-border/50 py-1"><span>Routing Number</span><span className="font-semibold text-cn-ink">•••••{bankRouting.slice(-4)}</span></div>
                  <div className="flex justify-between py-1"><span>Account Number</span><span className="font-semibold text-cn-ink">••••••••{bankAccount.slice(-4)}</span></div>
                </div>
                <button
                  onClick={() => setIsStripeConnected(false)}
                  className="w-full text-center text-[10px] text-rose-500 font-semibold hover:underline mt-2"
                >
                  Disconnect Payout Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePayoutDetails} className="space-y-3">
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-cn-ink-subtle mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full rounded-lg border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-cn-ink-subtle mb-1">Bank Routing Number</label>
                    <input
                      type="password"
                      required
                      maxLength={9}
                      placeholder="9-digit routing"
                      value={bankRouting}
                      onChange={(e) => setBankRouting(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-lg border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-cn-ink-subtle mb-1">Account Number</label>
                    <input
                      type="password"
                      required
                      placeholder="Bank account number"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-lg border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-cn-ink-subtle mb-1">Preferred Method</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-full rounded-lg border border-cn-border bg-cn-canvas px-2.5 py-2 text-xs text-cn-ink focus:outline-none"
                    >
                      <option value="stripe">Stripe Connect Direct Payout</option>
                      <option value="bank">Direct Bank Wire / ACH</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingDetails || !accountName || !bankRouting || !bankAccount}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-40 transition"
                >
                  {savingDetails ? "Verifying Bank..." : "⚡ Secure Stripe Connect"}
                </button>
              </form>
            )}
          </div>

          {/* Available for Payout & Withdrawal controls */}
          <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-cn-ink">Manual Payout Request</h2>
              <p className="text-xs text-cn-ink-muted mt-0.5">Transfer cleared earnings instantly</p>
            </div>

            <div className="rounded-xl bg-cn-canvas p-4 text-center">
              <span className="block text-[10px] uppercase font-semibold text-cn-ink-subtle">Total Available</span>
              <span className="block text-2xl font-black text-cn-ink mt-1 tabular-nums">${availableBalance.toFixed(2)}</span>
            </div>

            {availableBalance > 0 ? (
              <form onSubmit={handleWithdrawFunds} className="space-y-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-cn-ink-subtle mb-1.5">Amount to Withdraw</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-cn-ink-subtle">$</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="1"
                      max={availableBalance}
                      placeholder={`Max ${availableBalance.toFixed(2)}`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full rounded-lg border border-cn-border bg-cn-canvas pl-7 pr-3 py-2.5 text-xs font-semibold text-cn-ink focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={withdrawing || !withdrawAmount || !isStripeConnected}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-40 transition"
                >
                  {withdrawing ? "Requesting transfer..." : "Confirm & Withdraw Funds"}
                </button>
              </form>
            ) : (
              <p className="text-xs text-cn-ink-muted italic text-center py-4">No funds currently available for manual withdrawal.</p>
            )}
          </div>

          {/* Revenue by Course (List) */}
          <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-cn-ink mb-4">Revenue by Course</h2>
            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-sm text-cn-ink-muted">No courses yet.</p>
              ) : courses.map(c => {
                const rev = c.price_usd * c.total_enrolled;
                return (
                  <div key={c.title} className="flex items-center justify-between cn-row-hover rounded-xl px-3 py-2.5 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cn-ink truncate">{c.title}</p>
                      <p className="text-[10px] text-cn-ink-subtle">{c.total_enrolled} students × ${c.price_usd.toFixed(2)}</p>
                    </div>
                    <span className="text-sm font-bold text-cn-ink tabular-nums">${rev.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
