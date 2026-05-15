import Link from "next/link";

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A9 9 0 0111.25 21c0 .394.013.787.038 1.172M12 6.042A8.967 8.967 0 0018 3.75c1.052 0 2.062.18 3 .512v14.25a9 9 0 01-5.25 2.844" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-24 top-16 h-96 w-96 rounded-full bg-cn-orange/15 blur-3xl" />
        <div className="absolute -left-24 top-40 h-80 w-80 rounded-full bg-cn-lavender/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cn-yellow/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-cn-border bg-cn-surface px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cn-orange shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-cn-orange" aria-hidden />
          SDG 4 · Quality education
        </div>

        <h1 className="mt-8 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-cn-ink sm:text-5xl lg:text-6xl">
          Where knowledge{" "}
          <span className="text-cn-orange">finds its place.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-cn-ink-muted">
          AI-native learning for students, verified coaches, and admins — warm dashboards, clear progress, and an agent that uses tools.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-cn-orange px-8 text-sm font-bold text-white shadow-lg shadow-cn-orange/25 transition hover:bg-cn-orange-hover"
          >
            Create account
          </Link>
          <Link
            href="/courses"
            className="inline-flex h-12 items-center justify-center rounded-full border border-cn-border bg-cn-surface px-8 text-sm font-bold text-cn-ink transition hover:border-cn-border-strong"
          >
            Browse courses
          </Link>
        </div>

        <section className="mt-20 grid gap-5 sm:grid-cols-3">
          {[
            { title: "Student portal", body: "Dashboard, code lab, notebook, quizzes, peer, and the COGNARA agent.", icon: IconBook },
            { title: "Coach portal", body: "Verification, curriculum, earnings, and permanent-free resources.", icon: IconBook },
            { title: "Admin portal", body: "Verification queue, security signals, and platform oversight.", icon: IconBook },
          ].map(({ title, body, icon: Icon }) => (
            <div key={title} className="cn-card p-6 transition hover:-translate-y-0.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cn-yellow/80 text-cn-sidebar">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-bold text-cn-ink">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-cn-ink-muted">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
