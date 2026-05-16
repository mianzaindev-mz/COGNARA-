"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { LanguageSelector } from "./LanguageSelector";
import { OutputPanel } from "./OutputPanel";
import {
  PISTON_LANGUAGES,
  DEFAULT_CODE,
  type LanguageKey,
  type ExecutionResult,
} from "@/lib/compiler/judge0";

export function CodeEditorFull() {
  const [language, setLanguage] = useState<LanguageKey>("python");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  // Ctrl+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleLanguageChange = useCallback(
    (lang: LanguageKey) => {
      setLanguage(lang);
      // Only replace code if it's still the default for the old language
      const currentDefault = DEFAULT_CODE[language];
      if (code === currentDefault || code.trim() === "") {
        setCode(DEFAULT_CODE[lang]);
      }
    },
    [code, language],
  );

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin: stdin || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data: ExecutionResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsRunning(false);
    }
  }, [language, code, stdin]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE[language]);
    setResult(null);
    setError(null);
    editorRef.current?.focus();
  }, [language]);

  return (
    <div className="relative flex h-[calc(100vh-10rem)] flex-col gap-4 lg:flex-row">
      {/* Left: Editor */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-[var(--cn-shadow-card)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-cn-border px-4 py-2.5">
          <LanguageSelector value={language} onChange={handleLanguageChange} />

          <button
            type="button"
            onClick={() => setShowStdin(!showStdin)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              showStdin
                ? "bg-cn-orange/10 text-cn-orange"
                : "text-cn-ink-muted hover:bg-cn-border/50 hover:text-cn-ink"
            }`}
          >
            stdin
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-cn-ink-muted transition hover:bg-cn-border/50 hover:text-cn-ink"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning || !code.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              {isRunning ? "Running…" : "Run"}
            </button>
          </div>
        </div>

        {/* Stdin */}
        {showStdin && (
          <div className="border-b border-cn-border px-4 py-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-cn-ink-subtle">
              Standard Input
            </label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program…"
              rows={2}
              className="w-full resize-none rounded-lg border border-cn-border bg-cn-canvas px-3 py-2 font-mono text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-1 focus:ring-cn-orange/20"
            />
          </div>
        )}

        {/* Monaco */}
        <div className="min-h-0 flex-1">
          <Editor
            height="100%"
            language={PISTON_LANGUAGES[language].monaco}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            onMount={handleMount}
            theme="vs-dark"
            loading={
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#1e1e1e]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cn-orange" />
                <p className="text-sm text-white/40">Loading editor…</p>
              </div>
            }
            options={{
              fontSize: 14,
              fontFamily: "var(--font-mono), 'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              lineNumbers: "on",
              renderLineHighlight: "gutter",
              bracketPairColorization: { enabled: true },
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
            }}
          />
        </div>
      </div>

      {/* Right: Output */}
      <div className="flex min-h-[200px] flex-col lg:w-[38%] lg:min-h-0">
        <OutputPanel result={result} isRunning={isRunning} error={error} />
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute bottom-2 left-2 hidden text-[10px] text-cn-ink-subtle lg:block">
        Ctrl+Enter to run
      </div>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5a.5.5 0 01.77-.42l9 5.5a.5.5 0 010 .84l-9 5.5A.5.5 0 014 13.5v-11z" />
    </svg>
  );
}
