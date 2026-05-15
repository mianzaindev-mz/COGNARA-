"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "github";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

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
      <div className="rounded-xl border border-[#ff5734]/20 bg-[#ff5734]/5 p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ff5734]/15 text-[#ff5734]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-[#0A0A0A] dark:text-white">
              Social sign-in needs Supabase keys
            </p>
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              Add               <span className="font-mono text-[11px] text-[#ff5734]">NEXT_PUBLIC_SUPABASE_URL</span>{" "}
              and{" "}
              <span className="font-mono text-[11px] text-[#ff5734]">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{" "}
              to <span className="font-mono text-[11px]">.env.local</span>, then restart{" "}
              <span className="font-mono text-[11px]">npm run dev</span>. Trim any spaces around the values.
            </p>
            <Link
              href="/setup"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ff5734] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e64a2e]"
            >
              Open setup checklist
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => void signIn("google")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-900 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => void signIn("github")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 dark:border-neutral-600 dark:bg-neutral-950"
      >
        <GitHubIcon className="h-4 w-4" />
        Continue with GitHub
      </button>
    </div>
  );
}
