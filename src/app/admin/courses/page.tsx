import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Courses — Admin — COGNARA™" };

const courses = [
  { title: "Python for Beginners", coach: "Demo Coach", students: 124, status: "published", featured: true, category: "Programming" },
  { title: "Web Dev with React", coach: "Demo Coach", students: 89, status: "published", featured: false, category: "Web Dev" },
  { title: "Data Science Fundamentals", coach: "Demo Coach", students: 45, status: "draft", featured: false, category: "Data Science" },
  { title: "Suspicious Course Title", coach: "Flagged User", students: 2, status: "flagged", featured: false, category: "Other" },
];

export default function AdminCoursesPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-white">Course Management</h1>
        <p className="mt-1 text-sm text-neutral-400">{courses.length} total courses</p>
      </section>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111112]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Coach</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Students</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {courses.map((c, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-white">{c.title}</p>
                      <p className="text-xs text-neutral-500">{c.category}{c.featured ? " · ⭐ Featured" : ""}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-300">{c.coach}</td>
                  <td className="px-4 py-3.5 text-neutral-300">{c.students}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={c.status === "published" ? "success" : c.status === "flagged" ? "danger" : "warning"} dot>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 flex gap-1.5">
                    <button className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/15">View</button>
                    {c.featured ? (
                      <button className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-[10px] font-bold text-amber-400 hover:bg-amber-500/25">Unfeature</button>
                    ) : (
                      <button className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/25">Feature</button>
                    )}
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
