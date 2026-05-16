/**
 * Master Agent Router — the brain of the agent system.
 * Routes incoming requests to the correct skill agent,
 * checks credits, loads memory, and returns structured responses.
 */

import { loadStudentMemory, updateStudentMemory, type AgentContext } from "./memory";
import { checkAndDeductCredits, type CreditAction } from "./credit-check";
import { runTeachAgent } from "./agents/teach-agent";
import { runCodeAgent } from "./agents/code-agent";
import { runPathAgent } from "./agents/path-agent";
import { runSupportAgent } from "./agents/support-agent";
import { runCoachAgent } from "./agents/coach-agent";
import type { AgentResponse } from "./agents/teach-agent";

export type AgentSkill = "teach" | "debug" | "quiz" | "voice" | "path" | "support" | "verify" | "coach";

/** Map skills to credit actions */
const SKILL_CREDIT_MAP: Record<AgentSkill, CreditAction> = {
  teach: "ask_question",
  debug: "debug_code",
  quiz: "generate_quiz",
  voice: "voice_per_minute",
  path: "learning_path",
  support: "ask_question", // support is free-ish (1 credit)
  verify: "coach_pdf_outline", // internal, free
  coach: "coach_generate_quiz", // free for coaches
};

export interface AgentRequest {
  studentId: string;
  skill: AgentSkill;
  message: string;
  context?: AgentContext;
  /** Extra data: code, language, error for debug skill */
  code?: string;
  language?: string;
  error?: string;
}

export interface AgentResult {
  response: AgentResponse;
  creditsUsed: number;
  creditsRemaining: number;
  skill: AgentSkill;
  memoryUpdated: boolean;
}

/**
 * Main entry point — route a request to the correct skill agent.
 */
export async function routeAgentRequest(req: AgentRequest): Promise<AgentResult> {
  // 1. Check credits
  const creditAction = SKILL_CREDIT_MAP[req.skill];
  const creditResult = await checkAndDeductCredits(req.studentId, creditAction);

  if (!creditResult.allowed) {
    return {
      response: {
        content: `## ⚡ Insufficient Credits\n\n${creditResult.error}\n\nYou can top up credits in **Billing** or wait for your daily free reset (20 credits/day).`,
        skill: req.skill,
      },
      creditsUsed: 0,
      creditsRemaining: creditResult.remaining,
      skill: req.skill,
      memoryUpdated: false,
    };
  }

  // 2. Load memory
  const memory = await loadStudentMemory(req.studentId);

  // 3. Build context
  const context: AgentContext = {
    current_page: req.context?.current_page ?? "agent",
    current_lesson_title: req.context?.current_lesson_title,
    current_course_title: req.context?.current_course_title,
    code_context: req.code,
  };

  // 4. Route to skill agent
  let response: AgentResponse;

  switch (req.skill) {
    case "debug":
      response = await runCodeAgent({
        message: req.message,
        code: req.code,
        language: req.language,
        error: req.error,
        memory,
        context,
      });
      break;

    case "path":
      response = await runPathAgent({
        message: req.message,
        memory,
        context,
      });
      break;

    case "support":
      response = await runSupportAgent({
        message: req.message,
      });
      break;

    case "coach":
      response = await runCoachAgent({
        message: req.message,
      });
      break;

    case "quiz":
      // Quiz generation uses teach agent with a quiz-focused prompt
      response = await runTeachAgent({
        message: `Generate a quiz with 5 questions on this topic: ${req.message}. Format each question with lettered options (a, b, c, d) and mark the correct answer with ✅.`,
        memory,
        context,
      });
      response.skill = "quiz";
      break;

    case "voice":
      // Voice uses teach agent (STT/TTS handled client-side)
      response = await runTeachAgent({
        message: req.message,
        memory,
        context,
      });
      response.skill = "voice";
      break;

    case "teach":
    default:
      response = await runTeachAgent({
        message: req.message,
        memory,
        context,
      });
      break;
  }

  // 5. Update memory (async, non-blocking)
  let memoryUpdated = false;
  try {
    await updateStudentMemory(req.studentId, {
      // Increment session count happens inside updateStudentMemory
    });
    memoryUpdated = true;
  } catch {
    // Non-critical failure
  }

  return {
    response,
    creditsUsed: creditResult.cost,
    creditsRemaining: creditResult.remaining,
    skill: req.skill,
    memoryUpdated,
  };
}
