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
              ? "border-[#151313] bg-[#151313] text-white shadow-sm"
              : "border-[#151313]/15 bg-white text-[#151313]/80 hover:border-[#151313]/30",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
