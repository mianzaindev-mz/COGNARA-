"use client";

import React, { useState, useEffect, useRef } from "react";
import { FloatingAIButton } from "./FloatingAIButton";
import { CompactChatWindow } from "./CompactChatWindow";
import { useAIAssistantContext } from "@/hooks/use-ai-assistant-context";
import { createClient } from "@/lib/supabase/client";
import type { AgentAudience } from "./CompactChatWindow";

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>("");
  const [initialCredits, setInitialCredits] = useState<number | null>(null);
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

          const { data: credits } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", user.id)
            .maybeSingle();

          setInitialCredits(credits?.balance ?? null);
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
      // Cleanup: close chat window on unmount
      setIsOpen(false);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (context.isLoading) {
    return null;
  }

  if (!context.isEnabled) {
    return null;
  }

  if (context.isQuizActive) {
    return (
      <FloatingAIButton
        onClick={() => {}}
        disabled={true}
        isActive={false}
      />
    );
  }

  const audience: AgentAudience = context.userRole === "support" ? "support" : context.userRole === "admin" ? "admin" : context.userRole === "coach" ? "coach" : "student";

  return (
    <div ref={containerRef}>
      <FloatingAIButton
        onClick={handleToggle}
        disabled={false}
        isActive={isOpen}
      />
      <CompactChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        studentId={studentId}
        audience={audience}
        initialCredits={initialCredits}
        currentPage={context.currentPage}
      />
    </div>
  );
}
