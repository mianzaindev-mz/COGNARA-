/**
 * Agent memory — persistent student learning context.
 * Loaded at the start of every agent session.
 * Updated after each session with new insights.
 */

export interface AgentMemory {
  weak_topics: string[];
  strong_topics: string[];
  learning_style: "visual" | "auditory" | "reading" | "kinesthetic" | "unknown";
  preferred_language: string;
  total_sessions: number;
  last_lesson_id: string | null;
  notes: string | null;
}

export interface AgentContext {
  current_lesson_title?: string;
  current_course_title?: string;
  current_page?: string;
  code_context?: string;
}

const DEFAULT_MEMORY: AgentMemory = {
  weak_topics: [],
  strong_topics: [],
  learning_style: "unknown",
  preferred_language: "en",
  total_sessions: 0,
  last_lesson_id: null,
  notes: null,
};

/**
 * Load student's agent memory from Supabase.
 * Returns defaults if no record exists or DB is unavailable.
 */
export async function loadStudentMemory(
  studentId: string,
): Promise<AgentMemory> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("agent_memory")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (error || !data) return { ...DEFAULT_MEMORY };

    return {
      weak_topics: data.weak_topics ?? [],
      strong_topics: data.strong_topics ?? [],
      learning_style: data.learning_style ?? "unknown",
      preferred_language: data.preferred_language ?? "en",
      total_sessions: data.total_sessions ?? 0,
      last_lesson_id: data.last_lesson_id ?? null,
      notes: data.notes ?? null,
    };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

/**
 * Update student memory after a session.
 * Merges new insights with existing data.
 */
export async function updateStudentMemory(
  studentId: string,
  updates: Partial<AgentMemory>,
): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const existing = await loadStudentMemory(studentId);

    const merged = {
      student_id: studentId,
      weak_topics: Array.from(
        new Set([...(existing.weak_topics || []), ...(updates.weak_topics || [])]),
      ),
      strong_topics: Array.from(
        new Set([...(existing.strong_topics || []), ...(updates.strong_topics || [])]),
      ),
      learning_style: updates.learning_style ?? existing.learning_style,
      preferred_language: updates.preferred_language ?? existing.preferred_language,
      total_sessions: (existing.total_sessions || 0) + 1,
      last_lesson_id: updates.last_lesson_id ?? existing.last_lesson_id,
      notes: updates.notes ?? existing.notes,
      last_updated: new Date().toISOString(),
    };

    await supabase.from("agent_memory").upsert(merged, {
      onConflict: "student_id",
    });
  } catch {
    // Silent fail — memory is non-critical
  }
}

/**
 * Build the system prompt with student context injected.
 * This is what makes the agent context-aware rather than generic.
 */
export function buildSystemPrompt(
  memory: AgentMemory,
  context: AgentContext,
): string {
  return `You are COGNARA's AI tutor. You are NOT a general assistant.
Your only job is to help this specific student learn effectively.

STUDENT CONTEXT:
- Current page: ${context.current_page ?? "unknown"}
- Current lesson: ${context.current_lesson_title ?? "none"}
- Current course: ${context.current_course_title ?? "none"}
- Weak topics: ${memory.weak_topics.length > 0 ? memory.weak_topics.join(", ") : "none identified yet"}
- Strong topics: ${memory.strong_topics.length > 0 ? memory.strong_topics.join(", ") : "none identified yet"}
- Learning style: ${memory.learning_style}
- Sessions completed: ${memory.total_sessions}
- Preferred language: ${memory.preferred_language}

RULES:
1. Always reference what the student is CURRENTLY doing when possible
2. Don't just explain — generate exercises, examples, and follow-up questions
3. If a student is struggling, break concepts into smaller steps
4. After every explanation, confirm understanding with a question
5. Be encouraging but honest about errors
6. Use code examples when explaining programming concepts
7. Keep responses concise and actionable — avoid walls of text
8. Format responses with markdown (headers, code blocks, lists)
9. Respond in ${memory.preferred_language === "en" ? "English" : memory.preferred_language}

PERSONALITY:
- Confident but not arrogant
- Smart but not academic
- Direct but not blunt
- Like a brilliant friend who happens to be an expert`;
}
