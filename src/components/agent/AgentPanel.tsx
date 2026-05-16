"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { AgentMessage } from "./AgentMessage";
import { CreditDisplay } from "./CreditDisplay";
import type { AgentSkill } from "@/lib/ai/master-agent";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  skill?: string;
  creditsUsed?: number;
  timestamp: string;
};

const SKILLS: { key: AgentSkill; icon: string; label: string; cost: string }[] = [
  { key: "teach", icon: "🧠", label: "Teach Me", cost: "1 credit" },
  { key: "debug", icon: "🐛", label: "Debug Code", cost: "2 credits" },
  { key: "quiz", icon: "📄", label: "PDF → Quiz", cost: "3 credits" },
  { key: "voice", icon: "🎤", label: "Voice", cost: "1 cr/min" },
  { key: "path", icon: "🗺️", label: "Learning Path", cost: "3 credits" },
  { key: "support", icon: "🎫", label: "Support", cost: "1 credit" },
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `## ⚠️ Error\n\n${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
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

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-[var(--cn-shadow-card)]">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-cn-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink text-sm font-bold text-white">
            C
          </span>
          <div>
            <h2 className="text-sm font-bold text-cn-ink">COGNARA Agent</h2>
            <p className="text-[11px] text-cn-ink-subtle">AI-powered learning assistant</p>
          </div>
        </div>
        <div className="ml-auto">
          <CreditDisplay balance={credits} />
        </div>
      </div>

      {/* Skill Selector */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-cn-border px-4 py-2">
        {SKILLS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSkill(s.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              skill === s.key
                ? "bg-cn-orange text-white shadow-sm"
                : "text-cn-ink-muted hover:bg-cn-border/50 hover:text-cn-ink"
            }`}
          >
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className={`text-[10px] ${skill === s.key ? "text-white/70" : "text-cn-ink-subtle"}`}>
              {s.cost}
            </span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 text-4xl">🤖</span>
            <h3 className="text-lg font-bold text-cn-ink">
              What would you like to learn today?
            </h3>
            <p className="mt-1 max-w-sm text-sm text-cn-ink-muted">
              I&apos;m your AI tutor. Ask me anything — I&apos;ll explain concepts, debug your code,
              or generate practice problems.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "Explain recursion in Python",
                "What are closures?",
                "Help me with sorting algorithms",
                "Explain Big O notation",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="rounded-xl border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink-muted transition hover:border-cn-orange hover:text-cn-orange"
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
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink text-sm font-bold text-white">
                  C
                </div>
                <div className="rounded-2xl rounded-tl-md bg-cn-surface px-4 py-3 shadow-sm ring-1 ring-cn-border">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cn-orange [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cn-orange [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cn-orange [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-cn-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask the ${SKILLS.find((s) => s.key === skill)?.label ?? "Teach"} agent…`}
            rows={1}
            className="min-h-[2.5rem] max-h-32 flex-1 resize-none rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cn-orange text-white shadow-sm transition hover:bg-cn-orange-hover disabled:opacity-40"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-cn-ink-subtle">
          Shift+Enter for new line · Agent uses{" "}
          <span className="font-medium text-cn-ink-muted">
            {SKILLS.find((s) => s.key === skill)?.cost}
          </span>{" "}
          per message
        </p>
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
