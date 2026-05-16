/**
 * Judge0 CE API client — sandboxed code execution.
 * Uses RapidAPI Judge0 CE endpoint (free tier: 100 req/day).
 * Falls back to a mock when JUDGE0_API_KEY is not configured.
 */

/* ── Language map: display name → Judge0 language_id ─────── */
export const JUDGE0_LANGUAGES = {
  python: { id: 71, label: "Python 3", ext: "py", monaco: "python" },
  javascript: { id: 63, label: "JavaScript", ext: "js", monaco: "javascript" },
  typescript: { id: 74, label: "TypeScript", ext: "ts", monaco: "typescript" },
  java: { id: 62, label: "Java", ext: "java", monaco: "java" },
  c: { id: 50, label: "C (GCC)", ext: "c", monaco: "c" },
  cpp: { id: 54, label: "C++ (GCC)", ext: "cpp", monaco: "cpp" },
  csharp: { id: 51, label: "C#", ext: "cs", monaco: "csharp" },
  go: { id: 60, label: "Go", ext: "go", monaco: "go" },
  rust: { id: 73, label: "Rust", ext: "rs", monaco: "rust" },
  ruby: { id: 72, label: "Ruby", ext: "rb", monaco: "ruby" },
  php: { id: 68, label: "PHP", ext: "php", monaco: "php" },
  swift: { id: 83, label: "Swift", ext: "swift", monaco: "swift" },
  kotlin: { id: 78, label: "Kotlin", ext: "kt", monaco: "kotlin" },
  r: { id: 80, label: "R", ext: "r", monaco: "r" },
  sql: { id: 82, label: "SQL", ext: "sql", monaco: "sql" },
  bash: { id: 46, label: "Bash", ext: "sh", monaco: "shell" },
  dart: { id: 90, label: "Dart", ext: "dart", monaco: "dart" },
  lua: { id: 64, label: "Lua", ext: "lua", monaco: "lua" },
} as const;

export type LanguageKey = keyof typeof JUDGE0_LANGUAGES;

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
  token?: string;
}

/* ── Default code starters per language ──────────────────── */
export const DEFAULT_CODE: Record<LanguageKey, string> = {
  python: `# COGNARA Code Editor — Python 3\n\nprint("Hello, COGNARA! 🚀")\n`,
  javascript: `// COGNARA Code Editor — JavaScript\n\nconsole.log("Hello, COGNARA! 🚀");\n`,
  typescript: `// COGNARA Code Editor — TypeScript\n\nconst greet = (name: string): string => \`Hello, \${name}! 🚀\`;\nconsole.log(greet("COGNARA"));\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, COGNARA! 🚀");\n    }\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, COGNARA! 🚀\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, COGNARA! 🚀" << endl;\n    return 0;\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, COGNARA! 🚀");\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, COGNARA! 🚀")\n}\n`,
  rust: `fn main() {\n    println!("Hello, COGNARA! 🚀");\n}\n`,
  ruby: `# COGNARA Code Editor — Ruby\n\nputs "Hello, COGNARA! 🚀"\n`,
  php: `<?php\n\necho "Hello, COGNARA! 🚀\\n";\n`,
  swift: `print("Hello, COGNARA! 🚀")\n`,
  kotlin: `fun main() {\n    println("Hello, COGNARA! 🚀")\n}\n`,
  r: `cat("Hello, COGNARA! 🚀\\n")\n`,
  sql: `SELECT 'Hello, COGNARA! 🚀' AS greeting;\n`,
  bash: `#!/bin/bash\necho "Hello, COGNARA! 🚀"\n`,
  dart: `void main() {\n  print('Hello, COGNARA! 🚀');\n}\n`,
  lua: `print("Hello, COGNARA! 🚀")\n`,
};

/* ── Judge0 API calls ────────────────────────────────────── */

const JUDGE0_HOST = process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com";
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || "";

function isConfigured(): boolean {
  return JUDGE0_KEY.length > 0;
}

/** Submit code → poll for result → return ExecutionResult */
export async function executeCode(
  language: LanguageKey,
  code: string,
  stdin?: string,
): Promise<ExecutionResult> {
  if (!isConfigured()) {
    return mockExecution(language, code, stdin);
  }

  const langInfo = JUDGE0_LANGUAGES[language];
  if (!langInfo) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Submit
  const submitRes = await fetch(
    `https://${JUDGE0_HOST}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": JUDGE0_KEY,
        "X-RapidAPI-Host": JUDGE0_HOST,
      },
      body: JSON.stringify({
        language_id: langInfo.id,
        source_code: Buffer.from(code).toString("base64"),
        stdin: stdin ? Buffer.from(stdin).toString("base64") : undefined,
        cpu_time_limit: 10,
        memory_limit: 256000,
      }),
    },
  );

  if (!submitRes.ok) {
    const body = await submitRes.text();
    throw new Error(`Judge0 API error (${submitRes.status}): ${body}`);
  }

  const result = await submitRes.json();

  return {
    stdout: result.stdout ? Buffer.from(result.stdout, "base64").toString() : null,
    stderr: result.stderr ? Buffer.from(result.stderr, "base64").toString() : null,
    compile_output: result.compile_output
      ? Buffer.from(result.compile_output, "base64").toString()
      : null,
    status: result.status ?? { id: 0, description: "Unknown" },
    time: result.time ?? null,
    memory: result.memory ?? null,
  };
}

/* ── Mock execution (when no API key) ───────────────────── */

function mockExecution(
  language: LanguageKey,
  code: string,
  stdin?: string,
): ExecutionResult {
  // Simple mock: detect print/console.log statements and echo them
  let stdout = "";

  if (language === "python") {
    const prints = code.match(/print\((.+?)\)/g);
    if (prints) {
      stdout = prints
        .map((p) => {
          const inner = p.slice(6, -1).trim();
          // Remove quotes
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith("'") && inner.endsWith("'"))
          ) {
            return inner.slice(1, -1);
          }
          // f-string or expression — just return as-is
          return inner;
        })
        .join("\n");
    }
  } else if (language === "javascript" || language === "typescript") {
    const logs = code.match(/console\.log\((.+?)\)/g);
    if (logs) {
      stdout = logs
        .map((l) => {
          const inner = l.replace(/console\.log\(/, "").slice(0, -1).trim();
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith("'") && inner.endsWith("'")) ||
            (inner.startsWith("`") && inner.endsWith("`"))
          ) {
            return inner.slice(1, -1);
          }
          return inner;
        })
        .join("\n");
    }
  } else {
    stdout = `[Mock] Code executed successfully (${JUDGE0_LANGUAGES[language].label})`;
  }

  if (stdin) {
    stdout += `\n[stdin received: ${stdin.length} chars]`;
  }

  return {
    stdout: stdout || "[Mock] Program finished with no output",
    stderr: null,
    compile_output: null,
    status: { id: 3, description: "Accepted" },
    time: "0.012",
    memory: 3200,
  };
}
