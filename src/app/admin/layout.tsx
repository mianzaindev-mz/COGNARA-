import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { AgentFloatingButton } from "@/components/student/agent-floating-button";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Admin only — non-admins get 404 behavior (redirect to dashboard)
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Admin";

  return (
    <>
      <AdminShell displayName={displayName}>
        {children}
      </AdminShell>
      <AgentFloatingButton userId={user.id} audience="admin" />
    </>
  );
}
