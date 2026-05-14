"use client";

import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "github";

export function OAuthButtons({ redirectTo }: { redirectTo?: string }) {
  const supabase = createClient();

  async function signIn(provider: Provider) {
    if (!supabase) return;
    const origin = window.location.origin;
    const next = redirectTo ?? "/dashboard";
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  if (!supabase) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        OAuth is unavailable: set{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
        <code className="font-mono">.env.local</code>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => void signIn("google")}
        className="flex h-11 w-full items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => void signIn("github")}
        className="flex h-11 w-full items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        Continue with GitHub
      </button>
    </div>
  );
}
