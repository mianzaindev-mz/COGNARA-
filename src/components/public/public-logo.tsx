import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type PublicLogoProps = {
  href?: string;
  className?: string;
  showWordmark?: boolean;
};

export function PublicLogo({ href = "/", className, showWordmark = true }: PublicLogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90", className)}
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-cn-orange shadow-sm">
        <svg
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3l7 4v5c0 4.5-3 8.5-7 9-4-.5-7-4.5-7-9V7l7-4z"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-xl font-bold tracking-tight text-cn-ink">
          <span className="text-cn-orange">C</span>OGNARA
          <span className="text-base text-cn-ink">™</span>
        </span>
      ) : null}
    </Link>
  );
}
