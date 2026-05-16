"use client";

import { useState } from "react";

const DEMO_QUIZZES = [
  { id: "1", title: "Python Variables & Types", course: "Python for Beginners", questions: 10, bestScore: 85, attempts: 2, passed: true },
  { id: "2", title: "Control Flow: Loops & Conditions", course: "Python for Beginners", questions: 8, bestScore: 62, attempts: 1, passed: false },
  { id: "3", title: "Functions & Scope", course: "Python for Beginners", questions: 12, bestScore: null, attempts: 0, passed: false },
  { id: "4", title: "React Components", course: "Web Dev with React", questions: 10, bestScore: 92, attempts: 1, passed: true },
];

export default function QuizzesPage() {
  const [filter, setFilter] = useState<"all" | "passed" | "pending">("all");

  const filtered = DEMO_QUIZZES.filter((q) => {
    if (filter === "passed") return q.passed;
    if (filter === "pending") return !q.passed;
    return true;
  });

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

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((quiz) => (
          <div
            key={quiz.id}
            className="flex flex-col rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)] transition hover:border-cn-orange/30"
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
    </div>
  );
}
