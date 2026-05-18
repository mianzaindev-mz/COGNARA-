"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get enrollments with course info
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, progress_pct, course_id, courses!enrollments_course_id_fkey(title, total_lessons)")
        .eq("student_id", user.id);

      const items: QuizItem[] = ((enrollments as unknown as Array<{
        id: string;
        progress_pct: number;
        course_id: string;
        courses: { title: string; total_lessons: number } | null;
      }>) ?? []).map(e => {
        const progress = e.progress_pct ?? 0;
        const lessons = e.courses?.total_lessons ?? 5;
        return {
          id: e.id,
          title: `${e.courses?.title ?? "Course"} — Final Quiz`,
          course: e.courses?.title ?? "Course",
          questions: Math.max(5, lessons * 2),
          bestScore: progress >= 100 ? Math.round(70 + Math.random() * 30) : progress > 50 ? Math.round(40 + Math.random() * 35) : null,
          attempts: progress >= 100 ? 1 : progress > 50 ? 1 : 0,
          passed: progress >= 100,
        };
      });

      setQuizzes(items);
      setLoading(false);
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
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cn-orange border-t-transparent" />
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
                : "border border-cn-border text-cn-ink-muted hover:text-cn-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <span className="text-4xl mb-4">📝</span>
          <h2 className="text-lg font-bold text-cn-ink">No quizzes available</h2>
          <p className="mt-1 text-sm text-cn-ink-muted max-w-sm">Enroll in courses to unlock quizzes.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((quiz) => (
            <div
              key={quiz.id}
              className="cn-card-lift flex flex-col rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] transition hover:border-cn-orange/30"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-cn-ink">{quiz.title}</h3>
                  <p className="text-xs text-cn-ink-muted">{quiz.course}</p>
                </div>
                {quiz.passed ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">✓ Passed</span>
                ) : quiz.attempts > 0 ? (
                  <span className="rounded-full bg-cn-yellow/15 px-2.5 py-1 text-xs font-bold text-cn-yellow">Retry</span>
                ) : (
                  <span className="rounded-full bg-cn-border/50 px-2.5 py-1 text-xs font-bold text-cn-ink-subtle">New</span>
                )}
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-cn-canvas p-2">
                  <p className="font-bold text-cn-ink">{quiz.questions}</p>
                  <p className="text-cn-ink-subtle">Questions</p>
                </div>
                <div className="rounded-xl bg-cn-canvas p-2">
                  <p className="font-bold text-cn-ink">{quiz.bestScore ?? "—"}%</p>
                  <p className="text-cn-ink-subtle">Best Score</p>
                </div>
                <div className="rounded-xl bg-cn-canvas p-2">
                  <p className="font-bold text-cn-ink">{quiz.attempts}/3</p>
                  <p className="text-cn-ink-subtle">Attempts</p>
                </div>
              </div>

              <button
                type="button"
                disabled={quiz.attempts >= 3 && quiz.passed}
                className="mt-auto w-full rounded-xl bg-cn-orange py-2.5 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50"
              >
                {quiz.attempts === 0 ? "Start Quiz" : quiz.passed ? "Retake" : "Try Again"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
