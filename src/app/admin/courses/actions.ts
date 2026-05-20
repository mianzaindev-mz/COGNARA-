"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function getCoursesWithCoaches() {
  await verifyAdmin();
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Fetch courses with coach details
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      category,
      is_published,
      is_featured,
      total_enrolled,
      coach_id,
      created_at,
      profiles:coach_id (
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // 2. Fetch auth users to build email map (admin only)
  let emailMap = new Map<string, string>();
  try {
    const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers({ perPage: 100 });
    if (authUsers) {
      emailMap = new Map(authUsers.map(u => [u.id, u.email ?? ""]));
    }
  } catch (err) {
    console.error("Failed to list auth users in courses server action:", err);
  }

  return (courses ?? []).map((c: any) => {
    const coachProfile = c.profiles;
    const coachEmail = coachProfile?.email || (coachProfile?.id ? emailMap.get(coachProfile.id) : "") || "No Email";
    return {
      id: c.id,
      title: c.title,
      category: c.category || "General",
      isPublished: !!c.is_published,
      isFeatured: !!c.is_featured,
      students: c.total_enrolled ?? 0,
      coachName: coachProfile?.full_name || "Unknown Coach",
      coachEmail,
      createdAt: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  });
}

export async function toggleCourseFeatured(courseId: string, isFeatured: boolean) {
  await verifyAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
    .eq("id", courseId);

  if (error) throw error;
  return { success: true };
}

export async function toggleCoursePublished(courseId: string, isPublished: boolean) {
  await verifyAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("id", courseId);

  if (error) throw error;
  return { success: true };
}
