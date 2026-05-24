"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUUID } from "@/lib/utils/uuid";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden: Administrator privileges required.");
  }
  return user;
}

export async function getUsersWithEmails() {
  await verifyAdmin();

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Fetch profiles
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_banned, ban_reason, created_at")
    .order("created_at", { ascending: false });

  if (profErr) throw profErr;

  // 2. Fetch auth users to resolve emails
  let emailMap = new Map<string, string>();
  try {
    const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers({ perPage: 100 });
    if (authUsers) {
      emailMap = new Map(authUsers.map((u: any) => [u.id, u.email ?? ""]));
    }
  } catch (err) {
    console.error("Failed to list auth users in server action:", err);
  }

  const profilesArray = Array.isArray(profiles) ? profiles : [];

  return profilesArray.map((p: any) => ({
    id: p.id,
    name: p.full_name || emailMap.get(p.id)?.split("@")[0] || "User",
    email: emailMap.get(p.id) || "",
    role: p.role || "student",
    status: p.is_banned ? "banned" : "active",
    banReason: p.ban_reason || "",
    joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }));
}

export async function updateUserRole(userId: string, role: "student" | "coach" | "admin") {
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID");
  }
  await verifyAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
  return { success: true };
}

export async function banUser(userId: string, isBanned: boolean, reason?: string) {
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID");
  }
  await verifyAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: isBanned,
      ban_reason: isBanned ? (reason?.trim() || "Account suspended by administrator.") : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (error) throw error;
  return { success: true };
}
