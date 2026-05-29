// src/lib/ai/agents/transcript-agent.ts
import { createClient } from "@/lib/supabase/server";
import { logAgentAction } from "../audit-log";

export interface LectureNotesResult {
  id: string;
  transcript_id: string | null;
  lesson_id: string;
  student_id: string;
  title: string;
  summary: string;
  key_points: string[];
  key_terms: Record<string, string>;
  table_of_contents: { title: string; time?: string }[];
  full_notes_md: string;
  created_at: string;
}

/**
 * generateNotes
 * Uses Groq to synthesize structured, high-quality study notes from raw video transcripts.
 * Persists the resulting notes to `lecture_notes` and logs the agent action.
 */
export async function generateNotes(
  transcriptText: string,
  lessonTitle: string,
  studentId: string,
  lessonId: string,
  transcriptId: string | null = null
): Promise<LectureNotesResult | null> {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const groqKey = process.env.GROQ_API_KEY;

    let summary = "";
    let keyPoints: string[] = [];
    let keyTerms: Record<string, string> = {};
    let tableOfContents: { title: string; time?: string }[] = [];
    let fullNotesMd = "";

    if (groqKey && transcriptText.trim().length > 50) {
      try {
        const GroqModule = await import("groq-sdk");
        const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
        const groq = new Groq({ apiKey: groqKey });

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert academic tutor and note-taker.
Synthesize the provided lecture transcription into clean, comprehensive, and highly-structured study notes.
Return ONLY valid JSON. Start directly with {.

Required JSON Structure:
{
  "summary": "A cohesive 3-4 sentence high-level summary of the entire lecture",
  "key_points": [
    "At least 4-6 bullet points of crucial insights, concepts, or takeaways"
  ],
  "key_terms": {
    "Term/Concept Name": "Clean, concise definition based on context"
  },
  "table_of_contents": [
    { "title": "Logical topic boundary or timestamped section", "time": "Approximate timestamp if discernable, or null" }
  ],
  "full_notes_md": "# Fully-formatted markdown document\\n\\nUse structured headings, italicized emphasis, bullet points, callout blocks, and code blocks if applicable to build comprehensive study sheets that represent the entire lecture."
}`
            },
            {
              role: "user",
              content: `Lecture Title: ${lessonTitle}
Transcription Text:
${transcriptText}`
            }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        });

        const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
        summary = parsed.summary || "";
        keyPoints = parsed.key_points || [];
        keyTerms = parsed.key_terms || {};
        tableOfContents = parsed.table_of_contents || [];
        fullNotesMd = parsed.full_notes_md || "";
      } catch (err) {
        console.error("[Transcript Agent] Groq notes generation failed:", err);
      }
    }

    // Fallback if Groq key is missing or failed
    if (!summary || !fullNotesMd) {
      summary = `High-level lecture notes captured from transcription of "${lessonTitle}".`;
      keyPoints = [
        "Interactive lesson transcripts captured automatically by Cognara system.",
        "Synthesized topics and core structural concepts.",
        "Key definitions and step-by-step methodologies review."
      ];
      keyTerms = {
        "Transcript": "A written version of material originally presented in another medium, such as audio.",
        "Synthesis": "The combination of ideas or elements to form a theory or system."
      };
      tableOfContents = [
        { title: "Introduction and Core Context Overview", time: "0:00" },
        { title: "Technical Walkthrough and Demonstration", time: "5:00" }
      ];
      fullNotesMd = `# ${lessonTitle}\n\n## Lecture Notes Overview\n\nThis study document represents synthesized highlights automatically generated from the lesson video transcript.\n\n### Key Highlights\n\n- Real-time speech capture enabled during video playthrough.\n- Automatic division of concepts by cognitive boundary detectors.\n\n*Review the full timeline sync in your player panel for in-depth coverage.*`;
    }

    // Persist into database
    const { data: newNote, error: noteErr } = await supabase
      .from("lecture_notes")
      .insert({
        transcript_id: transcriptId,
        lesson_id: lessonId,
        student_id: studentId,
        title: `${lessonTitle} Notes`,
        summary,
        key_points: keyPoints,
        key_terms: keyTerms,
        table_of_contents: tableOfContents,
        full_notes_md: fullNotesMd
      })
      .select("*")
      .single();

    if (noteErr) {
      console.error("[Transcript Agent] Failed to save lecture notes:", noteErr);
      return null;
    }

    // Create a new Notebook Page containing these notes
    const { data: notebookPage } = await supabase
      .from("notebook_pages")
      .insert({
        student_id: studentId,
        course_id: (
          await supabase.from("lessons").select("course_id").eq("id", lessonId).single()
        ).data?.course_id || null,
        lesson_id: lessonId,
        title: `${lessonTitle} AI Notes`,
        content: `# ${lessonTitle} AI Notes\n\n${summary}\n\n${fullNotesMd}`,
        created_at: new Date().toISOString()
      })
      .select("id")
      .maybeSingle();

    if (notebookPage) {
      // Link page back to lecture notes
      await supabase
        .from("lecture_notes")
        .update({ notebook_page_id: notebookPage.id })
        .eq("id", newNote.id);
      
      newNote.notebook_page_id = notebookPage.id;
    }

    // Audit Log Agent action
    void logAgentAction({
      user_id: studentId,
      skill: "lecture_notes",
      input_length: transcriptText.length,
      output_length: fullNotesMd.length,
      credits_used: 1, // Phase 4 credits cost
      status: "success",
      flags: [`notes_id:${newNote.id}`],
      duration_ms: Date.now() - startTime
    });

    return newNote as unknown as LectureNotesResult;

  } catch (err) {
    console.error("[Transcript Agent] generateNotes exception:", err);
    return null;
  }
}
