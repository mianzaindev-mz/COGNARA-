// src/app/(student)/grades/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";

type GradedSubmission = {
  id: string;
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
  quiz?: { title: string; pass_score: number };
  course?: { title: string };
};

export default function StudentGradesPage() {
  const { notify } = useToast();
  const [submissions, setSubmissions] = useState<GradedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<GradedSubmission | null>(null);

  // Mistake Explanations
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  // PDF export loading
  const [pdfExportLoading, setPdfExportLoading] = useState(false);
  const [fullReportLoading, setFullReportLoading] = useState(false);

  // Overall Statistics
  const [stats, setStats] = useState({
    gpa: 0.0,
    letter: "F",
    totalQuizzes: 0,
    passRate: 0,
  });

  const loadGrades = async () => {
    setLoading(true);
    try {
      // Fetch submissions
      const supabase = (await import("@/lib/supabase/client")).createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("graded_submissions")
            .select(`
              *,
              quiz:quiz_id (title, pass_score),
              course:course_id (title)
            `)
            .eq("student_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          
          const list = data || [];
          setSubmissions(list);
          calculateStats(list);
        }
      }
    } catch {
      notify({ title: "Load Error", description: "Could not retrieve your grades from the database.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const calculateStats = (list: GradedSubmission[]) => {
    if (list.length === 0) return;
    
    const totalQuizzes = list.length;
    const passedCount = list.filter(r => r.passed).length;
    const passRate = Math.round((passedCount / totalQuizzes) * 100);
    
    // Average GPA
    const totalGpa = list.reduce((sum, r) => sum + Number(r.grade_point), 0);
    const avgGpa = parseFloat((totalGpa / totalQuizzes).toFixed(2));
    
    // Map average GPA to Letter Grade
    let letter = "F";
    if (avgGpa >= 4.0) letter = "A";
    else if (avgGpa >= 3.7) letter = "A-";
    else if (avgGpa >= 3.3) letter = "B+";
    else if (avgGpa >= 3.0) letter = "B";
    else if (avgGpa >= 2.7) letter = "B-";
    else if (avgGpa >= 2.3) letter = "C+";
    else if (avgGpa >= 2.0) letter = "C";
    else if (avgGpa >= 1.7) letter = "C-";
    else if (avgGpa >= 1.0) letter = "D";

    setStats({ gpa: avgGpa, letter, totalQuizzes, passRate });
  };

  const handleFetchExplanation = async (sub: GradedSubmission) => {
    setExplanationLoading(true);
    setExplanation(null);
    try {
      // Invoke master agent routing via /api/agent endpoint using explain_mistake skill
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: "explain_mistake",
          message: `Explain my mistakes on quiz attempt: ${sub.attempt_id}`,
          code: JSON.stringify(sub.question_grades),
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setExplanation(data.response?.content || "No detailed mistakes found.");
    } catch (e: any) {
      notify({ title: "Fetch Failed", description: e.message || "Failed to retrieve AI review.", tone: "error" });
    } finally {
      setExplanationLoading(false);
    }
  };

  /** Download PDF for a specific quiz submission */
  const handleDownloadQuizPdf = async (sub: GradedSubmission) => {
    setPdfExportLoading(true);
    try {
      notify({ title: "Exporting PDF", description: "Compiling quiz result report…", tone: "info" });
      const res = await fetch("/api/pdf/quiz-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: sub.id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "PDF engine error");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quiz_Result_${(sub.quiz?.title || "Report").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notify({ title: "Downloaded", description: "Quiz result PDF exported.", tone: "success" });
    } catch (err: any) {
      notify({ title: "Export Failed", description: err.message, tone: "error" });
    } finally {
      setPdfExportLoading(false);
    }
  };

  /** Download full academic transcript PDF */
  const handleDownloadFullReport = async () => {
    setFullReportLoading(true);
    try {
      notify({ title: "Generating Transcript", description: "Compiling your full academic grade report…", tone: "info" });
      const res = await fetch("/api/pdf/grade-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "PDF engine error");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Academic_Transcript_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notify({ title: "Downloaded", description: "Full academic transcript exported.", tone: "success" });
    } catch (err: any) {
      notify({ title: "Export Failed", description: err.message, tone: "error" });
    } finally {
      setFullReportLoading(false);
    }
  };

  const handleOpenDetailModal = (sub: GradedSubmission) => {
    setSelectedSub(sub);
    setExplanation(null);
  };

  const getToneStyle = (letter: string) => {
    if (["A+", "A", "A-"].includes(letter)) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (["B+", "B", "B-"].includes(letter)) return "text-sky-500 bg-sky-500/10 border-sky-500/20";
    if (["C+", "C", "C-"].includes(letter)) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-7xl h-full pb-16 px-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 animate-pulse text-[28px]">bar_chart</span>
            My Grades & Performance
          </h1>
          <p className="text-sm text-cn-ink-muted">Track your academic progress, GPA divisions, AI feedback reports, and certificates.</p>
        </div>
        {submissions.length > 0 && (
          <button
            onClick={handleDownloadFullReport}
            disabled={fullReportLoading}
            className="py-2 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/15 flex items-center gap-1.5 shrink-0 self-start sm:self-end"
          >
            {fullReportLoading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Compiling…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]">download</span>
                Download Full Transcript
              </>
            )}
          </button>
        )}
      </section>

      {/* GPA Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Cumulative GPA</span>
          <span className="text-3xl font-black text-cn-ink">{stats.gpa.toFixed(2)} <span className="text-xs text-cn-ink-subtle">/ 4.0</span></span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Letter Grade Equivalent</span>
          <span className="text-3xl font-black text-primary">{stats.letter}</span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Total Evaluated Quizzes</span>
          <span className="text-3xl font-black text-cn-ink">{stats.totalQuizzes}</span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Success Pass Rate</span>
          <span className="text-3xl font-black text-emerald-500">{stats.passRate}%</span>
        </div>
      </div>

      {/* Grade Book Table */}
      <div className="border border-cn-border bg-cn-surface rounded-2xl shadow-sm overflow-hidden">
        <header className="px-5 py-4 border-b border-cn-border">
          <span className="text-xs font-bold text-cn-ink uppercase">Graded Submissions History</span>
        </header>

        {loading ? (
          <div className="p-12 text-center text-xs text-cn-ink-subtle">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500/20 border-t-rose-500 inline-block mb-3" />
            <p>Loading your grade database...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-cn-ink-subtle opacity-40">assignment_turned_in</span>
            <p className="text-sm font-bold text-cn-ink">No Graded Submissions Found</p>
            <p className="text-xs text-cn-ink-subtle max-w-sm leading-relaxed">You haven&apos;t completed any quizzes yet, or your attempts are still pending evaluation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-cn-ink border-collapse">
              <thead className="bg-cn-canvas border-b border-cn-border text-cn-ink-subtle font-bold">
                <tr>
                  <th className="px-5 py-3">Course / Chapter</th>
                  <th className="px-5 py-3">Quiz Title</th>
                  <th className="px-5 py-3">Submission Date</th>
                  <th className="px-5 py-3">Score Percentage</th>
                  <th className="px-5 py-3">Letter Grade</th>
                  <th className="px-5 py-3">Outcome</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cn-border">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-cn-canvas/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold">{sub.course?.title || "Standalone Quiz"}</td>
                    <td className="px-5 py-3.5">{sub.quiz?.title || "Assessment"}</td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-cn-ink-subtle">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold">
                      {sub.instructor_override !== null ? sub.instructor_override : sub.percentage.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 font-mono text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getToneStyle(sub.letter_grade)}`}>
                        {sub.letter_grade}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={sub.passed ? "success" : "danger"} size="sm">
                        {sub.passed ? "Passed" : "Failed"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDetailModal(sub)}
                        className="py-1 px-3 bg-cn-canvas border border-cn-border hover:bg-cn-border rounded-xl text-[10px] font-bold transition"
                      >
                        View Report
                      </button>
                      <button
                        onClick={() => handleDownloadQuizPdf(sub)}
                        disabled={pdfExportLoading}
                        className="py-1 px-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/10 rounded-xl text-[10px] font-bold transition flex items-center gap-0.5"
                        title="Download PDF Report"
                      >
                        <span className="material-symbols-outlined text-[12px]">download</span>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Detail Drawer Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedSub(null)} />
          <div className="relative w-full max-w-3xl rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-[rgba(255,255,255,0.08)] bg-[#141420] text-white animate-in zoom-in-95 duration-300">
            <header className="flex justify-between items-center pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-[24px]">assignment_turned_in</span>
                <div>
                  <h3 className="text-sm font-bold">{selectedSub.quiz?.title || "Quiz"} Performance Report</h3>
                  <p className="text-[10px] text-gray-400">AI professor-style evaluation with custom rubric validation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {/* Overall Feedback segment */}
            <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] uppercase font-bold text-rose-400">Evaluation Grade Summary</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${getToneStyle(selectedSub.letter_grade)}`}>
                  {selectedSub.letter_grade} ({selectedSub.percentage.toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold italic">
                &ldquo;{selectedSub.overall_feedback}&rdquo;
              </p>
              {selectedSub.instructor_note && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs mt-1">
                  <strong>Instructor Note:</strong> {selectedSub.instructor_note}
                </div>
              )}
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Key Strengths
                </span>
                <ul className="list-disc pl-4 text-[11px] text-gray-300 flex flex-col gap-1">
                  {selectedSub.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  {selectedSub.strengths.length === 0 && <li>Solid foundational execution observed.</li>}
                </ul>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span> Focus Areas
                </span>
                <ul className="list-disc pl-4 text-[11px] text-gray-300 flex flex-col gap-1">
                  {selectedSub.areas_for_improvement.map((w, i) => <li key={i}>{w}</li>)}
                  {selectedSub.areas_for_improvement.length === 0 && <li>No critical deficiencies flagged.</li>}
                </ul>
              </div>
            </div>

            {/* Recommended Resources */}
            {selectedSub.recommended_resources && selectedSub.recommended_resources.length > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">bookmark</span> Recommended Concepts for Review
                </span>
                <ul className="list-disc pl-4 text-[11px] text-gray-300 flex flex-col gap-1">
                  {selectedSub.recommended_resources.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* Question-by-Question list */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold">Detailed Question Breakdown</span>
              <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                {selectedSub.question_grades.map((q: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-white/[0.03] border border-white/5 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1">
                      <span className="text-gray-400 font-bold">Question #{idx + 1} ({q.graded_by.toUpperCase()} Triage)</span>
                      <span className={`font-mono font-bold ${q.ai_score >= 0.7 ? "text-green-400" : "text-red-400"}`}>
                        {(q.points_earned).toFixed(1)} / {q.points_possible} pts
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-300">
                      <strong>Submitted Answer:</strong> <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-400 font-mono block mt-1 overflow-x-auto">{q.student_answer}</code>
                    </div>
                    <div className="text-[11px] text-gray-400 pt-1 leading-relaxed">
                      <strong>AI Grader Verdict:</strong> {q.ai_feedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanations section */}
            {explanation && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mt-2 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-400">AI Deep-Dive Mistake Explanation</span>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {explanation}
                </p>
              </div>
            )}

            {/* Footer buttons panel */}
            <div className="flex justify-between items-center border-t border-[rgba(255,255,255,0.08)] pt-4 mt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFetchExplanation(selectedSub)}
                  disabled={explanationLoading}
                  className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {explanationLoading ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Analyzing mistakes...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      Ask GNARA to Explain Mistakes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadQuizPdf(selectedSub)}
                  disabled={pdfExportLoading}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  {pdfExportLoading ? "Exporting…" : "PDF Export"}
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificates Section at bottom */}
      <div className="border border-cn-border bg-cn-surface rounded-2xl shadow-sm p-6 mt-6">
        <header className="border-b border-cn-border pb-3 mb-4">
          <h3 className="text-sm font-bold text-cn-ink flex items-center gap-2">
            <span className="material-symbols-outlined text-cn-yellow">verified_user</span>
            My Earned Certificates
          </h3>
        </header>

        <div className="p-8 text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-cn-ink-subtle opacity-35">military_tech</span>
          <p className="text-xs font-bold text-cn-ink">No Certificates Earned Yet</p>
          <p className="text-[10px] text-cn-ink-subtle max-w-sm">Complete your enrolled courses with passing grade evaluations to unlock platform certificates.</p>
        </div>
      </div>
    </div>
  );
}
