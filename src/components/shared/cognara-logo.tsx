/**
 * COGNARA™ Logo — SVG icon mark
 *
 * Updated Concept: Refined geometric spark logo matching brand identity.
 * Clean, bold design that reads clearly at 24px–64px.
 *
 * Three variants:
 *  - icon:    Just the mark (sidebar, favicon)
 *  - full:    Icon + "COGNARA" wordmark
 *  - tagline: Icon + "COGNARA" + "AI-Powered Education"
 */

import React from "react";
import { PremiumCognaraLogo } from "../student/premium-cognara-logo";

type LogoProps = {
  variant?: "icon" | "full" | "tagline";
  className?: string;
  /** Override the icon size (default: 32 for icon, 28 for full/tagline) */
  size?: number;
  /** Use white text for dark backgrounds (default: false) */
  onDark?: boolean;
};

export function CognaraLogo({ variant = "icon", className = "", size, onDark = false }: LogoProps) {
  const iconSize = size ?? (variant === "icon" ? 32 : 28);

  const icon = (
    <div style={{ width: iconSize, height: iconSize }} className="shrink-0 flex items-center justify-center">
      <PremiumCognaraLogo className="w-full h-full logo-image filter drop-shadow-[0_0_6px_rgba(255,107,61,0.25)]" idSuffix="shared" />
    </div>
  );

  if (variant === "icon") {
    return <span className={className}>{icon}</span>;
  }

  const textColor = onDark ? "text-white" : "text-cn-ink";
  const subColor = onDark ? "text-white/50" : "text-cn-ink-subtle";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      <span className="flex flex-col leading-tight">
        <span className={`font-headline text-lg font-extrabold tracking-tight ${textColor} flex items-center`}>
          COGNARA<span className={`text-[8px] self-start mt-0.5 opacity-40 font-bold ml-0.5 ${subColor}`}>TM</span>
        </span>
        {variant === "tagline" && (
          <span className={`text-[10px] font-medium uppercase tracking-[0.12em] ${subColor}`}>
            AI-Powered Education
          </span>
        )}
      </span>
    </span>
  );
}
