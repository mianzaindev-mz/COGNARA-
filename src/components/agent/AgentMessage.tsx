"use client";

import React, { useState, useCallback } from "react";

type Props = {
  role: "user" | "assistant";
  content: string;
  skill?: string;
  creditsUsed?: number;
  timestamp?: string;
};

export function AgentMessage({ role, content, skill, creditsUsed, timestamp }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          isUser
            ? "bg-cn-lavender/30 text-cn-ink"
            : "bg-gradient-to-br from-cn-orange to-cn-pink text-white"
        }`}
      >
        {isUser ? "Y" : "C"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-cn-orange/10 text-cn-ink"
              : "rounded-tl-md bg-cn-surface text-cn-ink shadow-sm ring-1 ring-cn-border"
          }`}
        >
          {isUser ? (
            <p>{content}</p>
          ) : (
            <div className="agent-markdown">
              <RichMarkdown content={content} />
            </div>
          )}
        </div>

        {/* Action bar for AI messages */}
        {!isUser && (
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <ExplainButton text={content} />
            <CopyButton text={content} />
            {timestamp && <span className="text-[11px] text-cn-ink-subtle">{timestamp}</span>}
            {skill && (
              <span className="rounded-full bg-cn-orange/10 px-2 py-0.5 text-[11px] font-medium text-cn-orange">
                {skill}
              </span>
            )}
            {creditsUsed !== undefined && creditsUsed > 0 && (
              <span className="text-[11px] text-cn-ink-subtle">−{creditsUsed} credit{creditsUsed > 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        {/* Meta for user messages */}
        {isUser && timestamp && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-cn-ink-subtle justify-end">
            <span>{timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Rich Markdown Renderer ─────────────── */

function RichMarkdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} />
      ))}
    </div>
  );
}

type Block =
  | { type: "code"; lang: string; code: string }
  | { type: "heading"; level: number; text: string }
  | { type: "blockquote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string };

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang: lang || "text", code: codeLines.join("\n") });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    // Table (detect |)
    if (line.includes("|") && i + 1 < lines.length && /^\|?[\s-:|]+\|/.test(lines[i + 1])) {
      const parseRow = (r: string) => r.split("|").map(c => c.trim()).filter(Boolean);
      const headers = parseRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Empty line — skip
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("```") && !lines[i].startsWith("#") && !lines[i].startsWith("> ") && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !/^[-*_]{3,}/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "code":
      return <CodeBlock lang={block.lang} code={block.code} />;
    case "heading":
      return <Heading level={block.level} text={block.text} />;
    case "blockquote":
      return (
        <blockquote className="border-l-3 border-cn-orange/40 bg-cn-orange/5 pl-4 py-2 pr-3 rounded-r-xl text-sm text-cn-ink-muted italic">
          <InlineMarkdown text={block.text} />
        </blockquote>
      );
    case "table":
      return <MarkdownTable headers={block.headers} rows={block.rows} />;
    case "hr":
      return <hr className="border-cn-border my-2" />;
    case "list":
      return block.ordered ? (
        <ol className="ml-5 list-decimal space-y-1 text-sm text-cn-ink">
          {block.items.map((item, i) => <li key={i}><InlineMarkdown text={item} /></li>)}
        </ol>
      ) : (
        <ul className="ml-5 list-disc space-y-1 text-sm text-cn-ink">
          {block.items.map((item, i) => <li key={i}><InlineMarkdown text={item} /></li>)}
        </ul>
      );
    case "paragraph":
      return <p className="text-sm text-cn-ink leading-relaxed"><InlineMarkdown text={block.text} /></p>;
  }
}

/* ─── Code Block with Copy + Language Label ─── */

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between bg-stone-800 px-4 py-1.5">
        <span className="text-[11px] font-medium text-stone-400">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] font-medium text-stone-400 transition hover:text-white"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto bg-stone-900 p-4 text-[13px] leading-relaxed">
        <code className="text-emerald-400 font-mono">{code}</code>
      </pre>
    </div>
  );
}

/* ─── Heading ─── */

function Heading({ level, text }: { level: number; text: string }) {
  const sizes: Record<number, string> = {
    1: "text-xl font-bold mt-4 mb-2",
    2: "text-lg font-bold mt-3 mb-1.5",
    3: "text-base font-bold mt-2 mb-1",
    4: "text-sm font-bold mt-2 mb-1",
  };
  return <div className={`${sizes[level] ?? sizes[3]} text-cn-ink`}><InlineMarkdown text={text} /></div>;
}

/* ─── Table ─── */

function MarkdownTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-cn-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cn-border bg-cn-canvas">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-xs font-bold text-cn-ink">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cn-border">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-cn-canvas/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-cn-ink-muted">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Inline Markdown (bold, italic, code, links) ─── */

function InlineMarkdown({ text }: { text: string }) {
  // Process inline markdown patterns
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(boldMatch[1]);
      parts.push(<strong key={keyIdx++} className="font-semibold text-cn-ink">{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
      continue;
    }

    // Inline code: `text`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)/);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(codeMatch[1]);
      parts.push(
        <code key={keyIdx++} className="rounded bg-cn-border/50 px-1.5 py-0.5 text-xs font-mono text-cn-orange">
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(italicMatch[1]);
      parts.push(<em key={keyIdx++}>{italicMatch[2]}</em>);
      remaining = italicMatch[3];
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)/);
    if (linkMatch) {
      if (linkMatch[1]) parts.push(linkMatch[1]);
      parts.push(
        <a key={keyIdx++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" className="text-cn-orange underline underline-offset-2 hover:text-cn-orange-hover">
          {linkMatch[2]}
        </a>
      );
      remaining = linkMatch[4];
      continue;
    }

    // No more patterns — push rest
    parts.push(remaining);
    break;
  }

  return <>{parts}</>;
}

/* ─── Explain (TTS) Button ─── */

function ExplainButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<"en" | "ur">("en");

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Strip markdown for clean speech
    const clean = text
      .replace(/```[\s\S]*?```/g, " code example omitted ")
      .replace(/\|[^\n]+\|/g, "")
      .replace(/---+/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/[`~>\[\]|]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 1200);

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

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [text, speaking, lang]);

  return (
    <div className="flex items-center gap-0.5">
      {/* Language toggle */}
      <button
        type="button"
        onClick={() => setLang(l => l === "en" ? "ur" : "en")}
        className="rounded-l-lg px-1.5 py-0.5 text-[10px] font-bold text-cn-ink-subtle border border-cn-border bg-cn-canvas hover:bg-cn-border/50 transition"
        title={`Switch to ${lang === "en" ? "Urdu" : "English"}`}
      >
        {lang === "en" ? "EN" : "UR"}
      </button>
      {/* Speak button */}
      <button
        type="button"
        onClick={speak}
        className={`flex items-center gap-1 rounded-r-lg px-2 py-0.5 text-[10px] font-medium border border-l-0 border-cn-border transition ${
          speaking
            ? "bg-cn-lavender text-white border-cn-lavender"
            : "bg-cn-canvas text-cn-ink-subtle hover:bg-cn-border/50 hover:text-cn-ink"
        }`}
        title={speaking ? "Stop speaking" : "Explain aloud"}
      >
        {speaking ? (
          <>
            <StopIcon className="h-3 w-3" /> Stop
          </>
        ) : (
          <>
            <SpeakerSmallIcon className="h-3 w-3" /> Explain
          </>
        )}
      </button>
    </div>
  );
}

/* ─── Copy Button ─── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium text-cn-ink-subtle border border-cn-border bg-cn-canvas transition hover:bg-cn-border/50 hover:text-cn-ink"
    >
      {copied ? "✓ Copied" : "📋 Copy"}
    </button>
  );
}

/* ─── SVG Icons ─── */

function SpeakerSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.5L7.3 3.2a.5.5 0 01.85.35v8.9a.5.5 0 01-.85.35L4.5 10.5H3a1 1 0 01-1-1v-3a1 1 0 011-1h1.5zM11 5.5a3.5 3.5 0 010 5M13 4a5.5 5.5 0 010 8" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16">
      <rect x="3" y="3" width="10" height="10" rx="2" />
    </svg>
  );
}
