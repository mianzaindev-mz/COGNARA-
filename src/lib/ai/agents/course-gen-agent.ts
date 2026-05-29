/**
 * Course Generation Agent — dynamically generates complete structured
 * courses with chapters, lessons, quizzes, and summaries from any topic.
 *
 * Uses Groq API (same as teach-agent) for LLM-powered generation.
 * Returns a draft CourseGenResult that can be reviewed and published.
 */

import type { AgentResponse } from "./teach-agent";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CourseGenLesson {
  title: string;
  type: "text" | "video" | "code" | "quiz";
  content: string;
  duration_mins: number;
}

export interface CourseGenChapter {
  title: string;
  description: string;
  lessons: CourseGenLesson[];
}

export interface CourseGenResult {
  title: string;
  slug: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_hours: number;
  chapters: CourseGenChapter[];
}

export interface CourseGenInput {
  topic: string;
  difficulty?: string;
  numChapters?: number;
  language?: string;
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

export async function runCourseGenAgent(
  input: CourseGenInput,
): Promise<AgentResponse> {
  const difficulty = input.difficulty ?? "beginner";
  const numChapters = input.numChapters ?? 5;
  const language = input.language ?? "English";

  const systemPrompt = buildCourseGenPrompt(
    input.topic,
    difficulty,
    numChapters,
    language,
  );

  // Try Groq API first
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      return await callGroqForCourse(groqKey, systemPrompt, input.topic);
    } catch (err) {
      console.error("[course-gen] Groq API error:", err);
    }
  }

  // Fallback: generate a template course
  return generateFallbackCourse(input.topic, difficulty, numChapters);
}

// ─── LLM Call ───────────────────────────────────────────────────────────────

async function callGroqForCourse(
  apiKey: string,
  systemPrompt: string,
  topic: string,
): Promise<AgentResponse> {
  const GroqModule = await import("groq-sdk");
  const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate a complete structured course about: ${topic}. Output ONLY valid JSON matching the CourseGenResult schema. No markdown, no explanation, just the JSON object.`,
      },
    ],
    temperature: 0.6,
    max_tokens: 4000,
    stream: false,
  });

  const raw =
    completion.choices?.[0]?.message?.content ?? "";

  // Try to parse as JSON
  try {
    // Extract JSON from potential markdown code blocks
    const jsonStr = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const result: CourseGenResult = JSON.parse(jsonStr);
    return formatCourseResult(result);
  } catch {
    // If JSON parsing fails, return the raw content formatted nicely
    return {
      content: `## 📚 Course Draft Generated\n\nThe AI generated a course outline, but it needs manual formatting. Here's the raw output:\n\n${raw}\n\n---\n\n*Review and edit this in the course builder to finalize.*`,
      skill: "generate_course",
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }
}

// ─── Format Course Result ───────────────────────────────────────────────────

function formatCourseResult(result: CourseGenResult): AgentResponse {
  const totalLessons = result.chapters.reduce(
    (s, ch) => s + ch.lessons.length,
    0,
  );
  const totalMins = result.chapters.reduce(
    (s, ch) =>
      s + ch.lessons.reduce((ls, l) => ls + l.duration_mins, 0),
    0,
  );

  let md = `## 📚 Course Generated: ${result.title}\n\n`;
  md += `**Difficulty:** ${diffBadge(result.difficulty)} · **${totalLessons} lessons** · **~${Math.round(totalMins / 60)}h ${totalMins % 60}m**\n\n`;
  md += `> ${result.description}\n\n`;
  md += `---\n\n`;

  result.chapters.forEach((ch, ci) => {
    md += `### 📖 Chapter ${ci + 1}: ${ch.title}\n`;
    md += `*${ch.description}*\n\n`;

    ch.lessons.forEach((lesson, li) => {
      const typeIcon =
        lesson.type === "quiz"
          ? "❓"
          : lesson.type === "code"
            ? "💻"
            : lesson.type === "video"
              ? "🎬"
              : "📝";
      md += `${li + 1}. ${typeIcon} **${lesson.title}** — ${lesson.duration_mins} min\n`;
    });
    md += `\n`;
  });

  md += `---\n\n`;
  md += `### 🔧 Raw Course Data\n\n`;
  md += `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n`;
  md += `*This course is in draft mode. A coach can review and publish it from the course builder.*`;

  return {
    content: md,
    skill: "generate_course",
  };
}

function diffBadge(d: string): string {
  switch (d) {
    case "beginner":
      return "🌱 Beginner";
    case "intermediate":
      return "⚡ Intermediate";
    case "advanced":
      return "🔥 Advanced";
    default:
      return d;
  }
}

// ─── System Prompt ──────────────────────────────────────────────────────────

function buildCourseGenPrompt(
  topic: string,
  difficulty: string,
  numChapters: number,
  language: string,
): string {
  return `You are a world-class curriculum designer for the COGNARA learning platform. Your task is to generate a complete, structured course as a JSON object.

REQUIREMENTS:
- Topic: "${topic}"
- Difficulty: ${difficulty}
- Number of chapters: ${numChapters}
- Language: ${language}
- Each chapter must have 3-5 lessons
- Each lesson needs: title, type (text/video/code/quiz), content (full lesson text, min 200 words for text, 5 questions for quiz), duration_mins
- The last lesson in each chapter should be a quiz
- Include practical examples, code snippets, and real-world applications
- Content should be progressive — later chapters build on earlier ones
- Generate a URL-safe slug from the title (lowercase, hyphens, no special chars)

OUTPUT FORMAT — Return ONLY valid JSON matching this exact schema:
{
  "title": "string",
  "slug": "string (url-safe)",
  "description": "string (2-3 sentences)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimated_hours": number,
  "chapters": [
    {
      "title": "string",
      "description": "string (1 sentence)",
      "lessons": [
        {
          "title": "string",
          "type": "text" | "code" | "quiz",
          "content": "string (full lesson content, markdown formatted)",
          "duration_mins": number
        }
      ]
    }
  ]
}

IMPORTANT: Output ONLY the JSON object. No markdown wrapping, no explanation, no extra text. The response must start with { and end with }.`;
}

// ─── Fallback ───────────────────────────────────────────────────────────────

function generateFallbackCourse(
  topic: string,
  difficulty: string,
  numChapters: number,
): AgentResponse {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const chapters: CourseGenChapter[] = [];
  const chapterTemplates = [
    { prefix: "Introduction to", desc: "Foundational concepts and overview" },
    { prefix: "Core Concepts of", desc: "Deep dive into key principles" },
    { prefix: "Practical Applications of", desc: "Hands-on exercises and real-world usage" },
    { prefix: "Advanced Topics in", desc: "Complex patterns and edge cases" },
    { prefix: "Mastery & Review of", desc: "Assessment and project-based learning" },
  ];

  for (let i = 0; i < Math.min(numChapters, chapterTemplates.length); i++) {
    const tmpl = chapterTemplates[i];
    chapters.push({
      title: `${tmpl.prefix} ${topic}`,
      description: tmpl.desc,
      lessons: [
        {
          title: `What is ${topic}?`,
          type: "text",
          content: `This lesson covers the fundamentals of ${topic}. We'll explore what it is, why it matters, and how it fits into the broader landscape.\n\n## Key Takeaways\n\n- Understanding the core definition\n- Historical context and evolution\n- Why ${topic} is relevant today`,
          duration_mins: 15,
        },
        {
          title: `${topic} in Practice`,
          type: "code",
          content: `\`\`\`python\n# Practical example of ${topic}\n# Try running this code to see the concept in action\n\ndef demo():\n    print("Welcome to ${topic}!")\n    # Add your implementation here\n    pass\n\ndemo()\n\`\`\`\n\n## Exercise\n\nModify the code above to implement a basic version of the concept.`,
          duration_mins: 20,
        },
        {
          title: `Chapter ${i + 1} Quiz`,
          type: "quiz",
          content: `## Quiz: ${tmpl.prefix} ${topic}\n\n**Q1:** What is the primary purpose of ${topic}?\na) Option A\nb) Option B\nc) Option C ✅\nd) Option D\n\n**Q2:** Which of the following best describes ${topic}?\na) Option A ✅\nb) Option B\nc) Option C\nd) Option D`,
          duration_mins: 10,
        },
      ],
    });
  }

  const result: CourseGenResult = {
    title: `Complete Guide to ${topic}`,
    slug,
    description: `A comprehensive ${difficulty}-level course covering ${topic} from fundamentals to advanced applications. Built with practical exercises and quizzes.`,
    difficulty: difficulty as "beginner" | "intermediate" | "advanced",
    estimated_hours: Math.round(numChapters * 0.75),
    chapters,
  };

  return formatCourseResult(result);
}
