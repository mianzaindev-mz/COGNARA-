"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NotebookPanel } from "@/components/notebook/NotebookPanel";
import { createNotebookWithFirstPage } from "@/lib/notebook/create-notebook";

type Notebook = {
  id: string;
  student_id: string;
  title: string;
  course_id: string | null;
  created_at: string;
  updated_at: string;
};

type NotebookPageType = {
  id: string;
  notebook_id: string;
  title: string;
  content_text: string;
  content_canvas: any;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export default function NotebookDashboard() {
  const searchParams = useSearchParams();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [pages, setPages] = useState<NotebookPageType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Navigation & UI States
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});
  
  // Rename edit states
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Initial Load: Fetch current user & notebooks + pages
  useEffect(() => {
    async function loadWorkspaceData() {
      setLoading(true);
      try {
        const supabase = createClient();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        // Fetch all notebooks for this user
        const { data: notebooksData } = await supabase
          .from("notebooks")
          .select("*")
          .eq("student_id", user.id)
          .order("updated_at", { ascending: false });

        if (notebooksData) {
          // Deduplicate notebooks by ID to prevent React key collisions
          const uniqueNotebooks = Array.from(new Map(notebooksData.map((n: any) => [n.id, n])).values()) as Notebook[];
          setNotebooks(uniqueNotebooks);
          
          // Expand the first notebook by default
          const requestedNotebookId = searchParams.get("notebook");
          const requestedNotebook = requestedNotebookId
            ? uniqueNotebooks.find((notebook) => notebook.id === requestedNotebookId)
            : null;
          const defaultNotebook = requestedNotebook || uniqueNotebooks[0];

          if (defaultNotebook) {
            setExpandedNotebooks((prev) => ({
              ...prev,
              [defaultNotebook.id]: true,
            }));
            setActiveNotebookId(defaultNotebook.id);
          }
        }

        // Fetch all notebook pages
        const { data: pagesData } = await supabase
          .from("notebook_pages")
          .select("*")
          .order("order_index", { ascending: true });

        if (pagesData) {
          // Deduplicate pages by ID to prevent React key collisions
          const uniquePages = Array.from(new Map(pagesData.map((p: any) => [p.id, p])).values()) as NotebookPageType[];
          setPages(uniquePages);

          const requestedPageId = searchParams.get("page");
          const requestedPage = requestedPageId
            ? uniquePages.find((page) => page.id === requestedPageId)
            : null;

          if (requestedPage) {
            setActiveNotebookId(requestedPage.notebook_id);
            setExpandedNotebooks((prev) => ({ ...prev, [requestedPage.notebook_id]: true }));
            setActivePageId(requestedPage.id);
          }
        }
      } catch (err) {
        console.error("Error loading notebooks dashboard:", err);
        setActionError(err instanceof Error ? err.message : "Notebook workspace could not load.");
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspaceData();
  }, [searchParams]);

  // 2. Notebook Management Operations
  const createNotebook = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const result = await createNotebookWithFirstPage();
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Notebook storage is not connected. Check Supabase environment settings.");
      }

      const [{ data: notebookData, error: notebookError }, { data: pageData, error: pageError }] = await Promise.all([
        supabase.from("notebooks").select("*").eq("id", result.notebookId).single(),
        result.pageId
          ? supabase.from("notebook_pages").select("*").eq("id", result.pageId).single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (notebookError || !notebookData) {
        throw new Error(notebookError?.message || "Created notebook could not be loaded.");
      }

      setNotebooks((prev) => [notebookData, ...prev.filter((notebook) => notebook.id !== notebookData.id)]);
      setActiveNotebookId(notebookData.id);
      setExpandedNotebooks((prev) => ({ ...prev, [notebookData.id]: true }));

      if (pageError) throw new Error(pageError.message);
      if (pageData) {
        setPages((prev) => [...prev.filter((page) => page.id !== pageData.id), pageData]);
        setActivePageId(pageData.id);
      }
    } catch (e) {
      console.error(e);
      setActionError(e instanceof Error ? e.message : "Notebook could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const updateNotebookTitle = useCallback(async (id: string, newTitle: string) => {
    const titleVal = newTitle.trim() || "Untitled Notebook";
    // Optimistic update
    setNotebooks((prev) => prev.map((n) => (n.id === id ? { ...n, title: titleVal } : n)));
    setEditingNotebookId(null);

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase
          .from("notebooks")
          .update({ title: titleVal, updated_at: new Date().toISOString() })
          .eq("id", id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteNotebook = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this notebook? All pages inside it will be lost permanently.")) {
      return;
    }
    
    // Optimistic update
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
    setPages((prev) => prev.filter((p) => p.notebook_id !== id));
    
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
      setActivePageId(null);
    }

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("notebook_pages").delete().eq("notebook_id", id);
        await supabase.from("notebooks").delete().eq("id", id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeNotebookId]);

  // 3. Notebook Page Management Operations
  const createPage = useCallback(async (notebookId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) return;

      const notebookPages = pages.filter((p) => p.notebook_id === notebookId);
      const nextIndex = notebookPages.length;

      const { data, error } = await supabase
        .from("notebook_pages")
        .insert({
          notebook_id: notebookId,
          title: `Page ${nextIndex + 1}`,
          content_text: "Welcome to your upgraded notebook page!",
          content_canvas: {
            mode: "modular",
            bgType: "ruled",
            modular_blocks: [
              {
                id: `b-${Math.random().toString(36).substr(2, 9)}`,
                type: "heading",
                content: `Notes Page ${nextIndex + 1}`,
                properties: { level: 2 },
                createdAt: new Date().toISOString(),
                lastEditedAt: new Date().toISOString(),
              },
              {
                id: `b-${Math.random().toString(36).substr(2, 9)}`,
                type: "text",
                content: "Click to write or sketch on the canvas.",
                createdAt: new Date().toISOString(),
                lastEditedAt: new Date().toISOString(),
              }
            ],
            freehand_strokes: [],
            freehand_annotations: [],
          },
          order_index: nextIndex,
        })
        .select()
        .single();

      if (data && !error) {
        setPages((prev) => [...prev, data]);
        setActivePageId(data.id);
        setActiveNotebookId(notebookId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [pages, isSubmitting]);

  const updatePageTitle = useCallback(async (id: string, newTitle: string) => {
    const titleVal = newTitle.trim() || "Untitled Page";
    // Optimistic update
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, title: titleVal } : p)));
    setEditingPageId(null);

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase
          .from("notebook_pages")
          .update({ title: titleVal, updated_at: new Date().toISOString() })
          .eq("id", id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deletePage = useCallback(async (id: string) => {
    if (!confirm("Delete this page?")) return;
    
    // Optimistic update
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (activePageId === id) {
      setActivePageId(null);
    }

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("notebook_pages").delete().eq("id", id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activePageId]);

  // Expand or collapse notebook pages in sidebar
  const toggleNotebookExpand = (id: string) => {
    setExpandedNotebooks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setActiveNotebookId(id);
  };

  // 4. Searching & Filtering
  const filteredNotebooks = notebooks.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === "all" || n.course_id === courseFilter;
    return matchesSearch && matchesCourse;
  });

  // Extract unique courses from notebooks to fill filters dropdown
  const coursesList = Array.from(
    new Set(notebooks.map((n) => n.course_id).filter(Boolean))
  );

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);
  const activePage = pages.find((p) => p.id === activePageId);

  // Sorting Pages by order index
  const getNotebookPages = (notebookId: string) => {
    return pages
      .filter((p) => p.notebook_id === notebookId)
      .sort((a, b) => a.order_index - b.order_index);
  };

  // Recent Pages for dashboard home
  const recentPages = [...pages]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cn-orange border-t-transparent" />
          <p className="text-sm font-semibold text-cn-ink-muted">Loading COGNARA Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8.5rem)] relative overflow-hidden">
      {/* ─── Sidebar: Notebooks & Pages Manager ────────────────────────── */}
      <aside className="w-80 shrink-0 flex flex-col border border-cn-border/50 bg-white/70 backdrop-blur-md rounded-[2rem] p-5 shadow-sm dark:bg-[#1a1816]/70 dark:border-stone-850 h-full overflow-hidden select-none">
        
        {/* Hub Title */}
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-cn-ink tracking-tight dark:text-neutral-200">Notes Library</h2>
          <p className="text-[11px] text-cn-ink-muted leading-tight">Manage blocks, sketches, and AI-assisted logs.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
              <SearchIcon className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-cn-border bg-stone-50/50 outline-none focus:ring-1 focus:ring-cn-orange focus:border-cn-orange dark:bg-stone-900/50 dark:border-stone-800 dark:text-neutral-200"
            />
          </div>

          {coursesList.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-[11px] font-bold rounded-xl border border-cn-border bg-white dark:bg-stone-900 dark:border-stone-800 outline-none focus:ring-1 focus:ring-cn-orange focus:border-cn-orange text-cn-ink-muted"
            >
              <option value="all">All Courses</option>
              {coursesList.map((cId) => {
                const associatedNotebook = notebooks.find((n) => n.course_id === cId);
                return (
                  <option key={cId} value={cId || ""}>
                    {associatedNotebook ? associatedNotebook.title.replace(" Notebook", "") : `Course ID: ${cId}`}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Notebooks List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
          {filteredNotebooks.length === 0 ? (
            <div className="py-8 text-center text-xs text-cn-ink-subtle italic">No notebooks found.</div>
          ) : (
            filteredNotebooks.map((nb) => {
              const isExpanded = expandedNotebooks[nb.id];
              const isEditing = editingNotebookId === nb.id;
              const nbPages = getNotebookPages(nb.id);

              return (
                <div key={nb.id} className="group flex flex-col rounded-2xl overflow-hidden border border-transparent hover:border-cn-border/30 transition">
                  {/* Notebook header tab */}
                  <div
                    onClick={() => toggleNotebookExpand(nb.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                      activeNotebookId === nb.id
                        ? "bg-cn-orange/10 text-cn-orange font-bold"
                        : "text-cn-ink-muted hover:bg-neutral-50 dark:hover:bg-stone-900"
                    }`}
                  >
                    <ChevronIcon className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    <NotebookIcon className="h-4 w-4 shrink-0" />
                    
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onBlur={() => updateNotebookTitle(nb.id, editTitleValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updateNotebookTitle(nb.id, editTitleValue);
                            if (e.key === "Escape") setEditingNotebookId(null);
                          }}
                          className="w-full rounded bg-white px-1 py-0.5 text-xs text-cn-ink outline-none border border-cn-orange dark:bg-stone-850"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="block truncate text-xs font-bold">{nb.title}</span>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNotebookId(nb.id);
                            setEditTitleValue(nb.title);
                          }}
                          className="p-1 rounded text-cn-ink-subtle hover:bg-stone-200/50 dark:hover:bg-stone-800"
                          title="Rename Notebook"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteNotebook(nb.id);
                          }}
                          className="p-1 rounded text-cn-ink-subtle hover:text-red-500 hover:bg-red-500/10"
                          title="Delete Notebook"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Indented Pages list */}
                  {isExpanded && (
                    <div className="ml-5 mt-1 border-l border-neutral-200 pl-3.5 space-y-1 dark:border-stone-800">
                      {nbPages.map((page) => {
                        const isPageEditing = editingPageId === page.id;
                        return (
                          <div
                            key={page.id}
                            onClick={() => setActivePageId(page.id)}
                            className={`group/page flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-[11px] transition ${
                              activePageId === page.id
                                ? "bg-stone-150 text-cn-ink font-bold dark:bg-stone-850 dark:text-white"
                                : "text-cn-ink-muted hover:bg-neutral-50 dark:hover:bg-stone-900"
                            }`}
                          >
                            <PageIcon className="h-3 w-3 shrink-0 text-stone-400" />
                            <div className="min-w-0 flex-1">
                              {isPageEditing ? (
                                <input
                                  autoFocus
                                  value={editTitleValue}
                                  onChange={(e) => setEditTitleValue(e.target.value)}
                                  onBlur={() => updatePageTitle(page.id, editTitleValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") updatePageTitle(page.id, editTitleValue);
                                    if (e.key === "Escape") setEditingPageId(null);
                                  }}
                                  className="w-full rounded bg-white px-1 text-xs text-cn-ink outline-none border border-cn-orange dark:bg-stone-850"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="block truncate font-medium">{page.title}</span>
                              )}
                            </div>

                            {!isPageEditing && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/page:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPageId(page.id);
                                    setEditTitleValue(page.title);
                                  }}
                                  className="p-0.5 rounded text-cn-ink-subtle hover:bg-stone-200/50 dark:hover:bg-stone-800"
                                  title="Rename Page"
                                >
                                  <PencilIcon className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void deletePage(page.id);
                                  }}
                                  className="p-0.5 rounded text-cn-ink-subtle hover:text-red-500 hover:bg-red-500/10"
                                  title="Delete Page"
                                >
                                  <TrashIcon className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => void createPage(nb.id)}
                        className="w-full text-left flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-cn-orange hover:bg-cn-orange/5 rounded-lg transition"
                      >
                        <PlusIcon className="h-2.5 w-2.5" />
                        Add page
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* New Notebook Button */}
        {actionError && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-red-500">
            {actionError}
          </div>
        )}
        <button
          type="button"
          onClick={() => void createNotebook()}
          disabled={isSubmitting}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-cn-orange px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-cn-orange-hover disabled:opacity-50 select-none shrink-0"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Create Notebook
        </button>
      </aside>

      {/* ─── Main Content Display Workspace ────────────────────────────── */}
      <main className="flex-1 min-w-0 h-full">
        {activePageId && userId ? (
          <NotebookPanel
            key={activePageId}
            studentId={userId}
            selectedPageId={activePageId}
            courseTitle={activeNotebook?.title || "COGNARA Notebook"}
            lessonTitle={activePage?.title || "Untitled Page"}
          />
        ) : (
          /* Empty / Welcome Workspace Dashboard */
          <div className="flex h-full flex-col justify-between rounded-[2.5rem] border border-cn-border/50 bg-white p-10 dark:bg-[#1a1816] dark:border-stone-850 shadow-sm relative overflow-y-auto">
            
            {/* Top glass welcome gradient */}
            <div className="space-y-6">
              <div className="relative rounded-[2rem] bg-gradient-to-r from-cn-orange/10 to-indigo-500/10 p-8 overflow-hidden border border-cn-border/30 dark:from-cn-orange/5 dark:to-indigo-500/5">
                <div className="relative z-10 max-w-xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cn-orange bg-cn-orange/10 dark:bg-cn-orange/20 px-3 py-1 rounded-full">
                    COGNARA Studio Pro™
                  </span>
                  <h1 className="mt-3 text-3xl font-black text-cn-ink tracking-tight dark:text-white leading-tight">
                    Your Infinite Creative Space
                  </h1>
                  <p className="mt-2 text-xs text-cn-ink-muted leading-relaxed">
                    Welcome to the next generation of study notes. Switch seamlessly between modular blocks writing, 
                    infinite canvas sketching, and a streaming artificial intelligence study agent.
                  </p>
                </div>
                {/* Background decorative blob */}
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-cn-orange/20 to-transparent opacity-60 pointer-events-none" />
              </div>

              {/* Core Features Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-stone-50 border border-cn-border/40 hover:border-cn-orange/20 transition dark:bg-stone-900/50 dark:border-stone-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cn-orange/10 text-cn-orange mb-3">
                    📓
                  </div>
                  <h3 className="text-xs font-extrabold text-cn-ink dark:text-neutral-200">Notion-Style Blocks</h3>
                  <p className="mt-1 text-[11px] text-cn-ink-muted leading-snug">
                    headings, nested checklists, LaTeX math equations, code fragments, tables, and embeds. Type <span className="font-bold text-cn-orange">/</span>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-stone-50 border border-cn-border/40 hover:border-cn-orange/20 transition dark:bg-stone-900/50 dark:border-stone-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-3">
                    🎨
                  </div>
                  <h3 className="text-xs font-extrabold text-cn-ink dark:text-neutral-200">Infinite Freehand Sketching</h3>
                  <p className="mt-1 text-[11px] text-cn-ink-muted leading-snug">
                    Vector brush strokes, shape tools, text elements, lasso movements, customizable paper grids, and spacebar panning.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-stone-50 border border-cn-border/40 hover:border-cn-orange/20 transition dark:bg-stone-900/50 dark:border-stone-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-3">
                    🤖
                  </div>
                  <h3 className="text-xs font-extrabold text-cn-ink dark:text-neutral-200">AI Assistant Agent</h3>
                  <p className="mt-1 text-[11px] text-cn-ink-muted leading-snug">
                    Inline assistance prompts like <span className="font-bold text-emerald-500">/explain</span>, <span className="font-bold text-emerald-500">/summarize</span>, or <span className="font-bold text-emerald-500">/quiz me</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom: Recent Pages Shortcut */}
            {recentPages.length > 0 && (
              <div className="mt-8 border-t border-cn-border/40 pt-6">
                <h4 className="text-xs font-bold text-cn-ink dark:text-neutral-200 mb-3">Recently Updated Pages</h4>
                <div className="flex flex-wrap gap-3">
                  {recentPages.map((page) => {
                    const nb = notebooks.find((n) => n.id === page.notebook_id);
                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => {
                          setActiveNotebookId(page.notebook_id);
                          setExpandedNotebooks((prev) => ({ ...prev, [page.notebook_id]: true }));
                          setActivePageId(page.id);
                        }}
                        className="flex items-center gap-2.5 px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-cn-border/50 rounded-xl transition text-left text-xs text-cn-ink dark:bg-stone-900 dark:border-stone-800 dark:hover:bg-stone-850"
                      >
                        <NotebookIcon className="h-3.5 w-3.5 text-cn-orange shrink-0" />
                        <div className="min-w-0">
                          <span className="block truncate font-bold text-cn-ink dark:text-neutral-200">{page.title}</span>
                          <span className="block text-[10px] text-cn-ink-subtle">{nb?.title || "Notebook"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
    </svg>
  );
}

function NotebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M8.25 21h8.25a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H8.25A2.25 2.25 0 006 6.75v12A2.25 2.25 0 008.25 21z"
      />
    </svg>
  );
}

function PageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M8.25 21h8.25a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H8.25A2.25 2.25 0 006 6.75v12A2.25 2.25 0 008.25 21z"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}
