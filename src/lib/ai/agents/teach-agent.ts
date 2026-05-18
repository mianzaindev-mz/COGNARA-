/**
 * Teach Agent — explains concepts using lesson context.
 * Uses Groq API (llama-3.3-70b-versatile) for fast inference.
 * Falls back to impressive built-in responses when API key is not configured.
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
    max_tokens: 2500,
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
    content = `## Variables — The Building Blocks of Every Program

A **variable** is a named container that holds data in your program's memory. Think of it like a labeled box — the label is the variable name, and the contents are the value.

### Declaration & Assignment

\`\`\`python
# String — text data enclosed in quotes
student_name = "COGNARA"      # Stores text

# Integer — whole numbers without decimals
enrollment_count = 42          # Stores a count

# Float — numbers with decimal precision
course_rating = 4.87           # Stores a rating

# Boolean — binary True/False logic
is_enrolled = True             # Stores a state
\`\`\`

> **Key Insight:** Python is *dynamically typed* — you don't declare a type. The interpreter infers it from the assigned value. This means \`x = 5\` makes \`x\` an integer, but \`x = "5"\` makes it a string.

---

### Naming Conventions

| Convention | Example | When to Use |
|---|---|---|
| \`snake_case\` | \`student_name\` | Variables, functions |
| \`UPPER_CASE\` | \`MAX_RETRIES\` | Constants |
| \`PascalCase\` | \`StudentProfile\` | Classes |

### Common Mistakes to Avoid

1. **Starting with a number:** \`1student = "Ali"\` — *invalid*
2. **Using reserved words:** \`class = "CS101"\` — *will cause a SyntaxError*
3. **Spaces in names:** \`student name = "test"\` — *use underscores instead*

---

### Practice Challenge

\`\`\`python
# What will this print? Try to predict before running it.
x = 10
y = x
x = 20
print(y)  # What value does y hold?
\`\`\`

*Think about it: Does \`y\` update when \`x\` changes? Why or why not? This reveals something fundamental about how Python handles variable assignment.*`;

  } else if (lower.includes("loop") || lower.includes("for") || lower.includes("while")) {
    content = `## Loops — Automating Repetitive Tasks

**Loops** allow you to execute a block of code multiple times without writing it out repeatedly. They are one of the most powerful constructs in programming.

### The \`for\` Loop — When You Know How Many Times

\`\`\`python
# Iterate over a range of numbers
for i in range(5):           # i takes values: 0, 1, 2, 3, 4
    print(f"Step {i}")       # Executes 5 times

# Iterate over a collection
courses = ["Python", "JavaScript", "Data Science"]
for course in courses:       # course takes each value in order
    print(f"Enrolled in: {course}")
\`\`\`

### The \`while\` Loop — When You Don't Know How Many Times

\`\`\`python
# Keep asking until valid input
attempts = 0
while attempts < 3:          # Condition checked BEFORE each iteration
    answer = input("Guess: ")
    if answer == "42":
        print("Correct!")
        break                 # Exit the loop early
    attempts += 1             # Don't forget to update the counter!

# WARNING: Without "attempts += 1", this becomes an infinite loop
\`\`\`

> **Key Insight:** Use \`for\` when you know the iteration count. Use \`while\` when you need to loop until a condition changes. When in doubt, prefer \`for\` — it's safer against infinite loops.

---

### Loop Control Flow

| Statement | Effect | Example |
|---|---|---|
| \`break\` | Exit the loop entirely | Stop searching after finding a match |
| \`continue\` | Skip to the next iteration | Skip invalid entries |
| \`else\` | Runs if loop completes WITHOUT \`break\` | "Not found" message |

\`\`\`python
# Elegant search pattern using for...else
for student in students:
    if student.gpa >= 4.0:
        print(f"Found honor student: {student.name}")
        break
else:
    print("No honor students found")  # Only runs if break was never hit
\`\`\`

---

### Practice Challenge

Write a loop that prints the first 10 numbers of the **Fibonacci sequence**: \`0, 1, 1, 2, 3, 5, 8, 13, 21, 34\`

*Hint: You'll need two variables to track the previous two numbers. What initial values should they have?*`;

  } else if (lower.includes("function") || lower.includes("def")) {
    content = `## Functions — Reusable Logic Machines

A **function** is a named, reusable block of code that performs a specific task. Functions are the foundation of clean, maintainable software.

### Anatomy of a Function

\`\`\`python
def calculate_grade(score, total=100):
    """
    Calculate letter grade from a numeric score.
    
    Args:
        score: Points earned (int or float)
        total: Maximum points possible (default: 100)
    
    Returns:
        str: Letter grade (A, B, C, D, or F)
    """
    percentage = (score / total) * 100    # Normalize to percentage
    
    if percentage >= 90:
        return "A"                         # Early return — clean and clear
    elif percentage >= 80:
        return "B"
    elif percentage >= 70:
        return "C"
    elif percentage >= 60:
        return "D"
    else:
        return "F"

# Usage
grade = calculate_grade(87)           # Uses default total=100
print(f"Your grade: {grade}")         # Output: Your grade: B

weighted = calculate_grade(42, 50)    # Custom total
print(f"Weighted: {weighted}")        # Output: Weighted: B
\`\`\`

### Key Concepts Breakdown

| Concept | Description | Example |
|---|---|---|
| **Parameters** | Inputs the function accepts | \`score\`, \`total\` |
| **Default values** | Fallback when argument omitted | \`total=100\` |
| **Docstring** | Documentation inside the function | Triple-quoted string |
| **Return value** | What the function gives back | \`"A"\`, \`"B"\`, etc. |

> **Key Insight:** A well-designed function does ONE thing and does it well. If your function name has "and" in it (\`save_and_validate_and_send\`), it's doing too much — split it up.

---

### Pure vs. Impure Functions

\`\`\`python
# PURE — same input always produces same output, no side effects
def add(a, b):
    return a + b

# IMPURE — modifies external state (the list)
results = []
def add_to_results(value):
    results.append(value)    # Side effect: mutates external list
\`\`\`

*Prefer pure functions whenever possible — they're easier to test, debug, and reason about.*

---

### Practice Challenge

Write a function \`is_palindrome(text)\` that returns \`True\` if the text reads the same forwards and backwards (ignore case and spaces).

*Test cases: \`"racecar"\` → True, \`"A man a plan a canal Panama"\` → True, \`"hello"\` → False*`;

  } else if (lower.includes("recursion") || lower.includes("recursive")) {
    content = `## Recursion — The Art of Self-Reference

**Recursion** is when a function calls itself to solve a problem by breaking it into smaller, identical sub-problems. It's elegant but requires careful thinking.

### The Classic Example: Factorial

\`\`\`python
def factorial(n):
    """Calculate n! = n × (n-1) × (n-2) × ... × 1"""
    
    # BASE CASE — the exit condition that stops recursion
    if n <= 1:
        return 1
    
    # RECURSIVE CASE — the function calls itself with a smaller input
    return n * factorial(n - 1)

# Execution trace for factorial(4):
# factorial(4) = 4 × factorial(3)
#              = 4 × 3 × factorial(2)
#              = 4 × 3 × 2 × factorial(1)
#              = 4 × 3 × 2 × 1
#              = 24
\`\`\`

### The Two Sacred Rules of Recursion

| Rule | Purpose | What Happens Without It |
|---|---|---|
| **Base Case** | Stops the recursion | Infinite loop → \`RecursionError\` |
| **Progress Toward Base** | Each call must get closer to the base case | Infinite loop → Stack overflow |

> **Key Insight:** Every recursive solution can be written iteratively (with loops), and vice versa. Recursion shines when the problem has a naturally recursive structure — like trees, nested data, or divide-and-conquer algorithms.

---

### Visualizing the Call Stack

\`\`\`
factorial(4)
├── factorial(3)
│   ├── factorial(2)
│   │   ├── factorial(1)  ← Base case hit! Returns 1
│   │   └── Returns 2 × 1 = 2
│   └── Returns 3 × 2 = 6
└── Returns 4 × 6 = 24
\`\`\`

### When NOT to Use Recursion
- When the problem has no natural recursive structure
- When performance matters (recursion has overhead from stack frames)
- When the depth could exceed Python's limit (~1000 calls)

---

### Practice Challenge

Write a recursive function \`sum_digits(n)\` that returns the sum of all digits in a positive integer.

*Example: \`sum_digits(1234)\` → \`10\` (because 1+2+3+4 = 10)*

*Hint: \`n % 10\` gives the last digit. \`n // 10\` removes the last digit.*`;

  } else if (lower.includes("class") || lower.includes("object") || lower.includes("oop")) {
    content = `## Object-Oriented Programming — Modeling the Real World

**OOP** is a programming paradigm where you model your code around *objects* — entities that bundle together data (attributes) and behavior (methods).

### Defining a Class

\`\`\`python
class Student:
    """Represents a COGNARA student with enrollment and progress tracking."""
    
    # Class variable — shared by ALL instances
    platform = "COGNARA"
    
    def __init__(self, name, email):
        """Initialize a new student."""
        self.name = name              # Instance variable — unique to each student
        self.email = email
        self.courses = []             # Each student gets their own empty list
        self.xp = 0
    
    def enroll(self, course_name):
        """Enroll the student in a course."""
        if course_name not in self.courses:
            self.courses.append(course_name)
            self.xp += 10             # Award XP for enrolling
            return f"{self.name} enrolled in {course_name}"
        return f"Already enrolled in {course_name}"
    
    def __str__(self):
        """Human-readable representation."""
        return f"Student({self.name}, {len(self.courses)} courses, {self.xp} XP)"

# Usage
ali = Student("Ali Ahmed", "ali@cognara.dev")
ali.enroll("Python Fundamentals")
ali.enroll("Data Structures")
print(ali)  # Student(Ali Ahmed, 2 courses, 20 XP)
\`\`\`

> **Key Insight:** Classes are blueprints, objects are houses built from those blueprints. You define the class once, then create as many objects as you need.

---

### The Four Pillars of OOP

| Pillar | Meaning | Example |
|---|---|---|
| **Encapsulation** | Bundle data + methods together | \`Student\` class above |
| **Inheritance** | Create new classes from existing ones | \`CoachStudent(Student)\` |
| **Polymorphism** | Same method name, different behavior | \`.calculate()\` on different shapes |
| **Abstraction** | Hide complexity, expose simplicity | \`.enroll()\` hides all the internal logic |

---

### Practice Challenge

Create a \`Course\` class with attributes \`title\`, \`instructor\`, and \`students\` (list). Add methods \`add_student(name)\` and \`student_count()\`.

*Bonus: Make it so adding the same student twice does nothing.*`;

  } else {
    const topicHint = context.current_lesson_title
      ? `\n\nI can see you're working on **"${context.current_lesson_title}"**${context.current_course_title ? ` in the **${context.current_course_title}** course` : ""}. Ask me anything specific about that topic!`
      : "";

    content = `## Welcome to COGNARA AI

I'm your personal AI tutor — here to help you learn effectively, not just give you answers.${topicHint}

### What I Can Do For You

| Skill | How to Use | Example |
|---|---|---|
| **Explain concepts** | Ask about any topic | *"Explain how loops work in Python"* |
| **Debug your code** | Share code + error | *"Why does this give a TypeError?"* |
| **Generate exercises** | Request practice problems | *"Give me 3 problems on recursion"* |
| **Quiz preparation** | Test your knowledge | *"Quiz me on data structures"* |
| **Learning paths** | Get a study roadmap | *"What should I learn after functions?"* |

---

### Tips for Better Responses

> **Be specific.** Instead of *"explain Python"*, try *"explain how list comprehensions work with a filter condition"*. The more specific your question, the more targeted and useful my response will be.

### Try Asking Me

- *"What's the difference between a list and a tuple in Python?"*
- *"Explain the concept of Big-O notation with examples"*
- *"Help me understand why my recursive function hits a stack overflow"*
- *"Generate 5 practice problems on string manipulation"*
- *"What are the SOLID principles in object-oriented design?"*

---

*I'm ready when you are. What would you like to learn today?*`;
  }

  return { content, skill: "teach" };
}
