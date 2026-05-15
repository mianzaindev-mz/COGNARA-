"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPasswordSchema } from "@/lib/validation/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "h-12 rounded-2xl border border-cn-border bg-cn-canvas px-4 text-cn-ink outline-none focus:ring-2 focus:ring-cn-orange/35";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Backend not connected. Add Supabase keys to .env.local — see /setup.");
      return;
    }

    setLoading(true);
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setInfo("If an account exists for this email, a reset link has been sent.");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-cn-ink">Email</span>
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          autoComplete="email"
          required
        />
      </label>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {info ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{info}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-2xl bg-cn-orange text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-cn-ink-muted">
        <Link className="font-semibold text-cn-orange hover:underline" href="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
