"use client";

import React, { useState, useEffect, useRef } from "react";
import { Block, ModularCanvas } from "./ModularCanvas";
import { CanvasStroke, CanvasAnnotation, FreehandCanvas } from "./FreehandCanvas";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { createClient } from "@/lib/supabase/client";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";
import { useToast } from "@/components/ui/toast-provider";

interface NotebookPanelProps {
  studentId: string;
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  courseTitle?: string;
  selectedPageId?: string;
  videoPlayer?: {
    getCurrentTime: () => number;
    seekTo: (time: number) => void;
    isPlaying: () => boolean;
  };
}

interface PageVersion {
  timestamp: string;
  modular_blocks: Block[];
  freehand_strokes: CanvasStroke[];
  freehand_annotations: CanvasAnnotation[];
}

export function NotebookPanel({
  studentId,
  courseId,
  lessonId,
  lessonTitle,
  courseTitle,
  selectedPageId,
  videoPlayer,
}: NotebookPanelProps) {
  const { notify } = useToast();
  // Tabs State
  const [activeTab, setActiveTab] = useState<"modular" | "freehand" | "assistant" | "history">("modular");
  
  // Note Data States
  const [pageId, setPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [annotations, setAnnotations] = useState<CanvasAnnotation[]>([]);
  const [bgType, setBgType] = useState<"blank" | "dot" | "ruled" | "graph">("ruled");
  
  // Loading & Saving States
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  
  // Version history stack
  const [historyVersions, setHistoryVersions] = useState<PageVersion[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [versionToRevert, setVersionToRevert] = useState<PageVersion | null>(null);

  // References for debounced save
  const dataRef = useRef({ blocks, strokes, annotations, activeTab, bgType });
  dataRef.current = { blocks, strokes, annotations, activeTab, bgType };

  // Fetch or initialize page from Supabase
  useEffect(() => {
    async function loadNotebookData() {
      if (!studentId) return;
      setLoading(true);
      try {
        const supabase = createClient();
        if (!supabase) return;

        // Mode B: Direct Page Context
        if (selectedPageId) {
          setPageId(selectedPageId);
          const { data: page, error: pageErr } = await supabase
            .from("notebook_pages")
            .select("id, content_canvas, content_text")
            .eq("id", selectedPageId)
            .maybeSingle();

          if (pageErr) throw pageErr;
          if (page) {
            const canvasData = page.content_canvas as any;
            if (canvasData) {
              setBlocks(canvasData.modular_blocks || []);
              setStrokes(canvasData.freehand_strokes || []);
              setAnnotations(canvasData.freehand_annotations || []);
              setBgType(canvasData.bgType || "ruled");
              if (canvasData.mode === "freehand") {
                setActiveTab("freehand");
              }
            }
          } else {
            // fallback/reset if page not found
            setBlocks([]);
            setStrokes([]);
            setAnnotations([]);
          }
          setLoading(false);
          return;
        }

        // Mode A: Lesson Context
        if (!courseId || !lessonId) {
          setLoading(false);
          return;
        }

        // Fetch or create notebook for this student & course
        const { data: notebooks, error: notebookErr } = await supabase
          .from("notebooks")
          .select("id")
          .eq("student_id", studentId)
          .eq("course_id", courseId)
          .limit(1);

        if (notebookErr) throw notebookErr;

        let activeNotebook = notebooks && notebooks.length > 0 ? notebooks[0] : null;

        if (!activeNotebook) {
          const { data: newNotebook, error: createNotebookErr } = await supabase
            .from("notebooks")
            .insert({
              student_id: studentId,
              course_id: courseId,
              title: `${courseTitle || "Course"} Notebook`,
            })
            .select("id")
            .single();

          if (createNotebookErr) throw createNotebookErr;
          activeNotebook = newNotebook;
        }

        if (activeNotebook) {
          // Fetch or create notebook page for this lesson
          const { data: pages, error: pageErr } = await supabase
            .from("notebook_pages")
            .select("id, content_canvas, content_text")
            .eq("notebook_id", activeNotebook.id)
            .eq("title", `Lesson: ${lessonTitle || "Untitled"}`)
            .limit(1);

          if (pageErr) throw pageErr;

          let activePage = pages && pages.length > 0 ? pages[0] : null;

          if (!activePage) {
            const { data: newPage, error: createPageErr } = await supabase
              .from("notebook_pages")
              .insert({
                notebook_id: activeNotebook.id,
                title: `Lesson: ${lessonTitle || "Untitled"}`,
                content_text: "Welcome to your upgraded notebook! Select blocks or freehand draw.",
                content_canvas: {
                  mode: "modular",
                  bgType: "ruled",
                  modular_blocks: [
                    {
                      id: "b-welcome",
                      type: "heading",
                      content: `Notes for ${lessonTitle || "Untitled"}`,
                      properties: { level: 2 },
                      createdAt: new Date().toISOString(),
                      lastEditedAt: new Date().toISOString(),
                    },
                    {
                      id: "b-desc",
                      type: "text",
                      content: "Start typing notes here, or type '/' for slash commands. Click the 'Freehand Canvas' tab above to draw or annotate.",
                      createdAt: new Date().toISOString(),
                      lastEditedAt: new Date().toISOString(),
                    }
                  ],
                  freehand_strokes: [],
                  freehand_annotations: [],
                },
                order_index: 0,
              })
              .select("id, content_canvas, content_text")
              .single();

            if (createPageErr) throw createPageErr;
            activePage = newPage;
          }

          if (activePage) {
            setPageId(activePage.id);
            const canvasData = activePage.content_canvas as any;
            if (canvasData) {
              setBlocks(canvasData.modular_blocks || []);
              setStrokes(canvasData.freehand_strokes || []);
              setAnnotations(canvasData.freehand_annotations || []);
              setBgType(canvasData.bgType || "ruled");
              if (canvasData.mode === "freehand") {
                setActiveTab("freehand");
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load notebook data:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadNotebookData();
  }, [courseId, lessonId, studentId, courseTitle, lessonTitle, selectedPageId]);

  // Debounced auto-save every 10s (800ms debounce)
  useEffect(() => {
    if (!pageId) return;

    let debounceTimer: NodeJS.Timeout;

    const triggerSave = async () => {
      setSaveStatus("saving");
      try {
        const supabase = createClient();
        if (!supabase) return;

        const currentData = dataRef.current;
        const plainTextRep = currentData.blocks
          .map((b) => `[${b.type.toUpperCase()}] ${b.content}`)
          .join("\n\n");

        const canvasPayload = {
          mode: currentData.activeTab === "freehand" ? "freehand" : "modular",
          bgType: currentData.bgType,
          modular_blocks: currentData.blocks,
          freehand_strokes: currentData.strokes,
          freehand_annotations: currentData.annotations,
        };

        const { error } = await supabase
          .from("notebook_pages")
          .update({
            content_text: plainTextRep,
            content_canvas: canvasPayload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pageId);

        if (error) throw error;
        setSaveStatus("saved");

        // Keep local version history snapshot (max 10 entries)
        setHistoryVersions((prev) => {
          const newVer: PageVersion = {
            timestamp: new Date().toLocaleTimeString(),
            modular_blocks: currentData.blocks,
            freehand_strokes: currentData.strokes,
            freehand_annotations: currentData.annotations,
          };
          const filtered = prev.filter((v) => v.timestamp !== newVer.timestamp);
          return [newVer, ...filtered].slice(0, 10);
        });

      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus("error");
      }
    };

    // Debounce triggers when data changes
    const handleDataChange = () => {
      setSaveStatus("idle");
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(triggerSave, 2500); // Trigger save 2.5s after editing stops
    };

    // Periodic backup every 10 seconds if any changes exist
    const autoSaveTimer = setInterval(() => {
      if (saveStatus === "idle") {
        void triggerSave();
      }
    }, 10000);

    // Bind change listener
    handleDataChange();

    return () => {
      clearTimeout(debounceTimer);
      clearInterval(autoSaveTimer);
    };
  }, [blocks, strokes, annotations, activeTab, bgType, pageId, saveStatus]);

  // Insert block callback helper
  const handleInsertBlock = (type: Block["type"], content: string, properties: any = {}) => {
    const playhead = videoPlayer?.getCurrentTime() || 0;
    const newBlock: Block = {
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      properties: {
        checked: false,
        level: 2,
        language: "javascript",
        color: "blue",
        rows: [["Cell 1", "Cell 2"], ["Cell 3", "Cell 4"]],
        ...properties,
      },
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      videoTimestampRange: { start: playhead, end: playhead },
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleInsertBlocks = (newBlocks: { type: Block["type"]; content: string; properties?: any }[]) => {
    const playhead = videoPlayer?.getCurrentTime() || 0;
    const formattedBlocks: Block[] = newBlocks.map((b) => ({
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      type: b.type,
      content: b.content,
      properties: {
        checked: false,
        level: 2,
        language: "javascript",
        color: "blue",
        rows: [["Cell 1", "Cell 2"], ["Cell 3", "Cell 4"]],
        ...b.properties,
      },
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      videoTimestampRange: { start: playhead, end: playhead },
    }));
    setBlocks((prev) => [...prev, ...formattedBlocks]);
  };

  // Exporters
  const exportAsPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const htmlContent = `
      <html>
        <head>
          <title>${lessonTitle} Study Notes</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #1c1917; line-height: 1.6; }
            h1 { border-bottom: 2px solid #f97316; padding-bottom: 8px; color: #f97316; }
            .meta { font-size: 12px; color: #78716c; margin-bottom: 30px; }
            .block { margin-bottom: 20px; page-break-inside: avoid; }
            .heading-1 { font-size: 24px; font-weight: 800; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; }
            .heading-2 { font-size: 20px; font-weight: 700; margin-top: 15px; }
            .heading-3 { font-size: 16px; font-weight: 700; }
            .bullet { margin-left: 20px; display: list-item; }
            .callout { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 12px; font-weight: 550; }
            .sticky { background: #fffacd; border: 1px solid #eab308; padding: 15px; border-radius: 12px; display: inline-block; min-width: 150px; font-family: serif; }
            pre { background: #1c1917; color: #34d399; padding: 16px; border-radius: 12px; font-family: monospace; overflow-x: auto; }
            table { border-collapse: collapse; width: 100%; margin: 15px 0; }
            th, td { border: 1px solid #d6d3d1; padding: 10px; text-align: left; }
            th { background-color: #f5f5f4; }
          </style>
        </head>
        <body>
          <h1>${courseTitle}</h1>
          <h2>Lesson Notes: ${lessonTitle}</h2>
          <p class="meta">Generated via COGNARA™ Notebook on ${new Date().toLocaleString()}</p>
          <hr/>
          <div style="margin-top: 25px;">
            ${blocks
              .map((b) => {
                if (b.type === "heading") return `<div class="block heading-${b.properties?.level || 2}">${b.content}</div>`;
                if (b.type === "code") return `<div class="block"><pre><code>${b.content}</code></pre></div>`;
                if (b.type === "bullet_list") return `<div class="block bullet">${b.content}</div>`;
                if (b.type === "checkbox") return `<div class="block"><input type="checkbox" ${b.properties?.checked ? "checked" : ""}> ${b.content}</div>`;
                if (b.type === "callout") return `<div class="block callout">${b.content}</div>`;
                if (b.type === "sticky_note") return `<div class="block sticky">${b.content}</div>`;
                if (b.type === "divider") return `<hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 20px 0;"/>`;
                if (b.type === "table") {
                  const rows = b.properties?.rows || [];
                  return `<div class="block"><table><tbody>${rows.map((r: string[]) => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
                }
                return `<div class="block">${b.content}</div>`;
              })
              .join("")}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportAsMarkdown = () => {
    const md = blocks
      .map((b) => {
        if (b.type === "heading") {
          const hashes = "#".repeat(b.properties?.level || 2);
          return `${hashes} ${b.content}`;
        }
        if (b.type === "code") {
          return `\`\`\`${b.properties?.language || "javascript"}\n${b.content}\n\`\`\``;
        }
        if (b.type === "bullet_list") return `- ${b.content}`;
        if (b.type === "checkbox") return `- [${b.properties?.checked ? "x" : " "}] ${b.content}`;
        if (b.type === "divider") return `---`;
        if (b.type === "callout") return `> 💡 Callout: ${b.content}`;
        if (b.type === "sticky_note") return `> 📌 Sticky Note: ${b.content}`;
        return b.content;
      })
      .join("\n\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(lessonTitle || "untitled").replace(/\s+/g, "_")}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      notify({
        tone: "warning",
        title: "No freehand canvas found",
        description: "Switch to Freehand Canvas and draw something before exporting PNG.",
      });
      return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(lessonTitle || "untitled").replace(/\s+/g, "_")}_sketches.png`;
    a.click();
  };

  const shareNote = async () => {
    if (!pageId) return;
    try {
      const supabase = createClient();
      if (!supabase) {
        notify({
          tone: "error",
          title: "Sharing unavailable",
          description: "Connect Supabase before creating notebook share links.",
        });
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        notify({
          tone: "error",
          title: "Sign in required",
          description: "Please sign in again before creating a private share link.",
        });
        return;
      }

      const token =
        crypto.randomUUID().replace(/-/g, "") +
        Math.random().toString(36).slice(2, 8);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("notebook_share_tokens").insert({
        page_id: pageId,
        created_by: authData.user.id,
        token,
        visibility: "private_link",
        expires_at: expiresAt,
      });

      if (error) throw error;

      const shareUrl = `${window.location.origin}/notebook/share/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      notify({
        tone: "success",
        title: "Private share link copied",
        description: "Anyone with this token link can view the note until it expires in 30 days.",
      });
    } catch (error: any) {
      notify({
        tone: "error",
        title: "Could not create share link",
        description: error?.message || "The notebook share token could not be saved.",
      });
    }
  };

  const revertToHistory = () => {
    if (!versionToRevert) return;
    setBlocks(versionToRevert.modular_blocks);
    setStrokes(versionToRevert.freehand_strokes);
    setAnnotations(versionToRevert.freehand_annotations);
    setActiveTab("modular");
    setVersionToRevert(null);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 border border-cn-border rounded-[2rem] overflow-hidden shadow-2xl relative dark:bg-[#12100f] dark:border-stone-850">
      {/* ─── Top Control Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-cn-border dark:bg-[#1c1a18] dark:border-stone-850 shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* Main Mode Toggles */}
          <div className="flex bg-neutral-100 rounded-2xl p-1 dark:bg-[#110f0e] border border-neutral-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab("modular")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeTab === "modular"
                  ? "bg-white text-cn-orange shadow-sm dark:bg-stone-900"
                  : "text-cn-ink-muted hover:text-cn-ink"
              }`}
            >
              📓 Blocks Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("freehand")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeTab === "freehand"
                  ? "bg-white text-cn-orange shadow-sm dark:bg-stone-900"
                  : "text-cn-ink-muted hover:text-cn-ink"
              }`}
            >
              🎨 Freehand Canvas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("assistant")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeTab === "assistant"
                  ? "bg-white text-cn-orange shadow-sm dark:bg-stone-900"
                  : "text-cn-ink-muted hover:text-cn-ink"
              }`}
            >
              🤖 Study Agent
            </button>
          </div>
        </div>

        {/* Sync status & Export utilities */}
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-semibold">
            {saveStatus === "saving" && <span className="text-cn-orange animate-pulse">● Saving...</span>}
            {saveStatus === "saved" && <span className="text-emerald-500">✓ Auto-saved</span>}
            {saveStatus === "error" && <span className="text-rose-500">✕ Connection Error</span>}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-3.5 py-2 border border-cn-border rounded-xl bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-cn-ink-muted transition flex items-center gap-1 dark:bg-stone-900 dark:border-stone-800"
            >
              📤 Export & Share
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-cn-border rounded-2xl shadow-xl p-1.5 z-50 dark:bg-stone-900 dark:border-stone-800 text-xs select-none">
                <button
                  type="button"
                  onClick={() => {
                    exportAsPDF();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-xl font-medium dark:hover:bg-stone-850"
                >
                  📄 Export as PDF Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportAsMarkdown();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-xl font-medium dark:hover:bg-stone-850"
                >
                  📝 Export as Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportAsPNG();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-xl font-medium dark:hover:bg-stone-850"
                >
                  🖼️ Export drawings (.png)
                </button>
                <hr className="my-1 border-cn-border dark:border-stone-800" />
                <button
                  type="button"
                  onClick={() => {
                    void shareNote();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-xl font-medium text-indigo-500 dark:hover:bg-stone-850"
                >
                  🚀 Share note URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("history");
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-xl font-medium dark:hover:bg-stone-850"
                >
                  ↩️ Version backups
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Grid settings for Freehand Canvas ────────────────────────── */}
      {activeTab === "freehand" && (
        <div className="flex items-center gap-2.5 px-4 py-2 bg-neutral-100/75 border-b border-cn-border text-xs dark:bg-[#1a1816]/75 dark:border-stone-850 select-none shrink-0">
          <span className="text-[10px] text-cn-ink-subtle uppercase font-bold">Paper Grid Background:</span>
          {["ruled", "dot", "graph", "blank"].map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => setBgType(bg as any)}
              className={`px-2.5 py-1 capitalize rounded-lg transition font-medium border ${
                bgType === bg
                  ? "bg-cn-orange text-white border-cn-orange"
                  : "bg-white border-cn-border text-cn-ink-muted hover:bg-neutral-50 dark:bg-stone-900 dark:border-stone-800"
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      )}

      {/* ─── Main Viewport switcher ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-cn-orange border-t-transparent mb-3" />
            <p className="text-xs text-cn-ink-muted">Syncing notebook canvas data...</p>
          </div>
        ) : activeTab === "modular" ? (
          <ModularCanvas
            blocks={blocks}
            onChange={setBlocks}
            videoPlayer={videoPlayer}
            onTriggerAISummary={async (time) => {
              try {
                const mins = Math.floor(time / 60);
                const secs = Math.floor(time % 60);
                const stampText = `${mins}:${secs.toString().padStart(2, "0")}`;
                
                const res = await fetch("/api/agent", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    studentId,
                    skill: "teach",
                    message: `Generate a short structured summary of the concept at timestamp ${stampText} of the lesson "${lessonTitle}" in "${courseTitle}". Keep it dense and actionable.`,
                    context: { current_page: window.location.pathname },
                  }),
                });
                const data = await res.json();
                return data.content || "Could not generate summary.";
              } catch {
                return "Failed to contact agent API.";
              }
            }}
          />
        ) : activeTab === "freehand" ? (
          <div className="h-[550px]">
            <FreehandCanvas
              strokes={strokes}
              annotations={annotations}
              onChange={(s, a) => {
                setStrokes(s);
                setAnnotations(a);
              }}
              background={bgType}
            />
          </div>
        ) : activeTab === "assistant" ? (
          <div className="h-[500px]">
            <AIAssistantPanel
              studentId={studentId}
              notebookBlocks={blocks}
              onInsertBlock={handleInsertBlock}
              onInsertBlocks={handleInsertBlocks}
              videoPlayer={videoPlayer}
              lessonTitle={lessonTitle || "Untitled Page"}
              courseTitle={courseTitle || "My Notebook"}
            />
          </div>
        ) : (
          /* History versions panel */
          <div className="flex flex-col gap-4 max-w-md mx-auto py-4 select-none">
            <h3 className="text-sm font-bold text-cn-ink dark:text-neutral-200">Local Snapshots History</h3>
            <p className="text-xs text-cn-ink-muted">COGNARA auto-saves revisions locally. Click a timestamp below to restore your blocks and sketches workspace.</p>
            <div className="flex flex-col border border-cn-border rounded-2xl bg-white overflow-hidden dark:bg-stone-900 dark:border-stone-800">
              {historyVersions.length === 0 ? (
                <div className="p-4 text-xs text-cn-ink-subtle italic text-center">No auto-save versions captured yet. Make edits to generate snapshots.</div>
              ) : (
                historyVersions.map((v, i) => (
                  <button
                    key={v.timestamp + i}
                    type="button"
                    onClick={() => setVersionToRevert(v)}
                    className="w-full text-left p-3.5 hover:bg-neutral-50 border-b border-cn-border last:border-b-0 text-xs font-semibold text-cn-ink flex justify-between items-center dark:border-stone-850 dark:hover:bg-stone-850"
                  >
                    <span>🕒 Saved revision at {v.timestamp}</span>
                    <span className="text-[10px] text-cn-orange">Restore ↩️</span>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("modular")}
              className="mt-2 text-center text-xs text-cn-orange font-bold hover:underline"
            >
              Back to editor
            </button>
          </div>
        )}
      </div>

      <DoubleConfirmModal
        isOpen={!!versionToRevert}
        onClose={() => setVersionToRevert(null)}
        onConfirm={revertToHistory}
        title="Restore Snapshot"
        description="Are you sure you want to restore this auto-saved snapshot? This will replace your current workspace content."
        actionButtonText="Restore Snapshot"
      />
    </div>
  );
}
