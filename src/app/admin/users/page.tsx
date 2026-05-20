"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { IconUsers } from "@/components/ui/icons";
import { getUsersWithEmails, updateUserRole, banUser } from "./actions";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  banReason: string;
  joined: string;
};

const statusVariant: Record<string, "success" | "danger"> = {
  active: "success",
  banned: "danger"
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Ban Modal State
  const [banTarget, setBanTarget] = useState<UserItem | null>(null);
  const [banReasonInput, setBanReasonInput] = useState("");

  const fetchUsers = async () => {
    try {
      const data = await getUsersWithEmails();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "student" | "coach" | "admin") => {
    if (actioningId) return;
    setActioningId(userId);
    try {
      await updateUserRole(userId, newRole);
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message || "Failed to update user role.");
    } finally {
      setActioningId(null);
    }
  };

  const handleOpenBanModal = (user: UserItem) => {
    setBanTarget(user);
    setBanReasonInput("");
  };

  const handleConfirmBan = async () => {
    if (!banTarget || actioningId) return;
    setActioningId(banTarget.id);
    try {
      await banUser(banTarget.id, true, banReasonInput);
      setUsers(prev => prev.map(u => u.id === banTarget.id ? { ...u, status: "banned", banReason: banReasonInput || "Suspended by administrator." } : u));
      setBanTarget(null);
    } catch (err: any) {
      alert(err.message || "Failed to suspend user.");
    } finally {
      setActioningId(null);
    }
  };

  const handleUnban = async (user: UserItem) => {
    if (actioningId) return;
    if (!confirm(`Are you sure you want to lift the suspension for ${user.name}?`)) return;

    setActioningId(user.id);
    try {
      await banUser(user.id, false);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "active", banReason: "" } : u));
    } catch (err: any) {
      alert(err.message || "Failed to lift suspension.");
    } finally {
      setActioningId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-cn-surface rounded-xl border border-cn-border dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
        <div className="h-12 w-full bg-cn-surface rounded-xl border border-cn-border dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
        <div className="h-64 w-full bg-cn-surface rounded-2xl border border-cn-border dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">User Management</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">{filtered.length} matching of {users.length} total users</p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm font-semibold text-rose-500">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cn-border bg-cn-surface p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-cn-border bg-cn-canvas px-4 py-2 text-sm text-cn-ink placeholder-cn-ink-subtle focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-cn-border bg-cn-canvas px-3 py-2 text-sm text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-cn-border bg-cn-canvas px-3 py-2 text-sm text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="banned">Suspended</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconUsers className="h-6 w-6 text-cn-ink-subtle" />
          <h2 className="text-lg font-bold text-cn-ink mt-2">No users found</h2>
          <p className="mt-1 text-sm text-cn-ink-muted">Try modifying your filters or search criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cn-border bg-cn-canvas">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">User</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {filtered.map((u) => {
                  const initials = u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-cn-canvas/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-cn-ink truncate max-w-[180px]">{u.name}</p>
                            <p className="text-xs text-cn-ink-subtle truncate max-w-[180px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={u.role}
                          disabled={actioningId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                          className="rounded-lg border border-cn-border bg-cn-canvas px-2.5 py-1 text-xs font-semibold text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="student">Student</option>
                          <option value="coach">Coach</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5 items-start">
                          <Badge variant={statusVariant[u.status] || "default"} dot>{u.status}</Badge>
                          {u.status === "banned" && u.banReason && (
                            <span className="text-[10px] text-rose-500 max-w-[150px] truncate italic" title={u.banReason}>
                              {u.banReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-cn-ink-muted">{u.joined}</td>
                      <td className="px-4 py-4 text-right">
                        {u.status === "banned" ? (
                          <button
                            type="button"
                            disabled={!!actioningId}
                            onClick={() => handleUnban(u)}
                            className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!!actioningId}
                            onClick={() => handleOpenBanModal(u)}
                            className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/25 transition"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspension Ban Reason Modal */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-cn-ink mb-2">Suspend User Account</h3>
            <p className="text-xs text-cn-ink-muted mb-4 leading-relaxed">
              Are you sure you want to suspend <strong>{banTarget.name}</strong> ({banTarget.email})? They will immediately lose access to their learning workspace and coaching controls.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-cn-ink-subtle">Suspension Reason</label>
              <textarea
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="e.g. Policy violation, suspicious transactions, terms abuse..."
                rows={3}
                className="w-full rounded-xl border border-cn-border bg-cn-canvas p-3 text-sm text-cn-ink placeholder-cn-ink-subtle focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBanTarget(null)}
                className="rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-xs font-bold text-cn-ink hover:bg-cn-canvas-hover transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actioningId === banTarget.id}
                onClick={handleConfirmBan}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                {actioningId === banTarget.id ? "Processing..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
