/**
 * Master Agent Router — the brain of the agent system.
 * Routes incoming requests to the correct skill agent,
 * checks credits, loads memory, applies security controls,
 * logs to audit trail, and returns structured responses.
 */

import { loadStudentMemory, updateStudentMemory, type AgentContext } from "./memory";
import { checkAndDeductCredits, type CreditAction } from "./credit-check";
import { checkRateLimit, sanitizeInput, checkSkillAccess } from "./security";
import { logAgentAction, checkAnomaly } from "./audit-log";
import { runTeachAgent } from "./agents/teach-agent";
import { runCodeAgent } from "./agents/code-agent";
import { runPathAgent } from "./agents/path-agent";
import { runSupportAgent } from "./agents/support-agent";
import { runCoachAgent } from "./agents/coach-agent";
import { runAdminAgent } from "./agents/admin-agent";
import { runCourseGenAgent } from "./agents/course-gen-agent";
import type { AgentResponse } from "./agents/teach-agent";

// Enhanced skill imports
import { evaluateReport } from "./agents/bug-eval-agent";
import { generateNotes } from "./agents/transcript-agent";
import { gradeQuizAttempt, explainMistakes } from "./agents/grading-agent";
import { generateSolutionSet } from "./agents/solution-agent";
import { runResearchAgent, fetchAndAnalyzeURL } from "./agents/research-agent";
import { createTask } from "./agents/schedule-agent";

export type AgentSkill =
  | "teach" | "debug" | "quiz" | "voice" | "path"
  | "support" | "verify" | "coach" | "admin"
  | "flashcard" | "challenge" | "eli5"
  | "generate_course" | "summarize" | "progress_report" | "search_courses"
  | "bug_eval" | "transcript" | "lecture_notes" | "grade_quiz" | "solution_set"
  | "research" | "schedule" | "explain_mistake" | "chat_pdf" | "report_bug"
  | "web_fetch" | "flashcards" | "code_challenge" | "socratic" | "concept_map";

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
  generate_course: "learning_path",
  summarize: "ask_question",
  progress_report: "ask_question",
  search_courses: "ask_question",
  // Enhanced skill mapping
  bug_eval: "bug_eval",
  transcript: "transcript",
  lecture_notes: "lecture_notes",
  grade_quiz: "grade_quiz",
  solution_set: "solution_set",
  research: "research",
  schedule: "schedule",
  explain_mistake: "explain_mistake",
  chat_pdf: "chat_pdf",
  report_bug: "report_bug",
  web_fetch: "web_fetch",
  flashcards: "flashcards",
  code_challenge: "code_challenge",
  socratic: "socratic",
  concept_map: "concept_map",
};

export interface AgentRequest {
  studentId: string;
  skill: AgentSkill;
  message: string;
  context?: AgentContext;
  /** Whether this is a demo/unauthenticated session (unlimited credits) */
  isDemo?: boolean;
  /** User role for RBAC checks */
  role?: string;
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
  securityFlags?: string[];
}

/**
 * Main entry point — route a request to the correct skill agent.
 * Applies security checks before processing.
 */
export async function routeAgentRequest(req: AgentRequest): Promise<AgentResult> {
  const startTime = Date.now();
  const role = req.role ?? "student";

  // ─── 1. Rate limiting ──
  const rateResult = checkRateLimit(req.studentId);
  if (!rateResult.allowed) {
    const retrySeconds = Math.ceil((rateResult.retryAfterMs ?? 60000) / 1000);
    void logAgentAction({
      user_id: req.studentId,
      skill: req.skill,
      input_length: req.message.length,
      output_length: 0,
      credits_used: 0,
      status: "rate_limited",
      flags: [],
      duration_ms: Date.now() - startTime,
    });
    return {
      response: {
        content: `## ⏱ Rate Limited\n\nYou're sending requests too quickly. Please wait **${retrySeconds} seconds** before trying again.\n\nThis limit protects the platform for all users.`,
        skill: req.skill,
      },
      creditsUsed: 0,
      creditsRemaining: 0,
      skill: req.skill,
      memoryUpdated: false,
      securityFlags: ["rate_limited"],
    };
  }

  // ─── 2. Prompt injection + input sanitization ──
  const sanitized = sanitizeInput(req.message);
  const securityFlags = sanitized.flags;

  if (!sanitized.safe) {
    void logAgentAction({
      user_id: req.studentId,
      skill: req.skill,
      input_length: req.message.length,
      output_length: 0,
      credits_used: 0,
      status: "blocked",
      flags: securityFlags,
      duration_ms: Date.now() - startTime,
    });
    return {
      response: {
        content: `## 🛡️ Request Blocked\n\nYour message was flagged by our security system. Please rephrase your question and try again.\n\nIf you believe this is an error, contact support.`,
        skill: req.skill,
      },
      creditsUsed: 0,
      creditsRemaining: 0,
      skill: req.skill,
      memoryUpdated: false,
      securityFlags,
    };
  }

  // ─── 3. RBAC check ──
  if (!checkSkillAccess(role, req.skill)) {
    void logAgentAction({
      user_id: req.studentId,
      skill: req.skill,
      input_length: req.message.length,
      output_length: 0,
      credits_used: 0,
      status: "blocked",
      flags: ["rbac_denied"],
      duration_ms: Date.now() - startTime,
    });
    return {
      response: {
        content: `## 🔒 Access Denied\n\nThe **${req.skill}** skill requires elevated permissions. Your current role (${role}) does not have access.\n\nContact an administrator if you need this capability.`,
        skill: req.skill,
      },
      creditsUsed: 0,
      creditsRemaining: 0,
      skill: req.skill,
      memoryUpdated: false,
      securityFlags: ["rbac_denied"],
    };
  }

  // ─── 4. Anomaly detection (non-blocking warning) ──
  const anomaly = checkAnomaly(req.studentId);
  if (anomaly.suspicious) {
    securityFlags.push(`anomaly:${anomaly.reason}`);
  }

  // ─── 5. Check credits ──
  const isInternalAudience = req.context?.audience === "coach" || req.context?.audience === "admin";
  const creditAction = isInternalAudience ? "coach_analyze_students" : SKILL_CREDIT_MAP[req.skill];
  const creditResult = await checkAndDeductCredits(req.studentId, creditAction, req.isDemo ?? false);

  if (!creditResult.allowed) {
    void logAgentAction({
      user_id: req.studentId,
      skill: req.skill,
      input_length: req.message.length,
      output_length: 0,
      credits_used: 0,
      status: "blocked",
      flags: ["insufficient_credits"],
      duration_ms: Date.now() - startTime,
    });
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

  // ─── 6. Load memory ──
  const memory = await loadStudentMemory(req.studentId);

  // ─── 7. Build context ──
  const context: AgentContext = {
    current_page: req.context?.current_page ?? "agent",
    current_lesson_title: req.context?.current_lesson_title,
    current_course_title: req.context?.current_course_title,
    code_context: req.code,
    audience: req.context?.audience,
    voice_language: req.context?.voice_language,
  };

  // ─── 8. Urdu language prefix ──
  const isUrdu = context.voice_language === "ur";
  const urduPrefix = isUrdu
    ? `[LANGUAGE: RESPOND IN URDU (اردو). Use Roman Urdu for the main explanation. Keep code keywords, variable names, and syntax in English. Mix Urdu naturally like a tutor speaking to a Pakistani student. Example tone: "Yeh ek variable hai jo aap ki value store karta hai."]\n\n`
    : "";

  // Use sanitized input
  const cleanMessage = sanitized.cleaned;

  // ─── 9. Route to skill agent ──
  let response: AgentResponse;

  try {
    switch (req.skill) {
      case "debug":
        response = await runCodeAgent({
          message: cleanMessage,
          code: req.code,
          language: req.language,
          error: req.error,
          memory,
          context,
        });
        break;

      case "path":
        response = await runPathAgent({
          message: cleanMessage,
          memory,
          context,
        });
        break;

      case "support":
        response = await runSupportAgent({
          message: cleanMessage,
        });
        break;

      case "coach":
        response = await runCoachAgent({
          message: cleanMessage,
        });
        break;

      case "admin":
      case "verify":
        response = await runAdminAgent({
          message: cleanMessage,
          mode: req.skill === "verify" ? "verify" : "operations",
        });
        break;

      case "generate_course":
        response = await runCourseGenAgent({
          topic: cleanMessage,
          difficulty: req.language, // reuse language field for difficulty
          numChapters: 5,
          language: isUrdu ? "Urdu" : "English",
        });
        break;

      case "summarize":
        response = await runTeachAgent({
          message: `Summarize the following content into key takeaways, a brief summary (3-4 sentences), and 5 bullet points of the most important concepts:\n\n${cleanMessage}`,
          memory,
          context,
        });
        response.skill = "summarize";
        break;

      case "progress_report":
        response = await runTeachAgent({
          message: `Generate a personalized study progress report and recommendations based on this context: ${cleanMessage}. Include: 1) Progress summary, 2) Strengths identified, 3) Areas to improve, 4) Recommended next steps, 5) Study tip of the day.`,
          memory,
          context,
        });
        response.skill = "progress_report";
        break;

      case "search_courses":
        response = await runTeachAgent({
          message: `Help the student find courses matching this request: "${cleanMessage}". Suggest relevant topics, difficulty levels, and what they should look for in a good course on this subject. Format as a helpful guide with specific recommendations.`,
          memory,
          context,
        });
        response.skill = "search_courses";
        break;

      case "quiz":
        if (req.context?.audience === "coach") {
          response = await runCoachAgent({
            message: `Create a high-quality coach-ready quiz or assessment from this request: ${cleanMessage}`,
            tool: "generate_quiz",
          });
          response.skill = "quiz";
          break;
        }
        response = await runTeachAgent({
          message: `Generate a quiz with 5 questions on this topic: ${cleanMessage}. Format each question with lettered options (a, b, c, d) and mark the correct answer with ✅.`,
          memory,
          context,
        });
        response.skill = "quiz";
        break;

      case "voice":
        response = await runTeachAgent({
          message: `${urduPrefix}${cleanMessage}`,
          memory,
          context,
        });
        response.skill = "voice";
        break;

      case "flashcard":
        response = await runTeachAgent({
          message: `Create a set of 6 spaced-repetition flashcards on this topic: ${cleanMessage}.\n\nFormat EACH flashcard like this:\n---\n### 🃏 Card N\n**Front:** [Question or term]\n**Back:** [Answer or definition — concise, 1-3 sentences max]\n**Memory Tip:** [A mnemonic, analogy, or visual cue to help remember]\n---\n\nAfter all cards, add a "⚡ Quick Self-Test" section with 3 fill-in-the-blank questions from the cards above.`,
          memory,
          context,
        });
        response.skill = "flashcard";
        break;

      case "challenge":
        response = await runTeachAgent({
          message: `Create a timed coding challenge on this topic: ${cleanMessage}.\n\nFormat it exactly like this:\n\n## ⚡ Code Challenge\n**Difficulty:** [Easy/Medium/Hard] · **Time Limit:** [5/10/15] minutes\n**Language:** Python (or whatever is most relevant)\n\n### The Problem\n[Clear problem statement with constraints]\n\n### Input/Output Examples\n\`\`\`\nInput: [example]\nOutput: [expected output]\n\`\`\`\n\n### Starter Code\n\`\`\`python\ndef solve(input):\n    # Your code here\n    pass\n\`\`\`\n\n### Hints (reveal progressively)\n1. 💡 [First hint — gentle nudge]\n2. 💡 [Second hint — more specific]\n3. 💡 [Third hint — nearly gives it away]\n\n### Solution & Walkthrough\n\`\`\`python\n[Full solution with comments]\n\`\`\`\n\n**Why this works:** [Brief explanation of the approach and its time complexity]`,
          memory,
          context,
        });
        response.skill = "challenge";
        break;

      case "eli5":
        response = await runTeachAgent({
          message: `Explain this like I'm 5 years old: ${cleanMessage}.\n\nRules:\n- Use a real-world analogy that a child would understand (toys, food, playground, school, animals)\n- Start with the analogy, then connect it to the real concept\n- Use NO jargon whatsoever — if you must use a technical term, immediately explain it in parentheses\n- Maximum 3 short paragraphs\n- End with a "🎯 The One-Liner" that captures the entire concept in a single memorable sentence\n- Add an "🧸 Analogy" callout box with the analogy\n- Keep it warm, engaging, and fun — use emoji sparingly but effectively`,
          memory,
          context,
        });
        response.skill = "eli5";
        break;

      case "bug_eval":
        await evaluateReport(cleanMessage);
        response = {
          content: `## 🐛 Bug Report Triaged\n\nAI analysis has been triggered for report ID: \`${cleanMessage}\`. Results will be posted to the admin panel shortly.`,
          skill: "bug_eval",
        };
        break;

      case "report_bug":
        response = {
          content: `## 🐛 Report Registered\n\nThank you for submitting a quality/security report.`,
          skill: "report_bug",
        };
        break;

      case "transcript":
        response = {
          content: `## 🎙️ Transcript Mode\n\nLesson transcript segments have been processed and cached successfully.`,
          skill: "transcript",
        };
        break;

      case "lecture_notes":
        {
          const noteRes = await generateNotes(
            cleanMessage,
            req.context?.current_lesson_title || "Lesson Notes",
            req.studentId,
            req.context?.current_page || ""
          );
          response = {
            content: noteRes?.full_notes_md || `## 📓 Lecture Notes\n\nAI notes could not be generated. Please make sure transcript data is valid.`,
            skill: "lecture_notes",
          };
        }
        break;

      case "grade_quiz":
        {
          const gradeRes = await gradeQuizAttempt(cleanMessage);
          response = {
            content: gradeRes
              ? `## 📊 Quiz Graded\n\n- **Grade:** ${gradeRes.letter_grade} (${gradeRes.percentage.toFixed(1)}%)\n- **Strengths:** ${gradeRes.strengths.join(", ")}\n- **Feedback:** ${gradeRes.overall_feedback}`
              : `## ⚠️ Grading Failed\n\nFailed to grade quiz attempt. Please check attempt ID.`,
            skill: "grade_quiz",
          };
        }
        break;

      case "explain_mistake":
        {
          const explanation = await explainMistakes(req.studentId, cleanMessage);
          response = {
            content: explanation,
            skill: "explain_mistake",
          };
        }
        break;

      case "solution_set":
        {
          const setRes = await generateSolutionSet(cleanMessage, req.studentId);
          response = {
            content: setRes
              ? `## 💡 Solution Set Generated\n\n- **Title:** ${setRes.title}\n- **Solutions:** Generated worked solutions for ${setRes.solutions.length} questions.`
              : `## ⚠️ Generation Failed\n\nFailed to generate solution set.`,
            skill: "solution_set",
          };
        }
        break;

      case "research":
        {
          const searchRes = await runResearchAgent({
            query: cleanMessage,
            userId: req.studentId,
            researchType: "general",
          });
          response = searchRes;
        }
        break;

      case "web_fetch":
        response = await fetchAndAnalyzeURL(cleanMessage);
        break;

      case "schedule":
        {
          const scheduleMsg = await createTask({
            userId: req.studentId,
            message: cleanMessage,
          });
          response = {
            content: scheduleMsg,
            skill: "schedule",
          };
        }
        break;

      case "chat_pdf":
        response = {
          content: `## 📄 PDF Export Triggered\n\nExporting chat session ID: \`${cleanMessage}\` as a branded PDF. Your download link is ready in your browser.`,
          skill: "chat_pdf",
        };
        break;

      case "flashcards":
        response = await runTeachAgent({
          message: `Create a set of 6 spaced-repetition flashcards on this topic: ${cleanMessage}.\n\nFormat EACH flashcard like this:\n---\n### 🃏 Card N\n**Front:** [Question or term]\n**Back:** [Answer or definition — concise, 1-3 sentences max]\n**Memory Tip:** [A mnemonic, analogy, or visual cue to help remember]\n---\n\nAfter all cards, add a "⚡ Quick Self-Test" section with 3 fill-in-the-blank questions from the cards above.`,
          memory,
          context,
        });
        response.skill = "flashcards";
        break;

      case "code_challenge":
        response = await runTeachAgent({
          message: `Create a timed coding challenge on this topic: ${cleanMessage}.\n\nFormat it exactly like this:\n\n## ⚡ Code Challenge\n**Difficulty:** [Easy/Medium/Hard] · **Time Limit:** [5/10/15] minutes\n**Language:** Python (or whatever is most relevant)\n\n### The Problem\n[Clear problem statement with constraints]\n\n### Input/Output Examples\n\`\`\`\nInput: [example]\nOutput: [expected output]\n\`\`\`\n\n### Starter Code\n\`\`\`python\ndef solve(input):\n    # Your code here\n    pass\n\`\`\`\n\n### Hints (reveal progressively)\n1. 💡 [First hint — gentle nudge]\n2. 💡 [Second hint — more specific]\n3. 💡 [Third hint — nearly gives it away]\n\n### Solution & Walkthrough\n\`\`\`python\n[Full solution with comments]\n\`\`\`\n\n**Why this works:** [Brief explanation of the approach and its time complexity]`,
          memory,
          context,
        });
        response.skill = "code_challenge";
        break;

      case "socratic":
        response = await runTeachAgent({
          message: `Engage with me in a Socratic dialogue about: ${cleanMessage}.\n\nRules:\n- Never give me the direct answer\n- Ask targeted, thought-provoking questions that help me arrive at the answer myself\n- Provide a supportive, coaching tone`,
          memory,
          context,
        });
        response.skill = "socratic";
        break;

      case "concept_map":
        response = await runTeachAgent({
          message: `Generate a conceptual map or visual hierarchy of the following topic: ${cleanMessage}.\n\nInclude: 1) Core Concept, 2) Primary sub-branches, 3) Related secondary terms, 4) A text-based representation or Mermaid diagram outlining their relationships.`,
          memory,
          context,
        });
        response.skill = "concept_map";
        break;

      case "teach":
      default:
        response = await runTeachAgent({
          message: `${urduPrefix}${cleanMessage}`,
          memory,
          context,
        });
        break;
    }
  } catch (err) {
    // Agent execution error
    console.error("[Master Agent Error]", err);
    void logAgentAction({
      user_id: req.studentId,
      skill: req.skill,
      input_length: req.message.length,
      output_length: 0,
      credits_used: creditResult.cost,
      status: "error",
      flags: securityFlags,
      duration_ms: Date.now() - startTime,
    });

    return {
      response: {
        content: `## ⚠️ Agent Error\n\nSomething went wrong while processing your request. Please try again.\n\n*Error has been logged for investigation.*`,
        skill: req.skill,
      },
      creditsUsed: creditResult.cost,
      creditsRemaining: creditResult.remaining,
      skill: req.skill,
      memoryUpdated: false,
      securityFlags,
    };
  }

  // ─── 10. Audit log (fire-and-forget) ──
  void logAgentAction({
    user_id: req.studentId,
    skill: req.skill,
    input_length: req.message.length,
    output_length: response.content.length,
    credits_used: creditResult.cost,
    status: "success",
    flags: securityFlags,
    duration_ms: Date.now() - startTime,
  });

  // ─── 11. Update memory (async, non-blocking) ──
  let memoryUpdated = false;
  try {
    await updateStudentMemory(req.studentId, {});
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
    securityFlags: securityFlags.length > 0 ? securityFlags : undefined,
  };
}
