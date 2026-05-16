"use client";

type Props = {
  role: "user" | "assistant";
  content: string;
  skill?: string;
  creditsUsed?: number;
  timestamp?: string;
};

export function AgentMessage({ role, content, skill, creditsUsed, timestamp }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          isUser
            ? "bg-cn-lavender/30 text-cn-ink"
            : "bg-gradient-to-br from-cn-orange to-cn-pink text-white"
        }`}
      >
        {isUser ? "Y" : "C"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-cn-orange/10 text-cn-ink"
              : "rounded-tl-md bg-cn-surface text-cn-ink shadow-sm ring-1 ring-cn-border"
          }`}
        >
          {isUser ? (
            <p>{content}</p>
          ) : (
            <div
              className="agent-markdown prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          )}
        </div>

        {/* Meta */}
        <div className={`mt-1 flex items-center gap-2 text-[11px] text-cn-ink-subtle ${isUser ? "justify-end" : ""}`}>
          {timestamp && <span>{timestamp}</span>}
          {skill && !isUser && (
            <span className="rounded-full bg-cn-orange/10 px-2 py-0.5 font-medium text-cn-orange">
              {skill}
            </span>
          )}
          {creditsUsed !== undefined && creditsUsed > 0 && !isUser && (
            <span className="text-cn-ink-subtle">−{creditsUsed} credit{creditsUsed > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Minimal markdown → HTML for agent responses */
function renderMarkdown(text: string): string {
  return (
    text
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rounded-xl bg-cn-sidebar p-3 text-sm overflow-x-auto"><code class="text-emerald-400">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="rounded bg-cn-border/50 px-1.5 py-0.5 text-xs font-mono text-cn-orange">$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h4 class="mt-3 mb-1 text-sm font-bold text-cn-ink">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="mt-4 mb-2 text-base font-bold text-cn-ink">$1</h3>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      // Line breaks
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n/g, "<br/>")
  );
}
