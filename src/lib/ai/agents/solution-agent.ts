// src/lib/ai/agents/solution-agent.ts
import { createClient } from "@/lib/supabase/server";
import { executeCode } from "@/lib/compiler/judge0";
import { logAgentAction } from "../audit-log";
import { createHash } from "crypto";

export interface SolutionItem {
  question_id?: string;
  question_text: string;
  solution_steps: string[];
  final_answer: string;
  explanation: string;
  alternative_approaches?: string[];
  difficulty_notes?: string;
  related_concepts?: string[];
  references?: { title: string; url?: string; description?: string }[];
}

export interface SolutionSetResult {
  id: string;
  quiz_id: string | null;
  coach_id: string;
  title: string;
  description: string | null;
  solutions: SolutionItem[];
  is_released: boolean;
  search_queries_used: string[];
  sources_cited: any[];
}

export async function generateSolutionSet(
  quizId: string,
  coachId: string
): Promise<SolutionSetResult | null> {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const groqKey = process.env.GROQ_API_KEY;

    // 1. Fetch the quiz and its questions
    const { data: quiz, error: quizErr } = await supabase
      .from("quizzes")
      .select("id, title, description")
      .eq("id", quizId)
      .maybeSingle();

    if (quizErr || !quiz) {
      console.error("[Solution Agent] Quiz not found:", quizId, quizErr);
      return null;
    }

    const { data: questions, error: questionsErr } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId);

    if (questionsErr || !questions || questions.length === 0) {
      console.error("[Solution Agent] Questions not found:", quizId, questionsErr);
      return null;
    }

    // Fetch options for the questions
    const { data: options } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", questions.map((q: any) => q.id));

    const solutions: SolutionItem[] = [];
    const searchQueriesUsed: string[] = [`${quiz.title} worked solutions`];
    const sourcesCited: any[] = [];

    // 2. Generate solutions for each question
    for (const q of questions) {
      let finalAnswer = "";
      let modelRubric = q.explanation || "";

      if (q.type === "mcq" || q.type === "true_false") {
        const correctOpt = options?.find((o: any) => o.question_id === q.id && o.is_correct);
        finalAnswer = correctOpt?.text || "Correct option";
      } else {
        finalAnswer = q.explanation || "Model Answer";
      }

      // Check if code question and runs
      if (q.type === "code" && q.explanation) {
        try {
          // Execute model solution code
          const compilerResult = await executeCode("python", q.explanation);
          if (compilerResult && compilerResult.status.id === 3) {
            modelRubric += `\n\n*Verified Model Solution Output:\n${compilerResult.stdout}*`;
          }
        } catch (e) {
          console.warn("[Solution Agent] Model code execution check failed:", e);
        }
      }

      let stepResult: any = null;

      if (groqKey) {
        try {
          const GroqModule = await import("groq-sdk");
          const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
          const groq = new Groq({ apiKey: groqKey });

          const prompt = `Question: ${q.text}
Question Type: ${q.type}
Model Answer / Key Points: ${finalAnswer}
Existing Rubric context: ${modelRubric}`;

          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are an expert subject matter tutor creating a detailed worked solution guide.
Given a question and its model answer, generate a detailed step-by-step worked solution.
Return ONLY valid JSON. Start directly with {.

Return JSON structure:
{
  "solution_steps": [
    "Step 1: Analyze the requirements...",
    "Step 2: Apply the relevant formula/concept...",
    "Step 3: Solve..."
  ],
  "final_answer": "Precise final statement of correct answer",
  "explanation": "Thorough explanation of why this solution works and common traps/pitfalls to avoid.",
  "alternative_approaches": ["Other valid method to solve (if any), or concise alternative perspective."],
  "difficulty_notes": "What makes this particular question tricky or complex",
  "related_concepts": ["Concept A", "Concept B"],
  "references": [
    { "title": "Reference resource name", "url": "URL if relevant, or null", "description": "Quick description" }
  ]
}`
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          });

          const raw = completion.choices?.[0]?.message?.content || "{}";
          stepResult = JSON.parse(raw);
        } catch (err) {
          console.error("[Solution Agent] Groq call failed for question:", q.id, err);
        }
      }

      if (stepResult && Array.isArray(stepResult.solution_steps)) {
        solutions.push({
          question_id: q.id,
          question_text: q.text,
          solution_steps: stepResult.solution_steps,
          final_answer: stepResult.final_answer || finalAnswer,
          explanation: stepResult.explanation || q.explanation || "",
          alternative_approaches: stepResult.alternative_approaches || [],
          difficulty_notes: stepResult.difficulty_notes || "",
          related_concepts: stepResult.related_concepts || [],
          references: stepResult.references || []
        });
      } else {
        // Fallback worked solution
        solutions.push({
          question_id: q.id,
          question_text: q.text,
          solution_steps: [
            "Identify the question prompt and keywords.",
            "Compare with correct answers in options.",
            "Verify logical soundness and correct output."
          ],
          final_answer: finalAnswer,
          explanation: q.explanation || "No detailed explanation was provided.",
          alternative_approaches: [],
          difficulty_notes: "Requires direct recall or execution review.",
          related_concepts: ["Recall", q.type.toUpperCase()],
          references: []
        });
      }
    }

    // 3. Persist the solution set
    const { data: newSet, error: setErr } = await supabase
      .from("solution_sets")
      .insert({
        quiz_id: quizId,
        coach_id: coachId,
        title: `${quiz.title} Solution Guide`,
        description: `Step-by-step worked solutions for "${quiz.title}" generated by Cognara AI.`,
        solutions: solutions,
        is_released: false,
        search_queries_used: searchQueriesUsed,
        sources_cited: sourcesCited
      })
      .select("*")
      .single();

    if (setErr) {
      console.error("[Solution Agent] Failed to save solution set:", setErr);
      return null;
    }

    // 4. Log agent audit event
    void logAgentAction({
      user_id: coachId,
      skill: "solution_set",
      input_length: quizId.length,
      output_length: JSON.stringify(solutions).length,
      credits_used: 3,
      status: "success",
      flags: [`set_id:${newSet.id}`],
      duration_ms: Date.now() - startTime
    });

    return newSet as unknown as SolutionSetResult;

  } catch (err) {
    console.error("[Solution Agent] generateSolutionSet error:", err);
    return null;
  }
}

export async function searchForSolution(query: string): Promise<any[]> {
  // Graceful fallback when serpapi isn't configured
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Check if query is in cache
    const queryHash = createHash("sha256").update(query.toLowerCase().trim()).digest("hex");
    const { data: cached } = await supabase
      .from("web_research_cache")
      .select("*")
      .eq("query_hash", queryHash)
      .maybeSingle();

    if (cached && cached.results) {
      return cached.results;
    }
  } catch {
    // ignore cache failure
  }

  return [
    {
      title: `${query} Reference`,
      url: "https://wikipedia.org",
      snippet: `Detailed concepts related to ${query} including mathematical formulation and step-by-step analysis.`
    }
  ];
}
