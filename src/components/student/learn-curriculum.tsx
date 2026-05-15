import Link from "next/link";
import type { CourseLearnContext } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";

type LearnCurriculumProps = {
  ctx: CourseLearnContext;
  activeOrder?: number;
  maxHeight?: string;
};

export function LearnCurriculum({ ctx, activeOrder, maxHeight = "max-h-[480px]" }: LearnCurriculumProps) {
  const completed = new Set(ctx.completedLessonIds);

  return (
    <aside className="cn-card overflow-hidden p-0">
      <div className="border-b border-cn-border px-5 py-4">
        <p className="text-sm font-bold text-cn-ink">Course content</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cn-canvas">
          <div
            className="h-full rounded-full bg-cn-orange transition-all"
            style={{ width: `${ctx.progressPct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-cn-ink-subtle">{ctx.progressPct}% complete</p>
      </div>
      <ul className={cn("overflow-y-auto", maxHeight)}>
        {ctx.lessons.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-cn-ink-muted">No lessons yet.</li>
        ) : (
          ctx.lessons.map((lesson) => {
            const isActive = activeOrder === lesson.orderIndex;
            const isDone = completed.has(lesson.id);
            return (
              <li key={lesson.id} className="border-b border-cn-border last:border-0">
                <Link
                  href={`/learn/${ctx.slug}/lesson/${lesson.orderIndex}`}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 text-sm transition",
                    isActive ? "bg-cn-orange/10" : "hover:bg-cn-canvas",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                      isDone
                        ? "bg-cn-yellow text-cn-sidebar"
                        : isActive
                          ? "bg-cn-orange text-white"
                          : "bg-cn-orange/15 text-cn-orange",
                    )}
                  >
                    {isDone ? "✓" : String(lesson.orderIndex).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-cn-ink">{lesson.title}</span>
                    {lesson.durationMins ? (
                      <span className="text-xs text-cn-ink-subtle">{lesson.durationMins} min</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
