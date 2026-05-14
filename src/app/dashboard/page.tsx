import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student dashboard — COGNARA™",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 py-12 dark:bg-[#0A0A0A]">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
              COGNARA™
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-[#0A0A0A] dark:text-white">
              Student dashboard
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Signed in as{" "}
              <span className="font-medium text-neutral-900 dark:text-white">
                {user?.email}
              </span>
              {profile?.full_name ? (
                <>
                  {" "}
                  · {profile.full_name}
                </>
              ) : null}
              {profile?.role ? (
                <>
                  {" "}
                  · role: {profile.role}
                </>
              ) : null}
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#141414]">
          <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-white">
            Next build steps
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
            <li>
              Run{" "}
              <code className="rounded bg-neutral-100 px-1 font-mono text-xs dark:bg-neutral-800">
                supabase/migrations/0001_profiles_auth_trigger.sql
              </code>{" "}
              in the Supabase SQL editor so profiles and the auth trigger exist.
            </li>
            <li>
              Enrolled courses will live at{" "}
              <Link
                href="/my-courses"
                className="font-medium text-[#6366F1] hover:underline"
              >
                /my-courses
              </Link>{" "}
              (public catalog will use <code className="font-mono text-xs">/courses</code>{" "}
              to avoid a URL collision with the master spec).
            </li>
            <li>Student sidebar, agent shell, and billing land in the next slices.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
