"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cognara-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-[1.35rem] border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] sm:left-auto sm:right-6"
    >
      <p className="text-sm font-bold text-cn-ink">Cookies & privacy</p>
      <p className="mt-1.5 text-xs leading-relaxed text-cn-ink-muted">
        We use essential cookies for sign-in and preferences. See our{" "}
        <Link href="/legal/privacy" className="font-semibold text-cn-orange hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="flex-1 rounded-full bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
        >
          Accept
        </button>
        <Link
          href="/legal/privacy"
          className="flex items-center justify-center rounded-full border border-cn-border px-4 py-2.5 text-sm font-semibold text-cn-ink-muted transition hover:text-cn-ink"
        >
          Learn more
        </Link>
      </div>
    </div>
  );
}
