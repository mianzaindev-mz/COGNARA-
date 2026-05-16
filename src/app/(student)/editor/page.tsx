import type { Metadata } from "next";
import { CodeEditorFull } from "@/components/editor/CodeEditor";

export const metadata: Metadata = {
  title: "Code Lab — COGNARA™",
  description: "Write, run, and debug code in 18+ languages with AI assistance.",
};

export default function EditorPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">
            Code Lab
          </h1>
          <p className="mt-0.5 text-sm text-cn-ink-muted">
            Write, run &amp; debug in 18+ languages — powered by Judge0 sandboxed execution.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Unlimited runs — always free
        </div>
      </div>
      <CodeEditorFull />
    </div>
  );
}
