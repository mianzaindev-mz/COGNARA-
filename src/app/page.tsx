import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <header className="border-b border-neutral-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-neutral-800 dark:bg-[#0A0A0A]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#0A0A0A] dark:text-white">
            COGNARA™
          </p>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              className="text-neutral-700 hover:text-[#6366F1] dark:text-neutral-200"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-white transition hover:bg-[#4F46E5]"
              href="/register"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#6366F1]">
            SDG 4 · Quality education
          </p>
          <h1 className="text-4xl font-bold leading-tight text-[#0A0A0A] dark:text-white sm:text-5xl">
            Where knowledge finds its place.
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">
            COGNARA is an AI-native learning platform for students, verified
            coaches, and administrators — built for Pakistan Vision 2030/2035
            workforce goals with transparent credits, protected payments, and
            tool-using agents (not bolt-on chatbots).
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-[#6366F1] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4F46E5]"
            >
              Create a student account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-white dark:hover:bg-neutral-900"
            >
              Sign in to dashboard
            </Link>
          </div>
        </div>

        <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#141414] sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0A0A0A] dark:text-white">
              Student portal
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Dashboard, code editor, notebook, quizzes, peer sessions, and the
              COGNARA agent with memory.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0A0A0A] dark:text-white">
              Coach portal
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Verification, curriculum tools, earnings calculator, and library
              controls with permanent-free guarantees.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0A0A0A] dark:text-white">
              Admin portal
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Verification queue, security signals, billing oversight, and
              policy enforcement.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
