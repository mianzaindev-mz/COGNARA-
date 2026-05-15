import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/student/course-card";
import { loadStudentEnrollments } from "@/lib/student/enrollments";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My courses — COGNARA™",
};

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [enrollments, catalog] = await Promise.all([
    loadStudentEnrollments(user.id),
    loadPublishedCourses(6),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">My courses</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">
          {enrollments.length > 0
            ? `${enrollments.length} enrolled — pick up where you left off.`
            : "You are not enrolled yet. Browse the catalog below or seed demo data in Supabase."}
        </p>
      </div>

      {enrollments.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-cn-ink">Continue learning</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((c) => (
              <li key={c.enrollmentId}>
                <CourseCard
                  title={c.title}
                  category={c.category}
                  progressDone={c.progressDone}
                  totalLessons={c.totalLessons}
                  href={`/learn/${c.slug}`}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="cn-callout p-6">
          <p className="font-bold text-cn-ink">No enrollments yet</p>
          <p className="mt-2 text-sm text-cn-ink-muted">
            Run <code className="font-mono text-xs">docs/supabase/demo_seed.sql</code> in Supabase (after schema) to
            attach sample courses to your user, or enroll from the catalog when checkout ships.
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-flex rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
          >
            Browse catalog
          </Link>
        </div>
      )}

      {catalog.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-cn-ink">Explore catalog</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {catalog.map((c) => (
              <li key={c.id} className="cn-card flex flex-col p-6">
                <span className="w-fit rounded-full bg-cn-yellow/90 px-3 py-1 text-xs font-bold text-cn-sidebar">
                  {c.category ?? "Course"}
                </span>
                <h3 className="mt-3 font-bold text-cn-ink">{c.title}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-cn-ink-muted">{c.description}</p>
                <Link
                  href="/courses"
                  className="mt-4 text-sm font-semibold text-cn-orange hover:underline"
                >
                  View in catalog →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
