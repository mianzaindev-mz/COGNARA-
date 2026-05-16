"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("system");
  const [fontSize, setFontSize] = useState("medium");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [digestMode, setDigestMode] = useState(false);
  const [cookieAnalytics, setCookieAnalytics] = useState(false);
  const [cookieFunctional, setCookieFunctional] = useState(true);

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

        <button type="button" className="w-full rounded-xl bg-cn-orange py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover">
          Save Settings
        </button>
      </div>
    </div>
  );
}

function SettingsSection({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${danger ? "border-red-500/20 bg-red-500/5" : "border-cn-border bg-cn-surface"}`}>
      <h2 className={`mb-4 text-sm font-bold ${danger ? "text-red-500" : "text-cn-ink"}`}>{title}</h2>
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
        <p className="text-sm font-semibold text-cn-ink">{label}</p>
        <p className="text-xs text-cn-ink-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-cn-orange" : "bg-cn-border"
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
      <p className="text-sm font-semibold text-cn-ink">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-xl border border-cn-border bg-cn-canvas px-3 text-sm text-cn-ink focus:border-cn-orange focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
