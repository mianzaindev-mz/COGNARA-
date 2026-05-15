import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — COGNARA™",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-8 prose prose-neutral dark:prose-invert">
      <h1 className="text-3xl font-bold text-cn-ink">Privacy Policy</h1>
      <p className="mt-4 text-sm text-cn-ink-muted">
        Placeholder for UMT / production legal review. COGNARA processes account data via Supabase Auth and stores learning progress in Postgres with row-level security.
      </p>
      <h2 className="mt-8 text-lg font-bold text-cn-ink">Data we collect</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cn-ink-muted">
        <li>Account email, profile name, and role (student / coach / admin)</li>
        <li>Course enrollments, lesson progress, and agent session metadata</li>
        <li>Payment records when Stripe is enabled (not active in this build)</li>
      </ul>
      <h2 className="mt-8 text-lg font-bold text-cn-ink">Your rights</h2>
      <p className="mt-2 text-sm text-cn-ink-muted">
        Contact the platform administrator to request export or deletion, subject to academic and billing retention requirements.
      </p>
    </article>
  );
}
