import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart } from "@/components/ui/chart-bar";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Dashboard — COGNARA™" };

const revenueData = [
  { label: "1", value: 120 }, { label: "2", value: 85 }, { label: "3", value: 210 },
  { label: "4", value: 180 }, { label: "5", value: 290 }, { label: "6", value: 240 },
  { label: "7", value: 155 }, { label: "8", value: 320 }, { label: "9", value: 350 },
  { label: "10", value: 410 }, { label: "11", value: 380 }, { label: "12", value: 290 },
  { label: "13", value: 445 }, { label: "14", value: 310 }, { label: "15", value: 195 },
  { label: "16", value: 275 }, { label: "17", value: 500 }, { label: "18", value: 440 },
  { label: "19", value: 360 }, { label: "20", value: 225 }, { label: "21", value: 415 },
  { label: "22", value: 330 }, { label: "23", value: 480 }, { label: "24", value: 390 },
  { label: "25", value: 265 }, { label: "26", value: 550 }, { label: "27", value: 470 },
  { label: "28", value: 305 }, { label: "29", value: 520 }, { label: "30", value: 430 },
];

const verificationQueue = [
  { name: "Ahmed R.", doc: "BSc CS", confidence: 94, time: "2h ago" },
  { name: "Sara M.", doc: "AWS Certificate", confidence: 71, time: "5h ago" },
  { name: "Bilal K.", doc: "MBA", confidence: 43, time: "1d ago" },
];

const securityEvents = [
  { severity: "high" as const, msg: "Off-platform solicitation detected — User #4821", time: "12m ago" },
  { severity: "critical" as const, msg: "Failed login attempts: 12 in 5 mins — IP: 192.168.1.x", time: "45m ago" },
  { severity: "medium" as const, msg: "File upload violation — .exe rejected from User #2103", time: "2h ago" },
  { severity: "low" as const, msg: "Rate limit triggered — /api/agent from IP: 10.0.0.x", time: "3h ago" },
];

const severityColor: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  low: "bg-neutral-500/15 text-neutral-400 border-neutral-500/20",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Platform Control</h1>
        <p className="mt-1 text-sm text-neutral-400">Real-time overview of COGNARA operations</p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Users" value="2,847" accent="indigo" trend={{ value: "+18%", positive: true }} icon={<span className="text-lg">👥</span>} />
        <StatCard label="Active Today" value="312" accent="emerald" icon={<span className="text-lg">🟢</span>} />
        <StatCard label="MRR" value="$4,201" accent="emerald" trend={{ value: "+12%", positive: true }} icon={<span className="text-lg">💰</span>} />
        <StatCard label="Open Tickets" value="7" accent="amber" icon={<span className="text-lg">🎫</span>} />
        <StatCard label="Uptime" value="99.8%" accent="sky" icon={<span className="text-lg">⚡</span>} />
      </section>

      {/* Revenue + Verification Queue */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Revenue — Last 30 days</h2>
            <span className="text-xs text-neutral-500">Daily ($)</span>
          </div>
          <BarChart data={revenueData} color="emerald" height={150} />
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Verification Queue</h2>
            <Badge variant="warning" size="sm">{verificationQueue.length} pending</Badge>
          </div>
          <div className="space-y-3">
            {verificationQueue.map((app, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
                    {app.name.split(" ").map(w => w[0]).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{app.name}</p>
                    <p className="text-[10px] text-neutral-500">{app.doc} · {app.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-xs font-bold tabular-nums ${app.confidence >= 80 ? "text-emerald-400" : app.confidence >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                      {app.confidence}%
                    </p>
                    <p className="text-[9px] text-neutral-500">AI conf.</p>
                  </div>
                  <Link href="/admin/coaches" className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/15">
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Security Events */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Security Events</h2>
          <Link href="/admin/security" className="text-xs font-semibold text-rose-400 hover:underline">View all →</Link>
        </div>
        <div className="space-y-2">
          {securityEvents.map((evt, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${severityColor[evt.severity]}`}>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">[{evt.severity}]</span>
              <p className="flex-1 text-sm">{evt.msg}</p>
              <span className="shrink-0 text-xs opacity-60">{evt.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Health */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
        <h2 className="text-base font-bold text-white mb-4">Platform Health</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Database", status: "operational" },
            { label: "AI Agent API", status: "operational" },
            { label: "Payments", status: "operational" },
            { label: "Video (Mux)", status: "degraded" },
            { label: "Email", status: "operational" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <span className={`h-2 w-2 rounded-full ${s.status === "operational" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              <span className="text-xs text-neutral-300">{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
