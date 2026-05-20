"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IconClipboard } from "@/components/ui/icons";

type QuizItem = {
  id: string;
  title: string;
  course: string;
  questions: number;
  bestScore: number | null;
  attempts: number;
  passed: boolean;
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [filter, setFilter] = useState<"all" | "passed" | "pending">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get enrollments with course info
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select(`
            id,
            progress_pct,
            course_id,
            courses!enrollments_course_id_fkey(
              id,
              title,
              total_lessons,
              coach_id
            )
          `)
          .eq("student_id", user.id);

        if (!enrollments || enrollments.length === 0) {
          setQuizzes([]);
          return;
        }

        const courseIds = enrollments.map((e: any) => e.course_id);

        // Fetch all lessons of these courses to find quizzes linked to lessons
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id, course_id")
          .in("course_id", courseIds);

        const lessonIds = lessons?.map((l: any) => l.id) ?? [];

        // Fetch quizzes
        let quizzesList: any[] = [];
        if (lessonIds.length > 0) {
          const { data: qList } = await supabase
            .from("quizzes")
            .select("*")
            .in("lesson_id", lessonIds);
          quizzesList = qList ?? [];
        }

        // Fetch quiz attempts
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("student_id", user.id);

        const items: QuizItem[] = enrollments.map((e: any) => {
          const course: any = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          if (!course) return null;

          // Find lessons belonging to this course
          const courseLessons = lessons?.filter((l: any) => l.course_id === course.id) ?? [];
          const courseLessonIds = courseLessons.map((cl: any) => cl.id);

          // Locate quiz associated with this course
          const quiz = quizzesList?.find((q: any) => q.lesson_id && courseLessonIds.includes(q.lesson_id))
            || quizzesList?.find((q: any) => q.title && course.title && q.title.includes(course.title));

          // Get attempts for this specific quiz
          const courseAttempts = quiz ? (attempts?.filter((a: any) => a.quiz_id === quiz.id) ?? []) : [];
          const bestScore = courseAttempts.length > 0 ? Math.max(...courseAttempts.map((a: any) => a.score ?? 0)) : null;
          const attemptsCount = courseAttempts.length;
          const passed = courseAttempts.some((a: any) => a.passed);

          return {
            id: e.id, // Enrollment ID
            title: quiz?.title ?? `${course.title} — Final Quiz`,
            course: course.title,
            questions: 5, // Default/fallback question count
            bestScore,
            attempts: attemptsCount,
            passed,
          };
        }).filter((item: any): item is QuizItem => item !== null);

        setQuizzes(items);
      } catch (err) {
        console.error("Failed to load quizzes list:", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = quizzes.filter((q) => {
    if (filter === "passed") return q.passed;
    if (filter === "pending") return !q.passed;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Quizzes</h1>
          <p className="mt-0.5 text-sm text-cn-ink-muted">Loading available quizzes...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-44 rounded-2xl border border-cn-border bg-cn-surface animate-pulse dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
          <div className="h-44 rounded-2xl border border-cn-border bg-cn-surface animate-pulse dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Quizzes</h1>
        <p className="mt-0.5 text-sm text-cn-ink-muted">
          Test your knowledge. Pass score: 70%. Max 3 attempts per quiz.
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "passed", "pending"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              filter === f
                ? "bg-cn-orange text-white"
                : "border border-cn-border text-cn-ink-muted hover:text-cn-ink dark:border-[#2e2a2a] dark:hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center dark:border-[#2e2a2a] dark:bg-[#1a1818]">
          <IconClipboard className="mb-4 h-8 w-8 text-cn-ink-muted" />
          <h2 className="text-lg font-bold text-cn-ink dark:text-white">No quizzes available</h2>
          <p className="mt-1 text-sm text-cn-ink-muted max-w-sm">Enroll in courses to unlock quizzes.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((quiz) => (
            <div
              key={quiz.id}
              className="cn-card-lift flex flex-col rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] transition hover:border-cn-orange/30 dark:border-[#2e2a2a] dark:bg-[#1a1818]"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-cn-ink dark:text-white">{quiz.title}</h3>
                  <p className="text-xs text-cn-ink-muted">{quiz.course}</p>
                </div>
                {quiz.passed ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">✓ Passed</span>
                ) : quiz.attempts > 0 ? (
                  <span className="rounded-full bg-cn-yellow/15 px-2.5 py-1 text-xs font-bold text-cn-yellow">Retry</span>
                ) : (
                  <span className="rounded-full bg-cn-border/50 px-2.5 py-1 text-xs font-bold text-cn-ink-subtle dark:bg-[#2e2a2a]">New</span>
                )}
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-cn-canvas p-2 dark:bg-[#0f0e0e]">
                  <p className="font-bold text-cn-ink dark:text-white">{quiz.questions}</p>
                  <p className="text-cn-ink-subtle">Questions</p>
                </div>
                <div className="rounded-xl bg-cn-canvas p-2 dark:bg-[#0f0e0e]">
                  <p className="font-bold text-cn-ink dark:text-white">{quiz.bestScore ?? "—"}%</p>
                  <p className="text-cn-ink-subtle">Best Score</p>
                </div>
                <div className="rounded-xl bg-cn-canvas p-2 dark:bg-[#0f0e0e]">
                  <p className="font-bold text-cn-ink dark:text-white">{quiz.attempts}/3</p>
                  <p className="text-cn-ink-subtle">Attempts</p>
                </div>
              </div>

              <Link href={`/quizzes/${quiz.id}`} className="mt-auto w-full">
                <button
                  type="button"
                  disabled={(quiz.attempts >= 3 && !quiz.passed) || quiz.passed}
                  className="w-full rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50"
                >
                  {quiz.passed ? "Passed" : quiz.attempts >= 3 ? "Max Attempts Reached" : quiz.attempts === 0 ? "Start Quiz" : "Try Again"}
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
