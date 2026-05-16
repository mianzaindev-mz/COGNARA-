/**
 * Piston API client — free sandboxed code execution.
 * No API key required. Supports 50+ languages.
 * https://github.com/engineer-man/piston
 *
 * Falls back to mock when network is unavailable.
 */

/* ── Language map: display key → Piston runtime info ─────── */
export const PISTON_LANGUAGES = {
  python: { runtime: "python", version: "3.10.0", label: "Python 3", ext: "py", monaco: "python" },
  javascript: { runtime: "javascript", version: "18.15.0", label: "JavaScript", ext: "js", monaco: "javascript" },
  typescript: { runtime: "typescript", version: "5.0.3", label: "TypeScript", ext: "ts", monaco: "typescript" },
  java: { runtime: "java", version: "15.0.2", label: "Java", ext: "java", monaco: "java" },
  c: { runtime: "c", version: "10.2.0", label: "C (GCC)", ext: "c", monaco: "c" },
  cpp: { runtime: "c++", version: "10.2.0", label: "C++ (GCC)", ext: "cpp", monaco: "cpp" },
  csharp: { runtime: "csharp", version: "6.12.0", label: "C#", ext: "cs", monaco: "csharp" },
  go: { runtime: "go", version: "1.16.2", label: "Go", ext: "go", monaco: "go" },
  rust: { runtime: "rust", version: "1.68.2", label: "Rust", ext: "rs", monaco: "rust" },
  ruby: { runtime: "ruby", version: "3.0.1", label: "Ruby", ext: "rb", monaco: "ruby" },
  php: { runtime: "php", version: "8.2.3", label: "PHP", ext: "php", monaco: "php" },
  swift: { runtime: "swift", version: "5.3.3", label: "Swift", ext: "swift", monaco: "swift" },
  kotlin: { runtime: "kotlin", version: "1.8.20", label: "Kotlin", ext: "kt", monaco: "kotlin" },
  r: { runtime: "r", version: "4.1.1", label: "R", ext: "r", monaco: "r" },
  sql: { runtime: "sqlite3", version: "3.36.0", label: "SQL", ext: "sql", monaco: "sql" },
  bash: { runtime: "bash", version: "5.2.0", label: "Bash", ext: "sh", monaco: "shell" },
  dart: { runtime: "dart", version: "2.19.6", label: "Dart", ext: "dart", monaco: "dart" },
  lua: { runtime: "lua", version: "5.4.4", label: "Lua", ext: "lua", monaco: "lua" },
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

/* ── Default code starters per language ──────────────────── */
export const DEFAULT_CODE: Record<LanguageKey, string> = {
  python: `# COGNARA Code Lab — Python 3\n\nname = input("What's your name? ")\nprint(f"Hello, {name}! Welcome to COGNARA 🚀")\n\n# Try more:\n# for i in range(5):\n#     print(f"Count: {i}")\n`,
  javascript: `// COGNARA Code Lab — JavaScript (Node.js)\n\nconst greet = (name) => \`Hello, \${name}! 🚀\`;\nconsole.log(greet("COGNARA"));\n\n// Arrays\nconst nums = [1, 2, 3, 4, 5];\nconsole.log("Sum:", nums.reduce((a, b) => a + b));\n`,
  typescript: `// COGNARA Code Lab — TypeScript\n\ninterface Student {\n  name: string;\n  level: number;\n}\n\nconst student: Student = { name: "COGNARA", level: 42 };\nconsole.log(\`\${student.name} is level \${student.level} 🚀\`);\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, COGNARA! 🚀");\n        \n        // Loop example\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Step " + i);\n        }\n    }\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, COGNARA! 🚀\\n");\n    \n    // Fibonacci\n    int a = 0, b = 1;\n    for (int i = 0; i < 10; i++) {\n        printf("%d ", a);\n        int temp = a + b;\n        a = b;\n        b = temp;\n    }\n    printf("\\n");\n    return 0;\n}\n`,
  cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    cout << "Hello, COGNARA! 🚀" << endl;\n    \n    vector<int> nums = {5, 3, 8, 1, 9};\n    sort(nums.begin(), nums.end());\n    \n    cout << "Sorted: ";\n    for (int n : nums) cout << n << " ";\n    cout << endl;\n    return 0;\n}\n`,
  csharp: `using System;\nusing System.Linq;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, COGNARA! 🚀");\n        \n        var nums = new[] { 5, 3, 8, 1, 9 };\n        Console.WriteLine($"Sum: {nums.Sum()}");\n        Console.WriteLine($"Max: {nums.Max()}");\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, COGNARA! 🚀")\n    \n    // Fibonacci\n    a, b := 0, 1\n    for i := 0; i < 10; i++ {\n        fmt.Printf("%d ", a)\n        a, b = b, a+b\n    }\n    fmt.Println()\n}\n`,
  rust: `fn main() {\n    println!("Hello, COGNARA! 🚀");\n    \n    // Vector operations\n    let nums = vec![5, 3, 8, 1, 9];\n    let sum: i32 = nums.iter().sum();\n    println!("Sum of {:?} = {}", nums, sum);\n}\n`,
  ruby: `# COGNARA Code Lab — Ruby\n\nputs "Hello, COGNARA! 🚀"\n\n# Array methods\nnums = [5, 3, 8, 1, 9]\nputs "Sorted: #{nums.sort}"\nputs "Sum: #{nums.sum}"\n`,
  php: `<?php\n\necho "Hello, COGNARA! 🚀\\n";\n\n// Array functions\n$nums = [5, 3, 8, 1, 9];\nsort($nums);\necho "Sorted: " . implode(", ", $nums) . "\\n";\necho "Sum: " . array_sum($nums) . "\\n";\n`,
  swift: `print("Hello, COGNARA! 🚀")\n\nlet nums = [5, 3, 8, 1, 9]\nlet sorted = nums.sorted()\nprint("Sorted: \\(sorted)")\nprint("Sum: \\(nums.reduce(0, +))")\n`,
  kotlin: `fun main() {\n    println("Hello, COGNARA! 🚀")\n    \n    val nums = listOf(5, 3, 8, 1, 9)\n    println("Sorted: \${nums.sorted()}")\n    println("Sum: \${nums.sum()}")\n}\n`,
  r: `cat("Hello, COGNARA! 🚀\\n")\n\nnums <- c(5, 3, 8, 1, 9)\ncat("Mean:", mean(nums), "\\n")\ncat("Sorted:", sort(nums), "\\n")\n`,
  sql: `-- COGNARA Code Lab — SQL (SQLite)\n\nCREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, score INTEGER);\n\nINSERT INTO students VALUES (1, 'Ali', 95);\nINSERT INTO students VALUES (2, 'Sara', 88);\nINSERT INTO students VALUES (3, 'Ahmed', 92);\n\nSELECT name, score FROM students ORDER BY score DESC;\n`,
  bash: `#!/bin/bash\necho "Hello, COGNARA! 🚀"\n\n# Loop and arithmetic\nfor i in {1..5}; do\n    echo "Step $i: $((i * i))"\ndone\n`,
  dart: `void main() {\n  print('Hello, COGNARA! 🚀');\n  \n  var nums = [5, 3, 8, 1, 9];\n  nums.sort();\n  print('Sorted: \$nums');\n  print('Sum: \${nums.reduce((a, b) => a + b)}');\n}\n`,
  lua: `print("Hello, COGNARA! 🚀")\n\n-- Table operations\nlocal nums = {5, 3, 8, 1, 9}\ntable.sort(nums)\n\nlocal result = ""\nfor _, v in ipairs(nums) do\n    result = result .. v .. " "\nend\nprint("Sorted: " .. result)\n`,
};

const PISTON_API = "https://emkc.org/api/v2/piston";

/** Execute code via Piston API (free, no key needed) */
export async function executeCode(
  language: LanguageKey,
  code: string,
  stdin?: string,
): Promise<ExecutionResult> {
  const langInfo = PISTON_LANGUAGES[language];
  if (!langInfo) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const startTime = Date.now();

    const res = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langInfo.runtime,
        version: langInfo.version,
        files: [{ name: `main.${langInfo.ext}`, content: code }],
        stdin: stdin || "",
        compile_timeout: 10000,
        run_timeout: 10000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Piston API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);

    // Piston returns { run: { stdout, stderr, code, signal, output }, compile?: { ... } }
    const run = data.run;
    const compile = data.compile;

    const hasCompileError = compile && compile.code !== 0;
    const hasRuntimeError = run && run.code !== 0;

    return {
      stdout: run?.stdout?.trim() || null,
      stderr: run?.stderr?.trim() || null,
      compile_output: hasCompileError ? (compile?.stderr || compile?.output || null) : null,
      status: {
        id: hasCompileError ? 6 : hasRuntimeError ? 11 : 3,
        description: hasCompileError
          ? "Compilation Error"
          : hasRuntimeError
            ? "Runtime Error"
            : "Accepted",
      },
      time: elapsed,
      memory: null, // Piston doesn't report memory
    };
  } catch (err) {
    // If Piston is unreachable, fall back to mock
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return mockExecution(language, code, stdin);
    }
    throw err;
  }
}

/* ── Mock execution (when offline) ──────────────────────── */
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
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith("'") && inner.endsWith("'"))
          ) {
            return inner.slice(1, -1);
          }
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
    stdout = `[Offline] Code executed (${PISTON_LANGUAGES[language].label})`;
  }

  if (stdin) {
    stdout += `\n[stdin: ${stdin.length} chars]`;
  }

  return {
    stdout: stdout || "[Offline] Program finished with no output",
    stderr: null,
    compile_output: null,
    status: { id: 3, description: "Accepted (offline mock)" },
    time: "0.001",
    memory: null,
  };
}
