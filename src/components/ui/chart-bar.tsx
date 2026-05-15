"use client";

type BarChartProps = {
  data: { label: string; value: number }[];
  color?: "indigo" | "emerald" | "amber" | "orange";
  height?: number;
  showValues?: boolean;
};

const barColors: Record<string, { bar: string; hover: string }> = {
  indigo:  { bar: "bg-indigo-500", hover: "group-hover:bg-indigo-400" },
  emerald: { bar: "bg-emerald-500", hover: "group-hover:bg-emerald-400" },
  amber:   { bar: "bg-amber-500", hover: "group-hover:bg-amber-400" },
  orange:  { bar: "bg-orange-500", hover: "group-hover:bg-orange-400" },
};

export function BarChart({ data, color = "indigo", height = 160, showValues = true }: BarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const c = barColors[color] || barColors.indigo;

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
            {showValues && (
              <span className="text-[10px] font-semibold text-cn-ink-subtle opacity-0 transition-opacity group-hover:opacity-100 tabular-nums">
                {d.value}
              </span>
            )}
            <div
              className={`w-full min-w-[6px] rounded-t-md ${c.bar} ${c.hover} transition-all duration-300`}
              style={{ height: `${Math.max(pct, 3)}%` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[9px] font-medium text-cn-ink-subtle truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
