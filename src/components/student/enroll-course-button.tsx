"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollInCourse } from "@/app/(student)/actions/enroll";
import { cn } from "@/lib/utils/cn";

type EnrollCourseButtonProps = {
  courseId: string;
  slug: string;
  alreadyEnrolled?: boolean;
  className?: string;
};

export function EnrollCourseButton({
  courseId,
  slug,
  alreadyEnrolled = false,
  className,
}: EnrollCourseButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (alreadyEnrolled) {
    return (
      <a
        href={`/learn/${slug}`}
        className={cn(
          "inline-flex rounded-full bg-cn-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-cn-orange-hover",
          className,
        )}
      >
        Continue →
      </a>
    );
  }

  function handleEnroll() {
    setError(null);
    startTransition(async () => {
      const result = await enrollInCourse(courseId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/learn/${slug}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleEnroll}
        disabled={pending}
        className={cn(
          "inline-flex rounded-full bg-cn-sidebar px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cn-sidebar/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cn-yellow dark:text-cn-sidebar",
          className,
        )}
      >
        {pending ? "Enrolling…" : "Enroll free"}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
