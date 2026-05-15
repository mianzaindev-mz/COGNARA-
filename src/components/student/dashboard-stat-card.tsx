import { cn } from "@/lib/utils/cn";

type DashboardStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "orange" | "lavender" | "yellow";
};

const accentRing: Record<NonNullable<DashboardStatCardProps["accent"]>, string> = {
  default: "border-cn-border",
  orange: "border-cn-orange/25 shadow-[0_8px_28px_-16px_rgba(255,87,52,0.55)]",
  lavender: "border-cn-lavender/35 shadow-[0_8px_28px_-16px_rgba(190,148,245,0.45)]",
  yellow: "border-cn-yellow/50 shadow-[0_8px_28px_-16px_rgba(252,204,66,0.5)]",
};

export function DashboardStatCard({
  label,
  value,
  hint,
  accent = "default",
}: DashboardStatCardProps) {
  return (
    <div
      className={cn(
        "cn-card p-5 transition hover:-translate-y-0.5 hover:shadow-md",
        accentRing[accent],
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-cn-ink-subtle">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-cn-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-cn-ink-muted">{hint}</p> : null}
    </div>
  );
}
