"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/student/course-card";
import { CourseFilterChips } from "@/components/student/course-filter-chips";

export type DashboardCourseItem = {
  title: string;
  category: string | null;
  progressDone: number;
  totalLessons: number;
  href: string;
};

type DashboardCoursesGridProps = {
  courses: DashboardCourseItem[];
  showFilters: boolean;
};

export function DashboardCoursesGrid({ courses, showFilters }: DashboardCoursesGridProps) {
  const [activeFilter, setActiveFilter] = useState(0);

  const filters = useMemo(() => {
    const cats = new Set(
      courses.map((c) => c.category).filter((c): c is string => Boolean(c)),
    );
    return ["All courses", ...Array.from(cats)] as string[];
  }, [courses]);

  const filtered = useMemo(() => {
    if (!showFilters || activeFilter === 0) return courses;
    const label = filters[activeFilter];
    return courses.filter((c) => c.category === label);
  }, [courses, showFilters, activeFilter, filters]);

  return (
    <>
      {showFilters && filters.length > 1 ? (
        <div className="mt-4">
          <CourseFilterChips
            filters={filters}
            activeIndex={activeFilter}
            onSelect={setActiveFilter}
          />
        </div>
      ) : null}
      <ul className="mt-6 grid gap-5 md:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.href}>
            <CourseCard
              title={c.title}
              category={c.category}
              progressDone={c.progressDone}
              totalLessons={c.totalLessons}
              href={c.href}
            />
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-cn-ink-muted">No courses in this category.</p>
      ) : null}
    </>
  );
}
