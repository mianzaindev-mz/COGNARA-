"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type CourseFilterChipsProps = {
  filters: readonly string[];
  activeIndex?: number;
  onSelect?: (index: number) => void;
};

export function CourseFilterChips({
  filters,
  activeIndex: controlledIndex,
  onSelect,
}: CourseFilterChipsProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = controlledIndex !== undefined && onSelect !== undefined;
  const activeIndex = isControlled ? controlledIndex : internalIndex;

  function handleSelect(index: number) {
    if (isControlled) {
      onSelect(index);
    } else {
      setInternalIndex(index);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((label, i) => {
        const active = activeIndex === i;
        return (
          <button
            key={label}
            type="button"
            onClick={() => handleSelect(i)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              active
                ? "border-cn-sidebar bg-cn-sidebar text-white shadow-sm dark:border-cn-yellow dark:bg-cn-yellow dark:text-cn-sidebar"
                : "border-cn-border bg-cn-surface text-cn-ink-muted hover:border-cn-border-strong hover:text-cn-ink",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
