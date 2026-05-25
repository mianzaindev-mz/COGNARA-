/**
 * Shared voice utilities for COGNARA's speech recognition and synthesis.
 * Centralizes voice selection, Urdu detection, and markdown stripping
 * to eliminate code duplication across VoiceButton, AgentMessage, and AgentPanel.
 */

export type VoiceLang = "en" | "ur";

/* ─── Voice Configuration ─── */

/** TTS tuning per language — softer, more natural-sounding settings */
export const VOICE_CONFIG = {
  en: { rate: 0.92, pitch: 1.04, volume: 1.0 },
  ur: { rate: 0.88, pitch: 1.06, volume: 1.0 },
} as const;

/* ─── Urdu Detection ─── */

/**
 * Detects whether text is Urdu (Nastaliq script or Roman Urdu keywords).
 * Used to auto-switch language mode when voice input is detected as Urdu.
 */
export function looksLikeUrdu(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /[\u0600-\u06FF]/.test(text) ||
    /\b(kya|hai|hain|mujhe|samjhao|batao|kaise|kyun|nahi|acha|mera|meri|karna|haan|theek|shukriya|matlab|seekhna|padhna|likhna|samajh)\b/.test(lower)
  );
}

/* ─── Markdown Stripping for TTS ─── */

/**
 * Strips markdown formatting from agent responses for clean TTS output.
 * Converts code blocks to verbal placeholders, removes tables/headers/formatting.
 */
export function stripMarkdownForSpeech(text: string, maxLen = 1500): string {
  return text
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
    .slice(0, maxLen);
}

/* ─── Voice Selection ─── */

/**
 * Picks the best available voice for the given language.
 * Prioritizes softer, natural-sounding voices (female neural voices first,
 * then smooth male voices) for a more pleasant listening experience.
 *
 * Voice priority for English:
 *   1. Microsoft Jenny / Aria (natural, soft female — Windows 11)
 *   2. Google UK English Female (clear, warm)
 *   3. Microsoft Zira (classic smooth female — Windows 10+)
 *   4. Google US English (neutral, clear)
 *   5. Microsoft David (smooth male — Windows)
 *   6. Any en-US voice
 *
 * Voice priority for Urdu:
 *   1. Any native ur-PK voice (rare but best if available)
 *   2. Microsoft Asad / Uzma (Windows Urdu voices)
 *   3. Hindi voices (phonetically close)
 *   4. Microsoft Heera (Hindi female)
 *   5. en-IN fallback (Indian English, closer accent)
 *   6. Any en-US voice
 */
export function pickSoftVoice(
  voices: SpeechSynthesisVoice[],
  lang: VoiceLang,
): SpeechSynthesisVoice | undefined {
  if (lang === "ur") {
    return (
      // Native Urdu voices (rare but ideal)
      voices.find(v => v.lang.toLowerCase().startsWith("ur")) ||
      voices.find(v => v.name.toLowerCase().includes("urdu")) ||
      // Windows Urdu voices
      voices.find(v => v.name.includes("Microsoft Uzma")) ||
      voices.find(v => v.name.includes("Microsoft Asad")) ||
      // Hindi voices (phonetically close to Urdu)
      voices.find(v => v.name.includes("Microsoft Swara")) ||
      voices.find(v => v.name.includes("Microsoft Heera")) ||
      voices.find(v => v.name.includes("Google हिन्दी")) ||
      voices.find(v => v.lang.toLowerCase().startsWith("hi")) ||
      // Indian English (closest accent)
      voices.find(v => v.lang.toLowerCase().startsWith("en-in")) ||
      // Final fallback
      voices.find(v => v.lang === "en-US")
    );
  }

  // English — prioritize soft, natural-sounding voices
  return (
    // Neural/natural female voices (softest, most pleasant)
    voices.find(v => v.name.includes("Microsoft Jenny")) ||
    voices.find(v => v.name.includes("Microsoft Aria")) ||
    voices.find(v => v.name.includes("Google UK English Female")) ||
    voices.find(v => v.name.includes("Microsoft Zira")) ||
    // Natural male voices (smooth, not harsh)
    voices.find(v => v.name.includes("Google US English")) ||
    voices.find(v => v.name.includes("Microsoft David")) ||
    voices.find(v => v.name.includes("Google UK English Male")) ||
    voices.find(v => v.name.includes("Alex")) ||
    voices.find(v => v.name.includes("Samantha")) ||
    voices.find(v => v.name.includes("Daniel")) ||
    // Any English voice
    voices.find(v => v.lang === "en-US") ||
    voices.find(v => v.lang.startsWith("en"))
  );
}

/**
 * Creates a configured SpeechSynthesisUtterance with the correct language,
 * voice, rate, pitch, and volume for the given language.
 */
export function createUtterance(
  text: string,
  lang: VoiceLang,
  voices?: SpeechSynthesisVoice[],
): SpeechSynthesisUtterance {
  const config = VOICE_CONFIG[lang];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "ur" ? "ur-PK" : "en-US";
  utterance.rate = config.rate;
  utterance.pitch = config.pitch;
  utterance.volume = config.volume;

  if (voices && voices.length > 0) {
    const voice = pickSoftVoice(voices, lang);
    if (voice) utterance.voice = voice;
  }

  return utterance;
}

/**
 * Speaks text aloud with the best available voice for the language.
 * Handles the async voice-loading quirk in Chrome.
 * Returns a cleanup function to cancel speech.
 */
export function speakText(
  text: string,
  lang: VoiceLang,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  },
): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    callbacks?.onError?.();
    return () => {};
  }

  window.speechSynthesis.cancel();

  const clean = stripMarkdownForSpeech(text);
  const spokenLang: VoiceLang = lang === "ur" || looksLikeUrdu(clean) ? "ur" : "en";

  const doSpeak = (voices: SpeechSynthesisVoice[]) => {
    const utterance = createUtterance(clean, spokenLang, voices);
    utterance.onstart = () => callbacks?.onStart?.();
    utterance.onend = () => callbacks?.onEnd?.();
    utterance.onerror = () => callbacks?.onError?.();
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      doSpeak(window.speechSynthesis.getVoices());
      window.speechSynthesis.onvoiceschanged = null;
    };
  } else {
    doSpeak(voices);
  }

  return () => window.speechSynthesis.cancel();
}
