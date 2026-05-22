"use client";

import { useEffect, useRef, useState } from "react";
import type { ExecutionResult, LanguageKey } from "@/lib/compiler/judge0";

type Props = {
  result: ExecutionResult | null;
  isRunning: boolean;
  error: string | null;
  language: LanguageKey;
};

/* ── Client-side rendered languages ──────────────────────── */
const CLIENT_RENDERED = new Set<LanguageKey>(["mermaid", "html", "css", "markdown"]);

export function OutputPanel({ result, isRunning, error, language }: Props) {
  const hasOutput = result || error;
  const isVisual = CLIENT_RENDERED.has(language) && !!result?.stdout;

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
                  ? isVisual ? "bg-violet-500" : "bg-emerald-500"
                  : result?.status?.id
                    ? "bg-red-500"
                    : "bg-cn-ink-subtle/40"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-cn-ink-muted">
            {isVisual ? "Preview" : "Output"}
          </span>
        </div>
        {result?.time && (
          <span className="ml-auto text-[11px] tabular-nums text-cn-ink-subtle">
            {result.time}s · {result.memory ? `${(result.memory / 1024).toFixed(1)} MB` : "—"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-auto">
        {isRunning ? (
          <div className="flex h-full items-center justify-center gap-2 p-4 text-cn-ink-muted">
            <RunningSpinner />
            <span>{isVisual ? "Rendering…" : "Running…"}</span>
          </div>
        ) : error ? (
          <pre className="whitespace-pre-wrap p-4 font-mono text-sm text-red-500">{error}</pre>
        ) : !hasOutput ? (
          <p className="p-4 text-sm text-cn-ink-subtle">
            Click <strong>Run</strong> to execute your code. Output appears here.
          </p>
        ) : isVisual ? (
          <VisualRenderer language={language} code={result!.stdout!} />
        ) : (
          <div className="p-4 font-mono text-sm leading-relaxed">
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
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Visual Renderer ─────────────────────────────────────── */

function VisualRenderer({ language, code }: { language: LanguageKey; code: string }) {
  if (language === "mermaid") return <MermaidRenderer code={code} />;
  if (language === "html") return <HtmlRenderer code={code} />;
  if (language === "css") return <CssRenderer code={code} />;
  if (language === "markdown") return <MarkdownRenderer code={code} />;
  return null;
}

/* ── Mermaid Renderer ────────────────────────────────────── */

function MermaidRenderer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;

        // Detect theme from <html> class
        const isDark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          securityLevel: "loose",
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [code]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 p-6 text-cn-ink-muted">
        <RunningSpinner />
        <span className="text-sm">Rendering diagram…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-red-400">
          Mermaid Error
        </span>
        <pre className="whitespace-pre-wrap font-mono text-sm text-red-400">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-[200px] items-center justify-center p-6 [&_svg]:drop-shadow-lg"
    />
  );
}

/* ── HTML Renderer ───────────────────────────────────────── */

function HtmlRenderer({ code }: { code: string }) {
  return (
    <iframe
      srcDoc={code}
      sandbox="allow-scripts"
      title="HTML Preview"
      className="h-full w-full border-0"
      style={{ minHeight: 300 }}
    />
  );
}

/* ── CSS Renderer ────────────────────────────────────────── */

const CSS_PREVIEW_HTML = `
<div class="preview-container">
  <h1>CSS Preview 🎨</h1>
  <p>Your styles are applied to this layout.</p>
  <div class="card">
    <p>Glassmorphism Card</p>
    <span class="badge">Styled by You</span>
  </div>
</div>
`;

function CssRenderer({ code }: { code: string }) {
  const srcdoc = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
${code}
</style>
</head><body>${CSS_PREVIEW_HTML}</body></html>`;

  return (
    <iframe
      srcDoc={srcdoc}
      sandbox="allow-scripts"
      title="CSS Preview"
      className="h-full w-full border-0"
      style={{ minHeight: 300 }}
    />
  );
}

/* ── Markdown Renderer ───────────────────────────────────── */

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function markdownToHtml(md: string): string {
  const html = md
    // Code blocks (fenced)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre class="md-code-block"><code class="lang-${lang || "text"}">${escapeHtml(code.trim())}</code></pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    // Tables
    .replace(/^\|(.+)\|\s*$/gm, (match) => {
      const cells = match.trim().replace(/^\|\s*/, "").replace(/\s*\|$/, "").split(/\s*\|\s*/);
      return "<tr>" + cells.map(c => {
        if (/^[-:]+$/.test(c.trim())) return "";
        return `<td>${c.trim()}</td>`;
      }).join("") + "</tr>";
    })
    // Headings
    .replace(/^######\s+(.+)$/gm, "<h6>$1</h6>")
    .replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>")
    .replace(/^####\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
    // Horizontal rule
    .replace(/^---+$/gm, "<hr />")
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>")
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[hulo]|<bl|<hr|<pre|<tr|<li)(.+)$/gm, "<p>$1</p>")
    // Wrap adjacent <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    // Wrap <tr> in <table>
    .replace(/(<tr>.*<\/tr>\n?)+/g, "<table>$&</table>")
    // Remove empty <tr>
    .replace(/<tr><\/tr>/g, "");

  return html;
}

function MarkdownRenderer({ code }: { code: string }) {
  const html = markdownToHtml(code);

  const srcdoc = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  padding: 24px 32px;
  line-height: 1.7;
  color: #1a1a2e;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  max-width: 780px;
}
h1 { font-size: 2em; margin: 0 0 16px; color: #1a1a2e; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
h2 { font-size: 1.5em; margin: 24px 0 12px; color: #2d2d44; }
h3 { font-size: 1.2em; margin: 20px 0 8px; color: #3d3d5c; }
p { margin: 8px 0; }
a { color: #6366f1; text-decoration: none; }
a:hover { text-decoration: underline; }
strong { font-weight: 700; }
ul { padding-left: 24px; margin: 8px 0; }
li { margin: 4px 0; }
blockquote {
  border-left: 4px solid #6366f1;
  margin: 16px 0;
  padding: 8px 16px;
  background: rgba(99, 102, 241, 0.06);
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #555;
}
hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
.md-code-block {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 16px 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
  line-height: 1.6;
}
.md-inline-code {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
}
td {
  padding: 10px 16px;
  border: 1px solid #e5e5e5;
  font-size: 0.95em;
}
tr:first-child td {
  background: #f5f5f5;
  font-weight: 600;
}
</style>
</head><body>${html}</body></html>`;

  return (
    <iframe
      srcDoc={srcdoc}
      sandbox=""
      title="Markdown Preview"
      className="h-full w-full border-0"
      style={{ minHeight: 400 }}
    />
  );
}

/* ── Shared spinner ──────────────────────────────────────── */

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
