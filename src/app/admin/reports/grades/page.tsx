// src/app/admin/reports/grades/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";

type GradeOverviewItem = {
  id: string;
  student_id: string;
  quiz_id: string;
  course_id: string | null;
  raw_score: number;
  max_score: number;
  percentage: number;
  letter_grade: string;
  grade_point: number;
  passed: boolean;
  grading_method: string;
  created_at: string;
  student?: { full_name: string };
  quiz?: { title: string };
  course?: { title: string };
};

type CoachPerformance = {
  coach_name: string;
  avg_score: number;
  graded_count: number;
  pass_rate: number;
};

type StrugglingCourse = {
  course_title: string;
  coach_name: string;
  pass_rate: number;
  total_attempts: number;
};

export default function AdminGradesOverviewPage() {
  const { notify } = useToast();
  const [submissions, setSubmissions] = useState<GradeOverviewItem[]>([]);
  const [coachesPerf, setCoachesPerf] = useState<CoachPerformance[]>([]);
  const [strugglingCourses, setStrugglingCourses] = useState<StrugglingCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Platform Metrics
  const [metrics, setMetrics] = useState({
    totalSubmissions: 0,
    platformAvg: 0.0,
    aiGradedPct: 0,
    manualGradedPct: 0,
    overallPassRate: 0,
  });

  const loadPlatformGrades = async () => {
    setLoading(true);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("graded_submissions")
          .select(`
            *,
            student:student_id (full_name),
            quiz:quiz_id (title),
            course:course_id (title, profiles:coach_id (full_name))
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const list = data || [];
        setSubmissions(list);
        calculatePlatformMetrics(list);
      }
    } catch {
      notify({ title: "Load Error", description: "Failed to load platform-wide grades overview.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformGrades();
  }, []);

  const calculatePlatformMetrics = (list: GradeOverviewItem[]) => {
    if (list.length === 0) return;

    const totalSubmissions = list.length;
    
    // Average Platform Score
    const totalPercentage = list.reduce((sum, r) => sum + r.percentage, 0);
    const platformAvg = parseFloat((totalPercentage / totalSubmissions).toFixed(1));

    // Passed percentage
    const passedCount = list.filter(r => r.passed).length;
    const overallPassRate = Math.round((passedCount / totalSubmissions) * 100);

    // AI vs Manual method percentages
    const aiCount = list.filter(r => r.grading_method === "ai" || r.grading_method === "hybrid").length;
    const aiGradedPct = Math.round((aiCount / totalSubmissions) * 100);
    const manualGradedPct = 100 - aiGradedPct;

    setMetrics({ totalSubmissions, platformAvg, aiGradedPct, manualGradedPct, overallPassRate });

    // Calculate Coach Performance Map
    const coachGroups: Record<string, { totalScore: number; count: number; passed: number }> = {};
    const courseGroups: Record<string, { title: string; coach: string; count: number; passed: number }> = {};

    list.forEach((s: any) => {
      const coachName = s.course?.profiles?.full_name || "Unknown Coach";
      if (!coachGroups[coachName]) {
        coachGroups[coachName] = { totalScore: 0, count: 0, passed: 0 };
      }
      coachGroups[coachName].totalScore += s.percentage;
      coachGroups[coachName].count += 1;
      if (s.passed) coachGroups[coachName].passed += 1;

      if (s.course_id && s.course) {
        const courseId = s.course_id;
        if (!courseGroups[courseId]) {
          courseGroups[courseId] = { title: s.course.title, coach: coachName, count: 0, passed: 0 };
        }
        courseGroups[courseId].count += 1;
        if (s.passed) courseGroups[courseId].passed += 1;
      }
    });

    const perf: CoachPerformance[] = Object.entries(coachGroups).map(([name, data]) => ({
      coach_name: name,
      avg_score: parseFloat((data.totalScore / data.count).toFixed(1)),
      graded_count: data.count,
      pass_rate: Math.round((data.passed / data.count) * 100),
    }));
    setCoachesPerf(perf);

    // Find struggling courses (pass rate below 70%)
    const struggling: StrugglingCourse[] = Object.entries(courseGroups)
      .map(([_, data]) => ({
        course_title: data.title,
        coach_name: data.coach,
        pass_rate: Math.round((data.passed / data.count) * 100),
        total_attempts: data.count,
      }))
      .filter(c => c.pass_rate < 70);
    setStrugglingCourses(struggling);
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    
    // Construct mock CSV export
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Submission ID,Student Name,Quiz Title,Course Link,Score Percentage,Letter Grade,Outcome,Method,Date\n";
    
    submissions.forEach((s: any) => {
      const row = [
        s.id,
        s.student?.full_name || "Anonymous",
        s.quiz?.title || "Assessment",
        s.course?.title || "Independent",
        s.percentage.toFixed(1),
        s.letter_grade,
        s.passed ? "Pass" : "Fail",
        s.grading_method,
        new Date(s.created_at).toLocaleDateString()
      ].map(field => `"${field}"`).join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_grades_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify({ title: "CSV Exported", description: "Grading record dispatched to download manager.", tone: "success" });
  };

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-7xl h-full pb-8">
      {/* Header */}
      <section className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-500 animate-pulse text-[28px]">analytics</span>
          Platform Grades & Analytics Overview
        </h1>
        <p className="text-sm text-cn-ink-muted">Review platform-wide grade trends, analyze coach evaluation performance, and export bulk CSV records.</p>
      </section>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Total Graded Submissions</span>
          <span className="text-3xl font-black text-cn-ink">{metrics.totalSubmissions}</span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Overall Platform Average</span>
          <span className="text-3xl font-black text-primary">{metrics.platformAvg}%</span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">AI Evaluated Ratio</span>
          <span className="text-3xl font-black text-cn-ink">{metrics.aiGradedPct}%</span>
        </div>
        <div className="cn-card bg-cn-surface p-5 border border-cn-border rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cn-ink-subtle">Overall Pass Rate</span>
          <span className="text-3xl font-black text-emerald-500">{metrics.overallPassRate}%</span>
        </div>
      </div>

      {/* CSV Export Banner Panel */}
      <div className="border border-cn-border bg-cn-surface p-4 rounded-2xl flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-500 text-[24px]">download_for_offline</span>
          <div className="text-left">
            <h4 className="text-xs font-bold text-cn-ink">Export Graded Submissions</h4>
            <p className="text-[10px] text-cn-ink-subtle leading-relaxed">Download a comprehensive spreadsheet containing all platform evaluation and GPA divisions.</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={submissions.length === 0}
          className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-rose-600/20"
        >
          <span className="material-symbols-outlined text-[16px]">file_download</span>
          Export as CSV Spreadsheet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
        {/* Left Side: Coach performance */}
        <div className="border border-cn-border bg-cn-surface p-5 rounded-2xl flex flex-col gap-4 shadow-sm min-h-[350px]">
          <header className="pb-2 border-b border-cn-border">
            <span className="text-xs font-bold text-cn-ink uppercase">Coach Performance Metrics</span>
          </header>

          {loading ? (
            <div className="p-8 text-center text-xs text-cn-ink-subtle">Loading parameters...</div>
          ) : coachesPerf.length === 0 ? (
            <div className="p-8 text-center text-xs text-cn-ink-subtle">No coach data available.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {coachesPerf.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-cn-border bg-cn-canvas/50">
                  <div className="text-left">
                    <span className="text-xs font-bold text-cn-ink">{c.coach_name}</span>
                    <p className="text-[10px] text-cn-ink-subtle mt-0.5">{c.graded_count} attempts evaluated</p>
                  </div>
                  <div className="text-right">
                    <strong className="text-xs text-cn-ink">{c.avg_score}% Avg</strong>
                    <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{c.pass_rate}% Pass Rate</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Struggling Courses (High Risk) */}
        <div className="border border-cn-border bg-cn-surface p-5 rounded-2xl flex flex-col gap-4 shadow-sm min-h-[350px]">
          <header className="pb-2 border-b border-cn-border">
            <span className="text-xs font-bold text-cn-ink uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-rose-500 animate-pulse text-[16px]">warning</span>
              High-Risk Course Warning list
            </span>
          </header>

          {loading ? (
            <div className="p-8 text-center text-xs text-cn-ink-subtle">Loading parameters...</div>
          ) : strugglingCourses.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-2 text-cn-ink-subtle">
              <span className="material-symbols-outlined text-3xl opacity-40">done_all</span>
              <p className="text-xs font-bold text-cn-ink">Platform Performing Well</p>
              <p className="text-[10px] max-w-[200px] leading-relaxed mx-auto">No courses are flagged with failure rates below 30%.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {strugglingCourses.map((c, i) => (
                <div key={i} className="p-3.5 border border-rose-500/20 bg-rose-500/5 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs border-b border-rose-500/10 pb-1">
                    <span className="font-bold text-cn-ink truncate max-w-[200px]">{c.course_title}</span>
                    <span className="text-rose-500 font-bold font-mono">{c.pass_rate}% Pass</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-cn-ink-subtle">
                    <span>Instructor: <strong>{c.coach_name}</strong></span>
                    <span>{c.total_attempts} total attempts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
