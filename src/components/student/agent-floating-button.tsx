"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/utils/feature-flags";
import { PremiumCognaraLogo } from "./premium-cognara-logo";

/**
 * Floating agent button that expands into a mini chat panel.
 * Shows on all student pages except /agent.
 * Renders markdown-like formatting in replies.
 */
type FloatingAudience = "student" | "coach" | "admin";

type AgentFloatingButtonProps = {
  userId?: string;
  audience?: FloatingAudience;
};

const fullAgentHref: Record<FloatingAudience, string> = {
  student: "/agent",
  coach: "/coach/agent",
  admin: "/admin/agent",
};

export function AgentFloatingButton({ userId = "quick", audience = "student" }: AgentFloatingButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [guideText, setGuideText] = useState<string | null>(null);
  const [guideIndex, setGuideIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const guideTargetsRef = useRef<HTMLElement[]>([]);

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

  const clearGuide = useCallback(() => {
    guideTargetsRef.current.forEach((element) => {
      element.style.outline = "";
      element.style.outlineOffset = "";
      element.style.borderRadius = "";
      element.style.boxShadow = "";
    });
    guideTargetsRef.current = [];
    setGuideText(null);
    setGuideIndex(0);
  }, []);

  const buildPageGuide = useCallback(() => {
    clearGuide();
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main section, main article, main aside, main [id], header, nav",
      ),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 180 && rect.height > 80 && !element.closest("#ai-popup");
      })
      .slice(0, 8);

    if (candidates.length === 0) {
      setGuideText("I could not find clear page sections to guide yet. Try opening a dashboard, course, notebook, or settings page.");
      return;
    }

    guideTargetsRef.current = candidates;
    const lines = candidates.map((element, index) => {
      const heading = element.querySelector("h1,h2,h3,h4")?.textContent?.trim();
      const label = heading || element.getAttribute("aria-label") || element.id || element.tagName.toLowerCase();
      return `${index + 1}. ${label}: this area contains the main controls or information for this part of the page.`;
    });
    setGuideText(`Page guide for ${pathname || "this page"}:\n${lines.join("\n")}`);
    setGuideIndex(0);
  }, [clearGuide, pathname]);

  useEffect(() => {
    if (!guideText) return;
    guideTargetsRef.current.forEach((element, index) => {
      const active = index === guideIndex;
      element.style.outline = active ? "3px solid rgba(255,107,61,0.95)" : "1px solid rgba(255,107,61,0.35)";
      element.style.outlineOffset = active ? "6px" : "3px";
      element.style.borderRadius = "22px";
      element.style.boxShadow = active ? "0 0 0 9999px rgba(0,0,0,0.28), 0 0 35px rgba(255,107,61,0.45)" : "";
    });
    guideTargetsRef.current[guideIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [guideIndex, guideText]);

  useEffect(() => {
    return () => clearGuide();
  }, [clearGuide]);

  if (!FEATURES.AI_AGENT) return null;
  if (pathname === fullAgentHref[audience]) return null;

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
          studentId: userId,
          skill: audience === "admin" ? "admin" : audience === "coach" ? "coach" : "teach",
          message: q,
          context: { current_page: pathname, audience, source: "floating_agent" },
        }),
      });
      const data = await res.json();
      setReply(data.content?.slice(0, 900) ?? "I couldn't answer that.");
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

  const speakCurrent = () => {
    const text = guideText || reply || input || "Ask me anything about this page.";
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`>\[\]]/g, ""));
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.lang = /[\u0600-\u06FF]/.test(text) ? "ur-PK" : "en-US";
    window.speechSynthesis.speak(utterance);
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
        className={`fixed bottom-24 right-5 z-50 w-[92vw] max-w-[430px] origin-bottom-right transition-all duration-500 ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 translate-y-4"
        }`}
      >
        <main ref={panelRef} className="relative z-10 w-full floating-glass rounded-3xl p-5 popup-entrance border-pulse" id="ai-popup">
          {/* Architectural Header */}
          <header className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="logo-container">
                <div className="w-11 h-11 rounded-2xl bg-surface-container-highest/40 flex items-center justify-center overflow-hidden border border-black/10 dark:border-white/10 relative z-10 shadow-2xl">
                  <PremiumCognaraLogo className="logo-image w-9 h-9 object-contain text-primary dark:text-white" idSuffix={`${audience}-panel`} />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="font-headline-lg text-[20px] text-on-surface tracking-tight leading-none mb-1.5 shimmer-text">
                  COGNARA AI
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
            <Link href={fullAgentHref[audience]} className="glass-btn flex items-center gap-2 px-3 py-2 rounded-xl group">
              <span className="font-label-md text-xs text-on-surface">Full view</span>
              <span className="material-symbols-outlined text-[20px] text-primary transition-transform group-hover:translate-x-1">north_east</span>
            </Link>
          </header>

          {/* Description / Reply Area */}
          <div className="mb-5">
            {guideText || reply !== null ? (
              <div className="bg-black/10 dark:bg-black/30 p-4 rounded-2xl border border-black/5 dark:border-white/5 max-h-56 overflow-y-auto custom-scrollbar relative group">
                {loading ? (
                  <div className="flex items-center gap-3 text-on-surface-variant opacity-80">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <span className="text-sm font-label-md">Thinking...</span>
                  </div>
                ) : (
                  <>
                    <MiniMarkdown text={guideText || reply || ""} />
                    {guideText && guideTargetsRef.current.length > 1 && (
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                        <button
                          type="button"
                          onClick={() => setGuideIndex((index) => Math.max(0, index - 1))}
                          disabled={guideIndex === 0}
                          className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                          {guideIndex + 1}/{guideTargetsRef.current.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGuideIndex((index) => Math.min(guideTargetsRef.current.length - 1, index + 1))}
                          disabled={guideIndex === guideTargetsRef.current.length - 1}
                          className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => { setReply(null); clearGuide(); }}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                      title="Clear reply"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="font-body-lg text-sm text-on-surface-variant leading-relaxed opacity-90">
                Ask anything about this page, your work, course content, reports, code, or platform tasks.
              </p>
            )}
          </div>

          {/* Enhanced Interaction Input Section */}
          <div className="relative mb-4">
            <div className="flex gap-3 items-stretch">
              <div className="relative flex-grow bg-black/5 dark:bg-black/30 rounded-2xl overflow-hidden transition-all duration-500 border border-black/10 dark:border-white/5 input-glow group animate-fade-in">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickAsk();
                  }}
                  placeholder="Type your query here..."
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface px-4 py-4 font-body-md text-sm placeholder:text-on-surface-variant/40 outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-[10px] text-on-surface-variant opacity-60 font-sans">⌘</kbd>
                  <kbd className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-[10px] text-on-surface-variant opacity-60 font-sans">K</kbd>
                </div>
              </div>
              <button
                onClick={() => handleQuickAsk()}
                disabled={!input.trim() || loading}
                className="w-14 h-14 shrink-0 flex items-center justify-center bg-primary-container text-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,107,61,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(255,107,61,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden disabled:opacity-40 disabled:pointer-events-none"
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={speakCurrent}
              className="glass-btn px-4 py-2.5 rounded-xl flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">record_voice_over</span>
              <span className="font-label-md text-xs text-on-surface-variant group-hover:text-on-surface">Speak</span>
            </button>
            <button
              onClick={buildPageGuide}
              className="glass-btn px-4 py-2.5 rounded-xl flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">explore</span>
              <span className="font-label-md text-xs text-on-surface-variant group-hover:text-on-surface">Guide</span>
            </button>
            <button
              onClick={() => handleSuggestClick("Explain this page")}
              className="glass-btn px-4 py-2.5 rounded-xl flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
              <span className="font-label-md text-xs text-on-surface-variant group-hover:text-on-surface">Explain</span>
            </button>
            <button
              onClick={() => handleSuggestClick("Help me study")}
              className="glass-btn px-4 py-2.5 rounded-xl flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">school</span>
              <span className="font-label-md text-xs text-on-surface-variant group-hover:text-on-surface">Study</span>
            </button>
            <button
              onClick={() => handleSuggestClick("Quiz me")}
              className="glass-btn px-4 py-2.5 rounded-xl flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[18px] text-tertiary">psychology_alt</span>
              <span className="font-label-md text-xs text-on-surface-variant group-hover:text-on-surface">Quiz</span>
            </button>
          </div>

          {/* Architectural Footer */}
          <footer className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-3">
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
        onClick={() => { setOpen(!open); if (open) { setReply(null); clearGuide(); } }}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8 floating-glass border-pulse group shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_15px_rgba(255,107,61,0.15)] hover:shadow-[0_0_30px_rgba(255,107,61,0.45)]`}
        aria-label={open ? "Close agent" : "Open COGNARA AI agent"}
        title="COGNARA agent"
      >
        <div className="relative w-12 h-12 flex items-center justify-center logo-container">
          {open ? (
            <svg className="h-6 w-6 text-on-surface transform transition-transform duration-300 rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <PremiumCognaraLogo className="logo-image w-9 h-9 object-contain text-primary dark:text-white" idSuffix={`${audience}-fab`} />
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
