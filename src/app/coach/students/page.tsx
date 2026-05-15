import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export const metadata: Metadata = { title: "My Students — Coach — COGNARA™" };

const students = [
  { name: "Ahmed Raza", email: "ahmed@example.com", course: "Python for Beginners", progress: 85, lastActive: "2h ago", score: 92, status: "active" as const },
  { name: "Sara Malik", email: "sara@example.com", course: "Web Dev with React", progress: 62, lastActive: "1d ago", score: 78, status: "active" as const },
  { name: "Bilal Khan", email: "bilal@example.com", course: "Python for Beginners", progress: 45, lastActive: "3d ago", score: 65, status: "inactive" as const },
  { name: "Fatima Noor", email: "fatima@example.com", course: "Data Science", progress: 95, lastActive: "5m ago", score: 98, status: "active" as const },
  { name: "Usman Ali", email: "usman@example.com", course: "Web Dev with React", progress: 30, lastActive: "1w ago", score: 55, status: "at-risk" as const },
  { name: "Ayesha Syed", email: "ayesha@example.com", course: "Python for Beginners", progress: 100, lastActive: "1h ago", score: 88, status: "completed" as const },
];

const statusVariant: Record<string, "success" | "warning" | "danger" | "info"> = {
  active: "success",
  inactive: "warning",
  "at-risk": "danger",
  completed: "info",
};

export default function CoachStudentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">My Students</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">{students.length} total · {students.filter(s => s.status === "active").length} active this month</p>
        </div>
        <button className="rounded-xl border border-cn-border bg-cn-surface px-4 py-2 text-sm font-semibold text-cn-ink transition hover:bg-cn-canvas">
          Export CSV
        </button>
      </section>

      <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cn-border bg-cn-canvas/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Last Active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cn-border">
              {students.map((s, i) => (
                <tr key={i} className="transition-colors hover:bg-cn-canvas/60 cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {s.name.split(" ").map(w => w[0]).join("")}
                      </span>
                      <div>
                        <p className="font-semibold text-cn-ink">{s.name}</p>
                        <p className="text-xs text-cn-ink-subtle">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-cn-ink-muted">{s.course}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <ProgressBar value={s.progress} size="sm" color={s.progress >= 80 ? "emerald" : s.progress >= 50 ? "amber" : "rose"} />
                      <span className="text-xs font-semibold text-cn-ink-muted tabular-nums">{s.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-cn-ink">{s.score}%</td>
                  <td className="px-4 py-3.5 text-xs text-cn-ink-subtle">{s.lastActive}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statusVariant[s.status]} dot>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
