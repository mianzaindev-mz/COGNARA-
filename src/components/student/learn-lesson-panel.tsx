"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { LearnCurriculum } from "@/components/student/learn-curriculum";
import { MarkLessonCompleteButton } from "@/components/student/mark-lesson-complete-button";
import type { CourseLearnContext, LessonOutline } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { NotebookPanel } from "@/components/notebook/NotebookPanel";

const LEFT_TABS = ["Overview", "Materials", "Curriculum"] as const;

type LearnLessonPanelProps = {
  ctx: CourseLearnContext;
  lesson: LessonOutline;
  prevOrder: number | null;
  nextOrder: number | null;
};

function HlsPlayer({ url, onRef }: { url: string; onRef: (el: HTMLVideoElement | null) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    onRef(video);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else {
      let hlsInstance: any = null;
      const loadHls = () => {
        if ((window as any).Hls) {
          initializeHls();
        } else {
          const scriptId = "hls-js-cdn";
          if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
            script.async = true;
            document.body.appendChild(script);
            script.onload = () => initializeHls();
          } else {
            const checkInterval = setInterval(() => {
              if ((window as any).Hls) {
                clearInterval(checkInterval);
                initializeHls();
              }
            }, 100);
          }
        }
      };

      const initializeHls = () => {
        if ((window as any).Hls.isSupported()) {
          hlsInstance = new (window as any).Hls();
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(video);
        }
      };

      loadHls();

      return () => {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
        onRef(null);
      };
    }
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <video
      ref={videoRef}
      controls
      className="h-full w-full object-contain rounded-[1.75rem] bg-black"
    />
  );
}

export function LearnLessonPanel({ ctx, lesson, prevOrder, nextOrder }: LearnLessonPanelProps) {
  const [leftTab, setLeftTab] = useState<(typeof LEFT_TABS)[number]>("Overview");
  const completed = ctx.completedLessonIds.includes(lesson.id);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Split view states
  const [isMobile, setIsMobile] = useState(false);
  const [splitWidth, setSplitWidth] = useState(60); // % of left pane
  const [isDragging, setIsDragging] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStudentId(user.id);
      }
    }
    void fetchUser();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth >= 30 && newWidth <= 80) {
        setSplitWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

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
  } catch {
    if (lesson.content && lesson.content.trim().startsWith("http")) {
      firstVideoUrl = lesson.content.trim();
    }
  }

  const parseVideoUrl = (url: string) => {
    if (!url) return { type: "none" };

    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch) {
      return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
    }

    const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    }

    if (url.includes(".m3u8")) {
      return { type: "hls", url };
    }

    return { type: "direct", url };
  };

  const videoInfo = parseVideoUrl(firstVideoUrl || "");

  const videoPlayerApi = {
    getCurrentTime: () => {
      if (videoElRef.current) {
        return videoElRef.current.currentTime;
      }
      return 0;
    },
    seekTo: (time: number) => {
      if (videoElRef.current) {
        videoElRef.current.currentTime = time;
        videoElRef.current.play().catch(() => {});
      }
    },
    isPlaying: () => {
      if (videoElRef.current) {
        return !videoElRef.current.paused;
      }
      return false;
    }
  };

  const renderVideoPlayer = () => {
    if (videoInfo.type === "youtube") {
      return (
        <iframe
          src={videoInfo.embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full object-contain rounded-[1.75rem] bg-black"
        />
      );
    }
    if (videoInfo.type === "vimeo") {
      return (
        <iframe
          src={videoInfo.embedUrl}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full object-contain rounded-[1.75rem] bg-black"
        />
      );
    }
    if (videoInfo.type === "hls") {
      return <HlsPlayer url={videoInfo.url || ""} onRef={(el) => { videoElRef.current = el; }} />;
    }
    if (videoInfo.type === "direct") {
      return (
        <video
          ref={videoElRef}
          src={videoInfo.url}
          controls
          className="h-full w-full object-contain rounded-[1.75rem] bg-black"
        />
      );
    }

    return (
      <>
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/10">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cn-orange text-white shadow-xl">
            <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
        <p className="absolute bottom-4 left-4 right-4 text-center text-xs text-cn-ink-muted font-medium">
          No video lecture attached to this lesson. Read materials below.
        </p>
      </>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] overflow-hidden p-2 select-none">
      {/* Navigation Breadcrumbs & Completion Button */}
      <div className="flex items-center justify-between pb-4 border-b border-cn-border dark:border-[#2e2a2a] shrink-0">
        <div className="flex flex-col">
          <nav className="text-xs text-cn-ink-muted mb-1.5 flex items-center gap-1">
            <Link href="/my-courses" className="hover:text-cn-orange transition">
              My courses
            </Link>
            <span>/</span>
            <Link href={`/learn/${ctx.slug}`} className="hover:text-cn-orange transition">
              {ctx.title}
            </Link>
            <span>/</span>
            <span className="font-semibold text-cn-ink truncate max-w-[200px]">{lesson.title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cn-orange bg-cn-orange/10 px-2 py-0.5 rounded">
              Lesson {lesson.orderIndex}
            </span>
            <h1 className="text-lg font-bold tracking-tight text-cn-ink dark:text-neutral-150 sm:text-xl truncate max-w-[300px]">
              {lesson.title}
            </h1>
            {lesson.durationMins && (
              <span className="text-xs text-cn-ink-muted font-medium">· {lesson.durationMins} min</span>
            )}
          </div>
        </div>
        <MarkLessonCompleteButton
          lessonId={lesson.id}
          courseId={ctx.courseId}
          slug={ctx.slug}
          alreadyCompleted={completed}
          isGraded={lesson.isGraded}
        />
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex relative overflow-hidden mt-4">
        {isMobile ? (
          // Mobile Layout
          <div className="flex-1 flex flex-col overflow-y-auto pb-16 scrollbar-none">
            {/* Video Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem] border border-cn-border bg-gradient-to-br from-cn-lavender/30 via-cn-canvas to-cn-yellow/20 dark:border-[#2e2a2a] shrink-0 mb-4 shadow-sm">
              {renderVideoPlayer()}
            </div>

            {/* Left Tabs bar */}
            <div className="flex gap-2 mb-3">
              {LEFT_TABS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setLeftTab(label)}
                  className={cn(
                    "rounded-full px-4.5 py-1.5 text-xs font-bold transition border",
                    leftTab === label
                      ? "bg-cn-sidebar text-white dark:bg-cn-yellow dark:text-cn-sidebar border-transparent"
                      : "border-cn-border bg-white text-cn-ink-muted hover:text-cn-ink dark:bg-[#1c1a18] dark:border-stone-850",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="bg-white border border-cn-border rounded-[1.5rem] p-5 shadow-sm dark:bg-[#12100f] dark:border-stone-850 flex-1 overflow-y-auto">
              {leftTab === "Overview" ? (
                isJsonBlocks ? (
                  <div className="space-y-4">
                    {parsedBlocks.map((block: any) => {
                      switch (block.type) {
                        case "heading": {
                          const level = block.properties?.level || 2;
                          if (level === 1) return <h1 key={block.id} className="text-xl font-bold text-cn-ink dark:text-white border-b border-cn-border pb-1.5 mt-3">{block.content}</h1>;
                          if (level === 3) return <h3 key={block.id} className="text-sm font-bold text-cn-ink dark:text-gray-200 mt-1">{block.content}</h3>;
                          return <h2 key={block.id} className="text-base font-bold text-cn-ink dark:text-white mt-2">{block.content}</h2>;
                        }
                        case "paragraph":
                          return (
                            <p 
                              key={block.id}
                              className="text-xs text-cn-ink-muted leading-relaxed"
                              style={{ textAlign: block.properties?.align || "left" }}
                            >
                              {block.content}
                            </p>
                          );
                        case "code":
                          return (
                            <div key={block.id} className="relative group my-3">
                              <span className="absolute top-2 right-3 text-[8px] font-bold text-cn-ink-subtle uppercase tracking-wider">code</span>
                              <pre className="bg-cn-canvas border border-cn-border p-3.5 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto dark:bg-black dark:border-stone-800">
                                <code>{block.content}</code>
                              </pre>
                            </div>
                          );
                        case "image":
                          return (
                            block.content && block.content.startsWith("http") ? (
                              <div key={block.id} className="rounded-xl overflow-hidden border border-cn-border bg-cn-canvas/45 flex items-center justify-center max-h-[300px] my-3 dark:border-stone-800 dark:bg-black/45">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={block.content} alt="Lesson visual module" className="max-h-[300px] object-contain w-full" />
                              </div>
                            ) : null
                          );
                        case "video":
                          return (
                            block.content && block.content.startsWith("http") ? (
                              <div key={block.id} className="rounded-xl overflow-hidden border border-cn-border bg-cn-canvas/45 my-3 dark:border-stone-800 dark:bg-black/45">
                                <video src={block.content} controls className="w-full max-h-[250px] object-contain" />
                              </div>
                            ) : null
                          );
                        case "embed":
                          return (
                            block.content && block.content.startsWith("http") ? (
                              <iframe key={block.id} src={block.content} className="w-full h-64 rounded-xl border border-cn-border shadow-sm my-3 dark:border-stone-800" />
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
                                className="block rounded-2xl border border-cn-border bg-cn-surface p-4 transition hover:border-cn-orange/40 my-3 dark:border-stone-800 dark:bg-stone-900/60"
                              >
                                <p className="text-xs font-semibold text-cn-ink dark:text-white mb-1">Link Reference</p>
                                <p className="text-[10px] text-cn-ink-muted truncate">{block.content}</p>
                              </a>
                            ) : null
                          );
                        case "callout":
                          return (
                            <div key={block.id} className="bg-cn-yellow/10 border-l-4 border-cn-yellow p-3.5 rounded-r-xl flex gap-2.5 items-start my-3 dark:bg-yellow-500/5">
                              <span className="text-base">💡</span>
                              <p className="text-xs text-cn-ink dark:text-gray-300 font-medium leading-relaxed">{block.content}</p>
                            </div>
                          );
                        case "quote":
                          return (
                            <div key={block.id} className="rounded-2xl border border-cn-border bg-cn-surface/70 p-4 my-3 dark:border-stone-800 dark:bg-stone-900/40">
                              <p className="text-sm italic text-cn-ink dark:text-white">“{block.content}”</p>
                              {block.properties?.author ? (
                                <p className="mt-2 text-xs font-semibold text-cn-orange">— {block.properties.author}</p>
                              ) : null}
                            </div>
                          );
                        case "resource":
                          return (
                            <div key={block.id} className="rounded-2xl border border-cn-border bg-cn-surface p-4.5 my-3 dark:border-stone-800 dark:bg-stone-900/60">
                              <p className="text-xs font-semibold text-cn-orange mb-1">{block.properties?.title || "Resource"}</p>
                              <p className="text-xs text-cn-ink-muted leading-relaxed mb-3">{block.content}</p>
                              {block.content && block.content.startsWith("http") && (
                                <a
                                  href={block.content}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-cn-orange/30 bg-cn-orange/10 px-3.5 py-1.5 text-[10px] font-semibold text-cn-orange transition hover:bg-cn-orange/20"
                                >
                                  Open resource
                                </a>
                              )}
                            </div>
                          );
                        case "divider":
                          return <hr key={block.id} className="my-4 border-cn-border dark:border-stone-850" />;
                        default:
                          return null;
                      }
                    })}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-cn-ink-muted">{body}</p>
                )
              ) : leftTab === "Materials" ? (
                <p className="text-xs text-cn-ink-muted">
                  Downloadable resources appear here when coaches attach files in the lesson editor.
                </p>
              ) : (
                <div className="mt-1">
                  <LearnCurriculum ctx={ctx} activeOrder={lesson.orderIndex} />
                </div>
              )}
            </div>

            {/* Bottom Nav indicators */}
            <div className="mt-4 flex gap-3 items-center justify-between shrink-0 select-none">
              {prevOrder !== null ? (
                <Link
                  href={`/learn/${ctx.slug}/lesson/${prevOrder}`}
                  className="rounded-full border border-cn-border bg-white px-4 py-2 text-xs font-semibold text-cn-ink transition hover:border-cn-orange/40 dark:border-stone-850 dark:bg-stone-900"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              {nextOrder !== null ? (
                <Link
                  href={`/learn/${ctx.slug}/lesson/${nextOrder}`}
                  className="rounded-full bg-cn-sidebar px-4.5 py-2 text-xs font-bold text-white transition hover:bg-cn-sidebar/90 dark:bg-cn-yellow dark:text-cn-sidebar"
                >
                  Next lesson →
                </Link>
              ) : (
                <Link
                  href={`/learn/${ctx.slug}`}
                  className="rounded-full bg-cn-orange px-4.5 py-2 text-xs font-bold text-white hover:bg-cn-orange-hover"
                >
                  Back to course
                </Link>
              )}
            </div>
          </div>
        ) : (
          // Desktop Split Layout
          <>
            {/* Left Pane */}
            <div
              style={{ width: `${splitWidth}%` }}
              className="flex flex-col h-full overflow-y-auto pr-4 scrollbar-thin select-none"
            >
              {/* Video Player container */}
              <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem] border border-cn-border bg-gradient-to-br from-cn-lavender/30 via-cn-canvas to-cn-yellow/20 dark:border-[#2e2a2a] shrink-0 mb-4 shadow-sm">
                {renderVideoPlayer()}
              </div>

              {/* Tabs list */}
              <div className="flex gap-2 mb-3">
                {LEFT_TABS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setLeftTab(label)}
                    className={cn(
                      "rounded-full px-4.5 py-1.5 text-xs font-bold transition border",
                      leftTab === label
                        ? "bg-cn-sidebar text-white dark:bg-cn-yellow dark:text-cn-sidebar border-transparent"
                        : "border-cn-border bg-white text-cn-ink-muted hover:text-cn-ink dark:bg-[#1c1a18] dark:border-stone-850",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Left Tab content panel */}
              <div className="bg-white border border-cn-border rounded-[1.5rem] p-5 shadow-sm dark:bg-[#12100f] dark:border-stone-850 flex-1 overflow-y-auto">
                {leftTab === "Overview" ? (
                  isJsonBlocks ? (
                    <div className="space-y-4">
                      {parsedBlocks.map((block: any) => {
                        switch (block.type) {
                          case "heading": {
                            const level = block.properties?.level || 2;
                            if (level === 1) return <h1 key={block.id} className="text-xl font-bold text-cn-ink dark:text-white border-b border-cn-border pb-1.5 mt-3">{block.content}</h1>;
                            if (level === 3) return <h3 key={block.id} className="text-sm font-bold text-cn-ink dark:text-gray-200 mt-1">{block.content}</h3>;
                            return <h2 key={block.id} className="text-base font-bold text-cn-ink dark:text-white mt-2">{block.content}</h2>;
                          }
                          case "paragraph":
                            return (
                              <p 
                                key={block.id}
                                className="text-xs text-cn-ink-muted leading-relaxed"
                                style={{ textAlign: block.properties?.align || "left" }}
                              >
                                {block.content}
                              </p>
                            );
                          case "code":
                            return (
                              <div key={block.id} className="relative group my-3">
                                <span className="absolute top-2 right-3 text-[8px] font-bold text-cn-ink-subtle uppercase tracking-wider">code</span>
                                <pre className="bg-cn-canvas border border-cn-border p-3.5 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto dark:bg-black dark:border-stone-800">
                                  <code>{block.content}</code>
                                </pre>
                              </div>
                            );
                          case "image":
                            return (
                              block.content && block.content.startsWith("http") ? (
                                <div key={block.id} className="rounded-xl overflow-hidden border border-cn-border bg-cn-canvas/45 flex items-center justify-center max-h-[300px] my-3 dark:border-stone-800 dark:bg-black/45">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={block.content} alt="Lesson visual module" className="max-h-[300px] object-contain w-full" />
                                </div>
                              ) : null
                            );
                          case "video":
                            return (
                              block.content && block.content.startsWith("http") ? (
                                <div key={block.id} className="rounded-xl overflow-hidden border border-cn-border bg-cn-canvas/45 my-3 dark:border-stone-800 dark:bg-black/45">
                                  <video src={block.content} controls className="w-full max-h-[250px] object-contain" />
                                </div>
                              ) : null
                            );
                          case "embed":
                            return (
                              block.content && block.content.startsWith("http") ? (
                                <iframe key={block.id} src={block.content} className="w-full h-64 rounded-xl border border-cn-border shadow-sm my-3 dark:border-stone-800" />
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
                                  className="block rounded-2xl border border-cn-border bg-cn-surface p-4 transition hover:border-cn-orange/40 my-3 dark:border-stone-800 dark:bg-stone-900/60"
                                >
                                  <p className="text-sm font-semibold text-cn-ink dark:text-white mb-1.5">Link Reference</p>
                                  <p className="text-xs text-cn-ink-muted truncate">{block.content}</p>
                                </a>
                              ) : null
                            );
                          case "callout":
                            return (
                              <div key={block.id} className="bg-cn-yellow/10 border-l-4 border-cn-yellow p-3.5 rounded-r-xl flex gap-2.5 items-start my-3 dark:bg-yellow-500/5">
                                <span className="text-base">💡</span>
                                <p className="text-xs text-cn-ink dark:text-gray-300 font-medium leading-relaxed">{block.content}</p>
                              </div>
                            );
                          case "quote":
                            return (
                              <div key={block.id} className="rounded-2xl border border-cn-border bg-cn-surface/70 p-4 my-3 dark:border-stone-800 dark:bg-stone-900/40">
                                <p className="text-sm italic text-cn-ink dark:text-white">“{block.content}”</p>
                                {block.properties?.author ? (
                                  <p className="mt-2 text-xs font-semibold text-cn-orange">— {block.properties.author}</p>
                                ) : null}
                              </div>
                            );
                          case "resource":
                            return (
                              <div key={block.id} className="rounded-2xl border border-cn-border bg-cn-surface p-4.5 my-3 dark:border-stone-800 dark:bg-stone-900/60">
                                <p className="text-xs font-semibold text-cn-orange mb-1">{block.properties?.title || "Resource"}</p>
                                <p className="text-xs text-cn-ink-muted leading-relaxed mb-3">{block.content}</p>
                                {block.content && block.content.startsWith("http") && (
                                  <a
                                    href={block.content}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-cn-orange/30 bg-cn-orange/10 px-3.5 py-1.5 text-[10px] font-semibold text-cn-orange transition hover:bg-cn-orange/20"
                                  >
                                    Open resource
                                  </a>
                                )}
                              </div>
                            );
                          case "divider":
                            return <hr key={block.id} className="my-4 border-cn-border dark:border-stone-850" />;
                          default:
                            return null;
                        }
                      })}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-cn-ink-muted">{body}</p>
                  )
                ) : leftTab === "Materials" ? (
                  <p className="text-xs text-cn-ink-muted">
                    Downloadable resources appear here when coaches attach files in the lesson editor.
                  </p>
                ) : (
                  <div className="mt-1">
                    <LearnCurriculum ctx={ctx} activeOrder={lesson.orderIndex} />
                  </div>
                )}
              </div>

              {/* Bottom Nav indicators */}
              <div className="mt-4 flex gap-3 items-center justify-between shrink-0 select-none">
                {prevOrder !== null ? (
                  <Link
                    href={`/learn/${ctx.slug}/lesson/${prevOrder}`}
                    className="rounded-full border border-cn-border bg-white px-4 py-2 text-xs font-semibold text-cn-ink transition hover:border-cn-orange/40 dark:border-stone-850 dark:bg-stone-900"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}
                {nextOrder !== null ? (
                  <Link
                    href={`/learn/${ctx.slug}/lesson/${nextOrder}`}
                    className="rounded-full bg-cn-sidebar px-4.5 py-2 text-xs font-bold text-white transition hover:bg-cn-sidebar/90 dark:bg-cn-yellow dark:text-cn-sidebar"
                  >
                    Next lesson →
                  </Link>
                ) : (
                  <Link
                    href={`/learn/${ctx.slug}`}
                    className="rounded-full bg-cn-orange px-4.5 py-2 text-xs font-bold text-white hover:bg-cn-orange-hover"
                  >
                    Back to course
                  </Link>
                )}
              </div>
            </div>

            {/* Draggable Divider */}
            <div
              onMouseDown={handleMouseDown}
              className="w-1.5 hover:w-2.5 bg-neutral-200 hover:bg-cn-orange cursor-col-resize transition-all h-full mx-1.5 rounded flex items-center justify-center relative group"
            >
              <div className="h-10 w-1 bg-neutral-400 group-hover:bg-white rounded" />
            </div>

            {/* Right Pane (NotebookPanel) */}
            <div
              style={{ width: `${100 - splitWidth}%` }}
              className="flex flex-col h-full pl-2"
            >
              {studentId ? (
                <NotebookPanel
                  studentId={studentId}
                  courseId={ctx.courseId}
                  lessonId={lesson.id}
                  lessonTitle={lesson.title}
                  courseTitle={ctx.title}
                  videoPlayer={videoPlayerApi}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full border border-cn-border rounded-[2rem] bg-stone-50 dark:bg-[#12100f] dark:border-stone-850 p-6">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-cn-orange border-t-transparent mb-3" />
                  <p className="text-xs text-cn-ink-muted">Loading your notebook page...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile pull-up drawer overlay */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 bg-stone-50 rounded-t-[2rem] border-t border-cn-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col dark:bg-[#12100f] dark:border-stone-850",
            drawerOpen ? "translate-y-0 h-[80vh]" : "translate-y-[calc(100%-3rem)] h-12"
          )}
        >
          {/* Drawer Header Handle */}
          <div
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex items-center justify-between px-6 py-3 cursor-pointer shrink-0 border-b border-cn-border dark:border-stone-850 select-none bg-white dark:bg-[#1c1a18] rounded-t-[2rem]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cn-ink dark:text-neutral-200">
                {drawerOpen ? "Close Study Notebook" : "Open Study Notebook"}
              </span>
              <span className={cn("text-[10px] transition-transform duration-300 text-cn-orange", drawerOpen ? "rotate-180" : "")}>
                ▲
              </span>
            </div>
            <div className="h-1.5 w-12 bg-neutral-300 rounded-full dark:bg-stone-700" />
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-hidden">
            {studentId ? (
              <NotebookPanel
                studentId={studentId}
                courseId={ctx.courseId}
                lessonId={lesson.id}
                lessonTitle={lesson.title}
                courseTitle={ctx.title}
                videoPlayer={videoPlayerApi}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-cn-ink-muted">
                Connecting notebook session...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
