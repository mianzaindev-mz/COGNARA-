import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicAnonKey, getSupabasePublicUrl } from "@/lib/supabase/env";
import { createMockSupabaseClient } from "./mock-client";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(";").shift() || "");
  return null;
}

let cachedClient: any = null;

export function createClient() {
  if (typeof window === "undefined") {
    // Server-side: always create a new client
    const url = getSupabasePublicUrl();
    const anonKey = getSupabasePublicAnonKey();
    if (!url || !anonKey) return null;
    return createBrowserClient(url, anonKey);
  }

  // Client-side: use a singleton to prevent infinite re-renders in hooks
  if (!cachedClient) {
    const clientUserCookie = getCookie("cognara_demo_client_user");
    if (clientUserCookie) {
      try {
        const demoUser = JSON.parse(clientUserCookie);
        cachedClient = createMockSupabaseClient(demoUser, () => {
          document.cookie = "cognara_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          document.cookie = "cognara_demo_client_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        });
      } catch {
        // Fall through
      }
    }

    if (!cachedClient) {
      const url = getSupabasePublicUrl();
      const anonKey = getSupabasePublicAnonKey();
      if (url && anonKey) {
        cachedClient = createBrowserClient(url, anonKey);
      }
    }
  }

  return cachedClient;
}
