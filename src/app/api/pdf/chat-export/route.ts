// src/app/api/pdf/chat-export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateChatExportPdf } from "@/lib/pdf/generators/chat-export";
import { SECURITY_HEADERS } from "@/lib/security/sanitize";

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
    const { title, skillName, messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided for export" },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Fetch student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const studentName = profile?.full_name || "Cognara Student";

    const pdfBuffer = await generateChatExportPdf({
      title: title || "Cognara AI Chat Export",
      studentName,
      skillName: skillName || undefined,
      messages: messages.map((m: any) => ({
        role: m.role || "user",
        content: m.content || "",
        timestamp: m.timestamp || undefined,
      })),
      dateStr: new Date().toLocaleDateString(),
    });

    // Track the export in generated_pdfs
    await supabase.from("generated_pdfs").insert({
      user_id: user.id,
      title: title || "Chat Export",
      type: "chat_export",
      storage_path: `pdf/chat/${user.id}/${Date.now()}.pdf`,
      page_count: 1,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Chat_Export_${Date.now()}.pdf"`,
        ...SECURITY_HEADERS,
      },
    });
  } catch (err: any) {
    console.error("[Chat Export PDF Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate chat PDF" },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
