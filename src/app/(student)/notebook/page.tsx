"use client";

import { useState, useCallback } from "react";
import { NotebookTextEditor } from "@/components/notebook/NotebookTextEditor";

type Notebook = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

const DEMO_NOTEBOOKS: Notebook[] = [
  {
    id: "1",
    title: "Python Basics Notes",
    content:
      "<h2>Variables &amp; Types</h2><p>Python is dynamically typed — you don't need to declare types.</p><pre><code>name = 'COGNARA'\nage = 2\npi = 3.14</code></pre>",
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Data Structures",
    content:
      "<h2>Lists vs Tuples</h2><p>Lists are mutable, tuples are immutable.</p><ul><li>Lists: <code>[1, 2, 3]</code></li><li>Tuples: <code>(1, 2, 3)</code></li></ul>",
    updatedAt: "1 day ago",
  },
  {
    id: "3",
    title: "Algorithm Notes",
    content: "",
    updatedAt: "3 days ago",
  },
];

export default function NotebookPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(DEMO_NOTEBOOKS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);

  const active = notebooks.find((n) => n.id === activeId);

  const createNotebook = useCallback(() => {
    const nb: Notebook = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      content: "",
      updatedAt: "Just now",
    };
    setNotebooks((prev) => [nb, ...prev]);
    setActiveId(nb.id);
    setEditingTitle(nb.id);
  }, []);

  const updateContent = useCallback(
    (html: string) => {
      if (!activeId) return;
      setNotebooks((prev) =>
        prev.map((n) =>
          n.id === activeId ? { ...n, content: html, updatedAt: "Just now" } : n,
        ),
      );
    },
    [activeId],
  );

  const updateTitle = useCallback(
    (id: string, title: string) => {
      setNotebooks((prev) =>
        prev.map((n) => (n.id === id ? { ...n, title: title || "Untitled" } : n)),
      );
      setEditingTitle(null);
    },
    [],
  );

  const deleteNotebook = useCallback(
    (id: string) => {
      setNotebooks((prev) => prev.filter((n) => n.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">
            Notebook
          </h1>
          <p className="mt-0.5 text-sm text-cn-ink-muted">
            Rich text notes with formatting, code blocks &amp; highlights.
          </p>
        </div>
        <button
          type="button"
          onClick={createNotebook}
          className="flex items-center gap-1.5 rounded-xl bg-cn-orange px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-cn-orange-hover"
        >
          <PlusIcon className="h-4 w-4" />
          New notebook
        </button>
      </div>

      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 14rem)" }}>
        {/* Sidebar: notebook list */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="flex flex-col gap-1">
            {notebooks.map((nb) => (
              <button
                key={nb.id}
                type="button"
                onClick={() => setActiveId(nb.id)}
                className={`group flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                  activeId === nb.id
                    ? "bg-cn-orange/10 text-cn-orange"
                    : "text-cn-ink-muted hover:bg-cn-border/40 hover:text-cn-ink"
                }`}
              >
                <NotebookIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  {editingTitle === nb.id ? (
                    <input
                      autoFocus
                      defaultValue={nb.title}
                      onBlur={(e) => updateTitle(nb.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateTitle(nb.id, e.currentTarget.value);
                      }}
                      className="w-full rounded bg-cn-canvas px-1 text-sm font-semibold text-cn-ink outline-none ring-1 ring-cn-orange"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="block truncate text-sm font-semibold">
                      {nb.title}
                    </span>
                  )}
                  <span className="block text-[11px] text-cn-ink-subtle">
                    {nb.updatedAt}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotebook(nb.id);
                  }}
                  className="mt-0.5 hidden h-5 w-5 shrink-0 items-center justify-center rounded text-cn-ink-subtle transition hover:bg-red-500/10 hover:text-red-500 group-hover:flex"
                  title="Delete"
                >
                  ×
                </button>
              </button>
            ))}
          </div>
        </aside>

        {/* Main: editor or empty state */}
        <div className="min-w-0 flex-1">
          {active ? (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTitle(active.id)}
                  className="text-lg font-bold text-cn-ink transition hover:text-cn-orange"
                >
                  {active.title}
                </button>
                <span className="text-xs text-cn-ink-subtle">·</span>
                <span className="text-xs text-cn-ink-subtle">{active.updatedAt}</span>
              </div>
              <NotebookTextEditor
                key={active.id}
                initialContent={active.content}
                onChange={updateContent}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface/50 p-12 text-center">
              <NotebookIcon className="mb-3 h-10 w-10 text-cn-ink-subtle/50" />
              <h3 className="text-lg font-bold text-cn-ink">Select or create a notebook</h3>
              <p className="mt-1 max-w-sm text-sm text-cn-ink-muted">
                Your notes are saved automatically. Use the toolbar for headings, code blocks,
                highlights, and more.
              </p>
              {/* Mobile: show notebook list */}
              <div className="mt-6 flex flex-col gap-1 lg:hidden">
                {notebooks.map((nb) => (
                  <button
                    key={nb.id}
                    type="button"
                    onClick={() => setActiveId(nb.id)}
                    className="rounded-xl border border-cn-border px-4 py-2 text-sm font-medium text-cn-ink transition hover:border-cn-orange hover:text-cn-orange"
                  >
                    {nb.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
    </svg>
  );
}

function NotebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M8.25 21h8.25a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H8.25A2.25 2.25 0 006 6.75v12A2.25 2.25 0 008.25 21z"
      />
    </svg>
  );
}
