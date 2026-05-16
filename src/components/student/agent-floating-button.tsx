"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/utils/feature-flags";

/**
 * Floating agent button that expands into a mini chat panel.
 * Shows on all student pages except /agent.
 * Can send quick messages or jump to the full agent page.
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
      setReply(data.content?.slice(0, 300) ?? "I couldn't answer that.");
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
        className={`fixed bottom-24 right-6 z-50 w-80 origin-bottom-right transition-all sm:right-8 ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cn-border bg-gradient-to-r from-cn-orange to-cn-pink px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-sm font-bold text-white">COGNARA Agent</p>
                <p className="text-[10px] text-white/70">Quick question mode</p>
              </div>
            </div>
            <Link
              href="/agent"
              className="rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/30"
            >
              Full view →
            </Link>
          </div>

          {/* Body */}
          <div className="p-4">
            {reply ? (
              <div className="mb-3 max-h-40 overflow-y-auto rounded-xl bg-cn-canvas p-3 text-xs leading-relaxed text-cn-ink">
                {reply}
              </div>
            ) : (
              <p className="mb-3 text-xs text-cn-ink-muted">
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
                placeholder="Quick question…"
                className="h-9 flex-1 rounded-xl border border-cn-border bg-cn-canvas px-3 text-xs text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-1 focus:ring-cn-orange/20"
              />
              <button
                type="button"
                onClick={handleQuickAsk}
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cn-orange text-white transition hover:bg-cn-orange-hover disabled:opacity-40"
              >
                {loading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <SendIcon className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Quick suggestions */}
            <div className="mt-2 flex flex-wrap gap-1">
              {["Explain this page", "Help me study", "Quiz me"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setInput(s); }}
                  className="rounded-lg bg-cn-border/30 px-2 py-1 text-[10px] text-cn-ink-muted transition hover:bg-cn-orange/10 hover:text-cn-orange"
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
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-ink sm:bottom-8 sm:right-8 ${
          open
            ? "rotate-45 bg-cn-ink shadow-cn-ink/40"
            : "bg-cn-orange shadow-cn-orange/40 hover:bg-cn-orange-hover"
        }`}
        aria-label={open ? "Close agent" : "Open COGNARA AI agent"}
        title="COGNARA agent"
      >
        <span aria-hidden>{open ? "✕" : "🤖"}</span>
      </button>
    </>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.724 1.053a.5.5 0 01.545-.065l12 6a.5.5 0 010 .894l-12 6A.5.5 0 011.5 13.5v-4.379l6.854-1.027a.125.125 0 000-.248L1.5 6.879V2.5a.5.5 0 01.224-.447z" />
    </svg>
  );
}
