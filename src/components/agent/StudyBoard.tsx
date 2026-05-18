"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

type StudyStep = {
  title: string;
  content: string;
  type: "text" | "code" | "diagram" | "formula";
};

type Props = {
  content: string;
  onClose: () => void;
  lang: "en" | "ur";
};

/**
 * StudyBoard — An interactive whiteboard-style teaching view.
 * Parses AI response into steps, shows them one-by-one on a dark board
 * with TTS narration, like a real teacher on a blackboard.
 */
export function StudyBoard({ content, onClose, lang }: Props) {
  const [steps, setSteps] = useState<StudyStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const animFrameRef = useRef<number>(0);
  const charSpeed = 25; // ms per character

  // Parse content into steps
  useEffect(() => {
    const parsed = parseSteps(content);
    setSteps(parsed);
    setCurrentStep(0);
    setRevealedChars(0);
  }, [content]);

  const currentStepData = steps[currentStep];
  const totalChars = currentStepData?.content.length ?? 0;
  const isFullyRevealed = revealedChars >= totalChars;

  // Typewriter animation
  useEffect(() => {
    if (!isPlaying || isFullyRevealed) return;

    const timer = setInterval(() => {
      setRevealedChars(prev => {
        if (prev >= totalChars) {
          clearInterval(timer);
          return totalChars;
        }
        return prev + 1;
      });
    }, charSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, isFullyRevealed, totalChars]);

  // Speak current step
  const speakStep = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/[#*`_~>\[\]|]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === "ur" ? "ur-PK" : "en-US";
    utterance.rate = lang === "ur" ? 0.85 : 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (lang === "ur") {
      const v = voices.find(v => v.lang.startsWith("ur"));
      if (v) utterance.voice = v;
    } else {
      const v = voices.find(v => v.name.includes("Google") || v.name.includes("Microsoft"));
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [lang]);

  // Auto-play: reveal + speak
  const playStep = useCallback(() => {
    setIsPlaying(true);
    setRevealedChars(0);
    if (currentStepData) {
      speakStep(currentStepData.content);
    }
  }, [currentStepData, speakStep]);

  const stopPlaying = useCallback(() => {
    setIsPlaying(false);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const goNext = useCallback(() => {
    stopPlaying();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setRevealedChars(0);
    }
  }, [currentStep, steps.length, stopPlaying]);

  const goPrev = useCallback(() => {
    stopPlaying();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setRevealedChars(0);
    }
  }, [currentStep, stopPlaying]);

  const revealAll = () => setRevealedChars(totalChars);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        if (isPlaying) stopPlaying();
        else playStep();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose, isPlaying, playStep, stopPlaying]);

  if (steps.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink text-sm font-bold text-white">
            C
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">COGNARA Study Board</h2>
            <p className="text-[11px] text-white/40">
              Step {currentStep + 1} of {steps.length}
              {currentStepData && <span className="ml-2 text-cn-yellow">— {currentStepData.title}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/50">
            {lang === "ur" ? "اردو" : "EN"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-8 py-6">
        <div className="relative w-full max-w-4xl">
          {/* Chalkboard frame */}
          <div className="rounded-2xl border-4 border-amber-900/40 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-8 shadow-2xl shadow-black/50">
            {/* Chalk dust effect — top */}
            <div className="absolute inset-x-4 top-2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Step title */}
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cn-orange/20 text-xs font-bold text-cn-orange">
                {currentStep + 1}
              </span>
              <h3 className="text-xl font-bold text-cn-yellow tracking-wide font-mono">
                {currentStepData?.title}
              </h3>
              {isSpeaking && (
                <span className="flex items-center gap-1.5 rounded-full bg-cn-lavender/20 px-2.5 py-0.5 text-[10px] font-medium text-cn-lavender">
                  <span className="h-1.5 w-1.5 rounded-full bg-cn-lavender animate-pulse" />
                  Speaking
                </span>
              )}
            </div>

            {/* Content area */}
            <div className="min-h-[300px] font-mono text-base leading-loose">
              {currentStepData?.type === "code" ? (
                <pre className="overflow-x-auto rounded-xl bg-black/30 p-5 text-[14px] leading-relaxed">
                  <code className="text-emerald-400">
                    {currentStepData.content.slice(0, revealedChars)}
                    {!isFullyRevealed && <span className="animate-pulse text-cn-orange">▌</span>}
                  </code>
                </pre>
              ) : (
                <div className="text-white/90 whitespace-pre-wrap">
                  {currentStepData?.content.slice(0, revealedChars)}
                  {!isFullyRevealed && <span className="animate-pulse text-cn-orange">▌</span>}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cn-orange to-cn-yellow transition-all duration-300"
                style={{ width: `${totalChars > 0 ? (revealedChars / totalChars) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Step navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-sm font-medium text-white/70 transition hover:bg-white/20 hover:text-white disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={currentStep >= steps.length - 1}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-sm font-medium text-white/70 transition hover:bg-white/20 hover:text-white disabled:opacity-30"
            >
              Next →
            </button>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { stopPlaying(); setCurrentStep(idx); setRevealedChars(0); }}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  idx === currentStep ? "bg-cn-orange scale-125" : idx < currentStep ? "bg-cn-orange/40" : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Play controls */}
          <div className="flex items-center gap-2">
            {!isFullyRevealed && (
              <button
                type="button"
                onClick={revealAll}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-4 text-sm font-medium text-white/70 transition hover:bg-white/20"
              >
                Skip ⏭
              </button>
            )}
            <button
              type="button"
              onClick={isPlaying ? stopPlaying : playStep}
              className={`flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-bold transition ${
                isPlaying
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-cn-orange text-white hover:bg-cn-orange-hover shadow-lg shadow-cn-orange/30"
              }`}
            >
              {isPlaying ? "⏹ Stop" : "▶ Teach Me"}
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="mx-auto mt-2 flex max-w-4xl justify-center gap-4 text-[10px] text-white/25">
          <span>Space — Play/Pause</span>
          <span>← → — Navigate steps</span>
          <span>Esc — Close board</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Step Parser ─── */

function parseSteps(text: string): StudyStep[] {
  const sections: StudyStep[] = [];
  const lines = text.split("\n");
  let currentTitle = "Introduction";
  let currentContent: string[] = [];
  let currentType: StudyStep["type"] = "text";

  const flush = () => {
    const content = currentContent.join("\n").trim();
    if (content) {
      sections.push({ title: currentTitle, content, type: currentType });
    }
    currentContent = [];
    currentType = "text";
  };

  for (const line of lines) {
    // Heading → new step
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flush();
      currentTitle = headingMatch[1].replace(/[*_`]/g, "");
      continue;
    }

    // Code block start
    if (line.startsWith("```")) {
      if (currentType === "code") {
        // End of code block
        flush();
        currentType = "text";
      } else {
        flush();
        currentType = "code";
        currentTitle = currentTitle || "Code Example";
      }
      continue;
    }

    // Horizontal rule → step break
    if (/^[-*_]{3,}\s*$/.test(line)) {
      flush();
      continue;
    }

    currentContent.push(line);
  }

  flush();

  // If only 1 big step, try to split by paragraphs
  if (sections.length === 1 && sections[0].content.length > 400) {
    const paras = sections[0].content.split(/\n\n+/);
    if (paras.length > 1) {
      return paras.map((p, i) => ({
        title: i === 0 ? sections[0].title : `Part ${i + 1}`,
        content: p.trim(),
        type: "text" as const,
      }));
    }
  }

  return sections.length > 0 ? sections : [{ title: "Lesson", content: text, type: "text" }];
}
