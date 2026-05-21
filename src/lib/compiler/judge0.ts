/**
 * Multi-backend code execution service.
 *
 * Priority:
 * 1. JDoodle (if JDOODLE_CLIENT_ID is set — free, 200 req/day, no credit card)
 * 2. Judge0 CE (if JUDGE0_API_KEY is set — RapidAPI)
 * 3. Wandbox (free, no key needed)
 * 4. Mock (offline fallback)
 */

/* ── Language map ────────────────────────────────────────── */
export const PISTON_LANGUAGES = {
  python: { label: "Python 3", ext: "py", monaco: "python", wandbox: "cpython-3.10.2", judge0Id: 71, jdoodle: "python3", jdoodleIdx: "4" },
  javascript: { label: "JavaScript", ext: "js", monaco: "javascript", wandbox: "nodejs-16.14.0", judge0Id: 63, jdoodle: "nodejs", jdoodleIdx: "4" },
  typescript: { label: "TypeScript", ext: "ts", monaco: "typescript", wandbox: "typescript-4.6.2", judge0Id: 74, jdoodle: "typescript", jdoodleIdx: "0" },
  java: { label: "Java", ext: "java", monaco: "java", wandbox: "openjdk-jdk-17.0.0+35", judge0Id: 62, jdoodle: "java", jdoodleIdx: "4" },
  c: { label: "C (GCC)", ext: "c", monaco: "c", wandbox: "gcc-12.1.0-c", judge0Id: 50, jdoodle: "c", jdoodleIdx: "5" },
  cpp: { label: "C++ (GCC)", ext: "cpp", monaco: "cpp", wandbox: "gcc-12.1.0", judge0Id: 54, jdoodle: "cpp17", jdoodleIdx: "1" },
  csharp: { label: "C#", ext: "cs", monaco: "csharp", wandbox: "mono-6.12.0.122", judge0Id: 51, jdoodle: "csharp", jdoodleIdx: "4" },
  go: { label: "Go", ext: "go", monaco: "go", wandbox: "go-1.18", judge0Id: 60, jdoodle: "go", jdoodleIdx: "4" },
  rust: { label: "Rust", ext: "rs", monaco: "rust", wandbox: "rust-1.60.0", judge0Id: 73, jdoodle: "rust", jdoodleIdx: "4" },
  ruby: { label: "Ruby", ext: "rb", monaco: "ruby", wandbox: "ruby-3.1.2", judge0Id: 72, jdoodle: "ruby", jdoodleIdx: "4" },
  php: { label: "PHP", ext: "php", monaco: "php", wandbox: "php-8.1.5", judge0Id: 68, jdoodle: "php", jdoodleIdx: "4" },
  swift: { label: "Swift", ext: "swift", monaco: "swift", wandbox: "swift-5.6.1", judge0Id: 83, jdoodle: "swift", jdoodleIdx: "4" },
  kotlin: { label: "Kotlin", ext: "kt", monaco: "kotlin", wandbox: "kotlin-1.6.20", judge0Id: 78, jdoodle: "kotlin", jdoodleIdx: "3" },
  bash: { label: "Bash", ext: "sh", monaco: "shell", wandbox: "bash", judge0Id: 46, jdoodle: "bash", jdoodleIdx: "4" },
  lua: { label: "Lua", ext: "lua", monaco: "lua", wandbox: "lua-5.4.4", judge0Id: 64, jdoodle: "lua", jdoodleIdx: "3" },
  r: { label: "R", ext: "r", monaco: "r", wandbox: null, judge0Id: 80, jdoodle: "r", jdoodleIdx: "4" },
  sql: { label: "SQL", ext: "sql", monaco: "sql", wandbox: null, judge0Id: 82, jdoodle: "sql", jdoodleIdx: "3" },
  dart: { label: "Dart", ext: "dart", monaco: "dart", wandbox: null, judge0Id: 90, jdoodle: "dart", jdoodleIdx: "4" },
  perl: { label: "Perl", ext: "pl", monaco: "perl", wandbox: "perl-5.34.0", judge0Id: 85, jdoodle: "perl", jdoodleIdx: "4" },
  scala: { label: "Scala", ext: "scala", monaco: "scala", wandbox: null, judge0Id: 81, jdoodle: "scala", jdoodleIdx: "4" },
  haskell: { label: "Haskell", ext: "hs", monaco: "plaintext", wandbox: null, judge0Id: 61, jdoodle: "haskell", jdoodleIdx: "4" },
  elixir: { label: "Elixir", ext: "ex", monaco: "elixir", wandbox: null, judge0Id: 57, jdoodle: "elixir", jdoodleIdx: "4" },
  clojure: { label: "Clojure", ext: "clj", monaco: "clojure", wandbox: null, judge0Id: 86, jdoodle: "clojure", jdoodleIdx: "4" },
  pascal: { label: "Pascal", ext: "pas", monaco: "pascal", wandbox: null, judge0Id: 67, jdoodle: "pascal", jdoodleIdx: "3" },
  fsharp: { label: "F#", ext: "fs", monaco: "fsharp", wandbox: null, judge0Id: 87, jdoodle: "fsharp", jdoodleIdx: "4" },
  objectivec: { label: "Objective-C", ext: "m", monaco: "objective-c", wandbox: null, judge0Id: 79, jdoodle: "objc", jdoodleIdx: "4" },
  fortran: { label: "Fortran", ext: "f90", monaco: "plaintext", wandbox: null, judge0Id: 59, jdoodle: "fortran", jdoodleIdx: "4" },
  mermaid: { label: "Mermaid Diagram", ext: "mermaid", monaco: "markdown", wandbox: null, judge0Id: null, jdoodle: null, jdoodleIdx: null },
  html: { label: "HTML", ext: "html", monaco: "html", wandbox: null, judge0Id: null, jdoodle: null, jdoodleIdx: null },
  css: { label: "CSS", ext: "css", monaco: "css", wandbox: null, judge0Id: null, jdoodle: null, jdoodleIdx: null },
  markdown: { label: "Markdown", ext: "md", monaco: "markdown", wandbox: null, judge0Id: null, jdoodle: null, jdoodleIdx: null },
} as const;

export type LanguageKey = keyof typeof PISTON_LANGUAGES;

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

/* ── Default code starters ───────────────────────────────── */
export const DEFAULT_CODE: Record<LanguageKey, string> = {
  python: `# COGNARA Code Lab — Python 3\n\nname = input("What's your name? ")\nprint(f"Hello, {name}! Welcome to COGNARA 🚀")\n\nfor i in range(5):\n    print(f"  Step {i + 1}")\n`,
  javascript: `// COGNARA Code Lab — JavaScript\n\nconst greet = (name) => \`Hello, \${name}! 🚀\`;\nconsole.log(greet("COGNARA"));\n\nconst nums = [1, 2, 3, 4, 5];\nconsole.log("Sum:", nums.reduce((a, b) => a + b));\n`,
  typescript: `// COGNARA Code Lab — TypeScript\n\ninterface Student { name: string; level: number; }\nconst student: Student = { name: "COGNARA", level: 42 };\nconsole.log(\`\${student.name} is level \${student.level} 🚀\`);\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, COGNARA! 🚀");\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Step " + i);\n        }\n    }\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, COGNARA! 🚀\\n");\n    int a = 0, b = 1;\n    for (int i = 0; i < 10; i++) {\n        printf("%d ", a);\n        int temp = a + b; a = b; b = temp;\n    }\n    printf("\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    cout << "Hello, COGNARA! 🚀" << endl;\n    vector<int> nums = {5, 3, 8, 1, 9};\n    sort(nums.begin(), nums.end());\n    for (int n : nums) cout << n << " ";\n    cout << endl;\n    return 0;\n}\n`,
  csharp: `using System;\nusing System.Linq;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, COGNARA! 🚀");\n        var nums = new[] { 5, 3, 8, 1, 9 };\n        Console.WriteLine($"Sum: {nums.Sum()}");\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, COGNARA! 🚀")\n    a, b := 0, 1\n    for i := 0; i < 10; i++ {\n        fmt.Printf("%d ", a)\n        a, b = b, a+b\n    }\n    fmt.Println()\n}\n`,
  rust: `fn main() {\n    println!("Hello, COGNARA! 🚀");\n    let nums = vec![5, 3, 8, 1, 9];\n    let sum: i32 = nums.iter().sum();\n    println!("Sum of {:?} = {}", nums, sum);\n}\n`,
  ruby: `puts "Hello, COGNARA! 🚀"\n\nnums = [5, 3, 8, 1, 9]\nputs "Sorted: #{nums.sort}"\nputs "Sum: #{nums.sum}"\n`,
  php: `<?php\necho "Hello, COGNARA! 🚀\\n";\n$nums = [5, 3, 8, 1, 9];\nsort($nums);\necho "Sorted: " . implode(", ", $nums) . "\\n";\n`,
  swift: `print("Hello, COGNARA! 🚀")\nlet nums = [5, 3, 8, 1, 9]\nprint("Sorted: \\(nums.sorted())")\nprint("Sum: \\(nums.reduce(0, +))")\n`,
  kotlin: `fun main() {\n    println("Hello, COGNARA! 🚀")\n    val nums = listOf(5, 3, 8, 1, 9)\n    println("Sorted: \${nums.sorted()}")\n    println("Sum: \${nums.sum()}")\n}\n`,
  bash: `#!/bin/bash\necho "Hello, COGNARA! 🚀"\nfor i in {1..5}; do\n    echo "Step $i: $((i * i))"\ndone\n`,
  lua: `print("Hello, COGNARA! 🚀")\nlocal nums = {5, 3, 8, 1, 9}\ntable.sort(nums)\nfor _, v in ipairs(nums) do io.write(v .. " ") end\nprint()\n`,
  r: `cat("Hello, COGNARA! 🚀\\n")\nnums <- c(5, 3, 8, 1, 9)\ncat("Mean:", mean(nums), "\\n")\n`,
  sql: `CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, score INTEGER);\nINSERT INTO students VALUES (1, 'Ali', 95);\nINSERT INTO students VALUES (2, 'Sara', 88);\nSELECT name, score FROM students ORDER BY score DESC;\n`,
  dart: `void main() {\n  print('Hello, COGNARA! 🚀');\n  var nums = [5, 3, 8, 1, 9];\n  nums.sort();\n  print('Sorted: \$nums');\n}\n`,
  perl: `#!/usr/bin/perl\nuse strict;\nuse warnings;\n\nprint "Hello, COGNARA! 🚀\\n";\nmy @nums = (5, 3, 8, 1, 9);\nmy @sorted = sort { $a <=> $b } @nums;\nprint "Sorted: @sorted\\n";\n`,
  scala: `object Main extends App {\n  println("Hello, COGNARA! 🚀")\n  val nums = List(5, 3, 8, 1, 9)\n  println(s"Sorted: \${nums.sorted}")\n  println(s"Sum: \${nums.sum}")\n}\n`,
  haskell: `main :: IO ()\nmain = do\n  putStrLn "Hello, COGNARA! 🚀"\n  let nums = [5, 3, 8, 1, 9]\n  putStrLn $ "Sum: " ++ show (sum nums)\n  putStrLn $ "Sorted: " ++ show (quickSort nums)\n\nquickSort :: Ord a => [a] -> [a]\nquickSort [] = []\nquickSort (x:xs) = quickSort smaller ++ [x] ++ quickSort larger\n  where smaller = filter (<= x) xs\n        larger  = filter (> x) xs\n`,
  elixir: `IO.puts("Hello, COGNARA! 🚀")\nnums = [5, 3, 8, 1, 9]\nIO.inspect(Enum.sort(nums), label: "Sorted")\nIO.puts("Sum: #\{Enum.sum(nums)}")\n`,
  clojure: `(println "Hello, COGNARA! 🚀")\n(def nums [5 3 8 1 9])\n(println "Sorted:" (sort nums))\n(println "Sum:" (reduce + nums))\n`,
  pascal: `program Hello;\nvar\n  i: Integer;\nbegin\n  WriteLn('Hello, COGNARA! 🚀');\n  for i := 1 to 5 do\n    WriteLn('Step ', i, ': ', i * i);\nend.\n`,
  fsharp: `printfn "Hello, COGNARA! 🚀"\nlet nums = [5; 3; 8; 1; 9]\nprintfn "Sorted: %A" (List.sort nums)\nprintfn "Sum: %d" (List.sum nums)\n`,
  objectivec: `#import <Foundation/Foundation.h>\n\nint main() {\n  @autoreleasepool {\n    NSLog(@"Hello, COGNARA! 🚀");\n    NSArray *nums = @[@5, @3, @8, @1, @9];\n    NSArray *sorted = [nums sortedArrayUsingSelector:@selector(compare:)];\n    NSLog(@"Sorted: %@", sorted);\n  }\n  return 0;\n}\n`,
  fortran: `program hello\n  implicit none\n  integer :: i\n  print *, "Hello, COGNARA! 🚀"\n  do i = 1, 5\n    print *, "Step", i, ":", i*i\n  end do\nend program hello\n`,
  mermaid: `%% COGNARA Code Lab — Mermaid Diagram\n\ngraph TD\n    A[Start] --> B{Is it premium?}\n    B -- Yes --> C[Wow the User! 🚀]\n    B -- No --> D[Redesign with Antigravity!]\n    C --> E[Cognara Success! 🎉]\n    D --> B\n`,
  html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: 'Segoe UI', system-ui, sans-serif;\n      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n      color: #fff;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      min-height: 100vh;\n    }\n    .card {\n      background: rgba(255,255,255,0.15);\n      backdrop-filter: blur(12px);\n      border-radius: 24px;\n      padding: 48px;\n      text-align: center;\n      box-shadow: 0 8px 32px rgba(0,0,0,0.25);\n      border: 1px solid rgba(255,255,255,0.18);\n    }\n    h1 { font-size: 2.2em; margin-bottom: 8px; }\n    p { opacity: 0.85; font-size: 1.1em; }\n    .badge {\n      display: inline-block;\n      margin-top: 20px;\n      padding: 8px 24px;\n      background: rgba(255,255,255,0.2);\n      border-radius: 999px;\n      font-size: 0.9em;\n    }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>Hello, COGNARA! 🚀</h1>\n    <p>Welcome to the HTML Playground</p>\n    <span class="badge">Built with ❤️</span>\n  </div>\n</body>\n</html>\n`,
  css: `/* COGNARA Code Lab — CSS Preview */\n\n.preview-container {\n  font-family: 'Segoe UI', system-ui, sans-serif;\n  min-height: 100%;\n  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 40px;\n  color: #fff;\n}\n\n.preview-container h1 {\n  font-size: 2.4em;\n  text-shadow: 0 2px 12px rgba(0,0,0,0.2);\n  margin-bottom: 12px;\n}\n\n.preview-container p {\n  font-size: 1.1em;\n  opacity: 0.85;\n}\n\n.preview-container .card {\n  margin-top: 24px;\n  background: rgba(255,255,255,0.18);\n  backdrop-filter: blur(10px);\n  border-radius: 16px;\n  padding: 24px 32px;\n  border: 1px solid rgba(255,255,255,0.25);\n  box-shadow: 0 4px 24px rgba(0,0,0,0.15);\n}\n\n.preview-container .badge {\n  display: inline-block;\n  padding: 6px 18px;\n  background: rgba(255,255,255,0.25);\n  border-radius: 999px;\n  font-size: 0.85em;\n  margin-top: 16px;\n}\n`,
  markdown: `# Hello, COGNARA! 🚀\n\nWelcome to the **Markdown** previewer in Code Lab.\n\n## Features\n\n- **Bold text** and *italic text*\n- Inline \`code\` blocks\n- Ordered and unordered lists\n- Headings, blockquotes, and more\n\n### Code Example\n\n\`\`\`python\nprint("Hello from COGNARA!")\n\`\`\`\n\n> "Learning is a journey, not a destination."\n\n---\n\n| Language | Difficulty | Fun Factor |\n|----------|-----------|------------|\n| Python   | Easy      | ⭐⭐⭐⭐⭐  |\n| JavaScript | Medium | ⭐⭐⭐⭐   |\n| Rust     | Hard      | ⭐⭐⭐⭐⭐  |\n\nMade with ❤️ by **COGNARA**\n`,
};

/* ── Main execution function ─────────────────────────────── */

export async function executeCode(
  language: LanguageKey,
  code: string,
  stdin?: string,
): Promise<ExecutionResult> {
  // Client-side rendered languages — return code as-is for browser rendering
  const CLIENT_RENDERED: LanguageKey[] = ["mermaid", "html", "css", "markdown"];
  if (CLIENT_RENDERED.includes(language)) {
    return {
      stdout: code,
      stderr: null,
      compile_output: null,
      status: { id: 3, description: "Rendered" },
      time: "0.010",
      memory: null,
    };
  }

  const langInfo = PISTON_LANGUAGES[language];
  if (!langInfo) throw new Error(`Unsupported language: ${language}`);

  // 1. Try JDoodle (free, 200/day, no credit card)
  const jdoodleId = process.env.JDOODLE_CLIENT_ID;
  const jdoodleSecret = process.env.JDOODLE_CLIENT_SECRET;
  if (jdoodleId && jdoodleSecret && langInfo.jdoodle) {
    try {
      return await executeViaJDoodle(langInfo.jdoodle, langInfo.jdoodleIdx, code, stdin, jdoodleId, jdoodleSecret);
    } catch (err) {
      console.warn("[Compiler] JDoodle failed, trying next:", err);
    }
  }

  // 2. Try Judge0 CE if API key is configured
  const judge0Key = process.env.JUDGE0_API_KEY;
  if (judge0Key && langInfo.judge0Id) {
    try {
      return await executeViaJudge0(langInfo.judge0Id, code, stdin, judge0Key);
    } catch (err) {
      console.warn("[Compiler] Judge0 failed, trying Wandbox:", err);
    }
  }

  // 3. Try Wandbox (free, no key)
  if (langInfo.wandbox) {
    try {
      return await executeViaWandbox(langInfo.wandbox, code, stdin);
    } catch (err) {
      console.warn("[Compiler] Wandbox failed, using mock:", err);
    }
  }

  // 4. Fallback: mock execution
  return mockExecution(language, code, stdin);
}

/* ── JDoodle backend (free, 200/day, no credit card) ─────── */

async function executeViaJDoodle(
  language: string,
  versionIndex: string,
  code: string,
  stdin: string | undefined,
  clientId: string,
  clientSecret: string,
): Promise<ExecutionResult> {
  const startTime = Date.now();

  const res = await fetch("https://api.jdoodle.com/v1/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      clientSecret,
      script: code,
      language,
      versionIndex,
      stdin: stdin || "",
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`JDoodle ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);

  if (data.error) {
    throw new Error(data.error);
  }

  const output = data.output?.trim() || "";
  const hasError = data.statusCode !== 200 && data.statusCode !== undefined;

  // JDoodle puts compile errors in the output field
  const isCompileError = output.includes("error:") && output.includes(":");

  return {
    stdout: isCompileError ? null : (output || null),
    stderr: null,
    compile_output: isCompileError ? output : null,
    status: {
      id: isCompileError ? 6 : hasError ? 11 : 3,
      description: isCompileError
        ? "Compilation Error"
        : hasError
          ? "Runtime Error"
          : "Accepted",
    },
    time: data.cpuTime?.toString() || elapsed,
    memory: data.memory ? parseInt(data.memory) : null,
  };
}

/* ── Wandbox backend (free, no key) ──────────────────────── */

async function executeViaWandbox(
  compiler: string,
  code: string,
  stdin?: string,
): Promise<ExecutionResult> {
  const startTime = Date.now();

  const res = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      compiler,
      stdin: stdin || "",
      "compiler-option-raw": "",
      "runtime-option-raw": "",
      save: false,
    }),
    signal: AbortSignal.timeout(15000), // 15s timeout
  });

  if (!res.ok) {
    throw new Error(`Wandbox ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);

  const hasCompileError = !!data.compiler_error;
  const hasRuntimeError = data.status !== "0" && data.status !== 0;
  const stdout = data.program_output?.trim() || null;
  const stderr = data.program_error?.trim() || null;
  const compileErr = data.compiler_error?.trim() || null;

  return {
    stdout,
    stderr,
    compile_output: hasCompileError ? compileErr : null,
    status: {
      id: hasCompileError ? 6 : hasRuntimeError ? 11 : 3,
      description: hasCompileError
        ? "Compilation Error"
        : hasRuntimeError
          ? "Runtime Error (exit " + data.status + ")"
          : "Accepted",
    },
    time: elapsed,
    memory: null,
  };
}

/* ── Judge0 CE backend (RapidAPI, 50 req/day free) ───────── */

async function executeViaJudge0(
  languageId: number,
  code: string,
  stdin: string | undefined,
  apiKey: string,
): Promise<ExecutionResult> {
  const host = process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com";

  // Submit
  const submitRes = await fetch(
    `https://${host}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": host,
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: Buffer.from(code).toString("base64"),
        stdin: stdin ? Buffer.from(stdin).toString("base64") : undefined,
      }),
      signal: AbortSignal.timeout(20000),
    },
  );

  if (!submitRes.ok) {
    throw new Error(`Judge0 ${submitRes.status}`);
  }

  const data = await submitRes.json();
  const decode = (s: string | null) =>
    s ? Buffer.from(s, "base64").toString("utf-8").trim() : null;

  return {
    stdout: decode(data.stdout),
    stderr: decode(data.stderr),
    compile_output: decode(data.compile_output),
    status: data.status ?? { id: 3, description: "Accepted" },
    time: data.time ?? null,
    memory: data.memory ?? null,
  };
}

/* ── Mock execution (offline) ────────────────────────────── */

function mockExecution(
  language: LanguageKey,
  code: string,
  stdin?: string,
): ExecutionResult {
  let stdout = "";

  if (language === "python") {
    const prints = code.match(/print\((.+?)\)/g);
    if (prints) {
      stdout = prints
        .map((p) => {
          const inner = p.slice(6, -1).trim();
          if (/^(["'`]).*\1$/.test(inner)) return inner.slice(1, -1);
          if (/^f["']/.test(inner)) return inner.slice(2, -1).replace(/\{[^}]+\}/g, "[value]");
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
          if (/^(["'`]).*\1$/.test(inner)) return inner.slice(1, -1);
          return inner;
        })
        .join("\n");
    }
  } else {
    stdout = `[Offline Mode] Code executed (${PISTON_LANGUAGES[language].label})\nConfigure JUDGE0_API_KEY for real execution.`;
  }

  if (stdin) stdout += `\n[stdin: ${stdin.length} chars received]`;

  return {
    stdout: stdout || "[Offline] Program finished with no output",
    stderr: null,
    compile_output: null,
    status: { id: 3, description: "Accepted (offline)" },
    time: "0.001",
    memory: null,
  };
}
