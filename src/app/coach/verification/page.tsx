import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export const metadata: Metadata = { title: "Verification — Coach — COGNARA™" };

const steps = [
  { label: "Personal Info", done: true },
  { label: "Upload Documents", done: false },
  { label: "AI Review", done: false },
  { label: "Admin Approval", done: false },
];

export default function CoachVerificationPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Coach Verification</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Get verified to publish courses and start earning</p>
      </section>

      {/* Progress */}
      <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="warning" dot>Pending</Badge>
          <span className="text-xs text-cn-ink-subtle">Step 1 of 4 completed</span>
        </div>
        <ProgressBar value={25} color="indigo" size="md" showLabel />
        <div className="mt-5 grid grid-cols-4 gap-2">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                s.done
                  ? "bg-emerald-500 text-white"
                  : "border-2 border-cn-border text-cn-ink-subtle"
              }`}>
                {s.done ? "✓" : i + 1}
              </div>
              <p className={`mt-2 text-xs ${s.done ? "font-semibold text-cn-ink" : "text-cn-ink-subtle"}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-sm">
        <h2 className="text-base font-bold text-cn-ink mb-4">Upload Verification Documents</h2>
        <p className="text-sm text-cn-ink-muted mb-5">Accepted: Degree certificate, professional certification, government ID</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {["Degree / Diploma", "Professional Certificate", "Government ID"].map(doc => (
            <label key={doc} className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-cn-border p-8 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-110">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-cn-ink">{doc}</span>
              <span className="text-[10px] text-cn-ink-subtle">PDF, JPG, PNG — max 10MB</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            </label>
          ))}
        </div>
      </div>

      {/* AI Screening Info */}
      <div className="rounded-2xl border border-indigo-200/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-6 dark:border-indigo-500/15 dark:from-indigo-950/20 dark:to-purple-950/10">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-2xl">🤖</span>
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
