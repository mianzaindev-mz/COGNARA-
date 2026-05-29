// src/lib/ai/agents/schedule-agent.ts
import { createClient } from "@/lib/supabase/server";
import { logAgentAction } from "../audit-log";

export interface ScheduledTaskInput {
  userId: string;
  message: string;
  currentDateTime?: string;
}

export interface TaskExtractionResult {
  title: string;
  type: 'email' | 'notification' | 'reminder' | 'quiz_reminder' | 'study_reminder' | 'deadline_alert' | 'weekly_report' | 'custom';
  scheduled_at: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_time?: string | null;
  recurrence_day?: number | null;
  max_runs?: number | null;
  payload: {
    message?: string;
    to?: string;
    subject?: string;
    body?: string;
    action_url?: string;
    [key: string]: any;
  };
}

export async function createTask(input: ScheduledTaskInput): Promise<string> {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const groqKey = process.env.GROQ_API_KEY;

    const referenceDateTime = input.currentDateTime || new Date().toISOString();

    let extracted: TaskExtractionResult = {
      title: "Study Reminder",
      type: "reminder",
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      recurrence: "once",
      payload: {
        message: "Time to review your learning materials on Cognara!"
      }
    };

    if (groqKey && input.message.trim()) {
      try {
        const GroqModule = await import("groq-sdk");
        const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
        const groq = new Groq({ apiKey: groqKey });

        const prompt = `Reference datetime point: ${referenceDateTime}
User requested task: "${input.message}"`;

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are COGNARA's scheduler assistant. Extract a scheduled task from the user's message.
Use the provided Reference datetime point to resolve relative timings (e.g. 'tomorrow at 9am', 'every Sunday at 7pm').
Return ONLY valid JSON. Start directly with {.

Return JSON structure:
{
  "title": "Short descriptive title of the task",
  "type": "email"|"notification"|"reminder"|"quiz_reminder"|"study_reminder"|"deadline_alert"|"weekly_report"|"custom",
  "scheduled_at": "ISO 8601 Datetime string representing the FIRST execution point",
  "recurrence": "once"|"daily"|"weekly"|"monthly",
  "recurrence_time": "HH:MM format if repeating, otherwise null",
  "recurrence_day": number between 0 (Sunday) and 6 (Saturday) if weekly, 1-31 if monthly, otherwise null,
  "max_runs": integer count if a limit is mentioned, or null,
  "payload": {
    "message": "Content of the reminder or notification",
    "to": "Recipient email if email type",
    "subject": "Email subject line if email type",
    "body": "Email body if email type",
    "action_url": "URL link to visit when clicking notification if applicable"
  }
}`
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        });

        const raw = completion.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);
        if (parsed.title && parsed.scheduled_at) {
          extracted = parsed;
        }
      } catch (err) {
        console.error("[Schedule Agent] Groq extraction failed:", err);
      }
    }

    // Insert task into scheduled_tasks table
    const { data: task, error } = await supabase
      .from("scheduled_tasks")
      .insert({
        user_id: input.userId,
        title: extracted.title,
        type: extracted.type,
        payload: extracted.payload || {},
        recurrence: extracted.recurrence || "once",
        recurrence_time: extracted.recurrence_time || null,
        recurrence_day: extracted.recurrence_day || null,
        scheduled_at: extracted.scheduled_at,
        next_run_at: extracted.scheduled_at,
        status: "pending",
        max_runs: extracted.max_runs || null
      })
      .select("*")
      .single();

    if (error) throw error;

    // Log agent audit trail
    void logAgentAction({
      user_id: input.userId,
      skill: "schedule",
      input_length: input.message.length,
      output_length: JSON.stringify(extracted).length,
      credits_used: 0,
      status: "success",
      flags: [`task_id:${task.id}`, `type:${extracted.type}`],
      duration_ms: Date.now() - startTime
    });

    const repeatsText = extracted.recurrence !== "once" ? ` (repeating ${extracted.recurrence})` : "";
    return `✅ **Task Scheduled Successfully!**\n\n- **Title:** ${extracted.title}\n- **Type:** ${extracted.type.toUpperCase()}\n- **First Scheduled At:** ${new Date(extracted.scheduled_at).toLocaleString()}${repeatsText}\n- **Payload:** ${extracted.payload.message || "Cognara scheduled task execution."}`;

  } catch (err: any) {
    console.error("[Schedule Agent] Failed to schedule task:", err);
    return `⚠️ **Failed to Schedule Task:** ${err.message || "Unknown system error"}`;
  }
}
