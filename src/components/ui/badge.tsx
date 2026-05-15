type BadgeProps = {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "indigo" | "outline";
  size?: "sm" | "md";
  children: React.ReactNode;
  dot?: boolean;
};

const variants: Record<string, string> = {
  default:  "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  success:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning:  "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  danger:   "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  info:     "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  indigo:   "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  outline:  "border border-cn-border bg-transparent text-cn-ink-muted",
};

const dotColors: Record<string, string> = {
  default:  "bg-neutral-500",
  success:  "bg-emerald-500",
  warning:  "bg-amber-500",
  danger:   "bg-rose-500",
  info:     "bg-sky-500",
  indigo:   "bg-indigo-500",
  outline:  "bg-cn-ink-subtle",
};

export function Badge({ variant = "default", size = "sm", children, dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
      size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
    } ${variants[variant]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
