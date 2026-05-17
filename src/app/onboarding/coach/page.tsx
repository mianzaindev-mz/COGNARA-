import Link from "next/link";
import { completeOnboarding } from "@/app/onboarding/actions";
import { CognaraLogo } from "@/components/shared/cognara-logo";

export default function CoachOnboardingPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <CognaraLogo variant="full" size={28} />
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-cn-ink">
          Coach onboarding
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cn-ink-muted">
          This wizard will collect verification details, payout preferences, and
          profile polish. For the assignment build, use this step to confirm you
          understand the coach obligations, then continue.
        </p>
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-cn-ink-muted">
        <li>Verification is required before publishing paid courses.</li>
        <li>All paid transactions stay on COGNARA.</li>
        <li>Free resources marked permanent cannot revert to paid.</li>
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
