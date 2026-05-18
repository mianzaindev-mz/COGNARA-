import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconUsers } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Students — Coach — COGNARA™" };

export default async function CoachStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get all courses by this coach
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("coach_id", user.id);

  const courseIds = (courses ?? []).map(c => c.id);
  const courseMap = Object.fromEntries((courses ?? []).map(c => [c.id, c.title]));

  // Get enrollments for those courses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let enrollments: Array<{
    student_id: string;
    course_id: string;
    progress_pct: number;
    enrolled_at: string;
    profiles: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
  }> = [];

  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select("student_id, course_id, progress_pct, enrolled_at, profiles!enrollments_student_id_fkey(full_name, email, avatar_url)")
      .in("course_id", courseIds)
      .order("enrolled_at", { ascending: false })
      .limit(50);
    enrollments = (data as unknown as typeof enrollments) ?? [];
  }

  const totalStudents = new Set(enrollments.map(e => e.student_id)).size;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Students</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">{totalStudents} unique students across {courseIds.length} courses</p>
        </div>
      </section>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconUsers className="h-6 w-6" />
          <h2 className="text-lg font-bold text-cn-ink">No students yet</h2>
          <p className="mt-1 text-sm text-cn-ink-muted max-w-sm">Students will appear here once they enroll in your courses.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-cn-border bg-cn-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cn-canvas/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Enrolled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {enrollments.map((e, i) => {
                  const profile = e.profiles;
                  const name = profile?.full_name || profile?.email?.split("@")[0] || "Student";
                  const initial = name.charAt(0).toUpperCase();
                  const progress = e.progress_pct ?? 0;
                  const enrolled = new Date(e.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  return (
                    <tr key={`${e.student_id}-${e.course_id}-${i}`} className="hover:bg-cn-canvas/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-500">{initial}</span>
                          <div>
                            <p className="font-semibold text-cn-ink">{name}</p>
                            <p className="text-[10px] text-cn-ink-subtle">{profile?.email ?? ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-cn-ink-muted">{courseMap[e.course_id] ?? "Unknown"}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-cn-border overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-cn-ink-muted tabular-nums">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-cn-ink-muted">{enrolled}</td>
                      <td className="px-4 py-4">
                        <Badge variant={progress >= 100 ? "success" : progress > 0 ? "warning" : "default"} size="sm">
                          {progress >= 100 ? "Completed" : progress > 0 ? "In progress" : "Enrolled"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
