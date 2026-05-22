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
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((course: any) => {
            const price = Number(course.price_usd) || 0;
            const rating = Number(course.avg_rating) || 0;
            const enrolled = course.total_enrolled ?? 0;
            const lessons = course.total_lessons ?? 0;
            const status = course.is_published ? "published" : "draft";

            return (
              <div key={course.id} className="cn-card-lift cn-card-shine group relative overflow-hidden rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{course.category ?? "Uncategorized"}</span>
                    <h3 className="mt-1 text-base font-bold text-cn-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                  </div>
                  <Badge variant={status === "published" ? "success" : "warning"} dot>{status}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-cn-canvas p-2.5 text-center">
                    <p className="text-lg font-bold text-cn-ink">{enrolled}</p>
                    <p className="text-[10px] text-cn-ink-subtle">students</p>
                  </div>
                  <div className="rounded-xl bg-cn-canvas p-2.5 text-center">
                    <p className="text-lg font-bold text-cn-ink">{lessons}</p>
                    <p className="text-[10px] text-cn-ink-subtle">lessons</p>
                  </div>
                  <div className="rounded-xl bg-cn-canvas p-2.5 text-center">
                    <p className="text-lg font-bold text-cn-ink">{rating > 0 ? `${rating.toFixed(1)} ★` : "—"}</p>
                    <p className="text-[10px] text-cn-ink-subtle">rating</p>
                  </div>
                </div>

                {course.description && (
                  <p className="mb-4 text-xs text-cn-ink-muted line-clamp-2">{course.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cn-ink">
                    {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link href="/coach/course-builder" className="text-xs font-semibold text-violet-500 hover:underline">
                      3D Pathway →
                    </Link>
                    <Link href={`/coach/courses/${course.slug}`} className="text-xs font-semibold text-indigo-500 hover:underline">
                      Settings →
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
