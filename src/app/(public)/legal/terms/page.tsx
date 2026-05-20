import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — COGNARA™",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <Link href="/" className="text-sm font-semibold text-cn-orange hover:underline">← Back to home</Link>
      <h1 className="mt-6 text-3xl font-bold text-cn-ink">Terms of Service</h1>
      <p className="mt-2 text-xs text-cn-ink-subtle">Last updated: May 2026</p>

      <p className="mt-6 text-sm leading-relaxed text-cn-ink-muted">
        By accessing or using COGNARA Intelligence (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">1. Account Registration</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your credentials and for all activity under your account. You must be at least 16 years old to use the Platform.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">2. Acceptable Use</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-cn-ink-muted">
        <li>Use the Platform for lawful educational purposes only.</li>
        <li>Do not harass, bully, or discriminate against other users.</li>
        <li>Do not attempt to cheat on assessments, quizzes, or certifications.</li>
        <li>Do not attempt to bypass AI credit limits, rate limits, or security controls.</li>
        <li>Do not upload malicious code, copyrighted material you don&apos;t own, or illegal content.</li>
        <li>Do not scrape, reverse engineer, or misuse the AI agent or platform APIs.</li>
      </ul>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">3. Intellectual Property</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        Course content, platform design, the COGNARA brand, and AI systems are proprietary. Students retain ownership of their notes, code submissions, and user-generated content. By uploading content, you grant COGNARA a non-exclusive license to display it within the platform context.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">4. AI Agent Usage</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        The AI agent provides educational assistance but is not a substitute for professional advice. Responses may contain inaccuracies. AI usage is subject to credit limits. Attempting to jailbreak, manipulate, or abuse the AI system is prohibited.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">5. Coach Responsibilities</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        Coaches must provide accurate qualifications during verification. Course content must be original or properly licensed. Coaches must respond to student inquiries and support tickets in a timely manner. COGNARA reserves the right to remove courses that violate quality standards.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">6. Payments & Refunds</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        When payment processing is enabled, all transactions are handled securely through Stripe. Refund policies are determined per-course by the coach, subject to platform minimums. AI credits are non-refundable once consumed.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">7. Account Suspension</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        We reserve the right to suspend or terminate accounts that violate these terms, engage in abuse, or pose security risks. Banned users will be redirected to a notice page and may appeal via the support channel.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">8. Limitation of Liability</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        COGNARA is provided &quot;as is&quot; without warranties of any kind. We are not liable for learning outcomes, data loss outside our security controls, or third-party service disruptions. Our total liability shall not exceed the amount paid by you in the preceding 12 months.
      </p>

      <h2 className="mt-8 text-lg font-bold text-cn-ink">9. Changes to Terms</h2>
      <p className="mt-3 text-sm text-cn-ink-muted">
        We may update these terms at any time. Material changes will be communicated via platform notification. Continued use after changes constitutes acceptance.
      </p>

      <p className="mt-10 text-sm text-cn-ink-muted">
        Questions? Contact us at <a className="text-cn-orange hover:underline" href="mailto:support@cognara.app">support@cognara.app</a>.
      </p>
    </article>
  );
}
