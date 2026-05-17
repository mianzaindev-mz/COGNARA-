"use client";

import { useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type TopBarSearchProps = {
  className?: string;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onClose?: () => void;
};

export function TopBarSearch({
  className,
  placeholder = "Search courses, lessons…",
  inputRef,
  onClose,
}: TopBarSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/courses?q=${encodeURIComponent(q)}`);
    setQuery("");
    onClose?.();
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
      className={cn(
        "flex w-full items-center gap-2 rounded-full border border-cn-border bg-cn-surface py-1 pl-5 pr-1.5 shadow-sm transition-colors duration-300 focus-within:border-cn-orange/50 focus-within:ring-2 focus-within:ring-cn-orange/10",
        className,
      )}
    >
      <span className="sr-only">Search</span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-cn-ink outline-none placeholder:text-cn-ink-subtle"
      />
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cn-ink-muted transition-colors hover:bg-cn-canvas hover:text-cn-ink"
          aria-label="Close search"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
      <button
        type="submit"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cn-orange text-white transition-colors duration-300 hover:bg-cn-orange-hover"
        aria-label="Search"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </button>
    </form>
  );
}
