import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin dashboard — COGNARA™",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.15em] text-[#818CF8]">
              COGNARA™ · Admin
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Platform control</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Signed in as {user?.email}
            </p>
          </div>
          <SignOutButton className="border-neutral-600 text-white hover:bg-neutral-800" />
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
          <h2 className="text-lg font-semibold">Day 6 scope preview</h2>
          <p className="mt-3 text-sm text-neutral-300">
            Verification queue, security events, support tickets, and revenue
            charts connect here once the Supabase schema from the master document
            is fully applied. This route is restricted to{" "}
            <code className="rounded bg-neutral-900 px-1 font-mono text-xs">
              role = admin
            </code>{" "}
            via middleware (non-admins receive HTTP 404).
          </p>
          <p className="mt-4 text-sm text-neutral-400">
            <Link href="/" className="font-medium text-[#818CF8] hover:underline">
              ← Public site
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
