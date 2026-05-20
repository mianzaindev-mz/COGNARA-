import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { PremiumCognaraLogo } from "../student/premium-cognara-logo";

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
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        <PremiumCognaraLogo className="w-9 h-9 logo-image filter drop-shadow-[0_0_6px_rgba(255,107,61,0.25)]" idSuffix="public_logo" />
      </div>
      {showWordmark ? (
        <span className="font-headline text-xl font-extrabold tracking-tight text-cn-ink flex items-center">
          COGNARA<span className="text-[8px] self-start mt-0.5 opacity-40 font-bold ml-0.5">TM</span>
        </span>
      ) : null}
    </Link>
  );
}
