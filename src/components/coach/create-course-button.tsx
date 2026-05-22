"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCoachCourse } from "@/app/coach/courses/actions";

export function CreateCourseButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [price, setPrice] = useState("0");

  const handleOpen = () => {
    setTitle("");
    setCategory("Computer Science");
    setDifficulty("beginner");
    setPrice("0");
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // Validation
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      setError("Course title must be between 5 and 200 characters.");
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    setLoading(true);

    try {
      const result = await createCoachCourse({
        title: trimmedTitle,
        category,
        difficulty,
        price: numericPrice,
      });

      if (!result.ok) throw new Error(result.error);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            `cognara_pending_course_${result.slug}`,
            JSON.stringify({
              id: `pending-${result.slug}`,
              title: trimmedTitle,
              slug: result.slug,
              description: null,
              category: category.trim(),
              difficulty,
              price_usd: numericPrice,
              is_published: false,
            }),
          );
        } catch {
          // Ignore demo persistence failures.
        }
      }

      router.push(`/coach/courses/${result.slug}`);
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="shimmer-btn bg-gradient-to-r from-primary to-purple-600 text-white px-7 py-3.5 rounded-xl font-black text-sm flex items-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-95 transition-all w-fit cursor-pointer"
      >
        <span className="material-symbols-outlined text-xl">add_circle</span>
        Create New Course
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={handleClose}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/30 bg-cn-surface p-8 shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-300 dark:border-[#2e2a2a] dark:bg-[#1a1818]" style={{ position: 'relative', zIndex: 10000 }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-cn-ink dark:text-white">Create New Course</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-cn-ink-muted hover:text-cn-ink dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intro to Machine Learning"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-cn-border bg-cn-canvas px-3 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Psychology">Psychology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-xl border border-cn-border bg-cn-canvas px-3 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cn-ink-muted mb-1.5">
                  Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-sm text-cn-ink-muted font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-cn-border bg-cn-canvas pl-8 pr-4 py-2.5 text-sm text-cn-ink focus:border-indigo-500 focus:outline-none dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:text-white"
                  />
                </div>
                <p className="mt-1 text-[10px] text-cn-ink-subtle">Set to 0 to make it free to enroll.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cn-border dark:border-[#2e2a2a]">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-xl border border-cn-border px-4 py-2.5 text-sm font-bold text-cn-ink hover:bg-cn-canvas disabled:opacity-50 dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
