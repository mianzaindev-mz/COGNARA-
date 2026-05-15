import type { Metadata } from "next";
import Link from "next/link";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";

export const metadata: Metadata = {
  title: "Browse courses — COGNARA™",
};

const demoCourses = [
  { title: "Creative writing for beginners", category: "Marketing", tint: "bg-[#fff4d6]" },
  { title: "Digital illustration foundations", category: "Computer Science", tint: "bg-[#ebe4ff]" },
  { title: "Public speaking & leadership", category: "Psychology", tint: "bg-[#e4f2ff]" },
] as const;

export default async function CoursesPage() {
  const courses = await loadPublishedCourses();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cn-orange">Catalog</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-cn-ink sm:text-4xl">Browse courses</h1>
        <p className="mt-3 text-cn-ink-muted">
          Published courses from Supabase when your project is connected. Demo cards show the Learnify card style until you seed data.
        </p>
      </div>

      {courses.length > 0 ? (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li
              key={c.id}
              className="cn-card flex flex-col p-6 transition hover:-translate-y-0.5"
            >
              <span className="w-fit rounded-full bg-cn-yellow/90 px-3 py-1 text-xs font-bold text-cn-sidebar">
                {c.category ?? "Course"}
              </span>
              <h2 className="mt-4 text-lg font-bold text-cn-ink">{c.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-cn-ink-muted">
                {c.description ?? "No description yet."}
              </p>
              <p className="mt-4 text-xs font-medium text-cn-ink-subtle">
                {c.total_lessons} lessons · {c.is_free ? "Free" : `$${c.price_usd}`}
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex rounded-full bg-cn-orange px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-cn-orange-hover"
              >
                Enroll
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-3">
          {demoCourses.map((c) => (
            <li key={c.title} className={`rounded-[1.75rem] border border-cn-border p-6 ${c.tint}`}>
              <span className="rounded-full bg-cn-surface/80 px-3 py-1 text-xs font-bold text-cn-ink">
                {c.category}
              </span>
              <h2 className="mt-4 text-lg font-bold text-cn-ink">{c.title}</h2>
              <p className="mt-2 text-sm text-cn-ink-muted">Connect Supabase and publish courses to replace these previews.</p>
              <Link
                href="/setup"
                className="mt-5 inline-flex rounded-full bg-cn-orange px-4 py-2.5 text-sm font-bold text-white"
              >
                Setup database
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
