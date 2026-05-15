import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen bg-cn-canvas lg:grid-cols-2">
      {/* Brand panel — Learnify-style dark rail */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-cn-sidebar p-10 text-white lg:flex lg:p-14">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cn-orange/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cn-lavender/25 blur-3xl" />
        </div>
        <div className="relative">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-cn-orange">COGNARA</span>
            <span className="text-white/90">™</span>
          </Link>
          <p className="mt-8 max-w-sm text-lg font-semibold leading-snug text-white/90">
            Where knowledge finds its place.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            Warm, focused learning — courses, code lab, AI agent, and progress in one student hub.
          </p>
        </div>
        <ul className="relative space-y-3 text-sm text-white/55">
          <li className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cn-yellow/90 text-cn-sidebar text-xs font-bold">
              1
            </span>
            Enroll in courses with clear progress
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cn-lavender/90 text-cn-sidebar text-xs font-bold">
              2
            </span>
            Learn with a tool-using AI tutor
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cn-orange text-xs font-bold text-white">
              3
            </span>
            Earn certificates & track XP
          </li>
        </ul>
      </aside>

      {/* Form column */}
      <div className="relative flex flex-col px-4 py-8 sm:px-8 lg:px-14 lg:py-12">
        <div className="mb-6 flex items-center justify-between lg:absolute lg:right-8 lg:top-8 lg:mb-0">
          <Link href="/" className="text-sm font-bold text-cn-orange lg:hidden">
            COGNARA™
          </Link>
          <ThemeToggle className="ml-auto" />
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
          <div className="cn-card p-8 sm:p-10">{children}</div>
          <p className="mt-8 text-center text-xs leading-relaxed text-cn-ink-subtle">
            COGNARA™ · SDG 4 Quality Education
          </p>
        </div>
      </div>
    </div>
  );
}
