"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TopBarSearch } from "@/components/shared/top-bar-search";
import { PublicLogo } from "@/components/public/public-logo";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Contact" },
] as const;

export function PublicHeaderBar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-cn-border bg-cn-surface/98 backdrop-blur-md transition-colors duration-300">
      <div className="w-full px-6 sm:px-12 lg:px-16 xl:px-24">
        <div className="flex h-16 items-center gap-4 lg:gap-8">
          <PublicLogo href="/" showWordmark className="shrink-0" />

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Main"
          >
            {navLinks.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-300",
                    active
                      ? "text-cn-orange"
                      : "text-cn-ink-muted hover:text-cn-ink",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-expanded={searchOpen}
              aria-controls="public-header-search"
              aria-label={searchOpen ? "Close search" : "Search"}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-cn-ink-muted transition-colors duration-300 hover:bg-cn-canvas hover:text-cn-ink",
                searchOpen && "bg-cn-canvas text-cn-orange",
              )}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <ThemeToggle className="hidden sm:inline-flex" />
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-cn-ink-muted transition-colors duration-300 hover:text-cn-ink sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-cn-orange px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cn-orange/25 transition-colors duration-300 hover:bg-cn-orange-hover sm:px-5"
            >
              Register
            </Link>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-cn-border/60 py-2 lg:hidden"
          aria-label="Main mobile"
        >
          {navLinks.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  active ? "text-cn-orange" : "text-cn-ink-muted",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div
          id="public-header-search"
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
            searchOpen ? "grid-rows-[1fr] border-t border-cn-border/60 py-3 opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <TopBarSearch
              inputRef={inputRef}
              placeholder="Search courses, topics…"
              onClose={() => setSearchOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}
