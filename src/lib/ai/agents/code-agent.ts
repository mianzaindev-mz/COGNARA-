/**
 * Code Agent — debugs, fixes, and explains code errors.
 * Uses Groq API for analysis, can run code via Judge0 tool.
 */

import { buildSystemPrompt, type AgentMemory, type AgentContext } from "../memory";
import type { AgentResponse } from "./teach-agent";

export interface CodeAgentInput {
  message: string;
  code?: string;
  language?: string;
  error?: string;
  memory: AgentMemory;
  context: AgentContext;
}

const CODE_SYSTEM_ADDENDUM = `

ADDITIONAL ROLE: Code Debugger
You are also an expert debugger. When given code with errors:
1. Identify the EXACT line and nature of the error
2. Explain WHY it's wrong (conceptually)
3. Show the FIXED code with comments
4. Suggest a way to avoid this mistake in the future

Format your response as:
## 🐛 Bug Found
(what's wrong)

## 🔧 Fix
(corrected code with explanation)

## 💡 Tip
(how to avoid this in the future)`;

export async function runCodeAgent(input: CodeAgentInput): Promise<AgentResponse> {
  const basePrompt = buildSystemPrompt(input.memory, input.context);
  const systemPrompt = basePrompt + CODE_SYSTEM_ADDENDUM;
  const groqKey = process.env.GROQ_API_KEY;

  // Build the user message with code context
  let userMessage = input.message;
  if (input.code) {
    userMessage += `\n\nHere is my code (${input.language || "unknown"}):\n\`\`\`${input.language || ""}\n${input.code}\n\`\`\``;
  }
  if (input.error) {
    userMessage += `\n\nI'm getting this error:\n\`\`\`\n${input.error}\n\`\`\``;
  }

  if (groqKey) {
    return callGroqForCode(groqKey, systemPrompt, userMessage);
  }

  return generateCodeFallback(input);
}

async function callGroqForCode(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<AgentResponse> {
  const Groq = (await import("groq-sdk")).default;
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    stream: false,
  });

  const content = completion.choices?.[0]?.message?.content ?? "I couldn't analyze the code.";
  return { content, skill: "debug", tokensUsed: completion.usage?.total_tokens ?? 0 };
}

function generateCodeFallback(input: CodeAgentInput): AgentResponse {
  if (!input.code && !input.error) {
    return {
      content: `## 🐛 Code Debug Mode

Paste your code and describe the issue, and I'll help you fix it!

### What I can do:
- **Find bugs** — I'll identify the exact error
- **Explain errors** — Understand why it's happening
- **Fix code** — Get corrected code with explanations
- **Best practices** — Learn to write better code

### Try:
- Paste code with an error message
- Ask "Why does this give a TypeError?"
- Say "Help me optimize this function"`,
      skill: "debug",
    };
  }

  const code = input.code ?? "";
  const lang = input.language ?? "python";
  let content: string;

  // Basic static analysis
  if (lang === "python") {
    if (code.includes("print(") && !code.includes(")")) {
      content = `## 🐛 Bug Found
**Missing closing parenthesis** on your \`print()\` call.

## 🔧 Fix
Make sure every opening \`(\` has a matching \`)\`.

## 💡 Tip
Most editors highlight mismatched brackets — enable bracket pair colorization!`;
    } else if (code.includes("def ") && !code.includes(":")) {
      content = `## 🐛 Bug Found
**Missing colon** at the end of your function definition.

## 🔧 Fix
\`\`\`python
def my_function():  # Don't forget the colon!
    pass
\`\`\`

## 💡 Tip
In Python, all blocks (if, for, def, class) end with a colon \`:\``;
    } else {
      content = `## 🔍 Code Analysis

I've reviewed your ${JUDGE0_LABEL[lang] ?? lang} code. Here are my observations:

- **Lines**: ${code.split("\n").length}
- **Structure**: ${code.includes("def ") ? "Contains function definitions ✅" : "No functions detected"}
- **Error handling**: ${code.includes("try") ? "Has try/except blocks ✅" : "Consider adding error handling ⚠️"}

### Suggestions:
1. Add docstrings to your functions
2. Use meaningful variable names
3. Test edge cases (empty input, negative numbers)

*💡 Connect your Groq API key for detailed AI-powered analysis!*`;
    }
  } else {
    content = `## 🔍 Code Review

I see your ${JUDGE0_LABEL[lang] ?? lang} code (${code.split("\n").length} lines).

For detailed AI-powered debugging:
1. Configure your **Groq API key** in \`.env.local\`
2. The agent will analyze errors, suggest fixes, and explain concepts

### Quick Checks:
- ✅ Are all brackets/braces matched?
- ✅ Are all variables declared before use?
- ✅ Is the return type correct?

*Paste the error message along with your code for more specific help.*`;
  }

  return { content, skill: "debug" };
}

const JUDGE0_LABEL: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
};
