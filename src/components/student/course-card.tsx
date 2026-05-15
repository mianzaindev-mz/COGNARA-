import Link from "next/link";
import { getCourseCardStyle } from "@/lib/student/course-styles";

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
      className={`flex flex-col rounded-[1.75rem] border p-5 shadow-[var(--cn-shadow-card)] ${tint} ${compact ? "" : "min-h-[280px]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge}`}>
          {category ?? "Course"}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-cn-ink">{title}</h3>
      <p className="mt-3 text-xs font-medium text-cn-ink-muted">
        {progressDone}/{totalLessons} lessons · {pct}%
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cn-surface/70">
        <div className="h-full rounded-full bg-cn-orange transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-auto flex justify-end pt-5">
        <Link
          href={href}
          className="rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover"
        >
          Continue
        </Link>
      </div>
    </article>
  );
}
