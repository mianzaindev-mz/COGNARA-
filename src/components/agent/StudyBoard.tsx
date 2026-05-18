"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AgentIcon } from "@/components/ui/agent-icon";

type Props = {
  content: string;
  onClose: () => void;
  lang: "en" | "ur";
};

/**
 * StudyBoard — Full-screen visual teaching overlay.
 * Renders the AI response as rich visual content (syntax-highlighted code,
 * styled tables, headers, blockquotes) in a single scrollable view.
 */
export function StudyBoard({ content, onClose, lang }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const boardRef = useRef<HTMLDivElement>(null);

  // Check voice availability
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setVoiceAvailable(false);
      return;
    }
    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      if (lang === "ur") {
        const hasUrdu = voices.some(v => v.lang.startsWith("ur") || v.lang.startsWith("hi"));
        setVoiceAvailable(hasUrdu);
      }
    };
    check();
    window.speechSynthesis.onvoiceschanged = check;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [lang]);

  // Speak entire content
  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = content
      .replace(/```[\s\S]*?```/g, " ... code example ... ")
      .replace(/\|[^\n]+\|/g, "")
      .replace(/---+/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/[`~>\[\]|]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 1500);

    const utterance = new SpeechSynthesisUtterance(clean);

    if (lang === "ur") {
      utterance.lang = "ur-PK";
      utterance.rate = 0.82;
      utterance.pitch = 1.05;
    } else {
      utterance.lang = "en-US";
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
    }
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (lang === "ur") {
      const v =
        voices.find(v => v.name.includes("Microsoft") && v.lang.startsWith("ur")) ||
        voices.find(v => v.lang === "ur-PK") ||
        voices.find(v => v.lang.startsWith("ur")) ||
        voices.find(v => v.name.includes("Microsoft") && v.lang.startsWith("hi")) ||
        voices.find(v => v.lang.startsWith("hi"));
      if (v) utterance.voice = v;
    } else {
      const v =
        voices.find(v => v.name.includes("Microsoft Aria") && v.lang.startsWith("en")) ||
        voices.find(v => v.name.includes("Microsoft Jenny") && v.lang.startsWith("en")) ||
        voices.find(v => v.name.includes("Google UK English Female")) ||
        voices.find(v => v.name.includes("Google US English")) ||
        voices.find(v => v.name.includes("Samantha")) ||
        voices.find(v => v.lang === "en-US" && !v.localService) ||
        voices.find(v => v.lang.startsWith("en"));
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [content, lang]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { stopSpeaking(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, stopSpeaking]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const rendered = renderMarkdown(content);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/97 backdrop-blur-md">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink shadow-lg shadow-cn-orange/20">
            <AgentIcon size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Study Board</h2>
            <p className="text-[11px] text-white/35">Visual teaching mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <span className="flex items-center gap-1.5 rounded-full bg-cn-lavender/15 px-3 py-1 text-[11px] font-medium text-cn-lavender">
              <span className="h-1.5 w-1.5 rounded-full bg-cn-lavender animate-pulse" />
              Speaking
            </span>
          )}
          <button
            type="button"
            onClick={isSpeaking ? stopSpeaking : speak}
            disabled={!voiceAvailable}
            className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
              isSpeaking
                ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                : "bg-cn-orange/15 text-cn-orange hover:bg-cn-orange/25"
            } disabled:opacity-30`}
          >
            {isSpeaking ? "■ Stop" : "▶ Read Aloud"}
          </button>
          <button
            type="button"
            onClick={() => { stopSpeaking(); onClose(); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content — single scrollable view */}
      <div className="flex-1 overflow-y-auto" ref={boardRef}>
        <div className="mx-auto max-w-3xl px-8 py-10">
          <div
            className="study-board-content"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="border-t border-white/5 py-2 text-center text-[10px] text-white/20">
        Esc — Close board
        {!voiceAvailable && lang === "ur" && (
          <span className="ml-4 text-amber-400/60">
            Urdu voice not installed — install &quot;Microsoft Asad&quot; or &quot;Google Urdu&quot; in your system language settings
          </span>
        )}
      </div>

      {/* Scoped styles for rendered markdown */}
      <style>{`
        .study-board-content {
          color: rgba(255, 255, 255, 0.88);
          font-size: 15px;
          line-height: 1.8;
        }

        .study-board-content h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid rgba(255, 87, 52, 0.3);
          letter-spacing: -0.02em;
        }

        .study-board-content h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fccc42;
          margin: 2rem 0 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .study-board-content h3::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 1.15rem;
          background: linear-gradient(180deg, #ff5734, #fccc42);
          border-radius: 2px;
        }

        .study-board-content p {
          margin: 0.75rem 0;
          color: rgba(255, 255, 255, 0.78);
        }

        .study-board-content strong {
          color: #fff;
          font-weight: 700;
        }

        .study-board-content em {
          color: rgba(255, 255, 255, 0.55);
          font-style: italic;
        }

        .study-board-content code:not(.code-block) {
          background: rgba(255, 87, 52, 0.12);
          color: #ff8a6b;
          padding: 0.15em 0.4em;
          border-radius: 0.35em;
          font-size: 0.9em;
          font-family: var(--font-mono);
        }

        .study-board-content pre {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1rem;
          padding: 1.25rem 1.5rem;
          margin: 1.25rem 0;
          overflow-x: auto;
          position: relative;
        }

        .study-board-content pre::before {
          content: attr(data-lang);
          position: absolute;
          top: 0.5rem;
          right: 0.75rem;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.2);
        }

        .study-board-content pre code {
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.7;
          color: #a5d6a7;
        }

        .study-board-content .comment { color: rgba(255,255,255,0.3); font-style: italic; }
        .study-board-content .keyword { color: #c792ea; }
        .study-board-content .string  { color: #c3e88d; }
        .study-board-content .number  { color: #f78c6c; }
        .study-board-content .func    { color: #82aaff; }

        .study-board-content blockquote {
          border-left: 3px solid #ff5734;
          background: rgba(255, 87, 52, 0.06);
          padding: 1rem 1.25rem;
          margin: 1.25rem 0;
          border-radius: 0 1rem 1rem 0;
          color: rgba(255, 255, 255, 0.85);
        }

        .study-board-content blockquote strong {
          color: #ff8a6b;
        }

        .study-board-content table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 1.25rem 0;
          border-radius: 1rem;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .study-board-content th {
          background: rgba(255, 87, 52, 0.12);
          color: #ff8a6b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.75rem 1rem;
          text-align: left;
        }

        .study-board-content td {
          padding: 0.65rem 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
        }

        .study-board-content tr:hover td {
          background: rgba(255, 255, 255, 0.03);
        }

        .study-board-content ul, .study-board-content ol {
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }

        .study-board-content li {
          margin: 0.4rem 0;
          color: rgba(255, 255, 255, 0.78);
        }

        .study-board-content li::marker {
          color: #ff5734;
        }

        .study-board-content ol li::marker {
          color: #fccc42;
          font-weight: 700;
        }

        .study-board-content hr {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}

/* ─── Markdown → HTML renderer ─── */

function renderMarkdown(md: string): string {
  let html = md;

  // Code blocks with language tag
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
    const langLabel = lang || "";
    const highlighted = highlightCode(escapeHtml(code.trim()), langLabel);
    return `<pre data-lang="${langLabel}"><code class="code-block">${highlighted}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  // Bold & italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');
  // Merge adjacent blockquotes
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '');

  // Tables
  html = html.replace(/\n((?:\|.+\|\n)+)/g, (_m, tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter((r: string) => !/^\|[-\s|:]+\|$/.test(r));
    if (rows.length < 1) return tableBlock;

    const headerCells = rows[0].split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
    const bodyRows = rows.slice(1).map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  });

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}\s*$/gm, '<hr />');

  // Ordered lists
  html = html.replace(/(?:^|\n)((?:\d+\. .+\n?)+)/g, (_m, block) => {
    const items = block.trim().split('\n').map((l: string) => `<li>${l.replace(/^\d+\.\s*/, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Unordered lists
  html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (_m, block) => {
    const items = block.trim().split('\n').map((l: string) => `<li>${l.replace(/^-\s*/, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Paragraphs (remaining loose text)
  html = html.replace(/\n\n+/g, '</p><p>');
  if (!html.startsWith('<')) html = '<p>' + html;
  if (!html.endsWith('>')) html += '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<h[23]|<pre|<blockquote|<table|<ul|<ol|<hr)/g, '$1');
  html = html.replace(/(<\/h[23]>|<\/pre>|<\/blockquote>|<\/table>|<\/ul>|<\/ol>|<hr \/>)\s*<\/p>/g, '$1');

  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightCode(code: string, lang: string): string {
  let result = code;

  // Comments
  if (lang === "python" || lang === "bash") {
    result = result.replace(/(#.*)$/gm, '<span class="comment">$1</span>');
  } else {
    result = result.replace(/(\/\/.*)$/gm, '<span class="comment">$1</span>');
  }

  // Strings (double and single quoted)
  result = result.replace(/(&quot;[^&]*&quot;|"[^"]*"|'[^']*')/g, '<span class="string">$1</span>');
  // f-strings
  result = result.replace(/f(<span class="string">)/g, '$1');

  // Keywords
  const kw = lang === "python"
    ? "def|class|if|elif|else|for|while|return|import|from|in|not|and|or|True|False|None|try|except|finally|with|as|break|continue|pass|raise|yield"
    : "function|const|let|var|if|else|for|while|return|import|from|export|class|new|this|async|await|try|catch|throw|typeof|instanceof";
  result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="keyword">$1</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');

  // Function calls
  result = result.replace(/\b([a-zA-Z_]\w*)\(/g, '<span class="func">$1</span>(');

  return result;
}
