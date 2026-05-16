"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    fullName: "Demo Student",
    username: "demostudent",
    bio: "Learning Python and web development on COGNARA.",
    github: "https://github.com/demostudent",
    linkedin: "",
    language: "en",
    timezone: "Asia/Karachi",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Profile</h1>
        <p className="mt-0.5 text-sm text-cn-ink-muted">
          Your public profile is visible at cognara.app/@{profile.username}
        </p>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-cn-lavender/30 text-2xl font-bold text-cn-ink">
            {profile.fullName.charAt(0)}
          </div>
          <div>
            <button type="button" className="rounded-xl bg-cn-orange px-4 py-2 text-sm font-bold text-white transition hover:bg-cn-orange-hover">
              Upload Photo
            </button>
            <p className="mt-1 text-xs text-cn-ink-subtle">JPG, PNG. Max 2 MB.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Full Name" value={profile.fullName} onChange={(v) => setProfile({ ...profile, fullName: v })} />
          <Field label="Username" value={profile.username} onChange={(v) => setProfile({ ...profile, username: v })} prefix="@" />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-cn-ink">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-cn-border bg-cn-surface px-3 py-2.5 text-sm text-cn-ink focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
            />
            <p className="mt-1 text-right text-xs text-cn-ink-subtle">{profile.bio.length}/500</p>
          </div>
          <Field label="GitHub URL" value={profile.github} onChange={(v) => setProfile({ ...profile, github: v })} />
          <Field label="LinkedIn URL" value={profile.linkedin} onChange={(v) => setProfile({ ...profile, linkedin: v })} placeholder="https://linkedin.com/in/…" />
        </div>

        <button type="button" className="w-full rounded-xl bg-cn-orange py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, prefix, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-cn-ink">{label}</label>
      <div className="flex">
        {prefix && (
          <span className="flex items-center rounded-l-xl border border-r-0 border-cn-border bg-cn-canvas px-3 text-sm text-cn-ink-muted">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-10 w-full border border-cn-border bg-cn-surface px-3 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20 ${
            prefix ? "rounded-r-xl" : "rounded-xl"
          }`}
        />
      </div>
    </div>
  );
}
