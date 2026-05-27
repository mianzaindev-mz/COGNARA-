import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LearnCurriculum } from "@/components/student/learn-curriculum";
import { ChapterRoadmap } from "@/components/student/chapter-roadmap";
import { loadCourseLearnContext } from "@/lib/student/lesson-viewer";
import { getDifficultyStyle } from "@/lib/student/course-styles";

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
  const isComplete = ctx.progressPct >= 100;
  const diff = getDifficultyStyle(ctx.difficulty);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-cn-ink-muted">
        <Link href="/my-courses" className="transition hover:text-cn-orange">
          My courses
        </Link>
        <ChevronRight />
        <span className="font-semibold text-cn-ink dark:text-white">{ctx.title}</span>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden rounded-3xl border border-cn-border shadow-[var(--cn-shadow-card)] dark:border-white/8">
        {/* Background */}
        <div className="relative h-64 sm:h-72">
          {ctx.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ctx.thumbnailUrl}
              alt={ctx.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-cn-orange/15 via-cn-lavender/20 to-cn-yellow/15 dark:from-cn-orange/8 dark:via-cn-lavender/5 dark:to-transparent" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {firstIncomplete ? (
              <Link
                href={`/learn/${slug}/lesson/${firstIncomplete.orderIndex}`}
                className="group flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md ring-2 ring-white/25 transition-all hover:scale-110 hover:bg-white/25 hover:ring-white/40"
                aria-label="Play next lesson"
              >
                <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Link>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/90 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Course Complete
              </div>
            )}
            {firstIncomplete && (
              <p className="mt-3 max-w-sm text-center text-sm text-white/80 backdrop-blur-sm">
                {completedCount > 0 ? "Continue:" : "Start with:"}{" "}
                <span className="font-semibold text-white">{firstIncomplete.title}</span>
              </p>
            )}
          </div>

          {/* Course info overlay — bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {ctx.title}
            </h1>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-cn-border/50 bg-cn-surface/80 px-6 py-4 backdrop-blur-sm dark:border-white/5 dark:bg-[#12100f]/90">
          {ctx.difficulty && (
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${diff.classes}`}>
              {diff.icon} {ctx.difficulty}
            </span>
          )}
          <StatPill icon="📚" label={`${ctx.totalLessons} lessons`} />
          {totalMins > 0 && (
            <StatPill
              icon="⏱"
              label={totalMins >= 60 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` : `${totalMins}m`}
            />
          )}
          <StatPill
            icon={isComplete ? "✅" : "📊"}
            label={`${completedCount}/${ctx.lessons.length || ctx.totalLessons} done · ${ctx.progressPct}%`}
            accent
          />
          {ctx.totalEnrolled > 0 && (
            <StatPill icon="👥" label={`${ctx.totalEnrolled} enrolled`} />
          )}
          {ctx.category && (
            <StatPill icon="🏷" label={ctx.category} />
          )}
          <div className="ml-auto">
            {firstIncomplete ? (
              <Link
                href={`/learn/${slug}/lesson/${firstIncomplete.orderIndex}`}
                className="inline-flex items-center gap-2 rounded-xl bg-cn-orange px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-cn-orange-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {completedCount > 0 ? "Resume learning" : "Start course"}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Main Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          {/* Description card */}
          {ctx.description && (
            <div className="rounded-3xl border border-cn-border bg-cn-surface p-6 shadow-[var(--cn-shadow-card)] dark:border-white/8 dark:bg-[#12100f]">
              <h2 className="text-lg font-bold text-cn-ink dark:text-white">About this course</h2>
              <p className="mt-3 text-sm leading-relaxed text-cn-ink-muted">{ctx.description}</p>
            </div>
          )}

          {/* What you'll learn */}
          {ctx.lessons.length > 0 && (
            <div className="rounded-3xl border border-cn-border bg-cn-surface p-6 shadow-[var(--cn-shadow-card)] dark:border-white/8 dark:bg-[#12100f]">
              <h2 className="text-lg font-bold text-cn-ink dark:text-white">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {ctx.lessons.slice(0, 8).map((lesson) => (
                  <li key={lesson.id} className="flex items-start gap-2 text-sm text-cn-ink-muted">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-cn-orange" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{lesson.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chapter Roadmap */}
          <ChapterRoadmap ctx={ctx} />
        </section>

        {/* Sidebar — sticky curriculum */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <LearnCurriculum ctx={ctx} maxHeight="max-h-[calc(100vh-12rem)]" />
        </div>
      </div>
    </div>
  );
}

/* ── Small Components ── */

function StatPill({ icon, label, accent }: { icon: string; label: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
        accent
          ? "bg-cn-orange/10 text-cn-orange"
          : "bg-cn-canvas/80 text-cn-ink-muted dark:bg-white/5"
      }`}
    >
      <span className="text-xs">{icon}</span>
      {label}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg className="h-3.5 w-3.5 text-cn-ink-muted/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
