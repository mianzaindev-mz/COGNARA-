import Link from "next/link";
import { FEATURES } from "@/lib/utils/feature-flags";
import { cn } from "@/lib/utils/cn";

const actions = [
  { href: "/agent?skill=teach", title: "Ask a question", cost: "1 cr", emoji: "💬" },
  { href: "/agent?skill=debug", title: "Debug code", cost: "2 cr", emoji: "🐛" },
  { href: "/agent?skill=quiz", title: "Quiz from PDF", cost: "3 cr", emoji: "📄" },
  { href: "/agent?skill=voice", title: "Voice mode", cost: "1 cr/min", emoji: "🎤" },
] as const;

type AgentQuickLaunchProps = {
  creditLabel: string;
};

export function AgentQuickLaunch({ creditLabel }: AgentQuickLaunchProps) {
  if (!FEATURES.AI_AGENT) {
    return null;
  }

  return (
    <section
      className="rounded-[1.75rem] border border-cn-border bg-cn-sidebar p-6 text-white shadow-[var(--cn-shadow-card)]"
      aria-labelledby="agent-quick-launch-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cn-orange">COGNARA agent</p>
          <h2 id="agent-quick-launch-heading" className="mt-1 text-xl font-bold tracking-tight">
            What would you like to learn today?
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Tool-using tutor — not a generic chatbot. Full history on{" "}
            <Link href="/agent" className="font-semibold text-cn-yellow underline-offset-2 hover:underline">
              /agent
            </Link>
            .
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">Balance</p>
          <p className="text-lg font-bold text-cn-yellow">{creditLabel}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              "flex flex-col rounded-2xl border border-white/10 bg-white/[0.07] p-4 transition",
              "hover:border-[#fccc42]/50 hover:bg-white/[0.12]",
            )}
          >
            <span className="text-2xl" aria-hidden>
              {a.emoji}
            </span>
            <span className="mt-2 text-sm font-bold leading-snug">{a.title}</span>
            <span className="mt-1 text-xs font-semibold text-cn-orange">{a.cost}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
