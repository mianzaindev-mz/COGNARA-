"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import Link from "next/link";

type BugReport = {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  category: "bug" | "abuse" | "content" | "fraud" | "security" | "legal" | "performance" | "feature_request";
  title: string;
  description: string;
  page_url: string | null;
  page_route: string | null;
  dom_selector: string | null;
  video_timestamp_secs: number | null;
  screenshot_url: string | null;
  screenshot_path: string | null;
  browser_info: any;
  reproduction_steps: string | null;
  ai_category: string | null;
  ai_severity: "S1" | "S2" | "S3" | "S4" | "S5" | null;
  ai_confidence: number | null;
  ai_validity: "valid" | "invalid" | "uncertain" | "duplicate" | null;
  ai_validity_reasoning: string | null;
  ai_recommended_action: string | null;
  ai_is_duplicate: boolean;
  ai_parent_report_id: string | null;
  ai_auto_resolved: boolean;
  ai_draft_reply: string | null;
  ai_tags: string[];
  ai_evaluated_at: string | null;
  status: "pending_triage" | "triaged" | "in_progress" | "resolved" | "closed" | "wont_fix" | "duplicate";
  assigned_to: string | null;
  priority: "low" | "normal" | "high" | "urgent" | "critical";
  resolution_note: string | null;
  created_at: string;
  reporter?: { full_name: string; username: string };
  reported?: { full_name: string; username: string };
};

export default function AdminBugsPage() {
  const { notify } = useToast();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [validities, setValidities] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"severity" | "newest" | "updated">("severity");

  // Detail Modal / Sidebar Actions state
  const [actionLoading, setActionLoading] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [draftReply, setDraftReply] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({
    totalOpen: 0,
    s1Critical: 0,
    resolvedToday: 0,
    validityRate: 100,
    autoResolved: 0,
  });

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
        calculateStats(data.reports || []);
      }
    } catch {
      notify({ title: "Load Error", description: "Could not retrieve reports from database.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      setDraftReply(selectedReport.ai_draft_reply || "");
      setResolutionNote(selectedReport.resolution_note || "");
    }
  }, [selectedReport]);

  const calculateStats = (list: BugReport[]) => {
    const totalOpen = list.filter(r => r.status === "pending_triage" || r.status === "in_progress" || r.status === "triaged").length;
    const s1Critical = list.filter(r => r.ai_severity === "S1" && r.status !== "resolved" && r.status !== "closed").length;
    
    // Graded reports stats
    const resolvedList = list.filter(r => r.status === "resolved" || r.status === "closed");
    const validCount = list.filter(r => r.ai_validity === "valid").length;
    const validityRate = list.length > 0 ? Math.round((validCount / list.length) * 100) : 100;
    const autoResolved = list.length > 0 ? Math.round((list.filter(r => r.ai_auto_resolved).length / list.length) * 100) : 0;

    setStats({
      totalOpen,
      s1Critical,
      resolvedToday: resolvedList.length,
      validityRate,
      autoResolved,
    });
  };

  // Sidebar toggling filters
  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  const toggleSeverity = (sev: string) => {
    setSeverities(prev => prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]);
  };
  const toggleValidity = (val: string) => {
    setValidities(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const toggleStatus = (st: string) => {
    setStatuses(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
  };

  const clearAllFilters = () => {
    setSearch("");
    setCategories([]);
    setSeverities([]);
    setValidities([]);
    setStatuses([]);
  };

  // Perform Update Patch Action
  const handleUpdateReport = async (reportId: string, payload: Record<string, any>, successMsg: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify({ title: "Success", description: successMsg, tone: "success" });
      
      // Update UI state
      const updatedList = reports.map(r => r.id === reportId ? { ...r, ...data.report } : r);
      setReports(updatedList);
      calculateStats(updatedList);

      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, ...data.report });
      }
    } catch (e: any) {
      notify({ title: "Action Failed", description: e.message || "Failed to update database report record.", tone: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = () => {
    if (!selectedReport) return;
    handleUpdateReport(
      selectedReport.id,
      { status: "resolved", resolution_note: resolutionNote },
      "Report marked resolved and timeline updated."
    );
  };

  const handleWontFix = () => {
    if (!selectedReport) return;
    handleUpdateReport(
      selectedReport.id,
      { status: "wont_fix", resolution_note: "Closed by administrator as Won't Fix." },
      "Report closed as Won't Fix."
    );
  };

  const handleAssignToMe = () => {
    if (!selectedReport) return;
    // Mock user session ID or system admin UUID
    const currentAdminId = "00000000-0000-0000-0000-000000000000";
    handleUpdateReport(
      selectedReport.id,
      { assigned_to: currentAdminId, status: "in_progress" },
      "You have assigned this report to yourself."
    );
  };

  const handleSendReply = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      // Mock sending notification or email out to user
      const supabase = (await import("@/lib/supabase/client")).createClient();
      if (supabase && selectedReport.reporter_id) {
        await supabase.from("notifications").insert({
          user_id: selectedReport.reporter_id,
          type: "system",
          title: "Admin Reply: Support Report",
          message: draftReply,
          is_read: false,
        });

        notify({ title: "Reply Sent", description: "AI draft reply dispatched to reporter's dashboard notifications.", tone: "success" });
      }
    } catch {
      notify({ title: "Send Failed", description: "Failed to dispatch reply message.", tone: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());

    const matchesCat = categories.length === 0 || categories.includes(r.category);
    const matchesSev = severities.length === 0 || (r.ai_severity && severities.includes(r.ai_severity));
    const matchesVal = validities.length === 0 || (r.ai_validity && validities.includes(r.ai_validity));
    const matchesStatus = statuses.length === 0 || statuses.includes(r.status);

    return matchesSearch && matchesCat && matchesSev && matchesVal && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // Severity-based sort: S1 > S2 > S3 > S4 > S5
    const severityWeight = { S1: 5, S2: 4, S3: 3, S4: 2, S5: 1 };
    const aWeight = a.ai_severity ? severityWeight[a.ai_severity] : 0;
    const bWeight = b.ai_severity ? severityWeight[b.ai_severity] : 0;
    return bWeight - aWeight;
  });

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-7xl h-full pb-8">
      {/* 1. Header Metrics Card Bar */}
      <section className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-500 animate-pulse text-[28px]">shield_heart</span>
          Trust, Safety & Bug Triage Command
        </h1>
        <p className="text-sm text-cn-ink-muted">AI-powered evaluations, exact location tracking, and administrative resolution workflows.</p>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="cn-card bg-cn-surface p-4 border border-cn-border rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Total Open</span>
          <span className="text-2xl font-bold text-cn-ink">{stats.totalOpen}</span>
        </div>
        <div className="cn-card bg-rose-500/10 p-4 border border-rose-500/20 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-rose-400">S1 Critical</span>
          <span className="text-2xl font-bold text-rose-500 animate-pulse">{stats.s1Critical}</span>
        </div>
        <div className="cn-card bg-green-500/10 p-4 border border-green-500/20 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-green-400">Resolved Today</span>
          <span className="text-2xl font-bold text-green-500">{stats.resolvedToday}</span>
        </div>
        <div className="cn-card bg-cn-surface p-4 border border-cn-border rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Validity Rate</span>
          <span className="text-2xl font-bold text-cn-ink">{stats.validityRate}%</span>
        </div>
        <div className="cn-card bg-cn-surface p-4 border border-cn-border rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">AI Auto-Resolved</span>
          <span className="text-2xl font-bold text-cn-ink">{stats.autoResolved}%</span>
        </div>
      </div>

      {/* 2. Three-Panel Dashboard Workspace */}
      <div className="flex gap-6 items-stretch flex-1 min-h-[550px] relative overflow-hidden">
        
        {/* LEFT PANEL — Filters (240px) */}
        <aside className="w-60 shrink-0 border border-cn-border bg-cn-surface p-5 rounded-2xl flex flex-col gap-5 overflow-y-auto max-h-[70vh] custom-scrollbar shadow-sm">
          <div className="flex justify-between items-center border-b border-cn-border pb-2">
            <span className="text-xs font-bold text-cn-ink uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              Filters
            </span>
            <button onClick={clearAllFilters} className="text-[10px] text-rose-500 font-bold hover:underline">Clear all</button>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-cn-ink-subtle uppercase">Search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query title/body..."
              className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500/40 text-cn-ink"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-cn-ink-subtle uppercase">Category</span>
            <div className="flex flex-col gap-1.5 text-xs text-cn-ink-subtle">
              {["bug", "abuse", "content", "fraud", "security", "legal", "performance", "feature_request"].map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer hover:text-cn-ink">
                  <input
                    type="checkbox"
                    checked={categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="accent-rose-500 rounded"
                  />
                  <span className="capitalize">{cat.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI Severities */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-cn-ink-subtle uppercase">AI Severity</span>
            <div className="flex flex-wrap gap-1.5">
              {["S1", "S2", "S3", "S4", "S5"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition duration-300 ${
                    severities.includes(sev)
                      ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25"
                      : "bg-cn-canvas border-cn-border text-cn-ink hover:bg-cn-border"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Validities */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-cn-ink-subtle uppercase">Triage Validity</span>
            <div className="flex flex-col gap-1.5 text-xs text-cn-ink-subtle">
              {["valid", "invalid", "uncertain", "duplicate"].map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer hover:text-cn-ink">
                  <input
                    type="checkbox"
                    checked={validities.includes(val)}
                    onChange={() => toggleValidity(val)}
                    className="accent-rose-500 rounded"
                  />
                  <span className="capitalize">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-cn-ink-subtle uppercase">Workflow Status</span>
            <div className="flex flex-col gap-1.5 text-xs text-cn-ink-subtle">
              {["pending_triage", "in_progress", "resolved", "wont_fix", "duplicate"].map((st) => (
                <label key={st} className="flex items-center gap-2 cursor-pointer hover:text-cn-ink">
                  <input
                    type="checkbox"
                    checked={statuses.includes(st)}
                    onChange={() => toggleStatus(st)}
                    className="accent-rose-500 rounded"
                  />
                  <span className="capitalize">{st.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER PANEL — Bug List */}
        <main className="flex-1 border border-cn-border bg-cn-surface rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <header className="px-5 py-3 border-b border-cn-border flex items-center justify-between">
              <span className="text-xs font-bold text-cn-ink uppercase">Report Queue ({filteredReports.length})</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-cn-ink-subtle">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-cn-canvas border border-cn-border rounded-lg px-2 py-1 outline-none text-cn-ink"
                >
                  <option value="severity">AI Severity</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </header>

            {loading ? (
              <div className="p-8 flex flex-col gap-3 items-center justify-center text-center">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500/20 border-t-rose-500" />
                <span className="text-xs text-cn-ink-subtle">Triage list indexing...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-cn-ink-subtle opacity-40">shield_check</span>
                <p className="text-sm font-bold text-cn-ink">All Clear! No alerts in queue.</p>
                <p className="text-xs text-cn-ink-subtle leading-relaxed">No reports match your selected filters. Adjust searches to review closed items.</p>
              </div>
            ) : (
              <div className="divide-y divide-cn-border max-h-[65vh] overflow-y-auto custom-scrollbar">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 flex flex-col gap-2 hover:bg-cn-canvas transition-colors cursor-pointer relative ${
                      selectedReport?.id === report.id ? "bg-cn-canvas" : ""
                    } ${
                      report.ai_severity === "S1" ? "border-l-4 border-l-rose-500" : report.ai_severity === "S2" ? "border-l-4 border-l-orange-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            report.ai_severity === "S1" ? "danger" : report.ai_severity === "S2" ? "warning" : "info"
                          }
                          size="sm"
                        >
                          {report.ai_severity || "Triage..."}
                        </Badge>
                        <h4 className="text-xs font-bold text-cn-ink line-clamp-1">{report.title}</h4>
                      </div>
                      <span className="text-[10px] text-cn-ink-subtle font-mono shrink-0">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-cn-ink-subtle line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] mt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-cn-ink-subtle uppercase font-semibold">{report.category}</span>
                        {report.ai_confidence !== null && (
                          <span className="text-cn-ink-subtle font-medium">Confidence: {report.ai_confidence}%</span>
                        )}
                      </div>
                      <Badge variant="outline" size="sm" className="capitalize">
                        {report.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL — Report Detail Drawer (400px) */}
        <aside className="w-[420px] shrink-0 border border-cn-border bg-cn-surface rounded-2xl overflow-y-auto max-h-[75vh] custom-scrollbar shadow-sm flex flex-col justify-between">
          {selectedReport ? (
            <div className="p-5 flex flex-col gap-5">
              
              {/* Report Header detail */}
              <div className="border-b border-cn-border pb-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-rose-500 font-mono">Report details</span>
                  <Badge variant={selectedReport.status === "resolved" ? "success" : "warning"} size="sm" className="capitalize">
                    {selectedReport.status.replace("_", " ")}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-cn-ink leading-snug">{selectedReport.title}</h3>
              </div>

              {/* Core Description content */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">User Description</span>
                <p className="text-xs text-cn-ink bg-cn-canvas p-3.5 rounded-xl border border-cn-border leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>

              {/* Reproduction steps if provided */}
              {selectedReport.reproduction_steps && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Reproduction Steps</span>
                  <p className="text-xs text-cn-ink bg-cn-canvas p-3.5 rounded-xl border border-cn-border leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                    {selectedReport.reproduction_steps}
                  </p>
                </div>
              )}

              {/* Exact Location Card */}
              <div className="rounded-xl border border-cn-border bg-cn-canvas p-4 flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">location_searching</span>
                  Capture Location data
                </span>
                
                {selectedReport.ai_tags && selectedReport.ai_tags.length > 0 && (
                  <p className="text-xs font-bold text-cn-ink">
                    {selectedReport.ai_tags.find(t => t.startsWith("📍")) || "📍 Exact URL is locked below."}
                  </p>
                )}

                <div className="flex flex-col gap-2 text-[10px] text-cn-ink-subtle pt-1 border-t border-cn-border/30">
                  <div className="flex justify-between items-center">
                    <span>Full Page URL:</span>
                    <a
                      href={selectedReport.page_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-rose-500 hover:underline max-w-[200px] truncate"
                    >
                      {selectedReport.page_url || "N/A"}
                    </a>
                  </div>
                  {selectedReport.dom_selector && (
                    <div className="flex justify-between items-center">
                      <span>DOM Selector:</span>
                      <code className="bg-cn-surface px-1 py-0.5 rounded text-rose-400 font-mono">{selectedReport.dom_selector}</code>
                    </div>
                  )}
                  {selectedReport.video_timestamp_secs !== null && (
                    <div className="flex justify-between items-center">
                      <span>Video Timestamp:</span>
                      <code className="bg-cn-surface px-1 py-0.5 rounded text-rose-400 font-mono">
                        {getFormattedTimestamp(selectedReport.video_timestamp_secs)}
                      </code>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-1">
                  <a
                    href={selectedReport.page_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-lg bg-cn-surface border border-cn-border text-center text-[10px] font-bold text-cn-ink hover:bg-cn-border transition"
                  >
                    Open Page
                  </a>
                  {selectedReport.screenshot_path && (
                    <a
                      href={`https://your-supabase-url.supabase.co/storage/v1/object/public/bug-screenshots/${selectedReport.screenshot_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 rounded-lg bg-cn-surface border border-cn-border text-center text-[10px] font-bold text-cn-ink hover:bg-cn-border transition"
                    >
                      Screenshot
                    </a>
                  )}
                </div>
              </div>

              {/* AI Evaluation Analysis Card */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  Lumina AI security & Validity review
                </span>

                <div className="grid grid-cols-2 gap-3 text-[10px] border-b border-rose-500/10 pb-3">
                  <div>
                    <span className="text-gray-400">Class validity:</span>
                    <Badge variant={selectedReport.ai_validity === "valid" ? "success" : "danger"} size="sm" className="capitalize block mt-0.5 w-fit">
                      {selectedReport.ai_validity || "triage..."}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-400">Triage Severity:</span>
                    <Badge variant="outline" size="sm" className="block mt-0.5 w-fit">
                      {selectedReport.ai_severity || "triage..."}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-[11px]">
                  <span className="text-rose-400 font-bold">Validity Reasoning:</span>
                  <p className="text-cn-ink-subtle leading-relaxed italic">&ldquo;{selectedReport.ai_validity_reasoning || "Triage processing pending."}&rdquo;</p>
                </div>

                <div className="flex flex-col gap-1 text-[11px] pt-1">
                  <span className="text-rose-400 font-bold">Recommended action:</span>
                  <p className="text-cn-ink leading-relaxed">{selectedReport.ai_recommended_action || "Triage processing pending."}</p>
                </div>
              </div>

              {/* AI Reply Builder and Email template */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">AI Draft Reply template</span>
                <textarea
                  rows={5}
                  value={draftReply}
                  onChange={(e) => setDraftReply(e.target.value)}
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-xs text-cn-ink outline-none focus:border-rose-500/40 resize-none font-body-md leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={actionLoading}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-md transition disabled:opacity-50"
                >
                  Send Reply to Reporter
                </button>
              </div>

              {/* Administrative note */}
              <div className="flex flex-col gap-2 border-t border-cn-border pt-4">
                <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Private Administrator notes</span>
                <textarea
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Record final resolution notes here..."
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-xs text-cn-ink outline-none focus:border-rose-500/40 resize-none"
                />
              </div>

              {/* Administrative Actions */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-cn-border">
                <button
                  onClick={handleAssignToMe}
                  disabled={actionLoading}
                  className="py-2.5 rounded-xl bg-cn-canvas hover:bg-cn-border border border-cn-border font-bold text-xs text-cn-ink disabled:opacity-50 transition"
                >
                  👤 Assign to Me
                </button>
                <button
                  onClick={handleResolve}
                  disabled={actionLoading}
                  className="py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition"
                >
                  ✅ Resolve Report
                </button>
                <button
                  onClick={handleWontFix}
                  disabled={actionLoading}
                  className="py-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10 font-bold text-xs disabled:opacity-50 transition col-span-2 text-center mt-1"
                >
                  Won&apos;t Fix
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 h-full flex flex-col gap-2 items-center justify-center text-center text-cn-ink-subtle my-auto">
              <span className="material-symbols-outlined text-4xl opacity-40">tab_unselected</span>
              <p className="text-xs font-bold">No Report Selected</p>
              <p className="text-[10px] max-w-[200px] leading-relaxed mx-auto">Click on any bug report row in the queue to inspect location traces and AI evaluations.</p>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}

function getFormattedTimestamp(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}
