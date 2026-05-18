/**
 * AI Agent icon for COGNARA — purple gradient orb with white sparkles.
 * Inspired by modern AI product icons (Google Gemini, Apple Intelligence).
 * Used consistently across all agent surfaces.
 */

type AgentIconProps = {
  size?: number;
  className?: string;
};

/** Primary AI icon — purple orb with 2 sparkle stars */
export function AgentIcon({ size = 24, className = "" }: AgentIconProps) {
  const id = `agent-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="65%" fx="35%" fy="30%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="45%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
      </defs>
      {/* Orb */}
      <circle cx="16" cy="16" r="14" fill={`url(#${id})`} />
      {/* Main 4-point sparkle */}
      <path
        d="M14 8 L15.2 12.8 L20 14 L15.2 15.2 L14 20 L12.8 15.2 L8 14 L12.8 12.8 Z"
        fill="white"
      />
      {/* Small sparkle */}
      <path
        d="M21 10 L21.6 12 L23.6 12.6 L21.6 13.2 L21 15.2 L20.4 13.2 L18.4 12.6 L20.4 12 Z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  );
}

/** Pill-shaped agent badge with icon + label — used in headers and panels */
export function AgentBadge({ label = "COGNARA Agent", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <AgentIcon size={28} />
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}
