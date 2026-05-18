"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { AgentMessage } from "./AgentMessage";
import { CreditDisplay } from "./CreditDisplay";
import { VoiceButton } from "./VoiceButton";
import { StudyBoard } from "./StudyBoard";
import { AgentIcon } from "@/components/ui/agent-icon";
import {
  IconBrain, IconBug, IconClipboard, IconMicrophone,
  IconTarget, IconTicket,
} from "@/components/ui/icons";
import type { AgentSkill } from "@/lib/ai/master-agent";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  skill?: string;
  creditsUsed?: number;
  timestamp: string;
};

const SKILLS: { key: AgentSkill; Icon: React.FC<{ className?: string }>; label: string; desc: string; cost: string }[] = [
  { key: "teach", Icon: IconBrain, label: "Teach Me", desc: "Explain concepts clearly", cost: "1 cr" },
  { key: "debug", Icon: IconBug, label: "Debug", desc: "Fix your code issues", cost: "2 cr" },
  { key: "quiz", Icon: IconClipboard, label: "Quiz", desc: "Generate practice problems", cost: "3 cr" },
  { key: "voice", Icon: IconMicrophone, label: "Voice", desc: "Spoken conversation", cost: "1 cr/min" },
  { key: "path", Icon: IconTarget, label: "Path", desc: "Create learning roadmap", cost: "3 cr" },
  { key: "support", Icon: IconTicket, label: "Support", desc: "Get help with the platform", cost: "1 cr" },
];

type Props = {
  studentId: string;
  initialCredits: number | null;
};

export function AgentPanel({ studentId, initialCredits }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [skill, setSkill] = useState<AgentSkill>("teach");
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(initialCredits);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [studyBoardContent, setStudyBoardContent] = useState<string | null>(null);
  const [voiceLang] = useState<"en" | "ur">("en");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const skillMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (skillMenuRef.current && !skillMenuRef.current.contains(e.target as Node)) {
        setShowSkillMenu(false);
      }
    };
    if (showSkillMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSkillMenu]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          skill,
          message: trimmed,
          context: { current_page: "agent" },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Agent failed");
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        skill: data.skill,
        creditsUsed: data.creditsUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      }
      if (skill === "voice") {
        setLastResponse(data.content?.replace(/[#*`_~>\[\]]/g, "").slice(0, 500) ?? null);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `## Error\n\n${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        skill: "error",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, skill, studentId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeSkill = SKILLS.find((s) => s.key === skill) ?? SKILLS[0];
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant" && m.skill !== "error");

  return (
    <>
      <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-[var(--cn-shadow-card)]">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-cn-border">
          <div className="absolute inset-0 bg-gradient-to-r from-cn-orange/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="relative flex items-center gap-3 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink shadow-sm shadow-cn-orange/20">
                  <AgentIcon size={20} />
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-cn-surface" />
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-cn-ink">COGNARA AI</h2>
                <p className="text-[11px] text-cn-ink-subtle">
                  {isLoading ? "Thinking\u2026" : "Online \u2014 ready to teach"}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {lastAssistantMsg && (
                <button
                  type="button"
                  onClick={() => setStudyBoardContent(lastAssistantMsg.content)}
                  className="cn-btn flex items-center gap-1.5 rounded-xl border border-cn-border bg-cn-canvas px-3 py-1.5 text-[11px] font-bold text-cn-ink-muted transition hover:border-cn-orange/40 hover:text-cn-orange"
                  title="Open Study Board"
                >
                  <BoardIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Study Board</span>
                </button>
              )}
              <CreditDisplay balance={credits} />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-purple-500/10 to-cn-orange/10 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-cn-orange/10 ring-1 ring-purple-500/10">
                  <AgentIcon size={44} />
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-cn-ink">
                What would you like to learn?
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-cn-ink-muted">
                I&apos;m COGNARA AI &mdash; your personal tutor. I explain concepts, debug code,
                generate quizzes, and build learning paths tailored to you.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                  "Explain recursion step by step",
                  "What are closures in JavaScript?",
                  "Help me understand Big O notation",
                  "Debug my Python code",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="cn-btn rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-xs font-medium text-cn-ink-muted transition hover:border-cn-orange/50 hover:bg-cn-orange/5 hover:text-cn-orange"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <AgentMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  skill={msg.skill}
                  creditsUsed={msg.creditsUsed}
                  timestamp={msg.timestamp}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink shadow-sm shadow-cn-orange/20">
                    <AgentIcon size={16} />
                  </span>
                  <div className="rounded-2xl rounded-tl-md bg-cn-surface px-4 py-3 shadow-sm ring-1 ring-cn-border">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cn-orange [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cn-orange [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cn-orange [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-cn-ink-subtle animate-pulse">Thinking&hellip;</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-cn-border bg-cn-surface/80 backdrop-blur-sm px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="relative" ref={skillMenuRef}>
              <button
                type="button"
                onClick={() => setShowSkillMenu(!showSkillMenu)}
                className={`cn-btn flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                  showSkillMenu
                    ? "border-cn-orange bg-cn-orange/10 text-cn-orange"
                    : "border-cn-border bg-cn-canvas text-cn-ink-muted hover:border-cn-orange/40 hover:text-cn-ink"
                }`}
                title="Change skill mode"
              >
                <activeSkill.Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{activeSkill.label}</span>
                <ChevronIcon className="h-3 w-3" up={showSkillMenu} />
              </button>

              {showSkillMenu && (
                <div className="cn-popover-enter absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-2xl border border-cn-border bg-cn-surface p-1.5 shadow-xl shadow-black/15">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cn-ink-subtle">
                    Select Skill
                  </p>
                  {SKILLS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        setSkill(s.key);
                        setShowSkillMenu(false);
                      }}
                      className={`cn-row-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        skill === s.key
                          ? "bg-cn-orange/10 text-cn-orange"
                          : "text-cn-ink-muted hover:text-cn-ink"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        skill === s.key ? "bg-cn-orange/15" : "bg-cn-canvas"
                      }`}>
                        <s.Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{s.label}</p>
                        <p className="text-[10px] opacity-60">{s.desc}</p>
                      </div>
                      <span className="text-[10px] font-medium opacity-40">{s.cost}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the ${activeSkill.label} agent\u2026`}
              rows={1}
              className="cn-input-glow min-h-[2.5rem] max-h-32 flex-1 resize-none rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
            />

            <VoiceButton
              onTranscript={(text) => {
                setInput(text);
                setTimeout(() => {
                  const sendBtn = document.getElementById("agent-send-btn");
                  sendBtn?.click();
                }, 100);
              }}
              speakText={skill === "voice" ? lastResponse : null}
              disabled={isLoading}
            />

            <button
              id="agent-send-btn"
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="cn-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cn-orange text-white shadow-sm shadow-cn-orange/20 transition hover:bg-cn-orange-hover active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-cn-ink-subtle">
            <activeSkill.Icon className="h-3 w-3 opacity-50" />
            <span>{activeSkill.label} mode</span>
            <span className="mx-1 opacity-30">&middot;</span>
            <span className="font-medium text-cn-ink-muted">{activeSkill.cost}</span>
            <span className="mx-1 opacity-30">&middot;</span>
            <span>Shift+Enter for new line</span>
          </div>
        </div>
      </div>

      {studyBoardContent && (
        <StudyBoard
          content={studyBoardContent}
          onClose={() => setStudyBoardContent(null)}
          lang={voiceLang}
        />
      )}
    </>
  );
}

/* ─── Icons ─── */

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.724 1.053a.5.5 0 01.545-.065l12 6a.5.5 0 010 .894l-12 6A.5.5 0 011.5 13.5v-4.379l6.854-1.027a.125.125 0 000-.248L1.5 6.879V2.5a.5.5 0 01.224-.447z" />
    </svg>
  );
}

function BoardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16" strokeWidth={1.5} stroke="currentColor">
      <rect x="1.5" y="2" width="13" height="9" rx="1.5" />
      <path strokeLinecap="round" d="M5 14h6M8 11v3M4 5.5h3M4 7.5h5" />
    </svg>
  );
}

function ChevronIcon({ className, up }: { className?: string; up: boolean }) {
  return (
    <svg className={`${className} transition-transform ${up ? "rotate-180" : ""}`} fill="none" viewBox="0 0 12 12" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5l3 3 3-3" />
    </svg>
  );
}
