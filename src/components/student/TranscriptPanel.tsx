// src/components/student/TranscriptPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils/cn";

type Segment = {
  start_secs: number;
  end_secs: number;
  text: string;
  is_final: boolean;
};

type Transcript = {
  id: string;
  lesson_id: string;
  transcript_text: string;
  transcript_segments: Segment[];
  source: string;
  word_count: number;
  duration_secs: number;
};

type TranscriptPanelProps = {
  lessonId: string;
  lessonTitle: string;
  videoPlayer: {
    getCurrentTime: () => number;
    seekTo: (time: number) => void;
    isPlaying: () => boolean;
  };
};

export function TranscriptPanel({ lessonId, lessonTitle, videoPlayer }: TranscriptPanelProps) {
  const { notify } = useToast();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);

  // Notes state
  const [notes, setNotes] = useState<any | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const segmentsRef = useRef<Segment[]>([]);
  segmentsRef.current = segments;

  const loadTranscriptAndNotes = async () => {
    setLoading(true);
    try {
      // 1. Fetch transcript if it exists
      const res = await fetch(`/api/transcripts`);
      // Wait, we need to list transcripts, but let's check if the API route lists them or we can query direct.
      // Wait! The `/api/transcripts` GET is not fully implemented yet, let's create a GET fallback or query Supabase directly on the client side!
      // Direct client check:
      const supabase = (await import("@/lib/supabase/client")).createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: trans } = await supabase
            .from("video_transcripts")
            .select("*")
            .eq("lesson_id", lessonId)
            .eq("student_id", user.id)
            .maybeSingle();

          if (trans) {
            setTranscript({
              id: trans.id,
              lesson_id: trans.lesson_id,
              transcript_text: trans.transcript_text,
              transcript_segments: trans.transcript_segments || [],
              source: trans.source,
              word_count: trans.word_count || 0,
              duration_secs: trans.duration_secs || 0
            });
            setSegments(trans.transcript_segments || []);

            // Also check for generated lecture notes
            const { data: nt } = await supabase
              .from("lecture_notes")
              .select("*")
              .eq("transcript_id", trans.id)
              .maybeSingle();
            if (nt) setNotes(nt);
          }
        }
      }
    } catch (err) {
      console.error("Error loading transcript:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranscriptAndNotes();
  }, [lessonId]);

  // Periodic auto-save every 30 seconds during active transcription
  useEffect(() => {
    if (!isTranscribing) return;

    const interval = setInterval(() => {
      saveTranscriptProgress();
    }, 30000);

    return () => clearInterval(interval);
  }, [isTranscribing, segments]);

  const saveTranscriptProgress = async (finalText?: string, finalSegments?: Segment[]) => {
    const textToSave = finalText || segments.map(s => s.text).join(" ");
    const segmentsToSave = finalSegments || segments;

    if (!textToSave.trim()) return;

    try {
      const res = await fetch("/api/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          transcript_text: textToSave,
          segments: segmentsToSave,
          source: "web_speech",
          language: "en",
          duration_secs: Math.round(videoPlayer.getCurrentTime())
        })
      });

      const data = await res.json();
      if (res.ok && data.transcript) {
        setTranscript(data.transcript);
      }
    } catch (err) {
      console.error("Failed to auto-save transcript progress:", err);
    }
  };

  // Browser Web Speech recognition implementation
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify({
        title: "Not Supported",
        description: "Your browser does not support the Web Speech API. Please try Chrome or Safari, or use the AI Auto-Transcription.",
        tone: "error"
      });
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      let segmentStart = videoPlayer.getCurrentTime();

      rec.onstart = () => {
        setIsTranscribing(true);
        notify({ title: "Transcription Active", description: "Listening to audio input...", tone: "info" });
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalSegmentText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalSegmentText += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalSegmentText) {
          const now = videoPlayer.getCurrentTime();
          const newSegment: Segment = {
            start_secs: Math.round(segmentStart),
            end_secs: Math.round(now),
            text: finalSegmentText.trim(),
            is_final: true
          };

          setSegments(prev => {
            const updated = [...prev, newSegment];
            // Save state immediately
            saveTranscriptProgress(updated.map(s => s.text).join(" "), updated);
            return updated;
          });

          segmentStart = now;
          setLiveText("");
        } else {
          setLiveText(interimTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        if (e.error === "not-allowed") {
          notify({ title: "Permission Blocked", description: "Microphone permission is required.", tone: "error" });
          stopSpeechRecognition();
        }
      };

      rec.onend = () => {
        setIsTranscribing(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      notify({ title: "Start Failed", description: "Failed to initialize Speech Recognition.", tone: "error" });
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);

    // Save final state
    if (liveText.trim()) {
      const now = videoPlayer.getCurrentTime();
      const finalSeg: Segment = {
        start_secs: Math.round(now - 3),
        end_secs: Math.round(now),
        text: liveText.trim(),
        is_final: true
      };
      const updated = [...segments, finalSeg];
      setSegments(updated);
      setLiveText("");
      saveTranscriptProgress(updated.map(s => s.text).join(" "), updated);
    } else {
      saveTranscriptProgress();
    }

    notify({ title: "Transcription Stopped", description: "Your lecture transcript has been saved.", tone: "success" });
  };

  // AI Mock Transcript fallback generator (Wow feature)
  const handleGenerateAiMock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transcripts/generate-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTranscript(data.transcript);
      setSegments(data.transcript.transcript_segments || []);
      notify({ title: "Auto-Transcribed", description: "AI has successfully synthesized video transcript segments.", tone: "success" });
    } catch (err: any) {
      notify({ title: "Generation Failed", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Generate Notes via transcript-notes API
  const handleGenerateNotes = async () => {
    if (!transcript) return;
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/transcripts/${transcript.id}/notes`, {
        method: "POST"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotes(data.notes);
      notify({ title: "Notes Ready!", description: "AI study notes compiled and synced to notebook.", tone: "success" });
    } catch (err: any) {
      notify({ title: "Notes Failed", description: err.message, tone: "error" });
    } finally {
      setNotesLoading(false);
    }
  };

  // Download Notes PDF (POST /api/pdf/lecture-notes)
  const handleDownloadPdf = async () => {
    if (!notes) return;
    try {
      notify({ title: "Exporting PDF", description: "Compiling formatted document...", tone: "info" });
      const res = await fetch("/api/pdf/lecture-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesId: notes.id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "PDF engine error");
      }

      // Read as blob and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${lessonTitle.replace(/\s+/g, "_")}_Lecture_Notes.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notify({ title: "Downloaded", description: "Lecture notes PDF exported successfully.", tone: "success" });
    } catch (err: any) {
      notify({ title: "Export Failed", description: err.message, tone: "error" });
    }
  };

  // Clear Transcript
  const handleClearTranscript = async () => {
    if (!confirm("Are you sure you want to delete this transcript? This will also clear generated study notes.")) return;
    setLoading(true);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      if (supabase) {
        if (transcript?.id) {
          await supabase.from("video_transcripts").delete().eq("id", transcript.id);
        }
        setTranscript(null);
        setSegments([]);
        setNotes(null);
        notify({ title: "Cleared", description: "Transcript cleared successfully.", tone: "info" });
      }
    } catch (err) {
      notify({ title: "Clear Failed", description: "Failed to remove database records.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-5 h-full min-h-[450px]">
      {loading ? (
        <div className="p-12 text-center text-xs text-cn-ink-subtle flex-grow flex flex-col justify-center items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-rose-500/20 border-t-rose-500 inline-block mb-3" />
          <p>Scanning transcription databases...</p>
        </div>
      ) : !transcript && !isTranscribing ? (
        /* --- Welcome / Inactive State --- */
        <div className="flex-grow flex flex-col justify-center items-center text-center p-6 gap-5 max-w-md mx-auto my-auto h-full">
          <div className="p-4 bg-rose-500/10 rounded-full animate-bounce">
            <span className="material-symbols-outlined text-4xl text-rose-500">record_voice_over</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-cn-ink dark:text-neutral-100">Video Transcription Hub</h3>
            <p className="text-[11px] text-cn-ink-subtle leading-relaxed mt-1">
              Capture spoken lecture text in real-time or auto-generate complete timeline transcripts to unlock AI study sheets.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={startSpeechRecognition}
              className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 w-full"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
              🎤 Start Real-Time Mic Capture
            </button>
            <button
              onClick={handleGenerateAiMock}
              className="py-2.5 px-4 bg-cn-canvas border border-cn-border hover:bg-cn-border text-cn-ink rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 w-full"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              🤖 AI Instant Auto-Transcription
            </button>
          </div>
        </div>
      ) : (
        /* --- Active Transcription / Interactive Transcript player --- */
        <div className="flex flex-col gap-4 flex-grow h-full overflow-hidden">
          {/* Header Panel */}
          <div className="flex justify-between items-center p-3 bg-cn-canvas/45 rounded-xl border border-cn-border text-[10px] text-cn-ink-subtle">
            <div className="flex items-center gap-4">
              <span>Source: <strong className="text-rose-500 uppercase">{transcript?.source || "Live Capture"}</strong></span>
              <span>Words: <strong>{transcript?.word_count || segments.map(s => s.text).join(" ").split(/\s+/).filter(Boolean).length}</strong></span>
              <span>Time: <strong>{formatTime(transcript?.duration_secs || Math.round(videoPlayer.getCurrentTime()))}</strong></span>
            </div>
            {isTranscribing ? (
              <button
                onClick={stopSpeechRecognition}
                className="py-1 px-3 bg-red-600 text-white rounded-lg font-bold animate-pulse text-[9px]"
              >
                🔴 STOP CAPTURE
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={startSpeechRecognition}
                  className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[9px] flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[10px]">mic</span>
                  Resume Mic
                </button>
                <button
                  onClick={handleClearTranscript}
                  className="text-red-500 hover:text-red-600 font-semibold"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Interactive Timeline segments */}
          <div className="flex-grow max-h-[350px] overflow-y-auto border border-cn-border bg-cn-surface rounded-xl p-4 flex flex-col gap-3 custom-scrollbar">
            {segments.map((seg, i) => (
              <div
                key={i}
                onClick={() => videoPlayer.seekTo(seg.start_secs)}
                className="group p-2 rounded-lg hover:bg-cn-canvas border border-transparent hover:border-rose-500/10 transition-all cursor-pointer flex gap-3 text-xs leading-relaxed text-cn-ink-muted"
              >
                <span className="font-mono text-[10px] font-bold text-rose-500 group-hover:underline shrink-0 mt-0.5">
                  [{formatTime(seg.start_secs)}]
                </span>
                <span>{seg.text}</span>
              </div>
            ))}

            {isTranscribing && liveText && (
              <div className="p-2 bg-rose-500/5 rounded-lg border border-dashed border-rose-500/20 text-xs italic text-cn-ink animate-pulse flex gap-3">
                <span className="font-mono text-[10px] font-bold text-rose-500 shrink-0 mt-0.5">
                  [{formatTime(Math.round(videoPlayer.getCurrentTime()))}]
                </span>
                <span>{liveText}...</span>
              </div>
            )}

            {segments.length === 0 && !liveText && (
              <div className="py-12 text-center text-xs text-cn-ink-subtle">
                <p>Speak to write transcript segments...</p>
              </div>
            )}
          </div>

          {/* AI Notes Panel */}
          <div className="border-t border-cn-border pt-4 mt-auto">
            {notes ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>AI Notes Synced</span>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-md shadow-rose-600/10"
                  >
                    <span className="material-symbols-outlined text-[12px]">download</span>
                    PDF Export
                  </button>
                </div>
                <div className="text-[11px] text-cn-ink-muted">
                  <h4 className="font-bold text-cn-ink mb-1">{notes.title}</h4>
                  <p className="line-clamp-2 leading-relaxed">{notes.summary}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateNotes}
                disabled={notesLoading || segments.length === 0}
                className="py-2.5 px-4 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 w-full shadow-lg shadow-rose-600/15 disabled:opacity-50"
              >
                {notesLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white inline-block mr-1" />
                    Synthesizing notes via Llama 3...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    📝 Generate AI Study Notes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
