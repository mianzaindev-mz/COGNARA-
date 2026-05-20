"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  order_index: number;
  type: string;
};

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
  const [activeTab, setActiveTab] = useState<"general" | "lessons">("general");

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
  const [lessonContent, setLessonContent] = useState("");
  const [lessonType, setLessonType] = useState("text");

  useEffect(() => {
    if (!slug) return;
    async function loadData() {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Database offline.");

        // Fetch course
        const { data: courseData, error: courseErr } = await supabase
          .from("courses")
          .select("*")
          .eq("slug", slug)
          .single();

        if (courseErr || !courseData) {
          throw new Error("Course not found.");
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
  const openCreateLessonModal = () => {
    setLessonModalMode("create");
    setEditingLessonId(null);
    setLessonTitle("");
    setLessonContent("");
    setLessonType("text");
    setLessonError(null);
    setLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson) => {
    setLessonModalMode("edit");
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content ?? "");
    setLessonType(lesson.type);
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

      if (lessonModalMode === "create") {
        const nextOrderIndex = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 1;

        const { data: newLesson, error: insertErr } = await supabase
          .from("lessons")
          .insert({
            course_id: course.id,
            title: trimmedTitle,
            content: lessonContent.trim(),
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
            content: lessonContent.trim(),
            type: lessonType
          })
          .eq("id", editingLessonId);

        if (updateErr) throw updateErr;

        setLessons(prev =>
          prev.map(l => (l.id === editingLessonId ? { ...l, title: trimmedTitle, content: lessonContent.trim(), type: lessonType } : l))
        );
      }

      setLessonModalOpen(false);
    } catch (err: any) {
      setLessonError(err.message || "Failed to save lesson.");
    } finally {
      setLessonLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!course || !confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not connect to database.");

      const { error: deleteErr } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);

      if (deleteErr) throw deleteErr;

      const updatedLessons = lessons.filter(l => l.id !== lessonId);
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
    } catch (err: any) {
      alert(err.message || "Failed to delete lesson.");
    }
  };

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
          <Link href="/coach/courses" className="hover:text-cn-ink">Courses</Link>
          <span>/</span>
          <span className="text-cn-ink font-medium">{course.title}</span>
        </div>
        <Link
          href="/coach/courses"
          className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
        >
          ← Back to Courses
        </Link>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-cn-border dark:border-[#2e2a2a] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === "general"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-cn-ink-muted hover:text-cn-ink dark:hover:text-white"
          }`}
        >
          General Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lessons")}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === "lessons"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-cn-ink-muted hover:text-cn-ink dark:hover:text-white"
          }`}
        >
          Lessons Management ({lessons.length})
        </button>
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
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-cn-border bg-cn-canvas px-3 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Psychology">Psychology</option>
                </select>
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
                  <option value="advanced">Advanced</option>
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
        <div className="flex flex-col gap-4">
          <section className="flex items-center justify-between">
            <h2 className="text-base font-bold text-cn-ink dark:text-white">Outline & Curriculum</h2>
            <button
              type="button"
              onClick={openCreateLessonModal}
              className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-500 hover:bg-indigo-500 hover:text-white transition"
            >
              + Add Lesson
            </button>
          </section>

          {lessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center dark:border-[#2e2a2a] dark:bg-[#1a1818]">
              <p className="font-bold text-cn-ink dark:text-white">No lessons in this course yet</p>
              <p className="mt-1 text-xs text-cn-ink-muted">Click "+ Add Lesson" to compile your syllabus.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, idx) => {
                return (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cn-border bg-cn-surface p-4 shadow-sm dark:border-[#2e2a2a] dark:bg-[#1a1818]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Move Order buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveLesson(idx, "up")}
                          className="text-[10px] text-cn-ink-muted hover:text-indigo-500 disabled:opacity-20 disabled:hover:text-cn-ink-muted"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === lessons.length - 1}
                          onClick={() => handleMoveLesson(idx, "down")}
                          className="text-[10px] text-cn-ink-muted hover:text-indigo-500 disabled:opacity-20 disabled:hover:text-cn-ink-muted"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="text-center rounded-lg bg-cn-canvas h-8 w-8 flex items-center justify-center font-bold text-xs text-cn-ink dark:bg-[#0f0e0e] dark:text-white">
                        {idx + 1}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-cn-ink dark:text-white">{lesson.title}</h4>
                        <p className="text-[10px] capitalize text-cn-ink-subtle">{lesson.type} content</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditLessonModal(lesson)}
                        className="rounded-lg border border-cn-border px-3 py-1.5 text-xs text-cn-ink hover:bg-cn-canvas dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500 hover:text-white transition"
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

      {/* Lesson Details Edit/Create Modal Overlay */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-xl rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-2xl dark:border-[#2e2a2a] dark:bg-[#1a1818] animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-cn-ink dark:text-white">
                {lessonModalMode === "create" ? "Add Lesson" : "Edit Lesson"}
              </h3>
              <button
                type="button"
                onClick={() => setLessonModalOpen(false)}
                className="text-cn-ink-muted hover:text-cn-ink dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {lessonError && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-500">
                {lessonError}
              </div>
            )}

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Setting Up Local Tools"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Content Type
                </label>
                <select
                  value={lessonType}
                  onChange={(e) => setLessonType(e.target.value)}
                  className="w-full rounded-xl border border-cn-border bg-cn-canvas px-3 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                >
                  <option value="text">Text Document</option>
                  <option value="video">Video Lecture</option>
                  <option value="code">Interactive Code Editor</option>
                  <option value="quiz">Final Quiz Lesson</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Lesson Content (Markdown support)
                </label>
                <textarea
                  rows={8}
                  placeholder="Draft your lesson instructions or reference code structures here..."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cn-border dark:border-[#2e2a2a]">
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
          </div>
        </div>
      )}
    </div>
  );
}
