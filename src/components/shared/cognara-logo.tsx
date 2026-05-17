/**
 * COGNARA™ Logo — SVG icon mark
 *
 * Concept: Orange rounded square with white open book + neural sparkle star.
 * Clean, bold design that reads clearly at 24px–64px.
 *
 * Three variants:
 *  - icon:    Just the mark (sidebar, favicon)
 *  - full:    Icon + "COGNARA" wordmark
 *  - tagline: Icon + "COGNARA" + "AI-Powered Education"
 */

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
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      {/* Rounded square background */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#FF5734" />

      {/* Open book — left page */}
      <path
        d="M12 34V18a1 1 0 01.6-.92L23 13v20l-10.4 4.33A1 1 0 0112 36.4V34z"
        fill="white"
        opacity="0.95"
      />
      {/* Open book — right page */}
      <path
        d="M36 34V18a1 1 0 00-.6-.92L25 13v20l10.4 4.33A1 1 0 0036 36.4V34z"
        fill="white"
        opacity="0.75"
      />

      {/* Neural spark — 4-point star emerging from book */}
      <path
        d="M24 8l1.8 4.8L30.6 14.6l-4.8 1.8L24 21.2l-1.8-4.8-4.8-1.8 4.8-1.8L24 8z"
        fill="white"
      />
      {/* Small accent sparkles */}
      <circle cx="31" cy="10" r="1.5" fill="white" opacity="0.7" />
      <circle cx="17" cy="11" r="1" fill="white" opacity="0.5" />
    </svg>
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
        <span className={`text-base font-bold tracking-tight ${textColor}`}>
          <span className="text-cn-orange">C</span>OGNARA
          <span className={`text-[9px] align-super font-semibold ${subColor}`}>™</span>
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
