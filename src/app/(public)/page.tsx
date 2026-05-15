import Link from "next/link";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";

const stats = [
  { n: "01", label: "Years building", value: "2+", hint: "Product iterations" },
  { n: "02", label: "Course topics", value: "50+", hint: "When catalog is seeded" },
  { n: "03", label: "AI skills", value: "6", hint: "Tool-using agent" },
  { n: "04", label: "SDG aligned", value: "4", hint: "Quality education" },
] as const;

const paths = ["Computer Science", "Business", "Design", "Languages", "Data & AI"] as const;

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
  "from-[#fff4d6] to-[#ffe8b8] border-cn-yellow/40",
  "from-cn-lavender/40 to-cn-lavender/10 border-cn-lavender/35",
  "from-cn-sky/50 to-cn-sky/20 border-sky-200/50",
] as const;

export default async function HomePage() {
  const catalog = await loadPublishedCourses(3);

  return (
    <div className="bg-cn-cream">
      {/* Hero — EDUBRINK overlay + Learnify warmth */}
      <section className="relative mx-4 mt-4 overflow-hidden rounded-[2rem] sm:mx-8">
        <div
          className="absolute inset-0 bg-[#151313]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #151313 0%, #2a1f1a 40%, #ff5734 120%), radial-gradient(circle at 80% 20%, rgba(190,148,245,0.35), transparent 50%)",
          }}
        />
        <div className="cn-hero-gradient relative px-6 py-16 sm:px-14 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cn-yellow">COGNARA™ · SDG 4</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover your ideal learning path —{" "}
            <span className="text-cn-orange">today.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
            Warm dashboards inspired by Learnify. Bold discovery flows inspired by EDUBRINK. One platform for
            students, coaches, and admins.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-full bg-cn-orange px-8 text-sm font-bold text-white shadow-lg shadow-cn-orange/30 transition hover:bg-cn-orange-hover"
            >
              Get started now
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-12 items-center rounded-full border border-white/25 bg-white/10 px-8 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Browse courses
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            {paths.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90"
              >
                {p}
              </span>
            ))}
          </div>
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-[2rem] bg-cn-sidebar px-8 py-12 text-center text-white sm:flex-row sm:text-left">
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
