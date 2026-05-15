import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/pricing", label: "Pricing" },
  { href: "/setup", label: "Setup" },
] as const;

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-cn-border bg-cn-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-cn-orange">COGNARA</span>
            <span className="text-cn-ink">™</span>
          </Link>
          <ThemeToggle className="sm:hidden" />
        </div>

        <div className="hidden min-w-0 flex-1 sm:flex sm:max-w-md sm:px-4">
          <label className="relative flex w-full items-center rounded-full border border-cn-border bg-cn-canvas pl-4 pr-1 shadow-inner">
            <span className="sr-only">Search courses</span>
            <input
              type="search"
              placeholder="Search courses, topics…"
              className="h-11 flex-1 bg-transparent text-sm text-cn-ink outline-none placeholder:text-cn-ink-subtle"
              readOnly
            />
            <span className="mr-1 flex h-9 w-9 items-center justify-center rounded-full bg-cn-orange text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
          </label>
        </div>

        <nav className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="hidden items-center gap-1 sm:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-3 py-2 text-sm font-medium text-cn-ink-muted transition hover:bg-cn-canvas hover:text-cn-ink"
              >
                {label}
              </Link>
            ))}
          </div>
          <ThemeToggle className="hidden sm:flex" />
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-cn-ink-muted hover:text-cn-ink md:inline"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-cn-orange px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cn-orange-hover"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
