import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/auth/roles";
import { isUserRole } from "@/lib/auth/roles";

export type AuthUser = User;

export async function requireUser(): Promise<AuthUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireProfile(): Promise<{
  user: AuthUser;
  role: UserRole;
  onboardingComplete: boolean;
}> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      user,
      role: "student",
      onboardingComplete: false,
    };
  }

  return {
    user,
    role: isUserRole(profile.role) ? profile.role : "student",
    onboardingComplete: Boolean(profile.onboarding_complete),
  };
}
