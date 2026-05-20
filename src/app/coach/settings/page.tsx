"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SettingsSection, SettingsInput, SettingsTextarea, SettingsToggle } from "@/components/ui/settings-ui";

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
        <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6"><div className="h-5 w-32 rounded bg-cn-border mb-4" /><div className="grid gap-4 sm:grid-cols-2">{[1,2,3].map(i=><div key={i} className="h-10 rounded-xl bg-cn-border" />)}</div></div>
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
        <SettingsSection title="Profile Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsInput label="Full Name" id="coach-name" value={fullName} onChange={setFullName} placeholder="Your name" />
            <SettingsInput label="Username" id="coach-username" value={username} onChange={setUsername} placeholder="@username" />
            <SettingsTextarea label="Bio" id="coach-bio" value={bio} onChange={setBio} placeholder="Tell students about your expertise…" />
          </div>
        </SettingsSection>

        {/* Payment */}
        <SettingsSection title="Payment Setup">
          <p className="text-sm text-cn-ink-muted mb-4">Connect Stripe to receive payouts for your courses. COGNARA takes a 15% platform fee.</p>
          <div className="flex items-center gap-4 rounded-xl border border-cn-border bg-cn-canvas dark:bg-[#0f0e0e] dark:border-[#2e2a2a] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-cn-ink dark:text-white">Stripe Connect</p>
              <p className="text-xs text-cn-ink-muted">Not connected — set up to start receiving payments</p>
            </div>
            <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
              Connect Stripe
            </button>
          </div>
          <p className="mt-2 text-[11px] text-cn-ink-subtle">Revenue share: 85% to you, 15% platform fee. Payouts every 2 weeks.</p>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          {(["enrollment", "completion", "review", "payout"] as const).map(key => {
            const labels = { enrollment: "New enrollment", completion: "Student completion", review: "New review", payout: "Payout received" };
            return (
              <SettingsToggle
                key={key}
                label={labels[key]}
                description={`Get notified about ${labels[key].toLowerCase()}`}
                checked={notifications[key]}
                onChange={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
              />
            );
          })}
        </SettingsSection>

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-xl bg-cn-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover shadow-md disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
