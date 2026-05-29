"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { LearnCurriculum } from "@/components/student/learn-curriculum";
import { MarkLessonCompleteButton } from "@/components/student/mark-lesson-complete-button";
import type { CourseLearnContext, LessonOutline } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { NotebookPanel } from "@/components/notebook/NotebookPanel";
import { LiveCall } from "@/components/shared/LiveCall";
import { CodeEditorFull } from "@/components/editor/CodeEditor";
import { LessonWorldScene } from "@/components/student/lesson-world-scene";
import { TranscriptPanel } from "@/components/student/TranscriptPanel";

const LEFT_TABS = ["Overview", "Materials", "Curriculum", "Live Classes", "Transcripts"] as const;

type LearnLessonPanelProps = {
  ctx: CourseLearnContext;
  lesson: LessonOutline;
  prevOrder: number | null;
  nextOrder: number | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED BLOCK RENDERER — single source of truth for all content blocks.
   Used by both mobile and desktop layouts (was previously duplicated).
   ═══════════════════════════════════════════════════════════════════════════ */

function BlockRenderer({ blocks }: { blocks: any[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block: any) => (
        <ContentBlock key={block.id} block={block} />
      ))}
    </div>
  );
}

function ContentBlock({ block }: { block: any }) {
  switch (block.type) {
    case "heading": {
      const level = block.properties?.level || 2;
      if (level === 1)
        return (
          <h1 className="text-2xl font-extrabold tracking-tight text-cn-ink dark:text-white border-b border-cn-border/50 pb-2 mt-6 mb-2">
            {block.content}
          </h1>
        );
      if (level === 3)
        return (
          <h3 className="text-base font-bold text-cn-ink dark:text-gray-200 mt-4 mb-1">
            {block.content}
          </h3>
        );
      return (
        <h2 className="text-lg font-bold text-cn-ink dark:text-white mt-5 mb-1.5">
          {block.content}
        </h2>
      );
    }
    case "paragraph":
      return (
        <p
          className="text-sm leading-relaxed text-cn-ink-muted"
          style={{ textAlign: block.properties?.align || "left" }}
        >
          {block.content}
        </p>
      );
    case "code":
      return (
        <div className="relative group my-4">
          <div className="absolute top-2.5 right-3 flex items-center gap-2">
            <span className="text-[9px] font-bold text-cn-ink-subtle/60 uppercase tracking-wider">
              {block.properties?.language || "code"}
            </span>
            <CopyButton text={block.content} />
          </div>
          <pre className="bg-[#1e1e1e] border border-cn-border/50 p-4 rounded-2xl text-[13px] font-mono text-emerald-400 overflow-x-auto dark:border-white/5 leading-relaxed">
            <code>{block.content}</code>
          </pre>
        </div>
      );
    case "image":
      return block.content && block.content.startsWith("http") ? (
        <div className="rounded-2xl overflow-hidden border border-cn-border bg-cn-canvas/45 flex items-center justify-center max-h-[360px] my-4 dark:border-white/8 dark:bg-black/45">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.content}
            alt={block.properties?.alt || "Lesson visual"}
            className="max-h-[360px] object-contain w-full"
          />
          {block.properties?.caption && (
            <p className="text-[10px] text-cn-ink-muted text-center py-2">
              {block.properties.caption}
            </p>
          )}
        </div>
      ) : null;
    case "video":
      return block.content && block.content.startsWith("http") ? (
        <div className="rounded-2xl overflow-hidden border border-cn-border bg-cn-canvas/45 my-4 dark:border-white/8 dark:bg-black/45">
          <video
            src={block.content}
            controls
            className="w-full max-h-[280px] object-contain"
          />
        </div>
      ) : null;
    case "embed":
      return block.content && block.content.startsWith("http") ? (
        <iframe
          src={block.content}
          className="w-full h-72 rounded-2xl border border-cn-border shadow-sm my-4 dark:border-white/8"
        />
      ) : null;
    case "url":
      return block.content &&
        typeof block.content === "string" &&
        block.content.startsWith("http") ? (
        <a
          href={block.content}
          target="_blank"
          rel="noreferrer"
          className="group block rounded-2xl border border-cn-border bg-cn-surface p-4 transition hover:border-cn-orange/40 hover:shadow-sm my-4 dark:border-white/8 dark:bg-white/3"
        >
          <p className="text-sm font-semibold text-cn-ink dark:text-white mb-1 group-hover:text-cn-orange transition">
            Link Reference
          </p>
          <p className="text-xs text-cn-ink-muted truncate">{block.content}</p>
        </a>
      ) : null;
    case "callout":
      return (
        <div className="bg-cn-yellow/8 border-l-4 border-cn-yellow p-4 rounded-r-2xl flex gap-3 items-start my-4 dark:bg-yellow-500/5">
          <span className="text-lg shrink-0">💡</span>
          <p className="text-sm text-cn-ink dark:text-gray-300 font-medium leading-relaxed">
            {block.content}
          </p>
        </div>
      );
    case "quote":
      return (
        <div className="rounded-2xl border border-cn-border bg-cn-surface/70 p-5 my-4 dark:border-white/8 dark:bg-white/3">
          <p className="text-sm italic text-cn-ink dark:text-white leading-relaxed">
            &ldquo;{block.content}&rdquo;
          </p>
          {block.properties?.author ? (
            <p className="mt-2.5 text-xs font-semibold text-cn-orange">
              — {block.properties.author}
            </p>
          ) : null}
        </div>
      );
    case "resource":
      return (
        <div className="rounded-2xl border border-cn-border bg-cn-surface p-5 my-4 dark:border-white/8 dark:bg-white/3">
          <p className="text-sm font-semibold text-cn-orange mb-1">
            {block.properties?.title || "Resource"}
          </p>
          <p className="text-sm text-cn-ink-muted leading-relaxed mb-3">
            {block.content}
          </p>
          {block.content && block.content.startsWith("http") && (
            <a
              href={block.content}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cn-orange/30 bg-cn-orange/10 px-4 py-2 text-xs font-bold text-cn-orange transition hover:bg-cn-orange/20"
            >
              Open resource →
            </a>
          )}
        </div>
      );
    case "divider":
      return <hr className="my-6 border-cn-border/50 dark:border-white/5" />;
    default:
      return null;
  }
}

/** Copy button for code blocks */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="opacity-0 group-hover:opacity-100 transition text-[9px] font-bold text-cn-ink-subtle/60 hover:text-cn-orange uppercase tracking-wider"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   READING PROGRESS BAR — scroll-based progress indicator at the top.
   ═══════════════════════════════════════════════════════════════════════════ */

function ReadingProgress({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = scrollHeight > clientHeight
        ? Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
        : 100;
      setProgress(pct);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  return (
    <div className="h-0.5 w-full bg-cn-border/30 dark:bg-white/5">
      <div
        className="h-full bg-gradient-to-r from-cn-orange to-cn-pink transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HLS Player — unchanged from original.
   ═══════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS — tab bar, bottom nav, live sessions, materials.
   ═══════════════════════════════════════════════════════════════════════════ */

function TabBar({
  leftTab,
  setLeftTab,
}: {
  leftTab: (typeof LEFT_TABS)[number];
  setLeftTab: (tab: (typeof LEFT_TABS)[number]) => void;
}) {
  return (
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
  );
}

function LiveSessionList({
  sessions,
  onJoin,
}: {
  sessions: any[];
  onJoin: (url: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs text-cn-ink-muted">
          No live sessions scheduled for this course.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="p-4 rounded-2xl border border-cn-border bg-cn-canvas/50 dark:border-stone-800 dark:bg-black/50"
        >
          <h4 className="font-bold text-cn-ink dark:text-white text-sm mb-1">
            {s.title}
          </h4>
          <p className="text-[10px] text-cn-ink-muted mb-4 uppercase tracking-wider">
            {new Date(s.scheduled_at).toLocaleString()}
          </p>
          {s.status === "live" && s.daily_room_url ? (
            <button
              onClick={() => onJoin(s.daily_room_url)}
              className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-bold animate-pulse"
            >
              JOIN LIVE NOW
            </button>
          ) : (
            <div className="py-2 text-center border border-cn-border dark:border-stone-800 rounded-xl text-[10px] font-bold text-cn-ink-subtle uppercase">
              {s.status === "ended" ? "Session Ended" : "Scheduled"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonNav({
  slug,
  prevOrder,
  nextOrder,
}: {
  slug: string;
  prevOrder: number | null;
  nextOrder: number | null;
}) {
  return (
    <div className="mt-4 flex gap-3 items-center justify-between shrink-0 select-none">
      {prevOrder !== null ? (
        <Link
          href={`/learn/${slug}/lesson/${prevOrder}`}
          className="rounded-full border border-cn-border bg-white px-4 py-2 text-xs font-semibold text-cn-ink transition hover:border-cn-orange/40 dark:border-stone-850 dark:bg-stone-900"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      {nextOrder !== null ? (
        <Link
          href={`/learn/${slug}/lesson/${nextOrder}`}
          className="rounded-full bg-cn-sidebar px-4.5 py-2 text-xs font-bold text-white transition hover:bg-cn-sidebar/90 dark:bg-cn-yellow dark:text-cn-sidebar"
        >
          Next lesson →
        </Link>
      ) : (
        <Link
          href={`/learn/${slug}`}
          className="rounded-full bg-cn-orange px-4.5 py-2 text-xs font-bold text-white hover:bg-cn-orange-hover"
        >
          Back to course
        </Link>
      )}
    </div>
  );
}

function TabContent({
  leftTab,
  lesson,
  ctx,
  isJsonBlocks,
  parsedBlocks,
  body,
  liveSessions,
  onJoinCall,
  videoPlayer,
}: {
  leftTab: (typeof LEFT_TABS)[number];
  lesson: LessonOutline;
  ctx: CourseLearnContext;
  isJsonBlocks: boolean;
  parsedBlocks: any[];
  body: string;
  liveSessions: any[];
  onJoinCall: (url: string) => void;
  videoPlayer: any;
}) {
  return (
    <>
      {lesson.type === "code" && leftTab === "Overview" ? (
        <div className="h-[600px] mb-6 shrink-0">
          <CodeEditorFull lessonId={lesson.id} courseId={ctx.courseId} />
        </div>
      ) : null}

      {leftTab === "Overview" ? (
        isJsonBlocks ? (
          <BlockRenderer blocks={parsedBlocks} />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-cn-ink-muted">
            {body}
          </p>
        )
      ) : leftTab === "Materials" ? (
        <p className="text-sm text-cn-ink-muted">
          Downloadable resources appear here when coaches attach files in the lesson editor.
        </p>
      ) : leftTab === "Live Classes" ? (
        <LiveSessionList sessions={liveSessions} onJoin={onJoinCall} />
      ) : leftTab === "Transcripts" ? (
        <TranscriptPanel lessonId={lesson.id} lessonTitle={lesson.title} videoPlayer={videoPlayer} />
      ) : (
        <div className="mt-1">
          <LearnCurriculum ctx={ctx} activeOrder={lesson.orderIndex} />
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function LearnLessonPanel({ ctx, lesson, prevOrder, nextOrder }: LearnLessonPanelProps) {
  const [leftTab, setLeftTab] = useState<(typeof LEFT_TABS)[number]>("Overview");
  const completed = ctx.completedLessonIds.includes(lesson.id);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Focus mode
  const [focusMode, setFocusMode] = useState(false);

  // Live Sessions State
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);

  // Split view states
  const [isMobile, setIsMobile] = useState(false);
  const [splitWidth, setSplitWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setStudentId(user.id);
    }
    void fetchUser();
  }, []);

  useEffect(() => {
    if (leftTab === "Live Classes" && ctx.courseId) {
      const fetchLive = async () => {
        const supabase = createClient();
        if (!supabase) return;
        const { data } = await supabase
          .from("live_sessions")
          .select("*")
          .eq("course_id", ctx.courseId)
          .order("scheduled_at", { ascending: true });
        setLiveSessions(data || []);
      };
      void fetchLive();
    }
  }, [leftTab, ctx.courseId]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth >= 30 && newWidth <= 80) setSplitWidth(newWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Parse lesson content
  const body =
    lesson.content?.trim() ||
    `This lesson is ready for content from Supabase (\`lessons.content\`). When Mux is connected, video will appear in the player above.`;

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
          (b: any) => b.type === "video" && b.content && b.content.startsWith("http"),
        );
        if (videoBlock) firstVideoUrl = videoBlock.content;
      }
    }
  } catch {
    if (lesson.content && lesson.content.trim().startsWith("http")) {
      firstVideoUrl = lesson.content.trim();
    }
  }

  const parseVideoUrl = (url: string) => {
    if (!url) return { type: "none" as const };
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    );
    if (ytMatch) return { type: "youtube" as const, embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
    const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return { type: "vimeo" as const, embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    if (url.includes(".m3u8")) return { type: "hls" as const, url };
    return { type: "direct" as const, url };
  };

  const videoInfo = parseVideoUrl(firstVideoUrl || "");

  const videoPlayerApi = {
    getCurrentTime: () => videoElRef.current?.currentTime ?? 0,
    seekTo: (time: number) => {
      if (videoElRef.current) {
        videoElRef.current.currentTime = time;
        videoElRef.current.play().catch(() => {});
      }
    },
    isPlaying: () => !!videoElRef.current && !videoElRef.current.paused,
  };

  if (activeCallRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] p-4 bg-cn-canvas dark:bg-[#0a0909]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-cn-ink dark:text-white">
            Live Class: {ctx.title}
          </h2>
          <button
            onClick={() => setActiveCallRoom(null)}
            className="px-4 py-2 bg-cn-sidebar text-white rounded-xl text-xs font-bold dark:bg-cn-yellow dark:text-cn-sidebar"
          >
            Exit Call
          </button>
        </div>
        <div className="flex-1 min-h-[500px]">
          <LiveCall
            roomUrl={activeCallRoom}
            onLeave={() => setActiveCallRoom(null)}
          />
        </div>
      </div>
    );
  }

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
      return (
        <HlsPlayer url={videoInfo.url || ""} onRef={(el) => { videoElRef.current = el; }} />
      );
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
    return <LessonWorldScene ctx={ctx} lesson={lesson} />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] overflow-hidden p-2 select-none">
      {/* Reading Progress Bar */}
      <ReadingProgress containerRef={scrollContainerRef} />

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
            <span className="font-semibold text-cn-ink truncate max-w-[200px]">
              {lesson.title}
            </span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cn-orange bg-cn-orange/10 px-2 py-0.5 rounded">
              Lesson {lesson.orderIndex}
            </span>
            <h1 className="text-lg font-bold tracking-tight text-cn-ink dark:text-neutral-150 sm:text-xl truncate max-w-[300px]">
              {lesson.title}
            </h1>
            {lesson.durationMins && (
              <span className="text-xs text-cn-ink-muted font-medium">
                · {lesson.durationMins} min
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            className={cn(
              "hidden lg:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition",
              focusMode
                ? "border-cn-orange bg-cn-orange/10 text-cn-orange"
                : "border-cn-border bg-cn-canvas text-cn-ink-muted hover:border-cn-orange/40 hover:text-cn-orange dark:border-stone-800 dark:bg-stone-900",
            )}
            title={focusMode ? "Exit focus mode" : "Enter distraction-free reading mode"}
          >
            <FocusIcon />
            {focusMode ? "Exit Focus" : "Focus"}
          </button>
          <MarkLessonCompleteButton
            lessonId={lesson.id}
            courseId={ctx.courseId}
            slug={ctx.slug}
            alreadyCompleted={completed}
            isGraded={lesson.isGraded}
          />
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex relative overflow-hidden mt-4">
        {isMobile ? (
          /* ─── Mobile Layout ─── */
          <div
            ref={scrollContainerRef}
            className="flex-1 flex flex-col overflow-y-auto pb-16 scrollbar-none"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem] border border-cn-border bg-gradient-to-br from-cn-lavender/30 via-cn-canvas to-cn-yellow/20 dark:border-[#2e2a2a] shrink-0 mb-4 shadow-sm">
              {renderVideoPlayer()}
            </div>
            <TabBar leftTab={leftTab} setLeftTab={setLeftTab} />
            <div className="bg-white border border-cn-border rounded-[1.5rem] p-5 shadow-sm dark:bg-[#12100f] dark:border-stone-850 flex-1 overflow-y-auto">
              <TabContent
                leftTab={leftTab}
                lesson={lesson}
                ctx={ctx}
                isJsonBlocks={isJsonBlocks}
                parsedBlocks={parsedBlocks}
                body={body}
                liveSessions={liveSessions}
                onJoinCall={setActiveCallRoom}
                videoPlayer={videoPlayerApi}
              />
            </div>
            <LessonNav slug={ctx.slug} prevOrder={prevOrder} nextOrder={nextOrder} />
          </div>
        ) : focusMode ? (
          /* ─── Focus Mode (Desktop) — full-width, no sidebar ─── */
          <div
            ref={scrollContainerRef}
            className="mx-auto max-w-3xl flex-1 overflow-y-auto px-4 pb-16 scrollbar-thin"
          >
            {/* Compact video */}
            {videoInfo.type !== "none" && (
              <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem] border border-cn-border bg-black shrink-0 mb-6 shadow-sm dark:border-[#2e2a2a]">
                {renderVideoPlayer()}
              </div>
            )}
            <div className="bg-white border border-cn-border rounded-[1.5rem] p-8 shadow-sm dark:bg-[#12100f] dark:border-stone-850">
              {isJsonBlocks ? (
                <BlockRenderer blocks={parsedBlocks} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-cn-ink-muted">
                  {body}
                </p>
              )}
            </div>
            <LessonNav slug={ctx.slug} prevOrder={prevOrder} nextOrder={nextOrder} />
          </div>
        ) : (
          /* ─── Desktop Split Layout ─── */
          <>
            <div
              ref={scrollContainerRef}
              style={{ width: `${splitWidth}%` }}
              className="flex flex-col h-full overflow-y-auto pr-4 scrollbar-thin select-none"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-[1.75rem] border border-cn-border bg-gradient-to-br from-cn-lavender/30 via-cn-canvas to-cn-yellow/20 dark:border-[#2e2a2a] shrink-0 mb-4 shadow-sm">
                {renderVideoPlayer()}
              </div>
              <TabBar leftTab={leftTab} setLeftTab={setLeftTab} />
              <div className="bg-white border border-cn-border rounded-[1.5rem] p-5 shadow-sm dark:bg-[#12100f] dark:border-stone-850 flex-1 overflow-y-auto">
                <TabContent
                  leftTab={leftTab}
                  lesson={lesson}
                  ctx={ctx}
                  isJsonBlocks={isJsonBlocks}
                  parsedBlocks={parsedBlocks}
                  body={body}
                  liveSessions={liveSessions}
                  onJoinCall={setActiveCallRoom}
                  videoPlayer={videoPlayerApi}
                />
              </div>
              <LessonNav slug={ctx.slug} prevOrder={prevOrder} nextOrder={nextOrder} />
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
                  <p className="text-xs text-cn-ink-muted">
                    Loading your notebook page...
                  </p>
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
            drawerOpen
              ? "translate-y-0 h-[80vh]"
              : "translate-y-[calc(100%-3rem)] h-12",
          )}
        >
          <div
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex items-center justify-between px-6 py-3 cursor-pointer shrink-0 border-b border-cn-border dark:border-stone-850 select-none bg-white dark:bg-[#1c1a18] rounded-t-[2rem]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cn-ink dark:text-neutral-200">
                {drawerOpen ? "Close Study Notebook" : "Open Study Notebook"}
              </span>
              <span
                className={cn(
                  "text-[10px] transition-transform duration-300 text-cn-orange",
                  drawerOpen ? "rotate-180" : "",
                )}
              >
                ▲
              </span>
            </div>
            <div className="h-1.5 w-12 bg-neutral-300 rounded-full dark:bg-stone-700" />
          </div>
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

/* ─── Icons ─── */

function FocusIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
    </svg>
  );
}
