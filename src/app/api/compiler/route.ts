import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  executeCode,
  JUDGE0_LANGUAGES,
  type LanguageKey,
} from "@/lib/compiler/judge0";

const compileSchema = z.object({
  language: z.string().refine((l): l is LanguageKey => l in JUDGE0_LANGUAGES, {
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
    const body = await request.json();
    const parsed = compileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { language, code, stdin } = parsed.data;
    const result = await executeCode(language, code, stdin);

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Compiler service error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
