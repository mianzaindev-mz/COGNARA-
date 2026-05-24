import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isValidUUID } from "@/lib/utils/uuid";

export type StudentDbHealth = {
  configured: boolean;
  profileOk: boolean;
  settingsOk: boolean;
  creditsOk: boolean;
  enrollmentsOk: boolean;
  message: string | null;
};

export async function checkStudentDbHealth(userId: string): Promise<StudentDbHealth> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      profileOk: false,
      settingsOk: false,
      creditsOk: false,
      enrollmentsOk: false,
      message: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart npm run dev.",
    };
  }

  if (!isValidUUID(userId)) {
    return {
      configured: true,
      profileOk: false,
      settingsOk: false,
      creditsOk: false,
      enrollmentsOk: false,
      message: "Invalid user ID",
    };
  }

  try {
    const supabase = await createClient();

    const [profileRes, settingsRes, creditsRes, enrollmentsRes] = await Promise.all([
      supabase.from("profiles").select("id").eq("id", userId).maybeSingle(),
      supabase.from("user_settings").select("user_id").eq("user_id", userId).maybeSingle(),
      supabase.from("ai_credits").select("user_id").eq("user_id", userId).maybeSingle(),
      supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("student_id", userId),
    ]);

    const profileOk = !profileRes.error && Boolean(profileRes.data);
    const settingsOk = !settingsRes.error && Boolean(settingsRes.data);
    const creditsOk = !creditsRes.error;
    const enrollmentsOk = !enrollmentsRes.error;

    const schemaMissing =
      profileRes.error?.message?.includes("does not exist") ||
      settingsRes.error?.message?.includes("does not exist");

    let message: string | null = null;
    if (schemaMissing) {
      message =
        "Database tables are missing. Run supabase/migrations in the Supabase SQL editor (see docs/LOCAL_SETUP.md).";
    } else if (!profileOk) {
      message =
        "Profile row not found. Confirm handle_new_user trigger ran, or re-run migration 20250514180002_core_identity.sql.";
    } else if (!settingsOk) {
      message = "user_settings row missing — run core identity migration or complete registration again.";
    }

    return {
      configured: true,
      profileOk,
      settingsOk,
      creditsOk,
      enrollmentsOk,
      message,
    };
  } catch {
    return {
      configured: true,
      profileOk: false,
      settingsOk: false,
      creditsOk: false,
      enrollmentsOk: false,
      message: "Could not reach Supabase. Check keys in .env.local and project status.",
    };
  }
}
