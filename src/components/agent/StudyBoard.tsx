"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AgentIcon } from "@/components/ui/agent-icon";

type Props = { content: string; onClose: () => void; lang: "en" | "ur" };

/* ═══════ PALETTE ═══════ */
const C = {
  orange: "#ff5734", pink: "#e84393", blue: "#74b9ff", green: "#00b894",
  yellow: "#fdcb6e", purple: "#a29bfe", cyan: "#81ecec", red: "#ff6b6b",
  lime: "#55efc4", peach: "#fab1a0",
  bg: "#0d1117", card: "#161b22", chalk: "#e8e6e3",
};
const A = [C.orange, C.blue, C.green, C.yellow, C.purple, C.pink, C.cyan, C.lime, C.peach, C.red];

/* ═══════ ROUGH / HAND-DRAWN SVG HELPERS ═══════ */
function seed(i: number) { return Math.sin(i * 9301 + 4927) * 0.5; }

function roughLine(x1: number, y1: number, x2: number, y2: number, jitter = 2): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(Math.floor(len / 12), 3);
  let d = `M${x1},${y1}`;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const jx = (s < steps ? seed(s * 7 + x1) * jitter : 0);
    const jy = (s < steps ? seed(s * 11 + y1) * jitter : 0);
    d += ` L${x1 + dx * t + jx},${y1 + dy * t + jy}`;
  }
  return d;
}

function roughRect(x: number, y: number, w: number, h: number, j = 2): string {
  return [
    roughLine(x, y, x + w, y, j),
    roughLine(x + w, y, x + w, y + h, j),
    roughLine(x + w, y + h, x, y + h, j),
    roughLine(x, y + h, x, y, j),
  ].join(" ");
}

function roughCircle(cx: number, cy: number, r: number, j = 1.5): string {
  const pts = 24;
  let d = "";
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const jr = r + seed(i * 13 + cx) * j;
    const px = cx + Math.cos(a) * jr;
    const py = cy + Math.sin(a) * jr;
    d += (i === 0 ? `M${px},${py}` : ` L${px},${py}`);
  }
  return d + " Z";
}

function roughArrow(x1: number, y1: number, x2: number, y2: number, j = 2): string {
  const line = roughLine(x1, y1, x2, y2, j);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 10;
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  const head = ` M${x2 + Math.cos(a1) * hl},${y2 + Math.sin(a1) * hl} L${x2},${y2} L${x2 + Math.cos(a2) * hl},${y2 + Math.sin(a2) * hl}`;
  return line + head;
}

function roughUnderline(x: number, y: number, w: number, j = 3): string {
  return roughLine(x, y, x + w, y + seed(x) * j, j);
}

function perimRect(w: number, h: number) { return 2 * (w + h); }
function perimCircle(r: number) { return 2 * Math.PI * r; }

/* ═══════ TYPEWRITER HOOK ═══════ */
function useTypewriter(text: string, speed = 18, active = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(text); setDone(true); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);
  return { displayed, done };
}

/* ═══════ MAIN COMPONENT ═══════ */
export function StudyBoard({ content, onClose }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(true);
  const [speakingIdx, setSpeakingIdx] = useState(-1);
  const [autoNarrate, setAutoNarrate] = useState(true);
  const boardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const sections = useMemo(() => parseContent(content), [content]);
  const totalSections = sections.length;

  /* Ref to hold the "advance to next section" function that speech-end will trigger */
  const nextRevealRef = useRef<(() => void) | null>(null);

  /* ── Speak single section — calls onDone when voice finishes ── */
  const speakSection = useCallback((idx: number, text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) { onDone(); return; }
    const clean = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1")
      .replace(/[#>|*_~[\]]/g, "").replace(/\n+/g, ". ").replace(/\s{2,}/g, " ").trim();
    if (!clean || clean.length < 3) { setSpeakingIdx(-1); onDone(); return; }

    // Don't cancel previous — let it finish gracefully
    const u = new SpeechSynthesisUtterance(clean.slice(0, 500));
    u.lang = "en-US"; u.rate = 0.88; u.pitch = 1.0; u.volume = 1.0;

    // Voice selection — prefer natural/premium voices
    const voices = window.speechSynthesis.getVoices();
    const pick =
      voices.find(v => v.name.includes("Microsoft Guy Online")) ||
      voices.find(v => v.name.includes("Microsoft Ryan")) ||
      voices.find(v => v.name.includes("Microsoft David")) ||
      voices.find(v => v.name.includes("Microsoft Mark")) ||
      voices.find(v => v.name.includes("Google UK English Male")) ||
      voices.find(v => v.name.includes("Google US English")) ||
      voices.find(v => v.name.includes("Alex")) ||
      voices.find(v => v.name.includes("Daniel")) ||
      voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ||
      voices.find(v => v.lang === "en-US" && v.localService) ||
      voices.find(v => v.lang === "en-US");
    if (pick) u.voice = pick;

    u.onstart = () => { setIsSpeaking(true); setSpeakingIdx(idx); };
    u.onend = () => { setIsSpeaking(false); setSpeakingIdx(-1); onDone(); };
    u.onerror = () => { setIsSpeaking(false); setSpeakingIdx(-1); onDone(); };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingIdx(-1);
    nextRevealRef.current = null;
  }, []);

  /* ── Get speakable text for a section ── */
  const getSpeakText = useCallback((s: Section): string => {
    switch (s.type) {
      case "heading": case "subheading": return s.text;
      case "text": return s.text;
      case "blockquote": return s.text;
      case "code": return `Here's a code example in ${s.lang || "this language"}. ${s.text.split("\n").slice(0, 4).join(". ")}`;
      case "list": return (s.items || []).join(". ");
      case "processSteps": case "olist": return `Step by step: ${(s.items || []).map((it, i) => `Step ${i + 1}, ${it}`).join(". ")}`;
      case "conceptMap": return `The key concepts here are: ${(s.mapNodes || []).join(", ")}. Let me show you how they connect.`;
      case "flowchart": return `The flow goes: ${(s.flowSteps || []).map(f => f.label).join(", then ")}`;
      case "comparison": return `Let's compare ${(s.tableData?.headers || []).join(" versus ")}`;
      case "diagram": return `Variables in memory: ${(s.diagramData || []).map(d => `${d.name} equals ${d.value}`).join(", ")}`;
      case "timeline": return `Let me walk through the timeline: ${(s.items || []).map((it, i) => `${i + 1}, ${it}`).join(". Then ")}`;
      case "layers": return `The layers from bottom to top are: ${(s.items || []).join(", ")}`;
      case "equation": return `The formula is: ${s.text}`;
      default: return "";
    }
  }, []);

  /* ── Progressive reveal — waits for voice to finish before advancing ── */
  useEffect(() => {
    if (!isRevealing) return;
    setVisibleCount(0);
    let idx = 0;
    let cancelled = false;

    const reveal = () => {
      if (cancelled) return;
      idx++;
      setVisibleCount(idx);

      // Auto-scroll
      if (boardRef.current) {
        requestAnimationFrame(() => boardRef.current?.scrollTo({ top: boardRef.current!.scrollHeight, behavior: "smooth" }));
      }

      if (idx < totalSections) {
        const scheduleNext = () => {
          if (cancelled) return;
          // Small visual breathing delay after speech ends
          const t = sections[idx]?.type;
          const visualDelay = t === "conceptMap" || t === "flowchart" || t === "layers" ? 600
            : t === "processSteps" || t === "timeline" ? 500
            : t === "heading" ? 300
            : 400;
          timerRef.current = setTimeout(reveal, visualDelay);
        };

        // Speak the current section, then schedule next when done
        const currentSection = sections[idx - 1];
        if (autoNarrate && currentSection) {
          const spText = getSpeakText(currentSection);
          if (spText && spText.length > 2) {
            nextRevealRef.current = scheduleNext;
            speakSection(idx - 1, spText, scheduleNext);
          } else {
            // No text to speak — use a short fixed delay
            timerRef.current = setTimeout(reveal, 800);
          }
        } else {
          // Auto-narrate off — use visual-appropriate fixed delays
          const t = sections[idx]?.type;
          const delay = t === "conceptMap" || t === "flowchart" || t === "layers" ? 1200
            : t === "processSteps" || t === "timeline" || t === "comparison" ? 1000
            : t === "code" || t === "diagram" ? 900
            : 700;
          timerRef.current = setTimeout(reveal, delay);
        }
      } else {
        // Last section — speak it, then mark done
        const lastSection = sections[idx - 1];
        if (autoNarrate && lastSection) {
          speakSection(idx - 1, getSpeakText(lastSection), () => setIsRevealing(false));
        } else {
          setIsRevealing(false);
        }
      }
    };

    timerRef.current = setTimeout(reveal, 800);
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealing, totalSections, autoNarrate]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { stopSpeaking(); onClose(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose, stopSpeaking]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const handleReplay = useCallback(() => { stopSpeaking(); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount(0); setIsRevealing(true); }, [stopSpeaking]);
  const handleSkip = useCallback(() => { stopSpeaking(); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount(totalSections); setIsRevealing(false); }, [totalSections, stopSpeaking]);
  const pct = totalSections > 0 ? Math.round((visibleCount / totalSections) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: `radial-gradient(ellipse at 50% 0%, #1a1f2e 0%, ${C.bg} 70%)` }}>
      {/* Chalk dust particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: 2 + seed(i) * 3, height: 2 + seed(i) * 3,
            left: `${(seed(i * 7) + 0.5) * 100}%`, top: `${(seed(i * 13) + 0.5) * 100}%`,
            animation: `chalkDrift ${8 + seed(i * 3) * 6}s linear infinite`,
          }} />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-2.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink shadow-lg shadow-cn-orange/20">
              <AgentIcon size={18} />
            </div>
            {isRevealing && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-[#0d1117] animate-pulse" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">COGNARA Whiteboard</h2>
            <p className="text-[11px] text-white/35">{isRevealing ? `✏️ Drawing ${visibleCount}/${totalSections}…` : `✅ ${totalSections} visuals rendered`}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {speakingIdx >= 0 && <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-400 animate-pulse">🔊 Narrating…</span>}
          <button type="button" onClick={() => setAutoNarrate(n => !n)} className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-[10px] font-bold transition ${autoNarrate ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>{autoNarrate ? "🔊" : "🔇"} Voice</button>
          {isRevealing
            ? <button type="button" onClick={handleSkip} className="flex h-8 items-center rounded-lg px-3 text-[10px] font-bold bg-white/8 text-white/50 hover:text-white transition">Skip ⏭</button>
            : <button type="button" onClick={handleReplay} className="flex h-8 items-center rounded-lg px-3 text-[10px] font-bold bg-white/8 text-white/50 hover:text-white transition">↻ Replay</button>}
          <button type="button" onClick={() => { stopSpeaking(); onClose(); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-white/40 hover:text-white transition">✕</button>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="h-[3px] bg-white/5 relative z-10">
        <div className="h-full bg-gradient-to-r from-cn-orange via-cn-pink to-purple-500 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>

      {/* ── Board ── */}
      <div className="flex-1 overflow-y-auto relative z-10" ref={boardRef}>
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="0.5" fill="white"/></svg>')}")` }} />
        <div className="mx-auto max-w-5xl px-8 py-10 space-y-8 relative">
          {sections.map((s, i) => {
            if (i >= visibleCount) return null;
            const isCurrent = speakingIdx === i;
            return (
              <div key={i} className={`transition-all duration-300 ${isCurrent ? "ring-2 ring-cn-orange/30 rounded-2xl bg-cn-orange/[0.03]" : ""}`}
                style={{ animation: "boardReveal 0.7s cubic-bezier(.16,1,.3,1) forwards", padding: isCurrent ? "12px" : "0" }}>
                <RenderSection section={s} index={i} isActive={isCurrent} />
              </div>
            );
          })}
          {isRevealing && <DrawingIndicator />}
        </div>
      </div>

      <BoardStyles />
      <div className="border-t border-white/5 py-1.5 text-center text-[10px] text-white/15 relative z-10">Esc — Close · {autoNarrate ? "Voice synced" : "Voice off"} · {isRevealing ? "Drawing…" : "Done"}</div>
    </div>
  );
}

/* ═══════ DRAWING INDICATOR ═══════ */
function DrawingIndicator() {
  return (
    <div className="flex items-center gap-4 py-6">
      <svg width="32" height="32" viewBox="0 0 32 32" className="animate-[wiggle_0.4s_ease-in-out_infinite]">
        <path d="M8 28 L24 12 L28 16 L12 32 Z" fill={C.orange} opacity="0.8" />
        <path d="M24 12 L26 6 L28 16 Z" fill={C.yellow} opacity="0.6" />
        <circle cx="8" cy="28" r="2" fill="white" opacity="0.4" />
      </svg>
      <div className="flex gap-1.5">{[0, 1, 2, 3].map(j => <span key={j} className="h-2 w-2 rounded-full bg-cn-orange" style={{ animation: `pulse 1s ease-in-out infinite`, animationDelay: `${j * 150}ms` }} />)}</div>
      <span className="text-xs text-white/25 italic">Drawing on the board…</span>
    </div>
  );
}

/* ═══════ SECTION RENDERER ═══════ */
function RenderSection({ section: s, index, isActive }: { section: Section; index: number; isActive: boolean }) {
  switch (s.type) {
    case "heading": return <ChalkHeading text={s.text} animate={isActive} />;
    case "subheading": return <ChalkSubheading text={s.text} />;
    case "text": return <HandwrittenText text={s.text} />;
    case "blockquote": return <StickyNote text={s.text} index={index} />;
    case "code": return <CodeBoard code={s.text} lang={s.lang || ""} />;
    case "list": return <BulletBoard items={s.items!} />;
    case "olist": case "processSteps": return <StepCircles items={s.items!} />;
    case "diagram": return <MemoryBoxes data={s.diagramData!} />;
    case "callstack": return <StackTower data={s.diagramData!} />;
    case "conceptMap": return <MindMap nodes={s.mapNodes!} />;
    case "flowchart": return <FlowBoard steps={s.flowSteps!} />;
    case "comparison": return <CompareColumns data={s.tableData!} />;
    case "timeline": return <TimelineRail items={s.items!} />;
    case "layers": return <LayerStack items={s.items!} />;
    case "equation": return <EquationBoard text={s.text} />;
    case "hr": return <hr className="border-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />;
    default: return null;
  }
}

/* ═══════ GRAPHICAL VISUALS ═══════ */

/* ── Chalk Heading — typewriter + hand-drawn underline ── */
function ChalkHeading({ text, animate }: { text: string; animate: boolean }) {
  const { displayed, done } = useTypewriter(text, 30, true);
  const w = Math.min(text.length * 18, 550);
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Segoe UI', system-ui" }}>
        {displayed}<span className={done ? "hidden" : "animate-pulse text-cn-orange"}>▌</span>
      </h2>
      {done && (
        <svg className="mt-2" width={w} height="8" viewBox={`0 0 ${w} 8`}>
          <path d={roughLine(0, 4, w, 4, 3)} fill="none" stroke={C.orange} strokeWidth="3" strokeLinecap="round"
            className="draw-line" style={{ strokeDasharray: w + 20, strokeDashoffset: w + 20 }} />
        </svg>
      )}
    </div>
  );
}

function ChalkSubheading({ text }: { text: string }) {
  const { displayed, done } = useTypewriter(text, 22, true);
  return (
    <div className="flex items-center gap-3 mt-10 mb-4">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d={roughCircle(10, 10, 8, 1)} fill="none" stroke={C.orange} strokeWidth="2" className="draw-line" style={{ strokeDasharray: 60, strokeDashoffset: 60 }} />
        <circle cx="10" cy="10" r="3.5" fill={C.orange} className="pop-in" />
      </svg>
      <h3 className="text-xl font-bold text-amber-400">{displayed}{!done && <span className="animate-pulse text-amber-400/60">▌</span>}</h3>
    </div>
  );
}

/* ── Handwritten Text — typed out with chalk feel ── */
function HandwrittenText({ text }: { text: string }) {
  const clean = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
  const { displayed } = useTypewriter(clean, 12, true);
  return (
    <div className="relative pl-6 py-1">
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(to bottom, ${C.orange}40, transparent)` }} />
      <p className="text-[15px] leading-relaxed text-white/75" style={{ fontFamily: "'Segoe UI', system-ui" }}
         dangerouslySetInnerHTML={{ __html: fmtInline(displayed) }} />
    </div>
  );
}

/* ── Sticky Note — Rotated note with pin ── */
function StickyNote({ text, index }: { text: string; index: number }) {
  const rotation = -2 + seed(index * 7) * 4;
  const color = A[index % A.length];
  return (
    <div className="flex justify-center my-6">
      <div className="relative max-w-md pop-in" style={{ transform: `rotate(${rotation}deg)` }}>
        {/* Pin */}
        <svg className="absolute -top-3 left-1/2 -translate-x-1/2 z-10" width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="6" fill={color} />
          <circle cx="10" cy="10" r="3" fill="white" opacity="0.4" />
        </svg>
        <div className="rounded-lg px-6 py-5 shadow-xl" style={{ background: `${color}18`, border: `2px solid ${color}30` }}>
          <p className="text-[15px] text-white/85 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtInline(text) }} />
        </div>
      </div>
    </div>
  );
}

/* ── Mind Map — Center + branches with curved bezier lines ── */
function MindMap({ nodes }: { nodes: string[] }) {
  if (nodes.length === 0) return null;
  const center = nodes[0];
  const sats = nodes.slice(1, 8);
  const cX = 400, cY = 190, R = 155;

  return (
    <div className="my-8 flex justify-center overflow-x-auto">
      <svg viewBox="0 0 800 380" width="100%" style={{ maxWidth: 800 }} overflow="visible">
        {/* Dotted grid */}
        {Array.from({ length: 20 }).map((_, i) => Array.from({ length: 9 }).map((_, j) => (
          <circle key={`g${i}-${j}`} cx={i * 40 + 10} cy={j * 40 + 10} r="0.7" fill="rgba(255,255,255,0.03)" />
        )))}
        {/* Branches — curved bezier */}
        {sats.map((_, i) => {
          const angle = (i / sats.length) * Math.PI * 2 - Math.PI / 2;
          const x2 = cX + Math.cos(angle) * R;
          const y2 = cY + Math.sin(angle) * R;
          const mx = (cX + x2) / 2 + seed(i * 19) * 30;
          const my = (cY + y2) / 2 + seed(i * 23) * 30;
          return <path key={`b${i}`} d={`M${cX},${cY} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={A[i % A.length]} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"
            className="draw-line" style={{ strokeDasharray: 300, strokeDashoffset: 300, animationDelay: `${200 + i * 100}ms`, animationDuration: "1s" }} />;
        })}
        {/* Center node */}
        <g className="pop-in">
          <path d={roughRect(cX - 85, cY - 28, 170, 56, 2)} fill={`${C.orange}15`} stroke={C.orange} strokeWidth="2.5" strokeLinecap="round"
            className="draw-line" style={{ strokeDasharray: 500, strokeDashoffset: 500 }} />
          <text x={cX} y={cY + 6} textAnchor="middle" fill="white" fontSize="15" fontWeight="800">{center.slice(0, 22)}</text>
        </g>
        {/* Satellite nodes */}
        {sats.map((node, i) => {
          const angle = (i / sats.length) * Math.PI * 2 - Math.PI / 2;
          const x = cX + Math.cos(angle) * R;
          const y = cY + Math.sin(angle) * R;
          const col = A[i % A.length];
          return (
            <g key={i} className="pop-in" style={{ animationDelay: `${400 + i * 120}ms` }}>
              <path d={roughRect(x - 58, y - 20, 116, 40, 1.5)} fill={`${col}12`} stroke={col} strokeWidth="2" strokeLinecap="round"
                className="draw-line" style={{ strokeDasharray: 400, strokeDashoffset: 400, animationDelay: `${300 + i * 100}ms` }} />
              <text x={x} y={y + 5} textAnchor="middle" fill={col} fontSize="11" fontWeight="700">{node.slice(0, 18)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Step Circles — hand-drawn circles + arrows ── */
function StepCircles({ items }: { items: string[] }) {
  const perRow = Math.min(items.length, 4);
  const rows = Math.ceil(items.length / perRow);
  const stepW = 155, gap = 65, pad = 50;
  const svgW = perRow * (stepW + gap) - gap + pad * 2;
  const svgH = rows * 130 + pad * 2;

  return (
    <div className="my-6 overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ maxWidth: svgW, minWidth: 380 }} overflow="visible">
        {items.map((item, i) => {
          const row = Math.floor(i / perRow), col = i % perRow;
          const x = pad + col * (stepW + gap) + stepW / 2;
          const y = pad + row * 130 + 30;
          const color = A[i % A.length];
          const hasNext = i < items.length - 1;

          return (
            <g key={i}>
              {/* Arrow to next */}
              {hasNext && (() => {
                const nCol = (i + 1) % perRow, nRow = Math.floor((i + 1) / perRow);
                const nx = pad + nCol * (stepW + gap) + stepW / 2;
                const ny = pad + nRow * 130 + 30;
                if (nRow === row) {
                  return <path d={roughArrow(x + 30, y, nx - 30, ny, 2)} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"
                    className="draw-line" style={{ strokeDasharray: 300, strokeDashoffset: 300, animationDelay: `${i * 200}ms` }} />;
                }
                return <path d={roughArrow(x, y + 30, pad + stepW / 2, ny - 30, 2)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round"
                  className="draw-line" style={{ strokeDasharray: 400, strokeDashoffset: 400, animationDelay: `${i * 200}ms` }} />;
              })()}
              {/* Circle */}
              <path d={roughCircle(x, y, 24, 1.5)} fill={`${color}12`} stroke={color} strokeWidth="2.5" strokeLinecap="round"
                className="draw-line" style={{ strokeDasharray: perimCircle(24) + 10, strokeDashoffset: perimCircle(24) + 10, animationDelay: `${i * 150}ms` }} />
              <text x={x} y={y + 6} textAnchor="middle" fill="white" fontSize="16" fontWeight="900">{i + 1}</text>
              {/* Label */}
              <foreignObject x={x - stepW / 2} y={y + 34} width={stepW} height="65">
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, lineHeight: "1.4", margin: 0, wordBreak: "break-word", padding: "0 4px" }}>
                  {stripMd(item).slice(0, 55)}
                </p>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Timeline Rail ── */
function TimelineRail({ items }: { items: string[] }) {
  const h = items.length * 80 + 40;
  return (
    <div className="my-6 flex justify-center">
      <svg viewBox={`0 0 500 ${h}`} width="100%" style={{ maxWidth: 500 }}>
        {/* Vertical line */}
        <path d={roughLine(60, 20, 60, h - 20, 2)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round"
          className="draw-line" style={{ strokeDasharray: h, strokeDashoffset: h }} />
        {items.map((item, i) => {
          const y = 40 + i * 80;
          const color = A[i % A.length];
          return (
            <g key={i} className="pop-in" style={{ animationDelay: `${i * 150}ms` }}>
              {/* Dot */}
              <path d={roughCircle(60, y, 8, 1)} fill={`${color}30`} stroke={color} strokeWidth="2"
                className="draw-line" style={{ strokeDasharray: 60, strokeDashoffset: 60, animationDelay: `${i * 120}ms` }} />
              <circle cx="60" cy={y} r="3" fill={color} className="pop-in" style={{ animationDelay: `${200 + i * 120}ms` }} />
              {/* Connector */}
              <path d={roughLine(72, y, 100, y, 1)} fill="none" stroke={`${color}50`} strokeWidth="1.5" strokeLinecap="round"
                className="draw-line" style={{ strokeDasharray: 30, strokeDashoffset: 30, animationDelay: `${i * 100}ms` }} />
              {/* Label */}
              <foreignObject x="106" y={y - 18} width="380" height="40">
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600, margin: 0 }}>
                  <span style={{ color, fontWeight: 800, marginRight: 8 }}>{i + 1}.</span>
                  {stripMd(item).slice(0, 60)}
                </p>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Layer Stack — stacked 3D-ish blocks ── */
function LayerStack({ items }: { items: string[] }) {
  const reversed = [...items].reverse();
  const boxW = 300, boxH = 44, gap = 6, pad = 30;
  const depth = 12;
  const h = reversed.length * (boxH + gap) + pad * 2 + depth;
  return (
    <div className="my-6 flex justify-center">
      <svg viewBox={`0 0 ${boxW + pad * 2 + depth} ${h}`} width={Math.min(boxW + pad * 2 + depth, 500)}>
        <text x={pad} y={16} fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="700" fontFamily="monospace">LAYER STACK ↑</text>
        {reversed.map((item, i) => {
          const x = pad, y = pad + 10 + i * (boxH + gap);
          const color = A[(reversed.length - 1 - i) % A.length];
          return (
            <g key={i} className="pop-in" style={{ animationDelay: `${(reversed.length - 1 - i) * 150}ms` }}>
              {/* 3D side */}
              <polygon points={`${x + boxW},${y} ${x + boxW + depth},${y - depth} ${x + boxW + depth},${y + boxH - depth} ${x + boxW},${y + boxH}`}
                fill={`${color}08`} stroke={`${color}30`} strokeWidth="1" />
              {/* 3D top */}
              <polygon points={`${x},${y} ${x + depth},${y - depth} ${x + boxW + depth},${y - depth} ${x + boxW},${y}`}
                fill={`${color}12`} stroke={`${color}30`} strokeWidth="1" />
              {/* Front face */}
              <path d={roughRect(x, y, boxW, boxH, 1.5)} fill={`${color}10`} stroke={color} strokeWidth="2" strokeLinecap="round"
                className="draw-line" style={{ strokeDasharray: perimRect(boxW, boxH) + 20, strokeDashoffset: perimRect(boxW, boxH) + 20, animationDelay: `${(reversed.length - 1 - i) * 130}ms` }} />
              <text x={x + boxW / 2} y={y + boxH / 2 + 5} textAnchor="middle" fill={color} fontSize="12" fontWeight="700">{stripMd(item).slice(0, 30)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Equation Board ── */
function EquationBoard({ text }: { text: string }) {
  return (
    <div className="flex justify-center my-6">
      <div className="relative rounded-2xl px-8 py-5 pop-in" style={{ background: `${C.card}`, border: `2px solid ${C.yellow}30` }}>
        <div className="absolute top-2 right-3 text-[10px] font-bold text-yellow-500/30">FORMULA</div>
        <p className="text-xl font-mono font-bold text-yellow-300 tracking-wide text-center" dangerouslySetInnerHTML={{ __html: fmtInline(text) }} />
        <svg className="mt-2" width="100%" height="4" viewBox="0 0 300 4" preserveAspectRatio="none">
          <path d={roughUnderline(0, 2, 300, 2)} fill="none" stroke={C.yellow} strokeWidth="1.5" opacity="0.3" strokeLinecap="round"
            className="draw-line" style={{ strokeDasharray: 310, strokeDashoffset: 310 }} />
        </svg>
      </div>
    </div>
  );
}

/* ── Flow Board ── */
function FlowBoard({ steps }: { steps: { label: string; kind: "start" | "decision" | "process" | "end" }[] }) {
  const pad = 40, boxH = 46, gap = 28;
  const svgH = steps.length * (boxH + gap) + pad * 2;
  const cx = 200;
  return (
    <div className="my-6 flex justify-center">
      <svg viewBox={`0 0 400 ${svgH}`} width={Math.min(400, 500)}>
        {steps.map((step, i) => {
          const y = pad + i * (boxH + gap) + boxH / 2;
          const col = step.kind === "decision" ? C.yellow : step.kind === "start" || step.kind === "end" ? C.green : C.blue;
          const w = 170;
          return (
            <g key={i}>
              {i > 0 && <path d={roughArrow(cx, pad + (i - 1) * (boxH + gap) + boxH, cx, y - boxH / 2 - 2, 2)} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"
                className="draw-line" style={{ strokeDasharray: 100, strokeDashoffset: 100, animationDelay: `${i * 120}ms` }} />}
              <g className="pop-in" style={{ animationDelay: `${i * 160}ms` }}>
                {step.kind === "decision"
                  ? <path d={`M${cx},${y - 22} L${cx + 70},${y} L${cx},${y + 22} L${cx - 70},${y} Z`} fill={`${col}10`} stroke={col} strokeWidth="2"
                      className="draw-line" style={{ strokeDasharray: 400, strokeDashoffset: 400, animationDelay: `${i * 130}ms` }} />
                  : step.kind === "start" || step.kind === "end"
                    ? <rect x={cx - w / 2} y={y - boxH / 2} width={w} height={boxH} rx={boxH / 2} fill={`${col}10`} stroke={col} strokeWidth="2"
                        className="draw-line" style={{ strokeDasharray: 600, strokeDashoffset: 600, animationDelay: `${i * 130}ms` }} />
                    : <path d={roughRect(cx - w / 2, y - boxH / 2, w, boxH, 1.5)} fill={`${col}10`} stroke={col} strokeWidth="2" strokeLinecap="round"
                        className="draw-line" style={{ strokeDasharray: 600, strokeDashoffset: 600, animationDelay: `${i * 130}ms` }} />
                }
                <text x={cx} y={y + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{step.label.slice(0, 24)}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Memory Boxes ── */
function MemoryBoxes({ data }: { data: DE[] }) {
  const boxW = 160, boxH = 85, gap = 16, pad = 24;
  const cols = Math.min(data.length, 4);
  const rows = Math.ceil(data.length / cols);
  const w = cols * (boxW + gap) - gap + pad * 2;
  const h = rows * (boxH + gap) - gap + pad * 2;
  return (
    <div className="my-6 flex justify-center overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w, 720)}>
        {data.map((v, i) => {
          const col = i % cols, row = Math.floor(i / cols);
          const x = pad + col * (boxW + gap), y = pad + row * (boxH + gap);
          const color = A[i % A.length];
          return (
            <g key={i} className="pop-in" style={{ animationDelay: `${i * 100}ms` }}>
              <path d={roughRect(x, y, boxW, boxH, 2)} fill={C.card} stroke={color} strokeWidth="2" strokeLinecap="round"
                className="draw-line" style={{ strokeDasharray: perimRect(boxW, boxH) + 20, strokeDashoffset: perimRect(boxW, boxH) + 20, animationDelay: `${i * 80}ms` }} />
              {/* Header stripe */}
              <rect x={x + 1} y={y + 1} width={boxW - 2} height="20" rx="0" fill={`${color}15`} />
              <text x={x + boxW / 2} y={y + 14} textAnchor="middle" fill={color} fontSize={10} fontWeight={800} fontFamily="monospace">{v.name || "?"}</text>
              <text x={x + boxW / 2} y={y + 52} textAnchor="middle" fill="white" fontSize={17} fontWeight={800} fontFamily="monospace">{v.value || ""}</text>
              <text x={x + boxW / 2} y={y + 74} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace">{v.type || ""}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Stack Tower ── */
function StackTower({ data }: { data: DE[] }) {
  const boxW = 340, boxH = 42, gap = 5, pad = 26;
  const h = data.length * (boxH + gap) + pad * 2 + 16;
  return (
    <div className="my-6 flex justify-center">
      <svg viewBox={`0 0 ${boxW + pad * 2} ${h}`} width={Math.min(boxW + pad * 2, 480)}>
        <text x={pad} y={14} fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="700" fontFamily="monospace">CALL STACK ↓</text>
        {data.map((frame, i) => {
          const y = pad + 6 + i * (boxH + gap);
          const indent = i * 8;
          const color = A[i % A.length];
          const w = boxW - indent * 2;
          return (
            <g key={i} className="pop-in" style={{ animationDelay: `${i * 120}ms` }}>
              <path d={roughRect(pad + indent, y, w, boxH, 1.5)} fill={`${color}08`} stroke={`${color}50`} strokeWidth="1.5" strokeLinecap="round"
                className="draw-line" style={{ strokeDasharray: perimRect(w, boxH) + 10, strokeDashoffset: perimRect(w, boxH) + 10, animationDelay: `${i * 100}ms` }} />
              <text x={pad + indent + 14} y={y + 26} fill={color} fontSize={12} fontWeight={600} fontFamily="monospace">{frame.label || frame.name || ""}</text>
              {frame.result && <text x={pad + boxW - indent - 14} y={y + 26} textAnchor="end" fill={C.green} fontSize={12} fontWeight={700} fontFamily="monospace">→ {frame.result}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Compare Columns ── */
function CompareColumns({ data }: { data: { headers: string[]; rows: string[][] } }) {
  return (
    <div className="my-6 grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(data.headers.length, 4)}, 1fr)` }}>
      {data.headers.map((h, ci) => {
        const color = A[ci % A.length];
        return (
          <div key={ci} className="rounded-2xl overflow-hidden pop-in" style={{ border: `2px solid ${color}25`, animationDelay: `${ci * 150}ms` }}>
            <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ background: `${color}12`, color }}>{h}</div>
            <div className="px-4 py-3 space-y-2.5" style={{ background: C.card }}>
              {data.rows.map((row, ri) => (
                <p key={ri} className="text-[13px] text-white/65 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtInline(row[ci] || "") }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Code Board ── */
function CodeBoard({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-6 rounded-2xl overflow-hidden pop-in" style={{ background: "#0a0e14", border: `1px solid ${C.orange}15` }}>
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,87,52,0.04)" }}>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f56" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#ffbd2e" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#27ca40" }} />
          <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-white/15">{lang}</span>
        </div>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-[10px] font-medium text-white/25 hover:text-white transition">{copied ? "✓ Copied" : "Copy"}</button>
      </div>
      <pre className="p-5 overflow-x-auto text-[13px] leading-[1.8] font-mono"><code dangerouslySetInnerHTML={{ __html: hlCode(code, lang) }} /></pre>
    </div>
  );
}

/* ── Bullet Board ── */
function BulletBoard({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 my-4 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 pop-in" style={{ animationDelay: `${i * 80}ms` }}>
          <svg className="shrink-0 mt-1.5" width="16" height="16" viewBox="0 0 16 16">
            <path d={roughCircle(8, 8, 5, 1)} fill="none" stroke={A[i % A.length]} strokeWidth="2" strokeLinecap="round"
              className="draw-line" style={{ strokeDasharray: 35, strokeDashoffset: 35, animationDelay: `${i * 60}ms` }} />
            <circle cx="8" cy="8" r="2.5" fill={A[i % A.length]} className="pop-in" style={{ animationDelay: `${100 + i * 60}ms` }} />
          </svg>
          <span className="text-[15px] text-white/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtInline(item) }} />
        </li>
      ))}
    </ul>
  );
}

/* ── Speaker Icon ── */
function SpeakerIcon() {
  return <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.473 8.473 0 0014 8a8.473 8.473 0 00-2.464-6.01l-.707.707A7.476 7.476 0 0113 8a7.476 7.476 0 01-2.172 5.303l.708.707z" /><path d="M6.707.293A1 1 0 005.293.293L2.586 3H1a1 1 0 00-1 1v8a1 1 0 001 1h1.586l2.707 2.707A1 1 0 007 15V1a1 1 0 00-.293-.707z" /></svg>;
}

/* ═══════ GLOBAL STYLES ═══════ */
function BoardStyles() {
  return (
    <style>{`
      @keyframes boardReveal {
        0% { opacity: 0; transform: translateY(28px) scale(0.95); filter: blur(8px); }
        100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      }
      .draw-line {
        animation: drawStroke 0.9s ease-out forwards;
      }
      @keyframes drawStroke {
        to { stroke-dashoffset: 0; }
      }
      .pop-in {
        opacity: 0;
        animation: popBounce 0.6s cubic-bezier(.16,1,.3,1) forwards;
      }
      @keyframes popBounce {
        0% { opacity: 0; transform: scale(0.5); }
        60% { transform: scale(1.08); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes chalkDrift {
        0% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
        50% { opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
      }
      @keyframes wiggle {
        0%, 100% { transform: rotate(-6deg); }
        50% { transform: rotate(6deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    `}</style>
  );
}

/* ═══════ PARSER ═══════ */
type DE = { name?: string; value?: string; type?: string; label?: string; result?: string };
type Section = {
  type: "heading" | "subheading" | "text" | "code" | "blockquote" | "table" | "list" | "olist" | "hr" | "diagram" | "callstack" | "conceptMap" | "processSteps" | "flowchart" | "comparison" | "timeline" | "layers" | "equation";
  text: string; lang?: string; items?: string[]; diagramData?: DE[]; mapNodes?: string[];
  flowSteps?: { label: string; kind: "start" | "decision" | "process" | "end" }[];
  tableData?: { headers: string[]; rows: string[][] };
};

function parseContent(md: string): Section[] {
  const sections: Section[] = [];
  const lines = md.split("\n");
  let i = 0;
  const boldTerms: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const cl: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { cl.push(lines[i]); i++; }
      i++;
      const code = cl.join("\n");
      sections.push({ type: "code", text: code, lang });
      const vars = extractVars(code);
      if (vars.length > 0) sections.push({ type: "diagram", text: "", diagramData: vars });
      const stack = extractStack(code);
      if (stack.length > 0) sections.push({ type: "callstack", text: "", diagramData: stack });
      const flow = extractFlow(code);
      if (flow.length > 2) sections.push({ type: "flowchart", text: "", flowSteps: flow });
      continue;
    }

    // Heading
    if (/^## /.test(line)) {
      const t = line.replace(/^## /, "").replace(/[*_`]/g, "");
      sections.push({ type: "heading", text: t }); boldTerms.push(t); i++; continue;
    }
    if (/^### /.test(line)) {
      const t = line.replace(/^### /, "").replace(/[*_`]/g, "");
      sections.push({ type: "subheading", text: t }); boldTerms.push(t); i++; continue;
    }

    // HR
    if (/^[-*_]{3,}\s*$/.test(line)) { sections.push({ type: "hr", text: "" }); i++; continue; }

    // Table → comparison or layers
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tl: string[] = [];
      while (i < lines.length && lines[i].includes("|")) { tl.push(lines[i]); i++; }
      const parsed = parseTable(tl.join("\n"));
      if (parsed) sections.push({ type: "comparison", text: "", tableData: parsed });
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const bq: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { bq.push(lines[i].replace(/^>\s*/, "")); i++; }
      const text = bq.join(" ");
      // Detect equations: lines with = or → and short
      if (/[=→×÷+\-*/^]/.test(text) && text.length < 80) {
        sections.push({ type: "equation", text });
      } else {
        sections.push({ type: "blockquote", text });
      }
      continue;
    }

    // Ordered list → detect type
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s*/, "")); i++; }
      // Long items → timeline, short → step circles
      const avgLen = items.reduce((a, b) => a + b.length, 0) / items.length;
      if (avgLen > 40 && items.length <= 8) {
        sections.push({ type: "timeline", text: "", items });
      } else {
        sections.push({ type: "processSteps", text: "", items });
      }
      continue;
    }

    // Unordered list → detect layers
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s*/, "")); i++; }
      // Detect layer-like lists (stack, architecture, hierarchy keywords)
      const isLayers = items.some(it => /layer|level|tier|stack|stage|phase|step|component|module|service/i.test(it)) && items.length >= 3;
      if (isLayers) {
        sections.push({ type: "layers", text: "", items });
      } else {
        sections.push({ type: "list", text: "", items });
      }
      continue;
    }

    // Collect bold terms
    const bm = line.match(/\*\*([^*]+)\*\*/g);
    if (bm) bm.forEach(m => boldTerms.push(m.replace(/\*\*/g, "")));

    if (line.trim()) sections.push({ type: "text", text: line });
    i++;
  }

  // Auto concept map
  const unique = [...new Set(boldTerms)].slice(0, 8);
  if (unique.length >= 3) {
    const idx = sections.findIndex(s => s.type === "heading");
    sections.splice(idx >= 0 ? idx + 1 : 0, 0, { type: "conceptMap", text: "", mapNodes: unique });
  }

  return sections;
}

/* ── Extractors ── */
function extractVars(code: string): DE[] {
  const vars: DE[] = [];
  const re = /^(\w+)\s*=\s*(.+?)(?:\s*#.*)?$/gm;
  let m;
  while ((m = re.exec(code)) !== null) {
    const n = m[1], v = m[2].trim();
    if (["def", "class", "import", "from", "for", "while", "if", "return", "elif", "else"].includes(n)) continue;
    let t = "expr";
    if (/^["']/.test(v)) t = "str"; else if (/^(True|False)$/i.test(v)) t = "bool";
    else if (/^\d+$/.test(v)) t = "int"; else if (/^\d+\.\d+$/.test(v)) t = "float";
    else if (/^\[/.test(v)) t = "list"; else if (/^\{/.test(v)) t = "dict";
    vars.push({ name: n, value: v.slice(0, 18), type: t });
  }
  return vars.slice(0, 8);
}

function extractStack(code: string): DE[] {
  const frames: DE[] = [];
  const re = /^#\s*([\w()\s*×+\-=,]+(?:→|->|=|returns)\s*.+)$/gm;
  let m;
  while ((m = re.exec(code)) !== null) {
    const parts = m[1].trim().split(/→|->|returns/);
    frames.push({ label: parts[0].trim(), result: parts[1]?.trim() });
  }
  return frames.slice(0, 10);
}

function extractFlow(code: string): { label: string; kind: "start" | "decision" | "process" | "end" }[] {
  const steps: { label: string; kind: "start" | "decision" | "process" | "end" }[] = [];
  const lines = code.split("\n").map(l => l.trim()).filter(Boolean);
  let hasFlow = false;
  for (const l of lines) {
    if (/^(def |function |class )/.test(l)) { steps.push({ label: l.replace(/[{(:].*/,"").trim(), kind: "start" }); hasFlow = true; }
    else if (/^(if |elif |else if )/.test(l)) { steps.push({ label: l.replace(/[{:].*/,"").trim(), kind: "decision" }); hasFlow = true; }
    else if (/^else/.test(l)) { steps.push({ label: "else", kind: "decision" }); }
    else if (/^(for |while )/.test(l)) { steps.push({ label: l.replace(/[{:].*/,"").trim(), kind: "decision" }); hasFlow = true; }
    else if (/^return /.test(l)) { steps.push({ label: l.trim(), kind: "end" }); }
    else if (hasFlow && /^\w/.test(l) && !/^[#/]/.test(l) && l.length > 3) { steps.push({ label: l.slice(0, 28), kind: "process" }); }
  }
  return steps.slice(0, 10);
}

function parseTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split("\n").filter(r => !/^[|\s:-]+$/.test(r) || r.includes("---"));
  const data = lines.filter(r => !/^\|[\s:-]+\|$/.test(r));
  if (data.length < 1) return null;
  const headers = data[0].split("|").map(c => c.trim()).filter(Boolean);
  const rows = data.slice(1).map(r => r.split("|").map(c => c.trim()).filter(Boolean));
  return { headers, rows };
}

/* ── Helpers ── */
function fmtInline(t: string): string {
  return t.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="text-white/50 italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-cn-orange/10 text-orange-300 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>');
}
function stripMd(t: string): string { return t.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1"); }

function hlCode(code: string, lang: string): string {
  let r = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (lang === "python" || lang === "bash") r = r.replace(/(#.*)$/gm, '<span style="color:rgba(255,255,255,0.25);font-style:italic">$1</span>');
  else r = r.replace(/(\/\/.*)$/gm, '<span style="color:rgba(255,255,255,0.25);font-style:italic">$1</span>');
  r = r.replace(/(f?"[^"]*"|'[^']*')/g, '<span style="color:#c3e88d">$1</span>');
  const kw = lang === "python" ? "def|class|if|elif|else|for|while|return|import|from|in|not|and|or|True|False|None|try|except|with|as|break|continue|pass|raise|yield"
    : "function|const|let|var|if|else|for|while|return|import|from|export|class|new|this|async|await|try|catch|throw";
  r = r.replace(new RegExp(`\\b(${kw})\\b`, "g"), '<span style="color:#c792ea">$1</span>');
  r = r.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');
  r = r.replace(/\b([a-zA-Z_]\w*)\(/g, '<span style="color:#82aaff">$1</span>(');
  return r;
}
