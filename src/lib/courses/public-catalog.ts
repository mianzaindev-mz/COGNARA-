import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type PublicCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  price_usd: number;
  is_free: boolean;
  total_lessons: number;
  total_enrolled: number;
  avg_rating: number | null;
};

export async function loadPublishedCourses(limit = 12, search?: string): Promise<PublicCourse[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("courses")
      .select(
        "id, title, slug, description, category, difficulty, price_usd, is_free, total_lessons, total_enrolled, avg_rating",
      )
      .eq("is_published", true)
      .is("deleted_at", null);

    if (search && search.trim().length > 0) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    const { data, error } = await query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as PublicCourse[];
  } catch {
    return [];
  }
}
