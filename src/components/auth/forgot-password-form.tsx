"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPasswordSchema } from "@/lib/validation/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";

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
      setError(
        "Backend not connected. Add Supabase keys to .env.local — see /setup.",
      );
      return;
    }

    setLoading(true);
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${origin}/reset-password`,
      },
    );
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
        <span className="font-medium text-neutral-800 dark:text-neutral-100">
          Email
        </span>
        <input
          className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-900 outline-none ring-[#ff5734] focus:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          autoComplete="email"
          required
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {info ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">{info}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-lg bg-[#ff5734] text-sm font-semibold text-white transition hover:bg-[#e64a2e] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-300">
        <Link className="font-medium text-[#ff5734] hover:underline" href="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
