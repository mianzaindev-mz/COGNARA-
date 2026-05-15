import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/pricing", label: "Pricing" },
  { href: "/setup", label: "Setup" },
] as const;

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-cn-border bg-cn-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-cn-ink">
          <span className="text-cn-orange">COGNARA</span>™
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm font-medium text-cn-ink-muted transition hover:bg-cn-canvas hover:text-cn-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-cn-ink-muted hover:text-cn-ink sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-cn-orange px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
