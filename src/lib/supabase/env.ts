/** Public Supabase env (safe on client after Next inlines NEXT_PUBLIC_*). */

export function getSupabasePublicUrl(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return v && v.length > 0 ? v : undefined;
}

export function getSupabasePublicAnonKey(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return v && v.length > 0 ? v : undefined;
}

export function isSupabaseConfigured(): boolean {
  return !!getSupabasePublicUrl() && !!getSupabasePublicAnonKey();
}
