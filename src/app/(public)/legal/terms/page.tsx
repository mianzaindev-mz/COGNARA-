import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — COGNARA™",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="text-3xl font-bold text-cn-ink">Terms of Service</h1>
      <p className="mt-4 text-sm text-cn-ink-muted">
        Placeholder terms for the COGNARA educational platform. By using the service you agree to follow community guidelines, respect intellectual property on uploaded materials, and use the AI agent responsibly.
      </p>
      <h2 className="mt-8 text-lg font-bold text-cn-ink">Acceptable use</h2>
      <p className="mt-2 text-sm text-cn-ink-muted">
        No harassment, cheating on assessments, or attempts to bypass credit limits or security controls.
      </p>
    </article>
  );
}
