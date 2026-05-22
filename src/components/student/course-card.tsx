import Link from "next/link";
import { getCourseCardStyle } from "@/lib/student/course-styles";
import { IconBook, IconMap, IconTarget } from "@/components/ui/icons";

export type CourseCardProps = {
  title: string;
  category: string | null;
  progressDone: number;
  totalLessons: number;
  href: string;
  compact?: boolean;
};

export function CourseCard({
  title,
  category,
  progressDone,
  totalLessons,
  href,
  compact = false,
}: CourseCardProps) {
  const { tint, badge } = getCourseCardStyle(category);
  const pct = totalLessons > 0 ? Math.round((100 * progressDone) / totalLessons) : 0;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-5 shadow-[var(--cn-shadow-card)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg ${tint} ${compact ? "" : "min-h-[300px]"}`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cn-orange/10 blur-2xl transition group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badge}`}>
          {category ?? "Course"}
        </span>
        <span className="rounded-full border border-cn-border bg-cn-surface/80 px-2.5 py-1 text-[11px] font-bold text-cn-ink-muted">
          {pct}%
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cn-border bg-cn-surface/80 text-cn-orange shadow-sm">
          <IconMap className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-black leading-tight text-cn-ink">{title}</h3>
      </div>

      <div className="relative mt-5">
        <div className="flex items-center justify-between text-[11px] font-bold text-cn-ink-subtle">
          <span className="flex items-center gap-1.5">
            <IconBook className="h-3.5 w-3.5" />
            {progressDone}/{totalLessons} lessons
          </span>
          <span className="flex items-center gap-1.5">
            <IconTarget className="h-3.5 w-3.5" />
            Roadmap
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cn-surface/70 ring-1 ring-cn-border/60">
          <div className="h-full rounded-full bg-cn-orange transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="relative mt-auto flex justify-end pt-6">
        <Link
          href={href}
          className="rounded-xl bg-cn-orange px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover"
        >
          Continue
        </Link>
      </div>
    </article>
  );
}
