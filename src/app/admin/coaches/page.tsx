import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export const metadata: Metadata = { title: "Coaches — Admin — COGNARA™" };

const applications = [
  { name: "Ahmed R.", email: "ahmed@example.com", doc: "BSc Computer Science — FAST NUCES", confidence: 94, status: "pending" as const, submitted: "2h ago" },
  { name: "Sara M.", email: "sara@example.com", doc: "AWS Solutions Architect Certificate", confidence: 71, status: "pending" as const, submitted: "5h ago" },
  { name: "Bilal K.", email: "bilal@example.com", doc: "MBA — IBA Karachi", confidence: 43, status: "pending" as const, submitted: "1d ago" },
  { name: "Zara N.", email: "zara@example.com", doc: "MSc Data Science — LUMS", confidence: 88, status: "approved" as const, submitted: "3d ago" },
];

export default function AdminCoachesPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-white">Coach Management</h1>
        <p className="mt-1 text-sm text-neutral-400">Review verification applications and manage coaches</p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-[#111112] p-6">
        <h2 className="text-base font-bold text-white mb-4">Verification Queue</h2>
        <div className="space-y-3">
          {applications.map((app, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-400">
                    {app.name.split(" ").map(w => w[0]).join("")}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{app.name}</p>
                    <p className="text-xs text-neutral-500">{app.email} · Submitted {app.submitted}</p>
                  </div>
                </div>
                <Badge variant={app.status === "approved" ? "success" : "warning"} dot>{app.status}</Badge>
              </div>
              <p className="text-sm text-neutral-300 mb-3">📄 {app.doc}</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-500">AI Confidence</span>
                    <span className={`font-bold ${app.confidence >= 80 ? "text-emerald-400" : app.confidence >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                      {app.confidence}%
                    </span>
                  </div>
                  <ProgressBar value={app.confidence} color={app.confidence >= 80 ? "emerald" : app.confidence >= 60 ? "amber" : "rose"} size="sm" />
                </div>
              </div>
              {app.status === "pending" && (
                <div className="flex gap-2">
                  <button className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-700">✓ Approve</button>
                  <button className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white transition hover:bg-rose-700">✗ Reject</button>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10">View Docs</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
