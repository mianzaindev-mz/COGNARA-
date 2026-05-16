"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceButtonProps {
  /** Called with transcribed text when user finishes speaking */
  onTranscript: (text: string) => void;
  /** Text for the agent to speak aloud */
  speakText?: string | null;
  disabled?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Voice input/output button using native Web Speech API.
 * - Speech-to-text: webkitSpeechRecognition / SpeechRecognition
 * - Text-to-speech: speechSynthesis
 * No external APIs or keys needed.
 */
export function VoiceButton({ onTranscript, speakText, disabled }: VoiceButtonProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const latestTranscript = useRef("");

  // Keep latest transcript in sync for the onend callback
  useEffect(() => {
    latestTranscript.current = transcript;
  }, [transcript]);

  // Check browser support
  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // Speak text when it changes
  useEffect(() => {
    if (!speakText || typeof window === "undefined") return;
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Alex"),
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [speakText]);

  const startListening = useCallback(() => {
    if (state !== "idle" || disabled) return;

    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    window.speechSynthesis?.cancel();

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
      setTranscript("");
      latestTranscript.current = "";
    };

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      const text = finalText || interimText;
      setTranscript(text);
      latestTranscript.current = text;
    };

    recognition.onend = () => {
      setState("processing");
      const final = latestTranscript.current.trim();
      if (final) {
        onTranscript(final);
      }
      setTimeout(() => setState("idle"), 500);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state, disabled, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState("idle");
  }, []);

  const handleClick = useCallback(() => {
    switch (state) {
      case "idle":
        startListening();
        break;
      case "listening":
        stopListening();
        break;
      case "speaking":
        stopSpeaking();
        break;
    }
  }, [state, startListening, stopListening, stopSpeaking]);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-cn-border text-cn-ink-subtle opacity-40"
        title="Voice not supported in this browser"
      >
        <MicOffIcon className="h-4 w-4" />
      </button>
    );
  }

  const stateConfig = {
    idle: {
      className: "border border-cn-border text-cn-ink-muted hover:bg-cn-border/30 hover:text-cn-ink",
      title: "Click to speak (Voice Mode)",
      icon: <MicIcon className="h-4 w-4" />,
    },
    listening: {
      className: "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse",
      title: "Listening… Click to stop",
      icon: <MicIcon className="h-4 w-4" />,
    },
    processing: {
      className: "bg-cn-orange text-white",
      title: "Processing…",
      icon: <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />,
    },
    speaking: {
      className: "bg-cn-lavender text-white shadow-lg shadow-cn-lavender/40",
      title: "Speaking… Click to stop",
      icon: <SpeakerIcon className="h-4 w-4" />,
    },
  };

  const config = stateConfig[state];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === "processing"}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${config.className} disabled:opacity-40`}
        title={config.title}
      >
        {config.icon}
      </button>

      {/* Live transcript overlay */}
      {state === "listening" && transcript && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-stone-800 dark:bg-stone-900 px-3 py-1.5 text-xs text-white shadow-lg">
          {transcript}
          <span className="animate-pulse">▋</span>
        </div>
      )}
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5M12 18.75a6 6 0 01-6-6v-1.5M12 18.75v3.75m-3.75 0h7.5M3 3l18 18M12 15.75a3 3 0 01-3-3V4.5" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}
