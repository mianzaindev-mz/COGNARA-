"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme/theme-provider";
import { SettingsSection, SettingsToggle, SettingsSelect } from "@/components/ui/settings-ui";

export default function SettingsPage() {
  const { setTheme: setActiveTheme } = useTheme();

  const [theme, setTheme] = useState("system");
  const [fontSize, setFontSize] = useState("medium");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [digestMode, setDigestMode] = useState(false);
  const [cookieAnalytics, setCookieAnalytics] = useState(false);
  const [cookieFunctional, setCookieFunctional] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: fetchError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setTheme(data.theme ?? "system");
          setFontSize(data.font_size ?? "medium");
          setEmailNotifs(data.email_notifications ?? true);
          setPushNotifs(data.push_notifications ?? true);
          setDigestMode(data.digest_mode ?? false);
          setCookieAnalytics(data.cookie_analytics ?? false);
          setCookieFunctional(data.cookie_functional ?? true);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    setSaveSuccess(false);

    // Strict Input Validation & Data Cleaning
    const validThemes = ["light", "dark", "system"];
    const validFontSizes = ["small", "medium", "large", "xlarge"];

    const cleanTheme = validThemes.includes(theme) ? theme : "system";
    const cleanFontSize = validFontSizes.includes(fontSize) ? fontSize : "medium";

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Unable to connect to database");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save settings");

      const { error: upsertError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          theme: cleanTheme,
          font_size: cleanFontSize,
          email_notifications: Boolean(emailNotifs),
          push_notifications: Boolean(pushNotifs),
          digest_mode: Boolean(digestMode),
          cookie_functional: Boolean(cookieFunctional),
          cookie_analytics: Boolean(cookieAnalytics),
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      // Apply theme change locally
      if (cleanTheme === "system") {
        const resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setActiveTheme(resolved);
        setTimeout(() => {
          localStorage.setItem("cognara-theme", "system");
        }, 50);
      } else {
        setActiveTheme(cleanTheme as "light" | "dark");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          {/* Skeleton Breadcrumb */}
          <div className="mb-2 h-4 w-32 rounded bg-cn-border/60 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Settings</h1>
          <p className="mt-0.5 text-sm text-cn-ink-muted">
            Loading your preferences...
          </p>
        </div>
        <div className="mx-auto w-full max-w-lg space-y-8 animate-pulse">
          <div className="h-36 rounded-2xl border border-cn-border bg-cn-surface dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
          <div className="h-44 rounded-2xl border border-cn-border bg-cn-surface dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
          <div className="h-44 rounded-2xl border border-cn-border bg-cn-surface dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 pb-12">
      {/* Page Header */}
      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-4xl font-bold text-on-surface tracking-tight">Settings</h2>
        <p className="text-lg text-on-surface-variant opacity-80">Manage your preferences, notifications, and privacy.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Appearance */}
        <SettingsSection title="Appearance" icon="palette">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SettingsSelect label="Theme Preference" value={theme} onChange={setTheme} options={[
              { value: "light", label: "Light Mode" },
              { value: "dark", label: "Dark Mode (Onyx)" },
              { value: "system", label: "System (Adaptive)" },
            ]} />
            <SettingsSelect label="Font Size" value={fontSize} onChange={setFontSize} options={[
              { value: "small", label: "Small (12px)" },
              { value: "medium", label: "Medium (16px)" },
              { value: "large", label: "Large (20px)" },
              { value: "xlarge", label: "Extra Large (24px)" },
            ]} />
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon="notifications_active">
          <div className="space-y-6">
            <SettingsToggle label="Email notifications" description="Course updates, agent insights, and billing alerts." checked={emailNotifs} onChange={setEmailNotifs} />
            <SettingsToggle label="Push notifications" description="In-browser alerts for live events and quizzes." checked={pushNotifs} onChange={setPushNotifs} />
            <SettingsToggle label="Digest mode" description="Bundle all notifications into a single daily email." checked={digestMode} onChange={setDigestMode} />
          </div>
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy & Cookies" icon="verified_user">
          <div className="space-y-4">
            <SettingsToggle label="Essential cookies" description="Authentication and security — always active." checked={true} onChange={() => {}} disabled />
            <SettingsToggle label="Functional cookies" description="Language and custom theme preferences." checked={cookieFunctional} onChange={setCookieFunctional} />
            <SettingsToggle label="Analytics cookies" description="Page views and performance metrics to improve the agent." checked={cookieAnalytics} onChange={setCookieAnalytics} />
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

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Save Footer */}
      <div className="sticky bottom-8 z-40 animate-in fade-in slide-in-from-bottom-12 duration-1000 mt-12">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="w-full bg-cn-orange text-[#5f1600] font-black py-5 rounded-[2rem] text-2xl shadow-[0_20px_50px_rgba(255,90,38,0.4)] hover:shadow-[0_25px_60px_rgba(255,90,38,0.6)] hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-300 disabled:opacity-50"
        >
          {saving ? "Saving..." : saveSuccess ? "✓ Settings Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

