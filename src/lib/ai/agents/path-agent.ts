/**
 * Path Agent — analyzes student history and recommends next courses/lessons.
 * Uses Groq API for reasoning over learning data.
 */

import { buildSystemPrompt, type AgentMemory, type AgentContext } from "../memory";
import type { AgentResponse } from "./teach-agent";

export interface PathAgentInput {
  message: string;
  memory: AgentMemory;
  context: AgentContext;
  enrolledCourses?: string[];
  completedCourses?: string[];
}

const PATH_QUALITY_ADDENDUM = `

QUALITY RULES:
- Produce a concrete plan with milestones, estimated effort, and next action.
- Explain the reasoning briefly, like a mentor, not a generic recommender.
- If evidence is missing, say what data would improve the recommendation.
- Keep it polished for the COGNARA renderer; do not mention Markdown or formatting syntax.`;

const PATH_ADDENDUM = `

ADDITIONAL ROLE: Learning Path Advisor
You analyze the student's learning history and recommend next steps.
When advising:
1. Reference their completed and enrolled courses
2. Identify skill gaps based on weak_topics
3. Suggest a concrete next step (specific course, lesson, or practice)
4. Explain WHY this path makes sense
5. Keep recommendations actionable — not vague

Format response as:
## 🗺️ Your Learning Path

### Where You Are
(current progress summary)

### Recommended Next Step
(specific action)

### Why This Path
(reasoning)`;

export async function runPathAgent(input: PathAgentInput): Promise<AgentResponse> {
  const basePrompt = buildSystemPrompt(input.memory, input.context);
  const systemPrompt = basePrompt + PATH_ADDENDUM + PATH_QUALITY_ADDENDUM;
  const groqKey = process.env.GROQ_API_KEY;

  let userMessage = input.message;
  if (input.enrolledCourses?.length) {
    userMessage += `\n\nEnrolled courses: ${input.enrolledCourses.join(", ")}`;
  }
  if (input.completedCourses?.length) {
    userMessage += `\nCompleted courses: ${input.completedCourses.join(", ")}`;
  }

  if (groqKey) {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: groqKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    });

    return {
      content: completion.choices?.[0]?.message?.content ?? "I couldn't generate a path.",
      skill: "path",
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }

  return generatePathFallback(input);
}

function generatePathFallback(input: PathAgentInput): AgentResponse {
  const weak = input.memory.weak_topics;
  const strong = input.memory.strong_topics;

  const weakSection = weak.length > 0
    ? `- **Areas to improve:** ${weak.join(", ")}`
    : "- No weak areas identified yet — keep learning!";

  const strongSection = strong.length > 0
    ? `- **Your strengths:** ${strong.join(", ")}`
    : "- Complete more lessons to identify your strengths";

  return {
    content: `## 🗺️ Your Learning Path

### Where You Are
${weakSection}
${strongSection}
- **Sessions completed:** ${input.memory.total_sessions}
- **Learning style:** ${input.memory.learning_style === "unknown" ? "Still identifying…" : input.memory.learning_style}

### Recommended Next Steps

1. **Complete your current course** — finishing what you start builds momentum
2. **Practice weak areas** — use the Code Lab to write exercises on ${weak[0] ?? "fundamentals"}
3. **Take quizzes** — test your understanding before moving on
4. **Try peer sessions** — teaching others reinforces your knowledge

### Suggested Learning Order
\`\`\`
Python Basics → Data Structures → Algorithms → Web Development
                    ↓
              Practice Projects → Build Portfolio → Share on LinkedIn
\`\`\`

*💡 Connect your Groq API key for AI-powered personalized path recommendations based on your actual quiz scores and progress data.*`,
    skill: "path",
  };
}
