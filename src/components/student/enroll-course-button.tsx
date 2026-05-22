"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollInCourse } from "@/app/(student)/actions/enroll";
import { cn } from "@/lib/utils/cn";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";

type EnrollCourseButtonProps = {
  courseId: string;
  slug: string;
  alreadyEnrolled?: boolean;
  className?: string;
  price?: number;
};

export function EnrollCourseButton({
  courseId,
  slug,
  alreadyEnrolled = false,
  className,
  price = 0,
}: EnrollCourseButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
    setShowConfirm(false);
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

  const isFree = price === 0;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={pending}
        className={cn(
          "inline-flex rounded-full bg-cn-sidebar px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cn-sidebar/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cn-yellow dark:text-cn-sidebar",
          className,
        )}
      >
        {pending ? "Enrolling…" : isFree ? "Enroll free" : `Enroll — $${price.toFixed(2)}`}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      <DoubleConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleEnroll}
        title={isFree ? "Confirm Enrollment" : "Confirm Purchase"}
        description={isFree 
          ? "Are you sure you want to enroll in this course? It will be added to your library."
          : `You are about to purchase this course for $${price.toFixed(2)}. This action will use your saved payment method.`}
        confirmWord={isFree ? undefined : "BUY"}
        actionButtonText={isFree ? "Enroll Now" : "Confirm Purchase"}
      />
    </div>
  );
}
