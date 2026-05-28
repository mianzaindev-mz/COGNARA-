import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateMockResponse(message: string, userRole: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
    return "Hey! I'm Cognara AI, your personal learning companion. I can help you with course content, explain concepts, generate study plans, create quizzes, and much more. What would you like to explore today?";
  }

  if (lowerMessage.includes("course") || lowerMessage.includes("lesson")) {
    return "I can help you navigate your courses! I can explain lesson content, create personalized study schedules, generate practice quizzes, or break down complex concepts. Which course are you working on right now?";
  }

  if (lowerMessage.includes("quiz") || lowerMessage.includes("test") || lowerMessage.includes("assessment")) {
    return "Quizzes are great for checking your understanding! I can generate practice questions for you, explain quiz concepts, or help you understand why you got certain answers wrong. What topic would you like to practice?";
  }

  if (lowerMessage.includes("study") || lowerMessage.includes("plan") || lowerMessage.includes("schedule")) {
    return "Let's create a study plan that works for you! I can help you organize your learning by breaking down courses into manageable daily tasks. How much time can you dedicate to studying each day?";
  }

  if (lowerMessage.includes("explain") || lowerMessage.includes("what is") || lowerMessage.includes("how does")) {
    return "I'd love to explain that! Could you tell me a bit more about what specific concept or topic you're trying to understand? The more context you give me, the better I can tailor my explanation.";
  }

  if (lowerMessage.includes("code") || lowerMessage.includes("programming") || lowerMessage.includes("debug")) {
    return "Coding questions are my specialty! I can help you understand code, debug issues, explain algorithms, or walk through problems step by step. Share the code or describe the problem you're facing.";
  }

  if (userRole === "coach") {
    return "Hi there! As a coach, I can help you create course content, generate lesson materials, analyze student progress, draft communications for your students, or streamline your course creation workflow. What would you like to work on?";
  }

  return "I'm here to help with your learning journey! Whether you need help understanding course material, want to create a study plan, or have questions about the platform, just let me know. What's on your mind?";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Cognara AI — the intelligent, deeply embedded learning assistant built into the Cognara platform. You are not a generic chatbot. You are a warm, knowledgeable, human-sounding companion who genuinely cares about every student's growth and every coach's success. You speak naturally, with personality, encouragement, and clarity — never robotic, never stiff, never over-formal. You adapt your tone to who you're talking to: playful and motivating with students, professional and efficient with coaches, and authoritative with admins. You are context-aware at all times — you know the current page, the current user's role, their enrolled courses, their progress, and their recent activity, and you use all of this to make every response feel personally tailored rather than generic.

HUMAN-LIKE CONVERSATION STYLE: You never open with "Certainly!" or "Of course!" or "Great question!". You speak like a brilliant friend who happens to know everything about learning, education, and technology. You use contractions naturally. You vary your sentence length for rhythm. You occasionally ask follow-up questions to understand what the student really needs. You notice when someone seems frustrated or confused and you acknowledge it before jumping to solutions. You use light humour when appropriate. You never lecture — you have conversations. You never repeat the user's question back to them. You get straight to the point while still being warm.

Current page: ${context?.current_page || "unknown"}
User role: ${context?.user_role || "student"}

Help users with their courses, lessons, and platform usage. Be concise, helpful, and friendly.`;

    // Demo mode: return mock responses if no API key is configured
    if (!process.env.GROQ_API_KEY) {
      const lastMessage = messages[messages.length - 1]?.content || "";
      const mockResponse = generateMockResponse(lastMessage, context?.user_role || "student");
      return NextResponse.json({ content: mockResponse });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Chat API] Groq error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[AI Chat API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
