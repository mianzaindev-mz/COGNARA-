import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAuthRoute,
  requiresAuthentication,
  VERIFY_EMAIL_ROUTE,
} from "@/lib/auth/paths";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import {
  getSupabasePublicAnonKey,
  getSupabasePublicUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

async function fetchProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<{
  role: UserRole;
  is_banned: boolean;
  onboarding_complete: boolean | null;
} | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_banned")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) return null;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("onboarding_complete")
    .eq("user_id", userId)
    .maybeSingle();

  const role = isUserRole(profile.role) ? profile.role : "student";
  return {
    role,
    is_banned: Boolean(profile.is_banned),
    onboarding_complete:
      typeof settings?.onboarding_complete === "boolean"
        ? settings.onboarding_complete
        : null,
  };
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    if (requiresAuthentication(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = getSupabasePublicUrl()!;
  const supabaseAnon = getSupabasePublicAnonKey()!;

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnon,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const search = request.nextUrl.search;

  if (pathname.startsWith("/api/auth/callback")) {
    return supabaseResponse;
  }

  if (!user) {
    if (requiresAuthentication(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirectTo", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const emailConfirmed = Boolean(user.email_confirmed_at);

  if (!emailConfirmed && pathname !== VERIFY_EMAIL_ROUTE) {
    const url = request.nextUrl.clone();
    url.pathname = VERIFY_EMAIL_ROUTE;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (emailConfirmed && pathname === VERIFY_EMAIL_ROUTE) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const profile = await fetchProfile(supabase, user.id);

  if (profile?.is_banned && pathname !== "/banned") {
    const url = request.nextUrl.clone();
    url.pathname = "/banned";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!profile?.is_banned && pathname === "/banned") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    emailConfirmed &&
    profile &&
    profile.role !== "admin" &&
    profile.onboarding_complete !== true
  ) {
    const target =
      profile.role === "coach"
        ? "/onboarding/coach"
        : "/onboarding/student";
    if (!pathname.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (
    emailConfirmed &&
    profile?.onboarding_complete === true &&
    pathname.startsWith("/onboarding")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && emailConfirmed && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    if (profile?.role !== "admin") {
      return new NextResponse(null, { status: 404 });
    }
  }

  if (pathname.startsWith("/coach")) {
    if (profile?.role !== "coach" && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
