"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TopBarSearch } from "@/components/shared/top-bar-search";
import { WelcomeBrand } from "@/components/shared/welcome-brand";
import { CognaraLogo } from "@/components/shared/cognara-logo";
import { PageTransition } from "@/components/shared/page-transition";

const nav = [
  { href: "/dashboard", label: "Home", icon: IconGrid },
  { href: "/my-courses", label: "Courses", icon: IconBook },
  { href: "/editor", label: "Code lab", icon: IconCode },
  { href: "/notebook", label: "Notebook", icon: IconNotebook },
  { href: "/agent", label: "Agent", icon: IconSpark },
  { href: "/quizzes", label: "Quizzes", icon: IconQuiz },
  { href: "/progress", label: "Progress", icon: IconChart },
  { href: "/peer", label: "Peer", icon: IconUsers },
  { href: "/settings", label: "Settings", icon: IconCog },
] as const;

type StudentShellProps = {
  displayName: string;
  email: string | undefined;
  creditBalance: number | null;
  children: React.ReactNode;
};

export function StudentShell({ displayName, email, creditBalance: _creditBalance, children }: StudentShellProps) {
  const pathname = usePathname();
  const handle = email?.split("@")[0] ? `@${email.split("@")[0]}` : "@learner";
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/my-courses")
      return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/learn");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  /* ---- Shared sidebar content ---- */
  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {/* Brand */}
        <Link
          href="/"
          onClick={onNavigate}
          className="mb-6 flex items-center gap-3 overflow-hidden px-4"
        >
          <CognaraLogo variant="icon" size={28} />
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-white md:opacity-0 md:transition-opacity md:duration-200 md:group-hover/sidebar:opacity-100">
            COGNARA
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 transition-colors ${
                  active
                    ? "bg-cn-yellow text-cn-sidebar shadow-sm"
                    : "text-white/55 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap text-sm font-medium md:opacity-0 md:transition-opacity md:duration-200 md:group-hover/sidebar:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col gap-1 px-3 pb-2">
          <Link
            href="/billing"
            onClick={onNavigate}
            className={`flex h-11 items-center gap-3 rounded-xl px-3 transition-colors ${
              pathname.startsWith("/billing")
                ? "bg-cn-yellow text-cn-sidebar"
                : "text-white/55 hover:bg-white/10 hover:text-white"
            }`}
          >
            <IconCard className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium md:opacity-0 md:transition-opacity md:duration-200 md:group-hover/sidebar:opacity-100">
              Billing
            </span>
          </Link>
          <div className="flex h-11 items-center gap-3 rounded-xl px-3 text-white/55 transition-colors hover:bg-white/10 hover:text-white">
            <SignOutButton variant="sidebar" />
            <span className="whitespace-nowrap text-sm font-medium md:opacity-0 md:transition-opacity md:duration-200 md:group-hover/sidebar:opacity-100">
              Sign out
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-cn-canvas font-sans text-cn-ink">
      {/* Desktop sidebar — expandable on hover */}
      <aside className="group/sidebar fixed bottom-0 left-0 top-0 z-30 hidden w-[5.25rem] flex-col border-r border-white/10 bg-cn-sidebar py-6 transition-[width] duration-300 ease-in-out hover:w-56 hover:shadow-2xl md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute bottom-0 left-0 top-0 flex w-64 flex-col bg-cn-sidebar py-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-[5.25rem]">
        <header className="sticky top-0 z-20 border-b border-cn-border bg-cn-canvas/95 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            <div className="flex h-14 items-center gap-4 lg:gap-6">
              {/* Mobile hamburger */}
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-cn-border bg-cn-surface text-cn-ink-muted transition hover:text-cn-ink md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              <WelcomeBrand href="/dashboard" />
              <div className="hidden min-w-0 flex-1 md:flex md:justify-center md:px-2">
                <TopBarSearch className="max-w-2xl" placeholder="Search courses, lessons…" />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                <ThemeToggle className="hidden sm:inline-flex" />
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cn-border bg-cn-surface text-cn-ink-muted transition hover:text-cn-ink"
                  aria-label="Notifications"
                >
                  <IconBell className="h-5 w-5" />
                </button>
                <Link
                  href="/profile"
                  className="flex max-w-[11rem] items-center gap-2.5 sm:max-w-none"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cn-lavender/40 text-sm font-bold text-cn-ink ring-2 ring-cn-surface">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block truncate text-sm font-bold text-cn-ink">{displayName}</span>
                    <span className="block truncate text-xs text-cn-ink-subtle">{handle}</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="pb-1 md:hidden">
              <TopBarSearch placeholder="Search courses, lessons…" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────── */

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A9 9 0 0111.25 21c0 .394.013.787.038 1.172M12 6.042A8.967 8.967 0 0018 3.75c1.052 0 2.062.18 3 .512v14.25a9 9 0 01-5.25 2.844" />
    </svg>
  );
}

function IconCode({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function IconNotebook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M8.25 21h8.25a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H8.25A2.25 2.25 0 006 6.75v12A2.25 2.25 0 008.25 21z" />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <rect x="4" y="5" width="16" height="13" rx="3" />
      {/* Eyes */}
      <circle cx="9.5" cy="10.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10.5" r="1.25" fill="currentColor" stroke="none" />
      {/* Sparkle mouth */}
      <path d="M12 13.5l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4.4-1.1z" fill="currentColor" stroke="none" />
      {/* Antenna */}
      <line x1="12" y1="5" x2="12" y2="2.5" />
      <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
      {/* Base */}
      <path d="M8 18v1.5h8V18" />
    </svg>
  );
}

function IconQuiz({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.433-2.367M18 14a2.25 2.25 0 11-4.5 0m4.5 0a2.25 2.25 0 10-4.5 0M6.75 9a3.75 3.75 0 116 2.652M6.75 9a3.75 3.25 0 10-6 2.652m0 0a3 3 0 105.25 2.382A3 3 0 006.75 9z" />
    </svg>
  );
}

function IconCog({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconCard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9a4.5 4.5 0 00-9 0v.75v.7m12 6.75v1a2.25 2.25 0 01-2.25 2.25h-13.5A2.25 2.25 0 014.5 18.75v-1m16.5-9.75V9a6 6 0 00-6-6v0a6 6 0 00-6 6v.75"
      />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
