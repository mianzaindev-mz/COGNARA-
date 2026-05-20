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

export function createClient() {
  const clientUserCookie = getCookie("cognara_demo_client_user");
  if (clientUserCookie) {
    try {
      const demoUser = JSON.parse(clientUserCookie);
      return createMockSupabaseClient(demoUser, () => {
        // Delete cookies client-side
        document.cookie = "cognara_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "cognara_demo_client_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      });
    } catch {
      // Fall through to standard client
    }
  }

  const url = getSupabasePublicUrl();
  const anonKey = getSupabasePublicAnonKey();
  if (!url || !anonKey) {
    return null;
  }
  return createBrowserClient(url, anonKey);
}
