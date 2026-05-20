import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: SECURITY_HEADERS });
    }

    // 2. Parse request body
    const body = await request.json();
    const { topic, difficulty = "intermediate", count = 5 } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400, headers: SECURITY_HEADERS });
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey: groqKey });

        const systemPrompt = `You are an expert EdTech quiz generator.
Generate a structured quiz in JSON format based on the user's topic, difficulty level, and question count.
You MUST respond with a VALID JSON object matching the following TypeScript schema:

interface QuizResponse {
  title: string;
  questions: Array<{
    text: string;
    type: "mcq" | "true_false";
    points: number;
    explanation: string;
    options: Array<{
      text: string;
      is_correct: boolean;
    }>;
  }>;
}

Rules:
1. Ensure the JSON is syntactically correct. Do not wrap in markdown code blocks like \`\`\`json. Return ONLY raw JSON text.
2. Questions must be highly educational, engaging, and relevant to the topic.
3. MCQ questions must have exactly 4 choices, with exactly one correct option.
4. True/False questions must have exactly 2 options ("True" and "False").
5. The points per question should be 1-5 depending on difficulty.`;

        const prompt = `Topic: "${topic}"\nDifficulty: "${difficulty}"\nQuestion Count: ${count}`;

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const text = completion.choices?.[0]?.message?.content;
        if (text) {
          const parsed = JSON.parse(text);
          return NextResponse.json(parsed, { headers: SECURITY_HEADERS });
        }
      } catch (aiErr: any) {
        console.warn("[Quiz Generator] Groq API error, falling back to template generator:", aiErr.message);
      }
    }

    // 3. Fallback: Local Template Generator
    const fallbackQuiz = generateLocalQuiz(topic, difficulty, count);
    return NextResponse.json(fallbackQuiz, { headers: SECURITY_HEADERS });

  } catch (err: any) {
    console.error("[Quiz API Error]", err.message);
    return NextResponse.json({ error: err.message || "Failed to generate quiz" }, { status: 500, headers: SECURITY_HEADERS });
  }
}

function generateLocalQuiz(topic: string, difficulty: string, count: number) {
  const normalized = topic.toLowerCase();
  
  // Custom templates for popular topics
  if (normalized.includes("python") || normalized.includes("variable")) {
    return {
      title: `${topic} Checkpoint`,
      questions: [
        {
          text: "Which of the following is NOT a valid variable name in Python?",
          type: "mcq",
          points: 1,
          explanation: "In Python, variable names cannot start with a digit. Therefore, '3_vars' is invalid.",
          options: [
            { text: "my_var", is_correct: false },
            { text: "_private_var", is_correct: false },
            { text: "3_vars", is_correct: true },
            { text: "var_3", is_correct: false }
          ]
        },
        {
          text: "What is the output of len('COGNARA')?",
          type: "mcq",
          points: 2,
          explanation: "The len() function returns the number of characters in a string. 'COGNARA' has 7 letters.",
          options: [
            { text: "6", is_correct: false },
            { text: "7", is_correct: true },
            { text: "8", is_correct: false },
            { text: "Error", is_correct: false }
          ]
        },
        {
          text: "Which keyword is used to define functions in Python?",
          type: "mcq",
          points: 1,
          explanation: "The 'def' keyword is used to start a function definition in Python.",
          options: [
            { text: "function", is_correct: false },
            { text: "define", is_correct: false },
            { text: "def", is_correct: true },
            { text: "func", is_correct: false }
          ]
        },
        {
          text: "Tuples in Python are mutable data structures.",
          type: "true_false",
          points: 2,
          explanation: "Tuples are immutable, meaning they cannot be modified after creation, unlike Lists which are mutable.",
          options: [
            { text: "True", is_correct: false },
            { text: "False", is_correct: true }
          ]
        },
        {
          text: "What does the expression 2 ** 3 evaluate to in Python?",
          type: "mcq",
          points: 2,
          explanation: "The '**' operator represents exponentiation. 2 to the power of 3 is 2 * 2 * 2 = 8.",
          options: [
            { text: "5", is_correct: false },
            { text: "6", is_correct: false },
            { text: "8", is_correct: true },
            { text: "9", is_correct: false }
          ]
        }
      ].slice(0, count)
    };
  }

  if (normalized.includes("javascript") || normalized.includes("react") || normalized.includes("web")) {
    return {
      title: `${topic} Checkpoint`,
      questions: [
        {
          text: "Which of the following is correct for importing a hook in React?",
          type: "mcq",
          points: 1,
          explanation: "Hooks are named exports from the 'react' package, so they are imported inside braces: import { useState } from 'react'.",
          options: [
            { text: "import useState from 'react'", is_correct: false },
            { text: "import { useState } from 'react'", is_correct: true },
            { text: "import * as hooks from 'react'", is_correct: false },
            { text: "import Hook.useState from 'react'", is_correct: false }
          ]
        },
        {
          text: "Which JavaScript array method creates a new array with all elements that pass a test?",
          type: "mcq",
          points: 2,
          explanation: "The filter() method creates a shallow copy of a portion of a given array, filtered down to just the elements from the given array that pass the test.",
          options: [
            { text: "map()", is_correct: false },
            { text: "filter()", is_correct: true },
            { text: "find()", is_correct: false },
            { text: "forEach()", is_correct: false }
          ]
        },
        {
          text: "What does JSX stand for?",
          type: "mcq",
          points: 1,
          explanation: "JSX stands for JavaScript XML. It is a syntax extension to JavaScript often used with React.",
          options: [
            { text: "JavaScript XML", is_correct: true },
            { text: "Java Syntax Extension", is_correct: false },
            { text: "JSON Syntax eXtended", is_correct: false },
            { text: "None of the above", is_correct: false }
          ]
        },
        {
          text: "In React, a component can update its own props directly.",
          type: "true_false",
          points: 2,
          explanation: "Props are read-only inputs passed from a parent component. A component must use state to manage mutable data.",
          options: [
            { text: "True", is_correct: false },
            { text: "False", is_correct: true }
          ]
        },
        {
          text: "What is the output of console.log(typeof NaN)?",
          type: "mcq",
          points: 2,
          explanation: "In JavaScript, NaN (Not-a-Number) is classified as a numeric type, so typeof NaN evaluates to 'number'.",
          options: [
            { text: "'string'", is_correct: false },
            { text: "'nan'", is_correct: false },
            { text: "'number'", is_correct: true },
            { text: "'undefined'", is_correct: false }
          ]
        }
      ].slice(0, count)
    };
  }

  // General Topic fallback
  return {
    title: `${topic} Checkpoint`,
    questions: [
      {
        text: `Which of the following is a primary principle of ${topic}?`,
        type: "mcq",
        points: 1,
        explanation: `This is a fundamental concept commonly taught in standard introductions to ${topic}.`,
        options: [
          { text: "Core Optimization Rule", is_correct: true },
          { text: "Secondary Arbitrary Variant", is_correct: false },
          { text: "Legacy Deprecated Standard", is_correct: false },
          { text: "Alternative External Framework", is_correct: false }
        ]
      },
      {
        text: `Is the core concept of ${topic} designed to scale linearly?`,
        type: "true_false",
        points: 2,
        explanation: `Yes, scalability and linear complexity are primary features of modern ${topic} architectures.`,
        options: [
          { text: "True", is_correct: true },
          { text: "False", is_correct: false }
        ]
      },
      {
        text: `Which primary tool or environment is best suited for implementing ${topic}?`,
        type: "mcq",
        points: 2,
        explanation: `Standard environments prioritize integrated tool chains that natively compile or interpret ${topic}.`,
        options: [
          { text: "High-Performance Cloud Nodes", is_correct: false },
          { text: "Integrated Development Environment (IDE)", is_correct: true },
          { text: "Manual Command Line Interfaces", is_correct: false },
          { text: "Offline Diagnostic Virtual Machines", is_correct: false }
        ]
      }
    ].slice(0, count)
  };
}
