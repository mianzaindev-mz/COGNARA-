import Link from "next/link";
import { getCourseCardStyle, getDifficultyStyle } from "@/lib/student/course-styles";
import { IconBook, IconMap, IconTarget } from "@/components/ui/icons";

export type CourseCardProps = {
  title: string;
  category: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  thumbnailUrl?: string | null;
  progressDone: number;
  totalLessons: number;
  totalMins?: number;
  enrolledCount?: number;
  href: string;
  compact?: boolean;
};

export function CourseCard({
  title,
  category,
  difficulty,
  thumbnailUrl,
  progressDone,
  totalLessons,
  totalMins,
  enrolledCount,
  href,
  compact = false,
}: CourseCardProps) {
  const { tint, badge } = getCourseCardStyle(category);
  const diff = getDifficultyStyle(difficulty);
  const pct = totalLessons > 0 ? Math.round((100 * progressDone) / totalLessons) : 0;
  const isComplete = pct >= 100;

  // Estimated time remaining
  const remainingLessons = totalLessons - progressDone;
  const avgMinsPerLesson = totalMins && totalLessons > 0 ? totalMins / totalLessons : 0;
  const remainingMins = Math.round(remainingLessons * avgMinsPerLesson);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border shadow-[var(--cn-shadow-card)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl ${tint} ${compact ? "" : "min-h-[360px]"}`}
    >
      {/* ── Thumbnail / Gradient Hero ── */}
      <div className="relative h-40 overflow-hidden">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={`${title} thumbnail`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-cn-orange/20 via-cn-lavender/15 to-cn-yellow/20 dark:from-cn-orange/10 dark:via-cn-lavender/8 dark:to-transparent" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Top badges row */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${badge}`}>
            {category ?? "Course"}
          </span>
          {difficulty && (
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${diff.classes}`}>
              {diff.icon} {difficulty}
            </span>
          )}
        </div>

        {/* Progress ring — bottom right of thumbnail */}
        <div className="absolute bottom-3 right-3">
          <ProgressRing pct={pct} size={44} />
        </div>

        {/* Completion badge */}
        {isComplete && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Complete
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="relative flex flex-1 flex-col p-5">
        {/* Glow effect on hover */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cn-orange/8 blur-2xl transition-transform duration-500 group-hover:scale-150" />

        {/* Title */}
        <h3 className="relative text-[17px] font-extrabold leading-snug tracking-tight text-cn-ink dark:text-white">
          {title}
        </h3>

        {/* Stats row */}
        <div className="relative mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-cn-ink-subtle">
          <span className="flex items-center gap-1">
            <IconBook className="h-3.5 w-3.5 text-cn-orange/70" />
            {totalLessons} lessons
          </span>
          {totalMins && totalMins > 0 ? (
            <span className="flex items-center gap-1">
              <ClockIcon />
              {totalMins >= 60 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` : `${totalMins}m`}
            </span>
          ) : null}
          {enrolledCount && enrolledCount > 0 ? (
            <span className="flex items-center gap-1">
              <UsersIcon />
              {enrolledCount}
            </span>
          ) : null}
        </div>

        {/* Progress bar + status */}
        <div className="relative mt-auto pt-5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-cn-ink-subtle">
              {progressDone}/{totalLessons} done
            </span>
            {remainingMins > 0 && !isComplete ? (
              <span className="text-cn-orange/80">
                ~{remainingMins >= 60 ? `${Math.floor(remainingMins / 60)}h ${remainingMins % 60}m` : `${remainingMins}m`} left
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cn-surface/70 ring-1 ring-cn-border/40 dark:bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-cn-orange to-cn-pink"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="relative mt-4 flex justify-end">
          <Link
            href={href}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
              isComplete
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-cn-orange hover:bg-cn-orange-hover"
            }`}
          >
            {isComplete ? "Review" : progressDone > 0 ? "Continue" : "Start"}
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ── Progress Ring ── */
function ProgressRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const isComplete = pct >= 100;

  return (
    <div className="relative backdrop-blur-md rounded-full bg-black/30 p-0.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={isComplete ? "#10b981" : "#ff5734"}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">
        {pct}%
      </span>
    </div>
  );
}

/* ── Small Icons ── */
function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-cn-ink-subtle/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-cn-ink-subtle/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
