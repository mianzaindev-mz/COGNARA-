// src/app/api/research/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runResearchAgent, fetchAndAnalyzeURL } from "@/lib/ai/agents/research-agent";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";

/**
 * POST /api/research — Run a new research query or analyze a URL
 * Body: { query: string, researchType?: string, url?: string }
 * 
 * GET /api/research — List past research from cache
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    const body = await request.json();
    const { query, researchType, url } = body;

    // ─── URL Analysis Mode ───
    if (url && typeof url === "string") {
      const result = await fetchAndAnalyzeURL(url);
      return NextResponse.json({ response: result }, { headers: SECURITY_HEADERS });
    }

    // ─── Research Pipeline Mode ───
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json(
        { error: "Query must be at least 3 characters" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: "Query must be 500 characters or fewer" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const result = await runResearchAgent({
      query: query.trim(),
      userId: user.id,
      researchType: researchType || "general",
      maxSources: 5,
    });

    return NextResponse.json(
      {
        response: {
          content: result.content,
          skill: result.skill,
        },
        research: result.researchResult,
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (err: any) {
    console.error("[Research API Error]", err);
    return NextResponse.json(
      { error: err.message || "Research pipeline failed" },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("web_research_cache")
      .select("id, query, query_hash, synthesis, results, citations, research_type, credits_used, created_at, expires_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json(
      {
        research: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { headers: SECURITY_HEADERS }
    );
  } catch (err: any) {
    console.error("[Research List API Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to list research" },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
