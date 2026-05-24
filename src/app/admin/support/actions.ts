"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAdminAgent } from "@/lib/ai/agents/admin-agent";
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
      priority,
      message,
      ai_review,
      ai_risk_score,
      ai_recommendation,
      ai_review_status,
      ai_reviewed_at,
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
      priority: t.priority ?? "normal",
      message: t.message ?? "",
      aiReview: t.ai_review ?? {},
      aiRiskScore: t.ai_risk_score ?? null,
      aiRecommendation: t.ai_recommendation ?? null,
      aiReviewStatus: t.ai_review_status ?? "not_reviewed",
      aiReviewedAt: t.ai_reviewed_at ?? null,
      createdAt: t.created_at,
      userName: profile?.full_name || "Unknown User",
      userEmail: email,
    };
  });
}

export async function updateTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") {
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID");
  }
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

export async function reviewTicketWithAgent(ticketId: string) {
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID");
  }
  await verifyAdmin();
  const supabase = createAdminClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, priority, message, evidence, created_at, user_id, reported_user_id, related_live_session_id")
    .eq("id", ticketId)
    .single();

  if (error) throw error;

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("sender_type, content, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  const agentPrompt = `Review this COGNARA support/report ticket for admin approval.

Ticket:
- Subject: ${ticket.subject}
- Category: ${ticket.category}
- Status: ${ticket.status}
- Priority: ${ticket.priority}
- Reporter user ID: ${ticket.user_id}
- Reported user ID: ${ticket.reported_user_id ?? "not provided"}
- Live session ID: ${ticket.related_live_session_id ?? "not provided"}
- Created: ${ticket.created_at}
- Message: ${ticket.message ?? "No direct message column present"}
- Evidence JSON: ${JSON.stringify(ticket.evidence ?? {})}
- Thread: ${JSON.stringify(messages ?? [])}

Return a careful admin review with:
1. Issue summary
2. Reporter and reported party, if known
3. Evidence available
4. Evidence still needed
5. If live/video misconduct is involved, likely timestamp fields to inspect and how support should validate them
6. Risk score from 0-100
7. Recommended admin action
8. Why admin approval is required before penalties`;

  const review = await runAdminAgent({ message: agentPrompt, mode: "operations" });
  const score = inferRiskScore(review.content, ticket.category, ticket.priority);
  const recommendation = inferRecommendation(score);

  const aiReview = {
    summary: review.content,
    generated_at: new Date().toISOString(),
    requires_admin_approval: true,
    ticket_category: ticket.category,
  };

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update({
      ai_review: aiReview,
      ai_risk_score: score,
      ai_recommendation: recommendation,
      ai_review_status: "pending_admin_approval",
      ai_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      priority: score >= 80 ? "urgent" : score >= 60 ? "high" : ticket.priority,
    })
    .eq("id", ticketId);

  if (updateError) throw updateError;

  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "ai_agent",
    content: review.content,
  });

  return {
    aiReview,
    aiRiskScore: score,
    aiRecommendation: recommendation,
    aiReviewStatus: "pending_admin_approval",
    aiReviewedAt: new Date().toISOString(),
  };
}

export async function decideTicketAiReview(ticketId: string, decision: "approved" | "rejected", reason: string) {
  if (!isValidUUID(ticketId)) {
    throw new Error("Invalid ticket ID");
  }
  await verifyAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({
      ai_review_status: decision,
      admin_decision_reason: reason.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) throw error;
  return { success: true };
}

function inferRiskScore(content: string, category: string, priority: string) {
  const lower = content.toLowerCase();
  let score = priority === "urgent" ? 80 : priority === "high" ? 65 : 35;
  if (["abuse_report", "content_flag"].includes(category)) score += 20;
  if (lower.includes("harassment") || lower.includes("misconduct") || lower.includes("cheating") || lower.includes("plagiarism")) score += 15;
  if (lower.includes("video") || lower.includes("live") || lower.includes("timestamp")) score += 10;
  if (lower.includes("insufficient evidence") || lower.includes("evidence needed")) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function inferRecommendation(score: number) {
  if (score >= 80) return "Escalate for urgent admin review before any enforcement action.";
  if (score >= 60) return "Flag for admin review and gather supporting evidence.";
  if (score >= 35) return "Keep open, request more evidence, and monitor.";
  return "Low immediate risk. Respond with guidance and close only after reporter confirms.";
}
