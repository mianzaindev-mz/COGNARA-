"use client";

import React from "react";

export function PremiumCognaraLogo({ className, idSuffix = "" }: { className?: string; idSuffix?: string }) {
  const gradId = `sleek_grad_${idSuffix}`;
  const glowId = `soft_glow_${idSuffix}`;
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff9d6e" />
          <stop offset="100%" stopColor="#ff6b3d" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor="#ff6b3d" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Thin, elegant geometric spark */}
      <path d="M50 15V85M15 50H85M25 25L75 75M75 25L25 75" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinecap="round" opacity="0.1" />
      <path d="M50 20C50 20 52 48 50 50C48 48 50 20 50 20Z" fill={`url(#${gradId})`} filter={`url(#${glowId})`}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M50 30L53 47L70 50L53 53L50 70L47 53L30 50L47 47L50 30Z" fill="currentColor" filter={`url(#${glowId})`} />
      <circle cx="50" cy="50" r="4" fill="currentColor">
         <animate attributeName="r" values="3.5;4.5;3.5" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
