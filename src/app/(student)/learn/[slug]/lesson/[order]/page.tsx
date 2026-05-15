import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LearnLessonPanel } from "@/components/student/learn-lesson-panel";
import { loadCourseLearnContext } from "@/lib/student/lesson-viewer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; order: string }>;
};

export default async function LearnLessonPage({ params }: PageProps) {
  const { slug, order: orderStr } = await params;
  const orderIndex = Number.parseInt(orderStr, 10);

  if (!Number.isFinite(orderIndex)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const ctx = await loadCourseLearnContext(slug, user.id);
  if (!ctx) notFound();

  const lessonIndex = ctx.lessons.findIndex((l) => l.orderIndex === orderIndex);
  const lesson = ctx.lessons[lessonIndex];
  if (!lesson) notFound();

  const prevOrder = lessonIndex > 0 ? ctx.lessons[lessonIndex - 1].orderIndex : null;
  const nextOrder =
    lessonIndex < ctx.lessons.length - 1 ? ctx.lessons[lessonIndex + 1].orderIndex : null;

  return <LearnLessonPanel ctx={ctx} lesson={lesson} prevOrder={prevOrder} nextOrder={nextOrder} />;
}
