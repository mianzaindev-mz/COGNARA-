"use client";

import { useState, useEffect, useCallback, DragEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";
import { useToast } from "@/components/ui/toast-provider";

// --- Types ---
type CourseItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  price_usd: number;
  is_published: boolean;
  chapter_count: number;
  lesson_count: number;
  progress_pct: number;
  badge_criteria?: { bronze: number; copper: number; silver: number; gold: number; platinum: number };
  badge_criteria_locked?: boolean;
};

type ChapterNode = {
  id: string;
  title: string;
  x: number;
  z: number;
  y: number;
  locked: boolean;
  wallType: "cloud" | "wall" | "none";
};

type LessonNode = {
  id: string;
  chapterId: string;
  title: string;
  order_index: number;
  locked: boolean;
  type: string;
  is_graded: boolean;
};

type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "video"
  | "url"
  | "embed"
  | "code"
  | "activity"
  | "quote"
  | "resource"
  | "divider"
  | "callout"
  | "quiz";

type ContentBlock = {
  id: string;
  type: BlockType;
  content: string;
  properties: Record<string, any>;
  meta?: Record<string, any>;
};

const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: string; desc: string }> = [
  { type: "heading", label: "Heading", icon: "H1", desc: "Title or section header" },
  { type: "paragraph", label: "Paragraph", icon: "¶", desc: "Rich text paragraph" },
  { type: "image", label: "Image", icon: "IMG", desc: "Image via URL or upload" },
  { type: "video", label: "Video", icon: "▶", desc: "Embed video from URL" },
  { type: "code", label: "Code Block", icon: "</>", desc: "Syntax-highlighted code" },
  { type: "url", label: "Link Card", icon: "🔗", desc: "Embed a link preview" },
  { type: "divider", label: "Divider", icon: "—", desc: "Section separator" },
  { type: "callout", label: "Callout", icon: "!", desc: "Highlighted callout box" },
  { type: "quiz", label: "Quiz", icon: "?", desc: "Multiple choice question" },
];

// --- Seed Data Helper ---
const DEFAULT_CHAPTERS: ChapterNode[] = [
  { id: "ch-1", title: "Chapter 1: Getting Started", x: -8, z: -5, y: 1.5, locked: false, wallType: "none" },
  { id: "ch-2", title: "Chapter 2: Core Concepts", x: 0, z: 2, y: 0.5, locked: true, wallType: "cloud" },
  { id: "ch-3", title: "Chapter 3: Advanced Systems", x: 8, z: -3, y: 2.2, locked: true, wallType: "wall" },
];

const DEFAULT_LESSONS: LessonNode[] = [
  { id: "les-1-1", chapterId: "ch-1", title: "Welcome and Prerequisites", order_index: 1, locked: false, type: "text", is_graded: false },
  { id: "les-1-2", chapterId: "ch-1", title: "Installation & Workspace", order_index: 2, locked: true, type: "text", is_graded: false },
  { id: "les-2-1", chapterId: "ch-2", title: "Understanding Data Flow", order_index: 1, locked: true, type: "text", is_graded: false },
  { id: "les-2-2", chapterId: "ch-2", title: "State Management Core", order_index: 2, locked: true, type: "text", is_graded: false },
  { id: "les-3-1", chapterId: "ch-3", title: "Optimization Techniques", order_index: 1, locked: true, type: "text", is_graded: false },
  { id: "les-3-2", chapterId: "ch-3", title: "Final Project Review", order_index: 2, locked: true, type: "text", is_graded: false },
];

export default function CourseBuilderPage() {
  const [view, setView] = useState<"lobby" | "pathway" | "editor">("lobby");
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const { notify } = useToast();

  // New Course Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Computer Science");

  // Lesson Editor Sub-view (Preview feature)
  const [editorSubView, setEditorSubView] = useState<"edit" | "preview">("edit");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({}); // Store choices made in lesson preview

  // Edit Course Details Authority modal states
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Computer Science");
  const [editDescription, setEditDescription] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("beginner");
  const [editPriceUsd, setEditPriceUsd] = useState("0");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editBadgeCriteria, setEditBadgeCriteria] = useState({ bronze: 50, copper: 60, silver: 70, gold: 80, platinum: 90 });
  const [editBadgeLocked, setEditBadgeLocked] = useState(false);
  const [savingCourseDetails, setSavingCourseDetails] = useState(false);

  // Double Confirm Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalDesc, setConfirmModalDesc] = useState("");
  const [confirmWord, setConfirmWord] = useState<string | undefined>(undefined);

  // Motion pathway map data
  const [chapters, setChapters] = useState<ChapterNode[]>([]);
  const [lessons, setLessons] = useState<LessonNode[]>([]);
  const [activeChapter, setActiveChapter] = useState<ChapterNode | null>(null);
  const [simulationMode, setSimulationMode] = useState<"edit" | "preview">("edit");

  // Lesson Editor Data
  const [activeLesson, setActiveLesson] = useState<LessonNode | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [savingBlock, setSavingBlock] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingNew, setDraggingNew] = useState<BlockType | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);

  // --- Fetch Courses ---
  const loadCourses = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) return;

      let { data: { user } } = await supabase.auth.getUser();
      
      // Fallback check for demo sessions
      if (!user && typeof document !== "undefined") {
        const clientUserCookie = document.cookie
          .split("; ")
          .find(row => row.startsWith("cognara_demo_client_user="))
          ?.split("=")[1];
          
        if (clientUserCookie) {
          try {
            const decoded = decodeURIComponent(clientUserCookie);
            const clean = decoded.startsWith('"') && decoded.endsWith('"') ? decoded.slice(1, -1) : decoded;
            const demoUser = JSON.parse(clean);
            if (demoUser && demoUser.id) {
              user = { id: demoUser.id } as any;
            }
          } catch {}
        }
      }

      if (!user) return;

      const { data: dbCourses } = await supabase
        .from("courses")
        .select("id, title, category, description, difficulty, price_usd, is_published, total_lessons, badge_criteria, badge_criteria_locked")
        .eq("coach_id", user.id);

      const items: CourseItem[] = (dbCourses ?? []).map((c: any) => ({
        id: c.id,
        title: c.title,
        category: c.category ?? "Computer Science",
        description: c.description ?? "",
        difficulty: c.difficulty ?? "Beginner",
        price_usd: Number(c.price_usd) || 0,
        is_published: !!c.is_published,
        chapter_count: 3,
        lesson_count: c.total_lessons ?? 6,
        progress_pct: 0,
        badge_criteria: c.badge_criteria,
        badge_criteria_locked: c.badge_criteria_locked
      }));

      setCourses(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  // --- Create Course ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const supabase = createClient();
      if (!supabase) return;

      let { data: { user } } = await supabase.auth.getUser();
      
      // Fallback check for demo sessions
      if (!user && typeof document !== "undefined") {
        const clientUserCookie = document.cookie
          .split("; ")
          .find(row => row.startsWith("cognara_demo_client_user="))
          ?.split("=")[1];
          
        if (clientUserCookie) {
          try {
            const decoded = decodeURIComponent(clientUserCookie);
            const clean = decoded.startsWith('"') && decoded.endsWith('"') ? decoded.slice(1, -1) : decoded;
            const demoUser = JSON.parse(clean);
            if (demoUser && demoUser.id) {
              user = { id: demoUser.id } as any;
            }
          } catch {}
        }
      }

      if (!user) return;

      const baseSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: newCourse } = await supabase
        .from("courses")
        .insert({
          coach_id: user.id,
          title: newTitle.trim(),
          category: newCategory,
          slug,
          is_published: false,
          total_lessons: 6
        })
        .select()
        .single();

      if (newCourse) {
        // Create mock lessons in DB to enable editing
        for (let i = 0; i < DEFAULT_LESSONS.length; i++) {
          const dl = DEFAULT_LESSONS[i];
          await supabase.from("lessons").insert({
            course_id: newCourse.id,
            title: dl.title,
            order_index: dl.order_index,
            type: "text",
            content: JSON.stringify([
              { id: "b-1", type: "heading", content: `Welcome to ${dl.title}`, properties: { level: 2 } },
              { id: "b-2", type: "paragraph", content: "This is a dynamic template lesson block. Click options to edit and expand curriculum details.", properties: {} }
            ])
          });
        }
        setCreateOpen(false);
        setNewTitle("");
        void loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Open Path Map ---
  const handleOpenPathway = async (course: CourseItem) => {
    setSelectedCourse(course);
    setView("pathway");
    setActiveChapter(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("No supabase client");

      const { data: dbChapters, error: chErr } = await supabase
        .from("chapters")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      const { data: dbLessons, error: lesErr } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      if (chErr || lesErr) throw new Error("Failed to fetch chapters/lessons from DB");

      if (dbChapters && dbChapters.length > 0) {
        setChapters(dbChapters.map((ch: any) => ({
          id: ch.id,
          title: ch.title,
          x: Number(ch.x_pos) || 0,
          z: Number(ch.z_pos) || 0,
          y: Number(ch.y_pos) || 0,
          locked: !!ch.is_locked,
          wallType: (ch.wall_type as any) || "none"
        })));
        
        setLessons((dbLessons || []).map((l: any) => ({
          id: l.id,
          chapterId: l.chapter_id || "",
          title: l.title,
          order_index: l.order_index,
          locked: false, // Default to false if not stored
          type: l.type || "text",
          is_graded: !!l.is_graded
        })));
        return;
      }
    } catch (e) {
      console.warn("Falling back to local storage:", e);
    }

    // Load local storage custom layout for this course if it exists, or fall back to default
    const savedLayout = localStorage.getItem(`pathway-${course.id}`);
    if (savedLayout) {
      const parsed = JSON.parse(savedLayout);
      setChapters(parsed.chapters);
      setLessons(parsed.lessons);
    } else {
      setChapters(DEFAULT_CHAPTERS);
      setLessons(DEFAULT_LESSONS);
    }
  };

  // Save layout position
  const saveLayoutToLocalStorage = (updatedChapters: ChapterNode[], updatedLessons: LessonNode[]) => {
    if (!selectedCourse) return;
    localStorage.setItem(
      `pathway-${selectedCourse.id}`,
      JSON.stringify({ chapters: updatedChapters, lessons: updatedLessons })
    );
  };

  // --- Open Lesson Editor ---
  const handleOpenLesson = useCallback(async (lesson: LessonNode) => {
    setActiveLesson(lesson);
    setView("editor");
    setSelectedBlockId(null);
    setSavingBlock(false);

    try {
      const supabase = createClient();
      if (!supabase) return;

      // Fetch lesson content
      const { data: dbLessons } = await supabase
        .from("lessons")
        .select("content")
        .eq("course_id", selectedCourse!.id)
        .eq("title", lesson.title)
        .limit(1);

      if (dbLessons && dbLessons.length > 0 && dbLessons[0].content) {
        try {
          const parsed = JSON.parse(dbLessons[0].content);
          setBlocks(Array.isArray(parsed) ? parsed : []);
        } catch {
          // Fallback if content is plain text
          setBlocks([
            { id: "b-fallback", type: "paragraph", content: dbLessons[0].content, properties: {} }
          ]);
        }
      } else {
        setBlocks([
          { id: "b-1", type: "heading", content: lesson.title, properties: { level: 2 } },
          { id: "b-2", type: "paragraph", content: "Write or drag curriculum components below.", properties: {} }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedCourse]);

  // Save lesson editor content
  const handleSaveLessonContent = async () => {
    if (!activeLesson || !selectedCourse) return;
    setSavingBlock(true);

    try {
      const supabase = createClient();
      if (!supabase) return;

      // Update lesson table content
      const { error } = await supabase
        .from("lessons")
        .update({ content: JSON.stringify(blocks) })
        .eq("course_id", selectedCourse.id)
        .eq("title", activeLesson.title);

      if (error) throw error;

      notify({
        title: "Lesson Saved",
        description: "Lesson content saved to cloud database!",
        tone: "success"
      });
    } catch (err) {
      console.error(err);
      notify({
        title: "Save Failed",
        description: "Failed to save lesson content.",
        tone: "error"
      });
    } finally {
      setSavingBlock(false);
    }
  };

  // State to track which course is currently being edited in details modal
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Open Edit Course Modal
  const openEditCourseModal = (course: CourseItem) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditCategory(course.category);
    setEditDescription(course.description);
    setEditDifficulty(course.difficulty);
    setEditPriceUsd(String(course.price_usd));
    setEditIsPublished(course.is_published);
    setEditBadgeCriteria(course.badge_criteria || { bronze: 50, copper: 60, silver: 70, gold: 80, platinum: 90 });
    setEditBadgeLocked(!!course.badge_criteria_locked);
    setEditCourseModalOpen(true);
  };

  const handleLockBadgeCriteria = () => {
    setConfirmModalTitle("Lock Badge Criteria");
    setConfirmModalDesc("Once locked, you will not be able to change the badge threshold criteria for this course ever again.");
    setConfirmWord("LOCK");
    setConfirmAction(() => () => setEditBadgeLocked(true));
    setConfirmModalOpen(true);
  };

  // Save/Update Course Details
  const handleUpdateCourseDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseId || !editTitle.trim()) return;
    setSavingCourseDetails(true);

    try {
      const supabase = createClient();
      if (!supabase) return;

      const { error } = await supabase
        .from("courses")
        .update({
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          difficulty: editDifficulty,
          price_usd: Number(editPriceUsd) || 0,
          is_published: editIsPublished,
          badge_criteria: editBadgeCriteria,
          badge_criteria_locked: editBadgeLocked
        })
        .eq("id", editingCourseId);

      if (error) throw error;

      notify({
        title: "Course Updated",
        description: "Course details updated successfully!",
        tone: "success"
      });
      setEditCourseModalOpen(false);
      
      // Update local state if this was our currently selected course
      if (selectedCourse && selectedCourse.id === editingCourseId) {
        setSelectedCourse(prev => prev ? {
          ...prev,
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          difficulty: editDifficulty,
          price_usd: Number(editPriceUsd) || 0,
          is_published: editIsPublished,
          badge_criteria: editBadgeCriteria,
          badge_criteria_locked: editBadgeLocked
        } : null);
      }

      void loadCourses();
    } catch (err) {
      console.error(err);
      notify({
        title: "Update Failed",
        description: "Failed to update course details.",
        tone: "error"
      });
    } finally {
      setSavingCourseDetails(false);
    }
  };

  // --- Add Chapter Node ---
  const handleAddChapterNode = () => {
    const nextId = `ch-${chapters.length + 1}`;
    const newCh: ChapterNode = {
      id: nextId,
      title: `Chapter ${chapters.length + 1}: Custom Module`,
      x: (Math.random() - 0.5) * 14,
      z: (Math.random() - 0.5) * 14,
      y: 1.0 + Math.random() * 1.5,
      locked: true,
      wallType: "cloud"
    };

    const newLessons: LessonNode[] = [
      { id: `les-${nextId}-1`, chapterId: nextId, title: `Lesson ${chapters.length + 1}.1`, order_index: 1, locked: true, type: "text", is_graded: false }
    ];

    const updatedChs = [...chapters, newCh];
    const updatedLes = [...lessons, ...newLessons];

    setChapters(updatedChs);
    setLessons(updatedLes);
    saveLayoutToLocalStorage(updatedChs, updatedLes);
  };

  // --- Add Lesson Node ---
  const handleAddLesson = () => {
    if (!activeChapter) return;
    const nextLesIdx = lessons.filter(l => l.chapterId === activeChapter.id).length + 1;
    const newLes: LessonNode = {
      id: `les-${activeChapter.id}-${nextLesIdx}`,
      chapterId: activeChapter.id,
      title: `Lesson ${nextLesIdx} (Mini Activity)`,
      order_index: nextLesIdx,
      locked: true,
      type: "mini_activity",
      is_graded: false
    };

    const updatedLes = [...lessons, newLes];
    setLessons(updatedLes);
    saveLayoutToLocalStorage(chapters, updatedLes);
  };

  // --- Drag Reposition nodes (Simulated in list editor for mouse-friendly precision) ---
  const handleUpdatePosition = (id: string, field: "x" | "z" | "y", val: number) => {
    const updated = chapters.map(ch => {
      if (ch.id === id) {
        return { ...ch, [field]: val };
      }
      return ch;
    });
    setChapters(updated);
    saveLayoutToLocalStorage(updated, lessons);
  };

  // Toggle node lock status
  const handleToggleLock = (id: string, type: "chapter" | "lesson") => {
    if (type === "chapter") {
      const updated = chapters.map(ch => (ch.id === id ? { ...ch, locked: !ch.locked } : ch));
      setChapters(updated);
      saveLayoutToLocalStorage(updated, lessons);
    } else {
      const updated = lessons.map(l => (l.id === id ? { ...l, locked: !l.locked } : l));
      setLessons(updated);
      saveLayoutToLocalStorage(chapters, updated);
    }
  };

  // Toggle cloud/wall type
  const handleCycleWall = (id: string) => {
    const updated = chapters.map(ch => {
      if (ch.id === id) {
        const nextWall = ch.wallType === "none" ? "cloud" : ch.wallType === "cloud" ? "wall" : "none";
        return { ...ch, wallType: nextWall as any };
      }
      return ch;
    });
    setChapters(updated);
    saveLayoutToLocalStorage(updated, lessons);
  };

  // --- Drag-and-drop block functions ---
  const createNewBlock = (type: BlockType): ContentBlock => {
    return {
      id: Math.random().toString(36).slice(2),
      type,
      content:
        type === "heading"
          ? "New Heading"
          : type === "paragraph"
          ? "Start writing your content here..."
          : type === "code"
          ? "// Write your code here\nconsole.log('Hello, World!');"
          : type === "callout"
          ? "This is an important note."
          : type === "quiz"
          ? "What is the answer?"
          : "",
      properties:
        type === "heading"
          ? { level: 2 }
          : type === "quiz"
          ? { options: ["Option A", "Option B", "Option C"], answer: "Option A" }
          : {},
      meta:
        type === "code"
          ? { lang: "javascript" }
          : {},
    };
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createNewBlock(type);
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleSidebarDragStart = (type: BlockType) => {
    setDraggingNew(type);
    setDraggingBlock(null);
  };

  const handleDropOnCanvas = (e: DragEvent<HTMLElement>, index?: number) => {
    e.preventDefault();
    if (draggingNew) {
      const newBlock = createNewBlock(draggingNew);
      const updated = [...blocks];
      if (typeof index === "number") {
        updated.splice(index, 0, newBlock);
      } else {
        updated.push(newBlock);
      }
      setBlocks(updated);
      setSelectedBlockId(newBlock.id);
      setDraggingNew(null);
    } else if (draggingBlock) {
      handleBlockDrop(typeof index === "number" ? index : blocks.length);
    }
    setDragOverIndex(null);
  };

  const handleBlockDragStart = (id: string) => {
    setDraggingBlock(id);
    setDraggingNew(null);
  };

  const handleBlockDrop = (targetIdx: number) => {
    if (!draggingBlock) return;
    const fromIdx = blocks.findIndex(b => b.id === draggingBlock);
    if (fromIdx === -1) return;
    const arr = [...blocks];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(targetIdx, 0, moved);
    setBlocks(arr);
    setDraggingBlock(null);
    setDragOverIndex(null);
  };

  const handleUpdateBlockContent = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, content } : b)));
  };

  const handleUpdateBlockProp = (id: string, key: string, val: any) => {
    setBlocks(prev =>
      prev.map(b => (b.id === id ? { ...b, properties: { ...b.properties, [key]: val } } : b))
    );
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= blocks.length) return;

    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[swap];
    copy[swap] = temp;
    setBlocks(copy);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  return (
    <div className="min-h-screen bg-[#07040f] text-white flex flex-col font-sans">
      {/* Visual Navigation Bar */}
      <header className="border-b border-[#221740] bg-[#0c081d] px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent tracking-wider">
            COGNARA CREATOR™
          </span>
          <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/35 uppercase">
            Motion Pathway
          </span>
        </div>
        <div className="flex items-center gap-3">
          {view !== "lobby" && (
            <button
              onClick={() => setView("lobby")}
              className="rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2 text-xs font-bold text-gray-300 hover:bg-[#1a113d] hover:text-white transition"
            >
              ← Exit to Lobby
            </button>
          )}
          <Link
            href="/coach/courses"
            className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700 transition"
          >
            Coach Dashboard
          </Link>
        </div>
      </header>

      {/* --- LAYER 1: COURSE LOBBY DASHBOARD --- */}
      {view === "lobby" && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col gap-8">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Course Pathway Builder</h1>
              <p className="mt-1 text-sm text-gray-400">Design dynamic course paths, chapter lock gates, and lesson content modules.</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 hover:shadow-lg"
            >
              + Create New Course
            </button>
          </section>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-44 bg-[#110c2c] border border-[#201540] animate-pulse rounded-2xl" />
              <div className="h-44 bg-[#110c2c] border border-[#201540] animate-pulse rounded-2xl" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#221740] bg-[#0c081d] py-16 text-center">
              <h2 className="text-lg font-bold text-white">No builder courses</h2>
              <p className="mt-1 text-sm text-gray-400 max-w-sm">Create a course above to initialize the motion map workspace.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-[#221740] bg-[#0c081d] p-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-violet-500/40 hover:-translate-y-1 hover:shadow-violet-900/10"
                >
                  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-xl" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{course.category}</span>
                  <h3 className="mt-1 text-base font-bold text-white truncate">{course.title}</h3>

                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="rounded-xl bg-[#120c2b] p-3 text-center border border-[#1f163f]">
                      <p className="text-lg font-bold text-white">{course.chapter_count}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Chapters</p>
                    </div>
                    <div className="rounded-xl bg-[#120c2b] p-3 text-center border border-[#1f163f]">
                      <p className="text-lg font-bold text-white">{course.lesson_count}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Lessons</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenPathway(course)}
                      className="flex-1 rounded-xl bg-violet-600/80 py-2.5 text-xs font-bold text-white hover:bg-violet-700 transition"
                    >
                      Path Map →
                    </button>
                    <button
                      onClick={() => openEditCourseModal(course)}
                      className="rounded-xl border border-[#221740] bg-[#120c2b] px-3.5 py-2.5 text-xs font-bold text-gray-300 hover:border-indigo-500/50 hover:bg-[#1a113d] hover:text-white transition"
                    >
                      ⚙️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          {createOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={() => setCreateOpen(false)}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <div className="relative w-full max-w-md rounded-2xl border border-white/30 bg-[#0c081d] p-8 shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
                <div className="mb-4 flex items-center justify-between border-b border-[#221740] pb-3">
                  <h2 className="text-lg font-bold text-white">Create Builder Course</h2>
                  <button onClick={() => setCreateOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Course Title</label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={200}
                      placeholder="e.g. Intro to Algorithm Design"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-3 border-t border-[#221740]">
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="rounded-xl border border-[#221740] px-4 py-2 text-xs text-white"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white">
                      Initialize Layout
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Course Details Modal */}
          {editCourseModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={() => setEditCourseModalOpen(false)}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <div className="relative w-full max-w-lg rounded-2xl border border-white/30 bg-[#0c081d] p-8 shadow-2xl shadow-black/90 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
                <div className="mb-4 flex items-center justify-between border-b border-[#221740] pb-3">
                  <h2 className="text-lg font-bold text-white">Edit Course Details</h2>
                  <button onClick={() => setEditCourseModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleUpdateCourseDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Course Title</label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={200}
                      placeholder="e.g. Intro to Algorithm Design"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe what students will learn in this course..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-sm text-white focus:outline-none"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Design">Design</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Difficulty</label>
                      <select
                        value={editDifficulty}
                        onChange={(e) => setEditDifficulty(e.target.value)}
                        className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-sm text-white focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Price (USD)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={editPriceUsd}
                        onChange={(e) => setEditPriceUsd(e.target.value)}
                        className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Publication Status</label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="editIsPublished"
                          checked={editIsPublished}
                          onChange={(e) => setEditIsPublished(e.target.checked)}
                          className="h-4 w-4 rounded border-[#221740] bg-[#120c2b] text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="editIsPublished" className="text-sm text-gray-300">Publish immediately</label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge Criteria Section */}
                  <div className="pt-4 border-t border-[#221740]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold uppercase text-gray-400">Chapter Badge Thresholds (%)</label>
                      {!editBadgeLocked ? (
                        <button
                          type="button"
                          onClick={handleLockBadgeCriteria}
                          className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-1 rounded font-bold hover:bg-amber-500/20 transition-colors"
                        >
                          🔒 Lock Criteria
                        </button>
                      ) : (
                        <span className="text-[10px] text-red-400 font-bold px-2 py-1 flex items-center gap-1">
                          🔒 Locked (Cannot change)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {["bronze", "copper", "silver", "gold", "platinum"].map((badge) => (
                        <div key={badge}>
                          <span className={`block text-[9px] font-bold uppercase mb-1 text-center ${
                            badge === 'bronze' ? 'text-orange-700' :
                            badge === 'copper' ? 'text-orange-500' :
                            badge === 'silver' ? 'text-gray-300' :
                            badge === 'gold' ? 'text-yellow-400' :
                            'text-cyan-300'
                          }`}>{badge}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={editBadgeLocked}
                            value={editBadgeCriteria[badge as keyof typeof editBadgeCriteria] || 0}
                            onChange={(e) => setEditBadgeCriteria(prev => ({...prev, [badge]: Number(e.target.value)}))}
                            className="w-full rounded-lg border border-[#221740] bg-[#120c2b] px-2 py-1.5 text-xs text-center text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-[#221740]">
                    <button
                      type="button"
                      onClick={() => setEditCourseModalOpen(false)}
                      className="rounded-xl border border-[#221740] px-4 py-2 text-xs text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCourseDetails}
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingCourseDetails ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- LAYER 2: 2D MOTION PATHWAY MAP VIEW --- */}
      {view === "pathway" && selectedCourse && (
        <main className="flex-1 flex relative overflow-hidden bg-[#07040f]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_42%,rgba(124,58,237,.22),transparent_34%),linear-gradient(135deg,#0b0718,#030107_70%)]" />
          <div
            className="absolute left-1/2 top-[54%] h-[92%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-violet-300/10 bg-[linear-gradient(rgba(139,92,246,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,.14)_1px,transparent_1px)] bg-[size:38px_38px] opacity-70"
            style={{ transform: "translate(-50%, -50%) perspective(1000px) rotateX(64deg) rotateZ(-10deg)" }}
          />
          <svg className="absolute inset-0 h-full w-full opacity-90" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
            <path d="M245 365 C 350 250, 490 425, 585 300 S 725 205, 835 260" fill="none" stroke="rgba(124,58,237,.22)" strokeWidth="58" strokeLinecap="round" />
            <path d="M245 365 C 350 250, 490 425, 585 300 S 725 205, 835 260" fill="none" stroke="rgba(165,180,252,.55)" strokeWidth="4" strokeDasharray="22 18" strokeLinecap="round" />
          </svg>

          <div className="absolute inset-0 z-0">
            {chapters.map((ch, idx) => {
              const x = 28 + idx * 25 + ch.x * 0.45;
              const y = 60 - idx * 13 - ch.z * 0.7;
              const isLocked = simulationMode === "preview" && ch.locked;
              const colors = ["from-orange-500 to-amber-600", "from-violet-500 to-indigo-600", "from-cyan-500 to-sky-700"];
              const chapterLessons = lessons.filter((item) => item.chapterId === ch.id);

              return (
                <div
                  key={ch.id}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${Math.max(18, Math.min(82, x))}%`, top: `${Math.max(18, Math.min(76, y))}%` }}
                >
                  {ch.wallType === "cloud" && (
                    <div className="absolute -left-16 top-4 h-12 w-24 rounded-full bg-white/10 blur-sm" />
                  )}
                  {ch.wallType === "wall" && (
                    <div className="absolute -left-12 top-7 h-20 w-8 rotate-12 rounded-md bg-slate-600/60 shadow-xl" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        notify({
                          title: "Chapter Locked",
                          description: "This chapter platform is locked by a barrier.",
                          tone: "warning"
                        });
                        return;
                      }
                      setActiveChapter(ch);
                    }}
                    className={`group relative grid h-32 w-44 place-items-center rounded-[52%_48%_46%_54%] border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] ${
                      isLocked
                        ? "border-white/10 bg-neutral-800 opacity-60"
                        : `border-white/20 bg-gradient-to-br ${colors[idx % colors.length]} shadow-[0_26px_50px_rgba(0,0,0,.45)]`
                    }`}
                    style={{ transform: "perspective(480px) rotateX(56deg) rotateZ(-8deg)" }}
                  >
                    <span className="absolute -inset-2 rounded-[50%] border-4 border-violet-400/20 opacity-70" />
                    <span className="relative z-10 text-xs font-black text-white" style={{ transform: "rotateZ(8deg) rotateX(-34deg)" }}>
                      {isLocked ? "LOCKED" : `CH ${idx + 1}`}
                    </span>
                  </button>
                  <div className="mt-3 max-w-44 rounded-2xl border border-white/10 bg-black/55 px-3 py-2 text-center shadow-xl backdrop-blur">
                    <p className="line-clamp-1 text-xs font-black text-white">{ch.title}</p>
                    <p className="mt-1 text-[10px] text-white/50">{chapterLessons.length} lessons</p>
                  </div>
                  <div className="absolute -top-2 left-1/2 flex -translate-x-1/2 gap-3">
                    {chapterLessons.slice(0, 4).map((item, lessonIndex) => {
                      const locked = simulationMode === "preview" && item.locked;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (locked) {
                              notify({
                                title: "Lesson Locked",
                                description: "This lesson node is currently locked.",
                                tone: "warning"
                              });
                              return;
                            }
                            void handleOpenLesson(item);
                          }}
                          className={`h-5 w-5 rounded-full border shadow-lg transition hover:scale-125 ${
                            locked ? "border-white/10 bg-zinc-500" : "border-emerald-200 bg-emerald-500"
                          }`}
                          title={item.title}
                          style={{ transform: `translateY(${lessonIndex % 2 ? 14 : 0}px)` }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overlays / Control Panel */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 max-w-xs w-full pointer-events-auto">
            <div className="rounded-2xl border border-[#221740] bg-[#0c081d]/85 backdrop-blur-md p-4 shadow-xl">
              <h2 className="text-sm font-bold text-white truncate">{selectedCourse.title}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Click a platform to view nested lesson nodes.</p>

              {/* Simulation Toggler */}
              <div className="mt-4 flex rounded-xl bg-[#120c2b] p-1 border border-[#221740]">
                <button
                  onClick={() => setSimulationMode("edit")}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    simulationMode === "edit" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Edit Coordinates
                </button>
                <button
                  onClick={() => setSimulationMode("preview")}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    simulationMode === "preview" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Preview Progress
                </button>
              </div>
            </div>

            {/* Platform Positioning Editor */}
            {simulationMode === "edit" && (
              <div className="rounded-2xl border border-[#221740] bg-[#0c081d]/85 backdrop-blur-md p-4 shadow-xl max-h-[350px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3 border-b border-[#221740] pb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Chapters Node Editor</h3>
                  <button
                    onClick={handleAddChapterNode}
                    className="text-[9px] font-bold text-white bg-indigo-600/50 hover:bg-indigo-600 px-2 py-0.5 rounded border border-indigo-500/25"
                  >
                    + Add Chapter
                  </button>
                </div>
                <div className="space-y-4">
                  {chapters.map(ch => (
                    <div key={ch.id} className="border-b border-[#221740]/50 pb-3 last:border-0 last:pb-0">
                      <p className="text-[10px] font-bold text-white truncate">{ch.title}</p>
                      <div className="grid grid-cols-3 gap-1 mt-1 text-[9px]">
                        <div>
                          <span>X position</span>
                          <input
                            type="number"
                            step="0.5"
                            value={ch.x}
                            onChange={(e) => handleUpdatePosition(ch.id, "x", Number(e.target.value))}
                            className="w-full rounded bg-[#120c2b] text-white px-1.5 py-0.5 border border-[#221740]"
                          />
                        </div>
                        <div>
                          <span>Z position</span>
                          <input
                            type="number"
                            step="0.5"
                            value={ch.z}
                            onChange={(e) => handleUpdatePosition(ch.id, "z", Number(e.target.value))}
                            className="w-full rounded bg-[#120c2b] text-white px-1.5 py-0.5 border border-[#221740]"
                          />
                        </div>
                        <div>
                          <span>Y elevation</span>
                          <input
                            type="number"
                            step="0.1"
                            value={ch.y}
                            onChange={(e) => handleUpdatePosition(ch.id, "y", Number(e.target.value))}
                            className="w-full rounded bg-[#120c2b] text-white px-1.5 py-0.5 border border-[#221740]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[9px] text-gray-400">
                        <button
                          onClick={() => handleCycleWall(ch.id)}
                          className="hover:text-white capitalize"
                        >
                          Barrier: {ch.wallType}
                        </button>
                        <button
                          onClick={() => handleToggleLock(ch.id, "chapter")}
                          className={`hover:text-white ${ch.locked ? "text-rose-400" : "text-emerald-400"}`}
                        >
                          {ch.locked ? "Locked" : "Unlocked"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Chapter/Lesson List overlay */}
          {activeChapter && (
            <div className="absolute top-4 right-4 z-10 w-64 rounded-2xl border border-[#221740] bg-[#0c081d]/85 backdrop-blur-md p-4 shadow-xl pointer-events-auto max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#221740] pb-2 mb-3">
                <h3 className="text-[11px] font-bold text-white truncate">{activeChapter.title}</h3>
                <button
                  onClick={() => setActiveChapter(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Lessons Curriculum</p>
                  <button onClick={handleAddLesson} className="text-[9px] font-bold text-white bg-emerald-600/50 hover:bg-emerald-600 px-2 py-0.5 rounded border border-emerald-500/25">
                    + Add Lesson
                  </button>
                </div>
                {lessons
                  .filter(l => l.chapterId === activeChapter.id)
                  .map(lesson => {
                    const isLocked = simulationMode === "preview" && lesson.locked;
                    return (
                      <div
                        key={lesson.id}
                        className={`rounded-xl border p-3 flex items-center justify-between gap-2 transition-all ${
                          isLocked
                            ? "border-[#221740] bg-[#110c2c]/40 opacity-60"
                            : "border-[#221740] bg-[#120c2b] hover:border-violet-500/50 cursor-pointer"
                        }`}
                        onClick={() => !isLocked && handleOpenLesson(lesson)}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{lesson.title}</p>
                          <p className="text-[9px] text-gray-400">Lesson {lesson.order_index} {lesson.is_graded && <span className="text-emerald-400 font-bold">• Graded</span>}</p>
                        </div>
                        {isLocked ? (
                          <span className="text-xs">🔒</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(lesson.id, "lesson");
                            }}
                            className="text-[9px] text-indigo-400 hover:underline"
                          >
                            Lock
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- LAYER 3: GLASSMORPHIC DRAG-AND-DROP LESSON EDITOR --- */}
      {view === "editor" && activeLesson && (
        <main className="flex-1 flex bg-[#030107] overflow-hidden">
          {/* Draggable Blocks Sidebar */}
          {editorSubView === "edit" && (
            <section className="w-64 border-r border-[#221740] bg-[#0c081d]/90 flex flex-col p-4 overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4 border-b border-[#221740] pb-2">
                Draggable Modules
              </h3>
              <div className="space-y-2.5">
                {BLOCK_TYPES.map((module) => (
                  <div
                    key={module.type}
                    draggable
                    onDragStart={() => handleSidebarDragStart(module.type)}
                    onClick={() => handleAddBlock(module.type)}
                    className="rounded-2xl border border-[#221740] bg-[#120c2b] p-3 text-xs font-semibold text-gray-300 hover:border-indigo-500/50 hover:bg-[#1a113d] hover:text-white transition flex flex-col gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-[10px] text-indigo-400 font-bold border border-indigo-500/30">
                        {module.icon}
                      </span>
                      <span>{module.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug">{module.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[10px] text-gray-400 text-center leading-relaxed">
                Drag modules onto canvas or click to add them directly.
              </p>
            </section>
          )}

          {/* Interactive Canvas */}
          <section
            className="flex-1 p-8 overflow-y-auto flex flex-col gap-6"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverIndex(blocks.length);
            }}
            onDrop={(e) => handleDropOnCanvas(e, blocks.length)}
          >
            <div className="flex items-center justify-between border-b border-[#221740] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Lesson Workspace</span>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-white">{activeLesson.title}</h1>
                  {editorSubView === "edit" && (
                    <label className="flex items-center gap-2 cursor-pointer ml-2 bg-[#120c2b] px-2 py-1 rounded-lg border border-[#221740]">
                      <input 
                        type="checkbox" 
                        checked={activeLesson.is_graded} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setActiveLesson({...activeLesson, is_graded: val});
                          const updatedLes = lessons.map(l => l.id === activeLesson.id ? {...l, is_graded: val} : l);
                          setLessons(updatedLes);
                          saveLayoutToLocalStorage(chapters, updatedLes);
                        }}
                        className="h-3 w-3 rounded border-[#221740] bg-[#120c2b] text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Graded Activity</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Mode Selector Toggle */}
                <div className="flex rounded-xl bg-[#120c2b] p-1 border border-[#221740]">
                  <button
                    onClick={() => {
                      setEditorSubView("edit");
                      setQuizAnswers({});
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      editorSubView === "edit" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Edit Mode
                  </button>
                  <button
                    onClick={() => setEditorSubView("preview")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      editorSubView === "preview" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Preview Mode
                  </button>
                </div>

                {editorSubView === "edit" && (
                  <button
                    onClick={handleSaveLessonContent}
                    disabled={savingBlock}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {savingBlock ? "Saving..." : "Save Lesson"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setView("pathway");
                    setEditorSubView("edit");
                    setQuizAnswers({});
                  }}
                  className="rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2 text-xs text-white hover:bg-[#1a113d]"
                >
                  ← Back to Map
                </button>
              </div>
            </div>

            {editorSubView === "preview" ? (
              <div className="space-y-6 max-w-2xl w-full mx-auto bg-[#0a061b]/80 border border-[#201540] rounded-3xl p-8 shadow-2xl">
                {/* Student View Mock Header */}
                <div className="border-b border-[#221740] pb-6 mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Student Course Mode</span>
                    <h2 className="text-xl font-bold text-white mt-1">{activeLesson.title}</h2>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 font-bold border border-emerald-500/30">
                    ✓ Active
                  </span>
                </div>

                {blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-400">No content modules inside this lesson yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {blocks.map((block) => {
                      return (
                        <div key={block.id} className="transition-all duration-300">
                          {/* Heading Block Preview */}
                          {block.type === "heading" && (
                            (() => {
                              const level = block.properties.level || 2;
                              if (level === 1) return <h1 className="text-2xl font-bold text-white border-b border-[#221740]/60 pb-2 mt-4">{block.content}</h1>;
                              if (level === 3) return <h3 className="text-base font-bold text-gray-200 mt-2">{block.content}</h3>;
                              return <h2 className="text-xl font-bold text-white mt-3">{block.content}</h2>;
                            })()
                          )}

                          {/* Paragraph Block Preview */}
                          {block.type === "paragraph" && (
                            <p 
                              className="text-sm text-gray-300 leading-relaxed"
                              style={{ textAlign: block.properties.align || "left" }}
                            >
                              {block.content}
                            </p>
                          )}

                          {/* Code Block Preview */}
                          {block.type === "code" && (
                            <div className="relative group">
                              <span className="absolute top-2.5 right-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">code preview</span>
                              <pre className="bg-[#030107] border border-[#221740] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                                <code>{block.content}</code>
                              </pre>
                            </div>
                          )}

                          {/* Image Block Preview */}
                          {block.type === "image" && (
                            block.content && block.content.startsWith("http") ? (
                              <div className="rounded-2xl overflow-hidden border border-[#221740] bg-black/40 flex items-center justify-center max-h-[400px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={block.content} alt="Lesson visual module" className="max-h-[400px] object-contain w-full" />
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#221740] p-4 text-center text-xs text-gray-500 italic">
                                [Image visual placeholder - edit URL to display]
                              </div>
                            )
                          )}

                          {/* Video Block Preview */}
                          {block.type === "video" && (
                            block.content && block.content.startsWith("http") ? (
                              <div className="rounded-2xl overflow-hidden border border-[#221740] bg-black/40">
                                <video src={block.content} controls className="w-full max-h-[350px] object-contain" />
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#221740] p-4 text-center text-xs text-gray-500 italic">
                                [Video player placeholder - edit URL to display]
                              </div>
                            )
                          )}

                          {/* Embed Block Preview */}
                          {block.type === "embed" && (
                            block.content && block.content.startsWith("http") ? (
                              <iframe src={block.content} className="w-full h-80 rounded-2xl border border-[#221740] shadow-md" />
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#221740] p-4 text-center text-xs text-gray-500 italic">
                                [Iframe link preview placeholder - edit URL to display]
                              </div>
                            )
                          )}

                          {/* URL Card Preview */}
                          {block.type === "url" && (
                            block.content && typeof block.content === "string" && block.content.startsWith("http") ? (
                              <a
                                href={block.content}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-3xl border border-[#221740] bg-[#0c081d]/80 p-5 transition hover:border-indigo-500/60"
                              >
                                <p className="text-sm font-semibold text-white mb-2">Link Preview</p>
                                <p className="text-xs text-gray-400 truncate">{block.content}</p>
                              </a>
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#221740] p-4 text-center text-xs text-gray-500 italic">
                                [Link card placeholder - edit URL to display]
                              </div>
                            )
                          )}

                          {/* Callout Block Preview */}
                          {block.type === "callout" && (
                            <div className="bg-indigo-500/10 border-l-4 border-indigo-500 p-4 rounded-r-xl flex gap-3 items-start">
                              <span className="text-lg">💡</span>
                              <p className="text-sm text-gray-300 font-medium leading-relaxed">{block.content}</p>
                            </div>
                          )}

                          {/* Quote Block Preview */}
                          {block.type === "quote" && (
                            <div className="rounded-3xl border border-[#221740] bg-[#120c2b]/70 p-5">
                              <p className="text-lg italic text-white">“{block.content}”</p>
                              {block.properties.author ? (
                                <p className="mt-3 text-sm font-semibold text-indigo-300">— {block.properties.author}</p>
                              ) : null}
                            </div>
                          )}

                          {/* Resource Block Preview */}
                          {block.type === "resource" && (
                            <div className="rounded-3xl border border-[#221740] bg-[#0c081d]/80 p-6">
                              <p className="text-sm font-semibold text-indigo-300 mb-2">{block.properties.title || "Resource"}</p>
                              <p className="text-sm text-gray-300 leading-relaxed mb-4">{block.content}</p>
                              {block.content && block.content.startsWith("http") && (
                                <a
                                  href={block.content}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-200"
                                >
                                  Open resource
                                </a>
                              )}
                            </div>
                          )}

                          {/* Activity Block Preview */}
                          {block.type === "activity" && (
                            <div className="rounded-3xl border border-[#221740] bg-[#0b0821]/80 p-6">
                              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                                <span className="rounded-full bg-violet-500/10 px-3 py-1">Activity</span>
                                <span className="text-xs text-gray-400">{block.properties.duration || 10} min</span>
                              </div>
                              <p className="mt-4 text-sm text-gray-300 leading-relaxed">{block.content}</p>
                              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                                <span>Type:</span>
                                <span className="rounded-full bg-[#1d1338] px-2 py-1">{block.properties.activityType || "task"}</span>
                              </div>
                            </div>
                          )}

                          {/* Quiz Block Preview */}
                          {block.type === "quiz" && (
                            <div className="rounded-3xl border border-[#221740] bg-[#0b0821]/80 p-6">
                              <h3 className="text-lg font-bold text-white mb-3">{block.content}</h3>
                              <div className="grid gap-3">
                                {(block.properties.options || []).map((opt: string, oIdx: number) => {
                                  const isSelected = quizAnswers[block.id] === opt;
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [block.id]: opt }))}
                                      className={`w-full text-left rounded-xl border px-4 py-3 text-xs font-semibold transition ${
                                        isSelected
                                          ? "bg-indigo-600 border-indigo-500 text-white"
                                          : "border-[#221740] bg-[#120c2b] text-gray-300 hover:border-violet-500/40 hover:text-white"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {quizAnswers[block.id] && (
                                <div className={`mt-4 p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                  quizAnswers[block.id] === block.properties.answer
                                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                    : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                                }`}>
                                  <span>{quizAnswers[block.id] === block.properties.answer ? "✅" : "❌"}</span>
                                  <span>
                                    {quizAnswers[block.id] === block.properties.answer
                                      ? "Correct! You selected the right answer."
                                      : `Incorrect. Correct answer: ${block.properties.answer}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Divider Block Preview */}
                          {block.type === "divider" && (
                            <div className="border-t border-[#221740]/60 my-4 w-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : blocks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#221740] rounded-2xl py-24 text-center">
                <p className="font-semibold text-gray-300">Drag or click blocks to begin drafting content.</p>
                <p className="text-xs text-gray-400 mt-1">Image, video, iframe, headers, markdown support included.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl w-full mx-auto">
                {blocks.map((block, idx) => {
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleBlockDragStart(block.id)}
                      onDragEnd={() => setDraggingBlock(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverIndex(idx);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleBlockDrop(idx);
                      }}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative rounded-2xl border p-5 backdrop-blur-md shadow-xl transition-all duration-300 ${
                        isSelected
                          ? "border-violet-500 bg-[#160e33]/70 ring-1 ring-violet-500/30"
                          : "border-[#221740] bg-[#0c081d]/50 hover:border-violet-500/30"
                      } ${dragOverIndex === idx ? "border-dashed border-violet-400 bg-[#1d113f]/70" : ""}`}
                    >
                      {/* Floating Toolbar on Selected Card */}
                      {isSelected && (
                        <div className="absolute -top-3.5 right-4 z-10 flex gap-1 bg-[#120c2b] border border-violet-500 rounded-lg p-0.5 shadow-lg">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveBlock(idx, "up")}
                            className="h-6 px-2 text-[9px] font-bold text-gray-300 hover:text-white hover:bg-[#1e1347] rounded disabled:opacity-30"
                          >
                            ▲ Up
                          </button>
                          <button
                            disabled={idx === blocks.length - 1}
                            onClick={() => handleMoveBlock(idx, "down")}
                            className="h-6 px-2 text-[9px] font-bold text-gray-300 hover:text-white hover:bg-[#1e1347] rounded disabled:opacity-30"
                          >
                            ▼ Down
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="h-6 px-2 text-[9px] font-bold text-rose-400 hover:text-white hover:bg-rose-600 rounded"
                          >
                            ✕ Delete
                          </button>
                        </div>
                      )}

                      {/* Header block render */}
                      {block.type === "heading" && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          className="w-full bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b focus:border-violet-500 pb-1"
                        />
                      )}

                      {/* Paragraph block render */}
                      {block.type === "paragraph" && (
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          className="w-full bg-transparent text-sm text-gray-300 focus:outline-none focus:border-b focus:border-violet-500 resize-y"
                        />
                      )}

                      {/* Code Block render */}
                      {block.type === "code" && (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full bg-[#030107] text-xs font-mono text-emerald-400 p-3 rounded-lg border border-[#221740] focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      )}

                      {/* Image render inline */}
                      {block.type === "image" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Image URL</label>
                          <input
                            type="text"
                            placeholder="Paste image link here..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          {block.content && block.content.startsWith("http") ? (
                            <div className="rounded-xl overflow-hidden border border-[#221740] bg-black/40 max-h-[300px] flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={block.content} alt="Preview inline" className="max-h-[300px] object-contain" />
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No image URL pasted yet.</p>
                          )}
                        </div>
                      )}

                      {/* Video render inline */}
                      {block.type === "video" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Video URL (direct mp4 or stream link)</label>
                          <input
                            type="text"
                            placeholder="Paste video link here..."
                            value={typeof block.content === "string" ? block.content : ""}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          {typeof block.content === "string" && block.content.startsWith("http") ? (
                            <div className="rounded-xl overflow-hidden border border-[#221740] bg-black/40 max-h-[300px]">
                              <video src={block.content} controls className="w-full max-h-[300px] object-contain" />
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No video URL pasted yet.</p>
                          )}
                        </div>
                      )}

                      {/* URL embed iframe inline */}
                      {block.type === "embed" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Embed URL (Iframe window)</label>
                          <input
                            type="text"
                            placeholder="Paste website link here..."
                            value={typeof block.content === "string" ? block.content : ""}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          {typeof block.content === "string" && block.content.startsWith("http") ? (
                            <iframe src={block.content} className="w-full h-80 rounded-xl border border-[#221740]" />
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No URL embed pasted yet.</p>
                          )}
                        </div>
                      )}

                      {/* URL Link Card inline */}
                      {block.type === "url" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Link URL</label>
                          <input
                            type="text"
                            placeholder="Paste link here..."
                            value={typeof block.content === "string" ? block.content : ""}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          {typeof block.content === "string" && block.content.startsWith("http") ? (
                            <a href={block.content} target="_blank" rel="noreferrer" className="block rounded-xl border border-[#221740] bg-[#0a061b]/80 p-4 text-xs text-indigo-300 hover:border-indigo-500 transition">
                              {block.content}
                            </a>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No URL provided yet.</p>
                          )}
                        </div>
                      )}

                      {/* Resource block */}
                      {block.type === "resource" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Resource Title</label>
                          <input
                            type="text"
                            placeholder="Resource title"
                            value={block.properties.title || ""}
                            onChange={(e) => handleUpdateBlockProp(block.id, "title", e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Resource Link</label>
                          <input
                            type="text"
                            placeholder="Paste resource URL here..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Description</label>
                          <textarea
                            rows={2}
                            value={block.content && block.content.startsWith("http") ? block.properties.description || "" : block.properties.description || ""}
                            onChange={(e) => handleUpdateBlockProp(block.id, "description", e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      )}

                      {/* Activity block */}
                      {block.type === "activity" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Activity instructions</label>
                          <textarea
                            rows={3}
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Duration (minutes)</label>
                              <input
                                type="number"
                                min="1"
                                value={block.properties.duration || 10}
                                onChange={(e) => handleUpdateBlockProp(block.id, "duration", Number(e.target.value))}
                                className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Activity type</label>
                              <select
                                value={block.properties.activityType || "task"}
                                onChange={(e) => handleUpdateBlockProp(block.id, "activityType", e.target.value)}
                                className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                              >
                                <option value="task">Task</option>
                                <option value="exercise">Exercise</option>
                                <option value="project">Project</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Callout box */}
                      {block.type === "callout" && (
                        <div className="bg-indigo-500/10 border-l-4 border-indigo-500 p-3 rounded-r-xl">
                          <textarea
                            rows={2}
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-300 focus:outline-none focus:border-b focus:border-violet-500 resize-none font-medium"
                          />
                        </div>
                      )}

                      {/* Quiz Multiple Choice */}
                      {block.type === "quiz" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Quiz Question</label>
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none focus:border-b focus:border-violet-500 pb-1"
                          />
                          <div className="space-y-2">
                            {(block.properties.options || []).map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...(block.properties.options || [])];
                                    opts[oIdx] = e.target.value;
                                    handleUpdateBlockProp(block.id, "options", opts);
                                  }}
                                  className="flex-1 rounded-lg border border-[#221740] bg-[#120c2b] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBlockProp(block.id, "answer", opt)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition ${
                                    block.properties.answer === opt
                                      ? "bg-emerald-600 text-white"
                                      : "border border-[#221740] text-gray-400 hover:text-white"
                                  }`}
                                >
                                  Correct
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      {block.type === "divider" && (
                        <div className="border-t border-[#221740] my-3 w-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Selected Block properties sidebar */}
          {editorSubView === "edit" && (
            <section className="w-64 border-l border-[#221740] bg-[#0c081d]/90 flex flex-col p-4 overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4 border-b border-[#221740] pb-2">
                Block Properties
              </h3>
              {selectedBlockId ? (
                (() => {
                  const sel = blocks.find(b => b.id === selectedBlockId);
                  if (!sel) return <p className="text-xs text-gray-400 italic">No block selected.</p>;
                  return (
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Block Type</span>
                        <p className="mt-1 font-mono font-bold capitalize text-white bg-[#120c2b] border border-[#221740] px-2.5 py-1.5 rounded-lg">
                          {sel.type}
                        </p>
                      </div>

                      {/* Conditional properties based on type */}
                      {sel.type === "heading" && (
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Heading Level</span>
                          <select
                            value={sel.properties.level || 2}
                            onChange={(e) => handleUpdateBlockProp(sel.id, "level", Number(e.target.value))}
                            className="w-full mt-1.5 rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-white outline-none"
                          >
                            <option value={1}>H1 Title</option>
                            <option value={2}>H2 Section</option>
                            <option value={3}>H3 Subsection</option>
                          </select>
                        </div>
                      )}

                      {sel.type === "paragraph" && (
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Alignment</span>
                          <div className="flex gap-1 mt-1.5">
                            {["left", "center", "right"].map(align => (
                              <button
                                key={align}
                                onClick={() => handleUpdateBlockProp(sel.id, "align", align)}
                                className={`flex-1 text-center py-1.5 border rounded-lg capitalize ${
                                  sel.properties.align === align ? "bg-indigo-600 border-indigo-600 text-white" : "border-[#221740] text-gray-400"
                                }`}
                              >
                                {align}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {sel.type === "quiz" && (
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Add quiz options</span>
                          <button
                            onClick={() => {
                              const opts = [...(sel.properties.options || []), `Option ${(sel.properties.options || []).length + 1}`];
                              handleUpdateBlockProp(sel.id, "options", opts);
                            }}
                            className="w-full mt-2 rounded-xl bg-indigo-600/30 border border-indigo-500/20 py-2 text-[10px] font-bold text-white hover:bg-indigo-600"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Layout ID</span>
                        <p className="mt-1 font-mono text-[10px] text-gray-500 bg-[#06040f] p-1.5 rounded border border-[#221740] truncate select-all">
                          {sel.id}
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-gray-400 italic">Select any block on the canvas to configure properties.</p>
              )}
            </section>
          )}
        </main>
      )}

      {/* Double Confirm Modal */}
      <DoubleConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmModalOpen(false);
        }}
        title={confirmModalTitle}
        description={confirmModalDesc}
        confirmWord={confirmWord}
        danger={true}
      />
    </div>
  );
}
