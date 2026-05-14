import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabasePublicAnonKey, getSupabasePublicUrl } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  const supabaseUrl = getSupabasePublicUrl();
  const supabaseAnon = getSupabasePublicAnonKey();
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.redirect(new URL("/login?error=config", url.origin));
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnon,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[],
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
