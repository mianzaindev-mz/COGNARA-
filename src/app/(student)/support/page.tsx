"use client";

import { useState } from "react";

const CATEGORIES = ["billing", "technical", "course_issue", "account", "verification", "abuse_report", "other"] as const;

export default function SupportPage() {
  const [category, setCategory] = useState<string>("technical");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support</h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 py-16 text-center">
          <span className="mb-3 text-4xl">✅</span>
          <h3 className="text-lg font-bold text-cn-ink">Ticket Submitted</h3>
          <p className="mt-1 max-w-sm text-sm text-cn-ink-muted">
            Our AI agent will try to resolve this immediately. If it can&apos;t, a human admin
            will review within 24 hours. You&apos;ll be notified via email.
          </p>
          <button
            type="button"
            onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }}
            className="mt-6 rounded-xl bg-cn-orange px-4 py-2 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support</h1>
        <p className="mt-0.5 text-sm text-cn-ink-muted">
          Need help? Our AI agent resolves 60%+ of tickets instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-4">
        <div>
          <label htmlFor="support-category" className="mb-1.5 block text-sm font-semibold text-cn-ink">Category</label>
          <select
            id="support-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-xl border border-cn-border bg-cn-surface px-3 text-sm text-cn-ink focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ").replace(/^\w/, (l) => l.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="support-subject" className="mb-1.5 block text-sm font-semibold text-cn-ink">Subject</label>
          <input
            id="support-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue"
            required
            minLength={5}
            maxLength={200}
            className="h-10 w-full rounded-xl border border-cn-border bg-cn-surface px-3 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
          />
        </div>

        <div>
          <label htmlFor="support-message" className="mb-1.5 block text-sm font-semibold text-cn-ink">Message</label>
          <textarea
            id="support-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue in detail…"
            required
            rows={5}
            className="w-full resize-none rounded-xl border border-cn-border bg-cn-surface px-3 py-2.5 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-cn-orange focus:outline-none focus:ring-2 focus:ring-cn-orange/20"
          />
        </div>

        <button
          type="submit"
          disabled={!subject.trim() || !message.trim()}
          className="w-full rounded-xl bg-cn-orange py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover disabled:opacity-50"
        >
          Submit Ticket
        </button>
      </form>
    </div>
  );
}
