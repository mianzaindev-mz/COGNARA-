"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Resource = {
  id: string;
  lesson_id: string | null;
  coach_id: string;
  title: string;
  type: "pdf" | "image" | "video" | "link" | "note";
  url: string | null;
  storage_path: string | null;
  access_level: "free" | "members" | "paid" | "preview";
  price_usd: number;
  is_permanently_free: boolean;
  ai_summary: string | null;
  ai_transcript: string | null;
  ai_tags: string[];
  view_count: number;
  download_count: number;
  created_at: string;
  coaches?: {
    full_name: string;
  };
};

export default function StudentLibraryPage() {
  const supabase = createClient();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Navigation state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Preview Modal lightbox
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  // Load resources
  useEffect(() => {
    async function loadResources() {
      if (!supabase) return;
      setLoading(true);

      // Fetch all published/free resources and join the coach profile name
      const { data } = await supabase
        .from("resources")
        .select(`
          *,
          coaches:coach_id (
            full_name
          )
        `)
        .eq("access_level", "free")
        .order("created_at", { ascending: false });

      if (data) {
        // format coach profiles
        const formatted = data.map((r: any) => ({
          ...r,
          coaches: r.coaches ? { full_name: r.coaches.full_name || "Platform Coach" } : { full_name: "COGNARA Coach" }
        }));
        setResources(formatted as Resource[]);
      }
      setLoading(false);
    }
    loadResources();
  }, [supabase]);

  // Handle resource click (increment views)
  const handleOpenPreview = async (res: Resource) => {
    setPreviewResource(res);

    // Update local state views count for rapid UI reactivity
    setResources(
      resources.map((item) =>
        item.id === res.id ? { ...item, view_count: (item.view_count || 0) + 1 } : item
      )
    );

    // Attempt to increment database count (safely catch if student RLS blocks updates)
    try {
      if (supabase) {
        await supabase
          .from("resources")
          .update({ view_count: (res.view_count || 0) + 1 })
          .eq("id", res.id);
      }
    } catch {
      // Safe catch for student database write restrictions
    }
  };

  // Handle download click (increment downloads)
  const handleDownload = async (res: Resource) => {
    // Update local state downloads count
    setResources(
      resources.map((item) =>
        item.id === res.id ? { ...item, download_count: (item.download_count || 0) + 1 } : item
      )
    );

    // Attempt to increment database count
    try {
      if (supabase) {
        await supabase
          .from("resources")
          .update({ download_count: (res.download_count || 0) + 1 })
          .eq("id", res.id);
      }
    } catch {
      // Safe catch for student database write restrictions
    }
  };

  // Compile unique tags for tag cloud
  const tagCloud = Array.from(
    new Set(resources.flatMap((r) => r.ai_tags || []))
  ).slice(0, 15);

  // Filter items
  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.ai_summary && res.ai_summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      res.ai_tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = activeTab === "all" || res.type === activeTab;
    const matchesTag = !selectedTag || res.ai_tags.includes(selectedTag);

    return matchesSearch && matchesTab && matchesTag;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-on-surface-variant">Loading learning resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-margin-desktop py-4 flex flex-col gap-8 relative z-10">
      {/* Title section */}
      <section className="flex flex-col gap-1 sm:gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Free Learning Library
        </span>
        <h1 className="font-headline-lg text-3xl font-bold tracking-tight text-on-surface">
          COGNARA Knowledge Base
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          Dive into free reference notes, visual maps, video timelines, and downloadable study guides compiled by platform coaches and optimized by Lumina AI.
        </p>
      </section>

      {/* Tag Cloud filter bank */}
      {tagCloud.length > 0 && (
        <section className="cn-card p-5 rounded-2xl border border-black/5 dark:border-white/5 bg-surface-container-low/20 backdrop-blur-xl flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">local_offer</span>
            Filter by popular tags
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-300 ${
                selectedTag === null
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high/80"
              }`}
            >
              All Tags
            </button>
            {tagCloud.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all duration-300 ${
                  tag === selectedTag
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high/80"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main filter interface */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* visual segments tabs */}
          <div className="flex flex-wrap gap-1.5 bg-surface-container-high/30 p-1.5 rounded-2xl w-full md:w-auto border border-black/5 dark:border-white/5">
            {[
              { id: "all", label: "All Items", icon: "folder" },
              { id: "note", label: "Notes", icon: "description" },
              { id: "pdf", label: "PDFs", icon: "picture_as_pdf" },
              { id: "video", label: "Videos", icon: "movie" },
              { id: "link", label: "Links", icon: "link" },
              { id: "image", label: "Images", icon: "image" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedTag(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex-1 md:flex-none justify-center ${
                  activeTab === tab.id
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high/40"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource files..."
              className="w-full bg-surface-container-low/40 border border-black/5 dark:border-white/5 rounded-2xl pl-11 pr-4 py-2.5 text-xs outline-none focus:border-primary/50 transition placeholder:text-on-surface-variant/40 text-on-surface"
            />
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
              search
            </span>
          </div>
        </div>

        {/* Resources grid */}
        {filteredResources.length === 0 ? (
          <div className="cn-callout p-12 text-center rounded-3xl flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-40 mb-3">
              library_books
            </span>
            <p className="font-bold text-on-surface">No library files found</p>
            <p className="text-xs text-on-surface-variant mt-1.5">
              We couldn&apos;t find any assets matching your filters. Try resetting tags or query terms.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                onClick={() => handleOpenPreview(res)}
                className="cn-card cursor-pointer p-6 rounded-3xl border border-black/5 dark:border-white/5 bg-surface-container-lowest/40 hover:bg-surface-container-lowest/80 transition-all duration-300 flex flex-col justify-between group shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_12px_40px_rgb(0,0,0,0.3)] relative overflow-hidden"
              >
                {/* Visual glow indicator */}
                <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors duration-300" />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">
                          {res.type === "pdf" && "picture_as_pdf"}
                          {res.type === "video" && "movie"}
                          {res.type === "image" && "image"}
                          {res.type === "link" && "link"}
                          {res.type === "note" && "description"}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant opacity-60">
                        {res.type}
                      </span>
                    </div>

                    <Badge variant="success" size="sm">
                      Free Access
                    </Badge>
                  </div>

                  <h3 className="font-headline-lg text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                    {res.title}
                  </h3>

                  {res.ai_summary && (
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-2.5 line-clamp-3">
                      {res.ai_summary}
                    </p>
                  )}

                  {res.ai_tags && res.ai_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4 relative z-10">
                      {res.ai_tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-semibold bg-surface-container-high/60 text-on-surface-variant/80 rounded-full px-2 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-5 pt-4 text-[10px] text-on-surface-variant opacity-60">
                  <span className="font-medium">By {res.coaches?.full_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      {res.view_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">download</span>
                      {res.download_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Preview Lightbox Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setPreviewResource(null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <main className="relative w-full max-w-3xl rounded-3xl p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-black/90 border border-white/30 bg-cn-surface animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
            <header className="flex justify-between items-start pb-4 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">
                    {previewResource.type === "pdf" && "picture_as_pdf"}
                    {previewResource.type === "video" && "movie"}
                    {previewResource.type === "image" && "image"}
                    {previewResource.type === "link" && "link"}
                    {previewResource.type === "note" && "description"}
                  </span>
                </div>
                <div>
                  <h2 className="font-headline-lg text-lg font-bold text-on-surface leading-tight">
                    {previewResource.title}
                  </h2>
                  <p className="text-[10px] text-on-surface-variant opacity-70 uppercase tracking-widest mt-0.5">
                    Resource file compiled by {previewResource.coaches?.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {/* Interactive Stream container */}
            <div className="bg-black/5 dark:bg-black/35 rounded-2xl border border-black/5 dark:border-white/5 p-6 overflow-hidden flex flex-col items-center justify-center text-center gap-4 min-h-48 relative">
              {/* note preview */}
              {previewResource.type === "note" && (
                <div className="w-full text-left leading-relaxed text-xs text-on-surface/85 max-h-60 overflow-y-auto custom-scrollbar font-body-md bg-surface-container-lowest/30 p-5 rounded-xl border border-black/5">
                  <h4 className="font-bold text-sm mb-3 border-b border-black/5 pb-2 text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">book</span>
                    Interactive Study Notes
                  </h4>
                  <p className="whitespace-pre-wrap">{previewResource.ai_transcript || "Study notes text rendering. Loading concept definitions..."}</p>
                </div>
              )}

              {/* image preview */}
              {previewResource.type === "image" && (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-primary animate-pulse">image</span>
                  <p className="text-xs text-on-surface">Image Stream Active</p>
                  <a
                    href={previewResource.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleDownload(previewResource)}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    View Full Image Attachment
                  </a>
                </div>
              )}

              {/* video preview */}
              {previewResource.type === "video" && (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-teal-500 animate-pulse">play_circle</span>
                  <p className="text-xs text-on-surface">COGNARA Video Stream Player</p>
                  <a
                    href={previewResource.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleDownload(previewResource)}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    Launch Stream Player
                  </a>
                </div>
              )}

              {/* link preview */}
              {previewResource.type === "link" && (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-amber-500">link</span>
                  <p className="text-xs text-on-surface">External Reference Guide URL</p>
                  <a
                    href={previewResource.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleDownload(previewResource)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 group"
                  >
                    <span className="material-symbols-outlined text-[16px]">output</span>
                    Launch Reference
                    <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </a>
                </div>
              )}

              {/* pdf preview */}
              {previewResource.type === "pdf" && (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-rose-500">picture_as_pdf</span>
                  <p className="text-xs text-on-surface">PDF Technical Manual</p>
                  <a
                    href={previewResource.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleDownload(previewResource)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download PDF Resource
                  </a>
                </div>
              )}
            </div>

            {/* AI Summary and tags breakdown */}
            <div className="grid gap-5 md:grid-cols-3">
              <div className="md:col-span-2 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant opacity-70 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
                  Lumina AI Key Takeaways
                </span>
                <p className="text-xs text-on-surface leading-relaxed bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5">
                  {previewResource.ai_summary || "Lumina AI Summary generated on demand. Review the primary course components."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant opacity-70 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">local_offer</span>
                  Resource Tags
                </span>
                <div className="flex flex-wrap gap-1 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5">
                  {previewResource.ai_tags && previewResource.ai_tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5"
                    >
                      #{tag}
                    </span>
                  ))}
                  {(!previewResource.ai_tags || previewResource.ai_tags.length === 0) && (
                    <span className="text-[10px] text-on-surface-variant opacity-50 italic">No tags associated</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Transcript simulation if media has one */}
            {previewResource.type !== "note" && previewResource.ai_transcript && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant opacity-70 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">forum</span>
                  Simulated Media Timelines & Transcript
                </span>
                <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed text-on-surface-variant bg-black/10 dark:bg-black/30 p-3.5 rounded-xl border border-black/5">
                  <pre className="whitespace-pre-wrap">{previewResource.ai_transcript}</pre>
                </div>
              </div>
            )}

            {/* AI Advisor Chat integration launcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5 dark:border-white/5 pt-4 mt-2">
              <div className="text-left">
                <h4 className="text-xs font-bold text-on-surface">Stuck on any concept?</h4>
                <p className="text-[10px] text-on-surface-variant opacity-60">
                  Ask our bilingual Claude-quality teaching advisor to explain this guide.
                </p>
              </div>

              <Link
                href={`/agent?q=Explain+resource:+${encodeURIComponent(previewResource.title)}`}
                onClick={() => setPreviewResource(null)}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-primary to-orange-500 hover:from-primary hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/45 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] animate-pulse">magic_button</span>
                Explain with COGNARA AI Agent
              </Link>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
