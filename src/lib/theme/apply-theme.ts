import type { Theme } from "@/lib/theme/types";

export function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function applyThemeWithTransition(theme: Theme) {
  const run = () => applyThemeClass(theme);

  if (typeof document === "undefined") {
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };

  if (doc.startViewTransition) {
    try {
      const t = doc.startViewTransition(() => { run(); });
      t.finished.catch(() => {/* transition aborted — safe to ignore */});
    } catch {
      run();
    }
    return;
  }

  run();
}
