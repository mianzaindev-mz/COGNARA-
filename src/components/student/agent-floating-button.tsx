"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/utils/feature-flags";
import { PremiumCognaraLogo } from "./premium-cognara-logo";

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
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const x = e.clientX;
      const y = e.clientY;

      const rect = panelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rotateX = (centerY - y) / 25;
      const rotateY = (x - centerX) / 25;

      const translateX = (x - centerX) / 80;
      const translateY = (y - centerY) / 80;

      panelRef.current.style.transform = `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 50px)`;

      const shadowX = (centerX - x) / 10;
      const shadowY = (centerY - y) / 10;
      panelRef.current.style.boxShadow = `${shadowX}px ${shadowY + 40}px 80px -15px rgba(0, 0, 0, 0.4), 0 0 0 1.5px rgba(255,255,255,0.08)`;
    };

    const handleMouseLeave = () => {
      if (!panelRef.current) return;
      panelRef.current.style.transform = `perspective(2000px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)`;
      panelRef.current.style.boxShadow = `0 25px 60px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)`;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [open]);

  if (!FEATURES.AI_AGENT) return null;
  if (pathname?.startsWith("/agent")) return null;

  const handleQuickAsk = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;
    setLoading(true);
    setReply(""); // Switch context view to loading state immediately

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

  const handleSuggestClick = (suggestionText: string) => {
    setInput(suggestionText);
    handleQuickAsk(suggestionText);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/15 dark:bg-black/35 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mini Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[90vw] max-w-[550px] sm:w-[500px] origin-bottom-right transition-all duration-500 ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 translate-y-4"
        }`}
      >
        <main ref={panelRef} className="relative z-10 w-full floating-glass rounded-3xl p-8 popup-entrance border-pulse" id="ai-popup">
          {/* Architectural Header */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="logo-container">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-highest/40 flex items-center justify-center overflow-hidden border border-black/10 dark:border-white/10 relative z-10 shadow-2xl">
                  <PremiumCognaraLogo className="logo-image w-12 h-12 object-contain text-primary dark:text-white" idSuffix="panel" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="font-headline-lg text-[24px] sm:text-[28px] text-on-surface tracking-tight leading-none mb-1.5 shimmer-text">
                  COGNARA Agent
                </h1>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 uppercase tracking-[0.2em] font-medium opacity-70">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Quick question mode
                </span>
              </div>
            </div>
            <Link href="/agent" className="glass-btn flex items-center gap-2.5 px-5 py-2.5 rounded-xl group">
              <span className="font-label-md text-label-md text-on-surface">Full view</span>
              <span className="material-symbols-outlined text-[20px] text-primary transition-transform group-hover:translate-x-1">north_east</span>
            </Link>
          </header>

          {/* Description / Reply Area */}
          <div className="mb-8">
            {reply !== null ? (
              <div className="bg-black/10 dark:bg-black/30 p-6 rounded-2xl border border-black/5 dark:border-white/5 max-h-60 overflow-y-auto custom-scrollbar relative group">
                {loading ? (
                  <div className="flex items-center gap-3 text-on-surface-variant opacity-80">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <span className="text-sm font-label-md">Thinking...</span>
                  </div>
                ) : (
                  <>
                    <MiniMarkdown text={reply} />
                    <button
                      onClick={() => setReply(null)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                      title="Clear reply"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed opacity-90 max-w-[90%]">
                How can I assist you today? Ask a quick question or explore the full agent for complex workflows.
              </p>
            )}
          </div>

          {/* Enhanced Interaction Input Section */}
          <div className="relative mb-8">
            <div className="flex gap-4 items-stretch">
              <div className="relative flex-grow bg-black/5 dark:bg-black/30 rounded-2xl overflow-hidden transition-all duration-500 border border-black/10 dark:border-white/5 input-glow group animate-fade-in">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickAsk();
                  }}
                  placeholder="Type your query here..."
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface px-6 py-5 font-body-md text-body-md placeholder:text-on-surface-variant/40 outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-[10px] text-on-surface-variant opacity-60 font-sans">⌘</kbd>
                  <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-[10px] text-on-surface-variant opacity-60 font-sans">K</kbd>
                </div>
              </div>
              <button
                onClick={() => handleQuickAsk()}
                disabled={!input.trim() || loading}
                className="w-16 h-16 shrink-0 flex items-center justify-center bg-primary-container text-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,107,61,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(255,107,61,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {loading ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white relative z-10" />
                ) : (
                  <span className="material-symbols-outlined text-[28px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                )}
              </button>
            </div>
          </div>

          {/* Glass-morphic Shortcut Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleSuggestClick("Explain this page")}
              className="glass-btn px-6 py-3 rounded-xl flex items-center gap-3 group"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">auto_awesome</span>
              <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface">Explain this page</span>
            </button>
            <button
              onClick={() => handleSuggestClick("Help me study")}
              className="glass-btn px-6 py-3 rounded-xl flex items-center gap-3 group"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">school</span>
              <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface">Help me study</span>
            </button>
            <button
              onClick={() => handleSuggestClick("Quiz me")}
              className="glass-btn px-6 py-3 rounded-xl flex items-center gap-3 group"
            >
              <span className="material-symbols-outlined text-[20px] text-tertiary">psychology_alt</span>
              <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface">Quiz me</span>
            </button>
          </div>

          {/* Architectural Footer */}
          <footer className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5">
              <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
              <span className="font-label-sm text-[11px] text-on-surface-variant opacity-60 uppercase tracking-widest">Powered by Lumina AI Engine</span>
            </div>
            <div className="flex gap-6 opacity-30 text-[10px] font-label-md uppercase tracking-tighter">
              <span>v4.2 Ultra</span>
              <span>Security Encrypted</span>
              <span>Latency: 12ms</span>
            </div>
          </footer>
        </main>
      </div>

      {/* FAB Button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); if (open) setReply(null); }}
        className={`fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8 floating-glass border-pulse group shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_15px_rgba(255,107,61,0.15)] hover:shadow-[0_0_30px_rgba(255,107,61,0.45)]`}
        aria-label={open ? "Close agent" : "Open COGNARA AI agent"}
        title="COGNARA agent"
      >
        <div className="relative w-12 h-12 flex items-center justify-center logo-container">
          {open ? (
            <svg className="h-6 w-6 text-on-surface transform transition-transform duration-300 rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <PremiumCognaraLogo className="logo-image w-10 h-10 object-contain text-primary dark:text-white" idSuffix="fab" />
          )}
        </div>
      </button>
    </>
  );
}

/* ── Lightweight markdown renderer for mini panel ── */
function MiniMarkdown({ text }: { text: string }) {
  const lines = useMemo(() => text.split("\n"), [text]);

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-on-surface/80">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Headings → bold text
        if (trimmed.startsWith("### ")) {
          return <p key={i} className="font-bold text-on-surface mt-2 first:mt-0">{trimmed.slice(4)}</p>;
        }
        if (trimmed.startsWith("## ")) {
          return <p key={i} className="font-bold text-on-surface text-sm mt-2 first:mt-0">{trimmed.slice(3)}</p>;
        }
        if (trimmed.startsWith("# ")) {
          return <p key={i} className="font-bold text-on-surface text-sm mt-2 first:mt-0">{trimmed.slice(2)}</p>;
        }

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)[.)]\s(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="shrink-0 text-primary/80 font-semibold">{numMatch[1]}.</span>
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
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-on-surface">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 text-primary font-mono text-[10px]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
