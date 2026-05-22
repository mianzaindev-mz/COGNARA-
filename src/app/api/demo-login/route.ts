import { NextResponse, type NextRequest } from "next/server";

/**
 * Demo login endpoint.
 * Authenticates test accounts without Supabase.
 * Sets a demo cookie that the middleware/dashboard can read.
 */

const DEMO_ACCOUNTS: Record<string, { password: string; role: string; name: string; id: string }> = {
  "student@gmail.com": { 
    password: "user123", 
    role: "student", 
    name: "Demo Student",
    id: "00000000-0000-0000-0000-000000000002"
  },
  "coach@gmail.com":   { 
    password: "coach123", 
    role: "coach", 
    name: "Demo Coach",
    id: "00000000-0000-0000-0000-000000000001"
  },
  "admin@gmail.com":   { 
    password: "admin123", 
    role: "admin", 
    name: "Demo Admin",
    id: "00000000-0000-0000-0000-000000000000"
  },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const account = DEMO_ACCOUNTS[email?.toLowerCase()];

    if (!account || account.password !== password) {
      return NextResponse.json(
        { error: "Invalid demo credentials" },
        { status: 401 },
      );
    }

    // Determine redirect based on role
    const redirectTo =
      account.role === "admin"  ? "/admin/dashboard" :
      account.role === "coach"  ? "/coach/dashboard" :
      "/dashboard";

    const response = NextResponse.json({
      success: true,
      role: account.role,
      name: account.name,
      redirectTo,
    });

    const sessionData = {
      id: account.id,
      email: email.toLowerCase(),
      role: account.role,
      name: account.name,
    };

    // Set demo session cookie (7 days)
    response.cookies.set("cognara_demo_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Set client-accessible demo cookie (7 days)
    response.cookies.set("cognara_demo_client_user", JSON.stringify(sessionData), {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("cognara_demo_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("cognara_demo_client_user", "", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
