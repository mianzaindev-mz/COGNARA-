import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardEffects } from "@/components/student/dashboard-effects";
import { CreateNotebookShortcut } from "@/components/student/create-notebook-shortcut";
import { checkStudentDbHealth } from "@/lib/student/db-health";
import { loadStudentEnrollments } from "@/lib/student/enrollments";
import { loadStudentPortalStats } from "@/lib/student/portal-stats";
import { loadStudentUpcomingLessons } from "@/lib/student/upcoming-lessons";
import { loadPublishedCourses } from "@/lib/courses/public-catalog";
import { DashboardInsightsWidget } from "@/components/student/dashboard-insights-widget";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student dashboard — COGNARA™",
};

const demoCourses = [
  {
    title: "Data Structures & Algos",
    category: "Computer Science",
    progressDone: 15,
    totalLessons: 20,
    slug: "dsa",
    colorClass: "bg-secondary/10 text-secondary border-secondary/20",
    borderClass: "border-l-secondary",
    bgFill: "bg-secondary"
  },
  {
    title: "Digital Marketing Pro",
    category: "Marketing",
    progressDone: 18,
    totalLessons: 24,
    slug: "marketing",
    colorClass: "bg-accent-purple/10 text-accent-purple border-accent-purple/20",
    borderClass: "border-l-accent-purple",
    bgFill: "bg-accent-purple"
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileRes, stats, health, enrollments, featured, upcomingLessons, progressLogsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    loadStudentPortalStats(user.id),
    checkStudentDbHealth(user.id),
    loadStudentEnrollments(user.id),
    loadPublishedCourses(1),
    loadStudentUpcomingLessons(user.id, 5),
    supabase
      .from("lesson_progress")
      .select("completed_at, lessons(duration_mins)")
      .eq("student_id", user.id)
      .eq("completed", true),
  ]);

  const profile = profileRes.data;
  const firstName =
    profile?.full_name?.split(/\s+/)[0] || user.email?.split("@")[0] || "there";

  const creditLabel = stats.creditBalance !== null ? `${stats.creditBalance}` : "—";
  const enrolledLabel = stats.enrolledCourses > 0 ? String(stats.enrolledCourses) : health.enrollmentsOk ? "0" : "—";

  const showDemo = enrollments.length === 0;
  
  const courseCards = showDemo
    ? demoCourses.map((c) => ({ ...c, href: `/learn/${c.slug}` }))
    : enrollments.slice(0, 4).map((c, i) => {
        const isOdd = i % 2 !== 0;
        return {
          title: c.title,
          category: c.category,
          progressDone: c.progressDone,
          totalLessons: c.totalLessons,
          slug: c.slug,
          href: `/learn/${c.slug}`,
          colorClass: isOdd ? "bg-accent-purple/10 text-accent-purple border-accent-purple/20" : "bg-secondary/10 text-secondary border-secondary/20",
          borderClass: isOdd ? "border-l-accent-purple" : "border-l-secondary",
          bgFill: isOdd ? "bg-accent-purple" : "bg-secondary"
        };
      });

  const spotlight = featured[0];

  // ─── CALCULATE DYNAMIC METRICS ───
  const completedLessons = showDemo
    ? 33
    : enrollments.reduce((sum, e) => sum + e.progressDone, 0);
  const totalLessons = showDemo
    ? 44
    : enrollments.reduce((sum, e) => sum + e.totalLessons, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const totalTasks = 10;
  const completedTasks = Math.min(totalTasks, Math.round((progressPercent / 100) * totalTasks));

  const strokeDasharray = 691.15;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progressPercent) / 100;

  // ─── STUDY HOURS ANALYTICS CHART ───
  const getDaysOfCurrentWeek = () => {
    const current = new Date();
    const day = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distance = day === 0 ? -6 : 1 - day; // distance to Monday
    const monday = new Date(current);
    monday.setDate(current.getDate() + distance);
    monday.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const weekDays = getDaysOfCurrentWeek();
  const actualHours = [0, 0, 0, 0, 0, 0, 0];
  const progressLogs = progressLogsRes?.data || [];

  if (progressLogs && progressLogs.length > 0) {
    progressLogs.forEach((log: any) => {
      if (!log.completed_at) return;
      const completedDate = new Date(log.completed_at);
      for (let i = 0; i < 7; i++) {
        const wDay = weekDays[i];
        if (
          completedDate.getFullYear() === wDay.getFullYear() &&
          completedDate.getMonth() === wDay.getMonth() &&
          completedDate.getDate() === wDay.getDate()
        ) {
          const lesson = Array.isArray(log.lessons) ? log.lessons[0] : log.lessons;
          const duration = lesson?.duration_mins || 45;
          actualHours[i] += duration / 60;
          break;
        }
      }
    });
  }

  // Fallback organic curve based on streak, level and XP
  const baseMultiplier = Math.min(
    5,
    1 + (stats.streakDays * 0.2) + (stats.level * 0.1) + (stats.totalXp * 0.0005)
  );
  const dayMultipliers = [1.2, 1.5, 1.8, 1.1, 0.8, 2.0, 1.4];
  const fallbackHours = dayMultipliers.map((m) => Number((m * baseMultiplier * 0.8).toFixed(1)));

  const totalActualHours = actualHours.reduce((sum, h) => sum + h, 0);
  const finalHours = totalActualHours > 0
    ? actualHours.map((h) => Number(h.toFixed(1)))
    : fallbackHours;

  const maxHours = Math.max(...finalHours, 1);
  const currentDayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const hoverColors = [
    "hover:bg-accent-teal/40",
    "hover:bg-accent-purple/40",
    "hover:bg-primary/40",
    "hover:bg-secondary/40",
    "hover:bg-[#fabd00]/40",
    "hover:bg-emerald-500/40",
    "hover:bg-accent-teal/40"
  ];

  return (
    <>
      <DashboardEffects />
      <div className="pt-[16px] pb-margin-desktop px-margin-desktop max-w-7xl mx-auto space-y-gutter">
        {/* Hero Section */}
        <section className="scroll-reveal glass-card rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden" id="hero">
          <div className="relative z-10 space-y-8">
            <div>
              <h1 className="font-headline-xl text-6xl text-on-surface leading-tight">
                Welcome back, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#fabd00]">
                  {firstName}!
                </span>
              </h1>
              <p className="font-body-lg text-on-surface-variant max-w-xl mt-4 opacity-80">
                You&apos;ve completed {progressPercent}% of your weekly goals. Keep up the momentum, your focus time has increased by {Math.round(progressPercent * 0.15) || 5}% today.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <CreateNotebookShortcut />
              <Link href="/notebook" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-6 py-3 text-sm font-black uppercase tracking-widest text-on-surface transition hover:border-primary/30 hover:bg-primary/10 dark:border-white/10 dark:bg-white/5">
                <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                Open Notes
              </Link>
              <span className="px-6 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-full font-label-md border border-emerald-500/20 flex items-center gap-2 shadow-sm backdrop-blur-md transition-all hover:scale-105">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                {completedTasks}/{totalTasks} Tasks Completed
              </span>
              <span className="px-6 py-2.5 bg-primary/10 text-primary rounded-full font-label-md border border-primary/20 flex items-center gap-2 shadow-sm backdrop-blur-md transition-all hover:scale-105">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Focus Mode: On
              </span>
              {profile?.role && (
                <span className="px-5 py-2.5 bg-black/5 dark:bg-white/5 text-on-surface-variant rounded-full text-xs flex items-center border border-black/10 dark:border-white/10 uppercase tracking-widest font-bold backdrop-blur-md">
                  {profile.role}
                </span>
              )}
            </div>
          </div>
          <div className="relative group cursor-pointer animate-float perspective-[1500px] shrink-0">
            <div className="absolute inset-0 m-auto w-48 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none"></div>
            <svg className="w-64 h-64 transform -rotate-90" style={{ overflow: 'visible' }}>
              <circle className="text-black/5 dark:text-white/5" cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeWidth="16"></circle>
              <circle className="text-primary progress-ring drop-shadow-[0_0_30px_rgba(255,107,61,0.5)]" cx="128" cy="128" fill="transparent" id="hero-progress-ring" r="110" stroke="currentColor" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" strokeWidth="16"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline-xl text-6xl text-on-surface drop-shadow-2xl">{progressPercent}%</span>
              <span className="font-label-sm text-primary uppercase tracking-[0.3em] mt-2 font-bold">Progress</span>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
        </section>

        {/* Stats Grid */}
        <section className="scroll-reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter" id="stats">
          <Link href="/my-courses" className="block tilt-card glass-card rounded-3xl p-card-padding group">
            <span className="text-on-surface-variant font-label-md uppercase tracking-widest block mb-2 opacity-70">Enrolled</span>
            <div className="font-headline-xl text-5xl mb-1 group-hover:scale-110 origin-left transition-transform duration-500">{enrolledLabel}</div>
            <span className="text-primary/70 text-xs font-bold flex items-center gap-1 group-hover:text-primary transition-colors cursor-pointer">
              Browse catalog <span className="material-symbols-outlined text-[14px]">trending_flat</span>
            </span>
          </Link>
          <div className="tilt-card glass-card rounded-3xl p-card-padding group">
            <span className="text-on-surface-variant font-label-md uppercase tracking-widest block mb-2 opacity-70">Completed</span>
            <div className="font-headline-xl text-5xl mb-1 group-hover:scale-110 origin-left transition-transform duration-500">{stats.completedCourses}</div>
            <span className="text-accent-teal/70 text-xs font-bold group-hover:text-accent-teal transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>card_membership</span> Certificates unlocked
            </span>
          </div>
          <div className="tilt-card glass-card rounded-3xl p-card-padding group">
            <span className="text-on-surface-variant font-label-md uppercase tracking-widest block mb-2 opacity-70">Streak</span>
            <div className="font-headline-xl text-5xl mb-1 text-[#fabd00] group-hover:scale-110 origin-left transition-transform duration-500">{stats.streakDays}d</div>
            <span className="text-on-surface-variant/70 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span> Level {stats.level || 1} · {stats.totalXp || 0} XP
            </span>
          </div>
          <Link href="/billing" className="block tilt-card glass-card rounded-3xl p-card-padding group">
            <span className="text-on-surface-variant font-label-md uppercase tracking-widest block mb-2 opacity-70">AI Credits</span>
            <div className="font-headline-xl text-5xl mb-1 text-accent-purple group-hover:scale-110 origin-left transition-transform duration-500">{creditLabel}</div>
            <span className="text-accent-purple/70 text-xs font-bold group-hover:text-accent-purple transition-colors cursor-pointer flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span> Top up credits
            </span>
          </Link>
        </section>

        {/* Agent Section */}
        <section className="scroll-reveal glass-card rounded-[2rem] p-10 relative overflow-hidden" id="agent">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 relative z-10 gap-6">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-[0.3em] block mb-3 px-3 py-1 bg-primary/10 w-fit rounded-full border border-primary/20 agent-badge-pulse">COGNARA AGENT</span>
              <h2 className="font-headline-xl text-4xl text-on-surface mb-3 leading-tight">What would you like to learn today?</h2>
              <p className="text-on-surface-variant max-w-2xl opacity-80">
                Advanced AI tutor with tool integration. Access your complete learning history on <Link href="/agent" className="text-secondary font-bold underline underline-offset-4 cursor-pointer hover:text-primary transition-colors">/agent</Link>.
              </p>
            </div>
            <Link href="/billing" className="bg-surface-container-lowest/40 border border-black/10 dark:border-white/10 rounded-2xl px-8 py-6 flex flex-col items-center shadow-2xl backdrop-blur-xl group hover:border-primary/30 transition-all cursor-pointer">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-[0.2em] mb-2 opacity-60">AVAILABLE BALANCE</span>
              <div className="text-primary font-headline-xl text-3xl group-hover:scale-110 transition-transform">{creditLabel} credits</div>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            <Link href="/agent?task=ask" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Ask a question</h4>
              <span className="px-4 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase">1 Credit</span>
            </Link>
            <Link href="/agent?task=debug" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 flex items-center justify-center mb-6 border border-accent-teal/20 group-hover:bg-accent-teal/20 transition-all">
                <span className="material-symbols-outlined text-accent-teal text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>pest_control</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Debug code</h4>
              <span className="px-4 py-1 bg-accent-teal text-surface text-[10px] font-black rounded-full uppercase">2 Credits</span>
            </Link>
            <Link href="/agent?task=quiz" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center mb-6 border border-accent-purple/20 group-hover:bg-accent-purple/20 transition-all">
                <span className="material-symbols-outlined text-accent-purple text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Quiz from PDF</h4>
              <span className="px-4 py-1 bg-accent-purple text-white text-[10px] font-black rounded-full uppercase">3 Credits</span>
            </Link>
            <Link href="/agent?task=voice" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-400/10 flex items-center justify-center mb-6 border border-orange-400/20 group-hover:bg-orange-400/20 transition-all">
                <span className="material-symbols-outlined text-orange-400 text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>settings_voice</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Voice mode</h4>
              <span className="px-4 py-1 bg-orange-400 text-surface text-[10px] font-black rounded-full uppercase">1 Cr/Min</span>
            </Link>
            <Link href="/agent?task=generate_course" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                <span className="material-symbols-outlined text-emerald-500 text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Generate Course</h4>
              <span className="px-4 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase">3 Credits</span>
            </Link>
            <Link href="/agent?task=flashcard" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                <span className="material-symbols-outlined text-blue-500 text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Flashcards</h4>
              <span className="px-4 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase">1 Credit</span>
            </Link>
            <Link href="/agent?task=challenge" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                <span className="material-symbols-outlined text-rose-500 text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Code Challenge</h4>
              <span className="px-4 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase">1 Credit</span>
            </Link>
            <Link href="/agent?task=summarize" className="tilt-card glass-card rounded-3xl p-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer group flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20 group-hover:bg-violet-500/20 transition-all">
                <span className="material-symbols-outlined text-violet-500 text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
              </div>
              <h4 className="font-bold text-lg text-on-surface mb-2">Summarize</h4>
              <span className="px-4 py-1 bg-violet-500 text-white text-[10px] font-black rounded-full uppercase">1 Credit</span>
            </Link>
          </div>
        </section>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-12 gap-gutter">
          
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 space-y-gutter">
            
            {/* Analytics Section */}
            <div className="scroll-reveal glass-card rounded-3xl p-card-padding" id="study-hours">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="font-headline-md text-2xl text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                    Study Hours
                  </h3>
                  <p className="text-on-surface-variant text-sm opacity-70 mt-1">Daily activity across the last 7 days</p>
                </div>
                <select className="bg-black/5 dark:bg-white/10 text-on-surface border border-black/10 dark:border-white/10 rounded-xl px-5 py-2 text-sm outline-none interactive-element backdrop-blur-md cursor-pointer hover:border-primary/40">
                  <option className="bg-surface-container">Weekly View</option>
                  <option className="bg-surface-container">Monthly View</option>
                </select>
              </div>
              <div className="h-64 w-full flex items-end justify-between gap-4 px-4">
                {finalHours.map((hours, i) => {
                  const isToday = i === currentDayIdx;
                  const isPeak = hours === Math.max(...finalHours);
                  const heightPercent = Math.max(10, Math.round((hours / maxHours) * 100));

                  let barClass = "bg-black/5 dark:bg-white/10 " + hoverColors[i];
                  if (isToday) {
                    barClass = "bg-primary/40 shadow-[0_-8px_20px_rgba(255,107,61,0.15)]";
                  } else if (isPeak) {
                    barClass = "bg-gradient-to-t from-primary to-orange-400 shadow-[0_-15px_40px_rgba(255,107,61,0.3)]";
                  }

                  return (
                    <div
                      key={i}
                      className={`flex-1 ${barClass} rounded-t-xl transition-all duration-700 relative group cursor-pointer`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-surface-container-high px-3 py-1.5 rounded-lg text-xs border border-black/10 dark:border-white/10 shadow-xl font-bold whitespace-nowrap z-20">
                        {hours}h
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-6 px-4 text-on-surface-variant font-label-sm tracking-widest uppercase text-[10px] opacity-60">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

            {/* Course Cards */}
            <div className="scroll-reveal space-y-6" id="active-courses">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-headline-md text-2xl text-on-surface">Active Courses</h3>
                <Link href="/my-courses" className="text-primary text-xs font-black tracking-widest hover:underline transition-all">VIEW ALL</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="course-grid">
                {courseCards.map(c => {
                    const percentage = Math.round((c.progressDone / c.totalLessons) * 100) || 0;
                    return (
                    <Link key={c.slug} href={c.href} className={`tilt-card glass-card rounded-[2rem] p-8 group border-l-[6px] ${c.borderClass} cursor-pointer block`}>
                        <div className="flex justify-between items-start mb-8">
                            <span className={`border px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${c.colorClass}`}>
                                {c.category}
                            </span>
                            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">more_horiz</span>
                            </div>
                        </div>
                        <h4 className="font-headline-md text-xl text-on-surface mb-2 group-hover:text-primary transition-colors">{c.title}</h4>
                        <p className="text-on-surface-variant text-sm mb-8 opacity-70">{c.progressDone}/{c.totalLessons} lessons completed · {percentage}%</p>
                        <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden mb-8">
                            <div className={`${c.bgFill} h-full rounded-full shadow-[0_0_15px_rgba(255,107,61,0.6)]`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="w-full py-4 bg-primary text-white font-black text-sm rounded-2xl interactive-element shadow-lg shadow-primary/20 uppercase tracking-widest hover:scale-[1.02] hover:brightness-110 text-center block">Resume Learning</div>
                    </Link>
                )})}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-gutter">
            
            <div className="scroll-reveal glass-card rounded-[2rem] p-card-padding flex flex-col gap-10" id="sidebar-widgets">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-md text-2xl text-on-surface">Next Up</h3>
                  <Link href="/my-courses" className="text-primary hover:text-white hover:bg-primary/20 px-4 py-1.5 rounded-full text-xs font-black tracking-widest transition-all">VIEW ALL</Link>
                </div>
                <div className="flex flex-col gap-4" id="next-up-list">
                  {upcomingLessons.length > 0 ? (
                    upcomingLessons.map(lesson => (
                      <Link key={lesson.href} href={lesson.href} className="tilt-card p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-primary/30 transition-all flex gap-5 group cursor-pointer shadow-xl">
                        <div className="w-1.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors line-clamp-1">{lesson.lessonLabel}</h5>
                            <span className="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded shimmer-badge shrink-0 ml-2">UP NEXT</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mb-6 flex items-center gap-2 opacity-70">
                            <span className="material-symbols-outlined text-[16px] text-red-400">timer</span> {lesson.durationLabel}
                          </p>
                          <div className="w-full py-3 bg-surface-container-high text-on-surface text-xs font-black rounded-xl border border-black/10 dark:border-white/10 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-lg uppercase tracking-widest text-center block">
                            Start Lesson
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant opacity-70">No upcoming lessons.</p>
                  )}
                </div>
              </div>

              <div className="pt-10 border-t border-black/5 dark:border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-on-surface text-xs uppercase tracking-[0.2em] opacity-60">Spotlight</h4>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                </div>
                <div className="flex flex-col gap-4" id="exams-list">
                  {spotlight ? (
                    <Link href={`/courses/${spotlight.slug}`} className="tilt-card flex items-center gap-5 p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all group cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all shadow-lg shrink-0">
                        <span className="text-primary text-[10px] font-black uppercase">NEW</span>
                        <span className="material-symbols-outlined text-primary text-xl font-black leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface text-base leading-snug truncate">{spotlight.title}</p>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-1 opacity-70 truncate">
                          <span className="material-symbols-outlined text-[14px]">map</span> {spotlight.category}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                    </Link>
                  ) : (
                    <p className="text-sm text-on-surface-variant opacity-70">No featured courses.</p>
                  )}
                </div>
              </div>

              <div className="pt-10 border-t border-black/5 dark:border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-on-surface text-xs uppercase tracking-[0.2em] opacity-60">Recent Badges</h4>
                  <Link href="/progress" className="text-primary hover:underline text-xs font-bold tracking-widest uppercase">View All</Link>
                </div>
                <div className="flex flex-col gap-3">
                  {stats.earnedBadges.length > 0 ? (
                    stats.earnedBadges.slice(0, 3).map((badge) => (
                      <div key={badge.id} className="tilt-card flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 group">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          badge.badge_type === "platinum" ? "bg-slate-300/20 text-slate-800 dark:text-slate-200" :
                          badge.badge_type === "gold" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                          badge.badge_type === "silver" ? "bg-stone-400/20 text-stone-600 dark:text-stone-300" :
                          badge.badge_type === "copper" ? "bg-orange-700/20 text-orange-800 dark:text-orange-500" :
                          "bg-amber-800/20 text-amber-900 dark:text-amber-600"
                        }`}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-surface text-sm truncate">{badge.courses?.title || "Course"}</p>
                          <p className="text-[11px] text-on-surface-variant uppercase font-bold tracking-widest mt-0.5 opacity-70">{badge.badge_type}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant opacity-70">No badges earned yet. Complete quizzes to earn badges!</p>
                  )}
                </div>
              </div>

              <div className="pt-10 border-t border-black/5 dark:border-white/5">
                <DashboardInsightsWidget
                  streakDays={stats.streakDays}
                  completedCourses={stats.completedCourses}
                  enrolledCourses={stats.enrolledCourses}
                  progressPercent={progressPercent}
                  totalXp={stats.totalXp}
                  level={stats.level}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
