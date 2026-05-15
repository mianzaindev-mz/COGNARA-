import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardStatCard } from "@/components/student/dashboard-stat-card";
import { loadStudentEnrollments } from "@/lib/student/enrollments";
import { loadStudentPortalStats } from "@/lib/student/portal-stats";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [stats, enrollments] = await Promise.all([
    loadStudentPortalStats(user.id),
    loadStudentEnrollments(user.id),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cn-orange">Progress</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">My progress</h1>
        <p className="mt-2 max-w-xl text-sm text-cn-ink-muted">
          Completion syncs from lesson marks — charts and certificates expand in a later milestone.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Enrolled"
          value={String(stats.enrolledCourses)}
          hint="Active courses"
          accent="orange"
        />
        <DashboardStatCard
          label="Completed"
          value={String(stats.completedCourses)}
          hint="100% progress"
          accent="lavender"
        />
        <DashboardStatCard
          label="Streak"
          value={`${stats.streakDays}d`}
          hint={`Level ${stats.level}`}
          accent="yellow"
        />
        <DashboardStatCard
          label="Total XP"
          value={String(stats.totalXp)}
          hint="Gamification"
        />
      </section>

      <section>
        <h2 className="text-lg font-bold text-cn-ink">Course breakdown</h2>
        {enrollments.length === 0 ? (
          <div className="cn-callout mt-6 p-6">
            <p className="font-semibold text-cn-ink">No progress yet</p>
            <p className="mt-2 text-sm text-cn-ink-muted">
              Enroll from the catalog and mark lessons complete to see bars here.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-flex rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {enrollments.map((c) => (
              <li key={c.enrollmentId} className="cn-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-cn-ink">{c.title}</p>
                    <p className="text-xs text-cn-ink-subtle">
                      {c.progressDone}/{c.totalLessons} lessons · {c.progressPct}%
                      {c.completedAt ? " · Certificate eligible" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/learn/${c.slug}`}
                    className="text-sm font-semibold text-cn-orange hover:underline"
                  >
                    Continue →
                  </Link>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-cn-canvas">
                  <div
                    className="h-full rounded-full bg-cn-orange transition-all"
                    style={{ width: `${c.progressPct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
