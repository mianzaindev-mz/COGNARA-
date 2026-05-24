/**
 * AI credit cost table and deduction logic.
 * Credits are checked BEFORE every agent action.
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
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number;
  cost: number;
  error?: string;
}

/**
 * Check if a student has enough credits and deduct if so.
 * Returns { allowed, remaining, cost, error? }.
 * When Supabase is not configured, returns a mock allowing everything.
 */
export async function checkAndDeductCredits(
  studentId: string,
  action: CreditAction,
): Promise<CreditCheckResult> {
  if (!isValidUUID(studentId)) {
    return {
      allowed: false,
      remaining: 0,
      cost: CREDIT_COSTS[action],
      error: "Invalid student ID",
    };
  }
  const cost = CREDIT_COSTS[action];

  // Free actions always pass
  if (cost === 0) {
    return { allowed: true, remaining: 999, cost: 0 };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Get current balance
    const { data: credits, error: fetchErr } = await supabase
      .from("ai_credits")
      .select("balance")
      .eq("user_id", studentId)
      .maybeSingle();

    if (fetchErr || !credits) {
      // If no credits row, student starts with 20 free
      const defaultBalance = 20;
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
        daily_free_limit: 20,
      });
      return { allowed: true, remaining: defaultBalance - cost, cost };
    }

    if (credits.balance < cost) {
      return {
        allowed: false,
        remaining: credits.balance,
        cost,
        error: `Insufficient credits. This costs ${cost} credits. You have ${credits.balance}.`,
      };
    }

    // Deduct
    const newBalance = credits.balance - cost;
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
    // If Supabase not configured, allow with mock balance
    return { allowed: true, remaining: 50, cost };
  }
}
