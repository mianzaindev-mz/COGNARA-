import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const lesson = ctx.lessons.find((l) => l.orderIndex === orderIndex);
  if (!lesson) notFound();

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm text-cn-ink-muted">
        <Link href="/my-courses" className="hover:text-cn-orange">
          My courses
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/learn/${slug}`} className="hover:text-cn-orange">
          {ctx.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-cn-ink">{lesson.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-cn-ink">{lesson.title}</h1>
      <p className="text-sm text-cn-ink-muted">
        Lesson {orderIndex} · {lesson.type}
        {lesson.durationMins ? ` · ${lesson.durationMins} min` : ""}
      </p>

      <div className="cn-card flex aspect-video items-center justify-center bg-cn-lavender/20">
        <p className="text-sm text-cn-ink-muted">Lesson content player — next integration step.</p>
      </div>

      <Link
        href={`/learn/${slug}`}
        className="inline-flex w-fit rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover"
      >
        ← Course overview
      </Link>
    </div>
  );
}
