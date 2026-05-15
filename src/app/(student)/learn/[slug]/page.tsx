import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCourseLearnContext } from "@/lib/student/lesson-viewer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — Lesson viewer` };
}

export default async function LearnCoursePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const ctx = await loadCourseLearnContext(slug, user.id);
  if (!ctx) {
    notFound();
  }

  const firstLesson = ctx.lessons[0];
  const totalMins = ctx.lessons.reduce((s, l) => s + (l.durationMins ?? 0), 0);

  return (
    <div className="flex flex-col gap-8">
      <nav className="text-sm text-cn-ink-muted">
        <Link href="/my-courses" className="hover:text-cn-orange">
          My courses
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-cn-ink">{ctx.title}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/my-courses"
            className="inline-flex items-center gap-1 text-sm font-semibold text-cn-orange hover:underline"
          >
            ← Back
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">{ctx.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-cn-yellow/90 px-3 py-1 text-xs font-bold text-cn-sidebar">
              {ctx.totalLessons} lessons
            </span>
            {totalMins > 0 ? (
              <span className="rounded-full bg-cn-lavender/50 px-3 py-1 text-xs font-bold text-cn-ink">
                {Math.floor(totalMins / 60)}h {totalMins % 60}m
              </span>
            ) : null}
            <span className="rounded-full bg-cn-orange/15 px-3 py-1 text-xs font-bold text-cn-orange">
              {ctx.progressPct}% complete
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[1.75rem] bg-cn-lavender/25 border border-cn-border">
            <div className="absolute inset-0 bg-gradient-to-br from-cn-lavender/20 to-cn-yellow/10" />
            <Link
              href={firstLesson ? `/learn/${slug}/lesson/${firstLesson.orderIndex}` : "#"}
              className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-cn-orange text-white shadow-xl transition hover:scale-105 hover:bg-cn-orange-hover"
              aria-label="Play lesson"
            >
              <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </Link>
            <p className="absolute bottom-4 left-4 right-4 text-center text-sm text-cn-ink-muted">
              Video player connects when Mux is configured — structure matches Learnify mockup.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(["Description", "Materials", "Home task"] as const).map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  i === 0
                    ? "bg-cn-sidebar text-white"
                    : "border border-cn-border bg-cn-surface text-cn-ink-muted hover:text-cn-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="cn-card mt-4 p-6">
            <p className="text-sm leading-relaxed text-cn-ink-muted">
              {firstLesson
                ? `Start with “${firstLesson.title}”. Lesson content and timestamps load from Supabase when seeded.`
                : "No lessons in this course yet — add rows in the lessons table."}
            </p>
          </div>
        </section>

        <aside className="cn-card overflow-hidden p-0">
          <p className="border-b border-cn-border px-5 py-4 text-sm font-bold text-cn-ink">Course content</p>
          <ul className="max-h-[420px] overflow-y-auto">
            {ctx.lessons.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-cn-ink-muted">No lessons yet.</li>
            ) : (
              ctx.lessons.map((lesson) => (
                <li key={lesson.id} className="border-b border-cn-border last:border-0">
                  <Link
                    href={`/learn/${slug}/lesson/${lesson.orderIndex}`}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm transition hover:bg-cn-canvas"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cn-orange/15 text-xs font-bold text-cn-orange">
                      {String(lesson.orderIndex).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-cn-ink">{lesson.title}</span>
                      {lesson.durationMins ? (
                        <span className="text-xs text-cn-ink-subtle">{lesson.durationMins} min</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
