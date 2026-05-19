"use client";
import Link from "next/link";
import { IconExplore, IconAutoStories, IconAutoAwesome, IconEditNote, IconCode, IconPsychology, IconArrowForward } from "./landing-client";

export function LandingSections() {
  return (
    <>
      {/* ━━━ STATS ━━━ */}
      <section className="py-32 px-4 md:px-16 bg-stats relative">
        <div className="max-w-[1280px] mx-auto relative z-10">
          <div className="text-center mb-24 entrance-anim">
            <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase mb-4 block">Measurable Success</span>
            <h2 className="font-headline text-5xl font-bold mb-6 text-on-surface">Our impact at a glance</h2>
            <div className="h-1.5 w-24 gradient-primary mx-auto rounded-full shadow-[0_0_15px_rgba(255,107,61,0.5)]" />
          </div>
          <div className="flex flex-wrap lg:flex-nowrap justify-center gap-10 items-center">
            <div className="glass-depth-2 p-10 rounded-4xl hover-magnetic w-full sm:w-[280px] h-[340px] flex flex-col justify-between group">
              <div><div className="glow-dot mb-4 group-hover:scale-150 transition-transform" /><span className="text-primary/50 font-bold text-xs tracking-widest">01</span></div>
              <div><p className="text-5xl font-extrabold mb-3 text-primary-container group-hover:text-accent-warm transition-colors font-headline">2+</p><p className="font-bold text-lg text-on-surface">Years building</p><p className="text-on-surface-variant text-sm mt-2">Continuous evolution and product iterations.</p></div>
            </div>
            <div className="glass-depth-3 p-12 rounded-4xl hover-magnetic w-full sm:w-[320px] h-[400px] flex flex-col justify-between group border-primary/20 -translate-y-4">
              <div><div className="glow-dot mb-4" style={{ background: "#6001d1", boxShadow: "0 0 12px #6001d1" }} /><span className="text-primary/50 font-bold text-xs tracking-widest">02</span></div>
              <div><p className="text-6xl font-extrabold mb-4 text-primary-container font-headline">50+</p><p className="font-bold text-xl text-on-surface">Course topics</p><p className="text-on-surface-variant text-base mt-2 opacity-80">Diverse curriculum seeded for professional excellence.</p></div>
            </div>
            <div className="glass-depth-2 p-10 rounded-4xl hover-magnetic w-full sm:w-[280px] h-[340px] flex flex-col justify-between group">
              <div><div className="glow-dot mb-4" /><span className="text-primary/50 font-bold text-xs tracking-widest">03</span></div>
              <div><p className="text-5xl font-extrabold mb-3 text-primary-container font-headline">6+</p><p className="font-bold text-lg text-on-surface">AI Skills</p><p className="text-on-surface-variant text-sm mt-2">Advanced tool-using agents at your disposal.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ CONTINUE LEARNING ━━━ */}
      <section className="py-32 px-4 md:px-16 bg-courses relative">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 entrance-anim">
            <div className="max-w-xl">
              <span className="text-primary font-bold tracking-[0.3em] text-[10px] uppercase mb-4 block">Curated Experience</span>
              <h2 className="font-headline text-5xl font-extrabold text-on-surface">Continue where you <br/>left off</h2>
            </div>
            <Link href="/dashboard" className="text-primary-container font-bold text-lg hover:underline flex items-center gap-3 group transition-all">
              <span>Explore all modules</span>
              <IconArrowForward className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { tag:"Marketing", title:"Creative Writing for Beginners", pct:45, color:"#ff6b3d", borderColor:"#ff6b3d", Icon:IconEditNote, glow:"card-glow-orange" },
              { tag:"Computer Science", title:"Digital Illustration Foundations", pct:72, color:"#6001d1", borderColor:"#6001d1", Icon:IconCode, glow:"card-glow-indigo" },
              { tag:"Psychology", title:"Public Speaking & Leadership", pct:15, color:"#00af79", borderColor:"#00af79", Icon:IconPsychology, glow:"card-glow-emerald" },
            ].map((c,i)=>(
              <div key={i} className={`card-glow ${c.glow} glass-depth-2 rounded-4xl p-10 hover-magnetic group flex flex-col h-full border-l-4`} style={{ borderLeftColor: c.borderColor }}>
                <div className="flex justify-between items-start mb-10">
                  <span className="glass-depth-1 text-on-surface font-bold text-[10px] px-4 py-1.5 rounded-full tracking-widest uppercase">{c.tag}</span>
                  <span className="card-icon opacity-40 group-hover:opacity-100 transition-all" style={{ color: c.color }}><c.Icon className="w-5 h-5" /></span>
                </div>
                <h3 className="text-3xl font-extrabold text-on-surface mb-auto leading-tight transition-colors font-headline">{c.title}</h3>
                <div className="mt-12 space-y-6">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <span>Progress</span>
                    <span style={{ color: c.color }}>{c.pct}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div className="h-full rounded-full glow-liquid" style={{ width:`${c.pct}%`, background:c.color, boxShadow:`0 0 10px ${c.color}80` }} />
                  </div>
                  <Link href="/dashboard" className="block w-full gradient-primary text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-primary-container/30 transition-all text-center">Resume Learning</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ INTELLIGENT WORKFLOW ━━━ */}
      <section className="py-32 px-4 md:px-16 bg-workflow relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto relative z-10">
          <h2 className="font-headline text-5xl font-extrabold mb-24 entrance-anim text-center text-on-surface">Intelligent Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />
            {[
              { Icon:IconExplore, title:"Discover Path", body:"Browse highly curated courses with AI-powered filtering tailored to your career goals.", depth:"glass-depth-2" },
              { Icon:IconAutoStories, title:"Master Lessons", body:"Engage with immersive lessons featuring real-time progress rings and dynamic curriculum sidebars.", depth:"glass-depth-3 border-primary/10" },
              { Icon:IconAutoAwesome, title:"AI Mentorship", body:"Cognara tutors use tool-sets to debug, quiz, and provide voice feedback—not just chat.", depth:"glass-depth-2" },
            ].map((f,i)=>(
              <div key={i} className={`${f.depth} p-12 rounded-4xl hover-magnetic transition-all group relative z-10 text-center`}>
                <div className="w-20 h-20 rounded-2xl border-2 border-primary-container/30 flex items-center justify-center mx-auto mb-8 text-primary-container shadow-2xl bg-surface-container">
                  <f.Icon className="w-9 h-9" />
                </div>
                <h4 className="text-2xl font-bold text-on-surface mb-6">{f.title}</h4>
                <p className="text-on-surface-variant leading-relaxed opacity-80 font-body">{f.body}</p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="relative entrance-anim group">
            <div className="absolute inset-0 bg-primary-container/20 blur-[100px] scale-90 group-hover:scale-100 transition-transform duration-1000 opacity-30" />
            <div className="glass-depth-3 p-10 md:p-16 rounded-4xl flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden border-white/10">
              <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-gradient-to-br from-primary-container/15 to-transparent rounded-4xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-gradient-to-tl from-accent-warm/10 to-transparent rounded-4xl pointer-events-none" />
              <div className="max-w-2xl text-center lg:text-left">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-5 py-2 rounded-full mb-8 inline-block tracking-[0.2em] uppercase">Ecosystem Launch</span>
                <h3 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-6 leading-tight font-headline">Your advanced student dashboard awaits.</h3>
                <p className="text-on-surface-variant text-lg leading-relaxed opacity-90 font-body">Experience a high-performance environment with dark-mode sidebars, warm canvas aesthetics, and real-time analytical insights.</p>
              </div>
              <div className="shrink-0 w-full lg:w-auto">
                <Link href="/dashboard" className="block w-full lg:w-auto px-12 py-6 rounded-3xl font-extrabold text-xl gradient-primary text-white text-center hover:shadow-[0_25px_50px_-12px_rgba(255,107,61,0.5)] transition-all active:scale-95 group-hover:-translate-y-2">Initialize Dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
