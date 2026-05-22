"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";

interface LiveCallProps {
  roomUrl: string;
  onLeave?: () => void;
}

export function LiveCall({ roomUrl, onLeave }: LiveCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !roomUrl) return;

    const frame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "0",
        borderRadius: "1.5rem",
      },
      showLeaveButton: true,
    });

    callFrameRef.current = frame;

    frame
      .join({ url: roomUrl })
      .catch((err) => {
        console.error("Error joining call:", err);
        setError("Could not join the video room. Please try again.");
      });

    frame.on("left-meeting", () => {
      if (onLeave) onLeave();
    });

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, [roomUrl, onLeave]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center">
        <span className="material-symbols-outlined text-4xl text-rose-500 mb-4">error</span>
        <h3 className="text-lg font-bold text-cn-ink mb-2">Call Error</h3>
        <p className="text-sm text-cn-ink-muted mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-cn-orange text-white rounded-xl font-bold hover:bg-cn-orange-hover transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] lg:min-h-[600px] flex flex-col bg-black rounded-[2rem] overflow-hidden shadow-2xl relative">
      <div ref={containerRef} className="flex-1 w-full h-full" />
    </div>
  );
}
