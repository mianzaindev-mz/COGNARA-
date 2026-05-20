"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { IconTicket } from "@/components/ui/icons";
import { getTickets, updateTicketStatus } from "./actions";

type TicketItem = {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  userName: string;
  userEmail: string;
};

const statusMap: Record<string, "danger" | "warning" | "success" | "indigo" | "default"> = {
  open: "danger",
  in_progress: "warning",
  ai_resolved: "indigo",
  resolved: "success",
  closed: "default"
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  ai_resolved: "AI resolved",
  resolved: "Resolved",
  closed: "Closed"
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    if (actioningId) return;
    setActioningId(ticketId);
    try {
      await updateTicketStatus(ticketId, newStatus);
      // Optimistic update
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(err.message || "Failed to update ticket status.");
    } finally {
      setActioningId(null);
    }
  };

  // Get unique categories for filters
  const categories = Array.from(new Set(tickets.map(t => t.category)));

  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
                          t.userName.toLowerCase().includes(search.toLowerCase()) ||
                          t.userEmail.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openCount = tickets.filter(t => t.status === "open").length;

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
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support Tickets</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">{openCount} open · {filtered.length} matching</p>
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
          placeholder="Search subject, user or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-cn-border bg-cn-canvas px-4 py-2 text-sm text-cn-ink placeholder-cn-ink-subtle focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-cn-border bg-cn-canvas px-3 py-2 text-sm text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="ai_resolved">AI Resolved</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-cn-border bg-cn-canvas px-3 py-2 text-sm text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconTicket className="h-6 w-6 text-cn-ink-subtle" />
          <h2 className="text-lg font-bold text-cn-ink mt-2">No tickets found</h2>
          <p className="mt-1 text-sm text-cn-ink-muted">Try modifying your filters or search criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cn-border bg-cn-canvas">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">User</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Manage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {filtered.map((t) => {
                  const ago = Math.round((Date.now() - new Date(t.createdAt).getTime()) / 3600000);
                  const timeStr = ago < 1 ? "Just now" : ago < 24 ? `${ago}h ago` : `${Math.round(ago / 24)}d ago`;
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-cn-canvas/50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-cn-ink truncate max-w-[260px]" title={t.subject}>
                          {t.subject}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-cn-ink">{t.userName}</p>
                          <p className="text-[10px] text-cn-ink-subtle">{t.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="default" size="sm">{t.category}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusMap[t.status] ?? "default"} size="sm" dot>
                          {statusLabel[t.status] ?? t.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-cn-ink-subtle">{timeStr}</td>
                      <td className="px-4 py-4 text-right">
                        <select
                          value={t.status}
                          disabled={actioningId === t.id}
                          onChange={(e) => handleStatusChange(t.id, e.target.value as any)}
                          className="rounded-lg border border-cn-border bg-cn-canvas px-2 py-1 text-xs font-semibold text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
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
