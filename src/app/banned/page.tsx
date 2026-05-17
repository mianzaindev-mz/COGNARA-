import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CognaraLogo } from "@/components/shared/cognara-logo";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-cn-canvas px-6 py-16">
      <div className="max-w-md rounded-2xl border border-rose-500/30 bg-cn-surface p-8 text-center shadow-sm">
        <CognaraLogo variant="icon" size={36} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-rose-700 dark:text-rose-400">
          Account restricted
        </h1>
        <p className="mt-4 text-sm text-cn-ink-muted">
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
