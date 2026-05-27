import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/quiz/grade — AI-assisted grading for code/text quiz questions.
 *
 * For MCQ/true_false questions, grading is done client-side via answer key comparison.
 * This endpoint evaluates free-text and code answers using pattern matching + heuristics.
 *
 * Request body:
 *   { quizId: string, answers: { questionId: string, type: string, text: string, questionText: string, explanation: string }[] }
 *
 * Response:
 *   { grades: { questionId: string, isCorrect: boolean, feedback: string, score: number }[] }
 */

type AnswerInput = {
  questionId: string;
  type: string;
  text: string;
  questionText: string;
  explanation: string;
};

type GradeResult = {
  questionId: string;
  isCorrect: boolean;
  feedback: string;
  score: number; // 0.0 - 1.0
};

/**
 * Heuristic grading for text/code answers when no LLM call is available.
 * Assigns partial credit based on relevance signals.
 */
function gradeTextAnswer(answer: string, questionText: string, explanation: string): { score: number; feedback: string } {
  const text = answer.trim().toLowerCase();
  const qText = questionText.toLowerCase();
  const expl = explanation.toLowerCase();

  if (!text || text.length < 5) {
    return { score: 0, feedback: "Answer is too short or empty. Please provide a substantive response." };
  }

  // Extract keywords from question + explanation
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "must", "ought",
    "what", "which", "who", "whom", "this", "that", "these", "those",
    "and", "but", "or", "nor", "for", "yet", "so", "in", "on", "at",
    "to", "of", "by", "from", "with", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "about", "it", "its",
    "not", "no", "how", "why", "when", "where", "if", "then", "than",
    "more", "most", "each", "every", "all", "both", "few", "some", "any",
    "other", "such", "only", "same", "very", "just", "because", "also",
  ]);

  const extractKeywords = (s: string): Set<string> => {
    return new Set(
      s.split(/[\s,.:;!?()\[\]{}"']+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
    );
  };

  const questionKeywords = extractKeywords(qText);
  const explanationKeywords = extractKeywords(expl);
  const allKeywords = new Set([...questionKeywords, ...explanationKeywords]);
  const answerWords = extractKeywords(text);

  // Count keyword matches
  let matches = 0;
  for (const word of answerWords) {
    if (allKeywords.has(word)) matches++;
  }

  const keywordCoverage = allKeywords.size > 0 ? matches / Math.min(allKeywords.size, 8) : 0;

  // Length bonus (not too short, not too long)
  const lengthScore = text.length >= 20 ? Math.min(1, text.length / 100) : text.length / 20;

  // Coherence bonus (sentences, no gibberish)
  const hasSentences = /[.!?]/.test(text) || text.length > 50;
  const coherenceBonus = hasSentences ? 0.1 : 0;

  const rawScore = Math.min(1, keywordCoverage * 0.6 + lengthScore * 0.3 + coherenceBonus);
  const finalScore = Math.round(rawScore * 100) / 100;

  let feedback: string;
  if (finalScore >= 0.8) {
    feedback = "Strong answer that demonstrates good understanding of the concept.";
  } else if (finalScore >= 0.5) {
    feedback = "Partial credit awarded. Your answer touches on some key concepts but could be more thorough.";
  } else if (finalScore >= 0.2) {
    feedback = "Your answer shows minimal understanding. Review the explanation for the correct approach.";
  } else {
    feedback = "Your answer does not appear to address the question. Please review the material and try again.";
  }

  return { score: finalScore, feedback };
}

/**
 * Heuristic grading for code answers.
 */
function gradeCodeAnswer(answer: string, questionText: string, explanation: string): { score: number; feedback: string } {
  const code = answer.trim();

  if (!code || code.length < 3) {
    return { score: 0, feedback: "No code provided. Please write a code solution." };
  }

  // Check for code patterns
  const codePatterns = [
    /function\s+\w+/i,           // function declaration
    /const\s+\w+/i,              // const variable
    /let\s+\w+/i,                // let variable
    /var\s+\w+/i,                // var variable
    /def\s+\w+/i,                // Python function
    /class\s+\w+/i,              // class declaration
    /if\s*\(/i,                  // if statement
    /for\s*\(/i,                 // for loop
    /while\s*\(/i,               // while loop
    /return\s+/i,                // return statement
    /import\s+/i,                // import
    /print\s*\(/i,               // print (Python)
    /console\s*\.\s*log/i,       // console.log (JS)
    /=>/,                        // arrow function
    /\{[\s\S]*\}/,               // code block
  ];

  let patternMatches = 0;
  for (const pattern of codePatterns) {
    if (pattern.test(code)) patternMatches++;
  }

  const isActualCode = patternMatches >= 1;
  const hasMultipleLines = code.split("\n").filter(l => l.trim().length > 0).length >= 2;

  // Extract keywords from question + explanation
  const qLower = questionText.toLowerCase();
  const explLower = explanation.toLowerCase();
  const codeLower = code.toLowerCase();

  // Check if key concepts from explanation appear in the code
  const conceptWords = [...new Set(
    (qLower + " " + explLower)
      .split(/[\s,.:;!?()\[\]{}"']+/)
      .filter(w => w.length > 3)
  )];

  let conceptMatches = 0;
  for (const word of conceptWords.slice(0, 10)) {
    if (codeLower.includes(word)) conceptMatches++;
  }
  const conceptCoverage = conceptWords.length > 0
    ? Math.min(1, conceptMatches / Math.min(conceptWords.length, 5))
    : 0;

  let rawScore = 0;
  if (isActualCode) rawScore += 0.3;
  if (hasMultipleLines) rawScore += 0.15;
  rawScore += conceptCoverage * 0.4;
  rawScore += Math.min(0.15, (code.length / 500) * 0.15);

  const finalScore = Math.min(1, Math.round(rawScore * 100) / 100);

  let feedback: string;
  if (!isActualCode) {
    feedback = "Your submission doesn't appear to be valid code. Please write a code solution.";
  } else if (finalScore >= 0.8) {
    feedback = "Well-structured code that addresses the problem effectively.";
  } else if (finalScore >= 0.5) {
    feedback = "Your code shows the right approach but may be incomplete. Review the explanation for hints.";
  } else {
    feedback = "Your code needs improvement. Review the concept and try incorporating the key patterns discussed.";
  }

  return { score: finalScore, feedback };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body as { answers: AnswerInput[] };

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "No answers provided" }, { status: 400 });
    }

    const grades: GradeResult[] = answers.map((a) => {
      const gradeFunc = a.type === "code" ? gradeCodeAnswer : gradeTextAnswer;
      const { score, feedback } = gradeFunc(a.text, a.questionText, a.explanation || "");

      return {
        questionId: a.questionId,
        isCorrect: score >= 0.5,
        feedback,
        score,
      };
    });

    return NextResponse.json({ grades });
  } catch (err: any) {
    console.error("Quiz grading error:", err);
    return NextResponse.json({ error: "Grading failed" }, { status: 500 });
  }
}
