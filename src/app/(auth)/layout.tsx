import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid h-screen overflow-hidden bg-cn-canvas lg:grid-cols-2">
      {/* Brand panel — dark rail */}
      <aside className="relative hidden flex-col items-start justify-center overflow-hidden bg-cn-sidebar p-10 text-white lg:flex lg:p-14">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cn-orange/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cn-lavender/25 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cn-yellow/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <Link href="/" className="inline-block">
            <CognaraLogo variant="full" size={32} onDark />
          </Link>

          <p className="mt-6 text-xl font-semibold leading-snug text-white/90">
            Where knowledge finds its place.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
            Warm, focused learning — courses, code lab, AI agent, and progress in one student hub.
          </p>

          <div className="my-8 h-px w-16 bg-white/15" />

          <ul className="space-y-4 text-sm text-white/55">
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cn-yellow/90 text-cn-sidebar text-xs font-bold">1</span>
              Enroll in courses with clear progress
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cn-lavender/90 text-cn-sidebar text-xs font-bold">2</span>
              Learn with a tool-using AI tutor
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cn-orange text-xs font-bold text-white">3</span>
              Earn certificates &amp; track XP
            </li>
          </ul>

          <p className="mt-10 text-xs font-medium tracking-wide text-white/25">
            SDG 4 · Quality Education · Built for learners &amp; coaches
          </p>
        </div>
      </aside>

      {/* Form column — NO SCROLL */}
      <div className="relative flex h-full flex-col overflow-hidden px-4 py-4 sm:px-8 lg:px-14 lg:py-6">
        <div className="flex items-center justify-between lg:absolute lg:right-8 lg:top-6">
          <Link href="/" className="lg:hidden">
            <CognaraLogo variant="icon" size={28} />
          </Link>
          <ThemeToggle className="ml-auto" />
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
          <div className="cn-card p-6 sm:p-8">{children}</div>
          <p className="mt-4 text-center text-xs leading-relaxed text-cn-ink-subtle">
            COGNARA™ · SDG 4 Quality Education
          </p>
        </div>
      </div>
    </div>
  );
}
