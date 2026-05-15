import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Coach — COGNARA™" };

export default function CoachSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Coach Settings</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Manage your profile and preferences</p>
      </section>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Profile Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-cn-ink-muted mb-1.5">Full Name</label>
              <input type="text" placeholder="Your name" className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cn-ink-muted mb-1.5">Username</label>
              <input type="text" placeholder="@username" className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-cn-ink-muted mb-1.5">Bio</label>
              <textarea rows={3} placeholder="Tell students about your expertise…" className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition resize-none" />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Payment Setup</h2>
          <p className="text-sm text-cn-ink-muted mb-4">Connect Stripe to receive payouts for your courses.</p>
          <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
            Connect Stripe Account
          </button>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Notifications</h2>
          <div className="space-y-3">
            {["New enrollment", "Student completion", "New review", "Payout received"].map(n => (
              <label key={n} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-cn-canvas/60 transition-colors cursor-pointer">
                <span className="text-sm text-cn-ink">{n}</span>
                <div className="relative h-6 w-11 rounded-full bg-cn-border transition peer-checked:bg-indigo-500">
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition" />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
          Save Changes
        </button>
      </div>
    </div>
  );
}
