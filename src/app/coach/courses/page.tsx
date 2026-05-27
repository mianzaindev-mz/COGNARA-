import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

import { IconBook } from "@/components/ui/icons";
import { CreateCourseButton } from "@/components/coach/create-course-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Courses — Coach — COGNARA™" };

export default async function CoachCoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params?.search?.trim() ?? "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch courses created by this coach
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, description, category, difficulty, price_usd, is_published, total_lessons, total_enrolled, avg_rating, created_at")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const list = (courses ?? []).filter((course: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [course.title, course.description, course.category, course.difficulty]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });
  const publishedCount = list.filter((c: any) => c.is_published).length;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">My Courses</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">
            {list.length} courses · {publishedCount} published{search ? ` matching "${search}"` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/coach/course-builder"
            className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-xs font-bold text-violet-500 hover:bg-violet-500 hover:text-white transition"
          >
            ✨ 3D Pathway Workspace
          </Link>
          <CreateCourseButton />
        </div>
      </section>

      <section className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">New 3D pathway editor online</h4>
          <p className="text-xs text-cn-ink-muted mt-0.5">Visually position chapter platforms, configure locks, and drag-and-drop lesson blocks in real-time game space.</p>
        </div>
        <Link
          href="/coach/course-builder"
          className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-violet-700 transition"
        >
          Launch Builder
        </Link>
      </section>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconBook className="h-6 w-6" />
          <h2 className="text-lg font-bold text-cn-ink">No courses yet</h2>
          <p className="mt-1 text-sm text-cn-ink-muted max-w-sm">Create your first course to start teaching on COGNARA.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {list.map((course: any) => {
            const price = Number(course.price_usd) || 0;
            const rating = Number(course.avg_rating) || 0;
            const enrolled = course.total_enrolled ?? 0;
            const lessons = course.total_lessons ?? 0;
            const status = course.is_published ? "published" : "draft";

            // Category-based gradient
            const catGradients: Record<string, string> = {
              "Computer Science": "from-indigo-600/90 to-violet-700/80",
              "Data Science": "from-emerald-600/90 to-teal-700/80",
              "Marketing": "from-pink-600/90 to-rose-700/80",
              "Design": "from-fuchsia-600/90 to-purple-700/80",
              "Business": "from-amber-600/90 to-orange-700/80",
              "Psychology": "from-cyan-600/90 to-sky-700/80",
            };
            const gradient = catGradients[course.category ?? ""] || "from-slate-600/90 to-gray-700/80";

            // Difficulty styling
            const diffStyles: Record<string, string> = {
              beginner: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
              intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
              advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30",
            };
            const diffClass = diffStyles[course.difficulty] || diffStyles.beginner;

            return (
              <div key={course.id} className="cn-card-lift group relative overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-sm transition-all hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-500/20 dark:border-[#2e2a2a] dark:bg-[#1a1818]">
                {/* Gradient header */}
                <div className={`relative h-24 bg-gradient-to-br ${gradient} overflow-hidden`}>
                  <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* Status pill */}
                  <div className="absolute top-3 left-3">
                    <Badge variant={status === "published" ? "success" : "warning"} dot>{status}</Badge>
                  </div>
                  {/* Difficulty pill */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm ${diffClass}`}>
                      {course.difficulty ?? "beginner"}
                    </span>
                  </div>
                  {/* Price */}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-sm font-bold text-white/90 backdrop-blur-sm bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                      {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{course.category ?? "Uncategorized"}</span>
                  <h3 className="mt-1.5 text-base font-bold text-cn-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors dark:text-white line-clamp-1">{course.title}</h3>

                  {course.description && (
                    <p className="mt-2 text-xs text-cn-ink-muted line-clamp-2 leading-relaxed">{course.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="rounded-xl bg-cn-canvas dark:bg-[#0f0e0e] p-2.5 text-center border border-cn-border/50 dark:border-[#2a2626]">
                      <p className="text-lg font-bold text-cn-ink dark:text-white">{enrolled}</p>
                      <p className="text-[9px] text-cn-ink-subtle uppercase tracking-wider font-bold">students</p>
                    </div>
                    <div className="rounded-xl bg-cn-canvas dark:bg-[#0f0e0e] p-2.5 text-center border border-cn-border/50 dark:border-[#2a2626]">
                      <p className="text-lg font-bold text-cn-ink dark:text-white">{lessons}</p>
                      <p className="text-[9px] text-cn-ink-subtle uppercase tracking-wider font-bold">lessons</p>
                    </div>
                    <div className="rounded-xl bg-cn-canvas dark:bg-[#0f0e0e] p-2.5 text-center border border-cn-border/50 dark:border-[#2a2626]">
                      <p className="text-lg font-bold text-cn-ink dark:text-white">{rating > 0 ? `${rating.toFixed(1)}` : "—"}</p>
                      <p className="text-[9px] text-cn-ink-subtle uppercase tracking-wider font-bold">{rating > 0 ? "★ rating" : "rating"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-cn-border/50 dark:border-[#2a2626]">
                    <div className="flex items-center gap-3">
                      <Link href={`/coach/courses/${course.slug}`} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 hover:underline transition flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">settings</span>
                        Settings
                      </Link>
                      <Link href="/coach/course-builder" className="text-xs font-bold text-violet-500 hover:text-violet-600 hover:underline transition flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">view_in_ar</span>
                        3D Pathway
                      </Link>
                    </div>
                    <Link
                      href={`/coach/courses/${course.slug}`}
                      className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 hover:bg-indigo-500 hover:text-white transition"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
