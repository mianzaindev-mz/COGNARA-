import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — COGNARA™",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <Link href="/" className="text-sm font-semibold text-cn-orange hover:underline">← Back to home</Link>
      <h1 className="mt-6 text-3xl font-bold text-cn-ink">Privacy Policy</h1>
      <p className="mt-2 text-xs text-cn-ink-subtle">Last updated: May 2026</p>

      <p className="mt-6 text-sm leading-relaxed text-cn-ink-muted">
        COGNARA Intelligence (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">1. Information We Collect</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-cn-ink-muted">
        <li><strong>Account Data:</strong> Email address, full name, username, role (student/coach/admin), and profile information you provide.</li>
        <li><strong>Learning Data:</strong> Course enrollments, lesson progress, quiz scores, certificate completions, and AI agent session metadata.</li>
        <li><strong>Usage Data:</strong> Pages visited, features used, timestamps, device type, and browser information collected automatically.</li>
        <li><strong>Payment Data:</strong> When Stripe is enabled, billing details are processed by Stripe and never stored on our servers.</li>
        <li><strong>User Content:</strong> Notebooks, code submissions, and support tickets you create within the platform.</li>
      </ul>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">2. How We Use Your Data</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-cn-ink-muted">
        <li>Provide and maintain the learning platform and personalized AI experiences.</li>
        <li>Track progress, generate certificates, and power analytics dashboards.</li>
        <li>Communicate updates, support responses, and security notifications.</li>
        <li>Improve platform performance, detect abuse, and ensure system security.</li>
      </ul>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">3. Data Storage & Security</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        All data is stored in Supabase (PostgreSQL) with row-level security (RLS) policies on 30+ tables. Authentication is handled via Supabase Auth with JWT tokens. API routes use server-side session verification, rate limiting, input sanitization, and Zod schema validation. File uploads are stored in isolated Supabase Storage buckets with type and size validation.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">4. Data Sharing</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        We do not sell your personal data. Data may be shared with: (a) coaches who manage courses you&apos;re enrolled in, (b) administrators for platform oversight, and (c) third-party services essential to platform operation (Supabase, Vercel, Stripe when enabled).
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">5. Your Rights</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-cn-ink-muted">
        <li><strong>Access:</strong> Request a copy of all personal data we hold.</li>
        <li><strong>Correction:</strong> Update inaccurate information via your profile page.</li>
        <li><strong>Deletion:</strong> Request account and data deletion by contacting support.</li>
        <li><strong>Portability:</strong> Export your learning data in standard formats.</li>
      </ul>
      <p className="mt-3 text-sm text-cn-ink-muted">
        To exercise these rights, contact the platform administrator at <a className="text-cn-orange hover:underline" href="mailto:support@cognara.app">support@cognara.app</a>.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">6. Cookies & Local Storage</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        We use essential cookies for authentication sessions. Local storage is used for UI preferences (theme, cookie consent). No third-party tracking cookies are used.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">7. Changes</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        We may update this policy from time to time. Material changes will be communicated via platform notification. Continued use constitutes acceptance.
      </p>
    </article>
  );
}
