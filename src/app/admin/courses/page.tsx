"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { IconBook } from "@/components/ui/icons";
import { getCoursesWithCoaches, toggleCourseFeatured, toggleCoursePublished } from "./actions";

type CourseItem = {
  id: string;
  title: string;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  students: number;
  coachName: string;
  coachEmail: string;
  createdAt: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      const data = await getCoursesWithCoaches();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || "Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  const handleToggleFeatured = async (courseId: string, currentFeatured: boolean) => {
    if (actioningId) return;
    setActioningId(courseId);
    try {
      const newFeatured = !currentFeatured;
      await toggleCourseFeatured(courseId, newFeatured);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isFeatured: newFeatured } : c));
    } catch (err: any) {
      alert(err.message || "Failed to update featured status.");
    } finally {
      setActioningId(null);
    }
  };

  const handleTogglePublished = async (courseId: string, currentPublished: boolean) => {
    if (actioningId) return;
    setActioningId(courseId);
    try {
      const newPublished = !currentPublished;
      await toggleCoursePublished(courseId, newPublished);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isPublished: newPublished } : c));
    } catch (err: any) {
      alert(err.message || "Failed to update published status.");
    } finally {
      setActioningId(null);
    }
  };

  // Get unique categories for filtering
  const categories = Array.from(new Set(courses.map(c => c.category)));

  const filtered = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.coachName.toLowerCase().includes(search.toLowerCase()) ||
                          c.coachEmail.toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === "published") matchesStatus = c.isPublished;
    else if (statusFilter === "draft") matchesStatus = !c.isPublished;
    else if (statusFilter === "featured") matchesStatus = c.isFeatured;

    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-cn-surface rounded-xl border border-cn-border dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
        <div className="h-12 w-full bg-cn-surface rounded-xl border border-cn-border dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
        <div className="h-64 w-full bg-cn-surface rounded-2xl border border-cn-border dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Course Management</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">{filtered.length} matching of {courses.length} total courses</p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm font-semibold text-rose-500">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cn-border bg-cn-surface p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search title, coach or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-cn-border bg-cn-canvas px-4 py-2 text-sm text-cn-ink placeholder-cn-ink-subtle focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-cn-border bg-cn-canvas px-3 py-2 text-sm text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published Only</option>
          <option value="draft">Drafts Only</option>
          <option value="featured">Featured Only</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-cn-border bg-cn-canvas px-3 py-2 text-sm text-cn-ink focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface py-16 text-center">
          <IconBook className="h-6 w-6 text-cn-ink-subtle" />
          <h2 className="text-lg font-bold text-cn-ink mt-2">No courses found</h2>
          <p className="mt-1 text-sm text-cn-ink-muted">Try modifying your filters or search criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cn-border bg-cn-canvas">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Course Details</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Coach</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Enrollments</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-cn-ink-subtle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-cn-canvas/50">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-cn-ink">{c.title}</p>
                        <p className="text-xs text-cn-ink-subtle">
                          {c.category} · {c.createdAt}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-cn-ink">{c.coachName}</p>
                        <p className="text-[10px] text-cn-ink-subtle">{c.coachEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-cn-ink-muted font-medium">{c.students} students</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={c.isPublished ? "success" : "warning"} dot>
                          {c.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {c.isFeatured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Featured Button */}
                        <button
                          type="button"
                          disabled={actioningId === c.id}
                          onClick={() => handleToggleFeatured(c.id, c.isFeatured)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                            c.isFeatured
                              ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                              : "bg-cn-canvas text-cn-ink-subtle hover:bg-cn-border hover:text-cn-ink"
                          }`}
                        >
                          {c.isFeatured ? "Unfeature" : "Feature"}
                        </button>

                        {/* Publish / Draft Toggle */}
                        <button
                          type="button"
                          disabled={actioningId === c.id}
                          onClick={() => handleTogglePublished(c.id, c.isPublished)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                            c.isPublished
                              ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                              : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                          }`}
                        >
                          {c.isPublished ? "Set Draft" : "Set Published"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
