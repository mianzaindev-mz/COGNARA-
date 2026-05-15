"use client";

type ProgressBarProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "indigo" | "emerald" | "amber" | "rose" | "orange" | "gradient";
  showLabel?: boolean;
  animate?: boolean;
};

const colorMap: Record<string, string> = {
  indigo:   "bg-indigo-500",
  emerald:  "bg-emerald-500",
  amber:    "bg-amber-500",
  rose:     "bg-rose-500",
  orange:   "bg-orange-500",
  gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
};

const sizeMap: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({ value, max = 100, size = "md", color = "indigo", showLabel, animate = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex items-center gap-3">
      <div className={`relative w-full overflow-hidden rounded-full bg-neutral-200/60 dark:bg-neutral-800 ${sizeMap[size]}`}>
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${colorMap[color]} ${animate ? "transition-all duration-700 ease-out" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-semibold text-cn-ink-muted tabular-nums">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
