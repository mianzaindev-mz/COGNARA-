"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AgentIcon } from "@/components/ui/agent-icon";

type Props = {
  content: string;
  onClose: () => void;
  lang: "en" | "ur";
};

/**
 * StudyBoard — Full-screen visual whiteboard teaching overlay.
 * Renders AI response as ONE continuous visual lesson with:
 * - Syntax-highlighted code blocks
 * - SVG concept diagrams (variables, call stacks, flows)
 * - Styled tables, blockquotes, headers
 * - Voice narration with male voice
 */
export function StudyBoard({ content, onClose }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = content
      .replace(/```[\s\S]*?```/g, " ... code example ... ")
      .replace(/\|[^\n]+\|/g, "").replace(/---+/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
      .replace(/[`~>\[\]|]/g, "").replace(/\n+/g, ". ")
      .replace(/\s{2,}/g, " ").trim().slice(0, 1500);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    // Male voice priority
    const voices = window.speechSynthesis.getVoices();
    const male =
      voices.find(v => v.name.includes("Microsoft David")) ||
      voices.find(v => v.name.includes("Microsoft Mark")) ||
      voices.find(v => v.name.includes("Microsoft Guy")) ||
      voices.find(v => v.name.includes("Google UK English Male")) ||
      voices.find(v => v.name.includes("Alex")) ||
      voices.find(v => v.name.includes("Daniel")) ||
      voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ||
      voices.find(v => v.lang === "en-US");
    if (male) utterance.voice = male;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [content, isSpeaking]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { stopSpeaking(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, stopSpeaking]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // Parse and render
  const sections = parseToVisualSections(content);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117]/98 backdrop-blur-md">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink shadow-lg shadow-cn-orange/20">
            <AgentIcon size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">COGNARA Whiteboard</h2>
            <p className="text-[11px] text-white/35">Visual teaching session</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-400 animate-pulse">
              <SpeakerIcon /> Speaking...
            </span>
          )}
          <button type="button" onClick={speak}
            className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
              isSpeaking ? "bg-rose-500/20 text-rose-400" : "bg-cn-orange/15 text-cn-orange hover:bg-cn-orange/25"
            }`}>
            {isSpeaking ? "■ Stop" : "▶ Narrate"}
          </button>
          <button type="button" onClick={() => { stopSpeaking(); onClose(); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-white/50 transition hover:bg-white/15 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      {/* Board content — single continuous scroll */}
      <div className="flex-1 overflow-y-auto" ref={boardRef}>
        <div className="mx-auto max-w-4xl px-8 py-10 space-y-6">
          {sections.map((section, i) => (
            <React.Fragment key={i}>
              {section.type === "heading" && (
                <h2 className="text-2xl font-extrabold text-white tracking-tight border-b-2 border-cn-orange/30 pb-3 mb-2">
                  {section.text}
                </h2>
              )}
              {section.type === "subheading" && (
                <h3 className="text-lg font-bold text-amber-400 mt-8 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 rounded bg-gradient-to-b from-cn-orange to-amber-400" />
                  {section.text}
                </h3>
              )}
              {section.type === "text" && (
                <p className="text-[15px] leading-relaxed text-white/80"
                   dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(section.text) }} />
              )}
              {section.type === "blockquote" && (
                <div className="border-l-[3px] border-cn-orange bg-cn-orange/5 rounded-r-xl px-5 py-4 my-4">
                  <p className="text-[15px] text-white/85 leading-relaxed"
                     dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(section.text) }} />
                </div>
              )}
              {section.type === "code" && (
                <div className="relative rounded-xl border border-white/8 bg-[#0a0e14] overflow-hidden my-4">
                  {section.lang && (
                    <div className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-widest text-white/15">
                      {section.lang}
                    </div>
                  )}
                  <pre className="p-5 overflow-x-auto text-[13px] leading-[1.7] font-mono">
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(section.text, section.lang || "") }} />
                  </pre>
                </div>
              )}
              {section.type === "table" && (
                <div className="rounded-xl border border-white/8 overflow-hidden my-4"
                     dangerouslySetInnerHTML={{ __html: renderTable(section.text) }} />
              )}
              {section.type === "list" && (
                <ul className="space-y-2 my-3 pl-1">
                  {section.items!.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[15px] text-white/78 leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cn-orange" />
                      <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
                    </li>
                  ))}
                </ul>
              )}
              {section.type === "olist" && (
                <ol className="space-y-2 my-3 pl-1 counter-reset-list">
                  {section.items!.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[15px] text-white/78 leading-relaxed">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-[11px] font-bold text-amber-400">
                        {j + 1}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
                    </li>
                  ))}
                </ol>
              )}
              {section.type === "diagram" && (
                <VariableDiagram data={section.diagramData!} />
              )}
              {section.type === "callstack" && (
                <CallStackDiagram data={section.diagramData!} />
              )}
              {section.type === "hr" && (
                <hr className="border-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 py-2 text-center text-[10px] text-white/20">
        Esc — Close board
      </div>
    </div>
  );
}

/* ─── SVG Diagrams ─── */

function VariableDiagram({ data }: { data: { name?: string; value?: string; type?: string; label?: string; result?: string }[] }) {
  const boxW = 180, boxH = 70, gap = 20, pad = 30;
  const cols = Math.min(data.length, 4);
  const rows = Math.ceil(data.length / cols);
  const w = cols * (boxW + gap) - gap + pad * 2;
  const h = rows * (boxH + gap) - gap + pad * 2;

  return (
    <div className="my-5 flex justify-center">
      <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w, 750)} className="drop-shadow-lg">
        {data.map((v, i) => {
          const col = i % cols, row = Math.floor(i / cols);
          const x = pad + col * (boxW + gap), y = pad + row * (boxH + gap);
          return (
            <g key={i}>
              <rect x={x} y={y} width={boxW} height={boxH} rx={12}
                fill="#1a1f2e" stroke="#ff5734" strokeWidth={2} />
              <rect x={x} y={y} width={boxW} height={24} rx={0}
                fill="rgba(255,87,52,0.15)" />
              {/* Round top corners clip */}
              <rect x={x} y={y} width={boxW} height={12} rx={12} fill="rgba(255,87,52,0.15)" />
              <text x={x + boxW / 2} y={y + 16} textAnchor="middle"
                fill="#ff8a6b" fontSize={11} fontWeight={700} fontFamily="monospace">
                {v.name || "?"}
              </text>
              <text x={x + boxW / 2} y={y + 48} textAnchor="middle"
                fill="#fff" fontSize={16} fontWeight={800} fontFamily="monospace">
                {v.value || ""}
              </text>
              <text x={x + boxW / 2} y={y + 63} textAnchor="middle"
                fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="monospace">
                {v.type || ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CallStackDiagram({ data }: { data: { name?: string; value?: string; type?: string; label?: string; result?: string }[] }) {
  const boxW = 340, boxH = 40, gap = 4, pad = 20;
  const h = data.length * (boxH + gap) - gap + pad * 2;

  return (
    <div className="my-5 flex justify-center">
      <svg viewBox={`0 0 ${boxW + pad * 2} ${h}`} width={Math.min(boxW + pad * 2, 500)} className="drop-shadow-lg">
        <text x={pad} y={14} fill="rgba(255,255,255,0.3)" fontSize={10} fontWeight={700} fontFamily="monospace">
          CALL STACK ↓
        </text>
        {data.map((frame, i) => {
          const y = pad + i * (boxH + gap);
          const depth = i / Math.max(data.length - 1, 1);
          const fillOpacity = 0.12 + depth * 0.08;
          return (
            <g key={i}>
              <rect x={pad + i * 8} y={y} width={boxW - i * 16} height={boxH} rx={8}
                fill={`rgba(255,87,52,${fillOpacity})`} stroke="rgba(255,87,52,0.4)" strokeWidth={1} />
              <text x={pad + i * 8 + 14} y={y + 25} fill="#ff8a6b" fontSize={13}
                fontWeight={600} fontFamily="monospace">
                {frame.label || frame.name || ""}
              </text>
              {frame.result && (
                <text x={boxW + pad - i * 8 - 14} y={y + 25} textAnchor="end"
                  fill="#a5d6a7" fontSize={12} fontWeight={700} fontFamily="monospace">
                  → {frame.result}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.536 14.01A8.473 8.473 0 0014 8a8.473 8.473 0 00-2.464-6.01l-.707.707A7.476 7.476 0 0113 8a7.476 7.476 0 01-2.172 5.303l.708.707z" />
      <path d="M10.121 12.596A6.48 6.48 0 0012 8a6.48 6.48 0 00-1.879-4.596l-.707.707A5.483 5.483 0 0111 8a5.483 5.483 0 01-1.586 3.889l.707.707zM6.707.293A1 1 0 005.293.293L2.586 3H1a1 1 0 00-1 1v8a1 1 0 001 1h1.586l2.707 2.707A1 1 0 007 15V1a1 1 0 00-.293-.707z" />
    </svg>
  );
}

/* ─── Content Parser ─── */

type Section = {
  type: "heading" | "subheading" | "text" | "code" | "blockquote" | "table" | "list" | "olist" | "hr" | "diagram" | "callstack";
  text: string;
  lang?: string;
  items?: string[];
  diagramData?: { name?: string; value?: string; type?: string; label?: string; result?: string }[];
};

function parseToVisualSections(md: string): Section[] {
  const sections: Section[] = [];
  const lines = md.split("\n");
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
      i++; // skip closing ```
      const codeText = codeLines.join("\n");
      sections.push({ type: "code", text: codeText, lang });

      // Auto-detect diagrams from code
      const vars = extractVariables(codeText);
      if (vars.length > 0) sections.push({ type: "diagram", text: "", diagramData: vars });
      const stack = extractCallStack(codeText);
      if (stack.length > 0) sections.push({ type: "callstack", text: "", diagramData: stack });
      continue;
    }

    // Heading
    if (/^## /.test(line)) { sections.push({ type: "heading", text: line.replace(/^## /, "").replace(/[*_`]/g, "") }); i++; continue; }
    if (/^### /.test(line)) { sections.push({ type: "subheading", text: line.replace(/^### /, "").replace(/[*_`]/g, "") }); i++; continue; }

    // HR
    if (/^[-*_]{3,}\s*$/.test(line)) { sections.push({ type: "hr", text: "" }); i++; continue; }

    // Table
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      sections.push({ type: "table", text: tableLines.join("\n") });
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        bqLines.push(lines[i].replace(/^>\s*/, ""));
        i++;
      }
      sections.push({ type: "blockquote", text: bqLines.join(" ") });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s*/, ""));
        i++;
      }
      sections.push({ type: "olist", text: "", items });
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s*/, ""));
        i++;
      }
      sections.push({ type: "list", text: "", items });
      continue;
    }

    // Regular text
    if (line.trim()) {
      sections.push({ type: "text", text: line });
    }
    i++;
  }

  return sections;
}

/* ─── Diagram Extractors ─── */

function extractVariables(code: string): { name: string; value: string; type: string }[] {
  const vars: { name: string; value: string; type: string }[] = [];
  const regex = /^(\w+)\s*=\s*(.+?)(?:\s*#.*)?$/gm;
  let m;
  while ((m = regex.exec(code)) !== null) {
    const name = m[1], rawVal = m[2].trim();
    if (["def", "class", "import", "from", "for", "while", "if"].includes(name)) continue;
    let type = "unknown";
    if (/^["']/.test(rawVal) || /^f["']/.test(rawVal)) type = "str";
    else if (/^(True|False)$/i.test(rawVal)) type = "bool";
    else if (/^\d+$/.test(rawVal)) type = "int";
    else if (/^\d+\.\d+$/.test(rawVal)) type = "float";
    else if (/^\[/.test(rawVal)) type = "list";
    else if (/^\{/.test(rawVal)) type = "dict";
    else type = "expr";
    vars.push({ name, value: rawVal.slice(0, 20), type });
  }
  return vars.slice(0, 8);
}

function extractCallStack(code: string): { label: string; result?: string }[] {
  const frames: { label: string; result?: string }[] = [];
  const regex = /^#\s*([\w()\s*×+\-=,]+(?:→|->|=|returns)\s*.+)$/gm;
  let m;
  while ((m = regex.exec(code)) !== null) {
    const line = m[1].trim();
    const parts = line.split(/→|->|returns/);
    frames.push({ label: parts[0].trim(), result: parts[1]?.trim() });
  }
  return frames.slice(0, 10);
}

/* ─── Inline Markdown ─── */

function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-white/50 italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-cn-orange/10 text-orange-300 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>');
}

/* ─── Table Renderer ─── */

function renderTable(tableText: string): string {
  const rows = tableText.split("\n").filter(r => !/^[\s|:-]+$/.test(r) || r.includes("---"));
  const dataRows = rows.filter(r => !/^\|[\s:-]+\|$/.test(r));
  if (dataRows.length < 1) return "";

  const headerCells = dataRows[0].split("|").filter(c => c.trim())
    .map(c => `<th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-orange-300 bg-orange-500/10">${c.trim()}</th>`).join("");

  const bodyRows = dataRows.slice(1).map(row => {
    const cells = row.split("|").filter(c => c.trim())
      .map(c => `<td class="px-4 py-2.5 text-[14px] text-white/70 border-t border-white/5">${formatInlineMarkdown(c.trim())}</td>`).join("");
    return `<tr class="hover:bg-white/[0.02] transition">${cells}</tr>`;
  }).join("");

  return `<table class="w-full"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

/* ─── Code Highlighter ─── */

function highlightCode(code: string, lang: string): string {
  let r = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Comments
  if (lang === "python" || lang === "bash") {
    r = r.replace(/(#.*)$/gm, '<span style="color:rgba(255,255,255,0.28);font-style:italic">$1</span>');
  } else {
    r = r.replace(/(\/\/.*)$/gm, '<span style="color:rgba(255,255,255,0.28);font-style:italic">$1</span>');
  }

  // Strings
  r = r.replace(/(f?"[^"]*"|'[^']*')/g, '<span style="color:#c3e88d">$1</span>');

  // Keywords
  const kw = lang === "python"
    ? "def|class|if|elif|else|for|while|return|import|from|in|not|and|or|True|False|None|try|except|with|as|break|continue|pass|raise|yield"
    : "function|const|let|var|if|else|for|while|return|import|from|export|class|new|this|async|await|try|catch|throw";
  r = r.replace(new RegExp(`\\b(${kw})\\b`, "g"), '<span style="color:#c792ea">$1</span>');

  // Numbers
  r = r.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');

  // Function calls
  r = r.replace(/\b([a-zA-Z_]\w*)\(/g, '<span style="color:#82aaff">$1</span>(');

  return r;
}
