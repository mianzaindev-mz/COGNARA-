// src/app/coach/grades/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";

type GradedSubmission = {
  id: string;
  student_id: string;
  quiz_id: string;
  attempt_id: string;
  course_id: string | null;
  raw_score: number;
  max_score: number;
  percentage: number;
  letter_grade: string;
  grade_point: number;
  passed: boolean;
  question_grades: any[];
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommended_resources: string[];
  instructor_note: string | null;
  instructor_override: number | null;
  grading_method: string;
  finalized: boolean;
  created_at: string;
  student?: { full_name: string; username: string };
  quiz?: { title: string };
  course?: { title: string };
};

export default function CoachGradeBookPage() {
  const { notify } = useToast();
  const [submissions, setSubmissions] = useState<GradedSubmission[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Override Modal State
  const [selectedSub, setSelectedSub] = useState<GradedSubmission | null>(null);
  const [overrideScore, setOverrideScore] = useState<string>("");
  const [instructorNote, setInstructorNote] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Filters State
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedQuizId, setSelectedQuizId] = useState<string>("all");

  const loadGradesData = async () => {
    setLoading(true);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch coach's course listings
          const { data: coachCourses } = await supabase
            .from("courses")
            .select("id, title")
            .eq("coach_id", user.id);
          setCourses(coachCourses || []);

          // Fetch graded submissions for this coach
          const { data, error } = await supabase
            .from("graded_submissions")
            .select(`
              *,
              student:student_id (full_name, username),
              quiz:quiz_id (title),
              course:course_id (title)
            `)
            .eq("coach_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          setSubmissions(data || []);

          // Deduplicate quizzes from submissions list
          const uniqueQuizzes = Array.from(
            new Map((data || []).filter((s: any) => s.quiz).map((s: any) => [s.quiz_id, s.quiz])).values()
          );
          setQuizzes(uniqueQuizzes);
        }
      }
    } catch {
      notify({ title: "Load Error", description: "Failed to load grade book parameters.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGradesData();
  }, []);

  const handleOpenOverride = (sub: GradedSubmission) => {
    setSelectedSub(sub);
    setOverrideScore(sub.instructor_override !== null ? sub.instructor_override.toString() : sub.percentage.toString());
    setInstructorNote(sub.instructor_note || "");
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSaveLoading(true);

    const scoreVal = parseFloat(overrideScore);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      notify({ title: "Validation Error", description: "Override score must be between 0 and 100.", tone: "error" });
      setSaveLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/grading/${selectedSub.id}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructor_override: scoreVal,
          instructor_note: instructorNote
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify({ title: "Override Saved", description: "Grade updated successfully.", tone: "success" });
      setSelectedSub(null);
      loadGradesData();
    } catch (err: any) {
      notify({ title: "Override Failed", description: err.message, tone: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  // Filters calculation
  const filteredSubmissions = submissions.filter(s => {
    const courseMatch = selectedCourseId === "all" || s.course_id === selectedCourseId;
    const quizMatch = selectedQuizId === "all" || s.quiz_id === selectedQuizId;
    return courseMatch && quizMatch;
  });

  // Simple analytics stats
  const averageClassScore = filteredSubmissions.length > 0
    ? filteredSubmissions.reduce((sum, s) => sum + (s.instructor_override !== null ? s.instructor_override : s.percentage), 0) / filteredSubmissions.length
    : 0;

  const passedCount = filteredSubmissions.filter(s => s.passed).length;
  const passRate = filteredSubmissions.length > 0
    ? Math.round((passedCount / filteredSubmissions.length) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-7xl h-full pb-16">
      {/* Header */}
      <section className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-500 animate-pulse text-[28px]">table_chart</span>
          Instructor Grade Book
        </h1>
        <p className="text-sm text-cn-ink-muted">View class achievements, customize grade scales, and apply professor grade overrides.</p>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Average Percentage Score</span>
          <span className="text-3xl font-black text-cn-ink">{averageClassScore.toFixed(1)}%</span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Passing submissions</span>
          <span className="text-3xl font-black text-primary">{passedCount} <span className="text-xs text-cn-ink-subtle">attempts</span></span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Total submissions</span>
          <span className="text-3xl font-black text-cn-ink">{filteredSubmissions.length}</span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Class Pass Rate</span>
          <span className="text-3xl font-black text-emerald-500">{passRate}%</span>
        </div>
      </div>

      {/* Filters workspace */}
      <div className="border border-cn-border bg-cn-surface p-4 rounded-2xl flex gap-4 items-center">
        <span className="text-xs font-bold text-cn-ink-subtle uppercase">Filters:</span>
        <div className="flex gap-4 flex-1">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold text-cn-ink-subtle uppercase">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-cn-canvas border border-cn-border rounded-xl px-3.5 py-2 text-xs text-cn-ink outline-none focus:border-rose-500/40"
            >
              <option value="all">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold text-cn-ink-subtle uppercase">Quiz / Assessment</label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="bg-cn-canvas border border-cn-border rounded-xl px-3.5 py-2 text-xs text-cn-ink outline-none focus:border-rose-500/40"
            >
              <option value="all">All Quizzes</option>
              {quizzes.map(q => <option key={q.id || q.quiz_id} value={q.id || q.quiz_id}>{q.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grade book list */}
      <div className="border border-cn-border bg-cn-surface rounded-2xl shadow-sm overflow-hidden mt-2">
        {loading ? (
          <div className="p-12 text-center text-xs text-cn-ink-subtle">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500/20 border-t-rose-500 inline-block mb-3" />
            <p>Loading coach database records...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-cn-ink-subtle opacity-40">assignment_turned_in</span>
            <p className="text-sm font-bold text-cn-ink">No Quiz Submissions Graded</p>
            <p className="text-xs text-cn-ink-subtle">No student attempts have been submitted/graded matching your selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-cn-ink border-collapse">
              <thead className="bg-cn-canvas border-b border-cn-border text-cn-ink-subtle font-bold">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Course Link</th>
                  <th className="px-5 py-3">Quiz / Assessment</th>
                  <th className="px-5 py-3">Base Score</th>
                  <th className="px-5 py-3">Override Score</th>
                  <th className="px-5 py-3">Grade Point</th>
                  <th className="px-5 py-3">Grading System</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-cn-canvas/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold">{sub.student?.full_name || "Anonymous Learner"}</td>
                    <td className="px-5 py-3.5">{sub.course?.title || "Independent"}</td>
                    <td className="px-5 py-3.5 font-semibold">{sub.quiz?.title || "Assessment"}</td>
                    <td className="px-5 py-3.5 font-mono">{sub.percentage.toFixed(1)}%</td>
                    <td className="px-5 py-3.5 font-bold text-rose-500 font-mono">
                      {sub.instructor_override !== null ? `${sub.instructor_override.toFixed(1)}%` : "None"}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold">
                      {sub.grade_point.toFixed(1)} GP ({sub.letter_grade})
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={sub.grading_method === "hybrid" ? "warning" : "success"} size="sm" className="capitalize">
                        {sub.grading_method}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenOverride(sub)}
                        className="py-1 px-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 rounded-xl text-[10px] font-bold transition border border-rose-500/10"
                      >
                        Override Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Override Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedSub(null)} />
          <form
            onSubmit={handleSaveOverride}
            className="relative w-full max-w-md rounded-3xl p-6 flex flex-col gap-4 shadow-2xl border border-[rgba(255,255,255,0.08)] bg-[#141420] text-white animate-in zoom-in-95 duration-300"
          >
            <header className="flex justify-between items-center pb-2 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-xs font-bold uppercase text-rose-500">Override Grade Evaluation</span>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="p-3 bg-white/5 rounded-xl text-xs flex flex-col gap-1">
              <span><strong>Student:</strong> {selectedSub.student?.full_name}</span>
              <span><strong>Quiz:</strong> {selectedSub.quiz?.title}</span>
              <span><strong>Auto Grade Score:</strong> {selectedSub.percentage.toFixed(1)}% ({selectedSub.letter_grade})</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Override Score (%)</label>
              <input
                type="number"
                required
                min={0}
                max={100}
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-rose-500/40 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Instructor Note / Rationale</label>
              <textarea
                required
                rows={3}
                value={instructorNote}
                onChange={(e) => setInstructorNote(e.target.value)}
                placeholder="State your reason for modifying the score..."
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500/40 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[rgba(255,255,255,0.08)] pt-4 mt-2">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/25 disabled:opacity-50"
              >
                {saveLoading ? "Saving override..." : "Save Override"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
