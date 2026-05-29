"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PremiumCognaraLogo } from "../student/premium-cognara-logo";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

interface CompactChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  studentId: string;
  userRole: string;
  currentPage: string;
}

export function CompactChatWindow({
  isOpen,
  onClose,
  onMinimize,
  studentId,
  userRole,
  currentPage,
}: CompactChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Hi! I'm your Cognara AI. Ask me anything about your courses, lessons, or how to use the platform.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

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
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: {
            current_page: currentPage,
            user_role: userRole,
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
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, currentPage, userRole]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  const positionClass = isMinimized ? "bottom-[88px]" : "bottom-[88px]";

  return (
    <div
      ref={panelRef}
      className={`fixed ${positionClass} right-[24px] z-[9999] w-[360px] max-w-[calc(100vw-3rem)] rounded-[16px] border-[0.5px] border-[rgba(255,255,255,0.1)] bg-[#0f0f18] shadow-[0_8px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slide-up`}
      style={{
        animation: "slideUp 220ms ease-out",
        height: isMinimized ? "48px" : "520px",
        maxHeight: isMinimized ? "48px" : "calc(100vh - 8rem)",
      }}
    >
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Header */}
      <div className="h-[48px] bg-[#141420] rounded-t-[16px] border-b-[0.5px] border-[rgba(255,255,255,0.07)] flex items-center px-3">
        <div className="flex items-center gap-2">
          <PremiumCognaraLogo className="w-5 h-5 text-white" idSuffix="compact-chat" />
          <span className="text-white font-medium text-[13px]">Cognara AI</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsMinimized(!isMinimized);
              onMinimize();
            }}
            className="w-[28px] h-[28px] flex items-center justify-center border-none rounded-[6px] hover:bg-[rgba(255,255,255,0.07)] text-white transition-colors"
            aria-label="Minimize"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-[28px] h-[28px] flex items-center justify-center border-none rounded-[6px] hover:bg-[rgba(255,255,255,0.07)] text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-[10px]" 
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.1) transparent"
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] p-[10px_12px] rounded-[10px] text-[12.5px] ${
                  msg.role === "user"
                    ? "self-end bg-[rgba(224,90,43,0.18)] border-[0.5px] border-[rgba(224,90,43,0.25)] text-[rgba(255,255,255,0.85)]"
                    : "self-start bg-[rgba(255,255,255,0.05)] border-[0.5px] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.75)]"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="self-start bg-[rgba(255,255,255,0.05)] border-[0.5px] border-[rgba(255,255,255,0.08)] rounded-[10px] p-[10px_12px]">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="h-[52px] p-[8px_10px] border-t-[0.5px] border-[rgba(255,255,255,0.07)] flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              className="flex-1 h-[34px] bg-[rgba(255,255,255,0.05)] border-[0.5px] border-[rgba(255,255,255,0.1)] rounded-[9px] px-3 text-[12.5px] text-[rgba(255,255,255,0.85)] placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-[34px] h-[34px] bg-[#E05A2B] rounded-[8px] flex items-center justify-center border-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[#c94e25]"
              aria-label="Send"
            >
              <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.724 1.053a.5.5 0 01.545-.065l12 6a.5.5 0 010 .894l-12 6A.5.5 0 011.5 13.5v-4.379l6.854-1.027a.125.125 0 000-.248L1.5 6.879V2.5a.5.5 0 01.224-.447z" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
