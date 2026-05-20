"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconClipboard, IconSparkle, IconTrash, IconEye, IconPlus } from "@/components/ui/icons";

type Option = {
  id?: string;
  text: string;
  is_correct: boolean;
};

type Question = {
  id?: string;
  text: string;
  type: "mcq" | "true_false";
  points: number;
  explanation: string;
  options: Option[];
};

type Quiz = {
  id: string;
  title: string;
  time_limit_mins: number;
  pass_score: number;
  attempts_allowed: number;
  is_ai_generated: boolean;
  created_at: string;
  lesson_id: string | null;
  questions: Question[];
};

type CourseOption = {
  id: string;
  title: string;
};

type LessonOption = {
  id: string;
  title: string;
  course_id: string;
};

export default function CoachQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Selected entities
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  // Manual Creation Form States
  const [newTitle, setNewTitle] = useState("");
  const [newTimeLimit, setNewTimeLimit] = useState("15");
  const [newPassScore, setNewPassScore] = useState("70");
  const [newAttempts, setNewAttempts] = useState("3");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // AI Form States
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("intermediate");
  const [aiCount, setAiCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<{ title: string; questions: Question[] } | null>(null);

  const fetchQuizzesAndMeta = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch courses to link
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title")
        .eq("coach_id", user.id);

      if (coursesData) {
        setCourses(coursesData);

        // Fetch lessons of those courses
        const courseIds = coursesData.map((c: any) => c.id);
        if (courseIds.length > 0) {
          const { data: lessonsData } = await supabase
            .from("lessons")
            .select("id, title, course_id")
            .in("course_id", courseIds);
          if (lessonsData) {
            setLessons(lessonsData);
          }
        }
      }

      // 2. Fetch quizzes with questions and options nested
      const { data: quizzesData, error: quizzesErr } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          time_limit_mins,
          pass_score,
          attempts_allowed,
          is_ai_generated,
          created_at,
          lesson_id,
          questions (
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
          )
        `)
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      if (quizzesErr) throw quizzesErr;

      if (quizzesData) {
        // Map nested naming schema from PostgREST embeds
        const mappedQuizzes: Quiz[] = quizzesData.map((q: any) => ({
          id: q.id,
          title: q.title,
          time_limit_mins: q.time_limit_mins || 0,
          pass_score: q.pass_score || 70,
          attempts_allowed: q.attempts_allowed || 3,
          is_ai_generated: q.is_ai_generated || false,
          created_at: q.created_at,
          lesson_id: q.lesson_id,
          questions: (q.questions || []).map((quest: any) => ({
            id: quest.id,
            text: quest.text,
            type: quest.type,
            points: quest.points || 1,
            explanation: quest.explanation || "",
            options: (quest.question_options || []).map((o: any) => ({
              id: o.id,
              text: o.text,
              is_correct: o.is_correct || false
            }))
          }))
        }));
        setQuizzes(mappedQuizzes);
      }

    } catch (err: any) {
      console.error("Failed to load quizzes:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuizzesAndMeta();
  }, [fetchQuizzesAndMeta]);

  // Handle manual question adding
  const addFormQuestion = (type: "mcq" | "true_false") => {
    const newQ: Question = {
      text: "",
      type,
      points: 1,
      explanation: "",
      options: type === "true_false" 
        ? [{ text: "True", is_correct: true }, { text: "False", is_correct: false }]
        : [
            { text: "Option A", is_correct: true },
            { text: "Option B", is_correct: false },
            { text: "Option C", is_correct: false },
            { text: "Option D", is_correct: false }
          ]
    };
    setFormQuestions([...formQuestions, newQ]);
  };

  const removeFormQuestion = (index: number) => {
    setFormQuestions(formQuestions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...formQuestions];
    updated[index].text = text;
    setFormQuestions(updated);
  };

  const updateQuestionExplain = (index: number, text: string) => {
    const updated = [...formQuestions];
    updated[index].explanation = text;
    setFormQuestions(updated);
  };

  const updateQuestionPoints = (index: number, val: number) => {
    const updated = [...formQuestions];
    updated[index].points = val;
    setFormQuestions(updated);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...formQuestions];
    updated[qIndex].options[oIndex].text = text;
    setFormQuestions(updated);
  };

  const toggleOptionCorrect = (qIndex: number, oIndex: number) => {
    const updated = [...formQuestions];
    // For MCQ, single choice is correct
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
      ...opt,
      is_correct: i === oIndex
    }));
    setFormQuestions(updated);
  };

  const addMcqOption = (qIndex: number) => {
    const updated = [...formQuestions];
    updated[qIndex].options.push({ text: `Option ${String.fromCharCode(65 + updated[qIndex].options.length)}`, is_correct: false });
    setFormQuestions(updated);
  };

  const removeMcqOption = (qIndex: number, oIndex: number) => {
    const updated = [...formQuestions];
    if (updated[qIndex].options.length <= 2) return; // Keep at least two options
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
    // Ensure at least one option is correct
    if (!updated[qIndex].options.some(o => o.is_correct)) {
      updated[qIndex].options[0].is_correct = true;
    }
    setFormQuestions(updated);
  };

  // Save manual quiz to database
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { alert("Please provide a quiz title."); return; }
    if (formQuestions.length === 0) { alert("Please add at least one question."); return; }

    const invalidQuestion = formQuestions.some(q => !q.text.trim() || q.options.some(o => !o.text.trim()));
    if (invalidQuestion) {
      alert("Please fill in all question texts and option labels.");
      return;
    }

    setSavingQuiz(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Insert Quiz Row
      const { data: quizData, error: quizErr } = await supabase
        .from("quizzes")
        .insert({
          coach_id: user.id,
          title: newTitle,
          time_limit_mins: Number(newTimeLimit) || 15,
          pass_score: Number(newPassScore) || 70,
          attempts_allowed: Number(newAttempts) || 3,
          lesson_id: selectedLessonId || null,
          is_ai_generated: false
        })
        .select()
        .single();

      if (quizErr) throw quizErr;

      // 2. Insert Questions & Options
      for (let i = 0; i < formQuestions.length; i++) {
        const q = formQuestions[i];
        const { data: qData, error: qErr } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizData.id,
            text: q.text,
            type: q.type,
            points: q.points,
            explanation: q.explanation,
            order_index: i
          })
          .select()
          .single();

        if (qErr) throw qErr;

        const optionsToInsert = q.options.map(o => ({
          question_id: qData.id,
          text: o.text,
          is_correct: o.is_correct
        }));

        const { error: optsErr } = await supabase
          .from("question_options")
          .insert(optionsToInsert);

        if (optsErr) throw optsErr;
      }

      alert("Quiz created successfully!");
      setCreateModalOpen(false);
      // Reset form
      setNewTitle("");
      setNewTimeLimit("15");
      setNewPassScore("70");
      setNewAttempts("3");
      setSelectedCourseId("");
      setSelectedLessonId("");
      setFormQuestions([]);
      void fetchQuizzesAndMeta();

    } catch (err: any) {
      alert(err.message || "Failed to create quiz.");
    } finally {
      setSavingQuiz(false);
    }
  };

  // AI generate request handler
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) { alert("Please provide a topic."); return; }

    setGenerating(true);
    setGeneratedPreview(null);
    try {
      const res = await fetch("/api/coach/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          difficulty: aiDifficulty,
          count: aiCount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");

      setGeneratedPreview({
        title: data.title || `${aiTopic} AI Generated Quiz`,
        questions: (data.questions || []).map((q: any) => ({
          text: q.text,
          type: q.type || "mcq",
          points: q.points || 1,
          explanation: q.explanation || "",
          options: (q.options || []).map((o: any) => ({
            text: o.text,
            is_correct: o.is_correct || false
          }))
        }))
      });

    } catch (err: any) {
      alert(err.message || "Failed to generate AI quiz.");
    } finally {
      setGenerating(false);
    }
  };

  // Save AI Generated preview
  const handleSaveAIGenerated = async () => {
    if (!generatedPreview) return;
    setSavingQuiz(true);

    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Insert Quiz Row
      const { data: quizData, error: quizErr } = await supabase
        .from("quizzes")
        .insert({
          coach_id: user.id,
          title: generatedPreview.title,
          time_limit_mins: 15,
          pass_score: 70,
          attempts_allowed: 3,
          is_ai_generated: true,
          lesson_id: selectedLessonId || null
        })
        .select()
        .single();

      if (quizErr) throw quizErr;

      // 2. Insert Questions & Options
      for (let i = 0; i < generatedPreview.questions.length; i++) {
        const q = generatedPreview.questions[i];
        const { data: qData, error: qErr } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizData.id,
            text: q.text,
            type: q.type,
            points: q.points,
            explanation: q.explanation,
            order_index: i
          })
          .select()
          .single();

        if (qErr) throw qErr;

        const optionsToInsert = q.options.map(o => ({
          question_id: qData.id,
          text: o.text,
          is_correct: o.is_correct
        }));

        const { error: optsErr } = await supabase
          .from("question_options")
          .insert(optionsToInsert);

        if (optsErr) throw optsErr;
      }

      alert("AI Quiz accepted and saved successfully!");
      setAiModalOpen(false);
      setAiTopic("");
      setGeneratedPreview(null);
      setSelectedCourseId("");
      setSelectedLessonId("");
      void fetchQuizzesAndMeta();

    } catch (err: any) {
      alert(err.message || "Failed to save AI Generated quiz.");
    } finally {
      setSavingQuiz(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? All nested questions and student attempts will be deleted permanently.")) return;

    try {
      const supabase = createClient();
      if (!supabase) return;

      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;

      alert("Quiz deleted successfully!");
      setQuizzes(quizzes.filter(q => q.id !== quizId));

    } catch (err: any) {
      alert(err.message || "Failed to delete quiz.");
    }
  };

  const getLessonTitle = (lessonId: string | null) => {
    if (!lessonId) return "Unlinked (General Bank)";
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return "Linked to Lesson";
    const course = courses.find(c => c.id === lesson.course_id);
    return `${course?.title || "Course"} ➔ ${lesson.title}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Quiz Builder</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">Create quizzes manually or let AI generate them</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#221740] bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/20 transition duration-200"
          >
            <IconSparkle className="h-4 w-4" />
            AI Generate
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition duration-200"
          >
            <IconPlus className="h-4 w-4" />
            Create Quiz
          </button>
        </div>
      </section>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <EmptyState
          icon={<IconClipboard className="h-6 w-6" />}
          title="No quizzes yet"
          description="Create your first quiz or use AI to generate one from a topic or PDF."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 cn-stagger">
          {quizzes.map(q => (
            <div
              key={q.id}
              className="group flex flex-col justify-between rounded-2xl border border-[#221740] bg-[#120c2b]/95 p-5 shadow-sm hover:shadow-indigo-500/5 transition duration-300"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition line-clamp-1">
                    {q.title}
                  </h3>
                  {q.is_ai_generated && (
                    <Badge variant="info" className="shrink-0 font-mono text-[9px] px-1.5 py-0.5 rounded">
                      AI Gen
                    </Badge>
                  )}
                </div>
                
                <p className="mt-1 text-[10px] text-gray-500 truncate">
                  {getLessonTitle(q.lesson_id)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-medium text-gray-400">
                  <span className="rounded bg-[#0c081d] border border-[#221740] px-2 py-0.5">
                    ⏱ {q.time_limit_mins}m
                  </span>
                  <span className="rounded bg-[#0c081d] border border-[#221740] px-2 py-0.5">
                    🎯 {q.pass_score}%
                  </span>
                  <span className="rounded bg-[#0c081d] border border-[#221740] px-2 py-0.5">
                    🔄 {q.attempts_allowed} attempts
                  </span>
                  <span className="rounded bg-[#0c081d] border border-[#221740] px-2 py-0.5">
                    ❓ {q.questions.length} Questions
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-[#221740] pt-4.5">
                <button
                  onClick={() => {
                    setPreviewQuiz(q);
                    setPreviewModalOpen(true);
                  }}
                  className="p-2 rounded-lg bg-[#18113c] border border-[#261b4d] text-indigo-400 hover:bg-indigo-600 hover:text-white transition duration-200"
                  title="Preview Quiz"
                >
                  <IconEye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuiz(q.id)}
                  className="p-2 rounded-lg bg-[#240e1b] border border-[#3e142b] text-rose-500 hover:bg-rose-600 hover:text-white transition duration-200"
                  title="Delete Quiz"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-[#221740] bg-[#0c081d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col justify-between">
            <div className="mb-4 flex items-center justify-between border-b border-[#221740] pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <IconClipboard className="h-5 w-5 text-indigo-500" />
                Manual Quiz Builder
              </h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-6 flex-1 overflow-y-auto pr-1">
              {/* Step 1: Config */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-[#120c2b] border border-[#221740] p-4 rounded-xl">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Loops & Function Scope"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTimeLimit}
                    onChange={(e) => setNewTimeLimit(e.target.value)}
                    className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Pass Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newPassScore}
                    onChange={(e) => setNewPassScore(e.target.value)}
                    className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                
                {/* Linking metadata */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Associate Course (Optional)</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedLessonId("");
                    }}
                    className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- General / No Course --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Associate Lesson (Optional)</label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    disabled={!selectedCourseId}
                    className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-40"
                  >
                    <option value="">-- General Bank / No Lesson --</option>
                    {lessons
                      .filter(l => l.course_id === selectedCourseId)
                      .map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Step 2: Add Questions */}
              <div>
                <div className="flex items-center justify-between border-b border-[#221740] pb-2 mb-4">
                  <h3 className="text-xs font-bold uppercase text-indigo-400">Questions List</h3>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => addFormQuestion("mcq")}
                      className="px-2.5 py-1.5 rounded-lg border border-[#221740] bg-[#120c2b] text-[10px] font-semibold text-white hover:bg-[#18113c] transition"
                    >
                      + MCQ Question
                    </button>
                    <button
                      type="button"
                      onClick={() => addFormQuestion("true_false")}
                      className="px-2.5 py-1.5 rounded-lg border border-[#221740] bg-[#120c2b] text-[10px] font-semibold text-white hover:bg-[#18113c] transition"
                    >
                      + True/False Question
                    </button>
                  </div>
                </div>

                {formQuestions.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-6">No questions added yet. Use buttons above to add questions.</p>
                ) : (
                  <div className="space-y-4">
                    {formQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="border border-[#221740] bg-[#0e0924]/50 p-4 rounded-xl relative space-y-4">
                        <button
                          type="button"
                          onClick={() => removeFormQuestion(qIdx)}
                          className="absolute top-4 right-4 text-xs font-bold text-rose-500 hover:text-rose-400"
                        >
                          Delete
                        </button>
                        
                        {/* Question Text */}
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="sm:col-span-3">
                            <label className="block text-[9px] uppercase text-gray-400 mb-1">
                              Question {qIdx + 1} ({q.type === "mcq" ? "MCQ" : "True/False"})
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Write question here..."
                              value={q.text}
                              onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                              className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase text-gray-400 mb-1">Points</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={q.points}
                              onChange={(e) => updateQuestionPoints(qIdx, Number(e.target.value))}
                              className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <span className="block text-[9px] uppercase text-gray-400">Options (Select the correct choice)</span>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2 border border-[#221740] bg-[#0c081d] px-3 py-2 rounded-lg">
                                <input
                                  type="radio"
                                  name={`correct-ans-${qIdx}`}
                                  checked={opt.is_correct}
                                  onChange={() => toggleOptionCorrect(qIdx, oIdx)}
                                  className="accent-indigo-500 shrink-0"
                                />
                                <input
                                  type="text"
                                  required
                                  disabled={q.type === "true_false"}
                                  value={opt.text}
                                  onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                                  className="bg-transparent border-none p-0 text-xs text-white outline-none w-full disabled:opacity-50"
                                />
                                {q.type === "mcq" && q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeMcqOption(qIdx, oIdx)}
                                    className="text-rose-500 hover:text-rose-400 text-xs px-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {q.type === "mcq" && q.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => addMcqOption(qIdx)}
                                className="flex items-center justify-center border border-dashed border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs rounded-lg py-2 transition"
                              >
                                + Add Option
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="block text-[9px] uppercase text-gray-400 mb-1">Explanation (Shown after student answers)</label>
                          <input
                            type="text"
                            placeholder="Why is this answer correct?"
                            value={q.explanation}
                            onChange={(e) => updateQuestionExplain(qIdx, e.target.value)}
                            className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form submit footer */}
              <div className="flex justify-end gap-2 border-t border-[#221740] pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingQuiz ? "Saving Quiz..." : "Save Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI GENERATE QUIZ MODAL */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[#221740] bg-[#0c081d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-[#221740] pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <IconSparkle className="h-5 w-5 text-indigo-400 animate-pulse" />
                AI Quiz Generator
              </h2>
              <button onClick={() => setAiModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Link metadata first */}
            <div className="grid gap-3 sm:grid-cols-2 mb-4 bg-[#120c2b] border border-[#221740] p-3 rounded-lg text-xs">
              <div>
                <label className="block text-[9px] uppercase text-gray-400 mb-1">Associate Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedLessonId("");
                  }}
                  className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-1.5 text-white focus:outline-none"
                >
                  <option value="">-- General Bank / No Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase text-gray-400 mb-1">Associate Lesson</label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  disabled={!selectedCourseId}
                  className="w-full rounded-lg border border-[#221740] bg-[#0c081d] px-3 py-1.5 text-white focus:outline-none disabled:opacity-40"
                >
                  <option value="">-- General Bank / No Lesson --</option>
                  {lessons
                    .filter(l => l.course_id === selectedCourseId)
                    .map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
            </div>

            <form onSubmit={handleAIGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Topic / Concept</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React Hooks, JavaScript Promises, Binary Search Trees"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Questions Count</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating || !aiTopic.trim()}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating ? "🤖 COGNARA AI Agent is writing questions..." : "⚡ AI Generate Quiz"}
              </button>
            </form>

            {/* AI Review Pane */}
            {generatedPreview && (
              <div className="mt-6 border-t border-[#221740] pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Review Generated Questions</h3>
                  <Badge variant="success">AI Generated Outline</Badge>
                </div>
                <div className="rounded-xl border border-[#221740] bg-[#0c081d] p-4 max-h-[300px] overflow-y-auto space-y-4 text-xs pr-1">
                  <h4 className="font-bold text-white mb-2">{generatedPreview.title}</h4>
                  {generatedPreview.questions.map((q, idx) => (
                    <div key={idx} className="border-b border-[#221740] pb-3 space-y-1">
                      <p className="font-semibold text-white">
                        Q{idx + 1}. {q.text} <span className="text-[10px] text-indigo-400">({q.points} pts)</span>
                      </p>
                      <div className="pl-3 space-y-0.5 text-gray-400">
                        {q.options.map((o, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <span className={o.is_correct ? "text-emerald-500 font-bold" : "text-gray-600"}>
                              {o.is_correct ? "●" : "○"}
                            </span>
                            <span className={o.is_correct ? "text-white" : ""}>{o.text}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10px] text-gray-500 italic">
                        💡 {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setGeneratedPreview(null)}
                    className="rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-xs text-gray-300 hover:text-white"
                  >
                    Reject & Re-generate
                  </button>
                  <button
                    onClick={handleSaveAIGenerated}
                    disabled={savingQuiz}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingQuiz ? "Saving..." : "Accept & Save to Bank"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW QUIZ MODAL (Student View Mock) */}
      {previewModalOpen && previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-[#221740] bg-[#0c081d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-[#221740] pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">{previewQuiz.title}</h2>
                <p className="text-[10px] text-indigo-400">👀 Previewing Student View (Read-Only Mode)</p>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-6 text-xs mt-4">
              {/* Meta bar */}
              <div className="flex justify-between items-center rounded-xl bg-[#120c2b] border border-[#221740] p-3 font-semibold text-gray-300">
                <span>⏱ Time: {previewQuiz.time_limit_mins}m</span>
                <span>🎯 Passing: {previewQuiz.pass_score}%</span>
                <span>🔄 Attempts: {previewQuiz.attempts_allowed} max</span>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {previewQuiz.questions.map((q, idx) => (
                  <div key={q.id || idx} className="border border-[#221740] bg-[#120c2b]/30 p-5 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-bold text-white text-sm">
                        Question {idx + 1}: {q.text}
                      </span>
                      <Badge variant="info" className="shrink-0">{q.points} Pts</Badge>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`flex items-center gap-2 border px-3 py-2.5 rounded-lg transition ${
                            opt.is_correct
                              ? "border-emerald-500 bg-emerald-500/10 text-white font-bold"
                              : "border-[#221740] bg-[#0c081d] text-gray-400"
                          }`}
                        >
                          <span className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center text-[8px] ${
                            opt.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-600"
                          }`}>
                            {opt.is_correct ? "✓" : ""}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="mt-3 rounded-lg bg-[#140e32]/35 border border-indigo-500/10 p-3 text-[10px] text-gray-500 italic">
                        💡 <span className="font-bold text-indigo-400">Explanation:</span> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
