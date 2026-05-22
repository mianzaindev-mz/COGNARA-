/**
 * Admin Agent - supports platform operations, verification, audit, and risk review.
 * This agent is internal and free because it supports trust and safety workflows.
 */

import type { AgentResponse } from "./teach-agent";

export interface AdminAgentInput {
  message: string;
  mode?: "operations" | "verify";
}

export async function runAdminAgent(input: AdminAgentInput): Promise<AgentResponse> {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: groqKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are COGNARA's internal admin AI agent.

You help administrators operate an education platform safely and fairly.
Core work:
- Coach verification checklists and decision support
- Course/content quality audits
- Support ticket triage
- Plagiarism, cheating, abuse, and policy risk analysis
- Support/report review with evidence timelines, including live-class/video timestamp ranges when provided
- Platform health summaries and operational action plans

Rules:
1. Do not claim you directly changed production data unless a tool result is supplied.
2. Give concrete next actions, severity, evidence needed, and escalation paths.
3. For cheating or plagiarism, use cautious language: "signals", "risk", "needs review".
4. Keep student/coach privacy in mind and recommend human review for penalties.
5. Format with concise markdown tables or checklists when useful.
6. For complaints or reports, always separate facts, claims, missing evidence, risk, and recommended admin decision.
7. For video/live-class misconduct, produce timestamp-focused review notes. If no timestamps are provided, list the timestamp ranges support must request before action.`,
        },
        { role: "user", content: input.message },
      ],
      temperature: 0.45,
      max_tokens: 1800,
    });

    return {
      content: completion.choices?.[0]?.message?.content ?? "I couldn't process that admin request.",
      skill: input.mode === "verify" ? "verify" : "admin",
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }

  return generateAdminFallback(input);
}

function generateAdminFallback(input: AdminAgentInput): AgentResponse {
  const verifyMode = input.mode === "verify";

  return {
    skill: verifyMode ? "verify" : "admin",
    content: verifyMode
      ? `## Coach Verification Review

Use this decision path before approving a coach:

| Check | What to Look For | Action |
|---|---|---|
| Identity | Name consistency across profile and documents | Flag mismatches |
| Credentials | Degree/certification issuer, dates, visible ID | Request clearer proof if incomplete |
| Teaching Fit | Course topic matches credential or portfolio | Approve only relevant scopes |
| Risk Signals | Edited files, missing metadata, repeated uploads | Escalate to human review |

### Recommendation
Mark the case as **needs human review** if any document is unclear, if names do not match, or if the course category is outside the coach's evidence. AI should support the decision, not replace the administrator.`
      : `## Admin Operations Agent

I can help review platform operations across support, content quality, verification, and abuse risk.

### Useful Admin Workflows
| Workflow | Output |
|---|---|
| Support triage | Severity, owner, response draft, SLA |
| Course audit | Quality score, policy risks, improvement notes |
| Plagiarism review | Similarity signals, evidence checklist, next action |
| Platform health | Risks, metrics to inspect, prioritized fixes |

### Example Prompt
"Audit this coach report and give severity, evidence needed, and the next admin action."

Connect GROQ_API_KEY for live model reasoning. Until then, I can still provide structured admin checklists and review plans.`,
  };
}
