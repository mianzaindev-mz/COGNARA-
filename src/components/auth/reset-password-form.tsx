"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resetPasswordSchema } from "@/lib/validation/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "h-12 rounded-2xl border border-cn-border bg-cn-canvas px-4 text-cn-ink outline-none focus:ring-2 focus:ring-cn-orange/35";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured for this environment.");
      return;
    }

    const hash = window.location.hash;
    if (!hash || hash.length < 2) {
      setError("This page must be opened from the password reset email link (missing token).");
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      setError("Invalid or expired reset link.");
      return;
    }

    void supabase.auth.setSession({ access_token, refresh_token }).then((res: any) => {
      const sessionError = res.error;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      setSessionReady(true);
      window.history.replaceState(null, "", window.location.pathname);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured for this environment.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {!sessionReady && !error ? (
        <p className="text-sm text-cn-ink-muted">Preparing secure session…</p>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-cn-ink">New password</span>
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          autoComplete="new-password"
          disabled={!sessionReady}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-cn-ink">Confirm new password</span>
        <input
          className={inputClass}
          type="password"
          value={confirmPassword}
          onChange={(ev) => setConfirmPassword(ev.target.value)}
          autoComplete="new-password"
          disabled={!sessionReady}
          required
        />
      </label>

      <button
        type="submit"
        disabled={loading || !sessionReady}
        className="h-12 w-full rounded-2xl bg-cn-orange text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Updating…" : "Update password"}
      </button>

      <p className="text-center text-sm text-cn-ink-muted">
        <Link className="font-semibold text-cn-orange hover:underline" href="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
