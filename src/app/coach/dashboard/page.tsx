import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateCourseButton } from "@/components/coach/create-course-button";
import { DashboardEffects } from "@/components/coach/dashboard-effects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coach Studio — COGNARA™",
};

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(/\s+/)[0] || user.email?.split("@")[0] || "Coach";

  return (
    <>
      <DashboardEffects />
      
      {/* Welcome Header */}
      <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6 entrance-stagger">
        <div>
          <h2 className="font-headline-xl text-4xl text-cn-ink dark:text-white font-black">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-indigo-400">{firstName}</span>
          </h2>
          <p className="text-on-surface-variant/50 font-body-lg mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
            System status optimal. Performance trend +12% this week.
          </p>
        </div>
        <CreateCourseButton />
      </div>

      {/* Verification Banner */}
      {!profile?.is_verified && (
        <div className="glass-card inner-purple-glow rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group entrance-stagger">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform shrink-0">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg font-black text-amber-500/90 mb-0.5">Identity Verification Required</h3>
              <p className="text-on-surface-variant/50 text-sm">Upload your professional credentials to unlock global course publishing.</p>
            </div>
          </div>
          <Link href="/coach/verification" className="bg-white/5 hover:bg-amber-500/90 text-white px-6 py-2.5 rounded-xl text-xs font-black border border-white/5 transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] relative z-10 whitespace-nowrap">
            Verify Identity
          </Link>
        </div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10 entrance-stagger">
        <div className="glass-card inner-purple-glow rounded-[1.75rem] p-7 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
            <span className="text-green-500 text-[10px] font-black bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/10 tracking-tight">+12%</span>
          </div>
          <p className="text-4xl font-black mb-1 text-cn-ink dark:text-white tracking-tighter">124</p>
          <p className="text-on-surface-variant/30 font-bold uppercase tracking-[0.15em] text-[10px]">Total Students</p>
        </div>
        <div className="glass-card inner-purple-glow rounded-[1.75rem] p-7 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-500/5 border border-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/10 transition-all">
              <span className="material-symbols-outlined text-xl">visibility</span>
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-dot mt-1"></span>
            </div>
          </div>
          <p className="text-4xl font-black mb-1 text-cn-ink dark:text-white tracking-tighter">89</p>
          <p className="text-on-surface-variant/30 font-bold uppercase tracking-[0.15em] text-[10px]">Active Now</p>
        </div>
        <div className="glass-card inner-purple-glow rounded-[1.75rem] p-7 group border-primary/10 bg-primary/5">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <span className="text-green-500 text-[10px] font-black bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/10 tracking-tight">+8%</span>
          </div>
          <p className="text-4xl font-black mb-1 text-cn-ink dark:text-white tracking-tighter">$247</p>
          <p className="text-on-surface-variant/30 font-bold uppercase tracking-[0.15em] text-[10px]">Monthly Revenue</p>
        </div>
        <div className="glass-card inner-purple-glow rounded-[1.75rem] p-7 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500/10 transition-all">
              <span className="material-symbols-outlined text-xl">star</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <p className="text-4xl font-black text-cn-ink dark:text-white tracking-tighter">4.8</p>
            <span className="text-amber-500 text-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">★</span>
          </div>
          <p className="text-on-surface-variant/30 font-bold uppercase tracking-[0.15em] text-[10px]">Average Rating</p>
        </div>
        <div className="glass-card inner-purple-glow rounded-[1.75rem] p-7 group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/10 transition-all">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
          </div>
          <p className="text-4xl font-black mb-1 text-cn-ink dark:text-white tracking-tighter">78%</p>
          <p className="text-on-surface-variant/30 font-bold uppercase tracking-[0.15em] text-[10px]">Completion Rate</p>
        </div>
      </div>

      {/* Charts & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 entrance-stagger">
        <div className="lg:col-span-2 glass-card inner-purple-glow rounded-[2rem] p-8 relative group">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h3 className="font-headline-md text-xl font-black text-cn-ink dark:text-white">Revenue Stream</h3>
              <p className="text-on-surface-variant/40 text-xs mt-1">Net performance across active modules</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-white/[0.03] border border-white/5 rounded-lg px-4 py-2 text-[10px] font-black text-on-surface-variant hover:bg-white/10 transition-all uppercase tracking-wider">Export</button>
              <select className="bg-white/[0.05] border-none text-on-surface text-[10px] font-black rounded-lg py-2 pl-3 pr-8 focus:ring-1 focus:ring-primary/40 outline-none cursor-pointer appearance-none uppercase tracking-wider">
                <option>Monthly (USD)</option>
                <option>Weekly (USD)</option>
              </select>
            </div>
          </div>
          <div className="h-80 w-full relative flex items-end">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
              <defs>
                <linearGradient id="chartGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35"></stop>
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"></stop>
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="1"></stop>
                  <stop offset="50%" stopColor="#a78bfa"></stop>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <path d="M0,250 Q50,220 100,240 T200,180 T300,210 T400,140 T500,170 T600,110 T700,150 T800,80 T900,120 T1000,50 L1000,300 L0,300 Z" fill="url(#chartGlow)"></path>
              <path className="drop-shadow-[0_0_12px_rgba(139,92,246,0.6)] chart-path" d="M0,250 Q50,220 100,240 T200,180 T300,210 T400,140 T500,170 T600,110 T700,150 T800,80 T900,120 T1000,50" fill="none" stroke="url(#lineGradient)" strokeLinecap="round" strokeWidth="4"></path>
              <circle className="animate-pulse" cx="800" cy="80" fill="#fff" r="5" style={{ filter: "drop-shadow(0 0 8px #a78bfa)" }}></circle>
              <circle className="animate-pulse" cx="1000" cy="50" fill="#fff" r="5" style={{ filter: "drop-shadow(0 0 8px #a78bfa)" }}></circle>
            </svg>
            <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 pt-6 text-[9px] text-on-surface-variant/20 font-black uppercase tracking-[0.2em] border-t border-white/5">
              <span>Oct 1</span><span>Oct 10</span><span>Oct 20</span><span>Oct 30</span>
            </div>
          </div>
        </div>
        <div className="glass-card inner-purple-glow rounded-[2rem] p-8 flex flex-col">
          <h3 className="font-headline-md text-xl font-black text-cn-ink dark:text-white mb-8">Efficiency Score</h3>
          <div className="flex items-center gap-4 mb-10">
            <div className="text-6xl font-black text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">1.08<span className="text-xl ml-0.5 font-bold">x</span></div>
            <div className="bg-green-500/5 text-green-500 px-3 py-1.5 rounded-lg text-[9px] font-black border border-green-500/10 uppercase tracking-widest">
              OPTIMIZED
            </div>
          </div>
          <div className="space-y-8 flex-1">
            <div className="group">
              <div className="flex justify-between text-[10px] font-black mb-3 uppercase tracking-[0.15em] text-on-surface-variant/30">
                <span className="">Course Completion</span>
                <span className="text-cn-ink dark:text-white">78% <span className="text-green-500 ml-1">↑ 5%</span></span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-primary via-purple-400 to-indigo-500 w-[78%] rounded-full shadow-[0_0_8px_rgba(139,92,246,0.3)] transition-all duration-1000 ease-out"></div>
              </div>
            </div>
            <div className="group">
              <div className="flex justify-between text-[10px] font-black mb-3 uppercase tracking-[0.15em] text-on-surface-variant/30">
                <span className="">Student Feedback</span>
                <span className="text-cn-ink dark:text-white">4.8/5 <span className="text-green-500 ml-1">↑ 3%</span></span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 w-[96%] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)] transition-all duration-1000 ease-out"></div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/5 space-y-3">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant/50">
              <span className="">Gross Yield</span>
              <span className="text-cn-ink dark:text-white">$297.62</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-on-surface-variant/50">
              <span className="">Platform Fee</span>
              <span className="text-error/70">-$59.52</span>
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-white/5">
              <span className="font-black text-lg text-cn-ink dark:text-white">Net Payout</span>
              <span className="text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">$247.50</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agent Tools */}
      <div className="mb-10 relative group entrance-stagger">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-purple-600/10 to-indigo-600/10 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="glass-card inner-purple-glow rounded-[2.5rem] p-10 bg-black/20 relative border-white/5">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl shrink-0">
              <span className="material-symbols-outlined text-3xl">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-headline-md text-3xl font-black text-cn-ink dark:text-white tracking-tight">Coach Intelligence Suite</h3>
              <p className="text-on-surface-variant/40 text-base mt-1 font-medium">Elevate your mentorship with predictive AI and automated analysis.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card bg-white/[0.01] border-white/5 p-8 rounded-[1.75rem] group/tool cursor-pointer hover:bg-white/[0.03] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-8 group-hover/tool:scale-105 group-hover/tool:bg-primary/10 transition-all">
                <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
              </div>
              <h4 className="font-black text-xl mb-3 text-cn-ink dark:text-white">Smart PDF Parser</h4>
              <p className="text-on-surface-variant/40 text-sm leading-relaxed font-medium">Turn flat documentation into structured dynamic learning modules.</p>
            </div>
            <div className="glass-card bg-white/[0.01] border-white/5 p-8 rounded-[1.75rem] group/tool cursor-pointer hover:bg-white/[0.03] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-8 group-hover/tool:scale-105 group-hover/tool:bg-primary/10 transition-all">
                <span className="material-symbols-outlined text-2xl">quiz</span>
              </div>
              <h4 className="font-black text-xl mb-3 text-cn-ink dark:text-white">Quiz Engine</h4>
              <p className="text-on-surface-variant/40 text-sm leading-relaxed font-medium">Generate adaptive assessments based on student performance curves.</p>
            </div>
            <div className="glass-card bg-white/[0.01] border-white/5 p-8 rounded-[1.75rem] group/tool cursor-pointer hover:bg-white/[0.03] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-8 group-hover/tool:scale-105 group-hover/tool:bg-primary/10 transition-all">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <h4 className="font-black text-xl mb-3 text-cn-ink dark:text-white">Predictive Edge</h4>
              <p className="text-on-surface-variant/40 text-sm leading-relaxed font-medium">Detect engagement drops early with behavioral AI heatmaps.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 entrance-stagger">
        {/* Table Section */}
        <div className="glass-card inner-purple-glow rounded-[2rem] p-8 overflow-hidden">
          <div className="flex justify-between items-center mb-10 px-2">
            <h3 className="font-headline-md text-xl font-black text-cn-ink dark:text-white">High Impact Courses</h3>
            <Link href="/coach/courses" className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group/link">
              Full Inventory 
              <span className="material-symbols-outlined text-base group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-on-surface-variant/20 text-[9px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                  <th className="pb-6 pl-4">Course Path</th>
                  <th className="pb-6 text-center">Students</th>
                  <th className="pb-6 text-center">Yield</th>
                  <th className="pb-6 text-right pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="group/row hover:bg-white/[0.01] transition-colors hover:scale-[1.005] cursor-pointer">
                  <td className="py-6 pl-4">
                    <p className="font-black text-base text-cn-ink dark:text-white group-hover/row:text-primary transition-colors">Advanced Algorithms</p>
                    <p className="text-[9px] text-on-surface-variant/30 font-black uppercase tracking-widest mt-1.5">CS CORE • UPDATED 2D AGO</p>
                  </td>
                  <td className="py-6 text-center text-cn-ink dark:text-white font-black text-base">124</td>
                  <td className="py-6 text-center font-black text-base text-primary">$4,960</td>
                  <td className="py-6 text-right pr-4">
                    <span className="bg-primary/5 text-primary text-[9px] font-black px-3 py-1 rounded-lg border border-primary/10 tracking-widest">LIVE</span>
                  </td>
                </tr>
                <tr className="group/row hover:bg-white/[0.01] transition-colors hover:scale-[1.005] cursor-pointer">
                  <td className="py-6 pl-4">
                    <p className="font-black text-base text-cn-ink dark:text-white group-hover/row:text-primary transition-colors">Systems Architecture</p>
                    <p className="text-[9px] text-on-surface-variant/30 font-black uppercase tracking-widest mt-1.5">ENGINEERING • UPDATED 5D AGO</p>
                  </td>
                  <td className="py-6 text-center text-cn-ink dark:text-white font-black text-base">89</td>
                  <td className="py-6 text-center font-black text-base text-primary">$1,240</td>
                  <td className="py-6 text-right pr-4">
                    <span className="bg-primary/5 text-primary text-[9px] font-black px-3 py-1 rounded-lg border border-primary/10 tracking-widest">LIVE</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* Activity Feed */}
        <div className="glass-card inner-purple-glow rounded-[2rem] p-8">
          <h3 className="font-headline-md text-xl font-black text-cn-ink dark:text-white mb-10">Live Transmission</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-primary/20 via-white/5 to-transparent"></div>
            
            <div className="flex items-start gap-6 relative group/item">
              <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary z-10 bg-background group-hover/item:scale-105 transition-transform shadow-md">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div className="pt-0.5">
                <p className="font-bold text-base text-on-surface leading-tight"><span className="text-cn-ink dark:text-white font-black">Ahmed K.</span> mastered "Recursive Structures"</p>
                <p className="text-[10px] text-on-surface-variant/30 font-black uppercase tracking-[0.15em] mt-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot"></span>
                  2 MINUTES AGO • VERIFIED
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 relative group/item">
              <div className="w-12 h-12 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500 z-10 bg-background group-hover/item:scale-105 transition-transform shadow-md">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div className="pt-0.5">
                <p className="font-bold text-base text-on-surface leading-tight"><span className="text-cn-ink dark:text-white font-black">Sara M.</span> left a 5-star review: "Excellent depth."</p>
                <p className="text-[10px] text-on-surface-variant/30 font-black uppercase tracking-[0.15em] mt-2.5">15 MINUTES AGO • FEEDBACK</p>
              </div>
            </div>

            <div className="flex items-start gap-6 relative group/item">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 z-10 bg-background group-hover/item:scale-105 transition-transform shadow-md">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <div className="pt-0.5">
                <p className="font-bold text-base text-on-surface leading-tight">New Enrollment: <span className="text-cn-ink dark:text-white font-black">Bilal J.</span> joined Architecture</p>
                <p className="text-[10px] text-on-surface-variant/30 font-black uppercase tracking-[0.15em] mt-2.5">1 HOUR AGO • CONVERSION</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
