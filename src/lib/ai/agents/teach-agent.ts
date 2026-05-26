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
  const isUrdu = context.voice_language === "ur"
    || /[\u0600-\u06FF]/.test(message)  // Urdu/Arabic script characters
    || lower.includes("[language: respond in urdu");
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

  } else if (lower.includes("closure") || lower.includes("closures")) {
    content = `## Closures — Functions That Remember

A **closure** is a function that "remembers" the variables from the scope where it was created, even after that scope has finished executing. It's one of the most powerful patterns in programming.

### How Closures Work

\`\`\`javascript
function createCounter() {
    let count = 0;                    // This variable is "closed over"

    return function() {               // This inner function is the closure
        count++;                      // It can access 'count' even after createCounter returns
        return count;
    };
}

const counter = createCounter();
console.log(counter());  // 1
console.log(counter());  // 2
console.log(counter());  // 3

// Each call to createCounter() creates a NEW closure with its own 'count'
const counter2 = createCounter();
console.log(counter2()); // 1 — independent from counter
\`\`\`

> 🧸 **Analogy:** A closure is like a backpack. When the function leaves home (its parent scope), it takes a backpack with all the variables it needs. Even in a new environment, it can still reach into its backpack and use them.

---

### Practical Use Cases

| Pattern | Example | Why Closures Help |
|---|---|---|
| **Data privacy** | Counter with private state | No external access to \`count\` |
| **Function factories** | \`createMultiplier(3)\` | Generate specialized functions |
| **Event handlers** | Button click callbacks | Capture context at creation time |
| **Memoization** | Cache expensive computations | Store results in closed-over object |

\`\`\`javascript
// Function factory pattern
function createMultiplier(factor) {
    return function(number) {
        return number * factor;     // 'factor' is remembered
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
\`\`\`

---

### Common Gotcha: Closures in Loops

\`\`\`javascript
// ❌ BUG: All callbacks share the same 'i'
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);  // Prints: 3, 3, 3
}

// ✅ FIX: Use 'let' (creates new scope per iteration)
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);  // Prints: 0, 1, 2
}
\`\`\`

---

### Practice Challenge

Write a function \`createSecretHolder(secret)\` that returns an object with two methods: \`getSecret()\` and \`setSecret(newSecret)\`. The secret should be completely private — accessible only through these methods.`;

  } else if (lower.includes("data structure") || lower.includes("array") || lower.includes("linked list") || lower.includes("stack") || lower.includes("queue") || lower.includes("hash")) {
    content = `## Core Data Structures — Choosing the Right Tool

Every data structure is a trade-off between **speed of access**, **speed of insertion**, and **memory usage**. Picking the right one is what separates good code from great code.

### The Big Five at a Glance

| Structure | Access | Search | Insert | Delete | Best For |
|---|---|---|---|---|---|
| **Array** | O(1) | O(n) | O(n) | O(n) | Random access by index |
| **Linked List** | O(n) | O(n) | O(1) | O(1) | Frequent insert/delete |
| **Stack** | O(n) | O(n) | O(1) | O(1) | Undo, parsing, DFS |
| **Queue** | O(n) | O(n) | O(1) | O(1) | BFS, scheduling, buffers |
| **Hash Map** | N/A | O(1)* | O(1)* | O(1)* | Key-value lookups |

*\\* Average case — worst case is O(n) due to collisions*

### Stack — Last In, First Out (LIFO)

\`\`\`python
stack = []
stack.append("A")    # Push
stack.append("B")
stack.append("C")
print(stack.pop())   # "C" — last in, first out
print(stack.pop())   # "B"
\`\`\`

> 💡 **Real-world:** A stack of plates. You always take from the top.

### Queue — First In, First Out (FIFO)

\`\`\`python
from collections import deque
queue = deque()
queue.append("Alice")    # Enqueue
queue.append("Bob")
queue.append("Charlie")
print(queue.popleft())   # "Alice" — first in, first out
\`\`\`

> 💡 **Real-world:** A line at a coffee shop. First person in line gets served first.

### Hash Map — Instant Lookups

\`\`\`python
phonebook = {}
phonebook["Ali"] = "0300-1234567"
phonebook["Sara"] = "0321-7654321"

# O(1) lookup — no scanning needed
print(phonebook["Ali"])  # "0300-1234567"

# Check existence in O(1)
if "Ali" in phonebook:
    print("Found!")
\`\`\`

---

### Decision Tree: Which Structure Should I Use?

1. Need random access by position? → **Array**
2. Need fast key-value lookup? → **Hash Map**
3. Need LIFO (undo, backtracking)? → **Stack**
4. Need FIFO (scheduling, BFS)? → **Queue**
5. Need frequent inserts in the middle? → **Linked List**

---

### Practice Challenge

Implement a **MinStack** — a stack that supports \`push\`, \`pop\`, and \`getMin()\` all in O(1) time.

*Hint: use a second stack to track minimums.*`;

  } else if (lower.includes("flashcard") || lower.includes("flash card")) {
    content = `## 🃏 Flashcard Set: Programming Fundamentals

---

### 🃏 Card 1
**Front:** What is the difference between \`==\` and \`===\` in JavaScript?
**Back:** \`==\` performs type coercion before comparing (loose equality), while \`===\` compares both value AND type without coercion (strict equality).
**Memory Tip:** Three equals = three checks (value + type + no tricks)

---

### 🃏 Card 2
**Front:** What is Big-O notation used for?
**Back:** It describes the upper bound of an algorithm's time or space complexity as input size grows. It tells you how an algorithm *scales*, not how fast it runs.
**Memory Tip:** Big-O = "Big Overview" — it shows the big picture of performance.

---

### 🃏 Card 3
**Front:** What's the difference between a stack and a queue?
**Back:** Stack = LIFO (Last In, First Out). Queue = FIFO (First In, First Out). Stack is like a pile of plates; queue is like a line at a store.
**Memory Tip:** Stack = Stack of plates (top first). Queue = Queue at the bank (first come first served).

---

### 🃏 Card 4
**Front:** What does "DRY" stand for in software engineering?
**Back:** **D**on't **R**epeat **Y**ourself. It means every piece of knowledge should have a single, unambiguous representation in your code.
**Memory Tip:** If you're copy-pasting code, you're getting "wet" — time to DRY it up with a function.

---

### 🃏 Card 5
**Front:** What is a callback function?
**Back:** A function passed as an argument to another function, which is then invoked (called back) at a later time, often after an async operation completes.
**Memory Tip:** "Call me back when you're done" — like giving someone your phone number.

---

### 🃏 Card 6
**Front:** What is the purpose of \`try/catch\` blocks?
**Back:** They handle runtime errors gracefully. Code in \`try\` runs normally; if it throws an error, execution jumps to \`catch\` instead of crashing the program.
**Memory Tip:** Try the trapeze act → if you fall, the catch net saves you.

---

## ⚡ Quick Self-Test

1. \`==\` performs _______ before comparing, while \`===\` does not.
2. Big-O describes the _______ bound of an algorithm's complexity.
3. A stack follows the _______ principle (abbreviation).`;

  } else if (lower.includes("challenge") || lower.includes("coding challenge") || lower.includes("code challenge")) {
    content = `## ⚡ Code Challenge
**Difficulty:** Medium · **Time Limit:** 10 minutes
**Language:** Python

### The Problem

Given a string \`s\`, find the length of the **longest substring without repeating characters**.

**Constraints:**
- \`0 <= len(s) <= 50000\`
- \`s\` consists of English letters, digits, symbols, and spaces

### Input/Output Examples

\`\`\`
Input: "abcabcbb"
Output: 3  # "abc"

Input: "bbbbb"
Output: 1  # "b"

Input: "pwwkew"
Output: 3  # "wke"
\`\`\`

### Starter Code

\`\`\`python
def length_of_longest_substring(s: str) -> int:
    # Your code here
    pass
\`\`\`

### Hints (reveal progressively)

1. 💡 Think about using a **sliding window** — two pointers that define the current substring.
2. 💡 Use a **set** or **dictionary** to track which characters are currently in the window.
3. 💡 When you find a duplicate, shrink the window from the left until the duplicate is removed.

### Solution & Walkthrough

\`\`\`python
def length_of_longest_substring(s: str) -> int:
    char_set = set()
    left = 0
    max_length = 0

    for right in range(len(s)):
        # Shrink window from left while duplicate exists
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1

        # Add current char and update max
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)

    return max_length
\`\`\`

**Why this works:** The sliding window technique processes each character at most twice (once when added, once when removed), giving us **O(n)** time complexity with **O(min(n, alphabet_size))** space.`;

  } else if (lower.includes("eli5") || lower.includes("explain like") || lower.includes("simple terms")) {
    content = `## 🧸 ELI5 Mode Active

Tell me what concept you'd like explained in the simplest possible way! Here's an example:

---

### How the Internet Works — ELI5 Edition

Imagine you want to send a drawing to your friend who lives far away. You can't walk there, so you give the drawing to a postal worker.

The postal worker doesn't carry it directly — they pass it to the sorting office, which reads the address and passes it to the right truck, which passes it to another sorting office closer to your friend, which finally delivers it.

**The internet works the same way.** When you visit a website, your computer sends a message (like the drawing) through wires and routers (like sorting offices) until it reaches the computer that has the website. That computer sends the website back through the same chain of routers, and your browser shows it on screen.

> 🧸 **Analogy:** The internet is a super-fast postal service for computers. Routers are the sorting offices that know which direction to send your message.

🎯 **The One-Liner:** The internet is just computers sending messages to each other through a chain of helpful middlemen.

---

*Now it's your turn — ask me to explain anything: APIs, databases, recursion, machine learning, blockchain, or any concept you've been struggling with!*`;

  } else if (isUrdu) {
    // ── Urdu fallback: respond in Urdu when no topic match ──
    const topicHint = context.current_lesson_title
      ? `\n\nMain dekh raha hoon aap **"${context.current_lesson_title}"** pe kaam kar rahe hain${context.current_course_title ? ` **${context.current_course_title}** course mein` : ""}. Is topic ke baare mein kuch bhi poochein!`
      : "";

    content = `## COGNARA AI Mein Khush Aamdeed 🎓

Main aap ka personal AI tutor hoon — aap ko seekhne mein madad karne ke liye, na ke sirf jawaab dene ke liye.${topicHint}

### Main Kya Kar Sakta Hoon

| Skill | Kaise Use Karein | Example |
|---|---|---|
| **Samjhaao** | Koi bhi concept explain karo | *"Variables kya hote hain?"* |
| **Debug** | Code ki galti theek karo | *"Yeh error kyun aa raha hai?"* |
| **Quiz** | Apna knowledge test karo | *"Data structures pe quiz do"* |
| **🃏 Flashcards** | Yaad rakhne ke cards | *"Python basics ke flashcards"* |
| **⚡ Challenge** | Coding challenge do | *"Arrays pe challenge do"* |
| **🧸 Aasaan Zabaan** | Bilkul aasaan alfaaz mein | *"Recursion ko aasaan mein samjhaao"* |
| **Voice** | Baat kar ke seekho | *Mic button dabayein* |

---

### Behtareen Jawaab Ke Liye

> **Specific poochein.** Sirf *"Python samjhaao"* ke bajaye, *"List comprehension mein filter kaise kaam karta hai?"* poochein. Jitna specific sawal, utna acha jawaab.

### Mujh Se Yeh Poochein

- *"Variable aur constant mein kya farq hai?"*
- *"Loop kya hota hai aur kyun use karte hain?"*
- *"Function kaise banta hai Python mein?"*
- *"OOP ka matlab kya hai?"*
- *"API kya hoti hai aasaan alfaaz mein?"*

---

*Main tayaar hoon. Aaj kya seekhna chahte hain?*`;

  } else {
    const topicHint = context.current_lesson_title
      ? `\n\nI can see you're working on **"${context.current_lesson_title}"**${context.current_course_title ? ` in the **${context.current_course_title}** course` : ""}. Ask me anything specific about that topic!`
      : "";

    content = `## Welcome to COGNARA AI

I'm your personal AI tutor — here to help you learn effectively, not just give you answers.${topicHint}

### What I Can Do For You

| Skill | How to Use | Example |
|---|---|---|
| **Teach Me** | Explain any concept | *"Explain closures in JavaScript"* |
| **Debug** | Fix your code | *"Why does this give a TypeError?"* |
| **Quiz** | Test your knowledge | *"Quiz me on data structures"* |
| **🃏 Flashcards** | Spaced repetition cards | *"Make flashcards for Python basics"* |
| **⚡ Challenge** | Timed coding puzzles | *"Give me a challenge on arrays"* |
| **🧸 ELI5** | Simple explanations | *"Explain recursion like I'm 5"* |
| **Voice** | Spoken conversation | *Use the microphone button* |
| **Path** | Learning roadmap | *"What should I learn after Python?"* |

---

### Tips for Better Responses

> **Be specific.** Instead of *"explain Python"*, try *"explain how list comprehensions work with a filter condition"*. The more specific your question, the more targeted and useful my response will be.

### Try Asking Me

- *"What are closures and why do they matter?"*
- *"Make flashcards for Big-O notation"*
- *"Give me a coding challenge on string manipulation"*
- *"Explain APIs like I'm 5"*
- *"What are the SOLID principles in object-oriented design?"*

---

*I'm ready when you are. What would you like to learn today?*`;
  }

  return { content, skill: "teach" };
}
