"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AgentIcon } from "@/components/ui/agent-icon";

type UploadedDoc = {
  name: string;
  url: string;
  uploadedAt: string;
};

const steps = [
  { label: "Personal Info", key: "info" },
  { label: "Upload Documents", key: "upload" },
  { label: "AI Review", key: "review" },
  { label: "Admin Approval", key: "approval" },
];

export default function CoachVerificationPage() {
  const [uploads, setUploads] = useState<Record<string, UploadedDoc | null>>({
    degree: null,
    certificate: null,
    id: null,
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Check verification status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified_coach")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_verified_coach) {
        setVerificationStatus("approved");
      }

      // Check existing uploads in storage
      const { data: files } = await supabase.storage
        .from("verification-docs")
        .list(user.id, { limit: 10 });

      if (files) {
        const uploadMap: Record<string, UploadedDoc | null> = { degree: null, certificate: null, id: null };
        for (const file of files) {
          const key = file.name.split("-")[0]; // e.g., "degree-timestamp.pdf"
          if (key in uploadMap) {
            const { data: urlData } = supabase.storage
              .from("verification-docs")
              .getPublicUrl(`${user.id}/${file.name}`);
            uploadMap[key] = {
              name: file.name,
              url: urlData?.publicUrl ?? "",
              uploadedAt: new Date(file.created_at ?? Date.now()).toLocaleString(),
            };
          }
        }
        setUploads(uploadMap);
      }

      setLoading(false);
    }
    void load();
  }, []);

  const handleUpload = useCallback(async (docType: string, file: File) => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File too large. Max 10MB.");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      alert("Invalid file type. Only PDF, JPG, PNG allowed.");
      return;
    }

    setUploading(docType);

    const ext = file.name.split(".").pop() ?? "pdf";
    const fileName = `${docType}-${Date.now()}.${ext}`;
    const path = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("verification-docs")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      alert(`Upload failed: ${error.message}`);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("verification-docs")
      .getPublicUrl(path);

    setUploads(prev => ({
      ...prev,
      [docType]: {
        name: fileName,
        url: urlData?.publicUrl ?? "",
        uploadedAt: new Date().toLocaleString(),
      },
    }));

    setUploading(null);
  }, []);

  const completedDocs = Object.values(uploads).filter(Boolean).length;
  const currentStep = verificationStatus === "approved" ? 4 : completedDocs >= 3 ? 2 : completedDocs > 0 ? 1 : 0;
  const progress = verificationStatus === "approved" ? 100 : Math.round((currentStep / 4) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cn-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Coach Verification</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Get verified to publish courses and start earning</p>
      </section>

      {/* Progress */}
      <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant={verificationStatus === "approved" ? "success" : "warning"}
            dot
          >
            {verificationStatus === "approved" ? "Verified" : "Pending"}
          </Badge>
          <span className="text-xs text-cn-ink-subtle">Step {Math.min(currentStep + 1, 4)} of 4</span>
        </div>
        <ProgressBar value={progress} color="indigo" size="md" showLabel />
        <div className="mt-5 grid grid-cols-4 gap-2">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                i <= currentStep
                  ? "bg-emerald-500 text-white"
                  : "border-2 border-cn-border text-cn-ink-subtle"
              }`}>
                {i <= currentStep ? "✓" : i + 1}
              </div>
              <p className={`mt-2 text-xs ${i <= currentStep ? "font-semibold text-cn-ink" : "text-cn-ink-subtle"}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
        <h2 className="text-base font-bold text-cn-ink mb-4">Upload Verification Documents</h2>
        <p className="text-sm text-cn-ink-muted mb-5">Accepted: Degree certificate, professional certification, government ID</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            { key: "degree", label: "Degree / Diploma" },
            { key: "certificate", label: "Professional Certificate" },
            { key: "id", label: "Government ID" },
          ]).map(doc => {
            const uploaded = uploads[doc.key];
            const isUploading = uploading === doc.key;
            return (
              <label
                key={doc.key}
                className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  uploaded
                    ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5"
                    : "border-cn-border hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5"
                }`}
              >
                {isUploading ? (
                  <div className="flex h-12 w-12 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  </div>
                ) : uploaded ? (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-110">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </span>
                )}
                <span className="text-sm font-semibold text-cn-ink">{doc.label}</span>
                {uploaded ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Uploaded · {uploaded.uploadedAt}</span>
                ) : (
                  <span className="text-[10px] text-cn-ink-subtle">PDF, JPG, PNG — max 10MB</span>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(doc.key, file);
                    e.target.value = "";
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* AI Screening Info */}
      <div className="rounded-2xl border border-indigo-200/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-6 dark:border-indigo-500/15 dark:from-indigo-950/20 dark:to-purple-950/10">
        <div className="flex items-start gap-3">
          <span className="mt-0.5"><AgentIcon size={28} /></span>
          <div>
            <h3 className="text-sm font-bold text-cn-ink">AI Pre-Screening</h3>
            <p className="mt-1 text-xs text-cn-ink-muted leading-relaxed">
              Your documents will be analyzed by our AI (Gemini Vision) for authenticity verification.
              The AI generates a confidence score, but a human admin always makes the final decision.
              Average review time: 24–48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
