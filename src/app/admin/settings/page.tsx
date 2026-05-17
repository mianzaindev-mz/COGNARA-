import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Admin — COGNARA™" };

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Platform Settings</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Configure platform-wide settings and feature flags</p>
      </section>

      {/* Feature Flags */}
      <section className="rounded-2xl border border-cn-border bg-cn-surface p-6">
        <h2 className="text-base font-bold text-cn-ink mb-4">Feature Flags</h2>
        <div className="space-y-2">
          {[
            { name: "AI Agent", key: "AI_AGENT", enabled: true },
            { name: "Code Editor", key: "CODE_EDITOR", enabled: true },
            { name: "Notebook", key: "NOTEBOOK", enabled: true },
            { name: "Peer Sessions", key: "PEER_SESSIONS", enabled: true },
            { name: "Stripe Payments", key: "PAYMENTS_STRIPE", enabled: true },
            { name: "Live Classes", key: "LIVE_CLASSES", enabled: false },
            { name: "GitHub Import", key: "GITHUB_IMPORT", enabled: false },
            { name: "LinkedIn Certs", key: "LINKEDIN_CERTS", enabled: false },
          ].map(f => (
            <div key={f.key} className="flex items-center justify-between rounded-xl border border-cn-border bg-cn-canvas px-4 py-3 hover:bg-cn-surface transition-colors">
              <div>
                <p className="text-sm font-semibold text-cn-ink">{f.name}</p>
                <p className="text-[10px] text-cn-ink-subtle font-mono">{f.key}</p>
              </div>
              <div className={`relative h-6 w-11 rounded-full transition cursor-pointer ${f.enabled ? "bg-emerald-500" : "bg-neutral-700"}`}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${f.enabled ? "left-[22px]" : "left-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Maintenance */}
      <section className="rounded-2xl border border-amber-500/20 bg-cn-surface p-6">
        <h2 className="text-base font-bold text-cn-ink mb-3">Maintenance Mode</h2>
        <p className="text-sm text-cn-ink-muted mb-4">When enabled, all users see a maintenance page. Admin access is preserved.</p>
        <button className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm font-bold text-amber-400 transition hover:bg-amber-500/20">
          Enable Maintenance Mode
        </button>
      </section>
    </div>
  );
}
