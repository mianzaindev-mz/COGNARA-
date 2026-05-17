import Link from "next/link";
import { completeOnboarding } from "@/app/onboarding/actions";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export default function StudentOnboardingPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <CognaraLogo variant="full" size={28} />
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-cn-ink">
          Student onboarding
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cn-ink-muted">
          The full five-step wizard (goals, subjects, language, credits intro, and
          agent tour) ships in Day 2. For now, confirm you are ready to enter the
          student portal.
        </p>
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-cn-ink-muted">
        <li>Daily AI credits reset at midnight UTC.</li>
        <li>Peer sessions are student-hosted and explicitly disclaimed.</li>
        <li>Off-platform payment or contact solicitation is prohibited.</li>
      </ul>
      <form action={completeOnboarding} className="flex flex-col gap-4">
        <button
          type="submit"
          className="rounded-xl bg-cn-orange px-4 py-3 text-sm font-bold text-white transition hover:bg-cn-orange-hover"
        >
          Mark onboarding complete
        </button>
        <Link
          href="/dashboard"
          className="text-center text-sm text-cn-ink-muted underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </form>
    </div>
  );
}
