import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LearnCurriculum } from "@/components/student/learn-curriculum";
import { loadCourseLearnContext } from "@/lib/student/lesson-viewer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — COGNARA™` };
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

  const firstIncomplete =
    ctx.lessons.find((l) => !ctx.completedLessonIds.includes(l.id)) ?? ctx.lessons[0];
  const totalMins = ctx.lessons.reduce((s, l) => s + (l.durationMins ?? 0), 0);
  const completedCount = ctx.completedLessonIds.length;

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
              {completedCount}/{ctx.lessons.length || ctx.totalLessons} done · {ctx.progressPct}%
            </span>
            {ctx.category ? (
              <span className="rounded-full border border-cn-border bg-cn-surface px-3 py-1 text-xs font-bold text-cn-ink-muted">
                {ctx.category}
              </span>
            ) : null}
          </div>
        </div>
        {firstIncomplete ? (
          <Link
            href={`/learn/${slug}/lesson/${firstIncomplete.orderIndex}`}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-cn-orange px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover"
          >
            {completedCount > 0 ? "Resume" : "Start course"}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[1.75rem] border border-cn-border bg-gradient-to-br from-cn-lavender/25 to-cn-yellow/15">
            {firstIncomplete ? (
              <Link
                href={`/learn/${slug}/lesson/${firstIncomplete.orderIndex}`}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-cn-orange text-white shadow-xl transition hover:scale-105 hover:bg-cn-orange-hover"
                aria-label="Play next lesson"
              >
                <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Link>
            ) : (
              <span className="rounded-full bg-cn-yellow px-4 py-2 text-sm font-bold text-cn-sidebar">
                Course complete
              </span>
            )}
            <p className="absolute bottom-4 left-4 right-4 text-center text-sm text-cn-ink-muted">
              {firstIncomplete
                ? `Up next: “${firstIncomplete.title}”`
                : "You finished all lessons in this course."}
            </p>
          </div>

          <div className="cn-card mt-6 p-6">
            <h2 className="text-lg font-bold text-cn-ink">About this course</h2>
            <p className="mt-3 text-sm leading-relaxed text-cn-ink-muted">
              Work through lessons in order. Mark each complete to sync progress to your dashboard and
              certificates. Video playback connects when Mux is configured.
            </p>
          </div>
        </section>

        <LearnCurriculum ctx={ctx} />
      </div>
    </div>
  );
}
