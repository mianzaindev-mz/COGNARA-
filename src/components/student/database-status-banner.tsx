import Link from "next/link";
import type { StudentDbHealth } from "@/lib/student/db-health";

type DatabaseStatusBannerProps = {
  health: StudentDbHealth;
};

export function DatabaseStatusBanner({ health }: DatabaseStatusBannerProps) {
  if (!health.message) {
    return (
      <div className="rounded-[1.35rem] border border-emerald-200/80 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-950">
        <p className="font-semibold">Database connected</p>
        <p className="mt-1 text-emerald-900/75">
          Profile {health.profileOk ? "✓" : "—"} · Settings {health.settingsOk ? "✓" : "—"} · Credits table{" "}
          {health.creditsOk ? "reachable" : "—"} · Enrollments {health.enrollmentsOk ? "reachable" : "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.35rem] border border-amber-200/90 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-semibold">Database setup needed</p>
      <p className="mt-1 leading-relaxed text-amber-900/85">{health.message}</p>
      <Link
        href="/setup"
        className="mt-3 inline-flex rounded-full bg-cn-orange px-4 py-2 text-xs font-bold text-white transition hover:bg-cn-orange-hover"
      >
        Open setup guide
      </Link>
    </div>
  );
}
