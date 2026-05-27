"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { CourseLearnContext, LessonOutline } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";

type LearnCurriculumProps = {
  ctx: CourseLearnContext;
  activeOrder?: number;
  maxHeight?: string;
};

/* ─── Group lessons into chapters ─────────────────────────────────────────── */

type ChapterGroup = {
  title: string;
  index: number;
  lessons: LessonOutline[];
  completedCount: number;
  totalMins: number;
  isLocked: boolean;
};

function groupByChapter(
  lessons: LessonOutline[],
  completedIds: Set<string>,
): ChapterGroup[] {
  // Simple heuristic: if lesson titles have "Chapter X:" prefix or
  // lesson count > 8, group every ~4 lessons into a chapter.
  // If there are only a few lessons, treat them as one chapter.
  if (lessons.length <= 4) {
    return [
      {
        title: "All Lessons",
        index: 0,
        lessons,
        completedCount: lessons.filter((l) => completedIds.has(l.id)).length,
        totalMins: lessons.reduce((s, l) => s + (l.durationMins ?? 0), 0),
        isLocked: false,
      },
    ];
  }

  const CHUNK = Math.max(3, Math.ceil(lessons.length / Math.ceil(lessons.length / 5)));
  const chapters: ChapterGroup[] = [];

  for (let i = 0; i < lessons.length; i += CHUNK) {
    const chunk = lessons.slice(i, i + CHUNK);
    const chIdx = Math.floor(i / CHUNK);
    const completedCount = chunk.filter((l) => completedIds.has(l.id)).length;
    const prevChapterComplete =
      chIdx === 0 ||
      chapters[chIdx - 1]?.completedCount === chapters[chIdx - 1]?.lessons.length;

    chapters.push({
      title: `Chapter ${chIdx + 1}`,
      index: chIdx,
      lessons: chunk,
      completedCount,
      totalMins: chunk.reduce((s, l) => s + (l.durationMins ?? 0), 0),
      isLocked: chIdx > 0 && !prevChapterComplete && completedCount === 0,
    });
  }
  return chapters;
}

/* ─── Accordion Panel ─────────────────────────────────────────────────────── */

function ChapterAccordion({
  chapter,
  completed,
  slug,
  activeOrder,
  defaultOpen,
}: {
  chapter: ChapterGroup;
  completed: Set<string>;
  slug: string;
  activeOrder?: number;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(defaultOpen ? "auto" : 0);

  useEffect(() => {
    if (isOpen) {
      const el = contentRef.current;
      if (el) {
        setHeight(el.scrollHeight);
        // After animation, set to auto for dynamic content
        const t = setTimeout(() => setHeight("auto"), 350);
        return () => clearTimeout(t);
      }
    } else {
      // Read current height first, then set to 0 in next frame
      const el = contentRef.current;
      if (el) {
        setHeight(el.scrollHeight);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setHeight(0));
        });
      }
    }
  }, [isOpen]);

  const chapterPct =
    chapter.lessons.length > 0
      ? Math.round((chapter.completedCount / chapter.lessons.length) * 100)
      : 0;
  const isChapterComplete = chapterPct >= 100;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-200",
        chapter.isLocked
          ? "border-cn-border/50 bg-cn-canvas/50 opacity-60 dark:border-white/5 dark:bg-white/2"
          : "border-cn-border bg-cn-surface dark:border-white/8 dark:bg-white/3",
      )}
    >
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => !chapter.isLocked && setIsOpen(!isOpen)}
        disabled={chapter.isLocked}
        className={cn(
          "group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
          !chapter.isLocked && "hover:bg-cn-canvas/50 dark:hover:bg-white/3",
          chapter.isLocked && "cursor-not-allowed",
        )}
      >
        {/* Completion indicator */}
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all",
            isChapterComplete
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
              : chapter.isLocked
                ? "bg-cn-border/50 text-cn-ink-muted dark:bg-white/8"
                : "bg-cn-orange/10 text-cn-orange",
          )}
        >
          {chapter.isLocked ? (
            <LockIcon />
          ) : isChapterComplete ? (
            <CheckIcon />
          ) : (
            chapter.index + 1
          )}
        </span>

        {/* Title + meta */}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-cn-ink dark:text-white">
            {chapter.title}
          </span>
          <span className="flex items-center gap-2 text-[10px] text-cn-ink-subtle">
            <span>{chapter.lessons.length} lessons</span>
            {chapter.totalMins > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span>{chapter.totalMins}m</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span
              className={cn(
                isChapterComplete ? "text-emerald-600 dark:text-emerald-400" : "text-cn-orange",
              )}
            >
              {chapterPct}%
            </span>
          </span>
        </span>

        {/* Mini progress bar */}
        <span className="hidden w-16 sm:block">
          <span className="block h-1.5 overflow-hidden rounded-full bg-cn-canvas dark:bg-white/5">
            <span
              className={cn(
                "block h-full rounded-full transition-all duration-500",
                isChapterComplete ? "bg-emerald-500" : "bg-cn-orange",
              )}
              style={{ width: `${chapterPct}%` }}
            />
          </span>
        </span>

        {/* Chevron */}
        {!chapter.isLocked && (
          <svg
            className={cn(
              "h-4 w-4 shrink-0 text-cn-ink-subtle transition-transform duration-300",
              isOpen && "rotate-180",
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>

      {/* ── Collapsible lesson list ── */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <ul className="border-t border-cn-border/50 dark:border-white/5">
          {chapter.lessons.map((lesson) => {
            const isActive = activeOrder === lesson.orderIndex;
            const isDone = completed.has(lesson.id);

            return (
              <li key={lesson.id} className="border-b border-cn-border/30 last:border-0 dark:border-white/3">
                <Link
                  href={`/learn/${slug}/lesson/${lesson.orderIndex}`}
                  className={cn(
                    "group/lesson flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150",
                    isActive
                      ? "bg-cn-orange/8 dark:bg-cn-orange/10"
                      : "hover:bg-cn-canvas/60 dark:hover:bg-white/3",
                  )}
                >
                  {/* Status icon */}
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-all",
                      isDone
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : isActive
                          ? "bg-cn-orange text-white shadow-sm shadow-cn-orange/25"
                          : "bg-cn-border/40 text-cn-ink-muted dark:bg-white/8",
                    )}
                  >
                    {isDone ? (
                      <CheckIcon />
                    ) : isActive ? (
                      <PlayIcon />
                    ) : (
                      String(lesson.orderIndex).padStart(2, "0")
                    )}
                  </span>

                  {/* Lesson info */}
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate font-semibold transition-colors",
                        isActive
                          ? "text-cn-orange"
                          : isDone
                            ? "text-cn-ink-subtle dark:text-white/60"
                            : "text-cn-ink dark:text-white",
                      )}
                    >
                      {lesson.title}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] text-cn-ink-subtle">
                      {lesson.type !== "text" && (
                        <span className="rounded bg-cn-canvas px-1 py-0.5 font-bold uppercase tracking-wider dark:bg-white/5">
                          {lesson.type}
                        </span>
                      )}
                      {lesson.durationMins ? <span>{lesson.durationMins} min</span> : null}
                    </span>
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-cn-orange animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ─── Main Curriculum Component ───────────────────────────────────────────── */

export function LearnCurriculum({
  ctx,
  activeOrder,
  maxHeight = "max-h-[600px]",
}: LearnCurriculumProps) {
  const completed = new Set(ctx.completedLessonIds);
  const chapters = groupByChapter(ctx.lessons, completed);

  // Find which chapter contains the active lesson
  const activeChapterIdx = chapters.findIndex((ch) =>
    ch.lessons.some((l) => l.orderIndex === activeOrder),
  );

  return (
    <aside className="overflow-hidden rounded-3xl border border-cn-border bg-cn-surface shadow-[var(--cn-shadow-card)] dark:border-white/8 dark:bg-[#12100f]">
      {/* Header */}
      <div className="border-b border-cn-border px-5 py-4 dark:border-white/8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-cn-ink dark:text-white">Course content</p>
          <span className="rounded-full bg-cn-orange/10 px-2.5 py-0.5 text-[10px] font-bold text-cn-orange">
            {ctx.progressPct}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-cn-canvas dark:bg-white/5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              ctx.progressPct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-cn-orange to-cn-pink",
            )}
            style={{ width: `${ctx.progressPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-cn-ink-subtle">
          {ctx.completedLessonIds.length}/{ctx.lessons.length} lessons completed
        </p>
      </div>

      {/* Chapter accordions */}
      <div className={cn("space-y-2 overflow-y-auto p-3", maxHeight)}>
        {chapters.map((chapter) => (
          <ChapterAccordion
            key={chapter.index}
            chapter={chapter}
            completed={completed}
            slug={ctx.slug}
            activeOrder={activeOrder}
            defaultOpen={chapter.index === activeChapterIdx || chapter.index === 0}
          />
        ))}
      </div>
    </aside>
  );
}

/* ─── SVG Icons ───────────────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="ml-0.5 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
