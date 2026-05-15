import Link from "next/link";

type WelcomeBrandProps = {
  href?: string;
};

export function WelcomeBrand({ href = "/" }: WelcomeBrandProps) {
  return (
    <Link href={href} className="block shrink-0 leading-tight">
      <span className="block text-sm font-normal text-cn-ink-muted sm:text-base">Welcome to</span>
      <span className="mt-0.5 block text-xl font-bold tracking-tight text-cn-ink sm:text-2xl">
        <span className="text-cn-orange">C</span>OGNARA
        <span className="text-base font-bold text-cn-ink">™</span>
      </span>
    </Link>
  );
}
