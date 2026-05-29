// src/lib/ai/agents/grading-agent.ts
import { createClient } from "@/lib/supabase/server";
import { executeCode } from "@/lib/compiler/judge0";
import { logAgentAction } from "../audit-log";

export interface GradedSubmission {
  id: string;
  student_id: string;
  quiz_id: string;
  attempt_id: string;
  course_id: string | null;
  coach_id: string | null;
  grade_scale_id: string | null;
  raw_score: number;
  max_score: number;
  percentage: number;
  letter_grade: string;
  grade_point: number;
  passed: boolean;
  question_grades: any[];
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommended_resources: string[];
  grading_method: "ai" | "manual" | "hybrid" | "exact";
  finalized: boolean;
  finalized_at: string;
}

export async function gradeQuizAttempt(attemptId: string): Promise<GradedSubmission | null> {
  const startTime = Date.now();
  try {
    const supabase = await createClient();

    // 1. Fetch quiz attempt, quiz, questions, options, and student answers
    const { data: attempt, error: attemptErr } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        student:student_id (id, full_name),
        quiz:quiz_id (
          id,
          title,
          lesson_id,
          coach_id,
          pass_score,
          lessons:lesson_id (
            id,
            course_id
          )
        )
      `)
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptErr || !attempt) {
      console.error("[Grading Agent] Attempt not found:", attemptId, attemptErr);
      return null;
    }

    const studentId = attempt.student_id;
    const quiz = attempt.quiz;
    const quizId = quiz.id;
    const coachId = quiz.coach_id;
    
    // Find course_id if linked through lessons
    const courseId = quiz.lessons?.course_id || null;

    // Fetch quiz answers submitted by the student
    const { data: answers, error: answersErr } = await supabase
      .from("quiz_answers")
      .select("*")
      .eq("attempt_id", attemptId);

    if (answersErr || !answers) {
      console.error("[Grading Agent] Answers not found:", attemptId, answersErr);
      return null;
    }

    // Fetch all questions for this quiz
    const { data: questions, error: questionsErr } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId);

    if (questionsErr || !questions) {
      console.error("[Grading Agent] Questions not found for quiz:", quizId, questionsErr);
      return null;
    }

    // Fetch question options (for MCQ / True-False)
    const { data: options } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", questions.map((q: any) => q.id));

    // 2. Fetch grade scale assigned to this quiz or coach's default
    let gradeScaleId: string | null = null;
    let gradesArray = getStandardGradeScale();
    let passingLetter = "D";

    // Attempt to fetch coach's default scale
    const { data: scale } = await supabase
      .from("grade_scales")
      .select("*")
      .eq("coach_id", coachId)
      .eq("is_default", true)
      .maybeSingle();

    if (scale) {
      gradeScaleId = scale.id;
      if (Array.isArray(scale.grades)) {
        gradesArray = scale.grades;
      }
      if (scale.passing_grade) {
        passingLetter = scale.passing_grade;
      }
    }

    const questionGrades: any[] = [];
    let rawScore = 0;
    let maxScore = 0;

    const groqKey = process.env.GROQ_API_KEY;

    // 3. Grade each question
    for (const q of questions) {
      const qPoints = q.points || 1;
      maxScore += qPoints;

      const studentAnswer = answers.find((a: any) => a.question_id === q.id);
      const answerText = studentAnswer?.answer_text || "";
      const selectedOptionId = studentAnswer?.selected_option_id || null;

      let scoreRatio = 0; // 0.0 - 1.0
      let feedback = "";
      let gradedBy: "exact" | "ai" | "manual" = "exact";
      let partialCredit = false;

      if (q.type === "mcq" || q.type === "true_false") {
        // Exact match grading
        gradedBy = "exact";
        const correctOption = options?.find((o: any) => o.question_id === q.id && o.is_correct);
        if (correctOption && selectedOptionId === correctOption.id) {
          scoreRatio = 1.0;
          feedback = "Correct answer.";
        } else {
          scoreRatio = 0.0;
          const correctOptText = correctOption?.text || "Correct option";
          feedback = `Incorrect. The correct answer was: "${correctOptText}".`;
        }

        // Update answer in database with exact match outcome
        if (studentAnswer) {
          await supabase
            .from("quiz_answers")
            .update({ is_correct: scoreRatio === 1.0 })
            .eq("id", studentAnswer.id);
        }
      } else if (q.type === "text") {
        // Text semantic grading via Groq
        gradedBy = "ai";
        if (!answerText.trim()) {
          scoreRatio = 0.0;
          feedback = "No answer provided.";
        } else if (groqKey) {
          const evalResult = await gradeTextAnswerViaGroq(groqKey, q.text, q.explanation || "", answerText, qPoints);
          if (evalResult) {
            scoreRatio = evalResult.score;
            feedback = evalResult.feedback;
            partialCredit = evalResult.partial_credit_reason ? true : false;
          } else {
            scoreRatio = 0.0;
            feedback = "AI grading failed. Pending human review.";
          }
        } else {
          // Local fallback semantic grading
          if (q.explanation && checkTextOverlap(answerText, q.explanation)) {
            scoreRatio = 0.8;
            feedback = "Answer contains relevant keywords. Standard local fallback grading applied.";
          } else {
            scoreRatio = 0.3;
            feedback = "Answer recorded. Local fallback grading applied.";
          }
        }

        if (studentAnswer) {
          await supabase
            .from("quiz_answers")
            .update({ is_correct: scoreRatio >= 0.7 })
            .eq("id", studentAnswer.id);
        }
      } else if (q.type === "code") {
        // Code grading (execution + semantic review)
        gradedBy = "ai";
        if (!answerText.trim()) {
          scoreRatio = 0.0;
          feedback = "No code submitted.";
        } else {
          // Execute code via compiler
          let stdout = "";
          let compileErr = "";
          try {
            const exec = await executeCode("python", answerText);
            stdout = exec.stdout || "";
            compileErr = exec.compile_output || exec.stderr || "";
          } catch (e) {
            compileErr = String(e);
          }

          if (groqKey) {
            const codeEval = await gradeCodeAnswerViaGroq(groqKey, q.text, q.code_starter || "", answerText, stdout, compileErr, qPoints);
            if (codeEval) {
              scoreRatio = codeEval.score;
              feedback = codeEval.feedback;
              partialCredit = scoreRatio > 0 && scoreRatio < 1;
            } else {
              scoreRatio = compileErr ? 0.0 : 0.5;
              feedback = compileErr ? `Execution error:\n${compileErr}` : "Code executed successfully. Pending detail AI feedback.";
            }
          } else {
            // Local fallback
            if (compileErr) {
              scoreRatio = 0.2;
              feedback = `Compilation/Execution Error:\n${compileErr}`;
            } else {
              scoreRatio = 1.0;
              feedback = "Code compiles and runs successfully.";
            }
          }
        }

        if (studentAnswer) {
          await supabase
            .from("quiz_answers")
            .update({ is_correct: scoreRatio >= 0.7 })
            .eq("id", studentAnswer.id);
        }
      }

      const pointsEarned = scoreRatio * qPoints;
      rawScore += pointsEarned;

      questionGrades.push({
        question_id: q.id,
        student_answer: answerText || (selectedOptionId ? options?.find((o: any) => o.id === selectedOptionId)?.text : ""),
        correct_answer: q.type === "mcq" || q.type === "true_false" ? options?.find((o: any) => o.question_id === q.id && o.is_correct)?.text : (q.explanation || ""),
        points_earned: pointsEarned,
        points_possible: qPoints,
        ai_score: scoreRatio,
        ai_feedback: feedback,
        partial_credit: partialCredit,
        graded_by: gradedBy
      });
    }

    // 4. Calculate stats and percentage
    const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

    // Map percentage to letter grade
    const matchedGrade = gradesArray
      .filter((g: any) => percentage >= g.min_pct && percentage <= g.max_pct)
      .sort((a: any, b: any) => b.min_pct - a.min_pct)[0] || { letter: "F", grade_point: 0.0, label: "Fail" };

    const letterGrade = matchedGrade.letter;
    const gradePoint = matchedGrade.grade_point;

    // Check if passed using the letter index check
    const lettersOrder = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
    const attemptIndex = lettersOrder.indexOf(letterGrade);
    const passingIndex = lettersOrder.indexOf(passingLetter);
    const passed = attemptIndex <= passingIndex && letterGrade !== "F";

    // 5. Generate overall feedback via Groq
    let overallFeedback = `You scored ${rawScore.toFixed(1)} out of ${maxScore} points (${percentage.toFixed(1)}%).`;
    let strengths: string[] = [];
    let areasForImprovement: string[] = [];
    let recommendedResources: string[] = [];

    if (groqKey) {
      try {
        const feedbackObj = await generateOverallFeedbackViaGroq(groqKey, quiz.title, percentage, questionGrades);
        if (feedbackObj) {
          overallFeedback = feedbackObj.overall_feedback;
          strengths = feedbackObj.strengths || [];
          areasForImprovement = feedbackObj.areas_for_improvement || [];
          recommendedResources = feedbackObj.recommended_resources || [];
        }
      } catch (err) {
        console.error("[Grading Agent] Failed to generate overall feedback:", err);
      }
    }

    // Insert into graded_submissions
    const { data: newSubmission, error: subErr } = await supabase
      .from("graded_submissions")
      .insert({
        student_id: studentId,
        quiz_id: quizId,
        attempt_id: attemptId,
        course_id: courseId,
        coach_id: coachId,
        grade_scale_id: gradeScaleId,
        raw_score: rawScore,
        max_score: maxScore,
        percentage: percentage,
        letter_grade: letterGrade,
        grade_point: gradePoint,
        passed: passed,
        question_grades: questionGrades,
        overall_feedback: overallFeedback,
        strengths: strengths,
        areas_for_improvement: areasForImprovement,
        recommended_resources: recommendedResources,
        grading_method: "ai",
        finalized: true,
        finalized_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (subErr) {
      console.error("[Grading Agent] Failed to insert graded_submission:", subErr);
      return null;
    }

    // Update quiz_attempts with the results
    await supabase
      .from("quiz_attempts")
      .update({
        score: Math.round(percentage),
        passed: passed,
        completed_at: new Date().toISOString()
      })
      .eq("id", attemptId);

    // Create notification for student
    await supabase.from("notifications").insert({
      user_id: studentId,
      type: "system",
      title: "Quiz Graded",
      message: `Your attempt on quiz "${quiz.title}" has been graded. Result: ${letterGrade} (${percentage.toFixed(0)}%).`,
      is_read: false,
    });

    // Log agent action audit trail
    void logAgentAction({
      user_id: studentId,
      skill: "grade_quiz",
      input_length: attemptId.length,
      output_length: overallFeedback.length,
      credits_used: 0,
      status: "success",
      flags: [`grade:${letterGrade}`, `passed:${passed}`],
      duration_ms: Date.now() - startTime
    });

    return newSubmission;

  } catch (error) {
    console.error("[Grading Agent] grading pipeline failed:", error);
    return null;
  }
}

export async function explainMistakes(studentId: string, attemptId: string): Promise<string> {
  try {
    const supabase = await createClient();

    // Fetch submission details
    const { data: sub } = await supabase
      .from("graded_submissions")
      .select(`
        *,
        quiz:quiz_id (title)
      `)
      .eq("attempt_id", attemptId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (!sub) {
      return "No graded submission record found for this attempt.";
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return `### Mistake Explanation: ${sub.quiz?.title || "Quiz"}
Here is a review of your attempt:
- You scored **${sub.raw_score}/${sub.max_score}** (${sub.percentage}%).
- Grade earned: **${sub.letter_grade}**.

*Review individual feedback on wrong answers in your Grade Book panel.*`;
    }

    const GroqModule = await import("groq-sdk");
    const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
    const groq = new Groq({ apiKey: groqKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an academic mentor. Explain the mistakes the student made on their quiz.
Use clean markdown layout:
- Start with a encouraging 1-sentence summary of the attempt.
- Under ## Incorrect Questions: list each question they got wrong (score < 1.0).
- For each wrong question, specify: the question, their answer, the correct answer, and a friendly, 2-sentence explanation of the core concept they got wrong.
- Provide a brief 2-sentence study tip to close.`
        },
        {
          role: "user",
          content: `Quiz: ${sub.quiz?.title || "Assessment"}
Raw Score: ${sub.raw_score}/${sub.max_score}
Grade: ${sub.letter_grade}
Detailed Question Grades: ${JSON.stringify(sub.question_grades)}`
        }
      ],
      temperature: 0.6,
      max_tokens: 1500
    });

    return completion.choices?.[0]?.message?.content || "Could not generate explanations.";

  } catch (err) {
    console.error("[Grading Agent] explainMistakes error:", err);
    return "Failed to retrieve mistake explanations due to system error.";
  }
}

/* ── Groq API calls helper functions ─────────────────────── */

async function gradeTextAnswerViaGroq(apiKey: string, question: string, rubric: string, answer: string, points: number) {
  try {
    const GroqModule = await import("groq-sdk");
    const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an academic grader. Grade the student's text answer.
Return ONLY valid JSON. Start directly with {.

Return structure:
{
  "score": number between 0.0 and 1.0,
  "feedback": "1-2 sentences explaining what was correct and what was missing",
  "key_concepts_present": string[],
  "key_concepts_missing": string[],
  "partial_credit_reason": string
}`
        },
        {
          role: "user",
          content: `Question: ${question}
Model Answer/Rubric: ${rubric}
Student's Answer: ${answer}
Max Points: ${points}`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    return {
      score: typeof parsed.score === "number" ? parsed.score : 0.0,
      feedback: parsed.feedback || "Graded by AI.",
      partial_credit_reason: parsed.partial_credit_reason || ""
    };
  } catch (e) {
    console.error("[Grading AI] Groq text check failed:", e);
    return null;
  }
}

async function gradeCodeAnswerViaGroq(apiKey: string, question: string, starterCode: string, code: string, stdout: string, stderr: string, points: number) {
  try {
    const GroqModule = await import("groq-sdk");
    const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert programming grader. Evaluate the student's code and its compiler execution outcomes.
Return ONLY valid JSON. Start directly with {.

Return structure:
{
  "score": number between 0.0 and 1.0,
  "feedback": "1-2 sentences outlining errors or confirming functional code implementation",
  "code_quality_tags": string[]
}`
        },
        {
          role: "user",
          content: `Question/Requirement: ${question}
Starter code: ${starterCode}
Submitted code: ${code}
Execution Output: ${stdout || "None"}
Execution Error: ${stderr || "None"}
Max Points: ${points}`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    return {
      score: typeof parsed.score === "number" ? parsed.score : 0.0,
      feedback: parsed.feedback || "Code graded by AI."
    };
  } catch (e) {
    console.error("[Grading AI] Groq code check failed:", e);
    return null;
  }
}

async function generateOverallFeedbackViaGroq(apiKey: string, quizTitle: string, percentage: number, questionGrades: any[]) {
  try {
    const GroqModule = await import("groq-sdk");
    const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a supportive professor. Write overall performance feedback for a quiz attempt.
Return ONLY valid JSON. Start directly with {.

Return structure:
{
  "overall_feedback": "3-4 sentences summarizing their attempt, acknowledging progress, and providing encouragement",
  "strengths": string[] (1-3 distinct points where they excelled),
  "areas_for_improvement": string[] (1-3 distinct topics/concepts they struggled on),
  "recommended_resources": string[] (1-3 actual concepts or chapters they should review)
}`
        },
        {
          role: "user",
          content: `Quiz: ${quizTitle}
Percentage Score: ${percentage.toFixed(1)}%
Individual Breakdown: ${JSON.stringify(questionGrades)}`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices?.[0]?.message?.content || "{}");
  } catch (e) {
    console.error("[Grading AI] Feedback gen failed:", e);
    return null;
  }
}

function checkTextOverlap(a: string, b: string): boolean {
  const wordsA = new Set(a.toLowerCase().split(/\W+/));
  const wordsB = b.toLowerCase().split(/\W+/);
  let overlapCount = 0;
  for (const w of wordsB) {
    if (w.length > 3 && wordsA.has(w)) overlapCount++;
  }
  return overlapCount >= 3;
}

export function getStandardGradeScale() {
  return [
    { letter: "A+", min_pct: 95, max_pct: 100, grade_point: 4.0, label: "Exceptional" },
    { letter: "A",  min_pct: 90, max_pct: 94,  grade_point: 4.0, label: "Excellent" },
    { letter: "A-", min_pct: 87, max_pct: 89,  grade_point: 3.7, label: "Very Good" },
    { letter: "B+", min_pct: 83, max_pct: 86,  grade_point: 3.3, label: "Good" },
    { letter: "B",  min_pct: 80, max_pct: 82,  grade_point: 3.0, label: "Above Average" },
    { letter: "B-", min_pct: 77, max_pct: 79,  grade_point: 2.7, label: "Average" },
    { letter: "C+", min_pct: 73, max_pct: 76,  grade_point: 2.3, label: "Below Average" },
    { letter: "C",  min_pct: 70, max_pct: 72,  grade_point: 2.0, label: "Satisfactory" },
    { letter: "C-", min_pct: 67, max_pct: 69,  grade_point: 1.7, label: "Needs Improvement" },
    { letter: "D",  min_pct: 60, max_pct: 66,  grade_point: 1.0, label: "Marginal Pass" },
    { letter: "F",  min_pct: 0,  max_pct: 59,  grade_point: 0.0, label: "Fail" }
  ];
}
