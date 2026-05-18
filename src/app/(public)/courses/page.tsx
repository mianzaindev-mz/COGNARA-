import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { CatalogCourseCard } from "@/components/public/catalog-course-card";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";
import { loadStudentEnrollments } from "@/lib/student/enrollments";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { IconBook, IconGraduate, IconChartBar, IconBrain, IconTarget, IconUsers } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Browse courses — COGNARA™",
};

const demoCourses = [
  {
    title: "Python Fundamentals",
    category: "Computer Science",
    desc: "Master Python from zero to confident. Covers variables, functions, OOP, file I/O, and real-world projects.",
    lessons: 12,
    students: 42,
    difficulty: "Beginner",
    tint: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-500/15",
    icon: IconBrain,
    slug: "python-fundamentals",
  },
  {
    title: "JavaScript & the Modern Web",
    category: "Computer Science",
    desc: "Deep dive into ES6+, async/await, DOM manipulation, and building interactive web apps.",
    lessons: 15,
    students: 38,
    difficulty: "Intermediate",
    tint: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-500/15",
    icon: IconBook,
    slug: "javascript-modern-web",
  },
  {
    title: "Data Structures & Algorithms",
    category: "Computer Science",
    desc: "Essential DSA for coding interviews. Arrays, trees, graphs, dynamic programming with visuals.",
    lessons: 20,
    students: 27,
    difficulty: "Advanced",
    tint: "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-500/15",
    icon: IconChartBar,
    slug: "data-structures-algorithms",
  },
  {
    title: "UI/UX Design Principles",
    category: "Design",
    desc: "Learn user-centered design, wireframing, prototyping, and design systems using Figma.",
    lessons: 10,
    students: 55,
    difficulty: "Beginner",
    tint: "bg-violet-50/80 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-500/15",
    icon: IconTarget,
    slug: "ui-ux-design",
  },
  {
    title: "Business Communication",
    category: "Business",
    desc: "Master professional writing, presentations, and cross-cultural communication skills.",
    lessons: 8,
    students: 31,
    difficulty: "Beginner",
    tint: "bg-sky-50/80 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-500/15",
    icon: IconUsers,
    slug: "business-communication",
  },
  {
    title: "Machine Learning Essentials",
    category: "Data & AI",
    desc: "Introduction to ML concepts, supervised/unsupervised learning, and building models with scikit-learn.",
    lessons: 18,
    students: 19,
    difficulty: "Intermediate",
    tint: "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200/50 dark:border-indigo-500/15",
    icon: IconGraduate,
    slug: "machine-learning-essentials",
  },
] as const;

const difficultyColor: Record<string, string> = {
  Beginner: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  Intermediate: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  Advanced: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
};

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const searchQuery = params.q ?? "";
  const courses = await loadPublishedCourses(12, searchQuery);

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
    <div className="w-full px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cn-orange">Catalog</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cn-ink sm:text-4xl">Browse courses</h1>
        <p className="mt-3 text-sm leading-relaxed text-cn-ink-muted">
          {courses.length > 0
            ? "Enroll free while checkout is in development — progress syncs to your student dashboard."
            : "Explore our demo catalog below. Connect Supabase and run demo_seed.sql for live data."}
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
        <ul className="cn-stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <ul className="cn-stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoCourses.map((c) => {
            const Icon = c.icon;
            return (
              <li
                key={c.slug}
                className={`cn-card-lift flex flex-col rounded-2xl border p-6 transition-all ${c.tint}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-cn-surface/80 px-3 py-1 text-[10px] font-bold text-cn-ink">
                    {c.category}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${difficultyColor[c.difficulty] ?? ""}`}>
                    {c.difficulty}
                  </span>
                </div>

                {/* Icon + Title */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cn-surface/60">
                    <Icon className="h-5 w-5 text-cn-ink-muted" />
                  </div>
                  <h2 className="text-base font-bold leading-snug text-cn-ink">{c.title}</h2>
                </div>

                {/* Description */}
                <p className="mt-3 flex-1 text-xs leading-relaxed text-cn-ink-muted">{c.desc}</p>

                {/* Meta */}
                <div className="mt-4 flex items-center gap-4 border-t border-cn-border/40 pt-4 text-[10px] text-cn-ink-subtle">
                  <span className="flex items-center gap-1">
                    <IconBook className="h-3 w-3" /> {c.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <IconUsers className="h-3 w-3" /> {c.students} enrolled
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href="/register"
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
                >
                  Enroll free
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
