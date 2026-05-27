"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

/**
 * Dashboard AI Study Insights Widget — shows personalized AI-generated
 * study tips, pattern analysis, and quick actions. Lives in the dashboard sidebar.
 */

type InsightType = "tip" | "pattern" | "recommendation";

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  action?: { label: string; href: string };
}

function generateLocalInsights(stats: {
  streakDays: number;
  completedCourses: number;
  enrolledCourses: number;
  progressPercent: number;
  totalXp: number;
  level: number;
}): Insight[] {
  const insights: Insight[] = [];

  // Streak-based insights
  if (stats.streakDays >= 7) {
    insights.push({
      id: "streak-fire",
      type: "pattern",
      title: `🔥 ${stats.streakDays}-day streak!`,
      body: "You're building a powerful habit. Research shows that consistent daily practice is 3x more effective than cramming sessions.",
    });
  } else if (stats.streakDays === 0) {
    insights.push({
      id: "streak-start",
      type: "tip",
      title: "📅 Start a streak today",
      body: "Complete just one lesson to start building momentum. Even 10 minutes counts toward your daily goal.",
      action: { label: "Browse courses", href: "/my-courses" },
    });
  }

  // Progress-based insights
  if (stats.progressPercent > 75) {
    insights.push({
      id: "progress-high",
      type: "recommendation",
      title: "🎯 Almost there!",
      body: `You're ${stats.progressPercent}% through your courses. A focused sprint this week could push you to completion.`,
      action: { label: "Continue learning", href: "/my-courses" },
    });
  } else if (stats.progressPercent > 0 && stats.progressPercent < 25) {
    insights.push({
      id: "progress-early",
      type: "tip",
      title: "🌱 Building foundations",
      body: "You're in the early stages — this is where the most important concepts are introduced. Take notes and don't rush.",
    });
  }

  // XP / Level insights
  if (stats.level >= 5) {
    insights.push({
      id: "level-high",
      type: "pattern",
      title: `⚡ Level ${stats.level} achieved`,
      body: `With ${stats.totalXp} XP earned, you're in the top tier of learners. Try a code challenge to push further.`,
      action: { label: "Try a challenge", href: "/agent?task=challenge" },
    });
  }

  // Course completion
  if (stats.completedCourses > 0) {
    insights.push({
      id: "completed",
      type: "pattern",
      title: `🏆 ${stats.completedCourses} course${stats.completedCourses > 1 ? "s" : ""} completed`,
      body: "Great work! Each completed course reinforces your knowledge graph. Consider reviewing key concepts with flashcards.",
      action: { label: "Generate flashcards", href: "/agent?task=flashcard" },
    });
  }

  // Always add a general tip
  const tips = [
    { title: "🧠 Spaced repetition", body: "Review material at increasing intervals — 1 day, 3 days, 7 days, 14 days. This locks concepts into long-term memory." },
    { title: "✍️ Active recall", body: "Close your notes and try to write down what you remember. This is 2x more effective than re-reading." },
    { title: "🎯 Feynman Technique", body: "Try explaining a concept in simple terms. If you can't, you don't fully understand it yet — use the ELI5 agent skill." },
    { title: "⏰ Pomodoro Method", body: "Study for 25 minutes, then take a 5-minute break. After 4 cycles, take a 15-minute break." },
  ];
  const tipIdx = (stats.streakDays + stats.level + new Date().getDate()) % tips.length;
  insights.push({ id: "daily-tip", type: "tip", ...tips[tipIdx] });

  return insights.slice(0, 3);
}

const TYPE_STYLES: Record<InsightType, { bg: string; border: string; badge: string; badgeText: string }> = {
  tip: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/15 hover:border-blue-500/30",
    badge: "bg-blue-500/15 text-blue-500",
    badgeText: "TIP",
  },
  pattern: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/15 hover:border-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-500",
    badgeText: "INSIGHT",
  },
  recommendation: {
    bg: "bg-primary/5",
    border: "border-primary/15 hover:border-primary/30",
    badge: "bg-primary/15 text-primary",
    badgeText: "ACTION",
  },
};

export function DashboardInsightsWidget({
  streakDays,
  completedCourses,
  enrolledCourses,
  progressPercent,
  totalXp,
  level,
}: {
  streakDays: number;
  completedCourses: number;
  enrolledCourses: number;
  progressPercent: number;
  totalXp: number;
  level: number;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  const insights = generateLocalInsights({
    streakDays,
    completedCourses,
    enrolledCourses,
    progressPercent,
    totalXp,
    level,
  });

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-on-surface text-xs uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[16px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          AI Study Insights
        </h4>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-primary hover:text-white hover:bg-primary/20 p-1.5 rounded-lg text-xs transition-all"
          title="Refresh insights"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
        </button>
      </div>

      <div className="flex flex-col gap-3" key={refreshKey}>
        {insights.map((insight, i) => {
          const styles = TYPE_STYLES[insight.type];
          return (
            <div
              key={insight.id}
              className={`rounded-2xl ${styles.bg} border ${styles.border} p-4 transition-all duration-300`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`${styles.badge} px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider`}
                    >
                      {styles.badgeText}
                    </span>
                  </div>
                  <p className="font-bold text-on-surface text-sm leading-snug mb-1">
                    {insight.title}
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed opacity-80">
                    {insight.body}
                  </p>
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all"
                    >
                      {insight.action.label}
                      <span className="material-symbols-outlined text-[12px]">
                        arrow_forward
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/agent?task=progress_report"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
      >
        <span
          className="material-symbols-outlined text-[16px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          insights
        </span>
        Full AI Progress Report
      </Link>
    </div>
  );
}
