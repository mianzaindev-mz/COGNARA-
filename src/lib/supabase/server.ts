import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicAnonKey, getSupabasePublicUrl } from "@/lib/supabase/env";
import { createMockSupabaseClient } from "./mock-client";

export async function createClient() {
  const cookieStore = await cookies();

  // Intercept demo sessions
  const demoCookie = cookieStore.get("cognara_demo_session")?.value;
  if (demoCookie) {
    try {
      const demoUser = JSON.parse(demoCookie);
      return createMockSupabaseClient(demoUser, () => {
        try {
          cookieStore.delete("cognara_demo_session");
          cookieStore.delete("cognara_demo_client_user");
        } catch {
          // Ignore if called from page where cookies are not mutable
        }
      });
    } catch {
      // Fall through to standard client if cookie is malformed
    }
  }

  const url = getSupabasePublicUrl();
  const anonKey = getSupabasePublicAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createServerClient(url, anonKey, {
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
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* set from a Server Component without mutable cookies */
        }
      },
    },
  });
}
