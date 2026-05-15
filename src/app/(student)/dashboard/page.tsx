import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AgentQuickLaunch } from "@/components/student/agent-quick-launch";
import { CourseCard } from "@/components/student/course-card";
import { CourseFilterChips } from "@/components/student/course-filter-chips";
import { DashboardStatCard } from "@/components/student/dashboard-stat-card";
import { DatabaseStatusBanner } from "@/components/student/database-status-banner";
import { checkStudentDbHealth } from "@/lib/student/db-health";
import { loadStudentEnrollments } from "@/lib/student/enrollments";
import { loadStudentPortalStats } from "@/lib/student/portal-stats";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student dashboard — COGNARA™",
};

const filters = ["All courses", "Marketing", "Computer Science", "Psychology"] as const;

const demoCourses = [
  {
    title: "Creative writing for beginners",
    category: "Marketing",
    progressDone: 5,
    totalLessons: 20,
    slug: "creative-writing",
  },
  {
    title: "Digital illustration foundations",
    category: "Computer Science",
    progressDone: 3,
    totalLessons: 12,
    slug: "digital-illustration",
  },
  {
    title: "Public speaking & leadership",
    category: "Psychology",
    progressDone: 8,
    totalLessons: 24,
    slug: "public-speaking",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileRes, stats, health, enrollments, featured] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    loadStudentPortalStats(user.id),
    checkStudentDbHealth(user.id),
    loadStudentEnrollments(user.id),
    loadPublishedCourses(1),
  ]);

  const profile = profileRes.data;
  const firstName =
    profile?.full_name?.split(/\s+/)[0] || user.email?.split("@")[0] || "there";

  const creditLabel =
    stats.creditBalance !== null ? `${stats.creditBalance} credits` : "— credits";

  const enrolledLabel =
    stats.enrolledCourses > 0
      ? String(stats.enrolledCourses)
      : health.enrollmentsOk
        ? "0"
        : "—";

  const showDemo = enrollments.length === 0;
  const courseCards = showDemo
    ? demoCourses.map((c) => ({ ...c, href: `/learn/${c.slug}` }))
    : enrollments.slice(0, 3).map((c) => ({
        title: c.title,
        category: c.category,
        progressDone: c.progressDone,
        totalLessons: c.totalLessons,
        href: `/learn/${c.slug}`,
      }));

  const spotlight = featured[0];

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">
          Hi, {firstName} — here&apos;s your space
        </h1>
        <p className="mt-1 max-w-xl text-sm text-cn-ink-muted">
          {showDemo
            ? "Demo cards below — enroll via Supabase seed or your catalog to see live progress."
            : "Your enrolled courses and stats are synced from Supabase."}
          {profile?.role ? (
            <span className="ml-1 rounded-full bg-cn-ink/10 px-2 py-0.5 text-xs font-medium text-cn-ink-muted">
              {profile.role}
            </span>
          ) : null}
        </p>
      </section>

      <DatabaseStatusBanner health={health} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Enrolled"
          value={enrolledLabel}
          hint={stats.enrolledCourses === 0 ? "Browse catalog" : "Active courses"}
          accent="orange"
        />
        <DashboardStatCard
          label="Completed"
          value={String(stats.completedCourses)}
          hint="Certificates unlock here"
          accent="lavender"
        />
        <DashboardStatCard
          label="Streak"
          value={`${stats.streakDays}d`}
          hint={`Level ${stats.level} · ${stats.totalXp} XP`}
          accent="yellow"
        />
        <DashboardStatCard
          label="AI credits"
          value={stats.creditBalance !== null ? String(stats.creditBalance) : "—"}
          hint="Top up in billing"
        />
      </section>

      <AgentQuickLaunch creditLabel={creditLabel} />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-cn-ink">My courses</h2>
          <Link href="/my-courses" className="text-sm font-semibold text-cn-orange hover:underline">
            View all
          </Link>
        </div>
        {showDemo ? (
          <div className="mt-4">
            <CourseFilterChips filters={filters} />
          </div>
        ) : null}
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          {courseCards.map((c) => (
            <li key={c.href}>
              <CourseCard
                title={c.title}
                category={c.category}
                progressDone={c.progressDone}
                totalLessons={c.totalLessons}
                href={c.href}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="cn-card flex flex-wrap items-center justify-between gap-2 px-5 py-4">
            <h2 className="text-lg font-bold text-cn-ink">My next lessons</h2>
            <Link href="/my-courses" className="text-sm font-semibold text-cn-orange hover:underline">
              View all lessons
            </Link>
          </div>
          <div className="cn-card mt-3 overflow-hidden p-0">
            {enrollments.length > 0 ? (
              <ul>
                {enrollments.slice(0, 3).map((c) => (
                  <li
                    key={c.enrollmentId}
                    className="grid gap-2 border-b border-cn-border px-5 py-4 last:border-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-semibold text-cn-ink">{c.title}</p>
                      <p className="text-xs text-cn-ink-subtle">{c.progressPct}% complete</p>
                    </div>
                    <Link
                      href={`/learn/${c.slug}`}
                      className="text-sm font-semibold text-cn-orange hover:underline sm:text-right"
                    >
                      Continue →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-cn-ink-muted">
                Enroll in a course to see upcoming lessons here.
              </p>
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="flex h-full min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-cn-sidebar p-6 text-white shadow-[var(--cn-shadow-card)]">
            <div>
              <span className="inline-block rounded-full bg-cn-yellow px-3 py-1 text-xs font-bold text-cn-sidebar">
                Spotlight
              </span>
              <h2 className="mt-4 text-xl font-bold leading-snug">
                {spotlight?.title ?? "Microsoft Future Ready: fundamentals of big data"}
              </h2>
              <p className="mt-2 text-sm text-white/55">
                {spotlight?.description ?? "Featured course from your published catalog when seeded."}
              </p>
            </div>
            <Link
              href={spotlight ? "/courses" : "/courses"}
              className="mt-6 block w-full rounded-2xl bg-cn-orange py-3.5 text-center text-sm font-bold text-white transition hover:bg-cn-orange-hover"
            >
              More details
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
