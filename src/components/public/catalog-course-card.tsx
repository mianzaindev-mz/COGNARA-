import Link from "next/link";
import type { PublicCourse } from "@/lib/courses/public-catalog";
import { EnrollCourseButton } from "@/components/student/enroll-course-button";
import { getCourseCardStyle } from "@/lib/student/course-styles";

type CatalogCourseCardProps = {
  course: PublicCourse;
  isLoggedIn: boolean;
  isEnrolled: boolean;
};

export function CatalogCourseCard({ course, isLoggedIn, isEnrolled }: CatalogCourseCardProps) {
  const { tint, badge } = getCourseCardStyle(course.category);

  return (
    <li
      className={`flex flex-col rounded-[1.75rem] border border-cn-border p-6 shadow-[var(--cn-shadow-card)] transition hover:-translate-y-0.5 ${tint}`}
    >
      <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${badge}`}>
        {course.category ?? "Course"}
      </span>
      <h2 className="mt-4 text-lg font-bold leading-snug text-cn-ink">{course.title}</h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-cn-ink-muted">
        {course.description ?? "No description yet."}
      </p>
      <p className="mt-4 text-xs font-medium text-cn-ink-subtle">
        {course.total_lessons} lessons · {course.is_free ? "Free" : `$${course.price_usd}`}
        {course.total_enrolled > 0 ? ` · ${course.total_enrolled} enrolled` : ""}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isLoggedIn ? (
          <EnrollCourseButton
            courseId={course.id}
            slug={course.slug}
            alreadyEnrolled={isEnrolled}
          />
        ) : (
          <Link
            href="/register"
            className="inline-flex rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
          >
            Get started
          </Link>
        )}
        {isEnrolled ? (
          <Link
            href={`/learn/${course.slug}`}
            className="text-sm font-semibold text-cn-orange hover:underline"
          >
            Open course
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-cn-ink-muted hover:text-cn-ink">
            Sign in
          </Link>
        )}
      </div>
    </li>
  );
}
