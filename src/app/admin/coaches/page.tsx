"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast-provider";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type CoachDocument = {
  id: string;
  type: "degree" | "certificate" | "govt_id" | "linkedin" | "github" | "other";
  storage_path: string;
  filename: string | null;
  ai_verified: boolean | null;
};

type Application = {
  id: string;
  user_id: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "appealing";
  submitted_at: string;
  ai_confidence_score: number | null;
  ai_notes: string | null;
  profiles: Profile | null;
  coach_documents: CoachDocument[];
};

export default function AdminCoachesPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<CoachDocument[] | null>(null);
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { notify } = useToast();

  const fetchApplications = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Database connection error.");

      const { data, error: fetchErr } = await supabase
        .from("coach_applications")
        .select(`
          id,
          user_id,
          status,
          submitted_at,
          ai_confidence_score,
          ai_notes,
          profiles (
            id,
            full_name,
            username,
            avatar_url
          ),
          coach_documents (
            id,
            type,
            storage_path,
            filename,
            ai_verified
          )
        `)
        .order("submitted_at", { ascending: false });

      if (fetchErr) throw fetchErr;

      // Map profiles if they return as array or object
      const formatted: Application[] = (data ?? []).map((app: any) => {
        const prof = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
        return {
          ...app,
          profiles: prof ?? null,
          coach_documents: app.coach_documents ?? []
        };
      });

      setApplications(formatted);
    } catch (err: any) {
      setError(err.message || "Failed to load applications list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
  }, []);

  const handleApprove = async (app: Application) => {
    if (actioningId) return;
    setActioningId(app.id);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not connect to database.");

      // 1. Update application status
      const { error: appErr } = await supabase
        .from("coach_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", app.id);

      if (appErr) throw appErr;

      // 2. Update user profile role to coach
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          role: "coach",
          is_verified: true
        })
        .eq("id", app.user_id);

      if (profileErr) throw profileErr;

      notify({
        title: "Application Approved",
        description: `Successfully approved coach credentials for ${app.profiles?.full_name || "user"}.`,
        tone: "success"
      });

      // Refresh list
      await fetchApplications();
    } catch (err: any) {
      notify({
        title: "Approval Failed",
        description: err.message || "Approval process failed.",
        tone: "error"
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = (app: Application) => {
    setRejectingApp(app);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingApp || actioningId) return;
    const app = rejectingApp;
    setRejectingApp(null);
    setActioningId(app.id);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not connect to database.");

      const { error: appErr } = await supabase
        .from("coach_applications")
        .update({
          status: "rejected",
          rejection_reason: rejectReason.trim() || "Documents do not meet required specifications.",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", app.id);

      if (appErr) throw appErr;

      notify({
        title: "Application Rejected",
        description: "The coach application has been declined.",
        tone: "warning"
      });

      await fetchApplications();
    } catch (err: any) {
      notify({
        title: "Rejection Failed",
        description: err.message || "Rejection process failed.",
        tone: "error"
      });
    } finally {
      setActioningId(null);
    }
  };

  const seedDemoApplications = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Database offline.");

      // Fetch users who are not admin to create mock coach applications for
      const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student")
        .limit(3);

      if (!users || users.length === 0) {
        throw new Error("No student users found to create demo applications for.");
      }

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const scores = [88, 71, 45];
        const notes = [
          "Applicant credentials and degrees match system parameters perfectly.",
          "Linkedin verification complete. Standard certifications validated.",
          "Verification alert: missing formal institution domain references."
        ];

        const { data: newApp } = await supabase
          .from("coach_applications")
          .insert({
            user_id: user.id,
            status: "pending",
            ai_confidence_score: scores[i % scores.length],
            ai_notes: notes[i % notes.length],
            submitted_at: new Date(Date.now() - i * 3600000 * 4).toISOString()
          })
          .select()
          .single();

        if (newApp) {
          // Add a couple of documents
          await supabase.from("coach_documents").insert([
            {
              application_id: newApp.id,
              type: "degree",
              storage_path: "certificates/degree.pdf",
              filename: `${user.full_name?.replace(/\s+/g, "_") || "user"}_degree.pdf`,
              ai_verified: true
            },
            {
              application_id: newApp.id,
              type: "linkedin",
              storage_path: "https://linkedin.com",
              filename: "LinkedIn Profile",
              ai_verified: true
            }
          ]);
        }
      }

      await fetchApplications();
    } catch (err: any) {
      notify({
        title: "Seed Failed",
        description: err.message || "Failed to seed demo data.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink dark:text-white">Coach Management</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">Review verification applications and manage coaches</p>
        </div>
        <div className="space-y-4">
          <div className="h-44 bg-cn-surface border border-cn-border animate-pulse rounded-2xl dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
          <div className="h-44 bg-cn-surface border border-cn-border animate-pulse rounded-2xl dark:border-[#2e2a2a] dark:bg-[#1a1818]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink dark:text-white">Coach Management</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">Review verification applications and manage coaches</p>
        </div>
        {applications.length === 0 && (
          <button
            type="button"
            onClick={seedDemoApplications}
            className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-500 hover:bg-indigo-500 hover:text-white transition"
          >
            Seed Demo Applications
          </button>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm font-semibold text-rose-500">
          {error}
        </div>
      )}

      <section className="cn-card-lift cn-card-shine rounded-2xl border border-cn-border bg-cn-surface p-6 dark:border-[#2e2a2a] dark:bg-[#1a1818]">
        <h2 className="text-base font-bold text-cn-ink dark:text-white mb-4">Verification Queue ({applications.length})</h2>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-bold text-cn-ink dark:text-white">Queue is clear</p>
            <p className="mt-1 text-xs text-cn-ink-muted">No pending coach applications require review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const name = app.profiles?.full_name || app.profiles?.username || "Anonymous Applicant";
              const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const score = app.ai_confidence_score ?? 0;
              const dateStr = new Date(app.submitted_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={app.id}
                  className="rounded-xl border border-cn-border bg-cn-canvas p-5 transition hover:bg-cn-surface dark:border-[#2e2a2a] dark:bg-[#0f0e0e] dark:hover:bg-[#151313]"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-400">
                        {initials}
                      </span>
                      <div>
                        <p className="font-semibold text-cn-ink dark:text-white">{name}</p>
                        <p className="text-xs text-cn-ink-muted">
                          @{app.profiles?.username || "unknown"} · Submitted {dateStr}
                        </p>
                      </div>
                    </div>
                    <Badge variant={app.status === "approved" ? "success" : app.status === "rejected" ? "danger" : "warning"} dot>
                      {app.status}
                    </Badge>
                  </div>

                  {app.ai_notes && (
                    <p className="text-xs text-cn-ink-muted italic mb-4 border-l-2 border-indigo-500/40 pl-3 py-0.5">
                      <span className="font-bold not-italic text-cn-ink-subtle">AI Analysis:</span> {app.ai_notes}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-cn-ink-subtle">Verification Match Score</span>
                        <span className={`font-bold ${score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500"}`}>
                          {score}%
                        </span>
                      </div>
                      <ProgressBar
                        value={score}
                        color={score >= 80 ? "emerald" : score >= 60 ? "amber" : "rose"}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {app.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={!!actioningId}
                          onClick={() => handleApprove(app)}
                          className="flex-1 min-w-[100px] rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          {actioningId === app.id ? "Processing..." : "✓ Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={!!actioningId}
                          onClick={() => handleReject(app)}
                          className="flex-1 min-w-[100px] rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedDocs(app.coach_documents)}
                      className="rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-xs font-bold text-cn-ink hover:bg-cn-canvas-hover transition dark:border-[#2e2a2a] dark:text-white dark:bg-[#0f0e0e]"
                    >
                      View ({app.coach_documents.length}) Docs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Docs Modal Overlay */}
      {selectedDocs && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setSelectedDocs(null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/30 bg-cn-surface p-8 shadow-2xl shadow-black/90 dark:border-[#2e2a2a] dark:bg-[#1a1818] animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-cn-ink dark:text-white">Credentials & Documents</h3>
              <button
                type="button"
                onClick={() => setSelectedDocs(null)}
                className="text-cn-ink-muted hover:text-cn-ink dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {selectedDocs.length === 0 ? (
              <p className="text-sm text-cn-ink-muted py-4 text-center">No digital documents attached to this application.</p>
            ) : (
              <div className="space-y-3 py-2">
                {selectedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-cn-border bg-cn-canvas p-3 dark:border-[#2e2a2a] dark:bg-[#0f0e0e]"
                  >
                    <div>
                      <p className="text-xs font-bold text-cn-ink dark:text-white capitalize">{doc.type}</p>
                      <p className="text-[10px] text-cn-ink-muted truncate max-w-[200px]">{doc.filename || "credential_file"}</p>
                    </div>
                    <a
                      href={doc.storage_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-cn-border px-3 py-1.5 text-[10px] font-bold text-indigo-500 hover:bg-cn-canvas dark:border-[#2e2a2a] dark:hover:bg-[#1a1818]"
                    >
                      Open Link
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocs(null)}
                className="rounded-xl bg-cn-orange px-5 py-2 text-xs font-bold text-white hover:bg-cn-orange-hover"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setRejectingApp(null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/30 bg-cn-surface p-8 shadow-2xl shadow-black/90 dark:border-[#2e2a2a] dark:bg-[#1a1818] animate-in zoom-in-95 duration-300" style={{ position: 'relative', zIndex: 10000 }}>
            <h3 className="text-base font-bold text-cn-ink mb-2">Reject Coach Application</h3>
            <p className="text-xs text-cn-ink-muted mb-4 leading-relaxed">
              Are you sure you want to reject the application from <strong>{rejectingApp.profiles?.full_name || "this applicant"}</strong>? Please specify the reason so they can correct and resubmit.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-cn-ink-subtle">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Uploaded documents are blurry, credentials cannot be verified..."
                rows={3}
                className="w-full rounded-xl border border-cn-border bg-cn-canvas p-3 text-sm text-cn-ink placeholder-cn-ink-subtle focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="rounded-xl border border-cn-border bg-cn-canvas px-4 py-2.5 text-xs font-bold text-cn-ink hover:bg-cn-canvas-hover transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
