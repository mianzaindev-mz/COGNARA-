import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardStatCard } from "@/components/student/dashboard-stat-card";
import { loadStudentEnrollments } from "@/lib/student/enrollments";
import { loadStudentPortalStats } from "@/lib/student/portal-stats";
import { IconFire, IconTrophy, IconBrain, IconGamepad } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Progress — COGNARA™",
};

/* Demo weekly XP data */
const WEEKLY_XP = [
  { day: "Mon", xp: 45 },
  { day: "Tue", xp: 80 },
  { day: "Wed", xp: 30 },
  { day: "Thu", xp: 120 },
  { day: "Fri", xp: 65 },
  { day: "Sat", xp: 15 },
  { day: "Sun", xp: 90 },
];

const STREAK_GRID = Array.from({ length: 28 }, (_, i) => ({
  day: i + 1,
  active: [1, 2, 3, 5, 6, 7, 8, 10, 11, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28].includes(i + 1),
}));



export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [stats, enrollments] = await Promise.all([
    loadStudentPortalStats(user.id),
    loadStudentEnrollments(user.id),
  ]);

  const maxXp = Math.max(...WEEKLY_XP.map((d) => d.xp));

  const dynamicBadges = stats.earnedBadges.map((eb) => {
    const icon = IconTrophy;
    const title = `${eb.courses?.title || "Course"} (${eb.badge_type.charAt(0).toUpperCase() + eb.badge_type.slice(1)})`;
    return { icon, title, earned: true };
  });

  const allBadges = [
    { icon: IconFire, title: "7-Day Streak", earned: stats.streakDays >= 7 },
    { icon: IconTrophy, title: "First Course Done", earned: stats.completedCourses >= 1 },
    { icon: IconBrain, title: "Level 5 Reached", earned: stats.level >= 5 },
    ...dynamicBadges,
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">My Progress</h1>
        <p className="mt-0.5 text-sm text-cn-ink-muted">
          Track your learning journey — XP, streaks, badges, and course completion.
        </p>
      </header>

      {/* Stats row */}
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
          hint="Certificate eligible"
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
          hint={`Next level: ${stats.level * 100} XP`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* XP Chart */}
        <section className="cn-card-lift rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)]">
          <h2 className="mb-4 text-sm font-bold text-cn-ink">Weekly XP</h2>
          <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
            {WEEKLY_XP.map((d) => {
              const pct = maxXp > 0 ? (d.xp / maxXp) * 100 : 0;
              const isTop = d.xp === maxXp;
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold tabular-nums text-cn-ink-subtle">
                    {d.xp}
                  </span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isTop
                        ? "bg-gradient-to-t from-cn-orange to-cn-pink"
                        : "bg-cn-orange/30"
                    }`}
                    style={{ height: `${Math.max(8, pct)}%` }}
                  />
                  <span className="text-[11px] font-semibold text-cn-ink-muted">{d.day}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Streak Grid */}
        <section className="cn-card-lift rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-cn-ink">28-Day Streak Map</h2>
            <span className="rounded-full bg-cn-orange/10 px-2.5 py-0.5 text-xs font-bold text-cn-orange">
              {STREAK_GRID.filter((d) => d.active).length} days
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {STREAK_GRID.map((d) => (
              <div
                key={d.day}
                title={`Day ${d.day}: ${d.active ? "Active" : "Missed"}`}
                className={`flex h-8 w-full items-center justify-center rounded-lg text-[10px] font-bold transition ${
                  d.active
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-cn-border/30 text-cn-ink-subtle/50"
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Badges */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-cn-ink">Badges &amp; Achievements</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {allBadges.map((b) => (
            <div
              key={b.title}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                b.earned
                  ? "border-cn-yellow/30 bg-cn-yellow/5 shadow-sm"
                  : "border-cn-border bg-cn-surface opacity-50"
              }`}
            >
              <b.icon className={`h-6 w-6 ${b.earned ? "text-cn-orange" : "text-cn-ink-subtle"}`} />
              <span className="mt-2 text-xs font-bold text-cn-ink">{b.title}</span>
              <span className={`mt-0.5 text-[10px] ${b.earned ? "text-emerald-500" : "text-cn-ink-subtle"}`}>
                {b.earned ? "Earned ✓" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Level progress */}
      <section className="cn-card-lift rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-cn-ink">Level {stats.level}</h2>
            <p className="text-xs text-cn-ink-muted">
              {stats.totalXp} / {stats.level * 100} XP to Level {stats.level + 1}
            </p>
          </div>
          <IconGamepad className="h-7 w-7 text-cn-orange" />
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-cn-border/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cn-orange via-cn-pink to-cn-lavender transition-all"
            style={{ width: `${Math.min(100, (stats.totalXp / (stats.level * 100)) * 100)}%` }}
          />
        </div>
      </section>

      {/* Course breakdown */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-cn-ink">Course Breakdown</h2>
        {enrollments.length === 0 ? (
          <div className="cn-callout p-6 text-center">
            <p className="font-semibold text-cn-ink">No courses yet</p>
            <p className="mt-1 text-sm text-cn-ink-muted">
              Enroll from the catalog to track your progress here.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-flex rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {enrollments.map((c) => (
              <div key={c.enrollmentId} className="cn-card-lift rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-[var(--cn-shadow-card)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-cn-ink">{c.title}</p>
                    <p className="text-xs text-cn-ink-subtle">
                      {c.progressDone}/{c.totalLessons} lessons · {c.progressPct}%
                      {c.completedAt ? " · ✓ Complete" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/learn/${c.slug}`}
                    className="rounded-xl bg-cn-orange/10 px-3 py-1.5 text-xs font-bold text-cn-orange transition hover:bg-cn-orange/20"
                  >
                    Continue →
                  </Link>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cn-border/50">
                  <div
                    className={`h-full rounded-full transition-all ${
                      c.progressPct === 100
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : "bg-gradient-to-r from-cn-orange to-cn-pink"
                    }`}
                    style={{ width: `${c.progressPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
