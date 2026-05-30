"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { LanguageSelector } from "./LanguageSelector";
import { OutputPanel } from "./OutputPanel";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast-provider";
import {
  PISTON_LANGUAGES,
  DEFAULT_CODE,
  type LanguageKey,
  type ExecutionResult,
} from "@/lib/compiler/judge0";

/* ── Stdin auto-detection patterns per language ──────────── */
const STDIN_PATTERNS: Partial<Record<LanguageKey, RegExp>> = {
  python: /\binput\s*\(/,
  javascript: /\breadline\b|process\.stdin/,
  typescript: /\breadline\b|process\.stdin/,
  java: /\bScanner\b|BufferedReader|System\.in/,
  c: /\bscanf\b|\bgets\b|\bfgets\b|\bgetchar\b/,
  cpp: /\bcin\b|\bgetline\b|\bscanf\b/,
  csharp: /Console\.Read/,
  go: /\bfmt\.Scan|bufio\.NewReader|os\.Stdin/,
  rust: /\bstdin\b|read_line/,
  ruby: /\bgets\b|\breadline\b|\$stdin/,
  php: /\bfgets\b|\breadline\b|\$stdin/,
  kotlin: /\breadLine\b|\breadln\b|Scanner/,
  bash: /\bread\b/,
  lua: /io\.read/,
  r: /\breadLines\b|\bscan\b|\breadline\b/,
  perl: /\b<STDIN>|chomp/,
  swift: /\breadLine\b/,
  haskell: /\bgetLine\b|\bgetContents\b/,
  scala: /\bStdIn\b|scala\.io/,
  pascal: /\bReadLn\b|\bRead\b/,
  fortran: /\bREAD\b/i,
};

/** Default stdin so starter code with input() works out of the box */
const DEFAULT_STDIN: Partial<Record<LanguageKey, string>> = {
  python: "Demo Student",
};

function detectStdinUsage(lang: LanguageKey, code: string): boolean {
  const p = STDIN_PATTERNS[lang];
  return p ? p.test(code) : false;
}

/** Languages rendered client-side — no compiler needed */
const CLIENT_RENDERED = new Set<LanguageKey>(["mermaid", "html", "css", "markdown"]);

interface CodeEditorProps {
  lessonId?: string;
  courseId?: string;
}

export function CodeEditorFull({ lessonId }: CodeEditorProps) {
  const [language, setLanguage] = useState<LanguageKey>("python");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const [stdinNeeded, setStdinNeeded] = useState(false);

  // Auto-detect stdin usage & pre-populate default inputs
  useEffect(() => {
    if (CLIENT_RENDERED.has(language)) {
      setStdinNeeded(false);
      return;
    }
    const needed = detectStdinUsage(language, code);
    setStdinNeeded(needed);
    if (needed && !stdin && DEFAULT_STDIN[language]) {
      setStdin(DEFAULT_STDIN[language]!);
      setShowStdin(true);
    }
  }, [code, language]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setShowConfirmSubmit(false);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Database offline");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to submit assignments");

      const { error: subErr } = await supabase
        .from("code_submissions")
        .insert({
          student_id: user.id,
          lesson_id: lessonId,
          language,
          code,
          stdin: stdin || null,
          stdout: result?.stdout || null,
          stderr: result?.stderr || null,
        });

      if (subErr) throw subErr;
      notify({
        title: "Assignment Submitted",
        description: "Successfully submitted your code assignment solution!",
        tone: "success"
      });
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stable ref so the keyboard shortcut always calls the latest handleRun
  const handleRunRef = useRef(handleRun);
  useEffect(() => { handleRunRef.current = handleRun; }, [handleRun]);

  // Ctrl+Enter to run — registered once, never re-attached
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE[language]);
    setResult(null);
    setError(null);
    editorRef.current?.focus();
  }, [language]);

  return (
    <div className="relative flex h-full flex-col gap-4 lg:flex-row">
      {/* Left: Editor */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-cn-border/80 bg-cn-surface shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:border-cn-border">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-cn-border bg-cn-surface-variant/10 px-4 py-3">
          <LanguageSelector value={language} onChange={handleLanguageChange} />

          {!CLIENT_RENDERED.has(language) && (
            <button
              type="button"
              onClick={() => setShowStdin(!showStdin)}
              className={`relative rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                showStdin
                  ? "bg-cn-orange/15 text-cn-orange border border-cn-orange/30 shadow-[0_0_12px_rgba(255,107,61,0.15)]"
                  : stdinNeeded && !stdin.trim()
                    ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
                    : "text-cn-ink-muted border border-cn-border/50 hover:bg-cn-border/40 hover:text-cn-ink"
              }`}
            >
              {stdinNeeded && !stdin.trim() && (
                <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
              )}
              stdin {stdinNeeded ? "⚠️" : ""}
            </button>
          )}

          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-cn-border px-3.5 py-1.5 text-xs font-bold text-cn-ink-muted transition-all duration-200 hover:bg-cn-border/50 hover:text-cn-ink active:scale-95"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning || !code.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-1.5 text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-all duration-200 hover:bg-emerald-500 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              {isRunning ? "Running…" : "Run"}
            </button>
            {lessonId && (
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                disabled={isRunning || isSubmitting || !code.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cn-orange to-cn-pink px-5 py-1.5 text-sm font-bold text-white shadow-md shadow-cn-orange/15 transition-all duration-200 hover:brightness-110 hover:shadow-cn-orange/35 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
        </div>

        {/* Stdin */}
        {showStdin && !CLIENT_RENDERED.has(language) && (
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
        <div className="min-h-0 flex-1 h-full w-full relative">
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
      <div className="flex min-h-[200px] flex-col lg:w-[32%] lg:min-h-0">
        <OutputPanel result={result} isRunning={isRunning} error={error} language={language} />
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute bottom-2 left-2 hidden text-[10px] text-cn-ink-subtle lg:block">
        Ctrl+Enter to run
      </div>

      <DoubleConfirmModal
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit Assignment"
        description="Are you sure you want to submit your code? This will be graded and recorded as your final submission for this lesson."
        confirmWord="SUBMIT"
        actionButtonText="Submit Now"
      />
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
