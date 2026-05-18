"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Certificate = {
  id: string;
  courseTitle: string;
  coachName: string;
  completedAt: string;
  code: string;
};

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get completed enrollments (progress >= 100)
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, course_id, enrolled_at, courses!enrollments_course_id_fkey(title, profiles!courses_coach_id_fkey(full_name))")
        .eq("student_id", user.id)
        .gte("progress_pct", 100);

      const results: Certificate[] = ((enrollments as unknown as Array<{
        id: string;
        course_id: string;
        enrolled_at: string;
        courses: { title: string; profiles: { full_name: string | null } | null } | null;
      }>) ?? []).map(e => ({
        id: e.id,
        courseTitle: e.courses?.title ?? "Course",
        coachName: e.courses?.profiles?.full_name ?? "Coach",
        completedAt: new Date(e.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        code: `CERT-${e.course_id.slice(0, 4).toUpperCase()}-${e.id.slice(0, 6).toUpperCase()}`,
      }));

      setCerts(results);
      setLoading(false);
    }
    void load();
  }, []);

  const filtered = certs.filter(
    (c) =>
      c.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cn-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Certificates</h1>
        <p className="mt-0.5 text-sm text-cn-ink-muted">
          Your earned certificates with verifiable codes. Share on LinkedIn or add to your portfolio.
        </p>
      </div>

      {certs.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search certificates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 max-w-sm flex-1 rounded-xl border border-cn-border bg-cn-canvas px-4 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface/50 py-16 text-center">
          <span className="mb-3 text-4xl">🏆</span>
          <h3 className="text-lg font-bold text-cn-ink">No certificates yet</h3>
          <p className="mt-1 max-w-sm text-sm text-cn-ink-muted">
            Complete a course to earn your first certificate. Each certificate has a unique
            verification code you can share with employers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((cert) => (
            <div
              key={cert.id}
              className="cn-card-lift group relative overflow-hidden rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-[var(--cn-shadow-card)] transition hover:border-cn-orange/30"
            >
              <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-br from-cn-yellow to-amber-500 px-3 py-1.5">
                <span className="text-xs font-bold text-cn-sidebar">✓ Verified</span>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cn-orange to-cn-pink text-xl text-white">
                  🏆
                </div>
                <div>
                  <h3 className="font-bold text-cn-ink">{cert.courseTitle}</h3>
                  <p className="text-xs text-cn-ink-muted">by {cert.coachName}</p>
                </div>
              </div>

              <div className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cn-ink-muted">Completed</span>
                  <span className="font-medium text-cn-ink">{cert.completedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cn-ink-muted">Verification Code</span>
                  <span className="font-mono text-xs font-medium text-cn-orange">{cert.code}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(cert.code)}
                  className="flex-1 rounded-xl bg-cn-orange px-3 py-2 text-xs font-bold text-white transition hover:bg-cn-orange-hover"
                >
                  Copy Code
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + "/verify-certificate/" + cert.code)}`, "_blank")}
                  className="flex-1 rounded-xl border border-cn-border px-3 py-2 text-xs font-bold text-cn-ink transition hover:bg-cn-border/30"
                >
                  Share on LinkedIn
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-cn-border bg-cn-surface/50 p-5">
        <h3 className="mb-2 text-sm font-bold text-cn-ink">How Certificate Verification Works</h3>
        <div className="grid gap-3 text-sm text-cn-ink-muted sm:grid-cols-3">
          <div className="flex gap-2">
            <span className="text-cn-orange">1.</span>
            Each certificate has a unique code like <code className="rounded bg-cn-border/50 px-1 font-mono text-xs">CERT-PY-A1B2C3</code>
          </div>
          <div className="flex gap-2">
            <span className="text-cn-orange">2.</span>
            Anyone can verify at <code className="rounded bg-cn-border/50 px-1 font-mono text-xs">cognara.app/verify/CODE</code>
          </div>
          <div className="flex gap-2">
            <span className="text-cn-orange">3.</span>
            The page shows your name, course, date, and coach — tamper-proof
          </div>
        </div>
      </div>
    </div>
  );
}
