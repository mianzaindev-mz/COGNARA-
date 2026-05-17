/**
 * COGNARA™ Logo — SVG icon mark
 *
 * Concept: Open book with neural network / brain nodes emerging from pages.
 * Inspired by the reference logos: book + AI neurons + circuit lines.
 *
 * Three variants:
 *  - icon:    Just the mark (sidebar, favicon)
 *  - full:    Icon + "COGNARA" wordmark
 *  - tagline: Icon + "COGNARA" + "AI-Powered Education Platform"
 */

type LogoProps = {
  variant?: "icon" | "full" | "tagline";
  className?: string;
  /** Override the icon size (default: 32 for icon, 28 for full/tagline) */
  size?: number;
};

export function CognaraLogo({ variant = "icon", className = "", size }: LogoProps) {
  const iconSize = size ?? (variant === "icon" ? 32 : 28);

  const icon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="cn-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5734" />
          <stop offset="100%" stopColor="#FF6B4A" />
        </linearGradient>
        <linearGradient id="cn-node" x1="20" y1="8" x2="44" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5734" />
          <stop offset="100%" stopColor="#be94f5" />
        </linearGradient>
      </defs>

      {/* Open book */}
      <path
        d="M8 48V18a2 2 0 011.2-1.83L30 10v36L9.2 51.83A2 2 0 018 50V48z"
        fill="url(#cn-grad)"
        opacity="0.9"
      />
      <path
        d="M56 48V18a2 2 0 00-1.2-1.83L34 10v36l20.8 5.83A2 2 0 0056 50V48z"
        fill="url(#cn-grad)"
        opacity="0.7"
      />

      {/* Book spine */}
      <line x1="32" y1="10" x2="32" y2="46" stroke="#151313" strokeWidth="1.5" opacity="0.3" />

      {/* Neural network nodes */}
      <circle cx="32" cy="16" r="3.5" fill="url(#cn-node)" />
      <circle cx="22" cy="8" r="2.5" fill="url(#cn-node)" />
      <circle cx="42" cy="8" r="2.5" fill="url(#cn-node)" />
      <circle cx="18" cy="18" r="2" fill="url(#cn-node)" opacity="0.7" />
      <circle cx="46" cy="18" r="2" fill="url(#cn-node)" opacity="0.7" />
      <circle cx="26" cy="4" r="1.5" fill="#be94f5" opacity="0.6" />
      <circle cx="38" cy="4" r="1.5" fill="#be94f5" opacity="0.6" />

      {/* Neural connections */}
      <line x1="32" y1="16" x2="22" y2="8" stroke="#FF5734" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="16" x2="42" y2="8" stroke="#FF5734" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="16" x2="18" y2="18" stroke="#be94f5" strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="16" x2="46" y2="18" stroke="#be94f5" strokeWidth="0.8" opacity="0.4" />
      <line x1="22" y1="8" x2="26" y2="4" stroke="#be94f5" strokeWidth="0.6" opacity="0.3" />
      <line x1="42" y1="8" x2="38" y2="4" stroke="#be94f5" strokeWidth="0.6" opacity="0.3" />

      {/* Glow dot at center */}
      <circle cx="32" cy="16" r="5" fill="#FF5734" opacity="0.15" />
    </svg>
  );

  if (variant === "icon") {
    return <span className={className}>{icon}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      <span className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-cn-ink">
          <span className="text-cn-orange">C</span>OGNARA
          <span className="text-[9px] align-super font-semibold text-cn-ink-subtle">™</span>
        </span>
        {variant === "tagline" && (
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-cn-ink-subtle">
            AI-Powered Education
          </span>
        )}
      </span>
    </span>
  );
}
