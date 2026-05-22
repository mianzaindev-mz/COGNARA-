import Link from "next/link";
import type { CourseLearnContext } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";

type ChapterRoadmapProps = {
  ctx: CourseLearnContext;
};

export function ChapterRoadmap({ ctx }: ChapterRoadmapProps) {
  const completed = new Set(ctx.completedLessonIds);
  const firstIncomplete = ctx.lessons.find((lesson) => !completed.has(lesson.id)) ?? ctx.lessons[0];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cn-border bg-[#f8f3e7] p-4 shadow-[var(--cn-shadow-card)] dark:bg-[#14110d] sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-[8%] top-[12%] h-28 w-40 rounded-[55%_45%_60%_40%] bg-emerald-300/35 blur-sm dark:bg-emerald-700/20" />
        <div className="absolute right-[10%] top-[20%] h-32 w-44 rounded-[45%_55%_50%_50%] bg-amber-300/40 blur-sm dark:bg-amber-700/20" />
        <div className="absolute bottom-[10%] left-[34%] h-36 w-56 rounded-[55%_45%_45%_55%] bg-sky-300/30 blur-sm dark:bg-sky-700/20" />
      </div>

      <div className="relative mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cn-orange">Chapter Roadmap</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-cn-ink dark:text-white">Learning islands</h2>
        </div>
        <span className="rounded-xl border border-cn-border bg-white/70 px-3 py-2 text-xs font-bold text-cn-ink-muted dark:bg-black/30">
          {ctx.progressPct}% explored
        </span>
      </div>

      <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-amber-900/10 bg-[linear-gradient(135deg,rgba(255,255,255,.55),rgba(255,244,210,.45))] p-4 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,.05),rgba(0,0,0,.18))]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M90 455 C 220 360, 235 205, 365 238 S 505 395, 610 285 S 760 110, 910 150"
            fill="none"
            stroke="rgba(180,120,40,.35)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="10 24"
          />
          <path
            d="M90 455 C 220 360, 235 205, 365 238 S 505 395, 610 285 S 760 110, 910 150"
            fill="none"
            stroke="rgba(255,255,255,.45)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {ctx.lessons.map((lesson, index) => {
          const count = Math.max(ctx.lessons.length - 1, 1);
          const progress = index / count;
          const x = 8 + progress * 84;
          const y = 74 - Math.sin(progress * Math.PI * 2.2) * 26 - progress * 48;
          const isDone = completed.has(lesson.id);
          const isCurrent = firstIncomplete?.id === lesson.id;
          const locked = !isDone && !isCurrent && index > 0 && !completed.has(ctx.lessons[index - 1]?.id);

          return (
            <Link
              key={lesson.id}
              href={`/learn/${ctx.slug}/lesson/${lesson.orderIndex}`}
              className={cn(
                "absolute flex w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition-all duration-200 ease-out hover:scale-[1.03]",
                locked && "opacity-55",
              )}
              style={{ left: `${x}%`, top: `${Math.max(16, Math.min(84, y))}%` }}
            >
              <span
                className={cn(
                  "relative flex h-16 w-16 items-center justify-center rounded-[1.25rem] border-2 text-sm font-black shadow-lg",
                  isDone && "border-emerald-300 bg-emerald-500 text-white",
                  isCurrent && "border-cn-orange bg-cn-orange text-white shadow-cn-orange/30",
                  !isDone && !isCurrent && "border-amber-200 bg-white text-cn-ink-muted dark:border-white/10 dark:bg-black/40",
                )}
              >
                {isDone ? "OK" : String(lesson.orderIndex).padStart(2, "0")}
                {isCurrent ? <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-cn-yellow ring-4 ring-cn-yellow/20" /> : null}
              </span>
              <span className="mt-2 line-clamp-2 rounded-xl border border-cn-border bg-white/75 px-3 py-2 text-[11px] font-bold leading-tight text-cn-ink backdrop-blur dark:bg-black/45 dark:text-white">
                {lesson.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
