import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { CoachShell } from "@/components/coach/coach-shell";
import { AgentFloatingButton } from "@/components/student/agent-floating-button";

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

  // Fetch coach's courses to calculate net monthly earnings dynamically
  const { data: courses } = await supabase
    .from("courses")
    .select("total_enrolled, price_usd")
    .eq("coach_id", user.id);

  const monthlyEarnings = (courses ?? []).reduce(
    (sum: number, c: any) => sum + (c.total_enrolled ?? 0) * (Number(c.price_usd) || 0) * 0.8,
    0
  );

  return (
    <>
      <CoachShell
        displayName={displayName}
        monthlyEarnings={monthlyEarnings}
      >
        {children}
      </CoachShell>
      <AgentFloatingButton userId={user.id} audience="coach" />
    </>
  );
}
