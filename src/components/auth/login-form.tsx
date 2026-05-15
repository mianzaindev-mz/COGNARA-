"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginSchema } from "@/lib/validation/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError(
        "Backend not connected. Add Supabase keys to .env.local and restart the dev server.",
      );
      return;
    }

    setLoading(true);
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (signError) {
      setError(signError.message);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  const oauthError = searchParams.get("error");

  return (
    <div className="flex flex-col gap-8">
      {oauthError ? (
        <div className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-left text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-100">
          <p className="font-medium">
            {oauthError === "oauth"
              ? "OAuth sign-in failed."
              : "Authentication configuration error."}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {oauthError === "oauth"
              ? "Try again or use email. If it persists, confirm redirect URLs in Supabase."
              : "Check NEXT_PUBLIC_SUPABASE_* in .env.local and Supabase redirect URLs."}
          </p>
        </div>
      ) : null}

      <OAuthButtons redirectTo={redirectTo} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-cn-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-cn-surface px-3 text-cn-ink-subtle">or email</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-cn-ink">Email</span>
          <input
            autoComplete="email"
            className="h-12 rounded-2xl border border-cn-border bg-cn-canvas px-4 text-cn-ink outline-none focus:ring-2 focus:ring-cn-orange/35"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-cn-ink">Password</span>
          <input
            autoComplete="current-password"
            className="h-12 rounded-2xl border border-cn-border bg-cn-canvas px-4 text-cn-ink outline-none focus:ring-2 focus:ring-cn-orange/35"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <p>{error}</p>
            {(error.includes("Backend") || error.includes(".env.local")) ? (
              <Link href="/setup" className="mt-1.5 inline-block text-xs font-semibold text-cn-orange hover:underline">
                Setup checklist →
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-cn-orange text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-cn-ink-muted">
        <Link className="font-semibold text-cn-orange hover:underline" href="/forgot-password">
          Forgot password?
        </Link>
      </p>
    </div>
  );
}
