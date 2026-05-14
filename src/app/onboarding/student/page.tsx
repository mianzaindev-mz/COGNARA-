import Link from "next/link";
import { completeOnboarding } from "@/app/onboarding/actions";

export default function StudentOnboardingPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
          COGNARA™
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0A0A0A] dark:text-white">
          Student onboarding
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          The full five-step wizard (goals, subjects, language, credits intro, and
          agent tour) ships in Day 2. For now, confirm you are ready to enter the
          student portal.
        </p>
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
        <li>Daily AI credits reset at midnight UTC.</li>
        <li>Peer sessions are student-hosted and explicitly disclaimed.</li>
        <li>Off-platform payment or contact solicitation is prohibited.</li>
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
