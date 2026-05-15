import Link from "next/link";
import type { UpcomingLessonRow } from "@/lib/student/upcoming-lessons";

type NextLessonsListProps = {
  lessons: UpcomingLessonRow[];
};

export function NextLessonsList({ lessons }: NextLessonsListProps) {
  if (lessons.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-cn-ink-muted">
        Enroll in a course to see upcoming lessons here.
      </p>
    );
  }

  return (
    <ul>
      {lessons.map((row) => (
        <li
          key={row.href}
          className="grid gap-3 border-b border-cn-border px-5 py-4 last:border-0 sm:grid-cols-[auto_1fr_auto]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cn-lavender/40 text-sm font-bold text-cn-sidebar">
            {row.teacherInitial}
          </span>
          <div>
            <p className="font-semibold text-cn-ink">{row.lessonLabel}</p>
            <p className="text-xs text-cn-ink-subtle">{row.courseTitle}</p>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:justify-center">
            <span className="text-xs font-medium text-cn-ink-muted">{row.durationLabel}</span>
            <Link
              href={row.href}
              className="text-sm font-semibold text-cn-orange hover:underline"
            >
              Start →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
