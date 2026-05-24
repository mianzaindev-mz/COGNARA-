"use client";

import React, { useState, useRef, useEffect } from "react";
import { PremiumCognaraLogo } from "@/components/student/premium-cognara-logo";

interface FloatingAIButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

export function FloatingAIButton({ onClick, disabled = false, isActive = false }: FloatingAIButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center justify-center
        w-14 h-14 rounded-2xl
        bg-gradient-to-br from-cn-orange to-cn-pink
        shadow-lg shadow-cn-orange/30
        transition-all duration-300 ease-out
        hover:scale-110 hover:shadow-xl hover:shadow-cn-orange/40
        active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        ${isActive ? 'ring-2 ring-cn-orange ring-offset-2 ring-offset-cn-surface' : ''}
      `}
      aria-label="Open AI Assistant"
      title={disabled ? "AI Assistant unavailable during assessments" : "Open AI Assistant"}
    >
      <div className="relative">
        <PremiumCognaraLogo className="w-8 h-8 text-white" idSuffix="float" />
        {isHovered && !disabled && (
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-cn-surface" />
          </div>
        )}
      </div>
    </button>
  );
}
