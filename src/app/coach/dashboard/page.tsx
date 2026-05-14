import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coach dashboard — COGNARA™",
};

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_verified")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 py-12 dark:bg-[#0A0A0A]">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.15em] text-[#6366F1]">
              COGNARA™ · Coach
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-[#0A0A0A] dark:text-white">
              Coach dashboard
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              {user?.email}
              {profile?.full_name ? ` · ${profile.full_name}` : null}
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#141414]">
          <p className="text-sm text-neutral-700 dark:text-neutral-200">
            Verification status:{" "}
            <span className="font-semibold">
              {profile?.is_verified ? "verified" : "pending (wire in Day 4)"}
            </span>
          </p>
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            Course builder, earnings, and library management ship in the coach
            portal milestone. Return to the public site from{" "}
            <Link href="/" className="font-medium text-[#6366F1] hover:underline">
              home
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
