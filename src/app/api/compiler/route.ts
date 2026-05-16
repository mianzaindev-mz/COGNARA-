import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  executeCode,
  PISTON_LANGUAGES,
  type LanguageKey,
} from "@/lib/compiler/judge0";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { sanitizeCode, SECURITY_HEADERS } from "@/lib/security/sanitize";

const compileSchema = z.object({
  language: z.string().refine((l): l is LanguageKey => l in PISTON_LANGUAGES, {
    message: "Unsupported language",
  }),
  code: z
    .string()
    .min(1, "Code cannot be empty")
    .max(50_000, "Code too long (50 KB max)"),
  stdin: z.string().max(10_000, "Stdin too long").optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip, RATE_LIMITS.compiler);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait before running more code.",
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

    const body = await request.json();
    const parsed = compileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    const { language, code, stdin } = parsed.data;

    // Sanitize code input
    const safeCode = sanitizeCode(code);
    const result = await executeCode(language, safeCode, stdin);

    return NextResponse.json(result, { headers: SECURITY_HEADERS });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Compiler service error";
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
