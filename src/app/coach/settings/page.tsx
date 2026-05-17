"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CoachSettingsPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load existing profile
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, username, bio").eq("id", user.id).maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setUsername(data.username ?? "");
        setBio(data.bio ?? "");
      }
      setLoaded(true);
    }
    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Unable to connect");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("profiles").update({
        full_name: fullName.trim(),
        username: username.trim().replace(/^@/, ""),
        bio: bio.trim(),
      }).eq("id", user.id);

      if (error) throw new Error(error.message);
      setToast({ type: "success", msg: "Settings saved successfully!" });
    } catch (err) {
      setToast({ type: "error", msg: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const [notifications, setNotifications] = useState({
    enrollment: true, completion: true, review: true, payout: true,
  });

  if (!loaded) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div><div className="h-8 w-40 rounded-lg bg-cn-border" /><div className="mt-2 h-4 w-56 rounded bg-cn-border" /></div>
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6"><div className="h-5 w-32 rounded bg-cn-border mb-4" /><div className="grid gap-4 sm:grid-cols-2">{[1,2,3].map(i=><div key={i} className="h-10 rounded-xl bg-cn-border" />)}</div></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Coach Settings</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Manage your profile and preferences</p>
      </section>

      {/* Toast */}
      {toast && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
          toast.type === "success"
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
            : "border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Profile Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coach-name" className="block text-xs font-semibold text-cn-ink-muted mb-1.5">Full Name</label>
              <input id="coach-name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition" />
            </div>
            <div>
              <label htmlFor="coach-username" className="block text-xs font-semibold text-cn-ink-muted mb-1.5">Username</label>
              <input id="coach-username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="@username" className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="coach-bio" className="block text-xs font-semibold text-cn-ink-muted mb-1.5">Bio</label>
              <textarea id="coach-bio" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell students about your expertise…" className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition resize-none" />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Payment Setup</h2>
          <p className="text-sm text-cn-ink-muted mb-4">Connect Stripe to receive payouts for your courses.</p>
          <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 shadow-md shadow-indigo-500/20" disabled>
            Connect Stripe Account (Coming Soon)
          </button>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
          <h2 className="text-base font-bold text-cn-ink mb-4">Notifications</h2>
          <div className="space-y-3">
            {(["enrollment", "completion", "review", "payout"] as const).map(key => {
              const labels = { enrollment: "New enrollment", completion: "Student completion", review: "New review", payout: "Payout received" };
              return (
                <label key={key} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-cn-canvas/60 transition-colors cursor-pointer">
                  <span className="text-sm text-cn-ink">{labels[key]}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[key]}
                    onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${notifications[key] ? "bg-indigo-500" : "bg-cn-border"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications[key] ? "left-[1.375rem]" : "left-0.5"}`} />
                  </button>
                </label>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
