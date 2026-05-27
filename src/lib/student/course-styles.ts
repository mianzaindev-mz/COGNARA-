/** Learnify-style card tints by category + difficulty badge colors */

const CATEGORY_STYLES: Record<string, { tint: string; badge: string }> = {
  Marketing: {
    tint: "bg-[#fff4d6] border-cn-yellow/40 dark:bg-[#2a2418] dark:border-cn-yellow/30",
    badge: "bg-cn-yellow/90 text-cn-sidebar",
  },
  "Computer Science": {
    tint: "bg-[#ebe4ff] border-cn-lavender/35 dark:bg-[#221e2e] dark:border-cn-lavender/30",
    badge: "bg-cn-lavender text-cn-sidebar",
  },
  Psychology: {
    tint: "bg-[#e4f2ff] border-sky-200/60 dark:bg-[#1a2228] dark:border-sky-500/30",
    badge: "bg-sky-300/90 text-cn-sidebar",
  },
  Design: {
    tint: "bg-[#ffe4f0] border-pink-200/50 dark:bg-[#2a1820] dark:border-pink-500/30",
    badge: "bg-pink-300/90 text-cn-sidebar",
  },
  Business: {
    tint: "bg-[#e6f7ed] border-emerald-200/50 dark:bg-[#182a1e] dark:border-emerald-500/30",
    badge: "bg-emerald-300/90 text-cn-sidebar",
  },
  Science: {
    tint: "bg-[#fff0e4] border-orange-200/50 dark:bg-[#2a2018] dark:border-orange-500/30",
    badge: "bg-orange-300/90 text-cn-sidebar",
  },
  Mathematics: {
    tint: "bg-[#e4ecff] border-indigo-200/50 dark:bg-[#1a1e2e] dark:border-indigo-500/30",
    badge: "bg-indigo-300/90 text-cn-sidebar",
  },
};

const DEFAULT_STYLE = {
  tint: "bg-cn-surface border-cn-border",
  badge: "bg-cn-orange/15 text-cn-orange",
};

export function getCourseCardStyle(category: string | null | undefined) {
  if (!category) return DEFAULT_STYLE;
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}

// ─── Difficulty badge styling ────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, { classes: string; icon: string }> = {
  beginner: {
    classes: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: "🌱",
  },
  intermediate: {
    classes: "bg-amber-500/20 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    icon: "⚡",
  },
  advanced: {
    classes: "bg-rose-500/20 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    icon: "🔥",
  },
};

const DEFAULT_DIFFICULTY = {
  classes: "bg-cn-surface/50 text-cn-ink-muted",
  icon: "📘",
};

export function getDifficultyStyle(difficulty: string | null | undefined) {
  if (!difficulty) return DEFAULT_DIFFICULTY;
  return DIFFICULTY_STYLES[difficulty] ?? DEFAULT_DIFFICULTY;
}
