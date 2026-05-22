"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CoachSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Unable to connect");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const { error: err } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        category: "other",
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
      });
      if (err) throw new Error(err.message);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support</h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 py-16 text-center">
          <span className="mb-3 text-4xl">✅</span>
          <h3 className="text-lg font-bold text-cn-ink">Ticket Submitted</h3>
          <p className="mt-1 max-w-sm text-sm text-cn-ink-muted">Our team will respond within 24 hours via email.</p>
          <button type="button" onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }} className="mt-6 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Support</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Get help with your coach account</p>
      </section>

      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto w-full max-w-lg space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">{error}</div>
        )}
        <div>
          <label htmlFor="cs-subject" className="mb-1.5 block text-sm font-semibold text-cn-ink">Subject</label>
          <input id="cs-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} required minLength={5} maxLength={200} placeholder="Brief description" className="h-10 w-full rounded-xl border border-cn-border bg-cn-surface px-3 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div>
          <label htmlFor="cs-message" className="mb-1.5 block text-sm font-semibold text-cn-ink">Message</label>
          <textarea id="cs-message" value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder="Describe your issue…" className="w-full resize-none rounded-xl border border-cn-border bg-cn-surface px-3 py-2.5 text-sm text-cn-ink placeholder:text-cn-ink-subtle/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button type="submit" disabled={!subject.trim() || !message.trim() || loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Submitting…" : "Create Ticket"}
        </button>
      </form>
    </div>
  );
}
