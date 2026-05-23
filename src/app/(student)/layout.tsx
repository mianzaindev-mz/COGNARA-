import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AgentFloatingButton } from "@/components/student/agent-floating-button";
import { StudentShell } from "@/components/student/student-shell";
import { loadStudentPortalStats } from "@/lib/student/portal-stats";

export default async function StudentPortalLayout({
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
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    user.email?.split("@")[0] ||
    "Student";

  const stats = await loadStudentPortalStats(user.id);

  return (
    <>
      <StudentShell
        displayName={displayName}
        email={user.email ?? undefined}
        creditBalance={stats.creditBalance}
      >
        {children}
      </StudentShell>
      <AgentFloatingButton userId={user.id} audience="student" />
    </>
  );
}
