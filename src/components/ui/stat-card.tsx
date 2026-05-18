"use client";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "orange" | "lavender" | "yellow" | "default";
  trend?: { value: string; positive: boolean };
};

const accentMap: Record<string, { bg: string; ring: string; text: string }> = {
  indigo:   { bg: "bg-indigo-500/10 dark:bg-indigo-500/15",   ring: "ring-indigo-500/20",   text: "text-indigo-600 dark:text-indigo-400" },
  emerald:  { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", ring: "ring-emerald-500/20",  text: "text-emerald-600 dark:text-emerald-400" },
  amber:    { bg: "bg-amber-500/10 dark:bg-amber-500/15",     ring: "ring-amber-500/20",    text: "text-amber-600 dark:text-amber-400" },
  rose:     { bg: "bg-rose-500/10 dark:bg-rose-500/15",       ring: "ring-rose-500/20",     text: "text-rose-600 dark:text-rose-400" },
  sky:      { bg: "bg-sky-500/10 dark:bg-sky-500/15",         ring: "ring-sky-500/20",      text: "text-sky-600 dark:text-sky-400" },
  orange:   { bg: "bg-orange-500/10 dark:bg-orange-500/15",   ring: "ring-orange-500/20",   text: "text-orange-600 dark:text-orange-400" },
  lavender: { bg: "bg-purple-500/10 dark:bg-purple-500/15",   ring: "ring-purple-500/20",   text: "text-purple-600 dark:text-purple-400" },
  yellow:   { bg: "bg-yellow-500/10 dark:bg-yellow-500/15",   ring: "ring-yellow-500/20",   text: "text-yellow-600 dark:text-yellow-400" },
  default:  { bg: "bg-neutral-500/10 dark:bg-neutral-500/15", ring: "ring-neutral-500/20",  text: "text-neutral-600 dark:text-neutral-400" },
};

export function StatCard({ label, value, hint, icon, accent = "default", trend }: StatCardProps) {
  const a = accentMap[accent] || accentMap.default;

  return (
    <div className="cn-card-lift cn-card-shine group relative overflow-hidden rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm">
      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(135deg, transparent 60%, rgba(99,102,241,0.04) 100%)" }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">{label}</p>
          <p className="cn-count-up mt-2 text-2xl font-bold tracking-tight text-cn-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-cn-ink-muted">{hint}</p>}
          {trend && (
            <p className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.bg} ring-1 ${a.ring} transition-transform duration-300 group-hover:scale-110`}>
            <span className={a.text}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}
