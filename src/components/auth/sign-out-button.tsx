"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
  /** Compact icon control for dense sidebars (e.g. student shell). */
  variant?: "default" | "icon";
};

export function SignOutButton({ className, variant = "default" }: SignOutButtonProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const base =
    "rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-900";

  const iconBase =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white";

  const mergedClass =
    variant === "icon"
      ? [iconBase, className].filter(Boolean).join(" ")
      : className
        ? `${base} ${className}`
        : base;

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className={mergedClass}
      aria-label="Sign out"
      title="Sign out"
    >
      {variant === "icon" ? (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
      ) : (
        "Sign out"
      )}
    </button>
  );
}
