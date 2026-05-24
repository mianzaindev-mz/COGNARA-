"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { FloatingAIButton } from "./FloatingAIButton";
import { CompactChatWindow } from "./CompactChatWindow";
import { useAIAssistantContext } from "@/hooks/use-ai-assistant-context";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

interface AIAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: Message[];
}

interface AIAssistantContextValue {
  state: AIAssistantState;
  setState: React.Dispatch<React.SetStateAction<AIAssistantState>>;
}

const AIAssistantStateContext = createContext<AIAssistantContextValue | null>(null);

export function AIAssistant() {
  const [state, setState] = useState<AIAssistantState>({
    isOpen: false,
    isMinimized: false,
    messages: [],
  });
  const [studentId, setStudentId] = useState<string>("");
  const context = useAIAssistantContext();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setStudentId(user.id);
        }
      } catch (error) {
        console.error("[AI Assistant] Error fetching user data:", error);
      }
    }

    if (context.isEnabled && !context.isLoading) {
      fetchUserData();
    }
  }, [context.isEnabled, context.isLoading]);

  useEffect(() => {
    return () => {
      setState({ isOpen: false, isMinimized: false, messages: [] });
    };
  }, []);

  const handleToggle = () => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen, isMinimized: false }));
  };

  const handleClose = () => {
    setState({ isOpen: false, isMinimized: false, messages: [] });
  };

  const handleMinimize = () => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  if (context.isLoading) {
    console.log("[AI Assistant] Loading context...");
    return null;
  }

  if (!context.isEnabled) {
    console.log("[AI Assistant] Not enabled on this page:", context.currentPage);
    return null;
  }

  if (context.isQuizActive) {
    return (
      <AIAssistantStateContext.Provider value={{ state, setState }}>
        <FloatingAIButton
          onClick={() => {}}
          disabled={true}
          hasExistingFAB={false}
        />
      </AIAssistantStateContext.Provider>
    );
  }

  return (
    <AIAssistantStateContext.Provider value={{ state, setState }}>
      <div ref={containerRef}>
        <FloatingAIButton
          onClick={handleToggle}
          disabled={false}
          hasExistingFAB={false}
        />
        <CompactChatWindow
          isOpen={state.isOpen}
          onClose={handleClose}
          onMinimize={handleMinimize}
          studentId={studentId}
          userRole={context.userRole || "student"}
          currentPage={context.currentPage}
        />
      </div>
    </AIAssistantStateContext.Provider>
  );
}
