import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

type PortalStubProps = {
  title: string;
  description?: string;
};

export function PortalStub({ title, description }: PortalStubProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 py-12 dark:bg-[#0A0A0A]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
              COGNARA™
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0A0A0A] dark:text-white">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                {description}
              </p>
            ) : null}
          </div>
          <SignOutButton />
        </header>
        <p className="text-sm text-neutral-700 dark:text-neutral-200">
          This surface is scaffolded for the Day 3 student portal milestone. Use
          the{" "}
          <Link href="/dashboard" className="font-medium text-[#6366F1] hover:underline">
            dashboard
          </Link>{" "}
          for navigation during the build.
        </p>
      </div>
    </div>
  );
}
