"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markLessonComplete } from "@/app/(student)/actions/lesson-progress";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";
import { cn } from "@/lib/utils/cn";

type MarkLessonCompleteButtonProps = {
  lessonId: string;
  courseId: string;
  slug: string;
  alreadyCompleted: boolean;
  isGraded?: boolean;
  className?: string;
};

export function MarkLessonCompleteButton({
  lessonId,
  courseId,
  slug,
  alreadyCompleted,
  isGraded,
  className,
}: MarkLessonCompleteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyCompleted);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function initiateCompletion() {
    if (done) return;
    if (isGraded) {
      setConfirmOpen(true);
    } else {
      handleComplete();
    }
  }

  function handleComplete() {
    setConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await markLessonComplete(lessonId, courseId, slug);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={initiateCompletion}
        disabled={pending || done}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition disabled:cursor-default",
          done
            ? "bg-cn-yellow text-cn-sidebar"
            : "bg-cn-orange text-white shadow-md hover:bg-cn-orange-hover disabled:opacity-60",
        )}
      >
        {done ? (
          <>
            <CheckIcon />
            Completed
          </>
        ) : pending ? (
          "Saving…"
        ) : (
          "Mark lesson complete"
        )}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      <DoubleConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleComplete}
        title="Submit Graded Activity"
        description="Are you sure you want to submit this activity for grading? This action cannot be undone."
        confirmWord="SUBMIT"
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
