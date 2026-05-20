"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SettingsSection, SettingsToggle, SettingsInput, SettingsSelect, SettingsTextarea } from "@/components/ui/settings-ui";

export default function SettingsPage() {
  const [loaded, setLoaded] = useState(false);
  
  // Profile settings
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  
  // Notifications
  const [notifEnrollment, setNotifEnrollment] = useState(true);
  const [notifCompletion, setNotifCompletion] = useState(true);
  const [notifReview, setNotifReview] = useState(true);
  const [notifPayout, setNotifPayout] = useState(true);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        if (data) {
          setFullName(data.full_name || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const handleSave = () => {
    // Show toast or saving state
    console.log("Settings saved", { fullName, bio, timezone });
  };

  const handleStripeConnect = () => {
    // Initiate Stripe OAuth flow
    console.log("Redirecting to Stripe...");
  };

  if (!loaded) {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-12 animate-pulse">
        <div className="space-y-2">
          <div className="h-10 w-48 rounded-lg bg-black/5 dark:bg-white/5" />
          <div className="h-6 w-80 rounded bg-black/5 dark:bg-white/5" />
        </div>
        <div className="glass-card rounded-[2rem] p-8 space-y-8">
          <div className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/5" />
          <div className="space-y-4">
            <div className="h-12 w-full rounded-2xl bg-black/5 dark:bg-white/5" />
            <div className="h-12 w-full rounded-2xl bg-black/5 dark:bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 relative pb-20">
      <div className="absolute -inset-y-40 -inset-x-20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-cn-ink dark:text-white tracking-tight leading-tight">Settings</h2>
        <p className="text-lg text-cn-ink-subtle dark:text-on-surface-variant opacity-80">Manage your profile, payout connections, and preferences.</p>
      </div>

      {/* Toast Alert */}
      <div className="bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 dark:border-indigo-500/10 rounded-2xl p-4 flex items-start gap-4">
        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">info</span>
        <div>
          <p className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">Save your changes</p>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">Don't forget to click "Save Changes" at the bottom of the screen after modifying your profile.</p>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        
        {/* Profile Settings */}
        <SettingsSection title="Public Profile" icon="person" accent="indigo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <SettingsInput label="Display Name" id="name" value={fullName} onChange={setFullName} placeholder="Your name" accent="indigo" />
            <SettingsSelect 
              label="Timezone" 
              value={timezone} 
              onChange={setTimezone} 
              options={[
                { value: "UTC", label: "UTC (Universal Coordinated Time)" },
                { value: "EST", label: "EST (Eastern Standard Time)" },
                { value: "PST", label: "PST (Pacific Standard Time)" }
              ]} 
              accent="indigo"
            />
            <SettingsTextarea label="Bio" id="bio" value={bio} onChange={setBio} placeholder="Tell your students about your experience..." accent="indigo" />
          </div>
        </SettingsSection>

        {/* Payment Setup */}
        <SettingsSection title="Payment Setup" icon="payments" accent="indigo">
          <div className="w-full space-y-6">
            <p className="text-sm text-cn-ink-subtle dark:text-on-surface-variant opacity-80 leading-relaxed">
              Connect your Stripe account to receive dynamic direct payouts for your enrollment sales. COGNARA™ applies a minimal flat platform fee structure.
            </p>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-cn-ink dark:text-white text-base">Stripe Connect</p>
                  <p className="text-xs text-cn-ink-subtle dark:text-on-surface-variant opacity-60 mt-0.5">Not connected · Set up to receive student payments</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleStripeConnect}
                className="bg-black/5 dark:bg-white/5 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 px-6 py-2.5 rounded-xl text-xs font-black border border-black/5 dark:border-white/5 transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] whitespace-nowrap"
              >
                Connect Stripe
              </button>
            </div>
            <div className="flex justify-between items-center text-xs text-black/40 dark:text-on-surface-variant/50 px-2">
              <span>Revenue share: 85% to coach, 15% platform fee</span>
              <span>Payout schedule: Every 14 days</span>
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon="notifications_active" accent="indigo">
          <div className="w-full divide-y divide-black/5 dark:divide-white/5">
            {(["enrollment", "completion", "review", "payout"] as const).map(key => {
              const labels = { enrollment: "New enrollment", completion: "Student completion", review: "New review", payout: "Payout received" };
              const states = { enrollment: [notifEnrollment, setNotifEnrollment], completion: [notifCompletion, setNotifCompletion], review: [notifReview, setNotifReview], payout: [notifPayout, setNotifPayout] };
              const [val, setVal] = states[key] as [boolean, (v: boolean) => void];
              return (
                <SettingsToggle 
                  key={key} 
                  label={labels[key]} 
                  description={`Receive an email and push notification for every ${labels[key].toLowerCase()}.`} 
                  checked={val} 
                  onChange={setVal} 
                  accent="indigo"
                />
              );
            })}
          </div>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger Zone" danger>
          <div className="space-y-1">
            <p className="text-lg font-bold text-on-surface">Delete Account</p>
            <p className="text-sm font-semibold text-on-surface-variant">Permanently delete your data. This cannot be undone.</p>
          </div>
          <button type="button" className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-sm shrink-0">
            Delete Account
          </button>
        </SettingsSection>

      </div>

      {/* Save Button */}
      <div className="w-full mt-12 relative z-10">
        <button 
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/95 text-white dark:text-black dark:bg-white dark:hover:bg-white/95 py-5 rounded-[2rem] text-2xl font-black transition-all shadow-[0_15px_40px_rgba(139,92,246,0.2)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 active:translate-y-0 duration-300"
        >
          <span className="material-symbols-outlined text-3xl">save</span>
          Save Changes
        </button>
      </div>

    </div>
  );
}
