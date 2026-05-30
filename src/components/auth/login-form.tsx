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

    // Determine role-based dashboard redirect
    let destination = redirectTo;
    if (redirectTo === "/dashboard") {
      // Only override the default — if the user had a specific redirectTo, honor it
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .maybeSingle();
        if (profile?.role === "admin") {
          destination = "/admin/dashboard";
        } else if (profile?.role === "coach") {
          destination = "/coach/dashboard";
        }
      }
    }

    router.replace(destination);
    router.refresh();
  }

  const oauthError = searchParams.get("error");

  return (
    <>
      {oauthError ? (
        <div className="mb-6 rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-left text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-100">
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

      <div className="mb-6">
        <OAuthButtons redirectTo={redirectTo} />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-[1px] flex-1 bg-cn-border"></div>
        <span className="text-[10px] font-bold text-cn-ink-subtle uppercase tracking-widest">OR EMAIL</span>
        <div className="h-[1px] flex-1 bg-cn-border"></div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="font-semibold text-sm text-cn-ink ml-1">Email</label>
          <input
            autoComplete="email"
            className="w-full px-4 py-3 bg-cn-canvas border border-cn-border focus:border-cn-orange focus:ring-4 focus:ring-cn-orange/10 outline-none rounded-xl text-cn-ink transition-all"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="font-semibold text-sm text-cn-ink">Password</label>
            <Link className="text-xs text-cn-orange hover:underline font-medium" href="/forgot-password">
              Forgot?
            </Link>
          </div>
          <input
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-cn-canvas border border-cn-border focus:border-cn-orange focus:ring-4 focus:ring-cn-orange/10 outline-none rounded-xl text-cn-ink transition-all"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 mt-2">
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
          className="w-full py-4 bg-cn-orange text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(255,107,61,0.39)] hover:opacity-90 active:scale-[0.99] transition-all mt-6 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-cn-ink-subtle">
          No account?{" "}
          <Link className="font-medium text-cn-orange hover:underline underline-offset-4 ml-1" href="/register">
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}
