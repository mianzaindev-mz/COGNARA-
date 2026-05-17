"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Wraps page content with a smooth fade-slide transition on route changes.
 * Uses CSS animations — no external libraries needed.
 */
export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayedPath, setDisplayedPath] = useState(pathname);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (pathname !== displayedPath) {
      setPhase("exit");
      const timeout = setTimeout(() => {
        setDisplayedPath(pathname);
        setPhase("enter");
      }, 150); // match CSS exit duration
      return () => clearTimeout(timeout);
    }
  }, [pathname, displayedPath]);

  return (
    <div
      className={`${className} ${
        phase === "enter"
          ? "animate-[pageEnter_0.3s_ease-out_forwards]"
          : "animate-[pageExit_0.15s_ease-in_forwards]"
      }`}
      key={displayedPath}
    >
      {children}
    </div>
  );
}
