"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";

type Props = {
  initialCategory?: "bug" | "abuse" | "content" | "fraud" | "security" | "feature_request";
  targetUserId?: string;
  lessonId?: string;
  courseId?: string;
  elementSelector?: string;
  videoTimestampSecs?: number;
  triggerButton?: React.ReactNode;
};

export function ReportBugButton({
  initialCategory = "bug",
  targetUserId,
  lessonId,
  courseId,
  elementSelector,
  videoTimestampSecs,
  triggerButton,
}: Props) {
  const { notify } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [category, setCategory] = useState(initialCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reproductionSteps, setReproductionSteps] = useState("");
  
  // Location details (auto-captured)
  const [pageUrl, setPageUrl] = useState("");
  const [pageRoute, setPageRoute] = useState("");
  const [domSelector, setDomSelector] = useState(elementSelector || "");
  const [videoTimestamp, setVideoTimestamp] = useState(videoTimestampSecs || 0);

  // Screenshot Upload State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Auto-capture on mount or when modal opens
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
      setPageRoute(window.location.pathname);

      // Attempt to auto-capture timestamp if a video element exists
      if (!videoTimestampSecs) {
        const video = document.querySelector("video");
        if (video) {
          setVideoTimestamp(Math.floor(video.currentTime));
        }
      }
    }
  }, [isOpen, videoTimestampSecs]);

  // Handle preview generation
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify({ title: "File too large", description: "Screenshot must be smaller than 5MB.", tone: "error" });
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureScreen = async () => {
    try {
      if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
        notify({ title: "Not Supported", description: "Browser screen capture is not supported in this browser.", tone: "info" });
        return;
      }
      
      // Request screen media stream
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        setTimeout(() => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `screenshot_${Date.now()}.png`, { type: "image/png" });
              setScreenshotFile(file);
              setScreenshotPreview(URL.createObjectURL(blob));
              notify({ title: "Captured!", description: "Browser view captured successfully.", tone: "success" });
            }
            // Stop media stream
            stream.getTracks().forEach((track: any) => track.stop());
          }, "image/png");
        }, 300);
      };
    } catch {
      notify({ title: "Capture Cancelled", description: "Screen capture was not allowed or failed.", tone: "info" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 5) {
      notify({ title: "Validation Error", description: "Title must be at least 5 characters.", tone: "error" });
      return;
    }
    if (description.length < 20) {
      notify({ title: "Validation Error", description: "Description must be at least 20 characters.", tone: "error" });
      return;
    }

    setLoading(true);

    try {
      let screenshotPath = "";

      // 1. Upload screenshot if exists
      if (screenshotFile) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (supabase) {
          const fileExt = screenshotFile.name.split(".").pop();
          const fileName = `${Date.now()}_screenshot.${fileExt}`;
          const { data, error } = await supabase.storage
            .from("bug-screenshots")
            .upload(`reports/${fileName}`, screenshotFile);

          if (error) {
            console.error("Upload error:", error);
          } else if (data) {
            screenshotPath = data.path;
          }
        }
      }

      // 2. Browser Information
      const browserInfo = typeof navigator !== "undefined" ? {
        userAgent: navigator.userAgent,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        language: navigator.language,
      } : {};

      // 3. Post payload to API
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          description,
          page_url: pageUrl,
          page_route: pageRoute,
          dom_selector: domSelector,
          video_timestamp_secs: videoTimestamp,
          lesson_id: lessonId,
          course_id: courseId,
          reported_user_id: targetUserId,
          screenshot_path: screenshotPath,
          browser_info: browserInfo,
          reproduction_steps: category === "bug" ? reproductionSteps : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      notify({
        title: "Report Submitted!",
        description: "Your report has been received. Our AI analyst is triaging it now.",
        tone: "success",
      });

      // Clear Form
      setTitle("");
      setDescription("");
      setReproductionSteps("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setIsOpen(false);
    } catch (err: any) {
      notify({
        title: "Submission Failed",
        description: err.message || "Something went wrong. Please try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormattedTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {triggerButton || (
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cn-surface text-cn-ink border border-cn-border shadow-md transition hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
            title="Report Bug / Misconduct"
          >
            <span className="material-symbols-outlined text-[20px]">report</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-3xl p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto custom-scrollbar shadow-2xl border border-[rgba(255,255,255,0.08)] bg-[#141420] text-white animate-in zoom-in-95 duration-300">
            <header className="flex justify-between items-center pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 animate-pulse text-[22px]">bug_report</span>
                <div>
                  <h3 className="text-base font-bold">Report Issue or Misconduct</h3>
                  <p className="text-[10px] text-gray-400">Security, bugs, content audits, and report evaluation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["bug", "abuse", "content", "fraud", "security", "feature_request"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition capitalize ${
                        category === cat
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                          : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {cat.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize the issue in 5-200 characters"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500/40"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                  <label>Description</label>
                  <span className={`${description.length >= 20 ? "text-green-500" : "text-amber-500"}`}>
                    {description.length}/20 min
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about what you observed. Min 20 characters."
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500/40 resize-none"
                />
              </div>

              {/* Reproduction Steps (Bugs Only) */}
              {category === "bug" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Reproduction Steps</label>
                  <textarea
                    rows={3}
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    placeholder="1. Go to page...&#13;2. Click on...&#13;3. Observe crash..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500/40 resize-none"
                  />
                </div>
              )}

              {/* Auto-Captured Location Data */}
              <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-rose-500">location_on</span>
                  Auto-Captured Location details
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300">
                  <div>
                    <span className="text-gray-400 font-semibold">Route: </span>
                    <code className="bg-black/20 px-1 py-0.5 rounded text-rose-400 font-mono text-[9px]">{pageRoute}</code>
                  </div>
                  {videoTimestamp > 0 && (
                    <div>
                      <span className="text-gray-400 font-semibold">Video time: </span>
                      <code className="bg-black/20 px-1 py-0.5 rounded text-rose-400 font-mono text-[9px]">{getFormattedTimestamp(videoTimestamp)}</code>
                    </div>
                  )}
                  {domSelector && (
                    <div className="col-span-2">
                      <span className="text-gray-400 font-semibold">Selector: </span>
                      <code className="bg-black/20 px-1 py-0.5 rounded text-rose-400 font-mono text-[9px] truncate max-w-full block mt-0.5">{domSelector}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Screenshot Attachment */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Attach Screenshot</label>
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={handleCaptureScreen}
                    className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-gray-300 hover:bg-white/10 transition flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">screen_share</span>
                    Capture View
                  </button>
                  <label className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-gray-300 hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotChange}
                    />
                  </label>

                  {screenshotPreview && (
                    <div className="relative h-10 w-16 rounded-lg overflow-hidden border border-white/20 bg-black/40">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotFile(null);
                          setScreenshotPreview(null);
                        }}
                        className="absolute top-0.5 right-0.5 bg-black/75 rounded-full p-0.5 text-white hover:text-red-400 transition"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit / Action panel */}
              <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-4 mt-2">
                <span className="text-[10px] text-gray-400">Protected by sliding rate-limits.</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/25 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
