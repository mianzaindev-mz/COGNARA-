"use client";

type Props = {
  balance: number | null;
  className?: string;
};

export function CreditDisplay({ balance, className }: Props) {
  const val = balance ?? 0;
  const low = val <= 5;
  const empty = val <= 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
        empty
          ? "bg-red-500/10 text-red-500"
          : low
            ? "bg-cn-yellow/15 text-cn-yellow"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      } ${className ?? ""}`}
    >
      <CreditIcon className="h-3.5 w-3.5" />
      <span className="tabular-nums">{val}</span>
      <span className="hidden sm:inline">credit{val !== 1 ? "s" : ""}</span>
      {empty && (
        <span className="ml-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px]">
          Top up
        </span>
      )}
    </div>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3.5a.5.5 0 011 0V8h2a.5.5 0 010 1H8a.5.5 0 01-.5-.5V4.5z" />
    </svg>
  );
}
