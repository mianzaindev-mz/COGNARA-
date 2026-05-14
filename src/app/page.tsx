import Link from "next/link";

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A9 9 0 0111.25 21c0 .394.013.787.038 1.172M12 6.042A8.967 8.967 0 0018 3.75c1.052 0 2.062.18 3 .512v14.25a9 9 0 01-5.25 2.844M6.75 18.75v-8.625c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v8.625M6.75 18.75h12" />
    </svg>
  );
}

function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.125c0 .621-.504 1.125-1.125 1.125H4.875c-.621 0-1.125-.504-1.125-1.125v-4.125M19.5 7.125c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125m17.25 0c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125m17.25 0v1.5c0 .621-.504 1.125-1.125 1.125M5.625 9.75h12.75m-12.75 0a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#0A0A0A] dark:bg-[#0A0A0A] dark:text-white">
      <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-neutral-800/80 dark:bg-[#0A0A0A]/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold tracking-[0.2em] text-[#0A0A0A] dark:text-white">
            COGNARA™
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/setup"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 sm:inline dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
            >
              Setup
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4F46E5] hover:shadow-md"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-[#6366F1]/12 blur-3xl dark:bg-[#6366F1]/20" />
          <div className="absolute -left-20 top-40 h-72 w-72 rounded-full bg-[#818CF8]/10 blur-3xl dark:bg-[#4F46E5]/10" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6366F1]/25 bg-[#6366F1]/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#4F46E5] shadow-sm dark:border-[#818CF8]/35 dark:bg-[#6366F1]/15 dark:text-[#A5B4FC]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] dark:bg-[#818CF8]" aria-hidden />
              SDG 4 · Quality education
            </div>

            <h1 className="mt-8 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl sm:leading-[1.08] lg:text-6xl">
              Where knowledge{" "}
              <span className="bg-gradient-to-r from-[#6366F1] to-[#818CF8] bg-clip-text text-transparent">
                finds its place.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              AI-native learning for students, verified coaches, and platform admins — aligned with Pakistan Vision
              2030/2035, with transparent credits, in-platform payments, and agents that use tools, not generic chat.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#6366F1] px-8 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/25 transition hover:bg-[#4F46E5] hover:shadow-xl"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-8 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
              >
                Sign in
              </Link>
              <Link
                href="/setup"
                className="text-sm font-medium text-[#6366F1] underline-offset-4 hover:underline sm:ml-2"
              >
                Configure Supabase →
              </Link>
            </div>
          </div>

          <section className="mt-20 grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "Student portal",
                body: "Dashboard, code lab, notebook, quizzes, peer sessions, and the COGNARA agent with memory.",
                icon: IconBook,
              },
              {
                title: "Coach portal",
                body: "Verification, curriculum, earnings preview, and resources with permanent-free guarantees.",
                icon: IconBriefcase,
              },
              {
                title: "Admin portal",
                body: "Verification queue, security signals, billing oversight, and policy enforcement.",
                icon: IconShield,
              },
            ].map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="group rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition hover:border-[#6366F1]/30 hover:shadow-md dark:border-neutral-800 dark:bg-[#141414] dark:hover:border-[#6366F1]/25"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6366F1]/10 text-[#6366F1] transition group-hover:bg-[#6366F1]/15 dark:bg-[#6366F1]/20 dark:text-[#A5B4FC]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-neutral-900 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{body}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-[#0A0A0A] dark:text-neutral-500">
        <p>COGNARA™ · SDG 4 Quality Education · Built for equitable technical learning</p>
      </footer>
    </div>
  );
}
