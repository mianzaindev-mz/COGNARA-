"use client";

import Link from "next/link";
import { useState } from "react";
import { LearnCurriculum } from "@/components/student/learn-curriculum";
import { MarkLessonCompleteButton } from "@/components/student/mark-lesson-complete-button";
import type { CourseLearnContext, LessonOutline } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";

const TABS = ["Overview", "Materials", "Notes"] as const;

type LearnLessonPanelProps = {
  ctx: CourseLearnContext;
  lesson: LessonOutline;
  prevOrder: number | null;
  nextOrder: number | null;
};

export function LearnLessonPanel({ ctx, lesson, prevOrder, nextOrder }: LearnLessonPanelProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const completed = ctx.completedLessonIds.includes(lesson.id);

  const body =
    lesson.content?.trim() ||
    `This lesson is ready for content from Supabase (\`lessons.content\`). When Mux is connected, video will appear in the player above.`;

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm text-cn-ink-muted">
        <Link href="/my-courses" className="hover:text-cn-orange">
          My courses
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/learn/${ctx.slug}`} className="hover:text-cn-orange">
          {ctx.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-cn-ink">{lesson.title}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cn-orange">
            Lesson {lesson.orderIndex}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">{lesson.title}</h1>
          <p className="mt-2 text-sm text-cn-ink-muted">
            {lesson.type}
            {lesson.durationMins ? ` · ${lesson.durationMins} min` : ""}
          </p>
        </div>
        <MarkLessonCompleteButton
          lessonId={lesson.id}
          courseId={ctx.courseId}
          slug={ctx.slug}
          alreadyCompleted={completed}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[1.75rem] border border-cn-border bg-gradient-to-br from-cn-lavender/30 via-cn-canvas to-cn-yellow/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cn-orange text-white shadow-xl">
                <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <p className="absolute bottom-4 left-4 right-4 text-center text-xs text-cn-ink-muted">
              Video lesson preview — click play to watch.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  tab === label
                    ? "bg-cn-sidebar text-white dark:bg-cn-yellow dark:text-cn-sidebar"
                    : "border border-cn-border bg-cn-surface text-cn-ink-muted hover:text-cn-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="cn-card mt-4 p-6">
            {tab === "Overview" ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-cn-ink-muted">{body}</p>
            ) : (
              <p className="text-sm text-cn-ink-muted">
                {tab === "Materials"
                  ? "Downloadable resources appear here when coaches attach files in the lesson editor."
                  : "Personal notes and AI summaries will sync to your notebook in a future session."}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {prevOrder !== null ? (
              <Link
                href={`/learn/${ctx.slug}/lesson/${prevOrder}`}
                className="rounded-full border border-cn-border bg-cn-surface px-5 py-2.5 text-sm font-semibold text-cn-ink transition hover:border-cn-orange/40"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {nextOrder !== null ? (
              <Link
                href={`/learn/${ctx.slug}/lesson/${nextOrder}`}
                className="rounded-full bg-cn-sidebar px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cn-sidebar/90 dark:bg-cn-yellow dark:text-cn-sidebar"
              >
                Next lesson →
              </Link>
            ) : (
              <Link
                href={`/learn/${ctx.slug}`}
                className="rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
              >
                Back to course
              </Link>
            )}
          </div>
        </section>

        <LearnCurriculum ctx={ctx} activeOrder={lesson.orderIndex} />
      </div>
    </div>
  );
}
