"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNotebookWithFirstPage } from "@/lib/notebook/create-notebook";

type CreateNotebookShortcutProps = {
  className?: string;
};

export function CreateNotebookShortcut({ className }: CreateNotebookShortcutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createNotebookWithFirstPage();
      const params = new URLSearchParams({ notebook: result.notebookId });
      if (result.pageId) params.set("page", result.pageId);
      router.push(`/notebook?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notebook could not be created.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[20px]">add_notes</span>
        {loading ? "Creating..." : "Create Notebook"}
      </button>
      {error && (
        <p className="mt-2 max-w-sm text-xs font-semibold text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
