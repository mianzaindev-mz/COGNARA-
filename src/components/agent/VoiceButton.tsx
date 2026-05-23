"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";

type VoiceState = "idle" | "listening" | "processing" | "speaking";
type VoiceLang = "en" | "ur";

interface VoiceButtonProps {
  /** Called with transcribed text when user finishes speaking */
  onTranscript: (text: string) => void;
  /** Text for the agent to speak aloud */
  speakText?: string | null;
  disabled?: boolean;
  onLanguageChange?: (lang: VoiceLang) => void;
}

/**
 * Voice input/output button using native Web Speech API.
 * Supports English (en-US) and Urdu (ur-PK) speech recognition and synthesis.
 */
export function VoiceButton({ onTranscript, speakText, disabled, onLanguageChange }: VoiceButtonProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState<VoiceLang>("en");
  const recognitionRef = useRef<any>(null);
  const latestTranscript = useRef("");
  const { notify } = useToast();

  useEffect(() => {
    latestTranscript.current = transcript;
  }, [transcript]);

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

    // Strip markdown for clean speech
    const clean = speakText
      .replace(/```[\s\S]*?```/g, " code example omitted for brevity ")
      .replace(/\|[^\n]+\|/g, "")                    // Remove table rows
      .replace(/---+/g, "")                           // Remove horizontal rules
      .replace(/#{1,6}\s*/g, "")                      // Remove header markers
      .replace(/\*\*([^*]+)\*\*/g, "$1")              // Bold → plain
      .replace(/\*([^*]+)\*/g, "$1")                  // Italic → plain
      .replace(/[`~>\[\]|]/g, "")                     // Remove formatting chars
      .replace(/\n+/g, ". ")                          // Newlines → pauses
      .replace(/\s{2,}/g, " ")                        // Collapse whitespace
      .trim()
      .slice(0, 1200);

    const spokenLang: VoiceLang = lang === "ur" || looksLikeUrdu(clean) ? "ur" : "en";
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = spokenLang === "ur" ? "ur-PK" : "en-US";
    utterance.rate = spokenLang === "ur" ? 0.86 : 0.9;
    utterance.pitch = spokenLang === "ur" ? 1.02 : 0.96;
    utterance.volume = 1.0;

    // Select best available MALE voice
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const voice = pickBestVoice(voices, spokenLang);
      if (voice) utterance.voice = voice;
    };

    // Voices may not be loaded yet — try immediately, then on voiceschanged
    pickVoice();
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        pickVoice();
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [speakText, lang]);

  const startListening = useCallback(() => {
    if (state !== "idle" || disabled) return;

    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    window.speechSynthesis?.cancel();

    const recognition = new SR();
    // ur-PK is not supported by most browsers' SpeechRecognition.
    // Use hi-IN (Hindi) as the recognition language for Urdu — phonetically close
    // and widely supported by Chrome/Edge. TTS output still uses ur-PK.
    recognition.lang = lang === "ur" ? "hi-IN" : "en-US";
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
        if (looksLikeUrdu(final)) {
          setLang("ur");
          onLanguageChange?.("ur");
        } else {
          onLanguageChange?.(lang);
        }
        onTranscript(final);
      }
      setTimeout(() => setState("idle"), 500);
    };

    recognition.onerror = (event: any) => {
      const errorCode = event.error as string;
      setState("idle");

      switch (errorCode) {
        case "not-allowed":
          notify({
            tone: "error",
            title: "Microphone blocked",
            description: "Allow microphone access in your browser settings, then try again.",
          });
          break;
        case "no-speech":
          notify({
            tone: "info",
            title: "No speech detected",
            description: "Tap the mic and speak clearly.",
          });
          break;
        case "network":
          notify({
            tone: "error",
            title: "Network error",
            description: "Speech recognition requires an internet connection.",
          });
          break;
        case "language-not-supported":
          notify({
            tone: "warning",
            title: "Language not supported",
            description: `Your browser doesn't support ${lang === "ur" ? "Urdu/Hindi" : "English"} speech recognition. Switching to English.`,
          });
          setLang("en");
          break;
        default:
          notify({
            tone: "error",
            title: "Voice error",
            description: `Speech recognition failed: ${errorCode}`,
          });
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // Handle the case where recognition.start() throws (e.g. already started)
      setState("idle");
      notify({
        tone: "error",
        title: "Voice error",
        description: "Could not start speech recognition. Please try again.",
      });
    }
  }, [state, disabled, onTranscript, lang, onLanguageChange, notify]);

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
      title: `Click to speak (${lang === "ur" ? "Urdu" : "English"})`,
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
    <div className="relative flex items-center gap-1">
      {/* Language toggle */}
      <button
        type="button"
        onClick={() => setLang(l => {
          const next = l === "en" ? "ur" : "en";
          onLanguageChange?.(next);
          return next;
        })}
        className="flex h-10 items-center rounded-xl border border-cn-border px-2 text-[11px] font-bold text-cn-ink-subtle transition hover:bg-cn-border/30 hover:text-cn-ink"
        title={`Switch to ${lang === "en" ? "Urdu" : "English"} voice`}
      >
        {lang === "en" ? "EN" : "UR"}
      </button>

      {/* Main voice button */}
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

function looksLikeUrdu(text: string) {
  const lower = text.toLowerCase();
  return /[\u0600-\u06FF]/.test(text) || /\b(kya|hai|hain|mujhe|samjhao|batao|kaise|kyun|nahi|acha|mera|meri|karna)\b/.test(lower);
}

function pickBestVoice(voices: SpeechSynthesisVoice[], lang: VoiceLang) {
  if (lang === "ur") {
    return (
      voices.find(v => v.lang.toLowerCase().startsWith("ur")) ||
      voices.find(v => v.name.toLowerCase().includes("urdu")) ||
      voices.find(v => v.lang.toLowerCase().includes("hi")) ||
      voices.find(v => v.lang.toLowerCase().startsWith("en-in")) ||
      voices.find(v => v.name.includes("Microsoft Heera")) ||
      voices.find(v => v.name.includes("Google हिन्दी")) ||
      voices.find(v => v.lang === "en-US")
    );
  }

  return (
    voices.find(v => v.name.includes("Microsoft Guy")) ||
    voices.find(v => v.name.includes("Microsoft Mark")) ||
    voices.find(v => v.name.includes("Google US English")) ||
    voices.find(v => v.name.includes("Google UK English Male")) ||
    voices.find(v => v.name.includes("Alex")) ||
    voices.find(v => v.name.includes("Daniel")) ||
    voices.find(v => v.lang === "en-US") ||
    voices.find(v => v.lang.startsWith("en"))
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
