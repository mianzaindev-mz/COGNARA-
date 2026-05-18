import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { IconBook } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Courses — Coach — COGNARA™" };

export default async function CoachCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch courses created by this coach
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, description, category, difficulty, price_usd, is_published, total_lessons, total_enrolled, avg_rating, created_at")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const list = courses ?? [];
  const publishedCount = list.filter(c => c.is_published).length;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">My Courses</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">{list.length} courses · {publishedCount} published</p>
        </div>
        <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 hover:shadow-lg">
          + Create Course
        </button>
      </section>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconBook className="h-6 w-6" />
          <h2 className="text-lg font-bold text-cn-ink">No courses yet</h2>
          <p className="mt-1 text-sm text-cn-ink-muted max-w-sm">Create your first course to start teaching on COGNARA.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map(course => {
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
                  <Link href={`/coach/courses/${course.slug}`} className="text-xs font-semibold text-indigo-500 hover:underline">
                    Edit course →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
