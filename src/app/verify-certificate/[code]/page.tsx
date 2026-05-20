import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { CognaraLogo } from "@/components/shared/cognara-logo";

type PageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Verify Certificate ${code} — COGNARA™`,
    description: `Verify the authenticity of COGNARA course completion certificate ${code}.`,
  };
}

function getUuidRangeFromPrefix(prefix: string) {
  const clean = prefix.toLowerCase().replace(/[^0-9a-f]/g, "");
  if (clean.length < 6) return null;

  const padLen = 8 - clean.length;
  const minFirstBlock = clean + "0".repeat(padLen);
  const maxFirstBlock = clean + "f".repeat(padLen);

  return {
    min: `${minFirstBlock}-0000-0000-0000-000000000000`,
    max: `${maxFirstBlock}-ffff-ffff-ffff-ffffffffffff`,
  };
}

function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-cn-border/50 bg-cn-surface/85 backdrop-blur-md dark:border-[#2e2a2a]/50 dark:bg-[#1a1818]/85">
      <div className="mx-auto flex max-w-6xl h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <CognaraLogo variant="full" size={26} />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-cn-ink-muted dark:text-cn-ink-subtle">
          <Link href="/courses" className="hover:text-cn-orange transition">Courses</Link>
          <Link href="/pricing" className="hover:text-cn-orange transition">Pricing</Link>
          <Link href="/register" className="hover:text-cn-orange transition">Apply as Coach</Link>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold text-cn-ink-muted hover:text-cn-orange transition dark:text-cn-ink-subtle">
                Dashboard
              </Link>
              <Link href="/certificates" className="rounded-full bg-cn-orange px-5 py-2 text-sm font-bold text-white transition hover:bg-cn-orange-hover">
                My Certificates
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-cn-ink-muted hover:text-cn-orange transition dark:text-cn-ink-subtle">
                Sign In
              </Link>
              <Link href="/register" className="rounded-full bg-cn-orange px-5 py-2 text-sm font-bold text-white transition hover:bg-cn-orange-hover">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { code } = await params;
  const parts = code.split("-");
  const enrollPrefix = parts[parts.length - 1];

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isLoggedIn = !!currentUser;

  if (!enrollPrefix || enrollPrefix.length < 6) {
    return <InvalidCertificateView code={code} isLoggedIn={isLoggedIn} />;
  }

  const range = getUuidRangeFromPrefix(enrollPrefix);
  if (!range) {
    return <InvalidCertificateView code={code} isLoggedIn={isLoggedIn} />;
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(`
      id,
      progress_pct,
      enrolled_at,
      completed_at,
      profiles!enrollments_student_id_fkey(full_name),
      courses!enrollments_course_id_fkey(
        title,
        profiles!courses_coach_id_fkey(full_name)
      )
    `)
    .gte("id", range.min)
    .lte("id", range.max)
    .maybeSingle();

  // Typesafe extraction from join
  const e = enrollment as unknown as {
    id: string;
    progress_pct: number;
    enrolled_at: string;
    completed_at: string | null;
    profiles: { full_name: string | null } | null;
    courses: {
      title: string;
      profiles: { full_name: string | null } | null;
    } | null;
  } | null;

  if (!e || (e.progress_pct ?? 0) < 100) {
    return <InvalidCertificateView code={code} isLoggedIn={isLoggedIn} />;
  }

  const studentName = e.profiles?.full_name ?? "Student";
  const courseTitle = e.courses?.title ?? "Course";
  const coachName = e.courses?.profiles?.full_name ?? "Coach";
  const completedDate = new Date(e.completed_at ?? e.enrolled_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-cn-canvas dark:bg-[#0f0e0e]">
      {/* Session-Aware Top Navigation */}
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-2xl text-center">
          {/* Certificate Card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-cn-border bg-cn-surface p-8 shadow-[var(--cn-shadow-card)] dark:border-[#2e2a2a] dark:bg-[#1a1818] sm:p-12">
            {/* Subtle decorative elements */}
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cn-orange/5 blur-3xl" />
            <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-cn-yellow/5 blur-3xl" />

            {/* Verified Badge */}
            <div className="mx-auto mb-6 flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              VERIFIED CREDENTIAL
            </div>

            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-cn-ink-subtle dark:text-cn-ink-muted">
              Certificate of Completion
            </h2>

            <p className="mt-8 text-sm text-cn-ink-muted dark:text-cn-ink-subtle">
              This is to certify that
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-cn-ink dark:text-white sm:text-3xl">
              {studentName}
            </h3>

            <p className="mt-6 text-sm text-cn-ink-muted dark:text-cn-ink-subtle">
              has successfully completed the curriculum requirements for the course
            </p>
            <h4 className="mt-2 text-xl font-bold tracking-tight text-cn-orange dark:text-cn-orange">
              {courseTitle}
            </h4>

            <p className="mt-1 text-xs text-cn-ink-subtle dark:text-cn-ink-muted">
              instructed by {coachName}
            </p>

            <div className="mt-10 h-[1px] w-full bg-cn-border dark:bg-[#2e2a2a]" />

            <div className="mt-8 grid gap-6 sm:grid-cols-2 text-left text-sm">
              <div>
                <span className="block text-xs text-cn-ink-subtle dark:text-cn-ink-muted">Verification Code</span>
                <span className="font-mono font-bold text-cn-ink dark:text-white">{code}</span>
              </div>
              <div>
                <span className="block text-xs text-cn-ink-subtle dark:text-cn-ink-muted">Completion Date</span>
                <span className="font-bold text-cn-ink dark:text-white">{completedDate}</span>
              </div>
            </div>

            {/* Secure Trust Seal */}
            <div className="mt-10 flex flex-col items-center justify-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cn-orange to-cn-pink text-white shadow-lg shadow-cn-orange/20">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cn-ink-muted dark:text-cn-ink-subtle">
                Tamper-Proof Digital Record
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4 text-xs font-semibold text-cn-ink-muted dark:text-cn-ink-subtle">
            <Link href="/" className="hover:text-cn-orange transition">About COGNARA™</Link>
            <span>·</span>
            <Link href="/courses" className="hover:text-cn-orange transition">Explore Courses</Link>
            <span>·</span>
            <Link href="/pricing" className="hover:text-cn-orange transition">Plans & Pricing</Link>
          </div>
        </div>
      </div>

      {/* Verified Footer */}
      <footer className="border-t border-cn-border/50 bg-cn-surface py-6 dark:border-[#2e2a2a]/50 dark:bg-[#1a1818]">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-cn-ink-subtle dark:text-cn-ink-muted sm:px-8">
          <p>© {new Date().getFullYear()} COGNARA™. All rights reserved. SDG 4 Aligned AI Education.</p>
        </div>
      </footer>
    </div>
  );
}

function InvalidCertificateView({ code, isLoggedIn }: { code: string; isLoggedIn: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-cn-canvas dark:bg-[#0f0e0e]">
      {/* Dynamic Top Navbar */}
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-md text-center">
          <div className="rounded-[2rem] border border-cn-border bg-cn-surface p-8 shadow-[var(--cn-shadow-card)] dark:border-[#2e2a2a] dark:bg-[#1a1818] sm:p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-lg font-black tracking-tight text-cn-ink dark:text-white">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-cn-ink-muted dark:text-cn-ink-subtle">
              The certificate code <code className="rounded bg-cn-border/50 px-1 font-mono text-xs text-cn-orange dark:bg-[#2e2a2a]">{code}</code> is invalid, has been revoked, or corresponds to an incomplete enrollment record.
            </p>

            <Link
              href={isLoggedIn ? "/dashboard" : "/"}
              className="mt-6 inline-flex w-full justify-center rounded-xl bg-cn-orange py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
            >
              {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
            </Link>
          </div>
        </div>
      </div>

      {/* Verified Footer */}
      <footer className="border-t border-cn-border/50 bg-cn-surface py-6 dark:border-[#2e2a2a]/50 dark:bg-[#1a1818]">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-cn-ink-subtle dark:text-cn-ink-muted sm:px-8">
          <p>© {new Date().getFullYear()} COGNARA™. All rights reserved. SDG 4 Aligned AI Education.</p>
        </div>
      </footer>
    </div>
  );
}
