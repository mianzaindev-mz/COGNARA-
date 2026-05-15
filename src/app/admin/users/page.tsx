import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Users — Admin — COGNARA™" };

const users = [
  { name: "Ahmed Raza", email: "ahmed@example.com", role: "student", status: "active", joined: "Mar 12", courses: 3 },
  { name: "Sara Malik", email: "sara@example.com", role: "student", status: "active", joined: "Feb 28", courses: 2 },
  { name: "Demo Coach", email: "coach@demo.cognara.app", role: "coach", status: "active", joined: "Jan 1", courses: 4 },
  { name: "Bilal Khan", email: "bilal@example.com", role: "student", status: "banned", joined: "Apr 5", courses: 0 },
  { name: "Fatima Noor", email: "fatima@example.com", role: "student", status: "active", joined: "May 1", courses: 1 },
  { name: "Usman Ali", email: "usman@example.com", role: "coach", status: "pending", joined: "May 10", courses: 0 },
];

const roleVariant: Record<string, "indigo" | "success" | "danger"> = { student: "indigo", coach: "success", admin: "danger" };
const statusVariant: Record<string, "success" | "danger" | "warning"> = { active: "success", banned: "danger", pending: "warning" };

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Management</h1>
          <p className="mt-1 text-sm text-neutral-400">{users.length} total users</p>
        </div>
        <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
          Export CSV
        </button>
      </section>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111112]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Courses</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((u, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                        {u.name.split(" ").map(w => w[0]).join("")}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-xs text-neutral-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Badge variant={roleVariant[u.role] || "default"}>{u.role}</Badge></td>
                  <td className="px-4 py-3.5"><Badge variant={statusVariant[u.status] || "default"} dot>{u.status}</Badge></td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400">{u.joined}</td>
                  <td className="px-4 py-3.5 text-neutral-300">{u.courses}</td>
                  <td className="px-4 py-3.5">
                    <button className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/15">View</button>
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
