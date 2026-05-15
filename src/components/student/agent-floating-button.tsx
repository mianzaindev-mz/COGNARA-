"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/utils/feature-flags";

/**
 * Master spec: agent entry on every student surface; collapses to a single control.
 * Full panel ships later — this deep-links to /agent for now.
 */
export function AgentFloatingButton() {
  const pathname = usePathname();

  if (!FEATURES.AI_AGENT) {
    return null;
  }

  if (pathname?.startsWith("/agent")) {
    return null;
  }

  return (
    <Link
      href="/agent"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-cn-orange text-2xl text-white shadow-lg shadow-cn-orange/40 transition hover:scale-105 hover:bg-cn-orange-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-ink sm:bottom-8 sm:right-8"
      aria-label="Open COGNARA AI agent"
      title="COGNARA agent"
    >
      <span aria-hidden>🤖</span>
    </Link>
  );
}
