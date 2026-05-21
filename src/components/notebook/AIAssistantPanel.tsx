"use client";

import React, { useState, useEffect, useRef } from "react";
import { Block } from "./ModularCanvas";
import { createClient } from "@/lib/supabase/client";

interface AIAssistantPanelProps {
  studentId: string;
  notebookBlocks: Block[];
  onInsertBlock: (type: Block["type"], content: string, properties?: any) => void;
  onInsertBlocks?: (newBlocks: { type: Block["type"]; content: string; properties?: any }[]) => void;
  videoPlayer?: {
    getCurrentTime: () => number;
    seekTo: (time: number) => void;
  };
  lessonTitle: string;
  courseTitle: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Parses markdown response text into distinct modular block specifications
export function parseMarkdownToBlocks(markdown: string, playhead: number = 0): { type: Block["type"]; content: string; properties?: any }[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: { type: Block["type"]; content: string; properties?: any }[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.substring(3).trim() || "javascript";
      const codeContent = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeContent.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      blocks.push({
        type: "code",
        content: codeContent.join("\n"),
        properties: { language: lang }
      });
      continue;
    }

    // 2. Table block
    if (trimmed.startsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const rowLine = lines[i].trim();
        // Skip separator rows like |---|---| or | :--- | :---: |
        if (/^\|[\s:-|]+\|$/.test(rowLine)) {
          i++;
          continue;
        }
        // Split cells by | and filter out empty cells at edges
        const cells = rowLine.split("|")
          .map(c => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableRows.push(cells);
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({
          type: "table",
          content: "",
          properties: { rows: tableRows }
        });
      }
      continue;
    }

    // 3. Headings
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = Math.min(3, match[1].length); // H1, H2, H3
        const content = match[2];
        blocks.push({
          type: "heading",
          content,
          properties: { level }
        });
        i++;
        continue;
      }
    }

    // 4. Blockquote / Callout
    if (trimmed.startsWith(">")) {
      const calloutLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        calloutLines.push(lines[i].trim().substring(1).trim());
        i++;
      }
      blocks.push({
        type: "callout",
        content: calloutLines.join("\n"),
        properties: { color: "blue" }
      });
      continue;
    }

    // 5. Checklist
    if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]") || trimmed.startsWith("* [ ]") || trimmed.startsWith("* [x]")) {
      const checked = trimmed.includes("[x]");
      const content = trimmed.substring(5).trim();
      blocks.push({
        type: "checkbox",
        content,
        properties: { checked }
      });
      i++;
      continue;
    }

    // 6. Bullet lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("+ ")) {
      const content = trimmed.substring(2).trim();
      blocks.push({
        type: "bullet_list",
        content,
        properties: {}
      });
      i++;
      continue;
    }

    // 7. Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const dotIndex = trimmed.indexOf(".");
      const content = trimmed.substring(dotIndex + 1).trim();
      blocks.push({
        type: "numbered_list",
        content,
        properties: {}
      });
      i++;
      continue;
    }

    // 8. Divider
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({
        type: "divider",
        content: "",
        properties: {}
      });
      i++;
      continue;
    }

    // 9. Standard Text paragraph
    // Combine consecutive text lines into one paragraph to avoid too many small text blocks
    const paragraphLines = [];
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      if (!nextTrimmed) break;
      // If it starts a block item, stop combining
      if (nextTrimmed.startsWith("```") || 
          nextTrimmed.startsWith("|") || 
          nextTrimmed.startsWith("#") || 
          nextTrimmed.startsWith(">") || 
          nextTrimmed.startsWith("- ") || 
          nextTrimmed.startsWith("* ") || 
          nextTrimmed.startsWith("+ ") || 
          /^\d+\.\s+/.test(nextTrimmed) || 
          nextTrimmed === "---" || 
          nextTrimmed === "***" || 
          nextTrimmed === "___") {
        break;
      }
      paragraphLines.push(nextTrimmed);
      i++;
    }
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "text",
        content: paragraphLines.join(" "),
        properties: {}
      });
    }
  }

  return blocks;
}

export function AIAssistantPanel({
  studentId,
  notebookBlocks,
  onInsertBlock,
  onInsertBlocks,
  videoPlayer,
  lessonTitle,
  courseTitle,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [bannerText, setBannerText] = useState<string>(
    "💡 Tip: Try typing '/explain' to explain selected text, or '/quiz me' for a quick quiz!"
  );

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Suggestions list
  const COMMANDS = [
    { cmd: "/explain", desc: "Explain concept & inject Callout block" },
    { cmd: "/summarize", desc: "Generate outline from current notes" },
    { cmd: "/takenotes", desc: "Auto-insert AI lesson outline blocks" },
    { cmd: "/transcript", desc: "Generate a written transcript summary" },
    { cmd: "/quiz me", desc: "Generate 5-question multiple choice quiz" },
    { cmd: "/define", desc: "Get definitions of technical terms" },
  ];

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Proactive tips generator
  useEffect(() => {
    const banners = [
      "🧠 Need a quick test? Type '/quiz me' to test your comprehension of this lesson!",
      "📝 Want standard summaries? Type '/summarize' to structure your takeaways.",
      "🎥 Click timestamp badges in your note blocks to seek video playback instantly!",
      "⚡ Running low on credits? Free student tokens reset to 20 daily.",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % banners.length;
      setBannerText(banners[idx]);
      setShowBanner(true);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  // Simulate progressive client-side token-by-token streaming animation
  const simulateStreaming = async (fullText: string, messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, content: "", isStreaming: true } : msg))
    );

    const words = fullText.split(" ");
    let currentText = "";
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];
      // Update state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: currentText } : msg
        )
      );
      // Small pause for word animation
      await new Promise((r) => setTimeout(r, Math.random() * 25 + 15));
    }

    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isStreaming: false } : msg))
    );
  };

  const handleSendCommand = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `chat-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    // Prepare response container
    const assistantMsgId = `chat-${Math.random().toString(36).substr(2, 9)}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "Thinking...",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      let finalPrompt = trimmed;
      let requestedSkill = "teach";

      // Match commands
      if (trimmed.startsWith("/explain")) {
        const concept = trimmed.replace("/explain", "").trim() || "current lesson concepts";
        finalPrompt = `Please explain this concept clearly and detailed: "${concept}". Write in markdown with headers, and structure key takeaways.`;
      } else if (trimmed.startsWith("/summarize")) {
        const blockText = notebookBlocks.map((b) => b.content).join("\n");
        finalPrompt = `Summarize and structure the following student study notes in a neat outline:\n\n${blockText || "No student notes written yet. Generate a generic summary of the lesson: " + lessonTitle}`;
      } else if (trimmed.startsWith("/takenotes")) {
        finalPrompt = `Based on the lesson "${lessonTitle}" in course "${courseTitle}", please generate 3 core concepts/notes with clear headings.`;
      } else if (trimmed.startsWith("/transcript")) {
        finalPrompt = `Generate a structured lecture transcript summary outline for "${lessonTitle}" from "${courseTitle}".`;
      } else if (trimmed.startsWith("/quiz me")) {
        requestedSkill = "quiz";
        finalPrompt = `Generate a 5-question multiple choice quiz on the topic of "${lessonTitle}". Format in markdown with options a, b, c, d.`;
      } else if (trimmed.startsWith("/define")) {
        const term = trimmed.replace("/define", "").trim() || "recursion";
        finalPrompt = `Define and explain the technical term: "${term}" with a code snippet or practical example.`;
      }

      // Fetch from API
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          skill: requestedSkill,
          message: finalPrompt,
          context: {
            current_page: window.location.pathname,
            current_lesson_title: lessonTitle,
            current_course_title: courseTitle,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reach AI Agent");

      const replyContent = data.content || "I couldn't generate a response.";

      // Stream the response word by word
      await simulateStreaming(replyContent, assistantMsgId);

      // Perform command inject side-effects in blocks editor by parsing markdown output
      const playhead = videoPlayer?.getCurrentTime() || 0;
      const parsedBlocks = parseMarkdownToBlocks(replyContent, playhead);
      
      if (parsedBlocks.length > 0) {
        if (onInsertBlocks) {
          onInsertBlocks(parsedBlocks);
        } else {
          parsedBlocks.forEach((b) => onInsertBlock(b.type, b.content, b.properties));
        }
      }

    } catch (err: any) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: `❌ Error: ${err.message || "Failed to call Groq AI Agent API."}`, isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl text-white">
      {/* Header */}
      <div className="p-4 border-b border-stone-850 bg-stone-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
            🤖
          </span>
          <div>
            <h3 className="text-xs font-bold text-neutral-100">AI Notes Assistant</h3>
            <p className="text-[9px] text-neutral-400">Inline prompts & seek points</p>
          </div>
        </div>
        <div className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-semibold border border-indigo-500/25">
          Consumes 1 cr
        </div>
      </div>

      {/* Suggestion Banner */}
      {showBanner && (
        <div className="bg-gradient-to-r from-indigo-650/40 to-purple-650/30 border-b border-indigo-500/15 px-3.5 py-2.5 flex items-start gap-2 justify-between">
          <p className="text-[10px] text-indigo-200 leading-normal font-medium">{bannerText}</p>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="text-[10px] text-indigo-400 hover:text-white shrink-0 font-bold transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <span className="text-3xl mb-3 animate-pulse">🎓</span>
            <p className="text-xs font-bold text-neutral-200">How can I assist your study?</p>
            <p className="text-[10px] text-neutral-400 max-w-[200px] mt-1.5 leading-relaxed">
              Ask me to explain concepts, generate quizzes, or take dynamic outlines alongside your video timeline.
            </p>
            
            {/* Quick buttons */}
            <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-xs">
              {COMMANDS.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  onClick={() => setInputVal(item.cmd + " ")}
                  className="p-2 border border-stone-800 rounded-xl bg-stone-950/65 text-[10px] font-semibold text-neutral-300 hover:border-indigo-500/50 hover:text-white transition text-left"
                >
                  <p className="font-bold text-indigo-400">{item.cmd}</p>
                  <p className="text-[8px] text-neutral-500 truncate">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 items-start ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <span className="h-6 w-6 rounded-lg bg-stone-850 border border-stone-750 flex items-center justify-center text-xs shrink-0 select-none">
                🤖
              </span>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-650 text-white rounded-tr-md font-medium"
                  : "bg-stone-900 border border-stone-850 rounded-tl-md text-neutral-200"
              }`}
            >
              <div className="whitespace-pre-wrap font-sans break-words">{msg.content}</div>
              {msg.isStreaming && (
                <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-1 animate-pulse" />
              )}
              {msg.role === "assistant" && !msg.isStreaming && msg.content !== "Thinking..." && (
                <button
                  type="button"
                  onClick={() => {
                    const playhead = videoPlayer?.getCurrentTime() || 0;
                    const parsed = parseMarkdownToBlocks(msg.content, playhead);
                    if (parsed.length > 0) {
                      if (onInsertBlocks) {
                        onInsertBlocks(parsed);
                      } else {
                        parsed.forEach((b) => onInsertBlock(b.type, b.content, b.properties));
                      }
                    }
                  }}
                  className="mt-2.5 flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition select-none bg-stone-950/60 hover:bg-stone-950 px-2.5 py-1.5 rounded-lg border border-stone-850"
                >
                  📥 Insert into Notebook
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-stone-850 bg-stone-950/50 select-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCommand(inputVal);
          }}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask AI or type '/' for commands..."
            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-white"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 px-4 font-bold text-xs disabled:opacity-40 transition shrink-0 shadow"
          >
            Send
          </button>
        </form>
        {inputVal.startsWith("/") && (
          <div className="mt-2 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
            {COMMANDS.filter(c => c.cmd.includes(inputVal.toLowerCase())).map((c) => (
              <button
                key={c.cmd}
                type="button"
                onClick={() => setInputVal(c.cmd + " ")}
                className="w-full text-left p-2 hover:bg-stone-800 border-b border-stone-850 last:border-b-0 text-[10px] flex items-center justify-between"
              >
                <span className="font-bold text-indigo-400">{c.cmd}</span>
                <span className="text-neutral-500">{c.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
