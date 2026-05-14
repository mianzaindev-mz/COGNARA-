import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student dashboard — COGNARA™",
};

const filters = ["All courses", "Marketing", "Computer Science", "Psychology"] as const;

const courses = [
  {
    id: "1",
    category: "Marketing",
    title: "Creative writing for beginners",
    progress: { done: 5, total: 20 },
    tint: "bg-[#fff4d6] border-[#fccc42]/40",
    badge: "bg-[#fccc42]/90 text-[#151313]",
  },
  {
    id: "2",
    category: "Computer Science",
    title: "Digital illustration foundations",
    progress: { done: 3, total: 12 },
    tint: "bg-[#ebe4ff] border-[#be94f5]/35",
    badge: "bg-[#be94f5] text-[#151313]",
  },
  {
    id: "3",
    category: "Psychology",
    title: "Public speaking & leadership",
    progress: { done: 8, total: 24 },
    tint: "bg-[#e4f2ff] border-sky-200/60",
    badge: "bg-sky-300/90 text-[#151313]",
  },
] as const;

const nextLessons = [
  { lesson: "Lesson 4 · Story arcs", course: "Creative writing", teacher: "A. Rivera", duration: "22 min" },
  { lesson: "Lesson 2 · Vector basics", course: "Illustration", teacher: "M. Chen", duration: "18 min" },
  { lesson: "Lesson 1 · Presence", course: "Public speaking", teacher: "J. Okonjo", duration: "30 min" },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    profile?.full_name?.split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#151313] sm:text-3xl">
            Hi, {firstName} — here&apos;s your space
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[#151313]/55">
            Pick up where you left off. Course data will connect to Supabase as the catalog and enrollments land.
            {profile?.role ? (
              <span className="ml-1 rounded-full bg-[#151313]/08 px-2 py-0.5 text-xs font-medium text-[#151313]/70">
                Role: {profile.role}
              </span>
            ) : null}
          </p>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#151313]">My courses</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((label, i) => (
            <button
              key={label}
              type="button"
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                i === 0
                  ? "border-[#151313] bg-[#151313] text-white shadow-sm"
                  : "border-[#151313]/15 bg-white text-[#151313]/80 hover:border-[#151313]/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {courses.map((c) => {
            const pct = Math.round((100 * c.progress.done) / c.progress.total);
            return (
              <article
                key={c.id}
                className={`flex flex-col rounded-[1.75rem] border p-5 shadow-[0_12px_40px_-24px_rgba(21,19,19,0.45)] ${c.tint}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.badge}`}>{c.category}</span>
                  <button
                    type="button"
                    className="rounded-xl p-2 text-[#151313]/40 transition hover:bg-white/60 hover:text-[#151313]"
                    aria-label="Bookmark"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.08 1.907 2.185V21L12 17.25l-7.5 3.75V5.507c0-1.106.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>
                </div>
                <h3 className="mt-4 text-lg font-bold leading-snug text-[#151313]">{c.title}</h3>
                <p className="mt-3 text-xs font-medium text-[#151313]/50">
                  {c.progress.done}/{c.progress.total} lessons
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-[#ff5734]" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {["KP", "MR", "SO"].map((init) => (
                      <span
                        key={init}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-[10px] font-bold text-[#151313] shadow-sm"
                      >
                        {init}
                      </span>
                    ))}
                    <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border-2 border-white bg-[#151313] px-2 text-[10px] font-bold text-white">
                      +12
                    </span>
                  </div>
                  <Link
                    href="/my-courses"
                    className="rounded-full bg-[#ff5734] px-4 py-2.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#e64a2e]"
                  >
                    Continue
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[1.75rem] border border-black/[0.06] bg-white px-5 py-4 shadow-sm">
            <h2 className="text-lg font-bold text-[#151313]">My next lessons</h2>
            <Link href="/my-courses" className="text-sm font-semibold text-[#ff5734] hover:underline">
              View all lessons
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-black/[0.06] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#151313]/45">
              <span>Lesson</span>
              <span className="hidden sm:block">Teacher</span>
              <span className="text-right">Duration</span>
            </div>
            <ul>
              {nextLessons.map((row) => (
                <li
                  key={row.lesson}
                  className="grid grid-cols-1 gap-2 border-b border-black/[0.04] px-5 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3"
                >
                  <div>
                    <p className="font-semibold text-[#151313]">{row.lesson}</p>
                    <p className="text-xs text-[#151313]/45">{row.course}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-start">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#be94f5]/30 text-xs font-bold text-[#151313]">
                      {row.teacher.charAt(0)}
                    </span>
                    <span className="text-sm text-[#151313]/75">{row.teacher}</span>
                  </div>
                  <p className="text-sm font-medium text-[#151313]/60 sm:text-right">{row.duration}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="flex h-full min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-[#151313] p-6 text-white shadow-[0_20px_50px_-28px_rgba(21,19,19,0.85)]">
            <div>
              <span className="inline-block rounded-full bg-[#fccc42] px-3 py-1 text-xs font-bold text-[#151313]">
                Spotlight
              </span>
              <h2 className="mt-4 text-xl font-bold leading-snug">
                Microsoft Future Ready: fundamentals of big data
              </h2>
              <p className="mt-2 text-sm text-white/55">New course matching your interests — placeholder copy.</p>
            </div>
            <div className="mt-8">
              <div className="flex -space-x-2">
                {["A", "B", "C"].map((x) => (
                  <span
                    key={x}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#151313] bg-[#be94f5] text-xs font-bold text-[#151313]"
                  >
                    {x}
                  </span>
                ))}
                <span className="inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full border-2 border-[#151313] bg-white/10 px-2 text-xs font-bold">
                  +100
                </span>
              </div>
              <Link
                href="/my-courses"
                className="mt-6 block w-full rounded-2xl bg-[#ff5734] py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#e64a2e]"
              >
                More details
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#151313]">Build checklist</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#151313]/70">
          <li>
            Apply migrations in <code className="rounded-md bg-[#f7f7f5] px-1.5 font-mono text-xs">supabase/migrations</code>{" "}
            (see <code className="font-mono text-xs">docs/LOCAL_SETUP.md</code>).
          </li>
          <li>
            Enrolled courses will live at{" "}
            <Link href="/my-courses" className="font-semibold text-[#ff5734] hover:underline">
              /my-courses
            </Link>
            ; public catalog can use <code className="font-mono text-xs">/courses</code> later.
          </li>
          <li>Wire real progress, search, and notifications to Supabase when schemas are ready.</li>
        </ul>
      </section>
    </div>
  );
}
