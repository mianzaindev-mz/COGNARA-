import Link from "next/link";
import type { PublicCourse } from "@/lib/courses/public-catalog";
import { EnrollCourseButton } from "@/components/student/enroll-course-button";
import { getCourseCardStyle } from "@/lib/student/course-styles";
import { IconBook, IconChartBar, IconStar, IconUsers } from "@/components/ui/icons";

type CatalogCourseCardProps = {
  course: PublicCourse;
  isLoggedIn: boolean;
  isEnrolled: boolean;
};

export function CatalogCourseCard({ course, isLoggedIn, isEnrolled }: CatalogCourseCardProps) {
  const { tint, badge } = getCourseCardStyle(course.category);
  const rating = course.avg_rating ? course.avg_rating.toFixed(1) : "New";

  return (
    <li
      className={`group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-cn-border p-5 shadow-[var(--cn-shadow-card)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg ${tint}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/50 to-transparent opacity-70 dark:from-white/5" />

      <div className="relative flex items-start justify-between gap-3">
        <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badge}`}>
          {course.category ?? "Course"}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-cn-border bg-cn-surface/80 px-2.5 py-1 text-[11px] font-bold text-cn-ink-muted">
          <IconStar className="h-3 w-3 text-amber-500" />
          {rating}
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cn-border bg-cn-surface/80 text-cn-orange shadow-sm transition group-hover:scale-105">
          <IconBook className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-black leading-tight text-cn-ink">{course.title}</h2>
      </div>

      <p className="relative mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-cn-ink-muted">
        {course.description ?? "No description yet."}
      </p>

      <div className="relative mt-5 grid grid-cols-3 gap-2 border-y border-cn-border/60 py-3">
        <span className="flex flex-col gap-1 text-[11px] text-cn-ink-subtle">
          <IconBook className="h-3.5 w-3.5 text-cn-orange" />
          <strong className="text-xs text-cn-ink">{course.total_lessons}</strong>
          lessons
        </span>
        <span className="flex flex-col gap-1 text-[11px] text-cn-ink-subtle">
          <IconUsers className="h-3.5 w-3.5 text-cn-orange" />
          <strong className="text-xs text-cn-ink">{course.total_enrolled}</strong>
          learners
        </span>
        <span className="flex flex-col gap-1 text-[11px] text-cn-ink-subtle">
          <IconChartBar className="h-3.5 w-3.5 text-cn-orange" />
          <strong className="text-xs text-cn-ink">{course.difficulty ?? "Open"}</strong>
          level
        </span>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-3">
        {isLoggedIn ? (
          <EnrollCourseButton
            courseId={course.id}
            slug={course.slug}
            alreadyEnrolled={isEnrolled}
          />
        ) : (
          <Link
            href="/register"
            className="inline-flex rounded-xl bg-cn-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
          >
            Get started
          </Link>
        )}
        {isEnrolled ? (
          <Link
            href={`/learn/${course.slug}`}
            className="text-sm font-bold text-cn-orange hover:underline"
          >
            Open course
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-bold text-cn-ink-muted hover:text-cn-ink">
            Sign in
          </Link>
        )}
      </div>
    </li>
  );
}
