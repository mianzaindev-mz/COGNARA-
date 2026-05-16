"use client";

import { type ReactNode } from "react";

type SidebarTooltipProps = {
  label: string;
  children: ReactNode;
};

/**
 * Wraps a sidebar icon link/button and shows a floating label
 * on hover, popping out to the right of the sidebar.
 * Fully theme-aware (dark/light).
 */
export function SidebarTooltip({ label, children }: SidebarTooltipProps) {
  return (
    <div className="group/tip relative flex items-center justify-center">
      {children}
      <div
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 ease-out group-hover/tip:pointer-events-auto group-hover/tip:ml-4 group-hover/tip:opacity-100 dark:bg-stone-700 whitespace-nowrap"
        role="tooltip"
      >
        {label}
        {/* Arrow */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800 dark:border-r-stone-700" />
      </div>
    </div>
  );
}
