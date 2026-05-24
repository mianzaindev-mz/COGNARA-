"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

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
};

type LessonOption = {
  id: string;
  title: string;
  course_title: string;
};

export default function CoachLibraryPage() {
  const supabase = createClient();
  const [resources, setResources] = useState<Resource[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAccess, setFilterAccess] = useState<string>("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Resource["type"]>("pdf");
  const [formUrl, setFormUrl] = useState("");
  const [formAccessLevel, setFormAccessLevel] = useState<Resource["access_level"]>("free");
  const [formPrice, setFormPrice] = useState("0.00");
  const [formIsPermanentlyFree, setFormIsPermanentlyFree] = useState(false);
  const [formLessonId, setFormLessonId] = useState<string>("");
  const [formAiSummary, setFormAiSummary] = useState("");
  const [formAiTranscript, setFormAiTranscript] = useState("");
  const [formAiTags, setFormAiTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  // AI Assistant states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState(0);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      if (!supabase) return;
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCoachId(user.id);

      // Fetch resources
      const { data: resData } = await supabase
        .from("resources")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      if (resData) setResources(resData as Resource[]);

      // Fetch lessons for linking dropdown
      const { data: lesData } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          courses (
            title
          )
        `)
        .eq("courses.coach_id", user.id);

      if (lesData) {
        const formatted = lesData
          .filter((l: any) => l.courses)
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            course_title: l.courses.title,
          }));
        setLessons(formatted);
      }

      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Handle open create/edit modal
  const openModal = (resource: Resource | null = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormTitle(resource.title);
      setFormType(resource.type);
      setFormUrl(resource.url || "");
      setFormAccessLevel(resource.access_level);
      setFormPrice(resource.price_usd?.toString() || "0.00");
      setFormIsPermanentlyFree(resource.is_permanently_free);
      setFormLessonId(resource.lesson_id || "");
      setFormAiSummary(resource.ai_summary || "");
      setFormAiTranscript(resource.ai_transcript || "");
      setFormAiTags(resource.ai_tags || []);
    } else {
      setEditingResource(null);
      setFormTitle("");
      setFormType("pdf");
      setFormUrl("");
      setFormAccessLevel("free");
      setFormPrice("0.00");
      setFormIsPermanentlyFree(false);
      setFormLessonId("");
      setFormAiSummary("");
      setFormAiTranscript("");
      setFormAiTags([]);
    }
    setModalOpen(true);
  };

  // Manage permanent free constraints toggle
  const handlePermanentlyFreeChange = (val: boolean) => {
    setFormIsPermanentlyFree(val);
    if (val) {
      setFormPrice("0.00");
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !formAiTags.includes(trimmed)) {
      setFormAiTags([...formAiTags, trimmed]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setFormAiTags(formAiTags.filter((t) => t !== tag));
  };

  // AI Simulated Assistant Generator logic
  const handleAiMetadataGeneration = () => {
    if (!formTitle) return;
    setAiGenerating(true);
    setAiStep(1);

    setTimeout(() => {
      setAiStep(2);
      setTimeout(() => {
        setAiStep(3);
        setTimeout(() => {
          // Generate customized tags and outlines based on title
          const generatedTags = ["CognaraAI", "StudyNotes"];
          if (formTitle.toLowerCase().includes("three.js") || formTitle.toLowerCase().includes("3d")) {
            generatedTags.push("ThreeJS", "WebGL", "Graphics");
          } else if (formTitle.toLowerCase().includes("python") || formTitle.toLowerCase().includes("code")) {
            generatedTags.push("Python", "Coding", "Backend");
          } else if (formTitle.toLowerCase().includes("react") || formTitle.toLowerCase().includes("web")) {
            generatedTags.push("React", "Frontend", "JavaScript");
          } else {
            generatedTags.push("Tutorial", "Reference");
          }

          const typeName = formType.toUpperCase();
          setFormAiTags([...new Set([...formAiTags, ...generatedTags])]);
          setFormAiSummary(
            `This high-quality ${typeName} resource titled "${formTitle}" has been analyzed by Lumina AI. It provides students with a detailed step-by-step master reference. Ideal for revising key conceptual thresholds and mapping core course dependencies.`
          );
          setFormAiTranscript(
            `[Lumina AI Audio/Visual Analysis Transcript]\n0:00 - Introduction to "${formTitle}" reference guide.\n1:15 - Overview of critical specifications and core methodology.\n3:45 - Practical real-world use cases and structural walkthrough.\n6:20 - Quick checkpoint summary and recommended self-study tasks.`
          );

          setAiGenerating(false);
          setAiStep(0);
        }, 1500);
      }, 1200);
    }, 1000);
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formTitle.trim()) {
      alert("Resource title is required");
      return;
    }
    if (formTitle.trim().length < 3) {
      alert("Resource title must be at least 3 characters");
      return;
    }
    if (formUrl && !formUrl.match(/^https?:\/\/.+/)) {
      alert("Please enter a valid URL (starting with http:// or https://)");
      return;
    }
    if (!formIsPermanentlyFree && (isNaN(parseFloat(formPrice)) || parseFloat(formPrice) < 0)) {
      alert("Please enter a valid price");
      return;
    }
    
    if (!supabase || !coachId) return;

    const payload = {
      coach_id: coachId,
      title: formTitle.trim(),
      type: formType,
      url: formUrl || null,
      access_level: formAccessLevel,
      price_usd: formIsPermanentlyFree ? 0 : parseFloat(formPrice) || 0,
      is_permanently_free: formIsPermanentlyFree,
      lesson_id: formLessonId || null,
      ai_summary: formAiSummary || null,
      ai_transcript: formAiTranscript || null,
      ai_tags: formAiTags,
    };

    if (editingResource) {
      // Update
      const { error } = await supabase
        .from("resources")
        .update(payload)
        .eq("id", editingResource.id);

      if (!error) {
        setResources(
          resources.map((r) =>
            r.id === editingResource.id ? { ...r, ...payload } : r
          )
        );
        setModalOpen(false);
      } else {
        alert("Failed to update resource: " + error.message);
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from("resources")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        setResources([data as Resource, ...resources]);
        setModalOpen(false);
      } else {
        alert("Failed to create resource: " + error?.message);
      }
    }
  };

  // Delete resource
  const handleDelete = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", id);

    if (!error) {
      setResources(resources.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
    }
  };

  // Calculate statistics
  const totalAssets = resources.length;
  const totalViews = resources.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
  const totalDownloads = resources.reduce((acc, curr) => acc + (curr.download_count || 0), 0);
  const freeAssetsCount = resources.filter((r) => r.access_level === "free").length;
  const freePercent = totalAssets > 0 ? Math.round((freeAssetsCount / totalAssets) * 100) : 0;

  // Filter list
  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ai_tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || r.type === filterType;
    const matchesAccess = filterAccess === "all" || r.access_level === filterAccess;
    return matchesSearch && matchesType && matchesAccess;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
          <p className="text-sm text-cn-ink-muted">Loading your resource files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header and Title */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">My Resource Library</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">
            Manage files, video transcripts, references, and attachments linked to your lessons.
          </p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="interactive-element rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition"
        >
          ➕ Add Resource
        </button>
      </section>

      {/* Analytics Panel */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-indigo-500">folder_zip</span>
            <span className="text-xs font-bold text-cn-ink-subtle uppercase tracking-wider">Total Assets</span>
          </div>
          <p className="text-2xl font-bold text-cn-ink">{totalAssets}</p>
          <p className="text-[10px] text-cn-ink-muted mt-1">Uploaded library objects</p>
        </div>

        <div className="cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-teal-500">visibility</span>
            <span className="text-xs font-bold text-cn-ink-subtle uppercase tracking-wider">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-cn-ink">{totalViews}</p>
          <p className="text-[10px] text-cn-ink-muted mt-1">Cumulative student views</p>
        </div>

        <div className="cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-amber-500">download</span>
            <span className="text-xs font-bold text-cn-ink-subtle uppercase tracking-wider">Downloads</span>
          </div>
          <p className="text-2xl font-bold text-cn-ink">{totalDownloads}</p>
          <p className="text-[10px] text-cn-ink-muted mt-1">Resource saved counts</p>
        </div>

        <div className="cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-emerald-500">redeem</span>
            <span className="text-xs font-bold text-cn-ink-subtle uppercase tracking-wider">Free Ratio</span>
          </div>
          <p className="text-2xl font-bold text-cn-ink">{freePercent}%</p>
          <p className="text-[10px] text-cn-ink-muted mt-1">{freeAssetsCount} free content guides</p>
        </div>
      </section>

      {/* Resource Lists, Filters, and Search */}
      <section className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description or tag..."
              className="w-full bg-cn-canvas border border-cn-border rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition placeholder:text-cn-ink-subtle"
            />
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-cn-ink-subtle">
              search
            </span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 sm:flex-initial bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-xs font-semibold text-cn-ink outline-none transition"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF File</option>
              <option value="video">Video Stream</option>
              <option value="image">Image Attachment</option>
              <option value="link">External Link</option>
              <option value="note">Concept Note</option>
            </select>

            <select
              value={filterAccess}
              onChange={(e) => setFilterAccess(e.target.value)}
              className="flex-1 sm:flex-initial bg-cn-canvas border border-cn-border rounded-xl px-3 py-2 text-xs font-semibold text-cn-ink outline-none transition"
            >
              <option value="all">All Access levels</option>
              <option value="free">Free for all</option>
              <option value="members">Members only</option>
              <option value="paid">Paid assets</option>
              <option value="preview">Preview draft</option>
            </select>
          </div>
        </div>

        {/* Resources Cards deck */}
        {filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-cn-border rounded-xl py-16 text-center">
            <span className="material-symbols-outlined text-cn-ink-subtle text-4xl mb-3">folder_open</span>
            <p className="text-sm font-bold text-cn-ink">No matching resources found</p>
            <p className="text-xs text-cn-ink-muted mt-1 max-w-sm">
              Try adjusting your query or filters, or add your first library item.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="group p-5 rounded-xl border border-cn-border bg-cn-canvas/50 hover:bg-cn-canvas transition-colors duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-500">
                        {res.type === "pdf" && "picture_as_pdf"}
                        {res.type === "video" && "movie"}
                        {res.type === "image" && "image"}
                        {res.type === "link" && "link"}
                        {res.type === "note" && "description"}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cn-ink-subtle">
                        {res.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          res.access_level === "free"
                            ? "success"
                            : res.access_level === "paid"
                            ? "warning"
                            : "info"
                        }
                        dot={res.access_level === "free"}
                      >
                        {res.access_level}
                      </Badge>
                      {res.price_usd > 0 && (
                        <span className="text-xs font-bold text-indigo-500">${res.price_usd}</span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-cn-ink group-hover:text-indigo-500 transition-colors">
                    {res.title}
                  </h3>

                  {res.ai_summary && (
                    <p className="text-xs text-cn-ink-muted mt-2 line-clamp-2 leading-relaxed">
                      {res.ai_summary}
                    </p>
                  )}

                  {res.ai_tags && res.ai_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {res.ai_tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-semibold bg-indigo-500/10 text-indigo-500 rounded-full px-2 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-cn-border/60 mt-4 pt-3 text-[10px] text-cn-ink-subtle">
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(res)}
                      className="p-1 text-cn-ink-muted hover:text-indigo-500 transition"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(res.id)}
                      className="p-1 text-cn-ink-muted hover:text-rose-500 transition"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Main Creation/Editing Overlay Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setModalOpen(false)}
          />

          <form
            onSubmit={handleSave}
            className="relative w-full max-w-2xl rounded-2xl border border-white/30 bg-cn-surface p-8 shadow-2xl shadow-black/90 overflow-y-auto max-h-[90vh] custom-scrollbar flex flex-col gap-5"
          >
            <div className="flex justify-between items-center pb-2 border-b border-cn-border/60">
              <h2 className="text-lg font-bold text-cn-ink">
                {editingResource ? "✏️ Edit Library Resource" : "➕ Add New Resource"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-cn-canvas transition text-cn-ink-muted"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* AI Generator Strip */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-500 text-[28px] animate-pulse">
                  smart_toy
                </span>
                <div>
                  <h4 className="text-xs font-bold text-indigo-400">Lumina AI Agent Assistant</h4>
                  <p className="text-[10px] text-cn-ink-muted mt-0.5">
                    Generate tags, key revision summaries, and audio/video transcripts automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAiMetadataGeneration}
                disabled={!formTitle || aiGenerating}
                className="shrink-0 px-4 py-2 bg-indigo-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
              >
                {aiGenerating ? "Generating..." : "✨ Auto Metadata"}
              </button>
            </div>

            {/* Input fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-cn-ink-subtle">Resource Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Next.js App Router Architecture Sheets"
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition text-cn-ink"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-cn-ink-subtle">Resource Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as Resource["type"])}
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 transition text-cn-ink"
                >
                  <option value="pdf">PDF File</option>
                  <option value="video">Video Stream</option>
                  <option value="image">Image Attachment</option>
                  <option value="link">External Link</option>
                  <option value="note">Concept Note / Reference</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-cn-ink-subtle">Resource URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com/asset.pdf"
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition text-cn-ink"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-cn-ink-subtle">Access Level</label>
                <select
                  value={formAccessLevel}
                  onChange={(e) => setFormAccessLevel(e.target.value as Resource["access_level"])}
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 transition text-cn-ink"
                >
                  <option value="free">Free for all learners</option>
                  <option value="members">Members (Active Enrolled)</option>
                  <option value="paid">Paid Standalone asset</option>
                  <option value="preview">Preview draft only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-cn-ink-subtle">Price USD</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  disabled={formIsPermanentlyFree}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition disabled:opacity-40 text-cn-ink"
                />
              </div>

              <div className="flex items-center gap-2.5 sm:col-span-2 bg-cn-canvas p-3 rounded-xl border border-cn-border/60">
                <input
                  type="checkbox"
                  id="perm_free"
                  checked={formIsPermanentlyFree}
                  onChange={(e) => handlePermanentlyFreeChange(e.target.checked)}
                  className="rounded border-cn-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="perm_free" className="text-xs font-bold text-cn-ink cursor-pointer select-none">
                  Mark as Permanently Free Guarantee
                </label>
                <span className="text-[9px] text-cn-ink-subtle italic">
                  (Cannot be set to paid in the future per database constraint trigger rules)
                </span>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-cn-ink-subtle">Link to Specific Lesson (Optional)</label>
                <select
                  value={formLessonId}
                  onChange={(e) => setFormLessonId(e.target.value)}
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 transition text-cn-ink"
                >
                  <option value="">-- Standalone resource (no lesson link) --</option>
                  {lessons.map((les) => (
                    <option key={les.id} value={les.id}>
                      {les.course_title} &gt; {les.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Metadata Results fields */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-cn-ink-subtle">AI Summary & Learning Takeaways</label>
                <textarea
                  rows={3}
                  value={formAiSummary}
                  onChange={(e) => setFormAiSummary(e.target.value)}
                  placeholder="Lumina AI summary will populate here, or enter your own custom reference summary..."
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl p-3 text-xs outline-none focus:border-indigo-500 transition leading-relaxed text-cn-ink"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-cn-ink-subtle">AI Audio/Video Transcript</label>
                <textarea
                  rows={4}
                  value={formAiTranscript}
                  onChange={(e) => setFormAiTranscript(e.target.value)}
                  placeholder="Full analysis transcript or lecture timelines..."
                  className="w-full bg-cn-canvas border border-cn-border rounded-xl p-3 text-xs outline-none focus:border-indigo-500 transition leading-relaxed font-mono text-cn-ink"
                />
              </div>

              {/* Tag Selection System */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-cn-ink-subtle">AI & Search Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add custom keyword (press enter)..."
                    className="flex-1 bg-cn-canvas border border-cn-border rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500 transition text-cn-ink"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-cn-canvas border border-cn-border rounded-xl text-xs hover:bg-cn-border-strong text-cn-ink transition"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formAiTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-500 rounded-full pl-3 pr-1.5 py-0.5"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-500/25 transition text-indigo-600"
                      >
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    </span>
                  ))}
                  {formAiTags.length === 0 && (
                    <p className="text-[10px] text-cn-ink-subtle italic">No tags associated yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-cn-border/60">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 bg-cn-canvas border border-cn-border hover:bg-cn-border-strong text-cn-ink rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 transition"
              >
                {editingResource ? "💾 Save Changes" : "➕ Create Resource"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Processing overlay animation spinner */}
      {aiGenerating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="relative p-8 rounded-3xl text-center max-w-sm w-full flex flex-col items-center gap-6 border border-white/30 shadow-2xl shadow-black/90 bg-[#131313] animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
            <span className="material-symbols-outlined text-[48px] text-primary animate-spin">
              settings_suggest
            </span>
            <div>
              <h3 className="font-headline-lg text-lg font-bold text-white">
                {aiStep === 1 && "🧠 Analyzing resource contents..."}
                {aiStep === 2 && "📝 Compiling revision notes & tags..."}
                {aiStep === 3 && "🎙️ Transcribing simulated media timelines..."}
              </h3>
              <p className="text-xs text-white/50 mt-1.5">
                Powered by Lumina AI Engine · Synced via secure pipeline
              </p>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{
                  width: aiStep === 1 ? "30%" : aiStep === 2 ? "65%" : "95%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/30 bg-cn-surface p-8 shadow-2xl shadow-black/90 text-center flex flex-col gap-4 animate-in zoom-in-95 duration-300">
            <span className="material-symbols-outlined text-rose-500 text-4xl">warning</span>
            <div>
              <h3 className="text-base font-bold text-cn-ink">Delete Resource?</h3>
              <p className="text-xs text-cn-ink-muted mt-1 leading-relaxed">
                This action is permanent and will detach this asset from all student dashboards and course timelines.
              </p>
            </div>
            <div className="flex gap-3 justify-center mt-2 border-t border-white/10 pt-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 bg-white/5 border border-white/20 hover:bg-white/10 text-white/70 rounded-lg text-xs font-bold transition"
              >
                No, Keep
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-600/30 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
