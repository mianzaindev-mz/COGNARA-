"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { AgentMessage } from "./AgentMessage";
import { CreditDisplay } from "./CreditDisplay";
import { VoiceButton } from "./VoiceButton";
import { StudyBoard } from "./StudyBoard";
import { AgentIcon } from "@/components/ui/agent-icon";
import { looksLikeUrdu } from "@/lib/voice/utils";
import {
  IconBrain, IconBug, IconClipboard, IconMicrophone,
  IconTarget, IconTicket, IconFlashcard, IconLightning, IconChild,
  IconBook, IconChartUp, IconSparkle,
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
type AgentAudience = "student" | "coach" | "admin";

const STUDENT_SKILLS: SkillOption[] = [
  { key: "teach", Icon: IconBrain, label: "Teach Me", desc: "Explain concepts clearly", cost: "1 cr" },
  { key: "debug", Icon: IconBug, label: "Debug", desc: "Fix your code issues", cost: "2 cr" },
  { key: "quiz", Icon: IconClipboard, label: "Quiz", desc: "Generate practice problems", cost: "3 cr" },
  { key: "flashcard", Icon: IconFlashcard, label: "Flashcards", desc: "Spaced repetition cards", cost: "1 cr" },
  { key: "challenge", Icon: IconLightning, label: "Challenge", desc: "Timed coding puzzles", cost: "1 cr" },
  { key: "eli5", Icon: IconChild, label: "ELI5", desc: "Explain like I'm 5", cost: "1 cr" },
  { key: "generate_course", Icon: IconBook, label: "Generate Course", desc: "Build a full course from any topic", cost: "3 cr" },
  { key: "summarize", Icon: IconSparkle, label: "Summarize", desc: "Condense content into key points", cost: "1 cr" },
  { key: "progress_report", Icon: IconChartUp, label: "Progress", desc: "Study insights & recommendations", cost: "1 cr" },
  { key: "voice", Icon: IconMicrophone, label: "Voice", desc: "Spoken conversation", cost: "1 cr/min" },
  { key: "path", Icon: IconTarget, label: "Path", desc: "Create learning roadmap", cost: "3 cr" },
  { key: "support", Icon: IconTicket, label: "Support", desc: "Get help with the platform", cost: "1 cr" },
];

const COACH_SKILLS: SkillOption[] = [
  { key: "coach", Icon: IconBrain, label: "Coach Agent", desc: "Courses, lessons, rubrics", cost: "Free" },
  { key: "generate_course", Icon: IconBook, label: "Generate Course", desc: "AI-build a full course from scratch", cost: "Free" },
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
      "Generate a course about Python basics",
      "Summarize my study progress",
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
};

type Props = {
  studentId: string;
  initialCredits: number | null;
  audience?: AgentAudience;
  initialSkill?: AgentSkill;
};

export function AgentPanel({ studentId, initialCredits, audience = "student", initialSkill }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const skills = audience === "coach" ? COACH_SKILLS : audience === "admin" ? ADMIN_SKILLS : STUDENT_SKILLS;
  const copy = AUDIENCE_COPY[audience];
  const resolvedInitial = initialSkill && skills.some(s => s.key === initialSkill) ? initialSkill : (skills[0]?.key ?? "teach");
  const [skill, setSkill] = useState<AgentSkill>(resolvedInitial);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [credits, setCredits] = useState<number | null>(initialCredits);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [studyBoardContent, setStudyBoardContent] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<"en" | "ur">("en");
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
          context: { current_page: `${audience}_agent`, audience, voice_language: voiceLang },
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
  }, [audience, input, isLoading, skill, studentId, voiceLang]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const queueBackgroundJob = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isQueueing) return;

    setIsQueueing(true);
    try {
      const res = await fetch("/api/agent/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill,
          prompt: trimmed,
          audience,
          priority: audience === "admin" ? "high" : "normal",
          context: { current_page: `${audience}_agent`, audience, voice_language: voiceLang },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not queue background job");

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `## Background Job Queued\n\nYour request has been saved as job \`${data.job.id}\`. A server worker can finish it even if you close the browser, then store the result for review.`,
          skill: "background",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setInput("");
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `## Queue Failed\n\n${err instanceof Error ? err.message : "The background job could not be created."}`,
          skill: "error",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsQueueing(false);
    }
  }, [audience, input, isQueueing, skill, voiceLang]);

  const activeSkill = skills.find((s) => s.key === skill) ?? skills[0] ?? STUDENT_SKILLS[0];
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
                <h2 className="text-sm font-bold tracking-tight text-cn-ink">{copy.title}</h2>
                <p className="text-[11px] text-cn-ink-subtle">
                  {isLoading ? "Thinking..." : copy.status}
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
                {copy.emptyTitle}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-cn-ink-muted">
                {copy.emptyBody}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {copy.suggestions.map((suggestion) => (
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
                  onOpenBoard={msg.role === "assistant" ? setStudyBoardContent : undefined}
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
                  {skills.map((s) => (
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
                if (looksLikeUrdu(text)) setVoiceLang("ur");
                setInput(text);
                setTimeout(() => {
                  const sendBtn = document.getElementById("agent-send-btn");
                  sendBtn?.click();
                }, 100);
              }}
              speakText={skill === "voice" ? lastResponse : null}
              disabled={isLoading}
              onLanguageChange={setVoiceLang}
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
            <button
              type="button"
              onClick={queueBackgroundJob}
              disabled={!input.trim() || isLoading || isQueueing}
              className="cn-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cn-border bg-cn-canvas text-cn-ink-muted transition hover:border-cn-orange/40 hover:text-cn-orange disabled:opacity-40"
              title="Queue as background job"
            >
              {isQueueing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-cn-orange/30 border-t-cn-orange" /> : <QueueIcon className="h-4 w-4" />}
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

/* looksLikeUrdu is imported from @/lib/voice/utils */

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

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 16 16" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h10M3 8h7M3 12h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.5l1.5 1.5L12 12.5M10 11h3.5" />
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
