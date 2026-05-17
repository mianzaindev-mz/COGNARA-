import Link from "next/link";
import { LandingHeroVisual } from "@/components/public/landing-hero-visual";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";
import { CognaraLogo } from "@/components/shared/cognara-logo";

const stats = [
  { n: "01", label: "Years building", value: "2+", hint: "Product iterations" },
  { n: "02", label: "Course topics", value: "50+", hint: "When catalog is seeded" },
  { n: "03", label: "AI skills", value: "6", hint: "Tool-using agent" },
  { n: "04", label: "SDG aligned", value: "4", hint: "Quality education" },
] as const;

const paths = ["Computer Science", "Business", "Design", "Languages", "Data & AI"] as const;

const avatarColors = ["#e85d2a", "#7c6cf0", "#2a9d8f", "#f4a261"] as const;

const steps = [
  {
    title: "Discover your path",
    body: "Browse courses and filters — Learnify-style dashboard when you sign in.",
    emoji: "🎓",
  },
  {
    title: "Learn with structure",
    body: "Lessons, progress rings, and a curriculum sidebar for every course.",
    emoji: "📚",
  },
  {
    title: "Grow with the agent",
    body: "COGNARA tutor uses tools — debug, quiz, and voice — not generic chat.",
    emoji: "✨",
  },
] as const;

const cardTints = [
  "from-amber-100 to-amber-50 dark:from-amber-950/60 dark:to-amber-900/30 border-amber-200/50 dark:border-amber-700/40",
  "from-violet-100 to-violet-50 dark:from-violet-950/60 dark:to-violet-900/30 border-violet-200/50 dark:border-violet-700/40",
  "from-teal-100 to-teal-50 dark:from-teal-950/60 dark:to-teal-900/30 border-teal-200/50 dark:border-teal-700/40",
] as const;

export default async function HomePage() {
  const catalog = await loadPublishedCourses(3);

  return (
    <div className="bg-cn-cream">
      {/* Hero — split copy + visual */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-8 sm:pt-14 lg:pb-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <CognaraLogo variant="tagline" size={32} />
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-cn-ink sm:text-5xl sm:leading-[1.06] lg:text-[3.25rem]">
              Discover your ideal learning path —{" "}
              <span className="text-cn-orange">today.</span>
            </h1>
            <p className="cn-hero-lede mt-6 max-w-xl text-cn-ink-muted">
              Warm dashboards inspired by Learnify. Bold discovery flows inspired by EDUBRINK. One platform for
              students, coaches, and admins.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center rounded-full bg-cn-orange px-8 text-sm font-bold text-white shadow-lg shadow-cn-orange/30 transition hover:bg-cn-orange-hover"
              >
                Join now
              </Link>
              <Link
                href="/courses"
                className="inline-flex h-12 items-center rounded-full border-2 border-cn-border bg-cn-surface px-8 text-sm font-bold text-cn-ink transition hover:border-cn-orange/40 hover:text-cn-orange"
              >
                Learn more
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2" aria-hidden>
                {["A", "B", "C", "D"].map((initial, i) => (
                  <span
                    key={initial}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cn-cream text-xs font-bold text-white"
                    style={{ backgroundColor: avatarColors[i] }}
                  >
                    {initial}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-cn-ink">Trusted by learners & coaches</p>
                <p className="mt-0.5 text-xs text-cn-ink-subtle" aria-label="5 out of 5 stars">
                  <span className="text-cn-orange">★★★★★</span> 4.9 · early access cohort
                </p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {paths.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-cn-border bg-cn-surface px-3 py-1.5 text-xs font-semibold text-cn-ink-muted"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <LandingHeroVisual />
        </div>
      </section>

      {/* Stats — EDUBRINK */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <h2 className="text-center text-2xl font-bold text-cn-ink sm:text-3xl">Our impact at a glance</h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <li key={s.n} className="cn-card flex flex-col p-6">
              <span className="text-xs font-bold text-cn-orange">{s.n}</span>
              <p className="mt-3 text-3xl font-extrabold text-cn-ink">{s.value}</p>
              <p className="mt-1 text-sm font-semibold text-cn-ink">{s.label}</p>
              <p className="mt-1 text-xs text-cn-ink-subtle">{s.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Course preview — Learnify cards */}
      <section className="bg-cn-canvas py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cn-orange">My courses preview</p>
              <h2 className="mt-2 text-2xl font-bold text-cn-ink">Continue where you left off</h2>
            </div>
            <Link href="/courses" className="text-sm font-bold text-cn-orange hover:underline">
              View all courses →
            </Link>
          </div>

          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {(catalog.length > 0
              ? catalog.map((c, i) => ({
                  title: c.title,
                  category: c.category ?? "Course",
                  href: "/register",
                  tint: cardTints[i % cardTints.length],
                }))
              : [
                  {
                    title: "Creative Writing for Beginners",
                    category: "Marketing",
                    href: "/register",
                    tint: cardTints[0],
                  },
                  {
                    title: "Digital Illustration Foundations",
                    category: "Computer Science",
                    href: "/register",
                    tint: cardTints[1],
                  },
                  {
                    title: "Public Speaking & Leadership",
                    category: "Psychology",
                    href: "/register",
                    tint: cardTints[2],
                  },
                ]
            ).map((c) => (
              <li
                key={c.title}
                className={`flex min-h-[260px] flex-col rounded-[1.75rem] border bg-gradient-to-br p-6 shadow-[var(--cn-shadow-card)] ${c.tint}`}
              >
                <span className="w-fit rounded-full bg-cn-surface/80 px-3 py-1 text-xs font-bold text-cn-ink">
                  {c.category}
                </span>
                <h3 className="mt-4 flex-1 text-lg font-bold leading-snug text-cn-ink">{c.title}</h3>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/60">
                  <div className="h-full w-1/3 rounded-full bg-cn-orange" />
                </div>
                <Link
                  href={c.href}
                  className="mt-5 inline-flex w-full justify-center rounded-full bg-cn-orange py-3 text-sm font-bold text-white hover:bg-cn-orange-hover"
                >
                  Continue
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How we work */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <h2 className="text-2xl font-bold text-cn-ink">How COGNARA works 🧑‍🏫</h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.title} className="cn-card p-8">
              <span className="text-3xl" aria-hidden>
                {s.emoji}
              </span>
              <h3 className="mt-4 text-lg font-bold text-cn-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cn-ink-muted">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA — Learnify spotlight */}
      <section className="mx-4 mb-16 sm:mx-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-[2rem] bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 px-8 py-12 text-center text-white dark:from-cn-sidebar dark:via-cn-sidebar dark:to-cn-sidebar sm:flex-row sm:text-left">
          <div>
            <span className="rounded-full bg-cn-yellow px-3 py-1 text-xs font-bold text-cn-sidebar">
              New on COGNARA
            </span>
            <h2 className="mt-4 text-2xl font-bold">Ready for your student dashboard?</h2>
            <p className="mt-2 max-w-md text-sm text-white/55">
              Dark sidebar, warm canvas, filter chips, and live stats — sign in to see the full Learnify experience.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-2xl bg-cn-orange px-8 py-4 text-sm font-bold text-white hover:bg-cn-orange-hover"
          >
            Sign in to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
