"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    bio: "",
    github: "",
    linkedin: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("profiles")
      .select("full_name, username, bio, github_url, linkedin_url")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        fullName: data.full_name || user.user_metadata?.full_name || "",
        username: data.username || user.email?.split("@")[0] || "",
        bio: data.bio || "",
        github: data.github_url || "",
        linkedin: data.linkedin_url || "",
      });
    } else {
      // No profile row yet — use auth metadata
      setProfile({
        fullName: user.user_metadata?.full_name || "",
        username: user.email?.split("@")[0] || "",
        bio: "",
        github: "",
        linkedin: "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Database not connected");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.fullName.trim(),
          username: profile.username.trim(),
          bio: profile.bio.trim(),
          github_url: profile.github.trim() || null,
          linkedin_url: profile.linkedin.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Profile</h1>
        <div className="mx-auto w-full max-w-lg space-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-cn-surface" />
          ))}
        </div>
      </div>
    );
  }

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
            {profile.fullName.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-cn-ink">{profile.fullName || "Student"}</p>
            <p className="text-xs text-cn-ink-subtle">@{profile.username}</p>
          </div>
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}>
            {message.text}
          </div>
        )}

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
          <Field label="GitHub URL" value={profile.github} onChange={(v) => setProfile({ ...profile, github: v })} placeholder="https://github.com/username" />
          <Field label="LinkedIn URL" value={profile.linkedin} onChange={(v) => setProfile({ ...profile, linkedin: v })} placeholder="https://linkedin.com/in/…" />
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full rounded-xl bg-cn-orange py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Changes"}
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
