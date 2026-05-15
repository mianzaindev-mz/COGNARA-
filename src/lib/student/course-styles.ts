/** Learnify-style card tints by category (fallback for uncategorized courses). */

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
};

const DEFAULT_STYLE = {
  tint: "bg-cn-surface border-cn-border",
  badge: "bg-cn-orange/15 text-cn-orange",
};

export function getCourseCardStyle(category: string | null | undefined) {
  if (!category) return DEFAULT_STYLE;
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}
