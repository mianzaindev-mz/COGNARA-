"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme/theme-provider";

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

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Unable to connect to database");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save settings");

      const { error: upsertError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          theme,
          font_size: fontSize,
          email_notifications: emailNotifs,
          push_notifications: pushNotifs,
          digest_mode: digestMode,
          cookie_functional: cookieFunctional,
          cookie_analytics: cookieAnalytics,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      // Apply theme change locally
      if (theme === "system") {
        const resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setActiveTheme(resolved);
        setTimeout(() => {
          localStorage.setItem("cognara-theme", "system");
        }, 50);
      } else {
        setActiveTheme(theme as "light" | "dark");
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Settings</h1>
        <p className="mt-0.5 text-sm text-cn-ink-muted">
          Manage your preferences, notifications, and privacy.
        </p>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-8">
        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsSelect label="Theme" value={theme} onChange={setTheme} options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]} />
          <SettingsSelect label="Font Size" value={fontSize} onChange={setFontSize} options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
            { value: "xlarge", label: "Extra Large" },
          ]} />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsToggle label="Email notifications" description="Course updates, agent insights, billing" checked={emailNotifs} onChange={setEmailNotifs} />
          <SettingsToggle label="Push notifications" description="In-browser alerts for live events" checked={pushNotifs} onChange={setPushNotifs} />
          <SettingsToggle label="Digest mode" description="Bundle notifications into a daily email" checked={digestMode} onChange={setDigestMode} />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy & Cookies">
          <SettingsToggle label="Essential cookies" description="Authentication, security — required" checked={true} onChange={() => {}} disabled />
          <SettingsToggle label="Functional cookies" description="Language, theme preferences" checked={cookieFunctional} onChange={setCookieFunctional} />
          <SettingsToggle label="Analytics cookies" description="Page views, performance metrics" checked={cookieAnalytics} onChange={setCookieAnalytics} />
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger Zone" danger>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-cn-ink">Delete Account</p>
              <p className="text-xs text-cn-ink-muted">Permanently delete your data. This cannot be undone.</p>
            </div>
            <button type="button" className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-500/10">
              Delete
            </button>
          </div>
        </SettingsSection>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="w-full rounded-xl bg-cn-orange py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : saveSuccess ? "✓ Settings Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

function SettingsSection({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${danger ? "border-red-500/20 bg-red-500/5" : "border-cn-border bg-cn-surface dark:border-[#2e2a2a] dark:bg-[#1a1818]"}`}>
      <h2 className={`mb-4 text-sm font-bold ${danger ? "text-red-500" : "text-cn-ink dark:text-white"}`}>{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingsToggle({ label, description, checked, onChange, disabled }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-cn-ink dark:text-white">{label}</p>
        <p className="text-xs text-cn-ink-muted dark:text-cn-ink-subtle">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-cn-orange" : "bg-cn-border dark:bg-[#2e2a2a]"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function SettingsSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-semibold text-cn-ink dark:text-white">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-xl border border-cn-border bg-cn-canvas px-3 text-sm text-cn-ink dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white focus:border-cn-orange focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

