/**
 * Teach Agent — explains concepts using lesson context.
 * Uses Groq API (llama-3.3-70b-versatile) for fast inference.
 * Falls back to built-in responses when API key is not configured.
 */

import { buildSystemPrompt, type AgentMemory, type AgentContext } from "../memory";

export interface TeachAgentInput {
  message: string;
  memory: AgentMemory;
  context: AgentContext;
}

export interface AgentResponse {
  content: string;
  skill: string;
  tokensUsed?: number;
}

export async function runTeachAgent(input: TeachAgentInput): Promise<AgentResponse> {
  const systemPrompt = buildSystemPrompt(input.memory, input.context);
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    return callGroq(groqKey, systemPrompt, input.message);
  }

  // Fallback: intelligent static response
  return generateFallbackResponse(input.message, input.context);
}

async function callGroq(
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
    temperature: 0.7,
    max_tokens: 1500,
    stream: false,
  });

  const content = completion.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
  const tokensUsed = completion.usage?.total_tokens ?? 0;

  return { content, skill: "teach", tokensUsed };
}

function generateFallbackResponse(
  message: string,
  context: AgentContext,
): AgentResponse {
  const lower = message.toLowerCase();
  let content: string;

  if (lower.includes("variable") || lower.includes("variables")) {
    content = `## Variables 📦

A **variable** is a named container that stores data in your program's memory.

\`\`\`python
# Creating variables
name = "COGNARA"      # String
age = 2               # Integer
pi = 3.14159          # Float
is_active = True      # Boolean
\`\`\`

### Key Concepts:
- **Assignment**: Use \`=\` to assign a value
- **Naming**: Use descriptive names (\`student_count\` not \`x\`)
- **Types**: Python infers the type automatically

### Quick Check ✅
What would \`type(42)\` return in Python?`;
  } else if (lower.includes("loop") || lower.includes("for") || lower.includes("while")) {
    content = `## Loops 🔄

Loops let you repeat a block of code multiple times.

### For Loop
\`\`\`python
# Iterate over a sequence
for i in range(5):
    print(f"Iteration {i}")

# Iterate over a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
\`\`\`

### While Loop
\`\`\`python
count = 0
while count < 5:
    print(count)
    count += 1
\`\`\`

### Quick Check ✅
How many times does \`for i in range(3)\` execute?`;
  } else if (lower.includes("function") || lower.includes("def")) {
    content = `## Functions 🔧

Functions are reusable blocks of code that perform a specific task.

\`\`\`python
def greet(name, greeting="Hello"):
    """Return a greeting message."""
    return f"{greeting}, {name}!"

# Call the function
message = greet("Student")
print(message)  # Hello, Student!
\`\`\`

### Key Concepts:
- **Parameters**: Inputs the function accepts
- **Return value**: What the function gives back
- **Default values**: Fallback when no argument is provided
- **Docstrings**: Document what the function does

### Quick Check ✅
What happens if you call \`greet("Ali", "Welcome")\`?`;
  } else if (lower.includes("recursion") || lower.includes("recursive")) {
    content = `## Recursion 🪆

Recursion is when a function calls itself to solve smaller sub-problems.

\`\`\`python
def factorial(n):
    # Base case — stops the recursion
    if n <= 1:
        return 1
    # Recursive case — function calls itself
    return n * factorial(n - 1)

print(factorial(5))  # 120
\`\`\`

### The Two Rules:
1. **Base case**: A condition that stops the recursion
2. **Recursive case**: The function calls itself with a *smaller* input

### Common Mistake ⚠️
Forgetting the base case → infinite recursion → \`RecursionError\`

### Quick Check ✅
What is the base case in the factorial function above?`;
  } else {
    const topicHint = context.current_lesson_title
      ? ` I see you're on "${context.current_lesson_title}".`
      : "";

    content = `## Let me help! 🤖${topicHint}

I'm COGNARA's AI tutor. Here's what I can do:

- **Explain concepts** — Ask me about any programming topic
- **Debug code** — Paste code that's giving you trouble
- **Practice problems** — Ask me to generate exercises
- **Quiz prep** — I can test your understanding

### Try asking me:
- "Explain how loops work in Python"
- "What's the difference between a list and a tuple?"
- "Help me understand recursion"
- "Generate 3 practice problems on functions"

*💡 Tip: The more specific your question, the better my answer!*`;
  }

  return { content, skill: "teach" };
}
