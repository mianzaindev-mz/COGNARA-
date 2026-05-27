"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";
import { useToast } from "@/components/ui/toast-provider";

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  order_index: number;
  type: string;
};

type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "video"
  | "code"
  | "url"
  | "divider"
  | "callout"
  | "quote"
  | "resource"
  | "activity"
  | "embed";

type ContentBlock = {
  id: string;
  type: BlockType;
  content: string;
  properties: {
    level?: number;
    align?: "left" | "center" | "right";
    caption?: string;
    language?: string;
    author?: string;
    title?: string;
    duration?: number;
    activityType?: string;
    url?: string;
  };
};

const EDIT_BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: string; desc: string }> = [
  { type: "heading", label: "Heading", icon: "H1", desc: "Title or section header" },
  { type: "paragraph", label: "Paragraph", icon: "¶", desc: "Rich text paragraph" },
  { type: "code", label: "Code Block", icon: "</>", desc: "Syntax-highlighted code" },
  { type: "image", label: "Image", icon: "IMG", desc: "Image from a web URL" },
  { type: "video", label: "Video Player", icon: "▶", desc: "Video streaming player" },
  { type: "embed", label: "Embed Frame", icon: "🔗", desc: "Web iframe content link" },
  { type: "url", label: "Link Card", icon: "🔗", desc: "Bookmark card layout" },
  { type: "callout", label: "Callout Box", icon: "💡", desc: "Important reminder text" },
  { type: "quote", label: "Quote Box", icon: "“", desc: "Italicized custom quote" },
  { type: "resource", label: "Resource Link", icon: "📂", desc: "Downloadable attachment details" },
  { type: "activity", label: "Activity Task", icon: "⚙️", desc: "Actionable hands-on task block" },
  { type: "divider", label: "Divider Line", icon: "—", desc: "Thin separator rule" },
];

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  price_usd: number;
  is_published: boolean;
};

export default function EditCoursePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "lessons" | "live">("general");
  const { notify } = useToast();

  // Deletion state
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Live Sessions state
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [startingLive, setStartingLive] = useState<string | null>(null);
  const [isCreatingLive, setIsCreatingLive] = useState(false);
  const [newLive, setNewLive] = useState({ title: "", scheduled_at: "" });

  // Course settings state
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [price, setPrice] = useState("0");
  const [isPublished, setIsPublished] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Lessons state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonModalMode, setLessonModalMode] = useState<"create" | "edit">("create");
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  // Lesson form state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("text");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Student Preview state
  const [previewActive, setPreviewActive] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewTab, setPreviewTab] = useState<"Overview" | "Materials" | "Curriculum">("Overview");

  useEffect(() => {
    if (!slug) return;
    async function loadData() {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Database offline.");

        // Fetch course
        const { data, error: courseErr } = await supabase
          .from("courses")
          .select("*")
          .eq("slug", slug)
          .single();
        let courseData = data;

        if (courseErr || !courseData) {
          const pendingCourse = (() => {
            if (typeof window === "undefined") return null;
            try {
              const raw = window.localStorage.getItem(`cognara_pending_course_${slug}`);
              return raw ? JSON.parse(raw) : null;
            } catch {
              return null;
            }
          })();

          if (!pendingCourse) {
            throw new Error("Course not found.");
          }

          courseData = pendingCourse;
        }

        setCourse(courseData);
        setTitle(courseData.title);
        setDescription(courseData.description ?? "");
        setCategory(courseData.category ?? "Computer Science");
        setDifficulty(courseData.difficulty ?? "beginner");
        setPrice(String(courseData.price_usd ?? 0));
        setIsPublished(courseData.is_published ?? false);

        // Fetch lessons
        const { data: lessonsData, error: lessonsErr } = await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", courseData.id)
          .order("order_index", { ascending: true });

        if (lessonsErr) throw lessonsErr;
        setLessons(lessonsData ?? []);

      } catch (err: any) {
        setError(err.message || "An error occurred loading the course edit details.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [slug]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || saveStatus === "saving") return;

    // Validation
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      setSaveError("Course title must be between 5 and 200 characters.");
      setSaveStatus("error");
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setSaveError("Price must be a valid positive number.");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not connect to database.");

      // Calculate a potential updated slug if title changed significantly
      const baseSlug = trimmedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const newSlug = trimmedTitle === course.title ? course.slug : `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error: updateErr } = await supabase
        .from("courses")
        .update({
          title: trimmedTitle,
          description: description.trim(),
          category: category.trim(),
          difficulty,
          price_usd: numericPrice,
          is_published: isPublished,
          slug: newSlug
        })
        .eq("id", course.id);

      if (updateErr) throw updateErr;

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2500);

      // If slug changed, update URL without breaking back-navigation
      if (newSlug !== course.slug) {
        router.replace(`/coach/courses/${newSlug}`);
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to update course details.");
      setSaveStatus("error");
    }
  };

  // Lesson Management Actions
  const createNewBlock = (type: BlockType): ContentBlock => {
    return {
      id: `block-${Math.random().toString(36).substring(2, 9)}`,
      type,
      content:
        type === "heading"
          ? "New Section Heading"
          : type === "divider"
          ? ""
          : type === "paragraph"
          ? "Start drafting your lesson content here..."
          : type === "code"
          ? "// Insert sample code or script snippet here"
          : "",
      properties:
        type === "heading"
          ? { level: 2 }
          : type === "code"
          ? { language: "javascript" }
          : type === "quote"
          ? { author: "Famous Scholar" }
          : type === "resource"
          ? { title: "Cheat Sheet PDF" }
          : type === "activity"
          ? { duration: 15, activityType: "challenge" }
          : {},
    };
  };

  const handleAddBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createNewBlock(type)]);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateBlockContent = (id: string, newContent: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: newContent } : b))
    );
  };

  const handleUpdateBlockProperty = (id: string, key: string, val: any) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, properties: { ...b.properties, [key]: val } } : b
      )
    );
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = temp;
    setBlocks(copy);
  };

  const openCreateLessonModal = () => {
    setLessonModalMode("create");
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonType("text");
    setBlocks([
      { id: "b-1", type: "heading", content: "Introduction", properties: { level: 2 } },
      { id: "b-2", type: "paragraph", content: "Write lesson content blocks here...", properties: {} }
    ]);
    setLessonError(null);
    setLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson) => {
    setLessonModalMode("edit");
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonType(lesson.type);

    let parsedBlocks: ContentBlock[] = [];
    try {
      if (lesson.content) {
        const parsed = JSON.parse(lesson.content);
        if (Array.isArray(parsed)) {
          parsedBlocks = parsed;
        } else {
          parsedBlocks = [{ id: "b-1", type: "paragraph", content: lesson.content, properties: {} }];
        }
      } else {
        parsedBlocks = [
          { id: "b-1", type: "heading", content: lesson.title, properties: { level: 2 } },
          { id: "b-2", type: "paragraph", content: "Write lesson content blocks here...", properties: {} }
        ];
      }
    } catch {
      parsedBlocks = [{ id: "b-1", type: "paragraph", content: lesson.content || "", properties: {} }];
    }
    setBlocks(parsedBlocks);
    setLessonError(null);
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || lessonLoading) return;

    // Validation
    const trimmedTitle = lessonTitle.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      setLessonError("Lesson title must be between 3 and 200 characters.");
      return;
    }

    setLessonLoading(true);
    setLessonError(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not connect to database.");

      const serializedContent = JSON.stringify(blocks);

      if (lessonModalMode === "create") {
        const nextOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 1;

        const { data: newLesson, error: insertErr } = await supabase
          .from("lessons")
          .insert({
            course_id: course.id,
            title: trimmedTitle,
            content: serializedContent,
            order_index: nextOrderIndex,
            type: lessonType
          })
          .select()
          .single();

        if (insertErr || !newLesson) throw insertErr || new Error("Insert failed.");
        setLessons(prev => [...prev, newLesson]);

        // Increment local course lesson count dynamically
        await supabase
          .from("courses")
          .update({ total_lessons: lessons.length + 1 })
          .eq("id", course.id);

      } else if (lessonModalMode === "edit" && editingLessonId) {
        const { error: updateErr } = await supabase
          .from("lessons")
          .update({
            title: trimmedTitle,
            content: serializedContent,
            type: lessonType
          })
          .eq("id", editingLessonId);

        if (updateErr) throw updateErr;

        setLessons(prev =>
          prev.map(l => (l.id === editingLessonId ? { ...l, title: trimmedTitle, content: serializedContent, type: lessonType } : l))
        );
      }

      setLessonModalOpen(false);
    } catch (err: any) {
      setLessonError(err.message || "Failed to save lesson.");
    } finally {
      setLessonLoading(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!course || !lessonToDelete) return;

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not connect to database.");

      const { error: deleteErr } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonToDelete);

      if (deleteErr) throw deleteErr;

      const updatedLessons = lessons.filter(l => l.id !== lessonToDelete);
      setLessons(updatedLessons);

      // Decrement local course lesson count dynamically
      await supabase
        .from("courses")
        .update({ total_lessons: updatedLessons.length })
        .eq("id", course.id);

      // Re-index order indexes
      for (let i = 0; i < updatedLessons.length; i++) {
        await supabase
          .from("lessons")
          .update({ order_index: i + 1 })
          .eq("id", updatedLessons[i].id);
      }
      notify({
        title: "Lesson Deleted",
        description: "Successfully deleted the lesson.",
        tone: "success"
      });
    } catch (err: any) {
      notify({
        title: "Deletion Failed",
        description: err.message || "Failed to delete lesson.",
        tone: "error"
      });
    } finally {
      setLessonToDelete(null);
    }
  };

  const handleStartLive = async (sessionId: string) => {
    setStartingLive(sessionId);
    try {
      const res = await fetch("/api/live/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type: "coach" })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLiveSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: "live", daily_room_url: data.url } : s
      ));
      
      window.open(data.url, '_blank');
      notify({
        title: "Session Started",
        description: "Successfully launched the live class room.",
        tone: "success"
      });
    } catch (err: any) {
      notify({
        title: "Launch Failed",
        description: `Failed to start session: ${err.message}`,
        tone: "error"
      });
    } finally {
      setStartingLive(null);
    }
  };

  const handleCreateLive = async () => {
    if (!newLive.title || !newLive.scheduled_at || !course) return;
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Database offline");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("live_sessions")
        .insert({
          coach_id: user.id,
          course_id: course.id,
          title: newLive.title,
          scheduled_at: new Date(newLive.scheduled_at).toISOString(),
          status: "scheduled"
        })
        .select()
        .single();

      if (error) throw error;
      setLiveSessions(prev => [data, ...prev]);
      setIsCreatingLive(false);
      setNewLive({ title: "", scheduled_at: "" });
      notify({
        title: "Session Scheduled",
        description: "Successfully scheduled a new live class.",
        tone: "success"
      });
    } catch (err: any) {
      notify({
        title: "Scheduling Failed",
        description: `Failed to schedule session: ${err.message}`,
        tone: "error"
      });
    }
  };

  // Fetch live sessions on mount or tab change
  useEffect(() => {
    if (activeTab === "live" && course) {
      const fetchLive = async () => {
        const supabase = createClient();
        if (!supabase) return;
        const { data } = await supabase
          .from("live_sessions")
          .select("*")
          .eq("course_id", course.id)
          .order("scheduled_at", { ascending: true });
        setLiveSessions(data || []);
      };
      void fetchLive();
    }
  }, [activeTab, course]);

  const handleMoveLesson = async (index: number, direction: "up" | "down") => {
    if (!course) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= lessons.length) return;

    const listCopy = [...lessons];
    const itemA = listCopy[index];
    const itemB = listCopy[swapIndex];

    // Swap indexes locally
    const originalOrderA = itemA.order_index;
    itemA.order_index = itemB.order_index;
    itemB.order_index = originalOrderA;

    // Swap positions in list
    listCopy[index] = itemB;
    listCopy[swapIndex] = itemA;
    setLessons(listCopy);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not connect to database.");

      const { error } = await supabase
        .from("lessons")
        .upsert([
          { id: itemA.id, order_index: itemA.order_index },
          { id: itemB.id, order_index: itemB.order_index }
        ]);

      if (error) throw error;
    } catch (err: any) {
      console.error("Warning: Failed to persist lesson re-ordering in database:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-cn-ink-muted">
          <span>Courses</span>
          <span>/</span>
          <span className="h-4 w-24 bg-cn-border animate-pulse rounded" />
        </div>
        <div className="h-96 rounded-2xl border border-cn-border bg-cn-surface animate-pulse dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-cn-ink-muted">
          <Link href="/coach/courses" className="hover:text-cn-ink">Courses</Link>
          <span>/</span>
          <span className="text-cn-ink">Error</span>
        </div>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center dark:bg-rose-500/10">
          <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">Course Unavailable</h2>
          <p className="mt-2 text-sm text-cn-ink-muted leading-relaxed">{error || "Course data could not be parsed."}</p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/coach/courses"
              className="rounded-xl border border-cn-border px-5 py-2.5 text-sm font-bold text-cn-ink hover:bg-cn-canvas transition dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
            >
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Trail */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-cn-ink-muted">
          <Link href="/coach/courses" className="hover:text-indigo-500 transition flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">folder</span>
            Courses
          </Link>
          <span className="text-cn-ink-subtle">/</span>
          <span className="text-cn-ink font-medium dark:text-white truncate max-w-[200px]">{course.title}</span>
          {isPublished && (
            <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Live</span>
          )}
        </div>
        <Link
          href="/coach/courses"
          className="text-xs font-bold text-cn-ink-muted hover:text-indigo-500 transition flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </Link>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-cn-border dark:border-[#2e2a2a] gap-1">
        {([
          { key: "general", label: "General Settings", icon: "settings" },
          { key: "lessons", label: `Lessons (${lessons.length})`, icon: "description" },
          { key: "live", label: "Live Classes", icon: "videocam" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 px-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === tab.key
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-cn-ink-muted hover:text-cn-ink dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: activeTab === tab.key ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings Tab content */}
      {activeTab === "general" && (
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm dark:border-[#2e2a2a] dark:bg-[#1a1818]">
          <h2 className="text-base font-bold text-cn-ink dark:text-white mb-6">Edit Course Metadata</h2>

          {saveStatus === "success" && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ✓ General settings updated successfully.
            </div>
          )}
          {saveStatus === "error" && saveError && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-sm font-bold text-rose-500">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSaveGeneral} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                Course Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a comprehensive course syllabus..."
                className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Computer Science, Finance, Photography..."
                  className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                />
                <p className="mt-1 text-[10px] text-cn-ink-subtle italic">Type any category — not restricted to a list.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-cn-border bg-cn-canvas px-3 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-sm text-cn-ink-muted font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-cn-border bg-cn-canvas pl-8 pr-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-t border-cn-border pt-4 dark:border-[#2e2a2a]">
              <input
                id="isPublished"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-cn-border text-indigo-600 focus:ring-indigo-500 dark:border-[#2e2a2a]"
              />
              <label htmlFor="isPublished" className="text-sm font-bold text-cn-ink dark:text-white select-none">
                Publish Course (Make visible to student catalog)
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-cn-border dark:border-[#2e2a2a]">
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saveStatus === "saving" ? "Saving..." : "Save Course Details"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lessons Management Tab content */}
      {activeTab === "lessons" && (
        <div className="flex flex-col gap-5">
          <section className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-cn-ink dark:text-white">Outline & Curriculum</h2>
              <p className="text-xs text-cn-ink-muted mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""} · Drag to reorder</p>
            </div>
            <button
              type="button"
              onClick={openCreateLessonModal}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
              Add Lesson
            </button>
          </section>

          {lessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cn-border bg-cn-surface py-20 text-center dark:border-[#2e2a2a] dark:bg-[#1a1818]">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <span className="material-symbols-outlined text-2xl text-indigo-500" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <p className="font-bold text-cn-ink dark:text-white">No lessons yet</p>
              <p className="mt-1 text-xs text-cn-ink-muted max-w-xs mx-auto">Add your first lesson to start building the curriculum. Each lesson can contain rich text, code, videos, and interactive blocks.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson, idx) => {
                // Compute block count and word estimate
                let blockCount = 0;
                let wordEstimate = 0;
                try {
                  if (lesson.content) {
                    const parsed = JSON.parse(lesson.content);
                    if (Array.isArray(parsed)) {
                      blockCount = parsed.length;
                      wordEstimate = parsed.reduce((sum: number, b: any) => sum + (typeof b.content === "string" ? b.content.split(/\s+/).length : 0), 0);
                    }
                  }
                } catch { /* fallback */ }

                // Type-based styling
                const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string }> = {
                  text: { icon: "description", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                  video: { icon: "play_circle", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                  code: { icon: "code", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  quiz: { icon: "quiz", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                  mixed: { icon: "layers", color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                };
                const tc = typeConfig[lesson.type] || typeConfig.text;

                return (
                  <div
                    key={lesson.id}
                    className="group relative flex items-center gap-4 rounded-2xl border border-cn-border bg-cn-surface p-4 shadow-sm transition-all hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5 dark:border-[#2e2a2a] dark:bg-[#1a1818] dark:hover:border-indigo-500/20"
                  >
                    {/* Reorder controls */}
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveLesson(idx, "up")}
                        className="w-5 h-5 rounded flex items-center justify-center text-cn-ink-muted hover:text-indigo-500 hover:bg-indigo-500/10 disabled:opacity-20 disabled:hover:text-cn-ink-muted disabled:hover:bg-transparent transition"
                      >
                        <span className="material-symbols-outlined text-xs">keyboard_arrow_up</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === lessons.length - 1}
                        onClick={() => handleMoveLesson(idx, "down")}
                        className="w-5 h-5 rounded flex items-center justify-center text-cn-ink-muted hover:text-indigo-500 hover:bg-indigo-500/10 disabled:opacity-20 disabled:hover:text-cn-ink-muted disabled:hover:bg-transparent transition"
                      >
                        <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
                      </button>
                    </div>

                    {/* Lesson number */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                      {idx + 1}
                    </div>

                    {/* Type icon */}
                    <div className={`w-9 h-9 rounded-xl ${tc.bg} border ${tc.border} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined text-base ${tc.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{tc.icon}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-cn-ink dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lesson.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cn-ink-subtle capitalize">{lesson.type}</span>
                        {blockCount > 0 && (
                          <span className="text-[10px] text-cn-ink-muted flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">widgets</span>
                            {blockCount} block{blockCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {wordEstimate > 10 && (
                          <span className="text-[10px] text-cn-ink-muted flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">notes</span>
                            ~{wordEstimate} words
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditLessonModal(lesson)}
                        className="rounded-lg border border-cn-border px-3.5 py-1.5 text-xs font-bold text-cn-ink hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500/20 transition dark:border-[#2e2a2a] dark:text-white dark:hover:text-indigo-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setLessonToDelete(lesson.id)}
                        className="rounded-lg border border-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Live Sessions Tab content */}
      {activeTab === "live" && (
        <div className="flex flex-col gap-6">
          <section className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-cn-ink dark:text-white">Live Classes & Webinars</h2>
              <p className="text-xs text-cn-ink-muted mt-1">Schedule real-time sessions for your students.</p>
            </div>
            <button
              onClick={() => setIsCreatingLive(true)}
              className="rounded-xl bg-cn-orange px-4 py-2 text-xs font-bold text-white hover:bg-cn-orange-hover transition"
            >
              + Schedule Live Class
            </button>
          </section>

          {liveSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center dark:border-[#2e2a2a] dark:bg-[#1a1818]">
              <div className="w-12 h-12 rounded-full bg-cn-orange/10 flex items-center justify-center text-cn-orange mx-auto mb-4">
                <span className="material-symbols-outlined">videocam</span>
              </div>
              <p className="font-bold text-cn-ink dark:text-white">No live sessions scheduled</p>
              <p className="mt-1 text-xs text-cn-ink-muted">Host live workshops, Q&As, or lectures for this course.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveSessions.map((s) => (
                <div key={s.id} className="rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm dark:border-[#2e2a2a] dark:bg-[#1a1818]">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-cn-ink dark:text-white">{s.title}</h4>
                    {s.status === "live" && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-cn-ink-muted mb-6 font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {new Date(s.scheduled_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    disabled={startingLive === s.id}
                    onClick={() => handleStartLive(s.id)}
                    className="w-full rounded-xl bg-cn-sidebar py-2.5 text-xs font-bold text-white hover:brightness-110 transition flex items-center justify-center gap-2"
                  >
                    {s.status === "live" ? (
                      <>
                        <span className="material-symbols-outlined text-sm">login</span>
                        Join Live Call
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">play_circle</span>
                        {startingLive === s.id ? "Initializing..." : "Start Session Now"}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {isCreatingLive && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={() => setIsCreatingLive(false)}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <div className="relative bg-cn-surface w-full max-w-md rounded-[24px] p-8 shadow-2xl shadow-black/90 border border-white/30 dark:border-[#2e2a2a] dark:bg-[#1a1818] animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
                <h3 className="font-bold text-lg text-cn-ink dark:text-white mb-6">Schedule Live Session</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-cn-ink-muted uppercase tracking-wider mb-1.5">Session Title</label>
                    <input
                      type="text"
                      value={newLive.title}
                      onChange={(e) => setNewLive(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Weekly Q&A Session"
                      className="w-full bg-cn-canvas border border-cn-border dark:border-[#2e2a2a] dark:bg-[#0f0e0e] rounded-xl px-4 py-2.5 text-sm text-cn-ink focus:outline-none focus:border-cn-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cn-ink-muted uppercase tracking-wider mb-1.5">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newLive.scheduled_at}
                      onChange={(e) => setNewLive(prev => ({ ...prev, scheduled_at: e.target.value }))}
                      className="w-full bg-cn-canvas border border-cn-border dark:border-[#2e2a2a] dark:bg-[#0f0e0e] rounded-xl px-4 py-2.5 text-sm text-cn-ink focus:outline-none focus:border-cn-orange"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setIsCreatingLive(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-cn-ink-muted hover:bg-cn-border/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateLive}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-cn-orange text-white text-sm font-bold hover:bg-cn-orange-hover transition"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <DoubleConfirmModal
        isOpen={!!lessonToDelete}
        onClose={() => setLessonToDelete(null)}
        onConfirm={handleDeleteLesson}
        title="Delete Lesson"
        description="Are you sure you want to delete this lesson? This action is permanent and all student progress for this lesson will be lost."
        confirmWord="DELETE"
        danger
      />

      {/* Lesson Details Edit/Create Modal Overlay */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-2 md:p-6 overflow-y-auto bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div 
            className="absolute inset-0 cursor-pointer top-0 left-0"
            onClick={() => setLessonModalOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <div className="relative my-auto w-full max-w-5xl rounded-2xl border border-white/30 bg-cn-surface p-8 shadow-2xl shadow-black/90 dark:border-[#2e2a2a] dark:bg-[#1a1818] animate-in zoom-in-95 duration-300 flex flex-col h-[92vh] max-h-[850px] min-h-[500px]" style={{ position: 'relative', zIndex: 10000 }}>
            <div className="mb-4 flex items-center justify-between border-b border-cn-border pb-3 dark:border-[#2e2a2a]">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-cn-ink dark:text-white flex items-center gap-2">
                  <span>⚡</span>
                  <span>{lessonModalMode === "create" ? "Add Lesson" : "Edit Lesson"}</span>
                </h3>
                {/* Segmented Edit / Preview Switcher */}
                <div className="flex items-center bg-cn-canvas dark:bg-[#0f0e0e] rounded-xl border border-cn-border dark:border-[#2e2a2a] p-0.5">
                  <button
                    type="button"
                    onClick={() => { setPreviewActive(false); setPreviewTab("Overview"); }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      !previewActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-cn-ink-muted hover:text-cn-ink dark:hover:text-white"
                    }`}
                  >
                    ✍️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPreviewActive(true); setPreviewTab("Overview"); }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      previewActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-cn-ink-muted hover:text-cn-ink dark:hover:text-white"
                    }`}
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setLessonModalOpen(false); setPreviewActive(false); }}
                className="text-cn-ink-muted hover:text-cn-ink dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* ─── PREVIEW MODE ─── */}
            {previewActive ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Device switcher bar */}
                <div className="flex items-center justify-between shrink-0 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Live Preview</span>
                    <span className="text-[10px] text-cn-ink-subtle">·</span>
                    <span className="text-[10px] text-cn-ink-muted font-semibold truncate max-w-[200px]">{lessonTitle || "Untitled Lesson"}</span>
                  </div>
                  <div className="flex items-center bg-cn-canvas dark:bg-[#0f0e0e] rounded-lg border border-cn-border dark:border-[#2e2a2a] p-0.5">
                    <button type="button" onClick={() => setPreviewDevice("desktop")} className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition ${previewDevice === "desktop" ? "bg-cn-surface dark:bg-[#2e2a2a] text-cn-ink dark:text-white shadow-sm" : "text-cn-ink-muted hover:text-cn-ink"}`}>🖥 Desktop</button>
                    <button type="button" onClick={() => setPreviewDevice("mobile")} className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition ${previewDevice === "mobile" ? "bg-cn-surface dark:bg-[#2e2a2a] text-cn-ink dark:text-white shadow-sm" : "text-cn-ink-muted hover:text-cn-ink"}`}>📱 Mobile</button>
                  </div>
                </div>

                {/* Preview Viewport */}
                <div className="flex-1 flex items-center justify-center overflow-hidden bg-cn-canvas dark:bg-[#0a0909] rounded-xl border border-cn-border dark:border-[#2e2a2a] p-4">
                  <div className={`h-full rounded-2xl border-2 border-cn-border dark:border-[#3a3535] bg-cn-surface dark:bg-[#1a1818] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${previewDevice === "mobile" ? "w-[375px] max-w-[375px]" : "w-full max-w-full"}`}>
                    {/* Simulated mobile notch */}
                    {previewDevice === "mobile" && (
                      <div className="h-7 bg-black flex items-center justify-center shrink-0">
                        <div className="w-20 h-4 bg-[#1a1a1a] rounded-b-xl" />
                      </div>
                    )}

                    {/* Breadcrumb */}
                    <div className="px-4 py-2.5 border-b border-cn-border dark:border-[#2e2a2a] shrink-0 bg-cn-surface dark:bg-[#161414]">
                      <nav className="text-[9px] text-cn-ink-muted flex items-center gap-1 mb-1">
                        <span className="text-cn-ink-subtle">My courses</span><span>/</span>
                        <span className="text-cn-ink-subtle">{course?.title || "Course"}</span><span>/</span>
                        <span className="font-bold text-cn-ink dark:text-white truncate max-w-[120px]">{lessonTitle || "Untitled"}</span>
                      </nav>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          Lesson {(lessons.length || 0) + (lessonModalMode === "create" ? 1 : 0)}
                        </span>
                        <h1 className={`font-bold text-cn-ink dark:text-white truncate ${previewDevice === "mobile" ? "text-sm" : "text-base"}`}>
                          {lessonTitle || "Untitled Lesson"}
                        </h1>
                      </div>
                    </div>

                    {/* Video player (if video block exists) */}
                    {(() => {
                      const videoBlock = blocks.find((b) => b.type === "video" && b.content && b.content.startsWith("http"));
                      if (!videoBlock) return null;
                      const url = videoBlock.content;
                      const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
                      return (
                        <div className={`relative bg-black shrink-0 ${previewDevice === "mobile" ? "aspect-video" : "aspect-video max-h-[200px]"}`}>
                          {ytMatch ? (
                            <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
                          ) : (
                            <video src={url} controls className="h-full w-full object-contain" />
                          )}
                        </div>
                      );
                    })()}

                    {/* Tabs */}
                    <div className="flex gap-1.5 px-4 pt-3 pb-1 shrink-0">
                      {(["Overview", "Materials", "Curriculum"] as const).map((tab) => (
                        <button key={tab} type="button" onClick={() => setPreviewTab(tab)} className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold transition border ${previewTab === tab ? "bg-[#2c2826] text-white border-transparent dark:bg-[#2c2826]" : "border-cn-border bg-white text-cn-ink-muted hover:text-cn-ink dark:bg-[#1c1a18] dark:border-[#2e2a2a]"}`}>
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                      {previewTab === "Overview" ? (
                        blocks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-sm font-bold text-cn-ink-muted">No content blocks yet</p>
                            <p className="text-[10px] text-cn-ink-subtle mt-1">Switch to Edit mode and add content blocks to see them here.</p>
                          </div>
                        ) : (
                          blocks.map((block) => {
                            switch (block.type) {
                              case "heading": {
                                const lvl = block.properties.level || 2;
                                if (lvl === 1) return <h1 key={block.id} className="text-lg font-bold text-cn-ink dark:text-white border-b border-cn-border pb-1.5 mt-2">{block.content}</h1>;
                                if (lvl === 3) return <h3 key={block.id} className="text-xs font-bold text-cn-ink dark:text-gray-200 mt-1">{block.content}</h3>;
                                return <h2 key={block.id} className="text-sm font-bold text-cn-ink dark:text-white mt-1.5">{block.content}</h2>;
                              }
                              case "paragraph":
                                return <p key={block.id} className="text-[11px] text-cn-ink-muted leading-relaxed">{block.content}</p>;
                              case "code":
                                return (
                                  <div key={block.id} className="relative my-2">
                                    <span className="absolute top-1.5 right-2 text-[7px] font-bold text-cn-ink-subtle uppercase tracking-wider">{block.properties.language || "code"}</span>
                                    <pre className="bg-cn-canvas border border-cn-border p-3 rounded-lg text-[10px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto dark:bg-black dark:border-stone-800"><code>{block.content}</code></pre>
                                  </div>
                                );
                              case "image":
                                return block.content && block.content.startsWith("http") ? (
                                  <div key={block.id} className="rounded-lg overflow-hidden border border-cn-border bg-cn-canvas/45 max-h-[180px] my-2 dark:border-stone-800">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={block.content} alt={block.properties.caption || "Lesson image"} className="max-h-[180px] object-contain w-full" />
                                    {block.properties.caption && <p className="text-[9px] text-cn-ink-subtle text-center py-1">{block.properties.caption}</p>}
                                  </div>
                                ) : null;
                              case "video":
                                return null;
                              case "embed":
                                return block.content && block.content.startsWith("http") ? (
                                  <iframe key={block.id} src={block.content} className="w-full h-40 rounded-lg border border-cn-border shadow-sm my-2 dark:border-stone-800" />
                                ) : null;
                              case "url":
                                return block.content && block.content.startsWith("http") ? (
                                  <div key={block.id} className="rounded-xl border border-cn-border bg-cn-surface p-3 my-2 dark:border-stone-800 dark:bg-stone-900/60">
                                    <p className="text-[10px] font-semibold text-cn-ink dark:text-white mb-0.5">Link Reference</p>
                                    <p className="text-[9px] text-cn-ink-muted truncate">{block.content}</p>
                                  </div>
                                ) : null;
                              case "callout":
                                return (
                                  <div key={block.id} className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-lg flex gap-2 items-start my-2 dark:bg-yellow-500/5">
                                    <span className="text-sm">💡</span>
                                    <p className="text-[10px] text-cn-ink dark:text-gray-300 font-medium leading-relaxed">{block.content}</p>
                                  </div>
                                );
                              case "quote":
                                return (
                                  <div key={block.id} className="rounded-xl border border-cn-border bg-cn-surface/70 p-3 my-2 dark:border-stone-800 dark:bg-stone-900/40">
                                    <p className="text-xs italic text-cn-ink dark:text-white">&ldquo;{block.content}&rdquo;</p>
                                    {block.properties.author && <p className="mt-1.5 text-[10px] font-semibold text-indigo-500">— {block.properties.author}</p>}
                                  </div>
                                );
                              case "resource":
                                return (
                                  <div key={block.id} className="rounded-xl border border-cn-border bg-cn-surface p-3 my-2 dark:border-stone-800 dark:bg-stone-900/60">
                                    <p className="text-[10px] font-semibold text-indigo-500 mb-0.5">{block.properties.title || "Resource"}</p>
                                    <p className="text-[10px] text-cn-ink-muted leading-relaxed mb-2">{block.content}</p>
                                    {block.properties.url && block.properties.url.startsWith("http") && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[9px] font-semibold text-indigo-500">📥 Download</span>
                                    )}
                                  </div>
                                );
                              case "activity":
                                return (
                                  <div key={block.id} className="rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 p-3 my-2">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">⚙️ Activity</span>
                                      {block.properties.duration && <span className="text-[9px] text-cn-ink-subtle">{block.properties.duration} min</span>}
                                    </div>
                                    <p className="text-[10px] text-cn-ink dark:text-gray-300 leading-relaxed">{block.content}</p>
                                  </div>
                                );
                              case "divider":
                                return <hr key={block.id} className="my-3 border-cn-border" />;
                              default:
                                return null;
                            }
                          })
                        )
                      ) : previewTab === "Materials" ? (
                        <div>
                          {blocks.filter((b) => b.type === "resource").length > 0 ? (
                            <div className="space-y-2">
                              {blocks.filter((b) => b.type === "resource").map((block) => (
                                <div key={block.id} className="rounded-xl border border-cn-border bg-cn-surface p-3 dark:border-stone-800 dark:bg-stone-900/60">
                                  <p className="text-[10px] font-semibold text-indigo-500 mb-0.5">{block.properties.title || "Resource"}</p>
                                  <p className="text-[10px] text-cn-ink-muted leading-relaxed mb-2">{block.content}</p>
                                  {block.properties.url && block.properties.url.startsWith("http") && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[9px] font-semibold text-indigo-500">📥 Download resource</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-cn-ink-muted py-6 text-center">No downloadable resources attached to this lesson yet.</p>
                          )}
                        </div>
                      ) : (
                        /* Curriculum tab */
                        <div className="space-y-1.5">
                          {lessons.length === 0 && lessonModalMode === "create" ? (
                            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
                              <p className="text-[10px] font-bold text-indigo-500">Lesson 1 · {lessonTitle || "Untitled"}</p>
                              <p className="text-[9px] text-cn-ink-subtle mt-0.5">This lesson (currently being created)</p>
                            </div>
                          ) : (
                            lessons.map((l, i) => (
                              <div key={l.id} className={`rounded-xl border p-2.5 transition ${(lessonModalMode === "edit" && editingLessonId === l.id) ? "border-indigo-500/40 bg-indigo-500/10" : "border-cn-border dark:border-stone-800 hover:border-cn-border/60"}`}>
                                <p className="text-[10px] font-bold text-cn-ink dark:text-white">
                                  Lesson {i + 1} · {l.title}
                                  {(lessonModalMode === "edit" && editingLessonId === l.id) && (
                                    <span className="ml-2 text-[8px] text-indigo-400 font-bold uppercase">Editing</span>
                                  )}
                                </p>
                              </div>
                            ))
                          )}
                          {lessonModalMode === "create" && lessons.length > 0 && (
                            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5">
                              <p className="text-[10px] font-bold text-indigo-500">Lesson {lessons.length + 1} · {lessonTitle || "Untitled"}</p>
                              <p className="text-[9px] text-cn-ink-subtle mt-0.5">This lesson (currently being created)</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom nav simulation */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-cn-border dark:border-[#2e2a2a] shrink-0 bg-cn-surface dark:bg-[#161414]">
                      <span className="rounded-full border border-cn-border px-3 py-1.5 text-[9px] font-semibold text-cn-ink-muted dark:border-stone-800">← Previous</span>
                      <span className="rounded-full bg-[#2c2826] px-3.5 py-1.5 text-[9px] font-bold text-white">Next lesson →</span>
                    </div>
                  </div>
                </div>

                {/* Preview footer */}
                <div className="flex items-center justify-between pt-3 border-t border-cn-border dark:border-[#2e2a2a] shrink-0 mt-3">
                  <p className="text-[9px] text-cn-ink-subtle">Simulated preview. Actual student view may vary based on enrollment state.</p>
                  <button type="button" onClick={() => setPreviewActive(false)} className="rounded-xl border border-cn-border px-4 py-2 text-xs font-bold text-cn-ink hover:bg-cn-canvas dark:border-[#2e2a2a] dark:text-white">
                    ← Back to Editor
                  </button>
                </div>
              </div>
            ) : (
            <>
            {lessonError && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-500">
                {lessonError}
              </div>
            )}

            <form onSubmit={handleSaveLesson} className="flex-1 flex flex-col overflow-hidden space-y-4">
              {/* Top metadata row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 bg-cn-canvas dark:bg-[#0f0e0e] p-4 rounded-xl border border-cn-border dark:border-[#2e2a2a]">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-cn-ink-muted mb-1">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Setting Up Local Tools"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full rounded-lg border border-cn-border bg-cn-surface px-3 py-2 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#161414] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-cn-ink-muted mb-1">
                    Content Type Category
                  </label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value)}
                    className="w-full rounded-lg border border-cn-border bg-cn-surface px-3 py-2 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#161414] dark:text-white"
                  >
                    <option value="text">Text Document</option>
                    <option value="video">Video Lecture</option>
                    <option value="code">Interactive Code Editor</option>
                    <option value="quiz">Final Quiz Lesson</option>
                  </select>
                </div>
              </div>

              {/* Modular content workspace (2 columns) */}
              <div className="flex-1 flex overflow-hidden gap-4 min-h-0">
                {/* Left side: Tool Palette */}
                <div className="w-64 border border-cn-border dark:border-[#2e2a2a] bg-cn-canvas dark:bg-[#0f0e0e] rounded-xl flex flex-col p-4 overflow-y-auto shrink-0 select-none">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 dark:text-indigo-400 mb-3 border-b border-cn-border dark:border-[#2e2a2a] pb-1">
                    Lesson Blocks Palette
                  </h4>
                  <div className="space-y-2">
                    {EDIT_BLOCK_TYPES.map((blockDef) => (
                      <button
                        key={blockDef.type}
                        type="button"
                        onClick={() => handleAddBlock(blockDef.type)}
                        className="w-full text-left rounded-xl border border-cn-border dark:border-[#2e2a2a] bg-cn-surface dark:bg-[#161414] p-2.5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition flex items-center gap-3 active:scale-95 duration-150 group"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-500 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition">
                          {blockDef.icon}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-cn-ink dark:text-white">{blockDef.label}</p>
                          <p className="text-[9px] text-cn-ink-subtle leading-tight">{blockDef.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right side: Interactive Blocks Canvas */}
                <div className="flex-1 border border-cn-border dark:border-[#2e2a2a] bg-cn-canvas dark:bg-[#0f0e0e] rounded-xl p-4 overflow-y-auto min-h-0 flex flex-col gap-4">
                  {blocks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-cn-border dark:border-[#2e2a2a] rounded-xl py-12 text-center">
                      <p className="text-sm font-bold text-cn-ink dark:text-white">Empty lesson canvas</p>
                      <p className="text-xs text-cn-ink-muted mt-1 max-w-xs">Click block buttons on the left to add items to your curriculum outline.</p>
                    </div>
                  ) : (
                    blocks.map((block, idx) => {
                      return (
                        <div
                          key={block.id}
                          className="group relative rounded-xl border border-cn-border dark:border-[#2e2a2a] bg-cn-surface dark:bg-[#161414] p-4 shadow-sm space-y-3 transition-all hover:border-indigo-500/30"
                        >
                          {/* Block Header with Controls */}
                          <div className="flex items-center justify-between border-b border-cn-border dark:border-[#2e2a2a]/60 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {block.type} Block
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveBlock(idx, "up")}
                                className="h-5 px-1.5 text-[9px] font-bold rounded bg-cn-canvas dark:bg-[#0f0e0e] border border-cn-border dark:border-[#2e2a2a] text-cn-ink hover:border-indigo-500 disabled:opacity-30 disabled:hover:border-cn-border"
                              >
                                ▲ Up
                              </button>
                              <button
                                type="button"
                                disabled={idx === blocks.length - 1}
                                onClick={() => handleMoveBlock(idx, "down")}
                                className="h-5 px-1.5 text-[9px] font-bold rounded bg-cn-canvas dark:bg-[#0f0e0e] border border-cn-border dark:border-[#2e2a2a] text-cn-ink hover:border-indigo-500 disabled:opacity-30 disabled:hover:border-cn-border"
                              >
                                ▼ Down
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(block.id)}
                                className="h-5 px-1.5 text-[9px] font-bold rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                              >
                                ✕ Delete
                              </button>
                            </div>
                          </div>

                          {/* Block Type Fields */}
                          {block.type === "heading" && (
                            <div className="flex gap-3">
                              <select
                                value={block.properties.level || 2}
                                onChange={(e) => handleUpdateBlockProperty(block.id, "level", Number(e.target.value))}
                                className="rounded border border-cn-border bg-cn-canvas px-2 py-1 text-xs text-cn-ink focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white shrink-0 font-bold"
                              >
                                <option value={1}>H1</option>
                                <option value={2}>H2</option>
                                <option value={3}>H3</option>
                              </select>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="flex-1 rounded border border-cn-border bg-cn-canvas px-3 py-1 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white font-bold"
                                placeholder="Section Heading"
                              />
                            </div>
                          )}

                          {block.type === "paragraph" && (
                            <textarea
                              rows={3}
                              value={block.content}
                              onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                              className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white resize-y leading-relaxed"
                              placeholder="Type paragraph content (markdown supported)..."
                            />
                          )}

                          {block.type === "code" && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-[9px] uppercase font-bold text-cn-ink-muted">Code Language</label>
                                <input
                                  type="text"
                                  value={block.properties.language || "javascript"}
                                  onChange={(e) => handleUpdateBlockProperty(block.id, "language", e.target.value)}
                                  className="rounded border border-cn-border bg-cn-canvas px-2.5 py-0.5 text-[10px] text-cn-ink dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white font-bold"
                                  placeholder="e.g. typescript, python, html"
                                />
                              </div>
                              <textarea
                                rows={5}
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-[#030107] px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 resize-y"
                                placeholder="// Write code script here"
                              />
                            </div>
                          )}

                          {block.type === "image" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Image Source URL (https://...)"
                              />
                              <input
                                type="text"
                                value={block.properties.caption || ""}
                                onChange={(e) => handleUpdateBlockProperty(block.id, "caption", e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Image Caption / Alternative text label"
                              />
                            </div>
                          )}

                          {block.type === "video" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Video Streaming URL (Direct .mp4 / YouTube embed link)"
                              />
                            </div>
                          )}

                          {block.type === "embed" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Embed Iframe source URL (https://...)"
                              />
                            </div>
                          )}

                          {block.type === "url" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Link URL (https://...)"
                              />
                            </div>
                          )}

                          {block.type === "callout" && (
                            <textarea
                              rows={2}
                              value={block.content}
                              onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                              className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white resize-y"
                              placeholder="💡 Callout box message..."
                            />
                          )}

                          {block.type === "quote" && (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white italic"
                                placeholder="“Write the quote here...”"
                              />
                              <input
                                type="text"
                                value={block.properties.author || ""}
                                onChange={(e) => handleUpdateBlockProperty(block.id, "author", e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Quote Author / Source"
                              />
                            </div>
                          )}

                          {block.type === "resource" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={block.properties.title || ""}
                                onChange={(e) => handleUpdateBlockProperty(block.id, "title", e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white font-bold"
                                placeholder="Resource Link Label (e.g. Python Syllabus PDF)"
                              />
                              <textarea
                                rows={2}
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Short description of this resource..."
                              />
                              <input
                                type="text"
                                value={block.properties.url || ""}
                                onChange={(e) => handleUpdateBlockProperty(block.id, "url", e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-1.5 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Download URL Link (https://...)"
                              />
                            </div>
                          )}

                          {block.type === "activity" && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-[9px] uppercase font-bold text-cn-ink-muted">Duration (min)</label>
                                  <input
                                    type="number"
                                    value={block.properties.duration || 10}
                                    onChange={(e) => handleUpdateBlockProperty(block.id, "duration", Number(e.target.value))}
                                    className="w-16 rounded border border-cn-border bg-cn-canvas px-2 py-0.5 text-xs text-cn-ink dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white font-bold"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-[9px] uppercase font-bold text-cn-ink-muted">Task Type</label>
                                  <input
                                    type="text"
                                    value={block.properties.activityType || "challenge"}
                                    onChange={(e) => handleUpdateBlockProperty(block.id, "activityType", e.target.value)}
                                    className="w-full rounded border border-cn-border bg-cn-canvas px-2 py-0.5 text-xs text-cn-ink dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white font-bold"
                                    placeholder="e.g. coding, lab, review"
                                  />
                                </div>
                              </div>
                              <textarea
                                rows={2}
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                className="w-full rounded border border-cn-border bg-cn-canvas px-3 py-2 text-xs text-cn-ink focus:outline-none focus:border-indigo-500 dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                                placeholder="Describe the hands-on instructions for the activity task..."
                              />
                            </div>
                          )}

                          {block.type === "divider" && (
                            <div className="flex items-center justify-center py-2 border-t border-dashed border-cn-border dark:border-[#2e2a2a]/60">
                              <span className="text-[9px] font-bold text-cn-ink-subtle uppercase tracking-wider">[ Divider Line separator ]</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal controls footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cn-border dark:border-[#2e2a2a] shrink-0">
                <button
                  type="button"
                  onClick={() => setLessonModalOpen(false)}
                  disabled={lessonLoading}
                  className="rounded-xl border border-cn-border px-4 py-2.5 text-sm font-bold text-cn-ink hover:bg-cn-canvas disabled:opacity-50 dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lessonLoading}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {lessonLoading ? "Saving..." : "Save Lesson"}
                </button>
              </div>
            </form>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
