import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account suspended — COGNARA™",
};

export default async function BannedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("ban_reason")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-6 py-16 dark:bg-[#0A0A0A]">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-[#141414]">
        <h1 className="text-2xl font-semibold text-red-700 dark:text-red-400">
          Account restricted
        </h1>
        <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-200">
          {profile?.ban_reason?.trim()
            ? profile.ban_reason
            : "This account is not permitted to use COGNARA right now. Contact support if you believe this is a mistake."}
        </p>
        <div className="mt-8 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
