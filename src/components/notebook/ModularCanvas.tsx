"use client";

import React, { useState, useEffect, useRef } from "react";

export interface Block {
  id: string;
  type:
    | "text"
    | "heading"
    | "bullet_list"
    | "numbered_list"
    | "checkbox"
    | "code"
    | "math"
    | "image"
    | "embed"
    | "url"
    | "divider"
    | "callout"
    | "table"
    | "timestamp"
    | "ai_summary"
    | "sticky_note";
  content: string;
  properties?: any; // level, checked, language, rows, columns, color, timestamp, align, etc.
  createdAt: string;
  lastEditedAt: string;
  isAiGenerated?: boolean;
  videoTimestampRange?: { start: number; end: number };
}

// LaTeX dynamic rendering from CDN (lightweight, zero bundle size issues)
export function KatexRenderer({ math, block = false }: { math: string; block?: boolean }) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    const loadKatex = () => {
      if (!(window as any).katex) {
        if (!document.getElementById("katex-css")) {
          const link = document.createElement("link");
          link.id = "katex-css";
          link.rel = "stylesheet";
          link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
          document.head.appendChild(link);
        }
        if (!document.getElementById("katex-js")) {
          const script = document.createElement("script");
          script.id = "katex-js";
          script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
          script.async = true;
          document.body.appendChild(script);
          script.onload = () => renderMath();
        } else {
          checkInterval = setInterval(() => {
            if ((window as any).katex) {
              clearInterval(checkInterval);
              renderMath();
            }
          }, 100);
        }
      } else {
        renderMath();
      }
    };

    const renderMath = () => {
      try {
        const rendered = (window as any).katex.renderToString(math, {
          displayMode: block,
          throwOnError: false,
        });
        setHtml(rendered);
      } catch (e) {
        setHtml(`<span class="text-rose-500 font-mono text-xs">${e}</span>`);
      }
    };

    loadKatex();
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [math, block]);

  return <span dangerouslySetInnerHTML={{ __html: html || math }} />;
}

interface ModularCanvasProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  videoPlayer?: {
    getCurrentTime: () => number;
    seekTo: (time: number) => void;
    isPlaying: () => boolean;
  };
  onTriggerAISummary?: (timestamp: number, blockId: string) => Promise<string>;
  onTriggerAIExplain?: (text: string, blockId: string) => Promise<void>;
}

export function ModularCanvas({
  blocks,
  onChange,
  videoPlayer,
  onTriggerAISummary,
  onTriggerAIExplain,
}: ModularCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashMenuSearch, setSlashMenuSearch] = useState<string>("");
  const [slashMenuIndex, setSlashMenuIndex] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const blockRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const blockTypesList = [
    { type: "text", label: "Text Block", desc: "Start typing clean markdown notes.", icon: "✍️" },
    { type: "heading", label: "Heading Block", desc: "Add sections with H1, H2, H3.", icon: "🏷️" },
    { type: "bullet_list", label: "Bullet List", desc: "Bulleted points with tab indents.", icon: "•" },
    { type: "numbered_list", label: "Numbered List", desc: "Auto-numbering list items.", icon: "1." },
    { type: "checkbox", label: "To-Do / Checkbox", desc: "Ticked list items with cross out.", icon: "☑️" },
    { type: "code", label: "Code Snippet", desc: "Monospace code syntax editor.", icon: "💻" },
    { type: "math", label: "Math / LaTeX Formula", desc: "Render standard LaTeX formulas.", icon: "🧮" },
    { type: "image", label: "Image Block", desc: "Upload or paste an inline image URL.", icon: "🖼️" },
    { type: "embed", label: "Embed Frame", desc: "Insert standard iframe URL elements.", icon: "🌐" },
    { type: "url", label: "URL Reference Card", desc: "Clean bookmark link previews.", icon: "🔗" },
    { type: "divider", label: "Divider Line", desc: "Visual separator rule.", icon: "―" },
    { type: "callout", label: "Callout Highlights", desc: "Colored alert containers.", icon: "💡" },
    { type: "table", label: "Editable Table", desc: "Simple grids with custom rows/columns.", icon: "📊" },
    { type: "timestamp", label: "Video Timestamp", desc: "Clickable badge syncing note playback.", icon: "▶" },
    { type: "ai_summary", label: "AI Summary Block", desc: "Extract current content summaries.", icon: "🤖" },
    { type: "sticky_note", label: "Colored Sticky Note", desc: "Quick styled text observation cards.", icon: "📌" },
  ];

  const filteredBlockTypes = blockTypesList.filter((b) =>
    b.label.toLowerCase().includes(slashMenuSearch.toLowerCase())
  );

  const createBlock = (type: Block["type"], content = "", properties = {}): Block => {
    const playhead = videoPlayer?.getCurrentTime() || 0;
    return {
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      properties: {
        checked: false,
        level: 2,
        language: "javascript",
        color: "blue", // default for callout
        rows: [["Cell 1", "Cell 2"], ["Cell 3", "Cell 4"]], // default for table
        ...properties,
      },
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      videoTimestampRange: { start: playhead, end: playhead },
    };
  };

  const handleAddBlock = (type: Block["type"]) => {
    const newBlock = createBlock(type);
    onChange([...blocks, newBlock]);
    setTimeout(() => focusBlock(newBlock.id), 50);
  };

  const handleInsertBlockAt = (index: number, type: Block["type"]) => {
    const newBlock = createBlock(type);
    const updated = [...blocks];
    updated.splice(index, 0, newBlock);
    onChange(updated);
    setTimeout(() => focusBlock(newBlock.id), 50);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const playhead = videoPlayer?.getCurrentTime() || 0;
    const updated = blocks.map((b) => {
      if (b.id === id) {
        const timeRange = b.videoTimestampRange
          ? { ...b.videoTimestampRange, end: playhead }
          : { start: playhead, end: playhead };
        return {
          ...b,
          ...updates,
          videoTimestampRange: timeRange,
          lastEditedAt: new Date().toISOString(),
        };
      }
      return b;
    });
    onChange(updated);
  };

  const deleteBlock = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    const updated = blocks.filter((b) => b.id !== id);
    onChange(updated);
    setSelectedBlockId(null);

    // Focus previous block if deleted
    if (index > 0 && updated.length > 0) {
      focusBlock(updated[index - 1].id);
    }
  };

  const focusBlock = (id: string) => {
    const el = blockRefs.current[id];
    if (el) {
      const editable = el.querySelector("[contenteditable='true']") as HTMLElement;
      if (editable) {
        editable.focus();
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editable);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        const input = el.querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;
        if (input) input.focus();
      }
    }
  };

  // Drag and Drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...blocks];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    onChange(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, block: Block, index: number) => {
    if (slashMenuBlockId === block.id) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashMenuIndex((prev) => (prev + 1) % filteredBlockTypes.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashMenuIndex((prev) => (prev - 1 + filteredBlockTypes.length) % filteredBlockTypes.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredBlockTypes[slashMenuIndex];
        if (selected) {
          convertBlock(block.id, selected.type as Block["type"]);
        }
        setSlashMenuBlockId(null);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenuBlockId(null);
        return;
      }
    }

    if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      deleteBlock(block.id);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      // Don't intercept Enter in multi-line code, embed, table, math edit views
      if (["code", "table", "math", "embed", "url", "image"].includes(block.type)) {
        return;
      }
      e.preventDefault();
      handleInsertBlockAt(index + 1, "text");
    }

    // Tab/Shift-Tab for list indentation
    if (e.key === "Tab" && (block.type === "bullet_list" || block.type === "numbered_list")) {
      e.preventDefault();
      const indent = block.properties?.indent || 0;
      if (e.shiftKey) {
        updateBlock(block.id, {
          properties: { ...block.properties, indent: Math.max(0, indent - 1) },
        });
      } else {
        updateBlock(block.id, {
          properties: { ...block.properties, indent: Math.min(4, indent + 1) },
        });
      }
    }
  };

  const handleTextChange = (id: string, val: string) => {
    updateBlock(id, { content: val });
    if (val.startsWith("/")) {
      setSlashMenuBlockId(id);
      setSlashMenuSearch(val.slice(1));
      setSlashMenuIndex(0);
    } else {
      if (slashMenuBlockId === id) setSlashMenuBlockId(null);
    }
  };

  const convertBlock = (id: string, type: Block["type"]) => {
    const playhead = videoPlayer?.getCurrentTime() || 0;
    const defaultProps: any = {};
    if (type === "callout") defaultProps.color = "blue";
    if (type === "table") defaultProps.rows = [["", ""], ["", ""]];
    if (type === "timestamp") {
      const totalSec = Math.floor(playhead);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      defaultProps.timeSec = totalSec;
      defaultProps.badgeText = `▶ ${mins}:${secs.toString().padStart(2, "0")}`;
    }
    if (type === "sticky_note") defaultProps.color = "yellow";

    updateBlock(id, {
      type,
      content: "",
      properties: defaultProps,
    });
    setSlashMenuBlockId(null);
  };

  const renderBlockEditor = (block: Block) => {
    switch (block.type) {
      case "heading": {
        const hLevel = block.properties?.level || 2;
        const Tag = hLevel === 1 ? "h1" : hLevel === 3 ? "h3" : "h2";
        const placeholder = hLevel === 1 ? "Heading 1" : hLevel === 3 ? "Heading 3" : "Heading 2";
        const sizeClass =
          hLevel === 1
            ? "text-xl font-extrabold text-cn-ink border-b border-cn-border pb-1 dark:text-white"
            : hLevel === 3
            ? "text-sm font-bold text-cn-ink-muted dark:text-gray-300"
            : "text-base font-extrabold text-cn-ink dark:text-white";

        return (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex gap-2 items-center text-xs text-cn-ink-subtle">
              <span className="font-semibold uppercase text-[10px]">Heading Level:</span>
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => updateBlock(block.id, { properties: { ...block.properties, level: lvl } })}
                  className={`px-1.5 py-0.5 rounded transition ${
                    hLevel === lvl
                      ? "bg-cn-orange/15 text-cn-orange font-bold"
                      : "hover:bg-cn-border"
                  }`}
                >
                  H{lvl}
                </button>
              ))}
            </div>
            <Tag
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              onInput={(e) => handleTextChange(block.id, e.currentTarget.textContent || "")}
              data-placeholder={placeholder}
              className={`${sizeClass} outline-none w-full min-h-[1.5rem]`}
            >
              {block.content}
            </Tag>
          </div>
        );
      }

      case "bullet_list":
      case "numbered_list": {
        const indent = block.properties?.indent || 0;
        const indentClass = `ml-${indent * 4}`;
        return (
          <div className={`flex items-start gap-2 w-full ${indentClass}`}>
            <span className="font-bold text-cn-orange select-none mt-0.5 shrink-0">
              {block.type === "bullet_list" ? "•" : `${block.properties?.index || 1}.`}
            </span>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              onInput={(e) => handleTextChange(block.id, e.currentTarget.textContent || "")}
              data-placeholder="List item... (Press Tab to indent)"
              className="outline-none flex-1 text-sm text-cn-ink leading-relaxed"
            >
              {block.content}
            </div>
          </div>
        );
      }

      case "checkbox":
        return (
          <div className="flex items-start gap-2.5 w-full">
            <input
              type="checkbox"
              checked={block.properties?.checked || false}
              onChange={(e) =>
                updateBlock(block.id, { properties: { ...block.properties, checked: e.target.checked } })
              }
              className="mt-1 h-4 w-4 rounded border-cn-border text-cn-orange focus:ring-cn-orange cursor-pointer"
            />
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              onInput={(e) => handleTextChange(block.id, e.currentTarget.textContent || "")}
              data-placeholder="Action item..."
              className={`outline-none flex-1 text-sm leading-relaxed text-cn-ink ${
                block.properties?.checked ? "line-through text-cn-ink-subtle opacity-60" : ""
              }`}
            >
              {block.content}
            </div>
          </div>
        );

      case "code":
        return (
          <div className="flex flex-col gap-2 w-full bg-stone-900 border border-cn-border p-3.5 rounded-xl text-xs font-mono dark:bg-[#030107] dark:border-[#221740]">
            <div className="flex justify-between items-center select-none text-[9px] font-bold text-cn-ink-subtle uppercase tracking-wider">
              <select
                value={block.properties?.language || "javascript"}
                onChange={(e) =>
                  updateBlock(block.id, { properties: { ...block.properties, language: e.target.value } })
                }
                className="bg-transparent text-cn-ink-subtle font-mono outline-none cursor-pointer hover:text-white"
              >
                <option value="javascript">Javascript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="typescript">Typescript</option>
                <option value="sql">SQL</option>
              </select>
              <span>Code Snippet</span>
            </div>
            <textarea
              rows={4}
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="// paste or write code snippet here..."
              className="w-full bg-transparent text-emerald-400 font-mono focus:outline-none resize-y border-none p-0 scrollbar-none"
            />
          </div>
        );

      case "math":
        return (
          <div className="flex flex-col gap-2.5 w-full bg-cn-canvas p-3 rounded-xl border border-cn-border dark:bg-black/35">
            <div className="flex justify-between items-center text-[10px] text-cn-ink-subtle font-semibold">
              <span>LaTeX Formula Input</span>
              <span className="font-mono bg-cn-border/40 px-1 rounded">$$ math $$</span>
            </div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="e.g. f(x) = \int_{-\infty}^{\infty} e^{-x^2} dx"
              className="w-full text-sm font-mono bg-transparent border-b border-cn-border pb-1 focus:outline-none focus:border-cn-orange text-cn-ink"
            />
            {block.content && (
              <div className="py-2.5 px-3 rounded bg-white flex justify-center overflow-x-auto text-cn-ink border border-cn-border/50 dark:bg-stone-900 shadow-sm min-h-[2.5rem] items-center">
                <KatexRenderer math={block.content} block />
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="flex flex-col gap-2 w-full border border-cn-border p-3 rounded-xl bg-cn-surface">
            <div className="text-xs text-cn-ink-muted font-bold">Image Block</div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Paste image url (http://...) or drop path here..."
              className="w-full text-xs p-2 rounded bg-cn-canvas border border-cn-border text-cn-ink focus:outline-none focus:border-cn-orange"
            />
            {block.content && block.content.startsWith("http") ? (
              <div className="relative group max-h-[350px] overflow-hidden rounded-lg flex items-center justify-center bg-black/5 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.content}
                  alt="Student upload"
                  className="max-h-[350px] w-full object-contain"
                />
              </div>
            ) : (
              <div className="text-[10px] text-cn-ink-subtle italic">Enter URL to preview image</div>
            )}
          </div>
        );

      case "embed":
        return (
          <div className="flex flex-col gap-2 w-full border border-cn-border p-3 rounded-xl bg-cn-surface">
            <div className="text-xs text-cn-ink-muted font-bold">Embed Frame</div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Paste iframe url (http://...)"
              className="w-full text-xs p-2 rounded bg-cn-canvas border border-cn-border text-cn-ink focus:outline-none focus:border-cn-orange"
            />
            {block.content && block.content.startsWith("http") ? (
              <iframe
                src={block.content}
                className="w-full h-44 rounded-lg border border-cn-border mt-2 shadow-sm"
              />
            ) : (
              <div className="text-[10px] text-cn-ink-subtle italic">Enter URL to preview iframe</div>
            )}
          </div>
        );

      case "url":
        return (
          <div className="flex flex-col gap-2 w-full border border-cn-border p-3 rounded-xl bg-cn-surface">
            <div className="text-xs text-cn-ink-muted font-bold">URL Card Reference</div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Paste bookmark URL link..."
              className="w-full text-xs p-2 rounded bg-cn-canvas border border-cn-border text-cn-ink focus:outline-none"
            />
            {block.content && block.content.startsWith("http") && (
              <a
                href={block.content}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3.5 border border-cn-border rounded-xl bg-cn-canvas hover:border-cn-orange/40 transition mt-2 cursor-pointer dark:bg-[#0c081d]/85"
              >
                <span className="text-lg">🔗</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-cn-ink truncate">Reference Link</p>
                  <p className="text-[10px] text-cn-ink-muted truncate font-mono">{block.content}</p>
                </div>
              </a>
            )}
          </div>
        );

      case "divider":
        return <hr className="w-full border-cn-border my-2.5 dark:border-stone-800" />;

      case "callout": {
        const color = block.properties?.color || "blue";
        const colorClasses =
          color === "yellow"
            ? "bg-amber-500/10 border-amber-400 text-amber-900 dark:text-amber-200"
            : color === "red"
            ? "bg-rose-500/10 border-rose-400 text-rose-900 dark:text-rose-200"
            : color === "green"
            ? "bg-emerald-500/10 border-emerald-400 text-emerald-900 dark:text-emerald-200"
            : "bg-indigo-500/10 border-indigo-400 text-indigo-900 dark:text-indigo-200";

        const emoji = color === "yellow" ? "💡" : color === "red" ? "⚠️" : color === "green" ? "✅" : "ℹ️";

        return (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center text-[10px] font-bold text-cn-ink-subtle">
              <span>CALLOUT TYPE:</span>
              {["blue", "yellow", "red", "green"].map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => updateBlock(block.id, { properties: { ...block.properties, color: clr } })}
                  className={`capitalize px-1.5 py-0.5 rounded transition ${
                    color === clr ? "bg-cn-orange text-white" : "hover:bg-cn-border"
                  }`}
                >
                  {clr}
                </button>
              ))}
            </div>
            <div className={`p-4 rounded-xl border-l-4 ${colorClasses} flex gap-3 items-start w-full`}>
              <span className="text-base select-none mt-0.5">{emoji}</span>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
                onInput={(e) => handleTextChange(block.id, e.currentTarget.textContent || "")}
                data-placeholder="Important callout info..."
                className="outline-none flex-1 text-sm leading-relaxed"
              >
                {block.content}
              </div>
            </div>
          </div>
        );
      }

      case "table": {
        const rows = block.properties?.rows || [
          ["", ""],
          ["", ""],
        ];
        const addRow = () => {
          const newRows = [...rows, Array(rows[0].length).fill("")];
          updateBlock(block.id, { properties: { ...block.properties, rows: newRows } });
        };
        const addCol = () => {
          const newRows = rows.map((r: string[]) => [...r, ""]);
          updateBlock(block.id, { properties: { ...block.properties, rows: newRows } });
        };
        const deleteRow = (rIdx: number) => {
          if (rows.length <= 1) return;
          const newRows = rows.filter((_: any, idx: number) => idx !== rIdx);
          updateBlock(block.id, { properties: { ...block.properties, rows: newRows } });
        };
        const deleteCol = (cIdx: number) => {
          if (rows[0].length <= 1) return;
          const newRows = rows.map((r: string[]) => r.filter((_, idx) => idx !== cIdx));
          updateBlock(block.id, { properties: { ...block.properties, rows: newRows } });
        };
        const setCell = (rIdx: number, cIdx: number, val: string) => {
          const newRows = rows.map((r: string[], rI: number) =>
            rI === rIdx ? r.map((c, cI) => (cI === cIdx ? val : c)) : r
          );
          updateBlock(block.id, { properties: { ...block.properties, rows: newRows } });
        };

        return (
          <div className="flex flex-col gap-2 w-full overflow-x-auto">
            <div className="flex gap-3 text-[10px] font-bold text-cn-ink-subtle select-none">
              <button
                type="button"
                onClick={addRow}
                className="hover:text-cn-orange flex items-center gap-0.5"
              >
                ➕ Row
              </button>
              <button
                type="button"
                onClick={addCol}
                className="hover:text-cn-orange flex items-center gap-0.5"
              >
                ➕ Col
              </button>
              <span>Table Grid</span>
            </div>
            <table className="border-collapse border border-cn-border w-full text-xs text-cn-ink">
              <tbody>
                {rows.map((row: string[], rIdx: number) => (
                  <tr key={rIdx} className="border-b border-cn-border">
                    {row.map((cell: string, cIdx: number) => (
                      <td key={cIdx} className="border border-cn-border p-2 min-w-[70px] relative group">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => setCell(rIdx, cIdx, e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-xs text-cn-ink focus:ring-1 focus:ring-cn-orange"
                        />
                        {rows.length > 1 && cIdx === 0 && (
                          <button
                            type="button"
                            onClick={() => deleteRow(rIdx)}
                            className="hidden group-hover:block absolute -left-5 top-2 text-rose-500 font-bold bg-white dark:bg-stone-800 rounded px-1 text-[9px] shadow border border-cn-border"
                            title="Delete Row"
                          >
                            ×
                          </button>
                        )}
                        {rows[0].length > 1 && rIdx === 0 && (
                          <button
                            type="button"
                            onClick={() => deleteCol(cIdx)}
                            className="hidden group-hover:block absolute -top-5 left-2 text-rose-500 font-bold bg-white dark:bg-stone-800 rounded px-1 text-[9px] shadow border border-cn-border"
                            title="Delete Column"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "timestamp":
        return (
          <div className="flex gap-2 items-center w-full">
            <button
              type="button"
              onClick={() => videoPlayer?.seekTo(block.properties?.timeSec || 0)}
              className="inline-flex items-center gap-1.5 rounded-full bg-cn-orange px-3.5 py-1 text-xs font-bold text-white hover:bg-cn-orange-hover shadow-sm transition active:scale-95"
            >
              <span>{block.properties?.badgeText || "▶ 00:00"}</span>
            </button>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              onInput={(e) => handleTextChange(block.id, e.currentTarget.textContent || "")}
              data-placeholder="Add key takeaway at this timestamp..."
              className="outline-none flex-1 text-sm text-cn-ink-muted font-medium italic"
            >
              {block.content}
            </div>
          </div>
        );

      case "ai_summary": {
        const handleGenerate = async () => {
          if (!onTriggerAISummary) return;
          const playhead = videoPlayer?.getCurrentTime() || 0;
          updateBlock(block.id, { content: "AI Agent is generating summary... please wait." });
          const sumText = await onTriggerAISummary(playhead, block.id);
          updateBlock(block.id, { content: sumText });
        };
        return (
          <div className="flex flex-col gap-3 w-full border border-indigo-500/20 bg-indigo-500/5 p-4 rounded-2xl dark:border-[#221740] dark:bg-[#0c081d]/50">
            <div className="flex justify-between items-center select-none">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                🤖 AI Summary Module
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl shadow-sm transition"
              >
                Summarize Session
              </button>
            </div>
            <textarea
              rows={4}
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Click 'Summarize Session' to generate AI summary at the current timestamp, which will populate here as editable text."
              className="w-full text-xs bg-transparent text-cn-ink border-none focus:outline-none resize-y leading-relaxed font-sans"
            />
          </div>
        );
      }

      case "sticky_note": {
        const color = block.properties?.color || "yellow";
        const colorClasses =
          color === "blue"
            ? "bg-[#cfe2ff] text-slate-800"
            : color === "pink"
            ? "bg-[#ffb6c1] text-rose-800"
            : color === "green"
            ? "bg-[#c1ffc1] text-emerald-800"
            : "bg-[#fffacd] text-yellow-900"; // yellow default

        return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center text-[10px] font-bold text-cn-ink-subtle">
              <span>COLOR:</span>
              {["yellow", "blue", "pink", "green"].map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => updateBlock(block.id, { properties: { ...block.properties, color: clr } })}
                  className={`capitalize px-1.5 py-0.5 rounded transition ${
                    color === clr ? "bg-cn-orange text-white" : "hover:bg-cn-border"
                  }`}
                >
                  {clr}
                </button>
              ))}
            </div>
            <div
              className={`p-4 rounded-xl shadow-md min-h-[120px] w-52 flex flex-col font-serif select-text ${colorClasses} border border-black/10`}
            >
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Observation card..."
                className="w-full h-full bg-transparent border-none focus:outline-none resize-none overflow-hidden text-sm font-semibold placeholder:text-black/30"
              />
            </div>
          </div>
        );
      }

      case "text":
      default:
        return (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
            onInput={(e) => handleTextChange(block.id, e.currentTarget.textContent || "")}
            data-placeholder="Type '/' to trigger menu, or type standard notes..."
            className="outline-none w-full min-h-[4.5rem] text-sm text-cn-ink leading-relaxed"
          >
            {block.content}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-[560px] pb-16 relative">
      {blocks.map((block, index) => {
        const isSelected = selectedBlockId === block.id;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={block.id}
            ref={(el) => {
              blockRefs.current[block.id] = el;
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onKeyDown={(e) => handleKeyDown(e, block, index)}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBlockId(block.id);
            }}
            className={`group flex items-start gap-2.5 min-h-[96px] p-4 rounded-2xl transition-all relative ${
              isDragOver ? "border-t-2 border-cn-orange pt-4" : ""
            } ${isSelected ? "bg-cn-orange/5 ring-1 ring-cn-orange/20" : "hover:bg-cn-canvas/40"}`}
          >
            {/* Hover Drag Handle & Delete */}
            <div className="absolute left-[-1.75rem] top-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition duration-150 select-none">
              <span
                title="Drag to reorder"
                className="cursor-grab active:cursor-grabbing font-bold text-base text-cn-ink-subtle hover:text-cn-orange p-1 select-none"
              >
                ⠿
              </span>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                className="text-xs text-rose-500 font-bold hover:bg-rose-500/10 h-5 w-5 flex items-center justify-center rounded transition"
                title="Delete Block"
              >
                ×
              </button>
              {onTriggerAIExplain && block.content.trim() && (
                <button
                  type="button"
                  onClick={() => onTriggerAIExplain(block.content, block.id)}
                  className="text-[10px] text-indigo-400 font-bold hover:bg-indigo-500/10 h-5 w-5 flex items-center justify-center rounded transition"
                  title="Explain content with AI"
                >
                  💡
                </button>
              )}
            </div>

            {/* Block content rendering */}
            <div className="flex-1 min-w-0">{renderBlockEditor(block)}</div>

            {/* Hover insertion point */}
            <div className="absolute bottom-[-0.75rem] left-0 right-0 h-4 flex items-center justify-center opacity-0 hover:opacity-100 transition select-none z-10">
              <button
                type="button"
                onClick={() => handleInsertBlockAt(index + 1, "text")}
                className="flex items-center justify-center text-[9px] bg-cn-orange text-white h-4 px-2 rounded-full font-bold shadow transition active:scale-90"
              >
                + Insert Block
              </button>
            </div>
          </div>
        );
      })}

      {/* Notion slash command drop list menu */}
      {slashMenuBlockId && (
        <div
          className="absolute z-50 bg-white border border-cn-border rounded-2xl shadow-xl w-64 max-h-60 overflow-y-auto p-1.5 left-8 cn-popover-enter dark:bg-stone-900"
          style={{
            top: `${(blockRefs.current[slashMenuBlockId]?.offsetTop || 0) + 36}px`,
          }}
        >
          <div className="px-2.5 py-1.5 text-[9px] font-bold text-cn-ink-subtle tracking-wider uppercase border-b border-cn-border select-none">
            Choose Notebook Block Type
          </div>
          {filteredBlockTypes.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-cn-ink-subtle italic">No blocks match filter</div>
          ) : (
            filteredBlockTypes.map((item, idx) => (
              <button
                key={item.type}
                type="button"
                onClick={() => convertBlock(slashMenuBlockId, item.type as Block["type"])}
                className={`flex items-center gap-3 w-full p-2.5 text-left rounded-xl transition ${
                  slashMenuIndex === idx
                    ? "bg-cn-orange/10 text-cn-orange font-semibold"
                    : "text-cn-ink hover:bg-cn-canvas"
                }`}
              >
                <span className="text-base select-none">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[9px] text-cn-ink-muted truncate">{item.desc}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Empty State */}
      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center select-none border border-dashed border-cn-border rounded-2xl bg-cn-surface/40">
          <span className="text-2xl mb-2">📓</span>
          <p className="text-xs text-cn-ink-muted max-w-xs leading-normal">
            Your notes canvas is currently empty. Click the button below or type "/" to create interactive block layers.
          </p>
        </div>
      )}

      {/* Add Block button at the bottom */}
      <div className="mt-8 flex justify-center border-t border-cn-border pt-6 select-none">
        <button
          type="button"
          onClick={() => handleAddBlock("text")}
          className="flex items-center gap-1 bg-cn-orange hover:bg-cn-orange-hover text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-md active:scale-95 transition"
        >
          + Add block layer
        </button>
      </div>
    </div>
  );
}
