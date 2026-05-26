"use client";

/**
 * GnaraResponseRenderer — Premium markdown renderer for GNARA agent responses.
 *
 * Renders structured AI output into beautifully styled React components:
 * - Rich headings with indigo accents
 * - Info boxes (Tip, Warning, Error, Note, Deep Dive)
 * - Analogy cards with warm styling
 * - Code blocks with syntax highlighting, copy button, and language badge
 * - Tables with alternating rows and copy-as-CSV
 * - Numbered step sequences with connecting lines
 * - Enhanced bullet lists with indigo dots
 *
 * Replaces the basic RichMarkdown renderer in AgentMessage.tsx.
 */

import React, { useState } from "react";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

type Block =
  | { type: "code"; lang: string; code: string }
  | { type: "heading"; level: number; text: string }
  | { type: "blockquote"; text: string; variant: "tip" | "warning" | "error" | "note" | "deep-dive" | "default" }
  | { type: "analogy"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string };

/* ═══════════════════════════════════════════════
   MAIN RENDERER
   ═══════════════════════════════════════════════ */

export function GnaraResponseRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(normalizeContent(content));

  return (
    <div className="gnara-response space-y-3">
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTENT NORMALIZATION
   ═══════════════════════════════════════════════ */

function normalizeContent(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/^(#{1,4})([^\s#])/gm, "$1 $2")
    .replace(/^\s*#{1,4}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ═══════════════════════════════════════════════
   BLOCK PARSER
   ═══════════════════════════════════════════════ */

function detectBlockquoteVariant(text: string): Block {
  const lower = text.toLowerCase();
  const stripped = text.replace(/^[>\s]*/gm, "");

  // Detect analogy cards: ::analogy:: or 💡 Real World / Analogy patterns
  if (/^::analogy::/i.test(stripped) || /^💡\s*(real.world|analogy)/i.test(stripped)) {
    return { type: "analogy", text: stripped.replace(/^::analogy::\s*/i, "") };
  }

  // Detect info box variants by emoji + keyword prefix
  if (/💡\s*\*?\*?tip/i.test(lower)) return { type: "blockquote", text: stripped, variant: "tip" };
  if (/⚠️\s*\*?\*?warning/i.test(lower)) return { type: "blockquote", text: stripped, variant: "warning" };
  if (/❌\s*\*?\*?error/i.test(lower)) return { type: "blockquote", text: stripped, variant: "error" };
  if (/✅\s*\*?\*?note/i.test(lower)) return { type: "blockquote", text: stripped, variant: "note" };
  if (/🔬\s*\*?\*?deep\s*dive/i.test(lower)) return { type: "blockquote", text: stripped, variant: "deep-dive" };

  // Key Insight pattern (common in GNARA responses)
  if (/\*?\*?key\s+insight/i.test(lower)) return { type: "blockquote", text: stripped, variant: "tip" };
  if (/\*?\*?important/i.test(lower)) return { type: "blockquote", text: stripped, variant: "warning" };

  return { type: "blockquote", text: stripped, variant: "default" };
}

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
    const headingMatch = line.match(/^\s*(#{1,4})\s+(.+)/);
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

    // Blockquote (may be info box or analogy)
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      const fullText = quoteLines.join("\n");
      const detected = detectBlockquoteVariant(fullText);
      blocks.push(detected as Block);
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^\|?[\s-:|]+\|/.test(lines[i + 1])) {
      const parseRow = (r: string) => r.split("|").map(c => c.trim()).filter(Boolean);
      const headers = parseRow(line);
      i += 2;
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

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("```") &&
      !/^\s*#/.test(lines[i]) &&
      !lines[i].startsWith("> ") &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^[-*_]{3,}/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && /^\|?[\s-:|]+\|/.test(lines[i + 1]))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

/* ═══════════════════════════════════════════════
   BLOCK RENDERER
   ═══════════════════════════════════════════════ */

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "code":
      return <GnaraCodeBlock lang={block.lang} code={block.code} />;
    case "heading":
      return <GnaraHeading level={block.level} text={block.text} />;
    case "blockquote":
      return <GnaraInfoBox text={block.text} variant={block.variant} />;
    case "analogy":
      return <GnaraAnalogyCard text={block.text} />;
    case "table":
      return <GnaraTable headers={block.headers} rows={block.rows} />;
    case "hr":
      return <hr className="border-cn-border/50 my-3" />;
    case "list":
      return block.ordered ? (
        <GnaraStepSequence items={block.items} />
      ) : (
        <GnaraBulletList items={block.items} />
      );
    case "paragraph":
      return <p className="text-sm text-cn-ink leading-[1.75]"><InlineMarkdown text={block.text} /></p>;
  }
}

/* ═══════════════════════════════════════════════
   HEADINGS — Styled with indigo accents
   ═══════════════════════════════════════════════ */

function GnaraHeading({ level, text }: { level: number; text: string }) {
  switch (level) {
    case 1:
      return (
        <div className="mt-4 mb-2 border-l-[3px] border-indigo-500 pl-3">
          <h2 className="text-lg font-bold text-cn-ink leading-snug">
            <InlineMarkdown text={text} />
          </h2>
        </div>
      );
    case 2:
      return (
        <div className="mt-3 mb-1.5 pb-1.5 border-b border-cn-border/40">
          <h3 className="text-[15px] font-bold text-cn-ink">
            <InlineMarkdown text={text} />
          </h3>
        </div>
      );
    case 3:
      return (
        <h4 className="mt-2 mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-indigo-400">
          <InlineMarkdown text={text} />
        </h4>
      );
    default:
      return (
        <h5 className="mt-2 mb-1 text-sm font-bold text-cn-ink">
          <InlineMarkdown text={text} />
        </h5>
      );
  }
}

/* ═══════════════════════════════════════════════
   INFO BOXES — Colored callout cards
   ═══════════════════════════════════════════════ */

const INFO_BOX_STYLES = {
  tip: {
    border: "border-teal-500/40",
    bg: "bg-teal-500/[0.06]",
    icon: "💡",
    textColor: "text-teal-300",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/[0.06]",
    icon: "⚠️",
    textColor: "text-amber-300",
  },
  error: {
    border: "border-red-500/40",
    bg: "bg-red-500/[0.06]",
    icon: "❌",
    textColor: "text-red-300",
  },
  note: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/[0.06]",
    icon: "✅",
    textColor: "text-emerald-300",
  },
  "deep-dive": {
    border: "border-indigo-500/40",
    bg: "bg-indigo-500/[0.06]",
    icon: "🔬",
    textColor: "text-indigo-300",
  },
  default: {
    border: "border-cn-orange/30",
    bg: "bg-cn-orange/[0.04]",
    icon: "",
    textColor: "text-cn-ink-muted",
  },
};

function GnaraInfoBox({ text, variant }: { text: string; variant: keyof typeof INFO_BOX_STYLES }) {
  const style = INFO_BOX_STYLES[variant];
  const [expanded, setExpanded] = useState(variant !== "deep-dive");

  return (
    <div className={`rounded-xl border-l-[3px] ${style.border} ${style.bg} px-4 py-3`}>
      <div
        className={`flex items-start gap-2 ${variant === "deep-dive" ? "cursor-pointer" : ""}`}
        onClick={variant === "deep-dive" ? () => setExpanded(!expanded) : undefined}
      >
        {style.icon && <span className="text-base mt-0.5 shrink-0">{style.icon}</span>}
        <div className={`text-sm leading-relaxed ${variant === "deep-dive" && !expanded ? "line-clamp-1" : ""}`}>
          <InlineMarkdown text={text} />
        </div>
        {variant === "deep-dive" && (
          <button
            type="button"
            className="shrink-0 text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition ml-auto"
          >
            {expanded ? "collapse" : "expand"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ANALOGY CARD — Warm, memorable highlight
   ═══════════════════════════════════════════════ */

function GnaraAnalogyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span className="text-xl mt-0.5 shrink-0">💡</span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-amber-400 mb-1">
            Real-World Analogy
          </p>
          <p className="text-sm italic text-cn-ink leading-relaxed">
            <InlineMarkdown text={text} />
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CODE BLOCK — Dark theme with copy + language badge
   ═══════════════════════════════════════════════ */

function GnaraCodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting for common patterns
  const highlightedLines = code.split("\n").map((line, i) => (
    <div key={i} className="flex">
      <span className="inline-block w-8 shrink-0 text-right pr-3 text-stone-600 select-none text-[12px]">
        {i + 1}
      </span>
      <span className="flex-1">
        <HighlightedCode line={line} lang={lang} />
      </span>
    </div>
  ));

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06]">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-[#161b22] px-4 py-1.5">
        <span className="text-[11px] font-medium text-stone-500">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="text-[11px] font-medium text-stone-500 transition hover:text-white"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      {/* Code body */}
      <pre className="overflow-x-auto bg-[#0d1117] p-4 text-[13px] leading-[1.7] font-mono">
        <code>{highlightedLines}</code>
      </pre>
    </div>
  );
}

/** Simple keyword-based syntax coloring (no external deps) */
function HighlightedCode({ line, lang }: { line: string; lang: string }) {
  // Comment detection
  const commentPrefixes = ["//", "#", "--"];
  for (const prefix of commentPrefixes) {
    const cIdx = line.indexOf(prefix);
    if (cIdx >= 0 && !isInsideString(line, cIdx)) {
      return (
        <>
          <HighlightedCode line={line.slice(0, cIdx)} lang={lang} />
          <span className="text-stone-500 italic">{line.slice(cIdx)}</span>
        </>
      );
    }
  }

  // String detection
  const strMatch = line.match(/^(.*?)(["'`])(.+?)\2(.*)$/);
  if (strMatch) {
    return (
      <>
        <HighlightedCode line={strMatch[1]} lang={lang} />
        <span className="text-amber-300">{strMatch[2]}{strMatch[3]}{strMatch[2]}</span>
        <HighlightedCode line={strMatch[4]} lang={lang} />
      </>
    );
  }

  // Keyword highlighting
  const keywords = getKeywords(lang);
  if (keywords.length === 0) return <span className="text-stone-300">{line}</span>;

  const pattern = new RegExp(`\\b(${keywords.join("|")})\\b`);
  const match = line.match(pattern);
  if (!match || match.index === undefined) return <span className="text-stone-300">{line}</span>;

  return (
    <>
      <span className="text-stone-300">{line.slice(0, match.index)}</span>
      <span className="text-indigo-400 font-medium">{match[0]}</span>
      <HighlightedCode line={line.slice(match.index + match[0].length)} lang={lang} />
    </>
  );
}

function isInsideString(line: string, idx: number): boolean {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < idx; i++) {
    if (line[i] === "'" && !inDouble) inSingle = !inSingle;
    if (line[i] === '"' && !inSingle) inDouble = !inDouble;
  }
  return inSingle || inDouble;
}

function getKeywords(lang: string): string[] {
  const l = lang.toLowerCase();
  if (["python", "py"].includes(l))
    return ["def", "class", "return", "import", "from", "if", "elif", "else", "for", "while", "try", "except", "finally", "with", "as", "lambda", "yield", "pass", "break", "continue", "True", "False", "None", "and", "or", "not", "in", "is", "async", "await", "raise", "print", "self"];
  if (["javascript", "js", "jsx", "typescript", "ts", "tsx"].includes(l))
    return ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "async", "await", "try", "catch", "finally", "new", "this", "true", "false", "null", "undefined", "typeof", "instanceof", "switch", "case", "break", "throw", "yield", "of", "in", "interface", "type", "enum", "extends", "implements"];
  if (["java", "c", "cpp", "c++", "csharp", "cs"].includes(l))
    return ["public", "private", "protected", "class", "static", "void", "int", "String", "boolean", "return", "if", "else", "for", "while", "new", "this", "try", "catch", "throw", "final", "abstract", "import"];
  if (l === "sql")
    return ["SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "JOIN", "LEFT", "RIGHT", "INNER", "ON", "AND", "OR", "NOT", "IN", "NULL", "IS", "AS", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "INTO", "VALUES", "SET", "DEFAULT"];
  return [];
}

/* ═══════════════════════════════════════════════
   TABLE — Alternating rows + copy-as-CSV
   ═══════════════════════════════════════════════ */

function GnaraTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [copied, setCopied] = useState(false);

  const copyAsCsv = () => {
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    navigator.clipboard?.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-x-auto rounded-xl border border-cn-border/60">
      {/* Copy CSV button */}
      <button
        type="button"
        onClick={copyAsCsv}
        className="absolute top-1.5 right-2 text-[10px] font-medium text-cn-ink-subtle hover:text-cn-ink transition z-10"
      >
        {copied ? "✓ Copied" : "📋 CSV"}
      </button>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cn-border bg-cn-canvas/80">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-[11px] font-bold text-cn-ink uppercase tracking-wider">
                <InlineMarkdown text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cn-border/40">
          {rows.map((row, ri) => (
            <tr key={ri} className={`${ri % 2 === 0 ? "" : "bg-cn-canvas/30"} hover:bg-cn-canvas/60 transition-colors`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-cn-ink-muted text-[13px]">
                  <InlineMarkdown text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STEP SEQUENCE — Numbered steps with connecting lines
   ═══════════════════════════════════════════════ */

function GnaraStepSequence({ items }: { items: string[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 group">
          {/* Step number + connecting line */}
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-400 ring-1 ring-indigo-500/30">
              {i + 1}
            </div>
            {i < items.length - 1 && (
              <div className="w-px flex-1 bg-indigo-500/20 min-h-[12px]" />
            )}
          </div>
          {/* Step content */}
          <div className="pb-3 pt-0.5 text-sm text-cn-ink leading-relaxed">
            <InlineMarkdown text={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BULLET LIST — Custom indigo dots with nesting
   ═══════════════════════════════════════════════ */

function GnaraBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-cn-ink">
          <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-indigo-500/60" />
          <span className="leading-relaxed"><InlineMarkdown text={item} /></span>
        </li>
      ))}
    </ul>
  );
}

/* ═══════════════════════════════════════════════
   INLINE MARKDOWN — Bold, italic, code, links
   ═══════════════════════════════════════════════ */

export function InlineMarkdown({ text }: { text: string }) {
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
        <code key={keyIdx++} className="rounded-md bg-indigo-500/[0.08] px-1.5 py-0.5 text-xs font-mono text-indigo-300">
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
      parts.push(<em key={keyIdx++} className="text-cn-ink-muted">{italicMatch[2]}</em>);
      remaining = italicMatch[3];
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)/);
    if (linkMatch) {
      if (linkMatch[1]) parts.push(linkMatch[1]);
      parts.push(
        <a key={keyIdx++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition">
          {linkMatch[2]}
        </a>
      );
      remaining = linkMatch[4];
      continue;
    }

    // No more patterns
    parts.push(remaining);
    break;
  }

  return <>{parts}</>;
}
