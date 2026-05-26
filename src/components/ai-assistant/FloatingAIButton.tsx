"use client";

import React from "react";
import { PremiumCognaraLogo } from "@/components/student/premium-cognara-logo";

interface FloatingAIButtonProps {
  onClick: () => void;
  disabled?: boolean;
  hasExistingFAB?: boolean;
}

export function FloatingAIButton({ onClick, disabled = false, hasExistingFAB = false }: FloatingAIButtonProps) {
  const positionClass = hasExistingFAB ? "bottom-[88px]" : "bottom-[24px]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        fixed ${positionClass} right-[24px] z-[9999]
        flex items-center justify-center
        w-[52px] h-[52px] rounded-full
        bg-[#E05A2B]
        transition-transform duration-[200ms] ease-out
        hover:scale-[1.08]
        disabled:opacity-[0.35] disabled:cursor-not-allowed disabled:hover:scale-100
      `}
      style={{ transform: "scale(1)" }}
      aria-label="Open AI Assistant"
      title={disabled ? "AI disabled during assessments" : "Open AI Assistant"}
    >
      <PremiumCognaraLogo className="w-8 h-8 text-white" idSuffix="ai-assistant-fab" />
    </button>
  );
}
