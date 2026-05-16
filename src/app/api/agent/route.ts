import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { routeAgentRequest, type AgentSkill } from "@/lib/ai/master-agent";

const agentSchema = z.object({
  skill: z.enum(["teach", "debug", "quiz", "voice", "path", "support", "verify", "coach"]),
  message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  studentId: z.string().min(1),
  context: z
    .object({
      current_page: z.string().optional(),
      current_lesson_title: z.string().optional(),
      current_course_title: z.string().optional(),
    })
    .optional(),
  code: z.string().max(50_000).optional(),
  language: z.string().max(20).optional(),
  error: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = agentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { skill, message, studentId, context, code, language, error } = parsed.data;

    const result = await routeAgentRequest({
      studentId,
      skill: skill as AgentSkill,
      message,
      context,
      code,
      language,
      error,
    });

    return NextResponse.json({
      content: result.response.content,
      skill: result.skill,
      creditsUsed: result.creditsUsed,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent error";
    console.error("[Agent API]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
