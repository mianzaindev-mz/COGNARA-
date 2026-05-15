import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

export const metadata: Metadata = { title: "My Courses — Coach — COGNARA™" };

const courses = [
  { id: "1", title: "Python for Beginners", slug: "python-for-beginners", students: 124, lessons: 18, completion: 78, rating: 4.8, price: 0, status: "published" as const, category: "Programming" },
  { id: "2", title: "Web Development with React", slug: "web-dev-react", students: 89, lessons: 24, completion: 65, rating: 4.6, price: 29.99, status: "published" as const, category: "Web Development" },
  { id: "3", title: "Data Science Fundamentals", slug: "data-science-fundamentals", students: 45, lessons: 15, completion: 42, rating: 4.9, price: 19.99, status: "draft" as const, category: "Data Science" },
  { id: "4", title: "Machine Learning A-Z", slug: "ml-az", students: 0, lessons: 8, completion: 0, rating: 0, price: 39.99, status: "draft" as const, category: "AI/ML" },
];

export default function CoachCoursesPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-cn-ink">My Courses</h1>
          <p className="mt-1 text-sm text-cn-ink-muted">{courses.length} courses · {courses.filter(c => c.status === "published").length} published</p>
        </div>
        <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 hover:shadow-lg">
          + Create Course
        </button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map(course => (
          <div key={course.id} className="group relative overflow-hidden rounded-2xl border border-cn-border bg-cn-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-cn-border-strong">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{course.category}</span>
                <h3 className="mt-1 text-base font-bold text-cn-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</h3>
              </div>
              <Badge variant={course.status === "published" ? "success" : "warning"} dot>{course.status}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-cn-canvas p-2.5 text-center">
                <p className="text-lg font-bold text-cn-ink">{course.students}</p>
                <p className="text-[10px] text-cn-ink-subtle">students</p>
              </div>
              <div className="rounded-xl bg-cn-canvas p-2.5 text-center">
                <p className="text-lg font-bold text-cn-ink">{course.lessons}</p>
                <p className="text-[10px] text-cn-ink-subtle">lessons</p>
              </div>
              <div className="rounded-xl bg-cn-canvas p-2.5 text-center">
                <p className="text-lg font-bold text-cn-ink">{course.rating > 0 ? `${course.rating} ★` : "—"}</p>
                <p className="text-[10px] text-cn-ink-subtle">rating</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cn-ink-muted">Avg completion</span>
                <span className="font-semibold text-cn-ink">{course.completion}%</span>
              </div>
              <ProgressBar value={course.completion} color="indigo" size="sm" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-cn-ink">
                {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
              </span>
              <Link href={`/coach/courses/${course.slug}`} className="text-xs font-semibold text-indigo-500 hover:underline">
                Edit course →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
