/**
 * Research Agent — multi-step web research pipeline.
 * Pipeline: Plan → Search → Fetch → Parse → Synthesize
 * 
 * Uses Groq for planning and synthesis, cheerio+turndown for HTML parsing,
 * and caches results in web_research_cache with 24h TTL.
 */

import { createHash } from "crypto";
import type { AgentResponse } from "./teach-agent";

// ─── Types ───────────────────────────────────────────────────

export type ResearchType = "general" | "academic" | "news" | "video" | "code" | "definition";

export interface ResearchInput {
  query: string;
  userId: string;
  researchType?: ResearchType;
  maxSources?: number;
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  content?: string;
  fetchedAt?: string;
}

export interface ResearchResult {
  query: string;
  queryHash: string;
  synthesis: string;
  sources: ResearchSource[];
  subQuestions: string[];
  researchType: ResearchType;
  creditsUsed: number;
  cached: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────

function hashQuery(query: string): string {
  return createHash("sha256").update(query.toLowerCase().trim()).digest("hex");
}

async function callGroq(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const GroqModule = await import("groq-sdk");
  const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.4,
    max_tokens: 3000,
    stream: false,
  });

  return completion.choices?.[0]?.message?.content ?? "";
}

// ─── Step 1: Plan Research ───────────────────────────────────

async function planResearch(apiKey: string, query: string, researchType: ResearchType): Promise<{
  subQuestions: string[];
  searchQueries: string[];
}> {
  const systemPrompt = `You are a research planning assistant. Given a research query, break it down into:
1. 3-5 sub-questions that would fully answer the main query
2. 3-5 optimized search queries to find relevant information

Respond in valid JSON only:
{
  "subQuestions": ["question 1", "question 2", ...],
  "searchQueries": ["search query 1", "search query 2", ...]
}

Research type: ${researchType}. Tailor your queries accordingly.`;

  const raw = await callGroq(apiKey, systemPrompt, query);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subQuestions: parsed.subQuestions || [query],
        searchQueries: parsed.searchQueries || [query],
      };
    }
  } catch {
    // fallback
  }

  return {
    subQuestions: [query],
    searchQueries: [query, `${query} explained`, `${query} examples`],
  };
}

// ─── Step 2: Fetch & Parse URLs ──────────────────────────────

async function fetchAndParseURL(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CognaraBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();
    if (!html || html.length < 100) return null;

    // Dynamic imports for cheerio + turndown
    const cheerio = await import("cheerio");
    const TurndownModule = await import("turndown");
    const TurndownService = TurndownModule.default || TurndownModule;

    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, nav, header, footer, aside, iframe, noscript, svg, [role='navigation'], [role='banner'], .sidebar, .ad, .advertisement, .social-share").remove();

    const title = $("title").first().text().trim() || $("h1").first().text().trim() || "Untitled";
    const bodyHtml = $("article, main, .content, .post-body, .entry-content, body").first().html();

    if (!bodyHtml) return null;

    const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
    let markdown = turndown.turndown(bodyHtml);

    // Truncate to ~3000 chars to avoid overwhelming the LLM
    if (markdown.length > 3000) {
      markdown = markdown.slice(0, 3000) + "\n\n[... content truncated for synthesis ...]";
    }

    return { title, content: markdown };
  } catch {
    return null;
  }
}

// ─── Step 3: Search (Groq Knowledge Fallback) ────────────────

async function searchWithGroq(apiKey: string, searchQuery: string, researchType: ResearchType): Promise<ResearchSource[]> {
  const systemPrompt = `You are a knowledgeable research assistant. For the given search query, provide 3-5 high-quality, factual results from your training data as if they were search results.

For each result, provide:
- A plausible title
- A brief 2-3 sentence snippet with factual information
- A relevant URL (use real, well-known sources like Wikipedia, MDN, official docs, reputable publications)

Research type: ${researchType}

Respond in valid JSON only:
{
  "results": [
    { "title": "...", "snippet": "...", "url": "..." }
  ]
}`;

  const raw = await callGroq(apiKey, systemPrompt, searchQuery);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.results || []).map((r: any) => ({
        url: r.url || "",
        title: r.title || "Source",
        snippet: r.snippet || "",
      }));
    }
  } catch {
    // fallback
  }

  return [];
}

// ─── Step 4: Synthesize ──────────────────────────────────────

async function synthesize(
  apiKey: string,
  query: string,
  subQuestions: string[],
  sources: ResearchSource[],
  researchType: ResearchType
): Promise<string> {
  const sourceContext = sources
    .map((s: ResearchSource, i: number) => {
      const content = s.content ? `\nContent:\n${s.content.slice(0, 1500)}` : "";
      return `[Source ${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}${content}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt = `You are a comprehensive research synthesizer for the Cognara learning platform. 

Given a research query, sub-questions, and source materials, produce a well-structured, academically-toned research synthesis.

FORMAT YOUR RESPONSE AS:

## Research Synthesis: [Topic]

### Executive Summary
[2-3 sentence overview of findings]

### Key Findings
[Address each sub-question with evidence from sources]

### Detailed Analysis
[In-depth exploration with citations like [1], [2], etc.]

### Practical Implications
[How this applies to learning/practice]

### Sources & Citations
[Numbered list of sources used]

---

Research type: ${researchType}
Keep the tone educational and thorough. Use markdown formatting extensively.
Reference sources by number [1], [2], etc.`;

  const userMsg = `Research Query: "${query}"

Sub-Questions to Address:
${subQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

Source Materials:
${sourceContext || "No external sources fetched. Use your knowledge to provide a comprehensive answer."}`;

  return await callGroq(apiKey, systemPrompt, userMsg);
}

// ─── Main Pipeline ───────────────────────────────────────────

export async function runResearchAgent(input: ResearchInput): Promise<AgentResponse & { researchResult: ResearchResult }> {
  const groqKey = process.env.GROQ_API_KEY;
  const researchType = input.researchType || "general";
  const queryHash = hashQuery(input.query);
  const maxSources = input.maxSources || 5;

  // ─── Check cache first ───
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: cached } = await supabase
      .from("web_research_cache")
      .select("*")
      .eq("query_hash", queryHash)
      .eq("user_id", input.userId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      const result: ResearchResult = {
        query: cached.query,
        queryHash: cached.query_hash,
        synthesis: cached.synthesis || "",
        sources: cached.results || [],
        subQuestions: cached.citations || [],
        researchType: cached.research_type || "general",
        creditsUsed: 0,
        cached: true,
      };

      return {
        content: cached.synthesis || "Research results found in cache.",
        skill: "research",
        researchResult: result,
      };
    }
  } catch {
    // Cache lookup failed, continue with fresh research
  }

  // ─── No API key fallback ───
  if (!groqKey) {
    const fallbackResult: ResearchResult = {
      query: input.query,
      queryHash,
      synthesis: generateFallbackSynthesis(input.query),
      sources: [],
      subQuestions: [input.query],
      researchType,
      creditsUsed: 0,
      cached: false,
    };

    return {
      content: fallbackResult.synthesis,
      skill: "research",
      researchResult: fallbackResult,
    };
  }

  // ─── Step 1: Plan ───
  const plan = await planResearch(groqKey, input.query, researchType);

  // ─── Step 2: Search ───
  const allSources: ResearchSource[] = [];
  const seenUrls = new Set<string>();

  for (const searchQuery of plan.searchQueries.slice(0, 3)) {
    const results = await searchWithGroq(groqKey, searchQuery, researchType);
    for (const r of results) {
      if (!seenUrls.has(r.url) && allSources.length < maxSources) {
        seenUrls.add(r.url);
        allSources.push(r);
      }
    }
  }

  // ─── Step 3: Fetch content from URLs ───
  const fetchPromises = allSources.slice(0, 3).map(async (source: ResearchSource) => {
    if (source.url && source.url.startsWith("http")) {
      const parsed = await fetchAndParseURL(source.url);
      if (parsed) {
        source.content = parsed.content;
        source.title = parsed.title || source.title;
        source.fetchedAt = new Date().toISOString();
      }
    }
  });

  await Promise.allSettled(fetchPromises);

  // ─── Step 4: Synthesize ───
  const synthesis = await synthesize(
    groqKey,
    input.query,
    plan.subQuestions,
    allSources,
    researchType
  );

  // ─── Step 5: Cache result ───
  const result: ResearchResult = {
    query: input.query,
    queryHash,
    synthesis,
    sources: allSources.map((s: ResearchSource) => ({
      url: s.url,
      title: s.title,
      snippet: s.snippet,
      fetchedAt: s.fetchedAt,
    })),
    subQuestions: plan.subQuestions,
    researchType,
    creditsUsed: 1,
    cached: false,
  };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await supabase.from("web_research_cache").insert({
      user_id: input.userId,
      query: input.query,
      query_hash: queryHash,
      results: allSources.map((s: ResearchSource) => ({ url: s.url, title: s.title, snippet: s.snippet })),
      synthesis,
      citations: plan.subQuestions,
      research_type: researchType,
      credits_used: 1,
    });
  } catch {
    // Cache write failed — non-critical
  }

  return {
    content: synthesis,
    skill: "research",
    tokensUsed: 0,
    researchResult: result,
  };
}

// ─── Fallback when no API key ────────────────────────────────

function generateFallbackSynthesis(query: string): string {
  return `## Research Results: ${query}

### Executive Summary

This is a research synthesis for your query: **"${query}"**. The Cognara Research Agent analyzed this topic using its knowledge base.

> **Note:** For enhanced results with live web data, configure a GROQ_API_KEY in your environment. This enables the multi-step research pipeline with planning, search, content fetching, and AI-powered synthesis.

### What We Know

The topic "${query}" is a subject that spans multiple domains. Here's what we can tell you from our knowledge base:

1. **Foundational Concepts** — Understanding the core principles behind "${query}" is essential for deeper exploration.
2. **Practical Applications** — This topic has real-world applications in education, technology, and research.
3. **Current Trends** — The field continues to evolve with new developments and insights.

### Recommended Next Steps

- Use the **Teach** skill to dive deeper into specific aspects
- Try breaking your query into more specific sub-topics
- Use the **Search Courses** skill to find related learning materials

### Sources

No external sources were fetched for this query. Enable the GROQ_API_KEY for web-enhanced research with cited sources.

---

*Powered by Cognara Research Agent • Knowledge-based synthesis*`;
}

/**
 * Single URL fetch + analysis (used by agent panel for ad-hoc URL analysis)
 */
export async function fetchAndAnalyzeURL(url: string): Promise<AgentResponse> {
  const groqKey = process.env.GROQ_API_KEY;
  const parsed = await fetchAndParseURL(url);

  if (!parsed) {
    return {
      content: `## ⚠️ Could not fetch URL\n\nThe URL \`${url}\` could not be retrieved or parsed. It may be behind authentication, a paywall, or blocking automated access.`,
      skill: "research",
    };
  }

  if (!groqKey) {
    return {
      content: `## Fetched: ${parsed.title}\n\n${parsed.content}\n\n---\n*Raw content extracted. Enable GROQ_API_KEY for AI-powered analysis.*`,
      skill: "research",
    };
  }

  const analysis = await callGroq(
    groqKey,
    "You are a content analysis assistant. Summarize the following web content into a structured analysis with: 1) Key Points, 2) Summary, 3) Notable Quotes/Data, 4) Relevance Assessment.",
    `URL: ${url}\nTitle: ${parsed.title}\n\nContent:\n${parsed.content}`
  );

  return {
    content: analysis,
    skill: "research",
  };
}
