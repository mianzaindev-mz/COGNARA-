import Link from "next/link";
import { completeOnboarding } from "@/app/onboarding/actions";

export default function CoachOnboardingPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
          COGNARA™
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0A0A0A] dark:text-white">
          Coach onboarding
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          This wizard will collect verification details, payout preferences, and
          profile polish. For the assignment build, use this step to confirm you
          understand the coach obligations, then continue.
        </p>
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
        <li>Verification is required before publishing paid courses.</li>
        <li>All paid transactions stay on COGNARA.</li>
        <li>Free resources marked permanent cannot revert to paid.</li>
      </ul>
      <form action={completeOnboarding} className="flex flex-col gap-4">
        <button
          type="submit"
          className="rounded-lg bg-[#6366F1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4F46E5]"
        >
          Mark onboarding complete
        </button>
        <Link
          href="/dashboard"
          className="text-center text-sm text-neutral-600 underline-offset-4 hover:underline dark:text-neutral-300"
        >
          Back to dashboard
        </Link>
      </form>
    </div>
  );
}
