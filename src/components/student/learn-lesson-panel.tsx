"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { LearnCurriculum } from "@/components/student/learn-curriculum";
import { MarkLessonCompleteButton } from "@/components/student/mark-lesson-complete-button";
import type { CourseLearnContext, LessonOutline } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

const TABS = ["Overview", "Materials", "Notes"] as const;

type LearnLessonPanelProps = {
  ctx: CourseLearnContext;
  lesson: LessonOutline;
  prevOrder: number | null;
  nextOrder: number | null;
};

export function LearnLessonPanel({ ctx, lesson, prevOrder, nextOrder }: LearnLessonPanelProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const completed = ctx.completedLessonIds.includes(lesson.id);

  // States for Notes and AI Transcript
  const [notesContent, setNotesContent] = useState<string>(" ");
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notebookPageId, setNotebookPageId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [loadingTranscript, setLoadingTranscript] = useState<boolean>(false);

  const body =
    lesson.content?.trim() ||
    `This lesson is ready for content from Supabase (\`lessons.content\`). When Mux is connected, video will appear in the player above.`;

  // 1. Try to find the first video URL to play natively in the main player
  let firstVideoUrl: string | null = null;
  let parsedBlocks: any[] = [];
  let isJsonBlocks = false;

  try {
    if (lesson.content) {
      const parsed = JSON.parse(lesson.content);
      if (Array.isArray(parsed)) {
        parsedBlocks = parsed;
        isJsonBlocks = true;
        const videoBlock = parsed.find(
          (b: any) => b.type === "video" && b.content && b.content.startsWith("http")
        );
        if (videoBlock) {
          firstVideoUrl = videoBlock.content;
        }
      }
    }
  } catch (e) {
    // Content is legacy plain text
  }

  // 2. Load Notebook Notes when Notes tab is active
  useEffect(() => {
    async function loadNotes() {
      setLoadingNotes(true);
      setSaveStatus("idle");
      try {
        const supabase = createClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Find or create notebook for this course
        let { data: notebook, error: notebookErr } = await supabase
          .from("notebooks")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", ctx.courseId)
          .maybeSingle();

        if (!notebook && !notebookErr) {
          const { data: newNotebook, error: createNotebookErr } = await supabase
            .from("notebooks")
            .insert({
              student_id: user.id,
              course_id: ctx.courseId,
              title: `${ctx.title} Notebook`
            })
            .select("id")
            .single();

          if (createNotebookErr) throw createNotebookErr;
          notebook = newNotebook;
        }

        if (notebook) {
          // Find or create page for this specific lesson
          let { data: page, error: pageErr } = await supabase
            .from("notebook_pages")
            .select("id, content_text")
            .eq("notebook_id", notebook.id)
            .eq("title", `Lesson: ${lesson.title}`)
            .maybeSingle();

          if (!page && !pageErr) {
            const { data: newPage, error: createPageErr } = await supabase
              .from("notebook_pages")
              .insert({
                notebook_id: notebook.id,
                title: `Lesson: ${lesson.title}`,
                content_text: "",
                order_index: lesson.orderIndex
              })
              .select("id, content_text")
              .single();

            if (createPageErr) throw createPageErr;
            page = newPage;
          }

          if (page) {
            setNotebookPageId(page.id);
            setNotesContent(page.content_text || "");
          }
        }
      } catch (err) {
        console.error("Failed to load notes:", err);
      } finally {
        setLoadingNotes(false);
      }
    }

    if (tab === "Notes") {
      void loadNotes();
    }
  }, [tab, lesson.id, ctx.courseId, ctx.title, lesson.title, lesson.orderIndex]);

  // Notes Auto-save / Manual save
  const handleSaveNotes = async (contentToSave: string) => {
    if (!notebookPageId) return;
    setSavingNotes(true);
    setSaveStatus("saving");
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not initialized");
      const { error } = await supabase
        .from("notebook_pages")
        .update({
          content_text: contentToSave,
          updated_at: new Date().toISOString()
        })
        .eq("id", notebookPageId);

      if (error) throw error;
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to save notes:", err);
      setSaveStatus("error");
    } finally {
      setSavingNotes(false);
    }
  };

  // AI Transcript Request
  const generateTranscript = async () => {
    setLoadingTranscript(true);
    setTranscript("");
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build text context of all blocks
      let sourceText = body;
      if (isJsonBlocks && parsedBlocks.length > 0) {
        sourceText = parsedBlocks
          .map((b) => `[${b.type.toUpperCase()}] ${b.content || ""}`)
          .join("\n\n");
      }

      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: "teach",
          message: `Please generate a highly detailed, professional, and accurate transcript of the lecture/lesson. 
The lesson is titled "${lesson.title}" from the course "${ctx.title}".
Format it as a clean spoken transcript with timestamps or section markers if applicable. Let it feel like a real lecture transcript.

Here is the source content of the lesson to transcribe and outline:
${sourceText}`,
          studentId: user.id,
          context: {
            current_page: window.location.pathname,
            current_lesson_title: lesson.title,
            current_course_title: ctx.title
          }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setTranscript(data.content || "No transcript content generated.");
    } catch (err: any) {
      console.error("Failed to generate transcript:", err);
      setTranscript(`Failed to generate transcript: ${err.message || "Unknown error"}`);
    } finally {
      setLoadingTranscript(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm text-cn-ink-muted">
        <Link href="/my-courses" className="hover:text-cn-orange">
          My courses
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/learn/${ctx.slug}`} className="hover:text-cn-orange">
          {ctx.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-cn-ink">{lesson.title}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cn-orange">
            Lesson {lesson.orderIndex}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-cn-ink sm:text-3xl">{lesson.title}</h1>
          <p className="mt-2 text-sm text-cn-ink-muted">
            {lesson.type}
            {lesson.durationMins ? ` · ${lesson.durationMins} min` : ""}
          </p>
        </div>
        <MarkLessonCompleteButton
          lessonId={lesson.id}
          courseId={ctx.courseId}
          slug={ctx.slug}
          alreadyCompleted={completed}
          isGraded={lesson.isGraded}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {/* Main Video Player / Playlist Renderer */}
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[1.75rem] border border-cn-border bg-gradient-to-br from-cn-lavender/30 via-cn-canvas to-cn-yellow/20 dark:border-[#2e2a2a]">
            {firstVideoUrl ? (
              <video src={firstVideoUrl} controls className="h-full w-full object-contain rounded-[1.75rem]" />
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cn-orange text-white shadow-xl">
                    <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                <p className="absolute bottom-4 left-4 right-4 text-center text-xs text-cn-ink-muted">
                  No video lecture attached to this lesson. Read materials below.
                </p>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(label)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  tab === label
                    ? "bg-cn-sidebar text-white dark:bg-cn-yellow dark:text-cn-sidebar"
                    : "border border-cn-border bg-cn-surface text-cn-ink-muted hover:text-cn-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="cn-card mt-4 p-6">
            {tab === "Overview" ? (
              isJsonBlocks ? (
                <div className="space-y-6">
                  {parsedBlocks.map((block: any) => {
                    switch (block.type) {
                      case "heading": {
                        const level = block.properties?.level || 2;
                        if (level === 1) return <h1 key={block.id} className="text-2xl font-bold text-cn-ink dark:text-white border-b border-cn-border pb-2 mt-4">{block.content}</h1>;
                        if (level === 3) return <h3 key={block.id} className="text-base font-bold text-cn-ink dark:text-gray-200 mt-2">{block.content}</h3>;
                        return <h2 key={block.id} className="text-xl font-bold text-cn-ink dark:text-white mt-3">{block.content}</h2>;
                      }
                      case "paragraph":
                        return (
                          <p 
                            key={block.id}
                            className="text-sm text-cn-ink-muted leading-relaxed"
                            style={{ textAlign: block.properties?.align || "left" }}
                          >
                            {block.content}
                          </p>
                        );
                      case "code":
                        return (
                          <div key={block.id} className="relative group my-4">
                            <span className="absolute top-2.5 right-3 text-[9px] font-bold text-cn-ink-subtle uppercase tracking-wider">code</span>
                            <pre className="bg-cn-canvas border border-cn-border p-4 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto dark:bg-[#030107] dark:border-[#221740]">
                              <code>{block.content}</code>
                            </pre>
                          </div>
                        );
                      case "image":
                        return (
                          block.content && block.content.startsWith("http") ? (
                            <div key={block.id} className="rounded-2xl overflow-hidden border border-cn-border bg-cn-canvas/45 flex items-center justify-center max-h-[400px] my-4 dark:border-[#221740] dark:bg-black/45">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={block.content} alt="Lesson visual module" className="max-h-[400px] object-contain w-full" />
                            </div>
                          ) : null
                        );
                      case "video":
                        return (
                          block.content && block.content.startsWith("http") ? (
                            <div key={block.id} className="rounded-2xl overflow-hidden border border-cn-border bg-cn-canvas/45 my-4 dark:border-[#221740] dark:bg-black/45">
                              <video src={block.content} controls className="w-full max-h-[350px] object-contain" />
                            </div>
                          ) : null
                        );
                      case "embed":
                        return (
                          block.content && block.content.startsWith("http") ? (
                            <iframe key={block.id} src={block.content} className="w-full h-80 rounded-2xl border border-cn-border shadow-md my-4 dark:border-[#221740]" />
                          ) : null
                        );
                      case "url":
                        return (
                          block.content && typeof block.content === "string" && block.content.startsWith("http") ? (
                            <a
                              key={block.id}
                              href={block.content}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-3xl border border-cn-border bg-cn-surface p-5 transition hover:border-cn-orange/40 my-4 dark:border-[#221740] dark:bg-[#0c081d]/80"
                            >
                              <p className="text-sm font-semibold text-cn-ink dark:text-white mb-2">Link Reference</p>
                              <p className="text-xs text-cn-ink-muted truncate">{block.content}</p>
                            </a>
                          ) : null
                        );
                      case "callout":
                        return (
                          <div key={block.id} className="bg-cn-yellow/10 border-l-4 border-cn-yellow p-4 rounded-r-xl flex gap-3 items-start my-4 dark:bg-yellow-500/5">
                            <span className="text-lg">💡</span>
                            <p className="text-sm text-cn-ink dark:text-gray-300 font-medium leading-relaxed">{block.content}</p>
                          </div>
                        );
                      case "quote":
                        return (
                          <div key={block.id} className="rounded-3xl border border-cn-border bg-cn-surface/70 p-5 my-4 dark:border-[#221740] dark:bg-[#120c2b]/70">
                            <p className="text-lg italic text-cn-ink dark:text-white">“{block.content}”</p>
                            {block.properties?.author ? (
                              <p className="mt-3 text-sm font-semibold text-cn-orange">— {block.properties.author}</p>
                            ) : null}
                          </div>
                        );
                      case "resource":
                        return (
                          <div key={block.id} className="rounded-3xl border border-cn-border bg-cn-surface p-6 my-4 dark:border-[#221740] dark:bg-[#0c081d]/80">
                            <p className="text-sm font-semibold text-cn-orange mb-2">{block.properties?.title || "Resource"}</p>
                            <p className="text-sm text-cn-ink-muted leading-relaxed mb-4">{block.content}</p>
                            {block.content && block.content.startsWith("http") && (
                              <a
                                href={block.content}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-cn-orange/30 bg-cn-orange/10 px-4 py-2 text-xs font-semibold text-cn-orange transition hover:bg-cn-orange/20"
                              >
                                Open resource
                              </a>
                            )}
                          </div>
                        );
                      case "activity":
                        return (
                          <div key={block.id} className="rounded-3xl border border-cn-border bg-cn-surface p-6 my-4 dark:border-[#221740] dark:bg-[#0b0821]/80">
                            <div className="flex items-center justify-between text-sm font-semibold text-cn-ink dark:text-white mb-4">
                              <span className="rounded-full bg-cn-orange/10 text-cn-orange px-3 py-1">Activity</span>
                              <span className="text-xs text-cn-ink-muted">{block.properties?.duration || 10} min</span>
                            </div>
                            <p className="text-sm text-cn-ink-muted leading-relaxed">{block.content}</p>
                            <div className="mt-4 flex items-center gap-2 text-xs text-cn-ink-subtle">
                              <span>Type:</span>
                              <span className="rounded-full bg-cn-canvas px-2 py-1 dark:bg-[#1d1338]">{block.properties?.activityType || "task"}</span>
                            </div>
                          </div>
                        );
                      case "divider":
                        return <hr key={block.id} className="my-6 border-cn-border dark:border-[#221740]" />;
                      default:
                        return null;
                    }
                  })}
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-cn-ink-muted">{body}</p>
              )
            ) : tab === "Materials" ? (
              <p className="text-sm text-cn-ink-muted">
                Downloadable resources appear here when coaches attach files in the lesson editor.
              </p>
            ) : (
              /* Notes & AI Transcript tab */
              <div className="flex flex-col gap-6">
                {loadingNotes ? (
                  <p className="text-sm text-cn-ink-muted animate-pulse">Loading notebook page...</p>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column: Note Editor */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-cn-ink dark:text-white">Note Editor</h4>
                        <div className="flex items-center gap-2 text-xs">
                          {saveStatus === "saving" && <span className="text-cn-orange animate-pulse">Saving...</span>}
                          {saveStatus === "saved" && <span className="text-emerald-500">✓ Saved</span>}
                          {saveStatus === "error" && <span className="text-rose-500">✕ Error saving</span>}
                        </div>
                      </div>
                      <textarea
                        rows={12}
                        value={notesContent}
                        onChange={(e) => {
                          setNotesContent(e.target.value);
                          setSaveStatus("idle");
                        }}
                        placeholder="Write your notes here during the lecture... Notes will sync to your student notebook."
                        className="w-full rounded-2xl border border-cn-border bg-cn-canvas p-4 text-sm text-cn-ink focus:outline-none focus:border-cn-orange transition dark:border-[#2e2a2a] dark:bg-[#0f0e0e]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(notesContent)}
                        disabled={savingNotes}
                        className="self-end rounded-xl bg-cn-orange px-5 py-2 text-xs font-bold text-white hover:bg-cn-orange-hover disabled:opacity-50 transition"
                      >
                        {savingNotes ? "Saving..." : "Save Notes"}
                      </button>
                    </div>

                    {/* Right Column: AI Transcript */}
                    <div className="flex flex-col gap-4 border-t border-cn-border pt-6 md:border-t-0 md:border-l md:pl-6 md:pt-0 dark:border-[#2e2a2a]">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-cn-ink dark:text-white flex items-center gap-1">
                          <span>🤖 AI Lecture Assistant</span>
                        </h4>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono">Consumes 1 credit</span>
                      </div>
                      
                      {transcript ? (
                        <div className="flex flex-col gap-4">
                          <div className="max-h-[250px] overflow-y-auto rounded-xl bg-cn-canvas p-3 border border-cn-border text-xs text-cn-ink-muted leading-relaxed font-mono whitespace-pre-wrap dark:bg-[#0f0e0e] dark:border-[#2e2a2a]">
                            {transcript}
                          </div>
                          <div className="flex justify-between items-center">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(transcript);
                                alert("Transcript copied to clipboard!");
                              }}
                              className="text-xs text-cn-orange hover:underline font-semibold"
                            >
                              Copy Transcript
                            </button>
                            <button
                              type="button"
                              onClick={generateTranscript}
                              className="text-xs text-cn-ink-muted hover:text-cn-ink font-semibold"
                            >
                              Regenerate
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border py-12 text-center dark:border-[#2e2a2a]">
                          <p className="text-xs text-cn-ink-muted max-w-[220px] mb-4">
                            Get an AI-generated written transcript of this lecture content.
                          </p>
                          <button
                            type="button"
                            onClick={generateTranscript}
                            disabled={loadingTranscript}
                            className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/25 px-4 py-2 text-xs font-bold text-indigo-400 disabled:opacity-50 transition"
                          >
                            {loadingTranscript ? "Generating transcript..." : "🤖 Generate Transcript"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 items-center justify-between">
            {prevOrder !== null ? (
              <Link
                href={`/learn/${ctx.slug}/lesson/${prevOrder}`}
                className="rounded-full border border-cn-border bg-cn-surface px-5 py-2.5 text-sm font-semibold text-cn-ink transition hover:border-cn-orange/40 dark:border-[#2e2a2a] dark:bg-[#1a1818]"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {nextOrder !== null ? (
              <Link
                href={`/learn/${ctx.slug}/lesson/${nextOrder}`}
                className="rounded-full bg-cn-sidebar px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cn-sidebar/90 dark:bg-cn-yellow dark:text-cn-sidebar"
              >
                Next lesson →
              </Link>
            ) : (
              <Link
                href={`/learn/${ctx.slug}`}
                className="rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
              >
                Back to course
              </Link>
            )}
          </div>
        </section>

        <LearnCurriculum ctx={ctx} activeOrder={lesson.orderIndex} />
      </div>
    </div>
  );
}
