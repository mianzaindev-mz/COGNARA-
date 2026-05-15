import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Quiz Builder — Coach — COGNARA™" };

export default function CoachQuizzesPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Quiz Builder</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">Create quizzes manually or let AI generate them</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl border border-cn-border bg-cn-surface px-4 py-2.5 text-sm font-semibold text-cn-ink transition hover:bg-cn-canvas">
            🤖 AI Generate
          </button>
          <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700">
            + Create Quiz
          </button>
        </div>
      </section>
      <EmptyState
        icon={<span className="text-2xl">📝</span>}
        title="No quizzes yet"
        description="Create your first quiz or use AI to generate one from a topic or PDF."
      />
    </div>
  );
}
