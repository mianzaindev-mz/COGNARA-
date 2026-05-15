"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type CourseFilterChipsProps = {
  filters: readonly string[];
};

export function CourseFilterChips({ filters }: CourseFilterChipsProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => setActive(i)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            active === i
              ? "border-cn-sidebar bg-cn-sidebar text-white shadow-sm dark:border-cn-yellow dark:bg-cn-yellow dark:text-cn-sidebar"
              : "border-cn-border bg-cn-surface text-cn-ink-muted hover:border-cn-border-strong hover:text-cn-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
