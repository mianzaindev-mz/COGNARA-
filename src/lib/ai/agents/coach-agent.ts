/**
 * Coach Agent — helps coaches build courses, generate quizzes, analyze students.
 * All coach agent actions are FREE (0 credits).
 */

import type { AgentResponse } from "./teach-agent";

export interface CoachAgentInput {
  message: string;
  tool?: "pdf_outline" | "generate_quiz" | "analyze_students";
}

export async function runCoachAgent(input: CoachAgentInput): Promise<AgentResponse> {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    const GroqModule = await import("groq-sdk");
    const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
    const groq = new Groq({ apiKey: groqKey });

    const systemPrompt = `You are COGNARA's coach AI agent. You help coaches create excellent learning experiences and operate their courses responsibly.

Core work:
1. Convert PDFs, transcripts, videos, notes, and lesson drafts into modules, lessons, summaries, quizzes, assignments, rubrics, and revision sheets
2. Generate assessments with difficulty levels, correct answers, rationales, and anti-cheating variants
3. Help grade work with rubrics, feedback drafts, and evidence-based improvement notes
4. Identify plagiarism or cheating risk signals cautiously, using phrases like "possible signal" and "requires human review"
5. Recommend interventions for struggling students from engagement, quiz, and progress patterns
6. Help coaches use COGNARA tools such as course builder, library, quizzes, analytics, support, and verification

Rules:
- Do not claim you changed production data unless a tool result is supplied.
- When asked to make course assets, produce ready-to-paste content with headings, timing, outcomes, and next actions.
- For plagiarism or cheating, never make final accusations. Provide evidence checklist, severity, and fair review steps.
- Keep markdown clean and practical. Use tables for rubrics, quiz banks, lesson plans, and review matrices.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.message },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    return {
      content: completion.choices?.[0]?.message?.content ?? "I couldn't process that request.",
      skill: "coach",
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }

  return generateCoachFallback(input);
}

function generateCoachFallback(input: CoachAgentInput): AgentResponse {
  if (input.tool === "generate_quiz") {
    return {
      content: `## 📝 Generated Quiz

### Topic: Python Fundamentals

**Q1.** What is the output of \`print(type(42))\`?
- a) \`<class 'float'>\`
- b) \`<class 'int'>\` ✅
- c) \`<class 'str'>\`
- d) \`<class 'number'>\`

**Q2.** Which keyword is used to define a function in Python?
- a) \`function\`
- b) \`func\`
- c) \`def\` ✅
- d) \`define\`

**Q3.** What does \`len([1, 2, 3])\` return?
- a) \`2\`
- b) \`3\` ✅
- c) \`4\`
- d) \`[1, 2, 3]\`

**Q4.** Which of these is an immutable data type?
- a) List
- b) Dictionary
- c) Set
- d) Tuple ✅

**Q5.** What is the correct syntax for a for loop?
- a) \`for i in range(5):\` ✅
- b) \`for (i = 0; i < 5; i++)\`
- c) \`foreach i in range(5)\`
- d) \`loop i from 0 to 5\`

---
*Connect your Groq API key for AI-generated quizzes on any topic with custom difficulty and question count.*`,
      skill: "coach",
    };
  }

  if (input.tool === "pdf_outline") {
    return {
      content: `## 📄 Course Outline Generator

Upload a PDF and I'll generate a full course outline. Here's an example:

### Python Masterclass — Course Outline

**Module 1: Getting Started** (3 lessons)
1. Installing Python & Setting Up Your Environment
2. Your First Python Program
3. Variables, Types, and Operators

**Module 2: Control Flow** (4 lessons)
4. If/Elif/Else Statements
5. For Loops and Iteration
6. While Loops
7. Error Handling with Try/Except

**Module 3: Data Structures** (4 lessons)
8. Lists and List Comprehensions
9. Dictionaries and Sets
10. Tuples and Named Tuples
11. Working with Strings

**Module 4: Functions** (3 lessons)
12. Defining and Calling Functions
13. Parameters, Arguments, and Return Values
14. Lambda Functions and Map/Filter

---
*Connect your Groq API key + upload a PDF to generate real course outlines.*`,
      skill: "coach",
    };
  }

  return {
    content: `## 🤖 Coach Agent Tools

These tools are **free** for all verified coaches:

### Available Tools
| Tool | Description |
|------|-------------|
| 📄 **PDF → Course Outline** | Upload a PDF, get a structured course outline |
| 📝 **Generate Quiz Bank** | Create quiz questions on any topic |
| 📊 **Analyze Students** | Get insights on student performance patterns |

### How to Use
1. Select a tool from the panel above
2. Provide the topic or upload your content
3. Review and edit the AI-generated output
4. Save directly to your course or quiz bank

*All coach AI tools are unlimited and free — it's our investment in quality content.*`,
    skill: "coach",
  };
}
