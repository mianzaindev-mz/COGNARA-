/**
 * AI credit cost table and deduction logic.
 * Credits are checked BEFORE every agent action.
 *
 * Credit rules:
 * - Demo accounts (unauthenticated / demo session): UNLIMITED credits, never deducted
 * - Real users: 20 credits/day, reset every 24 hours (used or not)
 * - Coach/admin actions: always free (0 cost)
 */

import { isValidUUID } from "@/lib/utils/uuid";

export const CREDIT_COSTS = {
  ask_question: 1,
  explain_concept: 2,
  debug_code: 2,
  ai_take_notes: 2,
  generate_quiz: 3,
  learning_path: 3,
  voice_per_minute: 1,
  voice_session_10min: 5,
  // Coach tools: always free
  coach_generate_quiz: 0,
  coach_pdf_outline: 0,
  coach_analyze_students: 0,
  // Enhanced skill costs
  bug_eval: 0,
  transcript: 2,
  lecture_notes: 2,
  grade_quiz: 0,
  solution_set: 3,
  research: 3,
  schedule: 0,
  explain_mistake: 1,
  chat_pdf: 1,
  report_bug: 0,
  web_fetch: 1,
  flashcards: 2,
  code_challenge: 2,
  socratic: 1,
  concept_map: 3,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/** Daily free credit allowance for real users */
const DAILY_FREE_CREDITS = 20;

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number;
  cost: number;
  error?: string;
}

/**
 * Check if a student has enough credits and deduct if so.
 * Returns { allowed, remaining, cost, error? }.
 *
 * @param studentId - The student's UUID
 * @param action - The credit action to deduct
 * @param isDemo - Whether this is a demo/unauthenticated session (unlimited credits)
 */
export async function checkAndDeductCredits(
  studentId: string,
  action: CreditAction,
  isDemo = false,
): Promise<CreditCheckResult> {
  const cost = CREDIT_COSTS[action];

  // ── Demo accounts: unlimited credits, never deducted ──
  // Detected by explicit flag OR by known demo user IDs (belt-and-suspenders)
  const DEMO_USER_IDS = [
    "00000000-0000-0000-0000-000000000000",
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
  ];
  if (isDemo || DEMO_USER_IDS.includes(studentId)) {
    return { allowed: true, remaining: 999, cost: 0 };
  }

  // ── Free actions always pass ──
  if (cost === 0) {
    return { allowed: true, remaining: 999, cost: 0 };
  }

  if (!isValidUUID(studentId)) {
    if (studentId === "demo-student" || studentId === "background-agent" || process.env.NODE_ENV !== "production") {
      return { allowed: true, remaining: 999, cost: 0 };
    }
    return {
      allowed: false,
      remaining: 0,
      cost,
      error: "Invalid student ID",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get current credit record
    const { data: credits, error: fetchErr } = await supabase
      .from("ai_credits")
      .select("balance, daily_free_limit, last_daily_reset")
      .eq("user_id", studentId)
      .maybeSingle();

    if (fetchErr || !credits) {
      // No credits row yet — create one with default daily allowance
      const defaultBalance = DAILY_FREE_CREDITS;
      if (defaultBalance < cost) {
        return {
          allowed: false,
          remaining: defaultBalance,
          cost,
          error: `Insufficient credits. This costs ${cost} credits. You have ${defaultBalance}.`,
        };
      }
      // Create credits row with deduction
      await supabase.from("ai_credits").upsert({
        user_id: studentId,
        balance: defaultBalance - cost,
        daily_free_limit: DAILY_FREE_CREDITS,
        last_daily_reset: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      });
      return { allowed: true, remaining: defaultBalance - cost, cost };
    }

    // ── Daily reset check (24-hour cycle, resets whether credits were used or not) ──
    let currentBalance = credits.balance;
    const lastResetStr = credits.last_daily_reset;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (!lastResetStr || lastResetStr !== today) {
      // 24 hours have passed (or first use) — reset credits to daily limit
      const dailyLimit = credits.daily_free_limit ?? DAILY_FREE_CREDITS;
      currentBalance = dailyLimit;

      // Update the reset date and balance
      await supabase
        .from("ai_credits")
        .update({
          balance: dailyLimit,
          last_daily_reset: today,
        })
        .eq("user_id", studentId);
    }

    // ── Check if student has enough credits ──
    if (currentBalance < cost) {
      return {
        allowed: false,
        remaining: currentBalance,
        cost,
        error: `Insufficient credits. This costs ${cost} credits. You have ${currentBalance}. Credits reset daily at midnight.`,
      };
    }

    // ── Deduct ──
    const newBalance = currentBalance - cost;
    await supabase
      .from("ai_credits")
      .update({ balance: newBalance })
      .eq("user_id", studentId);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      user_id: studentId,
      amount: -cost,
      action,
      balance_after: newBalance,
    });

    return { allowed: true, remaining: newBalance, cost };
  } catch {
    // If Supabase not configured, allow with mock balance (dev mode)
    return { allowed: true, remaining: 50, cost };
  }
}
