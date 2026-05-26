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
import { runAdminAgent } from "./agents/admin-agent";
import type { AgentResponse } from "./agents/teach-agent";

export type AgentSkill = "teach" | "debug" | "quiz" | "voice" | "path" | "support" | "verify" | "coach" | "admin" | "flashcard" | "challenge" | "eli5";

const SKILL_CREDIT_MAP: Record<AgentSkill, CreditAction> = {
  teach: "ask_question",
  debug: "debug_code",
  quiz: "generate_quiz",
  voice: "voice_per_minute",
  path: "learning_path",
  support: "ask_question",
  verify: "coach_pdf_outline",
  coach: "coach_generate_quiz",
  admin: "coach_analyze_students",
  flashcard: "ask_question",
  challenge: "ask_question",
  eli5: "ask_question",
};

export interface AgentRequest {
  studentId: string;
  skill: AgentSkill;
  message: string;
  context?: AgentContext;
  /** Whether this is a demo/unauthenticated session (unlimited credits) */
  isDemo?: boolean;
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
  const isInternalAudience = req.context?.audience === "coach" || req.context?.audience === "admin";
  const creditAction = isInternalAudience ? "coach_analyze_students" : SKILL_CREDIT_MAP[req.skill];
  const creditResult = await checkAndDeductCredits(req.studentId, creditAction, req.isDemo ?? false);

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
    audience: req.context?.audience,
    voice_language: req.context?.voice_language,
  };

  // 4. Build Urdu language prefix if needed
  const isUrdu = context.voice_language === "ur";
  const urduPrefix = isUrdu
    ? `[LANGUAGE: RESPOND IN URDU (اردو). Use Roman Urdu for the main explanation. Keep code keywords, variable names, and syntax in English. Mix Urdu naturally like a tutor speaking to a Pakistani student. Example tone: "Yeh ek variable hai jo aap ki value store karta hai."]

`
    : "";

  // 5. Route to skill agent
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

    case "admin":
    case "verify":
      response = await runAdminAgent({
        message: req.message,
        mode: req.skill === "verify" ? "verify" : "operations",
      });
      break;

    case "quiz":
      if (req.context?.audience === "coach") {
        response = await runCoachAgent({
          message: `Create a high-quality coach-ready quiz or assessment from this request: ${req.message}`,
          tool: "generate_quiz",
        });
        response.skill = "quiz";
        break;
      }
      // Quiz generation uses teach agent with a quiz-focused prompt
      response = await runTeachAgent({
        message: `Generate a quiz with 5 questions on this topic: ${req.message}. Format each question with lettered options (a, b, c, d) and mark the correct answer with ✅.`,
        memory,
        context,
      });
      response.skill = "quiz";
      break;

    case "voice":
      // Voice uses teach agent — force Urdu if language is set
      response = await runTeachAgent({
        message: `${urduPrefix}${req.message}`,
        memory,
        context,
      });
      response.skill = "voice";
      break;

    case "flashcard":
      response = await runTeachAgent({
        message: `Create a set of 6 spaced-repetition flashcards on this topic: ${req.message}.

Format EACH flashcard like this:
---
### 🃏 Card N
**Front:** [Question or term]
**Back:** [Answer or definition — concise, 1-3 sentences max]
**Memory Tip:** [A mnemonic, analogy, or visual cue to help remember]
---

After all cards, add a "⚡ Quick Self-Test" section with 3 fill-in-the-blank questions from the cards above.`,
        memory,
        context,
      });
      response.skill = "flashcard";
      break;

    case "challenge":
      response = await runTeachAgent({
        message: `Create a timed coding challenge on this topic: ${req.message}.

Format it exactly like this:

## ⚡ Code Challenge
**Difficulty:** [Easy/Medium/Hard] · **Time Limit:** [5/10/15] minutes
**Language:** Python (or whatever is most relevant)

### The Problem
[Clear problem statement with constraints]

### Input/Output Examples
\`\`\`
Input: [example]
Output: [expected output]
\`\`\`

### Starter Code
\`\`\`python
def solve(input):
    # Your code here
    pass
\`\`\`

### Hints (reveal progressively)
1. 💡 [First hint — gentle nudge]
2. 💡 [Second hint — more specific]
3. 💡 [Third hint — nearly gives it away]

### Solution & Walkthrough
\`\`\`python
[Full solution with comments]
\`\`\`

**Why this works:** [Brief explanation of the approach and its time complexity]`,
        memory,
        context,
      });
      response.skill = "challenge";
      break;

    case "eli5":
      response = await runTeachAgent({
        message: `Explain this like I'm 5 years old: ${req.message}.

Rules:
- Use a real-world analogy that a child would understand (toys, food, playground, school, animals)
- Start with the analogy, then connect it to the real concept
- Use NO jargon whatsoever — if you must use a technical term, immediately explain it in parentheses
- Maximum 3 short paragraphs
- End with a "🎯 The One-Liner" that captures the entire concept in a single memorable sentence
- Add an "🧸 Analogy" callout box with the analogy
- Keep it warm, engaging, and fun — use emoji sparingly but effectively`,
        memory,
        context,
      });
      response.skill = "eli5";
      break;

    case "teach":
    default:
      response = await runTeachAgent({
        message: `${urduPrefix}${req.message}`,
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
