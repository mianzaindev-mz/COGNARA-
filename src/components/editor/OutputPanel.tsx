"use client";

import type { ExecutionResult } from "@/lib/compiler/judge0";

type Props = {
  result: ExecutionResult | null;
  isRunning: boolean;
  error: string | null;
};

export function OutputPanel({ result, isRunning, error }: Props) {
  const hasOutput = result || error;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-cn-border bg-cn-surface">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-cn-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isRunning
                ? "animate-pulse bg-cn-yellow"
                : result?.status?.id === 3
                  ? "bg-emerald-500"
                  : result?.status?.id
                    ? "bg-red-500"
                    : "bg-cn-ink-subtle/40"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-cn-ink-muted">
            Output
          </span>
        </div>
        {result?.time && (
          <span className="ml-auto text-[11px] tabular-nums text-cn-ink-subtle">
            {result.time}s · {result.memory ? `${(result.memory / 1024).toFixed(1)} MB` : "—"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
        {isRunning ? (
          <div className="flex items-center gap-2 text-cn-ink-muted">
            <RunningSpinner />
            <span>Running…</span>
          </div>
        ) : error ? (
          <pre className="whitespace-pre-wrap text-red-500">{error}</pre>
        ) : !hasOutput ? (
          <p className="text-cn-ink-subtle">
            Click <strong>Run</strong> to execute your code. Output appears here.
          </p>
        ) : (
          <>
            {result?.compile_output && (
              <div className="mb-3">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-cn-yellow">
                  Compile
                </span>
                <pre className="whitespace-pre-wrap text-cn-yellow/90">
                  {result.compile_output}
                </pre>
              </div>
            )}
            {result?.stderr && (
              <div className="mb-3">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-red-400">
                  Stderr
                </span>
                <pre className="whitespace-pre-wrap text-red-400">
                  {result.stderr}
                </pre>
              </div>
            )}
            {result?.stdout && (
              <div>
                {(result.stderr || result.compile_output) && (
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                    Stdout
                  </span>
                )}
                <pre className="whitespace-pre-wrap text-emerald-400">
                  {result.stdout}
                </pre>
              </div>
            )}
            {!result?.stdout && !result?.stderr && !result?.compile_output && (
              <p className="text-cn-ink-subtle">Program finished with no output.</p>
            )}
            {result?.status && result.status.id !== 3 && (
              <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">
                Status: {result.status.description}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RunningSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-cn-orange" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M12 2a10 10 0 019.95 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
