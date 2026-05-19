"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LandingSections } from "./landing-sections";

/* ━━━ SVG Icon Components ━━━ */
const IconSchool = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>
);
const IconBolt = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/></svg>
);
const IconPlay = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M8 5v14l11-7z"/></svg>
);
const IconExplore = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="36" height="36"><path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z"/></svg>
);
const IconAutoStories = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="36" height="36"><path d="M19 1l-5 5v11l5-4.5V1zm-2 7.85l-3 2.7V4.35l3-3v7.5zM1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5V8c-1.45-1.1-3.55-2-5.5-2-1.45 0-2.85.35-4 .65v-.15L1 6zm11 12.5c-1.45-1.1-3.55-1.5-5.5-1.5-.7 0-1.5.1-2.25.25l-.25.05V7.5c.75-.2 1.55-.3 2.5-.3 1.9 0 3.8.7 5.5 2v9.3zM23 6l-1.5.5v14.15c-1.15-.3-2.55-.65-4-.65-1.95 0-4.05.4-5.5 1.5V8c1.45-1.1 3.55-2 5.5-2 1.45 0 2.85.35 4 .65V6z"/></svg>
);
const IconAutoAwesome = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="36" height="36"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
);
const IconEditNote = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M3 10h11v2H3v-2zm0-2h11V6H3v2zm0 8h7v-2H3v2zm15.01-3.13l.71-.71a.996.996 0 011.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71-2.12-2.12zm-.71.71l-5.3 5.3V21h2.12l5.3-5.3-2.12-2.12z"/></svg>
);
const IconCode = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
);
const IconPsychology = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M13 8.57a1.43 1.43 0 100 2.86 1.43 1.43 0 000-2.86zM13 3C9.25 3 6.2 5.94 6.02 9.64L4.1 12.2a.5.5 0 00.4.8H6v3c0 1.1.9 2 2 2h1v3h7v-4.68c2.36-1.12 4-3.53 4-6.32 0-3.87-3.13-7-7-7zm3 7c0 .13-.01.26-.02.39l1.16.9-.38.67-1.34-.56c-.21.2-.45.37-.71.5l.1 1.1H13.8l.1-1.1c-.26-.13-.5-.3-.71-.5l-1.34.56-.38-.67 1.16-.9c-.01-.13-.02-.26-.02-.39s.01-.26.02-.39l-1.16-.9.38-.67 1.34.56c.21-.2.45-.37.71-.5L13.8 7h1.39l-.1 1.1c.26.13.5.3.71.5l1.34-.56.38.67-1.16.9c.01.13.02.26.02.39z"/></svg>
);
const IconArrowForward = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
);
const IconStar = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
);
const IconEmail = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
);
const IconShare = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
);
const IconLanguage = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>
);

export default function LandingClient() {
  const [light, setLight] = useState(false);
  const glowRef1 = useRef<HTMLDivElement>(null);
  const glowRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("cognara-lp-theme");
    if (saved === "light") setLight(true);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 60;
      const y = (e.clientY / window.innerHeight - 0.5) * 60;
      if (glowRef1.current) glowRef1.current.style.transform = `translate(${x}px, ${y}px)`;
      if (glowRef2.current) glowRef2.current.style.transform = `translate(${-x}px, ${-y}px)`;
    };
    document.addEventListener("mousemove", h);
    return () => document.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll(".entrance-anim").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".hover-magnetic").forEach(el => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const rx = (e.clientY - r.top - r.height / 2) / 20;
        const ry = (r.width / 2 - (e.clientX - r.left)) / 20;
        el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-10px)`;
      };
      const leave = () => { el.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)"; };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
    });
  }, []);

  return (
    <div className={`lp-root ${light ? "lp-light" : ""}`}>
      {/* ━━━ NAVBAR ━━━ */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-16 py-4 max-w-[1440px] mx-auto bg-surface-dim/40 backdrop-blur-2xl border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
            <IconSchool className="text-on-primary w-5 h-5" />
          </div>
          <span className="font-headline text-2xl font-bold tracking-tighter text-on-surface">COGNARA</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-body text-sm tracking-wide">
          <Link className="nav-link active" href="/dashboard">Courses</Link>
          <Link className="nav-link" href="/dashboard">Mentors</Link>
          <a className="nav-link" href="#pricing">Pricing</a>
          <a className="nav-link" href="#enterprise">Enterprise</a>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hidden sm:block sign-in-link text-on-surface/70 font-semibold text-sm">Sign In</Link>
          <Link href="/register" className="gradient-primary text-white px-7 py-2.5 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(255,107,61,0.4)] transition-all active:scale-95">Get Started</Link>
        </div>
      </nav>

      <main className="mt-20">
        {/* ━━━ HERO ━━━ */}
        <section className="relative min-h-[90vh] flex items-center px-4 md:px-16 overflow-hidden bg-hero">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div ref={glowRef1} className="absolute w-[800px] h-[800px] -top-[400px] -left-[400px] bg-primary-container/10 blur-[120px] rounded-full" />
            <div ref={glowRef2} className="absolute w-[600px] h-[600px] top-[20%] right-[10%] bg-tertiary-container/5 blur-[100px] rounded-full" />
          </div>
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full relative z-10">
            {/* Left */}
            <div className="entrance-anim">
              <div className="flex items-center gap-3 mb-8">
                <div className="px-3 py-1 glass-depth-2 rounded-full flex items-center gap-2">
                  <IconBolt className="text-primary-container w-3.5 h-3.5" />
                  <span className="text-primary font-bold tracking-[0.2em] text-[10px] uppercase">Cognara AI Intelligence</span>
                </div>
              </div>
              <h1 className="font-headline text-5xl md:text-7xl mb-8 leading-[1.1] font-extrabold text-on-surface">
                Discover your ideal <br/>learning path — <span className="italic" style={{ color: '#ff6b3d' }}>today.</span>
              </h1>
              <p className="text-on-surface-variant text-lg mb-10 max-w-lg leading-relaxed opacity-90 font-body">
                A sophisticated ecosystem for students, coaches, and admins. Purpose-built for high-impact educational growth.
              </p>
              <div className="flex flex-wrap gap-5 mb-12">
                <Link href="/register" className="gradient-primary text-white px-10 py-5 rounded-2xl font-bold hover:shadow-[0_20px_40px_-10px_rgba(255,107,61,0.4)] transition-all active:scale-95">Join the platform</Link>
                <Link href="/login" className="glass-depth-2 text-on-surface px-10 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all">Request Demo</Link>
              </div>
              <div className="flex items-center gap-6 glass-depth-1 p-4 rounded-2xl inline-flex">
                <div className="flex -space-x-3">
                  {[{c:"bg-orange-500",l:"A"},{c:"bg-indigo-500",l:"B"},{c:"bg-emerald-500",l:"C"},{c:"bg-primary-container",l:"D"}].map((a,i)=>(
                    <div key={i} className={`w-11 h-11 rounded-full border-2 border-surface ${a.c} shadow-xl flex items-center justify-center text-xs font-bold text-white`}>{a.l}</div>
                  ))}
                </div>
                <div>
                  <p className="text-on-surface font-bold text-sm">Trusted by 10k+ learners</p>
                  <div className="flex items-center gap-2">
                    <div className="flex text-primary-container gap-0.5">{[0,1,2,3,4].map(i=><IconStar key={i} className="w-3 h-3" />)}</div>
                    <span className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">Top Rated</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Right — Hero Media */}
            <div className="relative entrance-anim">
              <div className="glass-depth-3 rounded-4xl p-2 relative group hover:scale-[1.02] transition-all duration-700">
                <div className="aspect-video overflow-hidden rounded-3xl relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
                  <div className="absolute inset-0 flex items-center justify-center opacity-60"><HeroChartSVG /></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                    <button className="w-24 h-24 bg-primary-container text-white rounded-full flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform shadow-2xl shadow-primary-container/40">
                      <IconPlay className="w-12 h-12" />
                    </button>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 glass-depth-3 p-5 rounded-3xl flex items-center gap-4 group-hover:translate-y-[-10px] transition-transform duration-500">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg"><IconSchool className="text-white w-6 h-6" /></div>
                  <div>
                    <p className="text-on-surface font-bold text-sm">System Overview</p>
                    <p className="text-on-surface-variant text-[11px] opacity-70">2:45 · Experience Cognara</p>
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 px-4 py-2 glass-depth-2 rounded-xl group-hover:translate-y-[5px] transition-transform duration-500">
                  <span className="text-yellow-400 font-bold text-[10px] tracking-widest uppercase">Verified Quality</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <LandingSections />
      </main>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-footer footer-glow py-32 px-4 md:px-16">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg"><IconSchool className="text-on-primary w-6 h-6" /></div>
              <span className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface">COGNARA</span>
            </div>
            <p className="text-on-surface-variant mb-12 text-lg leading-relaxed opacity-80 font-body">Empowering global learners with agentic AI environments and specialized pedagogical structures designed for the future of work.</p>
            <div className="flex gap-5">
              {[IconEmail, IconShare, IconLanguage].map((Icon,i)=>(
                <a key={i} href="#" className="w-12 h-12 rounded-2xl glass-depth-2 flex items-center justify-center text-on-surface/60 hover:bg-primary-container hover:text-white transition-all hover:scale-110"><Icon className="w-5 h-5" /></a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 lg:gap-24">
            {[
              {t:"Architecture",l:["Curriculum","Mentor Network","Investment","System Status"]},
              {t:"Intelligence",l:["Agent SDK","Foundations","Analytics","Open Roles"]},
              {t:"Resources",l:["Governance","Compliance","Service Desk"]},
            ].map(col=>(
              <div key={col.t} className="space-y-6">
                <h5 className="text-on-surface font-extrabold text-sm tracking-[0.2em] uppercase">{col.t}</h5>
                <ul className="space-y-4 text-on-surface-variant font-medium font-body">
                  {col.l.map(l=><li key={l}><a className="hover:text-primary transition-colors" href="#">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-on-surface-variant text-xs font-bold tracking-widest uppercase opacity-60">
          <div>© 2026 COGNARA INTELLIGENCE. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-8">{["Privacy","Security","Ethics"].map(l=><a key={l} className="hover:text-primary transition-colors" href="#">{l}</a>)}</div>
        </div>
      </footer>

      {/* ━━━ THEME TOGGLE ━━━ */}
      <button
        className="theme-toggle"
        onClick={() => { 
          const next = !light; 
          setLight(next); 
          localStorage.setItem("cognara-lp-theme", next ? "light" : "dark"); 
        }}
        aria-label="Toggle theme"
      >
        {light ? "☾" : "☀"}
      </button>
    </div>
  );
}

function HeroChartSVG() {
  const bars = [30,50,40,65,55,80,45,70,35,85,60,75];
  const colors = ["#FFB89A","#FF8A65","#FF6B3D","#FF8A65","#FFB89A","#FF6B3D","#FF8A65","#FF6B3D","#FFB89A","#FF6B3D","#FF8A65","#FFB89A"];
  return (
    <svg viewBox="0 0 400 200" className="w-[80%] h-auto">
      {bars.map((h,i)=><rect key={i} x={20+i*30} y={200-h*1.8} width={20} height={h*1.8} rx={4} fill={colors[i]} opacity={0.9}/>)}
    </svg>
  );
}

export { IconSchool, IconExplore, IconAutoStories, IconAutoAwesome, IconEditNote, IconCode, IconPsychology, IconArrowForward };
