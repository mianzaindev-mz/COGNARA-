"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AgentMessage } from "@/components/agent/AgentMessage";
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

type SkillOption = { key: AgentSkill; Icon: React.FC<{ className?: string }>; label: string; desc: string; cost: string };
export type AgentAudience = "student" | "coach" | "admin" | "support";

const STUDENT_SKILLS: SkillOption[] = [
  { key: "teach", Icon: IconBrain, label: "Teach Me", desc: "Explain concepts clearly", cost: "1 cr" },
  { key: "debug", Icon: IconBug, label: "Debug", desc: "Fix your code issues", cost: "2 cr" },
  { key: "quiz", Icon: IconClipboard, label: "Quiz", desc: "Generate practice problems", cost: "3 cr" },
  { key: "voice", Icon: IconMicrophone, label: "Voice", desc: "Spoken conversation", cost: "1 cr/min" },
  { key: "path", Icon: IconTarget, label: "Path", desc: "Create learning roadmap", cost: "3 cr" },
  { key: "support", Icon: IconTicket, label: "Support", desc: "Get help with the platform", cost: "1 cr" },
];

const COACH_SKILLS: SkillOption[] = [
  { key: "coach", Icon: IconBrain, label: "Coach Agent", desc: "Courses, lessons, rubrics", cost: "Free" },
  { key: "quiz", Icon: IconClipboard, label: "Quiz Studio", desc: "Generate assessments", cost: "Free" },
  { key: "debug", Icon: IconBug, label: "Code Help", desc: "Review examples and fixes", cost: "Free" },
  { key: "support", Icon: IconTicket, label: "Support", desc: "Platform and student issues", cost: "Free" },
];

const ADMIN_SKILLS: SkillOption[] = [
  { key: "admin", Icon: IconBrain, label: "Admin Agent", desc: "Operations and risk review", cost: "Free" },
  { key: "verify", Icon: IconTarget, label: "Verify", desc: "Coach and content checks", cost: "Free" },
  { key: "support", Icon: IconTicket, label: "Support Ops", desc: "Ticket triage", cost: "Free" },
  { key: "coach", Icon: IconClipboard, label: "Content Audit", desc: "Course quality review", cost: "Free" },
];

const SUPPORT_SKILLS: SkillOption[] = [
  { key: "support", Icon: IconTicket, label: "Support Agent", desc: "Report triage and responses", cost: "Free" },
  { key: "admin", Icon: IconBrain, label: "Admin Tools", desc: "Platform operations", cost: "Free" },
];

const AUDIENCE_COPY: Record<AgentAudience, { title: string; status: string; emptyTitle: string; emptyBody: string; suggestions: string[] }> = {
  student: {
    title: "COGNARA AI",
    status: "Online - ready to teach",
    emptyTitle: "What would you like to learn?",
    emptyBody:
      "I'm COGNARA AI, your personal tutor. I explain concepts, debug code, generate quizzes, and build learning paths tailored to you.",
    suggestions: [
      "Explain recursion step by step",
      "What are closures in JavaScript?",
      "Help me understand Big O notation",
      "Debug my Python code",
    ],
  },
  coach: {
    title: "COGNARA AI Coach",
    status: "Online - ready to build",
    emptyTitle: "What should we create for your learners?",
    emptyBody:
      "I help coaches turn lessons, PDFs, videos, and rubrics into courses, quizzes, grading guidance, student interventions, and plagiarism review plans.",
    suggestions: [
      "Create a quiz for my lesson on recursion",
      "Build a rubric for a final project",
      "Summarize a lecture transcript into lessons",
      "Find likely plagiarism signals in submissions",
    ],
  },
  admin: {
    title: "COGNARA AI Admin",
    status: "Online - monitoring systems",
    emptyTitle: "What platform issue should we inspect?",
    emptyBody:
      "I help admins review verification, support, content quality, abuse signals, policy risks, AI usage, and operational next steps across COGNARA.",
    suggestions: [
      "Draft a coach verification checklist",
      "Triage open support tickets by severity",
      "Audit a suspicious course report",
      "Create a platform health summary",
    ],
  },
  support: {
    title: "COGNARA AI Support",
    status: "Online - ready to help",
    emptyTitle: "What support issue needs attention?",
    emptyBody:
      "I help support staff triage reports, assess severity, draft response templates, identify patterns, and recommend next actions for user issues.",
    suggestions: [
      "Triage this bug report by severity",
      "Draft a response to a student complaint",
      "Identify patterns in recent abuse reports",
      "Assess the impact of this technical issue",
    ],
  },
};

interface CompactChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  audience: AgentAudience;
  initialCredits: number | null;
  currentPage?: string;
  currentLessonTitle?: string;
  currentCourseTitle?: string;
}

export function CompactChatWindow({
  isOpen,
  onClose,
  studentId,
  audience,
  initialCredits,
  currentPage,
  currentLessonTitle,
  currentCourseTitle,
}: CompactChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const skills = audience === "coach" ? COACH_SKILLS : audience === "admin" ? ADMIN_SKILLS : audience === "support" ? SUPPORT_SKILLS : STUDENT_SKILLS;
  const copy = AUDIENCE_COPY[audience];
  const [skill, setSkill] = useState<AgentSkill>(skills[0]?.key ?? "teach");
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(initialCredits);
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const skillMenuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

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
          context: {
            current_page: currentPage,
            current_lesson_title: currentLessonTitle,
            current_course_title: currentCourseTitle,
            audience,
          },
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
  }, [audience, input, isLoading, skill, studentId, currentPage, currentLessonTitle, currentCourseTitle]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeSkill = skills.find((s) => s.key === skill) ?? skills[0] ?? STUDENT_SKILLS[0];

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] rounded-2xl border border-cn-border bg-cn-surface shadow-[var(--cn-shadow-card)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-cn-border">
        <div className="absolute inset-0 bg-gradient-to-r from-cn-orange/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink shadow-sm shadow-cn-orange/20">
                <AgentIcon size={18} />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-cn-surface" />
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-cn-ink">{copy.title}</h2>
              <p className="text-[10px] text-cn-ink-subtle">
                {isLoading ? "Thinking..." : copy.status}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg hover:bg-cn-canvas text-cn-ink-subtle transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-2">
            <div className="relative mb-4">
              <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-purple-500/10 to-cn-orange/10 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-cn-orange/10 ring-1 ring-purple-500/10">
                <AgentIcon size={36} />
              </div>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-cn-ink">
              {copy.emptyTitle}
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-cn-ink-muted">
              {copy.emptyBody}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-1.5">
              {copy.suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="cn-btn rounded-lg border border-cn-border bg-cn-canvas px-3 py-1.5 text-[10px] font-medium text-cn-ink-muted transition hover:border-cn-orange/50 hover:bg-cn-orange/5 hover:text-cn-orange"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
              <div className="flex gap-2 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cn-orange to-cn-pink shadow-sm shadow-cn-orange/20">
                  <AgentIcon size={14} />
                </span>
                <div className="rounded-xl rounded-tl-md bg-cn-surface px-3 py-2 shadow-sm ring-1 ring-cn-border">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cn-orange [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cn-orange [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cn-orange [animation-delay:300ms]" />
                    </div>
                    <span className="text-[10px] text-cn-ink-subtle animate-pulse">Thinking&hellip;</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-cn-border bg-cn-surface/80 backdrop-blur-sm px-3 py-2.5">
        <div className="flex items-end gap-2">
          <div className="relative" ref={skillMenuRef}>
            <button
              type="button"
              onClick={() => setShowSkillMenu(!showSkillMenu)}
              className={`cn-btn flex h-8 items-center gap-1 rounded-lg border px-2 text-[10px] font-bold transition ${
                showSkillMenu
                  ? "border-cn-orange bg-cn-orange/10 text-cn-orange"
                  : "border-cn-border bg-cn-canvas text-cn-ink-muted hover:border-cn-orange/40 hover:text-cn-ink"
              }`}
              title="Change skill mode"
            >
              <activeSkill.Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{activeSkill.label}</span>
              <ChevronIcon className="h-2.5 w-2.5" up={showSkillMenu} />
            </button>

            {showSkillMenu && (
              <div className="cn-popover-enter absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-xl border border-cn-border bg-cn-surface p-1 shadow-xl shadow-black/15">
                <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-cn-ink-subtle">
                  Select Skill
                </p>
                {skills.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setSkill(s.key);
                      setShowSkillMenu(false);
                    }}
                    className={`cn-row-hover flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                      skill === s.key
                        ? "bg-cn-orange/10 text-cn-orange"
                        : "text-cn-ink-muted hover:text-cn-ink"
                    }`}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${
                      skill === s.key ? "bg-cn-orange/15" : "bg-cn-canvas"
                    }`}>
                      <s.Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold">{s.label}</p>
                      <p className="text-[9px] opacity-60">{s.desc}</p>
                    </div>
                    <span className="text-[9px] font-medium opacity-40">{s.cost}</span>
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
            className="cn-input-glow min-h-[2rem] max-h-24 flex-1 resize-none rounded-lg border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="cn-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cn-orange text-white shadow-sm shadow-cn-orange/20 transition hover:bg-cn-orange-hover active:scale-95 disabled:opacity-40 disabled:shadow-none"
            aria-label="Send message"
          >
            <SendIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[9px] text-cn-ink-subtle">
          <activeSkill.Icon className="h-2.5 w-2.5 opacity-50" />
          <span>{activeSkill.label} mode</span>
          <span className="mx-1 opacity-30">&middot;</span>
          <span className="font-medium text-cn-ink-muted">{activeSkill.cost}</span>
        </div>
      </div>
    </div>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.724 1.053a.5.5 0 01.545-.065l12 6a.5.5 0 010 .894l-12 6A.5.5 0 011.5 13.5v-4.379l6.854-1.027a.125.125 0 000-.248L1.5 6.879V2.5a.5.5 0 01.224-.447z" />
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
