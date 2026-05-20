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

export async function getTickets() {
  await verifyAdmin();
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Fetch tickets with profile joins
  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select(`
      id,
      subject,
      category,
      status,
      created_at,
      user_id,
      profiles:user_id (
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  // 2. Fetch auth users to build email map (admin fallback)
  let emailMap = new Map<string, string>();
  try {
    const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers({ perPage: 100 });
    if (authUsers) {
      emailMap = new Map(authUsers.map(u => [u.id, u.email ?? ""]));
    }
  } catch (err) {
    console.error("Failed to list auth users in tickets server action:", err);
  }

  return (tickets ?? []).map((t: any) => {
    const profile = t.profiles;
    const email = profile?.email || (t.user_id ? emailMap.get(t.user_id) : "") || "No Email";
    return {
      id: t.id,
      subject: t.subject,
      category: t.category,
      status: t.status,
      createdAt: t.created_at,
      userName: profile?.full_name || "Unknown User",
      userEmail: email,
    };
  });
}

export async function updateTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") {
  await verifyAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId);

  if (error) throw error;
  return { success: true };
}
