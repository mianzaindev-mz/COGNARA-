"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Option = {
  id: string;
  text: string;
  is_correct?: boolean; // May be hidden from client or returned for review
};

type Question = {
  id: string;
  text: string;
  type: string;
  points: number;
  explanation: string | null;
  question_options: Option[];
};

type QuizDetails = {
  id: string;
  title: string;
  pass_score: number;
  attempts_allowed: number;
};

// Fallback questions registry
const REGISTRY: Record<string, Array<{ text: string; explanation: string; options: Array<{ text: string; isCorrect: boolean }> }>> = {
  python: [
    {
      text: "Which of the following is a valid variable name in Python?",
      explanation: "Variable names in Python must start with a letter or underscore, and cannot contain spaces or hyphens.",
      options: [
        { text: "my-var", isCorrect: false },
        { text: "3myvar", isCorrect: false },
        { text: "my_var", isCorrect: true },
        { text: "my var", isCorrect: false }
      ]
    },
    {
      text: "How do you start a single-line comment in Python?",
      explanation: "In Python, the hash character (#) is used to begin a single-line comment.",
      options: [
        { text: "//", isCorrect: false },
        { text: "/*", isCorrect: false },
        { text: "#", isCorrect: true },
        { text: "<!--", isCorrect: false }
      ]
    },
    {
      text: "What will print(type(5.0)) output in Python?",
      explanation: "A number with a decimal point is represented as a float object in Python.",
      options: [
        { text: "<class 'int'>", isCorrect: false },
        { text: "<class 'float'>", isCorrect: true },
        { text: "<class 'str'>", isCorrect: false },
        { text: "<class 'double'>", isCorrect: false }
      ]
    },
    {
      text: "Which list method adds an element to the end of a list?",
      explanation: "The append() method modifies a list by placing a new item at the very end.",
      options: [
        { text: "add()", isCorrect: false },
        { text: "insert()", isCorrect: false },
        { text: "append()", isCorrect: true },
        { text: "push()", isCorrect: false }
      ]
    },
    {
      text: "What is the boolean evaluation of the empty string bool('') in Python?",
      explanation: "Empty sequences and collections (like empty strings, lists, or tuples) evaluate to False in Python.",
      options: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
        { text: "None", isCorrect: false },
        { text: "Error", isCorrect: false }
      ]
    }
  ],
  react: [
    {
      text: "What built-in Hook is used to manage state in React functional components?",
      explanation: "useState is the fundamental hook used to store and update local state variables in React.",
      options: [
        { text: "useState", isCorrect: true },
        { text: "useEffect", isCorrect: false },
        { text: "createState", isCorrect: false },
        { text: "useRef", isCorrect: false }
      ]
    },
    {
      text: "Which of the following is a strict Rule of Hooks in React?",
      explanation: "Hooks must only be called at the top level of your functional component, never inside loops, conditions, or nested functions.",
      options: [
        { text: "Must be called inside loops", isCorrect: false },
        { text: "Only call Hooks at the top level", isCorrect: true },
        { text: "Call Hooks from ordinary JavaScript functions", isCorrect: false },
        { text: "Hooks can be executed conditionally", isCorrect: false }
      ]
    },
    {
      text: "In JSX, what characters are used to embed a dynamic JavaScript expression?",
      explanation: "Curly braces {} are used to evaluate JS variables or expressions directly inside JSX templates.",
      options: [
        { text: "Double quotes \"\"", isCorrect: false },
        { text: "Curly braces {}", isCorrect: true },
        { text: "Square brackets []", isCorrect: false },
        { text: "Parentheses ()", isCorrect: false }
      ]
    },
    {
      text: "What is the primary role of the Virtual DOM in React?",
      explanation: "React maintains a Virtual DOM in memory and diffs it with the real DOM to apply updates efficiently.",
      options: [
        { text: "To directly format page stylesheets", isCorrect: false },
        { text: "To optimize updates by rendering only changed components", isCorrect: true },
        { text: "To store state variables in remote cloud databases", isCorrect: false },
        { text: "To compile TypeScript code in the browser", isCorrect: false }
      ]
    },
    {
      text: "How is configuration data passed down from parent components to child components?",
      explanation: "Props (properties) are passed down the component tree to configure child elements.",
      options: [
        { text: "Via Context API only", isCorrect: false },
        { text: "Via state variables", isCorrect: false },
        { text: "Via props", isCorrect: true },
        { text: "Via global window settings", isCorrect: false }
      ]
    }
  ],
  data: [
    {
      text: "Which Python library provides high-performance data structures like DataFrames?",
      explanation: "Pandas is the core library used for data manipulation, preparation, and structuring in Python.",
      options: [
        { text: "matplotlib", isCorrect: false },
        { text: "pandas", isCorrect: true },
        { text: "numpy", isCorrect: false },
        { text: "seaborn", isCorrect: false }
      ]
    },
    {
      text: "What is a Pandas DataFrame?",
      explanation: "A DataFrame represents tabular data containing rows and columns, similar to an Excel sheet.",
      options: [
        { text: "A 1-dimensional array", isCorrect: false },
        { text: "A 2-dimensional labeled tabular data structure", isCorrect: true },
        { text: "A 3D chart configuration object", isCorrect: false },
        { text: "A CSV index list", isCorrect: false }
      ]
    },
    {
      text: "What function is used to load a CSV file into a Pandas DataFrame?",
      explanation: "pd.read_csv() compiles the contents of a CSV file directly into a structured DataFrame object.",
      options: [
        { text: "read_csv()", isCorrect: true },
        { text: "load_csv()", isCorrect: false },
        { text: "import_csv()", isCorrect: false },
        { text: "open_csv()", isCorrect: false }
      ]
    },
    {
      text: "Which plot type is best suited to display relationship distributions between two numeric values?",
      explanation: "Scatter plots map individual data points on X and Y coordinates, making correlations visible.",
      options: [
        { text: "Bar chart", isCorrect: false },
        { text: "Scatter plot", isCorrect: true },
        { text: "Pie chart", isCorrect: false },
        { text: "Histogram", isCorrect: false }
      ]
    },
    {
      text: "What NumPy function produces an array filled completely with zeros?",
      explanation: "np.zeros() returns a new array of specified shape filled with 0 values.",
      options: [
        { text: "np.zeros()", isCorrect: true },
        { text: "np.empty()", isCorrect: false },
        { text: "np.array()", isCorrect: false },
        { text: "np.range()", isCorrect: false }
      ]
    }
  ],
  writing: [
    {
      text: "In storytelling, what is the 'inciting incident'?",
      explanation: "The inciting incident is the event that hooks the reader and launches the protagonist's main story path.",
      options: [
        { text: "The final resolution of conflict", isCorrect: false },
        { text: "The event that disrupts the protagonist's status quo", isCorrect: true },
        { text: "The initial character dialogue", isCorrect: false },
        { text: "The introduction of the main setting", isCorrect: false }
      ]
    },
    {
      text: "What does the core advice 'Show, Don't Tell' mean?",
      explanation: "Showing helps readers experience the story through sensory details and character actions rather than simple summary statements.",
      options: [
        { text: "Use diagrams and images instead of text", isCorrect: false },
        { text: "Express details via action and sensory descriptions", isCorrect: true },
        { text: "Tell the reader directly what the characters think", isCorrect: false },
        { text: "Only write in first person viewpoint", isCorrect: false }
      ]
    },
    {
      text: "What is the theme of a piece of creative writing?",
      explanation: "The theme is the central message or universal truth explored throughout the narrative.",
      options: [
        { text: "The chronological sequence of plot events", isCorrect: false },
        { text: "The underlying message or deeper meaning", isCorrect: true },
        { text: "The primary geographical setting", isCorrect: false },
        { text: "The grammatical style of prose", isCorrect: false }
      ]
    },
    {
      text: "Which point of view relies on 'you' as the primary address?",
      explanation: "Second-person perspective places the reader directly into the story using 'you'.",
      options: [
        { text: "First-person ('I')", isCorrect: false },
        { text: "Second-person ('you')", isCorrect: true },
        { text: "Third-person limited", isCorrect: false },
        { text: "Third-person omniscient", isCorrect: false }
      ]
    },
    {
      text: "What is a 'character flaw'?",
      explanation: "A character flaw is an internal imperfection that creates challenges, drives growth, and adds depth to a character.",
      options: [
        { text: "A typo in the character dialogue", isCorrect: false },
        { text: "An internal imperfection or weakness that drives conflict", isCorrect: true },
        { text: "An physical injury mentioned in the story", isCorrect: false },
        { text: "A minor character with no lines", isCorrect: false }
      ]
    }
  ],
  speaking: [
    {
      text: "What is box breathing used for in speech preparation?",
      explanation: "Box breathing is a technique (inhale, hold, exhale, hold) that calms the nervous system and decreases performance anxiety.",
      options: [
        { text: "Breathing in a closed, quiet room", isCorrect: false },
        { text: "A structured breathing technique to regulate heart rate", isCorrect: true },
        { text: "Vocal exercises for pitch modulation", isCorrect: false },
        { text: "Inhaling deeply through a straw", isCorrect: false }
      ]
    },
    {
      text: "How should eye contact be distributed during a presentation?",
      explanation: "Holding eye contact with different individuals for 3-5 seconds creates a conversational bond with the audience.",
      options: [
        { text: "Look strictly at the floor to avoid distraction", isCorrect: false },
        { text: "Rotate contact around the room, holding for 3-5 seconds per person", isCorrect: true },
        { text: "Focus solely on the presenter screen or back wall", isCorrect: false },
        { text: "Look only at a single person in the front row", isCorrect: false }
      ]
    },
    {
      text: "What is the 'problem, insight, action' structure designed to do?",
      explanation: "This structure creates a persuasive narrative arc that highlights a need, offers a solution, and guides next steps.",
      options: [
        { text: "Arrange colors on presentation slides", isCorrect: false },
        { text: "Structure a persuasive presentation or speech", isCorrect: true },
        { text: "Format spreadsheets for audit reporting", isCorrect: false },
        { text: "Outline slide deck layouts", isCorrect: false }
      ]
    },
    {
      text: "Why is incorporating pauses during a speech highly effective?",
      explanation: "Pausing allows audiences to absorb key messages, builds anticipation, and projects confidence.",
      options: [
        { text: "To quickly review speaker notes", isCorrect: false },
        { text: "To let critical points sink in and emphasize impact", isCorrect: true },
        { text: "To check the room timer", isCorrect: false },
        { text: "To let the sound technicians adjust settings", isCorrect: false }
      ]
    },
    {
      text: "What is the primary benefit of 'power posing' before presenting?",
      explanation: "Open, confident posture adjustments help lower stress hormones (cortisol) and boost composure.",
      options: [
        { text: "Asserting dominance over the audience", isCorrect: false },
        { text: "Boosting physical confidence levels and lowering stress before stepping out", isCorrect: true },
        { text: "Creating animations on presentation slides", isCorrect: false },
        { text: "Speaking louder than standard microphone volumes", isCorrect: false }
      ]
    }
  ],
  default: [
    {
      text: "What is the first step in debugging a software error?",
      explanation: "Isolating and reproducing the bug is essential to finding the appropriate solution.",
      options: [
        { text: "Rewrite the code from scratch", isCorrect: false },
        { text: "Reproduce the issue and isolate the root cause", isCorrect: true },
        { text: "Push settings changes to production", isCorrect: false },
        { text: "Change the project server password", isCorrect: false }
      ]
    },
    {
      text: "What does API stand for in software engineering?",
      explanation: "Application Programming Interface enables different applications to communicate with each other.",
      options: [
        { text: "Application Programming Interface", isCorrect: true },
        { text: "Application Program Integration", isCorrect: false },
        { text: "Advanced Protocol Internet", isCorrect: false },
        { text: "Analytical Performance Index", isCorrect: false }
      ]
    },
    {
      text: "Why is utilizing version control (e.g. Git) essential in collaborative settings?",
      explanation: "Git tracks code modifications, enables simple rollbacks, and allows safe merging of parallel work.",
      options: [
        { text: "To make compilation speeds faster", isCorrect: false },
        { text: "To track code history, resolve conflicts, and work safely in teams", isCorrect: true },
        { text: "To encrypt application local directories", isCorrect: false },
        { text: "To force standard formatting on scripts", isCorrect: false }
      ]
    },
    {
      text: "Which of the following describes a professional 'growth mindset'?",
      explanation: "A growth mindset views abilities as developable attributes through effort, training, and persistence.",
      options: [
        { text: "Believing technical abilities are fixed", isCorrect: false },
        { text: "Viewing errors and challenges as learning opportunities", isCorrect: true },
        { text: "Avoiding complex tasks to prevent failures", isCorrect: false },
        { text: "Following instructions without questioning them", isCorrect: false }
      ]
    },
    {
      text: "Why is user input validation critical in web applications?",
      explanation: "Sanitizing and validating user entries guards database queries from injection attacks and guarantees clean storage inputs.",
      options: [
        { text: "To speed up server cycles", isCorrect: false },
        { text: "To ensure data integrity, prevent errors, and safeguard against security attacks", isCorrect: true },
        { text: "To render CSS elements faster", isCorrect: false },
        { text: "To clear browser cookie caches", isCorrect: false }
      ]
    }
  ]
};

export default function QuizTakePage() {
  const { id } = useParams() as { id: string };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Quiz Take States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Maps questionId -> optionId
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quiz Results States
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, string>>({}); // Maps questionId -> correct optionId

  useEffect(() => {
    if (!id) return;

    async function loadQuizData() {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase client failed to load.");

        // 1. Fetch enrollment
        const { data: enrollment, error: enrollErr } = await supabase
          .from("enrollments")
          .select("*, courses(*)")
          .eq("id", id)
          .single();

        if (enrollErr || !enrollment) {
          throw new Error("Could not find this course enrollment. Please enroll first.");
        }

        setCourseTitle(enrollment.courses.title);
        setCourseId(enrollment.courses.id);

        // Check if student has already exhausted attempts
        const { data: existingAttempts } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("student_id", enrollment.student_id);

        // Find if they have any quiz at all. Get lessons of the course first.
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .eq("course_id", enrollment.course_id);

        const lessonIds = lessons?.map(l => l.id) ?? [];

        let courseQuiz = null;
        if (lessonIds.length > 0) {
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("*")
            .in("lesson_id", lessonIds);
          
          if (quizzes && quizzes.length > 0) {
            courseQuiz = quizzes[0];
          }
        }

        // If no quiz has been created by lessons, look for a quiz with the course title
        if (!courseQuiz) {
          const { data: titleQuizzes } = await supabase
            .from("quizzes")
            .select("*")
            .ilike("title", `%${enrollment.courses.title}%`);
          
          if (titleQuizzes && titleQuizzes.length > 0) {
            courseQuiz = titleQuizzes[0];
          }
        }

        // 2. If quiz does not exist, create it dynamically
        if (!courseQuiz) {
          const { data: newQuiz, error: insertQuizErr } = await supabase
            .from("quizzes")
            .insert({
              title: `${enrollment.courses.title} — Final Quiz`,
              coach_id: enrollment.courses.coach_id,
              pass_score: 70,
              attempts_allowed: 3,
              is_ai_generated: true
            })
            .select()
            .single();

          if (insertQuizErr || !newQuiz) {
            throw new Error(`Failed to create quiz record: ${insertQuizErr?.message}`);
          }

          courseQuiz = newQuiz;

          // Add questions based on registry match or default
          const titleLower = enrollment.courses.title.toLowerCase();
          let questionPool = REGISTRY.default;
          if (titleLower.includes("python")) questionPool = REGISTRY.python;
          else if (titleLower.includes("react") || titleLower.includes("web dev")) questionPool = REGISTRY.react;
          else if (titleLower.includes("data science") || titleLower.includes("pandas")) questionPool = REGISTRY.data;
          else if (titleLower.includes("writing") || titleLower.includes("creative")) questionPool = REGISTRY.writing;
          else if (titleLower.includes("speaking") || titleLower.includes("leadership")) questionPool = REGISTRY.speaking;

          // Insert questions and options
          for (let i = 0; i < questionPool.length; i++) {
            const registryQ = questionPool[i];
            const { data: newQuestion } = await supabase
              .from("questions")
              .insert({
                quiz_id: courseQuiz.id,
                text: registryQ.text,
                type: "mcq",
                points: 1,
                order_index: i,
                explanation: registryQ.explanation
              })
              .select()
              .single();

            if (newQuestion) {
              const optionsToInsert = registryQ.options.map(opt => ({
                question_id: newQuestion.id,
                text: opt.text,
                is_correct: opt.isCorrect
              }));
              await supabase.from("question_options").insert(optionsToInsert);
            }
          }
        }

        setQuiz({
          id: courseQuiz.id,
          title: courseQuiz.title,
          pass_score: courseQuiz.pass_score ?? 70,
          attempts_allowed: courseQuiz.attempts_allowed ?? 3,
        });

        // 3. Check if user already passed or exceeded attempt counts
        const courseQuizAttempts = existingAttempts?.filter(a => a.quiz_id === courseQuiz.id) ?? [];
        const isPassed = courseQuizAttempts.some(a => a.passed);
        
        if (isPassed) {
          throw new Error("You have already passed this final quiz. You can claim your certificate under Certificates.");
        }
        if (courseQuizAttempts.length >= (courseQuiz.attempts_allowed ?? 3)) {
          throw new Error("You have exhausted all 3 available attempts for this final quiz.");
        }

        // 4. Load questions and options
        const { data: questionRows, error: qErr } = await supabase
          .from("questions")
          .select(`
            id,
            text,
            type,
            points,
            explanation,
            question_options (
              id,
              text,
              is_correct
            )
          `)
          .eq("quiz_id", courseQuiz.id)
          .order("order_index", { ascending: true });

        if (qErr || !questionRows || questionRows.length === 0) {
          throw new Error("No quiz questions were found. Please contact support.");
        }

        const formattedQuestions: Question[] = questionRows.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points,
          explanation: q.explanation,
          question_options: q.question_options ?? []
        }));

        setQuestions(formattedQuestions);

        // Build correct answer map for evaluation
        const correctAnswers: Record<string, string> = {};
        formattedQuestions.forEach(q => {
          const correctOpt = q.question_options.find((opt: any) => opt.is_correct);
          if (correctOpt) {
            correctAnswers[q.id] = correctOpt.id;
          }
        });
        setCorrectAnswersMap(correctAnswers);

      } catch (err: any) {
        setError(err.message || "An unexpected error occurred loading the quiz.");
      } finally {
        setLoading(false);
      }
    }

    void loadQuizData();
  }, [id]);

  const selectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitted || submitting) return;

    // Validation: Ensure all questions have selections
    if (Object.keys(answers).length < questions.length) {
      alert("Please select an answer for all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Connection failed.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated user session.");

      // Calculate score
      let correctCount = 0;
      questions.forEach(q => {
        const selectedOptId = answers[q.id];
        const correctOptId = correctAnswersMap[q.id];
        if (selectedOptId === correctOptId) {
          correctCount++;
        }
      });

      const finalScore = Math.round((correctCount / questions.length) * 100);
      const passMark = quiz?.pass_score ?? 70;
      const isPassed = finalScore >= passMark;

      // 1. Insert quiz attempt
      const { data: attempt, error: attemptErr } = await supabase
        .from("quiz_attempts")
        .insert({
          student_id: user.id,
          quiz_id: quiz!.id,
          score: finalScore,
          passed: isPassed,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attemptErr || !attempt) {
        throw new Error(`Failed to save quiz attempt: ${attemptErr?.message}`);
      }

      // 2. Insert quiz answers
      const answersToInsert = questions.map(q => {
        const selectedOptId = answers[q.id];
        const correctOptId = correctAnswersMap[q.id];
        return {
          attempt_id: attempt.id,
          question_id: q.id,
          selected_option_id: selectedOptId,
          is_correct: selectedOptId === correctOptId
        };
      });

      const { error: answersErr } = await supabase
        .from("quiz_answers")
        .insert(answersToInsert);

      if (answersErr) {
        console.error("Warning: Failed to save details for quiz answers:", answersErr);
      }

      // 3. If passed, complete the enrollment (progress to 100%) to issue certificate
      if (isPassed) {
        const { error: enrollUpdateErr } = await supabase
          .from("enrollments")
          .update({
            progress_pct: 100,
            completed_at: new Date().toISOString()
          })
          .eq("id", id);

        if (enrollUpdateErr) {
          console.error("Warning: Failed to update course enrollment progress:", enrollUpdateErr);
        }
      }

      setScore(finalScore);
      setPassed(isPassed);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit quiz attempt. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-cn-ink-muted">
          <span>Quizzes</span>
          <span>/</span>
          <span className="h-4 w-24 bg-cn-border animate-pulse rounded" />
        </div>
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-cn-border bg-cn-surface p-8 shadow-[var(--cn-shadow-card)] animate-pulse dark:border-[#2e2a2a] dark:bg-[#1a1818]">
          <div className="h-6 w-3/4 bg-cn-border rounded mb-4" />
          <div className="h-4 w-1/2 bg-cn-border rounded mb-8" />
          <div className="space-y-4">
            <div className="h-12 bg-cn-border rounded-xl" />
            <div className="h-12 bg-cn-border rounded-xl" />
            <div className="h-12 bg-cn-border rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-cn-ink-muted">
          <Link href="/quizzes" className="hover:text-cn-ink">Quizzes</Link>
          <span>/</span>
          <span className="text-cn-ink">Error</span>
        </div>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center dark:bg-rose-500/10">
          <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">Quiz Unavailable</h2>
          <p className="mt-2 text-sm text-cn-ink-muted leading-relaxed">{error}</p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/quizzes"
              className="rounded-xl border border-cn-border px-5 py-2.5 text-sm font-bold text-cn-ink hover:bg-cn-canvas transition dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
            >
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-cn-ink-muted">
        <Link href="/quizzes" className="hover:text-cn-ink">Quizzes</Link>
        <span>/</span>
        <span className="text-cn-ink font-medium">{courseTitle}</span>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        {!submitted ? (
          <div className="rounded-2xl border border-cn-border bg-cn-surface p-6 shadow-[var(--cn-shadow-card)] dark:border-[#2e2a2a] dark:bg-[#1a1818]">
            {/* Header info */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-cn-border pb-4 dark:border-[#2e2a2a]">
              <div>
                <h1 className="text-xl font-bold text-cn-ink dark:text-white">{quiz?.title}</h1>
                <p className="text-xs text-cn-ink-muted mt-0.5">Passing score: {quiz?.pass_score}%</p>
              </div>
              <div className="rounded-full bg-cn-orange/10 px-3 py-1 text-xs font-bold text-cn-orange">
                Question {currentIdx + 1} of {questions.length}
              </div>
            </div>

            {/* Questions Grid/Selector Navigation */}
            <div className="mb-6 flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isSelected = currentIdx === idx;
                const isAnswered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 w-9 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                      isSelected
                        ? "bg-cn-orange text-white ring-2 ring-cn-orange/20"
                        : isAnswered
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : "bg-cn-canvas text-cn-ink-muted hover:bg-cn-border/30 dark:bg-[#0f0e0e] dark:hover:bg-[#201d1d]"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-cn-ink dark:text-white leading-snug">
                {currentQuestion.text}
              </h2>
            </div>

            {/* MCQ Options */}
            <div className="mb-8 space-y-3">
              {currentQuestion.question_options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectOption(currentQuestion.id, opt.id)}
                    className={`w-full rounded-xl border p-4 text-left text-sm font-medium transition flex items-center justify-between ${
                      isSelected
                        ? "border-cn-orange bg-cn-orange/5 text-cn-ink dark:text-white"
                        : "border-cn-border bg-cn-surface hover:border-cn-border-hover dark:border-[#2e2a2a] dark:bg-[#1a1818] dark:hover:border-cn-orange/40"
                    }`}
                  >
                    <span>{opt.text}</span>
                    <span
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-cn-orange bg-cn-orange text-white"
                          : "border-cn-border dark:border-[#2e2a2a]"
                      }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-cn-border pt-5 dark:border-[#2e2a2a]">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="rounded-xl border border-cn-border px-5 py-2.5 text-sm font-bold text-cn-ink hover:bg-cn-canvas disabled:opacity-30 disabled:pointer-events-none transition dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
              >
                ← Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-cn-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                  className="rounded-xl bg-cn-orange px-6 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover disabled:opacity-40 transition"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              )}
            </div>
            {!allAnswered && currentIdx === questions.length - 1 && (
              <p className="mt-3 text-center text-xs text-rose-500 font-medium">
                Please answer all questions before submitting the quiz.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-cn-border bg-cn-surface p-8 shadow-[var(--cn-shadow-card)] text-center dark:border-[#2e2a2a] dark:bg-[#1a1818]">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-cn-canvas dark:bg-[#0f0e0e]">
              <span className={`text-4xl ${passed ? "text-emerald-500" : "text-rose-500"}`}>
                {passed ? "🏆" : "❌"}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-cn-ink dark:text-white">
              {passed ? "Congratulations!" : "Keep learning!"}
            </h1>
            <p className="mt-1 text-sm text-cn-ink-muted">
              {passed
                ? "You passed the final quiz and successfully completed the course."
                : "You didn't reach the 70% passing threshold on this attempt."}
            </p>

            {/* Score Ring */}
            <div className="my-8 flex justify-center">
              <div className={`rounded-2xl border px-8 py-4 ${
                passed ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" : "border-rose-500/20 bg-rose-500/5 text-rose-500"
              }`}>
                <p className="text-xs font-semibold uppercase tracking-wider">Your Score</p>
                <p className="text-4xl font-extrabold mt-1">{score}%</p>
                <p className="text-xs text-cn-ink-subtle mt-1">Passing score: 70%</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 border-b border-cn-border pb-8 mb-8 dark:border-[#2e2a2a]">
              {passed ? (
                <>
                  <Link
                    href={`/verify-certificate/CERT-${courseId.slice(0, 4).toUpperCase()}-${id.slice(0, 6).toUpperCase()}`}
                    className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition"
                  >
                    View Certificate
                  </Link>
                  <Link
                    href="/certificates"
                    className="rounded-xl border border-cn-border px-6 py-3 text-sm font-bold text-cn-ink hover:bg-cn-canvas transition dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
                  >
                    All Certificates
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setAnswers({});
                      setCurrentIdx(0);
                    }}
                    className="rounded-xl bg-cn-orange px-6 py-3 text-sm font-bold text-white hover:bg-cn-orange-hover transition"
                  >
                    Retake Quiz
                  </button>
                  <Link
                    href="/quizzes"
                    className="rounded-xl border border-cn-border px-6 py-3 text-sm font-bold text-cn-ink hover:bg-cn-canvas transition dark:border-[#2e2a2a] dark:text-white dark:hover:bg-[#0f0e0e]"
                  >
                    Back to Quizzes
                  </Link>
                </>
              )}
            </div>

            {/* Answer Explanations Review */}
            <div className="text-left">
              <h2 className="text-lg font-bold text-cn-ink dark:text-white mb-4">Review Questions</h2>
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const selectedOptId = answers[q.id];
                  const correctOptId = correctAnswersMap[q.id];
                  const isCorrect = selectedOptId === correctOptId;

                  const selectedText = q.question_options.find(opt => opt.id === selectedOptId)?.text ?? "No answer";
                  const correctText = q.question_options.find(opt => opt.id === correctOptId)?.text ?? "";

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-cn-border bg-cn-canvas p-4 dark:border-[#2e2a2a] dark:bg-[#0f0e0e]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`text-sm ${isCorrect ? "text-emerald-500" : "text-rose-500"} mt-0.5`}>
                          {isCorrect ? "✓" : "✗"}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-cn-ink dark:text-white">
                            Question {idx + 1}: {q.text}
                          </p>
                          <div className="mt-2.5 space-y-1 text-xs">
                            <p className="text-cn-ink-muted">
                              Your answer: <span className={isCorrect ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-500 font-medium"}>{selectedText}</span>
                            </p>
                            {!isCorrect && (
                              <p className="text-cn-ink-subtle">
                                Correct answer: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{correctText}</span>
                              </p>
                            )}
                          </div>
                          {q.explanation && (
                            <div className="mt-3 border-t border-cn-border/50 pt-2.5 text-xs text-cn-ink-muted italic dark:border-[#2e2a2a]/50">
                              <span className="font-semibold text-cn-ink-subtle not-italic">Explanation: </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
