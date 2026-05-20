"use client";

import { useState } from "react";
import { SettingsSection, SettingsToggle } from "@/components/ui/settings-ui";

export function AdminSettingsClient() {
  const [flags, setFlags] = useState({
    AI_AGENT: true,
    CODE_EDITOR: true,
    NOTEBOOK: true,
    PEER_SESSIONS: true,
    PAYMENTS_STRIPE: true,
    LIVE_CLASSES: false,
    GITHUB_IMPORT: false,
    LINKEDIN_CERTS: false,
  });

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(f => ({ ...f, [key]: !f[key] }));
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Platform Settings</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Configure platform-wide settings and feature flags</p>
      </section>

      {/* Feature Flags */}
      <SettingsSection title="Feature Flags">
        {[
          { name: "AI Agent", key: "AI_AGENT" },
          { name: "Code Editor", key: "CODE_EDITOR" },
          { name: "Notebook", key: "NOTEBOOK" },
          { name: "Peer Sessions", key: "PEER_SESSIONS" },
          { name: "Stripe Payments", key: "PAYMENTS_STRIPE" },
          { name: "Live Classes", key: "LIVE_CLASSES" },
          { name: "GitHub Import", key: "GITHUB_IMPORT" },
          { name: "LinkedIn Certs", key: "LINKEDIN_CERTS" },
        ].map(f => (
          <SettingsToggle
            key={f.key}
            label={f.name}
            description={`Key: ${f.key}`}
            checked={flags[f.key as keyof typeof flags]}
            onChange={() => toggleFlag(f.key as keyof typeof flags)}
          />
        ))}
      </SettingsSection>

      {/* Maintenance */}
      <SettingsSection title="Maintenance Mode" danger>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-cn-ink">Maintenance Mode</p>
            <p className="text-xs text-cn-ink-muted">When enabled, all users see a maintenance page. Admin access is preserved.</p>
          </div>
          <button className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-500/10">
            Enable
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
