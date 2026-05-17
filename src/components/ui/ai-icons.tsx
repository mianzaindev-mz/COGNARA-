/**
 * Professional AI/Agent SVG icons for COGNARA.
 * Inspired by the sparkle-brain-circuit reference icons.
 * Uses currentColor so they inherit parent text color.
 */

type IconProps = { className?: string };

/** AI Sparkle — 4-point star with small sparkles (top-right of reference grid) */
export function AISparkle({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.09 7.26L18 6L14.74 9.91L20 12L14.74 14.09L18 18L13.09 16.74L12 22L10.91 16.74L6 18L9.26 14.09L4 12L9.26 9.91L6 6L10.91 7.26L12 2Z" />
      <circle cx="19" cy="3" r="1.5" />
      <circle cx="21" cy="7" r="1" />
    </svg>
  );
}

/** AI Brain — half brain with circuit nodes (bottom-center of reference grid) */
export function AIBrain({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4.5a4.5 4.5 0 00-4.5 4.5c0 1.657.672 3.157 1.757 4.243L12 16.5l2.743-3.257A5.978 5.978 0 0016.5 9 4.5 4.5 0 0012 4.5z" />
      <path d="M12 16.5V21" />
      <circle cx="9" cy="9" r="0.75" fill="currentColor" />
      <circle cx="12" cy="7.5" r="0.75" fill="currentColor" />
      <circle cx="15" cy="9" r="0.75" fill="currentColor" />
      <line x1="9" y1="9" x2="12" y2="7.5" />
      <line x1="12" y1="7.5" x2="15" y2="9" />
      <line x1="9" y1="9" x2="12" y2="10.5" />
      <line x1="15" y1="9" x2="12" y2="10.5" />
      <circle cx="12" cy="10.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

/** AI Chat — speech bubble with sparkle (top-left of reference grid) */
export function AIChat({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      {/* Chat bubble */}
      <path d="M21 13.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 23l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      {/* AI sparkle inside */}
      <path d="M12 9l.6 1.8L14.4 11.4l-1.8.6L12 13.8l-.6-1.8-1.8-.6 1.8-.6L12 9z" fill="currentColor" stroke="none" />
      {/* Small sparkle */}
      <path d="M16.5 7l.3.9.9.3-.9.3-.3.9-.3-.9-.9-.3.9-.3.3-.9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** AI Agent — the primary icon for the COGNARA AI tutor sidebar nav */
export function AIAgent({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      {/* Head/frame */}
      <rect x="4" y="4" width="16" height="14" rx="3" />
      {/* Eyes */}
      <circle cx="9.5" cy="10" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10" r="1.25" fill="currentColor" stroke="none" />
      {/* Mouth sparkle */}
      <path d="M12 13.5l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4.4-1.2z" fill="currentColor" stroke="none" />
      {/* Antenna */}
      <line x1="12" y1="4" x2="12" y2="2" />
      <circle cx="12" cy="1.5" r="1" fill="currentColor" stroke="none" />
      {/* Base */}
      <path d="M8 18v2h8v-2" />
    </svg>
  );
}
