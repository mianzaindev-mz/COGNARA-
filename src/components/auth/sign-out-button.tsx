"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";

type SignOutButtonProps = {
  className?: string;
  /** Compact icon control for dense sidebars (e.g. student shell). */
  variant?: "default" | "icon" | "sidebar";
};

export function SignOutButton({ className, variant = "default" }: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function signOut() {
    if (loading) return;
    setLoading(true);
    try {
      // Clear server-side demo session cookies first
      await fetch("/api/demo-login", { method: "DELETE" }).catch(() => {});

      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      // Hard redirect to clear all cached state
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out failed:", err);
      // Force redirect even on error
      window.location.href = "/login";
    }
  }

  const base =
    "rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-900";

  const iconBase =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white";

  const sidebarBase =
    "inline-flex h-5 w-5 shrink-0 items-center justify-center text-current";

  const mergedClass =
    variant === "icon"
      ? [iconBase, className].filter(Boolean).join(" ")
      : variant === "sidebar"
        ? [sidebarBase, className].filter(Boolean).join(" ")
        : className
          ? `${base} ${className}`
          : base;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={mergedClass}
        aria-label="Sign out"
        title="Sign out"
        disabled={loading}
        style={loading ? { opacity: 0.5, pointerEvents: "none" } : undefined}
      >
        {variant === "icon" || variant === "sidebar" ? (
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
          loading ? "Signing out…" : "Sign out"
        )}
      </button>

      <DoubleConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => void signOut()}
        title="Sign Out"
        description="Are you sure you want to sign out? You will need to log in again to access your dashboard."
        actionButtonText="Sign Out"
      />
    </>
  );
}
