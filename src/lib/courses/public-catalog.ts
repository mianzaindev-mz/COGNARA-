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

export async function loadPublishedCourses(limit = 12): Promise<PublicCourse[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id, title, slug, description, category, difficulty, price_usd, is_free, total_lessons, total_enrolled, avg_rating",
      )
      .eq("is_published", true)
      .is("deleted_at", null)
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
