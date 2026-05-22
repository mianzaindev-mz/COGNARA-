"use client";

import { useState } from "react";
import Link from "next/link";
import type { CourseLearnContext, LessonOutline } from "@/lib/student/lesson-viewer";
import { cn } from "@/lib/utils/cn";

type LessonWorldSceneProps = {
  ctx: CourseLearnContext;
  lesson: LessonOutline;
};

type NodeState = "complete" | "current" | "locked" | "available";

export function LessonWorldScene({ ctx, lesson }: LessonWorldSceneProps) {
  const [selected, setSelected] = useState<LessonOutline>(lesson);
  const completed = new Set(ctx.completedLessonIds);
  const lessons = ctx.lessons.slice(0, 10);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-[#0b0718]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.2),transparent_42%),linear-gradient(145deg,#0c071a,#05030b_70%)]" />
      <div
        className="absolute left-1/2 top-[54%] h-[86%] w-[116%] -translate-x-1/2 -translate-y-1/2 rounded-[48%] border border-violet-300/10 bg-[linear-gradient(rgba(139,92,246,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,.12)_1px,transparent_1px)] bg-[size:34px_34px] opacity-70"
        style={{ transform: "translate(-50%, -50%) perspective(900px) rotateX(62deg) rotateZ(-10deg)" }}
      />
      <div className="absolute inset-8 rounded-[2rem] border border-violet-400/10 bg-violet-500/5 shadow-[inset_0_0_80px_rgba(124,58,237,.12)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M120 390 C 240 240, 340 430, 455 280 S 640 160, 820 245"
          fill="none"
          stroke="rgba(139,92,246,.25)"
          strokeWidth="46"
          strokeLinecap="round"
        />
        <path
          d="M120 390 C 240 240, 340 430, 455 280 S 640 160, 820 245"
          fill="none"
          stroke="rgba(255,255,255,.22)"
          strokeWidth="3"
          strokeDasharray="22 18"
          strokeLinecap="round"
        />
      </svg>

      {lessons.map((item, index) => {
        const count = Math.max(lessons.length - 1, 1);
        const progress = index / count;
        const x = 13 + progress * 74;
        const y = 68 - Math.sin(progress * Math.PI * 2.15) * 20 - progress * 28;
        const previousDone = index === 0 || completed.has(lessons[index - 1]?.id);
        const state: NodeState =
          completed.has(item.id)
            ? "complete"
            : item.id === lesson.id
              ? "current"
              : previousDone
                ? "available"
                : "locked";
        const active = selected.id === item.id;

        return (
          <button
            key={item.id}
            type="button"
            disabled={state === "locked"}
            onClick={() => setSelected(item)}
            className={cn(
              "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center transition-all duration-300",
              active ? "z-20 scale-110" : "z-10 hover:scale-105",
              state === "locked" && "cursor-not-allowed opacity-55",
            )}
            style={{ left: `${x}%`, top: `${Math.max(20, Math.min(78, y))}%` }}
          >
            <span
              className={cn(
                "relative grid h-16 w-20 place-items-center rounded-[52%_48%_48%_52%] border text-[10px] font-black shadow-[0_18px_30px_rgba(0,0,0,.35)]",
                "before:absolute before:inset-x-2 before:-bottom-2 before:h-4 before:rounded-[50%] before:bg-black/35 before:blur-sm",
                state === "complete" && "border-emerald-300/40 bg-emerald-500 text-white",
                state === "current" && "animate-[pulse_2s_ease-in-out_infinite] border-orange-200/70 bg-cn-orange text-white shadow-cn-orange/25",
                state === "available" && "border-yellow-100/40 bg-yellow-200 text-[#432c09]",
                state === "locked" && "border-white/10 bg-neutral-500 text-white",
              )}
              style={{ transform: "perspective(380px) rotateX(48deg) rotateZ(-8deg)" }}
            >
              <span className="relative z-10" style={{ transform: "rotateZ(8deg) rotateX(-28deg)" }}>
                {state === "complete" ? "DONE" : state === "locked" ? "LOCK" : String(index + 1).padStart(2, "0")}
              </span>
            </span>
            <span className="max-w-28 rounded-xl border border-white/10 bg-black/55 px-2.5 py-1 text-[9px] font-bold leading-tight text-white shadow-lg backdrop-blur">
              {item.title}
            </span>
          </button>
        );
      })}

      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/55 p-3 text-left shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cn-orange">Lesson Pathway</p>
            <p className="mt-1 line-clamp-1 text-sm font-black text-white">{selected.title}</p>
            <p className="mt-1 text-[11px] text-white/55">Layered 2D map with depth motion, no WebGL renderer.</p>
          </div>
          <Link
            href={`/learn/${ctx.slug}/lesson/${selected.orderIndex}`}
            className="pointer-events-auto shrink-0 rounded-xl bg-cn-orange px-3 py-2 text-[10px] font-black text-white shadow-md transition hover:bg-cn-orange-hover"
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}
