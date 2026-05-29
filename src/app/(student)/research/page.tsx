// src/app/(student)/research/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";

type ResearchEntry = {
  id: string;
  query: string;
  query_hash: string;
  synthesis: string;
  results: { url: string; title: string; snippet: string }[];
  citations: string[];
  research_type: string;
  credits_used: number;
  created_at: string;
  expires_at: string;
};

const RESEARCH_TYPES = [
  { value: "general", label: "General", icon: "search" },
  { value: "academic", label: "Academic", icon: "school" },
  { value: "news", label: "News", icon: "newspaper" },
  { value: "code", label: "Code", icon: "code" },
  { value: "definition", label: "Definition", icon: "menu_book" },
];

export default function ResearchLibraryPage() {
  const { notify } = useToast();
  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [researchType, setResearchType] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ResearchEntry | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/research?limit=30");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries(data.research || []);
    } catch {
      notify({ title: "Load Error", description: "Could not load your research library.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleNewResearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      notify({ title: "Invalid Query", description: "Enter at least 3 characters.", tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      notify({ title: "Researching...", description: `Running multi-step research pipeline for "${searchQuery}"`, tone: "info" });
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, researchType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify({ title: "Research Complete", description: data.research?.cached ? "Loaded from cache" : "Fresh synthesis generated", tone: "success" });
      setSearchQuery("");
      // Prepend new result or refresh
      await loadEntries();

      // Auto-open the result
      if (data.research) {
        setSelectedEntry({
          id: data.research.queryHash || "",
          query: data.research.query,
          query_hash: data.research.queryHash,
          synthesis: data.research.synthesis,
          results: data.research.sources || [],
          citations: data.research.subQuestions || [],
          research_type: data.research.researchType,
          credits_used: data.research.creditsUsed,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        });
      }
    } catch (err: any) {
      notify({ title: "Research Failed", description: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const t = RESEARCH_TYPES.find((r) => r.value === type);
    return t?.icon || "search";
  };

  const getTypeLabel = (type: string) => {
    const t = RESEARCH_TYPES.find((r) => r.value === type);
    return t?.label || "General";
  };

  const isExpired = (expires: string) => new Date(expires) < new Date();

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-7xl h-full pb-16 px-6">
      {/* Header */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-violet-500 text-[28px]">travel_explore</span>
          Research Library
        </h1>
        <p className="text-sm text-cn-ink-muted">
          AI-powered multi-step research with source synthesis, caching, and citation tracking.
        </p>
      </section>

      {/* New Research Input */}
      <div className="border border-cn-border bg-cn-surface rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-cn-ink uppercase">
          <span className="material-symbols-outlined text-violet-500 text-[16px]">auto_awesome</span>
          New Research Query
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !submitting && handleNewResearch()}
              placeholder="Ask anything... e.g. 'How do neural networks learn?'"
              className="w-full px-4 py-3 rounded-xl border border-cn-border bg-cn-canvas text-sm text-cn-ink placeholder:text-cn-ink-subtle focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
              maxLength={500}
              disabled={submitting}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cn-ink-subtle font-mono">
              {searchQuery.length}/500
            </span>
          </div>

          {/* Research type selector */}
          <select
            value={researchType}
            onChange={(e) => setResearchType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-cn-border bg-cn-canvas text-xs text-cn-ink font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            {RESEARCH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleNewResearch}
            disabled={submitting || searchQuery.length < 3}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-violet-600/20 flex items-center gap-1.5 shrink-0"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Researching…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                Research
              </>
            )}
          </button>
        </div>
      </div>

      {/* Research Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-cn-ink uppercase">Past Research · {entries.length} entries</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500 inline-block mb-3" />
            <p className="text-xs text-cn-ink-subtle">Loading research library...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="border border-cn-border bg-cn-surface rounded-2xl p-16 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-cn-ink-subtle opacity-40">science</span>
            <p className="text-sm font-bold text-cn-ink">No Research Yet</p>
            <p className="text-xs text-cn-ink-subtle max-w-sm">
              Enter a query above to start your first research session. The AI will plan sub-questions, search for sources, and synthesize a comprehensive answer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="text-left border border-cn-border bg-cn-surface rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-violet-500/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-500 text-[18px]">
                      {getTypeIcon(entry.research_type)}
                    </span>
                    <span className="text-[9px] font-bold text-violet-500 uppercase bg-violet-500/10 px-2 py-0.5 rounded-full">
                      {getTypeLabel(entry.research_type)}
                    </span>
                  </div>
                  {isExpired(entry.expires_at) && (
                    <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                      EXPIRED
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-cn-ink leading-snug line-clamp-2 group-hover:text-violet-600 transition">
                  {entry.query}
                </h3>

                <p className="text-[11px] text-cn-ink-muted leading-relaxed line-clamp-3">
                  {entry.synthesis?.slice(0, 200).replace(/[#*]/g, "") || "No synthesis available"}
                </p>

                <div className="flex justify-between items-center mt-auto pt-2 border-t border-cn-border">
                  <span className="text-[9px] text-cn-ink-subtle font-mono">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-cn-ink-subtle flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">link</span>
                      {(entry.results || []).length} sources
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedEntry(null)} />
          <div className="relative w-full max-w-4xl rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-[rgba(255,255,255,0.08)] bg-[#141420] text-white animate-in zoom-in-95 duration-300">

            {/* Header */}
            <header className="flex justify-between items-start pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-start gap-3 flex-1">
                <span className="material-symbols-outlined text-violet-400 text-[28px] mt-0.5">
                  {getTypeIcon(selectedEntry.research_type)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-violet-400 uppercase bg-violet-400/10 px-2 py-0.5 rounded-full">
                      {getTypeLabel(selectedEntry.research_type)} Research
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(selectedEntry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold leading-snug">{selectedEntry.query}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {/* Sub-Questions */}
            {selectedEntry.citations && selectedEntry.citations.length > 0 && (
              <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-4">
                <span className="text-[10px] uppercase font-bold text-violet-400 flex items-center gap-1 mb-2">
                  <span className="material-symbols-outlined text-[14px]">help_outline</span>
                  Research Sub-Questions
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedEntry.citations.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-gray-300">
                      <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Synthesis Content */}
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 mb-3">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                AI Synthesis
              </span>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap text-[12px]">
                {selectedEntry.synthesis || "No synthesis available."}
              </div>
            </div>

            {/* Sources */}
            {selectedEntry.results && selectedEntry.results.length > 0 && (
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1 mb-3">
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  Sources ({selectedEntry.results.length})
                </span>
                <div className="flex flex-col gap-3">
                  {selectedEntry.results.map((source, i) => (
                    <div key={i} className="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded">[{i + 1}]</span>
                        <span className="text-[11px] font-bold text-white truncate">{source.title}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">{source.snippet}</p>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-sky-400 hover:text-sky-300 truncate transition"
                        >
                          {source.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center border-t border-[rgba(255,255,255,0.08)] pt-4">
              <span className="text-[10px] text-gray-500">
                {selectedEntry.credits_used} credit{selectedEntry.credits_used !== 1 ? "s" : ""} used
              </span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
