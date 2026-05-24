import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/uuid";

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = "https://api.daily.co/v1";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, type } = body; // type: 'peer' or 'coach'

    if (!sessionId || !type) {
      return NextResponse.json({ error: "Missing session ID or type" }, { status: 400 });
    }

    if (!isValidUUID(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    if (!DAILY_API_KEY) {
      console.error("DAILY_API_KEY is not configured");
      return NextResponse.json({ error: "Live classes not configured on server" }, { status: 500 });
    }

    // Verify ownership
    if (type === "peer") {
      const { data: session } = await supabase
        .from("peer_sessions")
        .select("host_id, daily_room_url")
        .eq("id", sessionId)
        .single();

      if (!session || session.host_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (session.daily_room_url) {
        return NextResponse.json({ url: session.daily_room_url });
      }
    } else {
      const { data: session } = await supabase
        .from("live_sessions")
        .select("coach_id, daily_room_url")
        .eq("id", sessionId)
        .single();

      if (!session || session.coach_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (session.daily_room_url) {
        return NextResponse.json({ url: session.daily_room_url });
      }
    }

    // Create room in Daily.co
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600 * 4, // 4 hours from now
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Daily.co API error:", errorData);
      throw new Error("Failed to create video room");
    }

    const roomData = await response.json();
    const roomUrl = roomData.url;

    // Update DB
    if (type === "peer") {
      await supabase
        .from("peer_sessions")
        .update({ daily_room_url: roomUrl, status: "live" })
        .eq("id", sessionId);
    } else {
      await supabase
        .from("live_sessions")
        .update({ daily_room_url: roomUrl, status: "live" })
        .eq("id", sessionId);
    }

    return NextResponse.json({ url: roomUrl });
  } catch (err: any) {
    console.error("Create room error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
