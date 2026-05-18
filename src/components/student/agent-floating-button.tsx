"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/utils/feature-flags";
import { AgentIcon } from "@/components/ui/agent-icon";

/**
 * Floating agent button that expands into a mini chat panel.
 * Shows on all student pages except /agent.
 * Renders markdown-like formatting in replies.
 */
export function AgentFloatingButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!FEATURES.AI_AGENT) return null;
  if (pathname?.startsWith("/agent")) return null;

  const handleQuickAsk = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setLoading(true);
    setReply(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "quick",
          skill: "teach",
          message: q,
          context: { current_page: pathname },
        }),
      });
      const data = await res.json();
      setReply(data.content?.slice(0, 500) ?? "I couldn't answer that.");
    } catch {
      setReply("Something went wrong. Try the full agent page.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mini Panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-24 right-6 z-50 w-[22rem] origin-bottom-right transition-all duration-300 sm:right-8 ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 translate-y-2"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-cn-sidebar shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cn-orange/15">
                <AgentIcon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">COGNARA Agent</p>
                <p className="text-[10px] text-white/40">Quick question mode</p>
              </div>
            </div>
            <Link
              href="/agent"
              className="rounded-lg bg-white/8 px-3 py-1.5 text-[10px] font-bold text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              Full view →
            </Link>
          </div>

          {/* Body */}
          <div className="border-t border-white/[0.06] p-4">
            {reply ? (
              <div className="mb-3 max-h-48 overflow-y-auto">
                <MiniMarkdown text={reply} />
              </div>
            ) : (
              <p className="mb-3 text-xs leading-relaxed text-white/40">
                Ask a quick question or jump to the full agent for multi-turn conversations.
              </p>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuickAsk();
                }}
                placeholder="Ask anything…"
                className="cn-input-glow h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 text-xs text-white placeholder:text-white/25 focus:border-cn-orange focus:outline-none"
              />
              <button
                type="button"
                onClick={handleQuickAsk}
                disabled={!input.trim() || loading}
                className="cn-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cn-orange text-white transition hover:bg-cn-orange-hover disabled:opacity-40"
              >
                {loading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Quick suggestions */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Explain this page", "Help me study", "Quiz me"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setInput(s); }}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/50 transition hover:border-cn-orange/30 hover:bg-cn-orange/10 hover:text-cn-orange"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setReply(null); }}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 sm:bottom-8 sm:right-8 ${
          open
            ? "rotate-45 bg-white/10 shadow-black/40 backdrop-blur-md border border-white/10"
            : "bg-cn-orange shadow-cn-orange/40 hover:bg-cn-orange-hover"
        }`}
        aria-label={open ? "Close agent" : "Open COGNARA AI agent"}
        title="COGNARA agent"
      >
        {open ? (
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <AgentIcon size={24} />
        )}
      </button>
    </>
  );
}

/* ── Lightweight markdown renderer for mini panel ── */
function MiniMarkdown({ text }: { text: string }) {
  const lines = useMemo(() => text.split("\n"), [text]);

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-white/80">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Headings → bold text
        if (trimmed.startsWith("### ")) {
          return <p key={i} className="font-bold text-white mt-2 first:mt-0">{trimmed.slice(4)}</p>;
        }
        if (trimmed.startsWith("## ")) {
          return <p key={i} className="font-bold text-white text-sm mt-2 first:mt-0">{trimmed.slice(3)}</p>;
        }
        if (trimmed.startsWith("# ")) {
          return <p key={i} className="font-bold text-white text-sm mt-2 first:mt-0">{trimmed.slice(2)}</p>;
        }

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cn-orange/60" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)[.)]\s(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="shrink-0 text-cn-orange/80 font-semibold">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph
        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

/** Render bold and inline code */
function renderInline(text: string): React.ReactNode {
  // Handle **bold** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-cn-orange font-mono text-[10px]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.724 1.053a.5.5 0 01.545-.065l12 6a.5.5 0 010 .894l-12 6A.5.5 0 011.5 13.5v-4.379l6.854-1.027a.125.125 0 000-.248L1.5 6.879V2.5a.5.5 0 01.224-.447z" />
    </svg>
  );
}
