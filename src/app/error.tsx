"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cn-canvas px-6 text-cn-ink">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-center text-sm text-cn-ink-muted">
        {error.message || "An unexpected error occurred. Try refreshing or return home."}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-cn-border px-5 py-2.5 text-sm font-semibold hover:bg-cn-surface"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
