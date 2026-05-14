import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicAnonKey, getSupabasePublicUrl } from "@/lib/supabase/env";

export function createClient() {
  const url = getSupabasePublicUrl();
  const anonKey = getSupabasePublicAnonKey();
  if (!url || !anonKey) {
    return null;
  }
  return createBrowserClient(url, anonKey);
}
