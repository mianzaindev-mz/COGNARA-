import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { routeAgentRequest, type AgentSkill } from "@/lib/ai/master-agent";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { sanitizeMessage, sanitizeCode, SECURITY_HEADERS } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

/** Known demo account IDs — these always get unlimited credits */
const DEMO_USER_IDS = new Set([
  "00000000-0000-0000-0000-000000000000", // admin
  "00000000-0000-0000-0000-000000000001", // coach
  "00000000-0000-0000-0000-000000000002", // student
]);

const agentSchema = z.object({
  skill: z.enum(["teach", "debug", "quiz", "voice", "path", "support", "verify", "coach", "admin", "flashcard", "challenge", "eli5"]),
  message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  studentId: z.string().min(1),
  context: z
    .object({
      current_page: z.string().optional(),
      current_lesson_title: z.string().optional(),
      current_course_title: z.string().optional(),
      audience: z.enum(["student", "coach", "admin"]).optional(),
      voice_language: z.enum(["en", "ur"]).optional(),
    })
    .optional(),
  code: z.string().max(50_000).optional(),
  language: z.string().max(20).optional(),
  error: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit by IP first (fast check)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip, RATE_LIMITS.agent);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "You're sending messages too quickly. Please wait a moment.",
          retryAfterMs: rateCheck.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)),
            ...SECURITY_HEADERS,
          },
        },
      );
    }

    // 2. Authenticate user (verify session)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthenticated = !!user;

    // 2b. Detect demo sessions via cookie (mock client makes demo users look authenticated)
    const cookieStore = await cookies();
    const isDemoSession = !!cookieStore.get("cognara_demo_session")?.value
      || (isAuthenticated && DEMO_USER_IDS.has(user.id));

    // 3. Parse and validate input
    const body = await request.json();
    const parsed = agentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    const { skill, message, studentId, context, code, language, error } = parsed.data;

    // 4. Sanitize inputs
    const safeMessage = sanitizeMessage(message);
    const safeCode = code ? sanitizeCode(code) : undefined;
    const safeError = error ? sanitizeMessage(error, 5000) : undefined;

    // 5. Use real user ID if authenticated (prevent ID spoofing)
    const realStudentId = isAuthenticated ? user.id : studentId;

    // 6. Also rate limit by user ID (prevents one user from burning through limits)
    if (isAuthenticated) {
      const userRateCheck = checkRateLimit(user.id, RATE_LIMITS.agent);
      if (!userRateCheck.allowed) {
        return NextResponse.json(
          {
            error: "You've used the AI agent a lot recently. Please wait a minute.",
            retryAfterMs: userRateCheck.retryAfterMs,
          },
          { status: 429, headers: SECURITY_HEADERS },
        );
      }
    }

    // 7. Route to agent (demo users get unlimited credits)
    const result = await routeAgentRequest({
      studentId: realStudentId,
      skill: skill as AgentSkill,
      message: safeMessage,
      context,
      isDemo: isDemoSession || !isAuthenticated,
      code: safeCode,
      language,
      error: safeError,
    });

    return NextResponse.json(
      {
        content: result.response.content,
        skill: result.skill,
        creditsUsed: result.creditsUsed,
        creditsRemaining: result.creditsRemaining,
      },
      { headers: SECURITY_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent error";
    console.error("[Agent API]", message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: SECURITY_HEADERS },
    );
  }
}

/** Block non-POST methods */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405, headers: SECURITY_HEADERS },
  );
}
