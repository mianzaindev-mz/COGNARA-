import { cn } from "@/lib/utils/cn";

type DashboardStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "default" | "orange" | "lavender" | "yellow";
};

const accentRing: Record<NonNullable<DashboardStatCardProps["accent"]>, string> = {
  default: "border-black/[0.06]",
  orange: "border-[#ff5734]/25 shadow-[0_8px_28px_-16px_rgba(255,87,52,0.55)]",
  lavender: "border-[#be94f5]/35 shadow-[0_8px_28px_-16px_rgba(190,148,245,0.45)]",
  yellow: "border-[#fccc42]/50 shadow-[0_8px_28px_-16px_rgba(252,204,66,0.5)]",
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
        "rounded-[1.35rem] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        accentRing[accent],
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-[#151313]/45">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[#151313]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#151313]/50">{hint}</p> : null}
    </div>
  );
}
