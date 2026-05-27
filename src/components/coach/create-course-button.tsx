"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCoachCourse } from "@/app/coach/courses/actions";

type Difficulty = "beginner" | "intermediate" | "advanced";
type PricingMode = "free" | "paid";

export function CreateCourseButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [pricingMode, setPricingMode] = useState<PricingMode>("free");
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");

  const handleOpen = () => {
    setTitle("");
    setCategory("");
    setDifficulty("beginner");
    setPricingMode("free");
    setPrice("0");
    setDescription("");
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
  };

  const handlePricingChange = (mode: PricingMode) => {
    setPricingMode(mode);
    if (mode === "free") setPrice("0");
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

    const trimmedCategory = category.trim();
    if (!trimmedCategory) {
      setError("Please enter a category for your course.");
      return;
    }

    const numericPrice = pricingMode === "free" ? 0 : Number(price);
    if (pricingMode === "paid" && (isNaN(numericPrice) || numericPrice <= 0)) {
      setError("Paid courses must have a price greater than $0.");
      return;
    }

    setLoading(true);

    try {
      const result = await createCoachCourse({
        title: trimmedTitle,
        category: trimmedCategory,
        difficulty,
        price: numericPrice,
        description: description.trim(),
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
              description: description.trim() || null,
              category: trimmedCategory,
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

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Expert" },
  ];

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
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={handleClose}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[#2e2a2a] bg-[#141218] p-8 shadow-2xl shadow-black/90 animate-in zoom-in-95 duration-300"
            style={{ position: "relative", zIndex: 10000 }}
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Create New Course</h2>
                <p className="mt-1 text-sm text-gray-400">Start building your curriculum.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg border border-[#2e2a2a] bg-[#1c1a1e] flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 transition"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs font-semibold text-rose-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Course Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python Mastery: Zero to Hero"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#2e2a2a] bg-[#1c1a1e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
                />
              </div>

              {/* Category (free text) */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Category <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science, Finance, Photography..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#2e2a2a] bg-[#1c1a1e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
                />
                <p className="mt-1.5 text-[11px] text-gray-500 italic">Type any category — not restricted to a list.</p>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Difficulty Level <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {difficultyOptions.map((opt) => {
                    const isActive = difficulty === opt.value;
                    const activeStyles: Record<Difficulty, string> = {
                      beginner: "border-teal-500 bg-teal-500/15 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.15)]",
                      intermediate: "border-amber-500 bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
                      advanced: "border-rose-500 bg-rose-500/15 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
                    };
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDifficulty(opt.value)}
                        className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                          isActive
                            ? activeStyles[opt.value]
                            : "border-[#2e2a2a] bg-[#1c1a1e] text-gray-400 hover:border-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Pricing <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePricingChange("free")}
                    className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                      pricingMode === "free"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : "border-[#2e2a2a] bg-[#1c1a1e] text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePricingChange("paid")}
                    className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                      pricingMode === "paid"
                        ? "border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                        : "border-[#2e2a2a] bg-[#1c1a1e] text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Paid
                  </button>
                </div>

                {/* Price input (shown only for Paid) */}
                {pricingMode === "paid" && (
                  <div className="mt-3 relative animate-in slide-in-from-top-1 duration-200">
                    <span className="absolute left-4 top-3 text-sm text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="29.99"
                      className="w-full rounded-xl border border-[#2e2a2a] bg-[#1c1a1e] pl-8 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
                    />
                  </div>
                )}
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What is this course about? (shown to students in the course preview)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#2e2a2a] bg-[#1c1a1e] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition resize-y min-h-[80px]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-[#2e2a2a] bg-[#1c1a1e] px-4 py-3 text-sm font-bold text-gray-300 hover:bg-[#252228] hover:border-gray-500 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[1.6] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-bold text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Creating...
                    </>
                  ) : (
                    "Create Course"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
