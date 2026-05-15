import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { CoachShell } from "@/components/coach/coach-shell";

export default async function CoachLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isSupabaseConfigured()) {
    redirect("/setup");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  // Allow admin to view coach portal too
  if (profile?.role !== "coach" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Coach";

  return (
    <CoachShell
      displayName={displayName}
      email={user.email ?? undefined}
      isVerified={profile?.is_verified ?? false}
      monthlyEarnings={0}
    >
      {children}
    </CoachShell>
  );
}
