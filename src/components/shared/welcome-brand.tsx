import Link from "next/link";
import { CognaraLogo } from "@/components/shared/cognara-logo";

type WelcomeBrandProps = {
  href?: string;
};

export function WelcomeBrand({ href = "/" }: WelcomeBrandProps) {
  return (
    <Link href={href} className="block shrink-0 leading-tight">
      <span className="block text-sm font-normal text-cn-ink-muted sm:text-base">Welcome to</span>
      <span className="mt-1 block">
        <CognaraLogo variant="full" size={24} />
      </span>
    </Link>
  );
}
