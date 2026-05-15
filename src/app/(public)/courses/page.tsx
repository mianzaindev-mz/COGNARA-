import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { CatalogCourseCard } from "@/components/public/catalog-course-card";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";
import { loadStudentEnrollments } from "@/lib/student/enrollments";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Browse courses — COGNARA™",
};

const demoCourses = [
  {
    title: "Creative writing for beginners",
    category: "Marketing",
    tint: "bg-cn-yellow/25",
    slug: "creative-writing",
  },
  {
    title: "Digital illustration foundations",
    category: "Computer Science",
    tint: "bg-cn-lavender/30",
    slug: "digital-illustration",
  },
  {
    title: "Public speaking & leadership",
    category: "Psychology",
    tint: "bg-sky-100/80 dark:bg-sky-950/40",
    slug: "public-speaking",
  },
] as const;

export default async function CoursesPage() {
  const courses = await loadPublishedCourses(12);

  let isLoggedIn = false;
  let enrolledIds = new Set<string>();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        isLoggedIn = true;
        const enrollments = await loadStudentEnrollments(user.id);
        enrolledIds = new Set(enrollments.map((e) => e.courseId));
      }
    } catch {
      /* catalog still renders */
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cn-orange">Catalog</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cn-ink sm:text-4xl">Browse courses</h1>
        <p className="mt-3 text-cn-ink-muted">
          {courses.length > 0
            ? "Enroll free while checkout is in development — progress syncs to your student dashboard."
            : "Connect Supabase and run demo_seed.sql to replace preview cards with live courses."}
        </p>
        {isLoggedIn ? (
          <Link
            href="/my-courses"
            className="mt-4 inline-flex text-sm font-semibold text-cn-orange hover:underline"
          >
            Go to my courses →
          </Link>
        ) : null}
      </div>

      {courses.length > 0 ? (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CatalogCourseCard
              key={c.id}
              course={c}
              isLoggedIn={isLoggedIn}
              isEnrolled={enrolledIds.has(c.id)}
            />
          ))}
        </ul>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoCourses.map((c) => (
            <li
              key={c.slug}
              className={`flex flex-col rounded-[1.75rem] border border-cn-border p-6 ${c.tint}`}
            >
              <span className="rounded-full bg-cn-surface/80 px-3 py-1 text-xs font-bold text-cn-ink">
                {c.category}
              </span>
              <h2 className="mt-4 text-lg font-bold text-cn-ink">{c.title}</h2>
              <p className="mt-2 flex-1 text-sm text-cn-ink-muted">
                Preview card — seed Supabase to load the real catalog.
              </p>
              <Link
                href="/setup"
                className="mt-5 inline-flex w-fit rounded-full bg-cn-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
              >
                Setup database
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
