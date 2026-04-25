"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "iconoir-react";
import { startReviewAttempt } from "@/lib/actions/attempts";
import { cn } from "@/lib/utils";

export function ReviewStartButton({
  source,
  label,
  disabled,
  className,
}: {
  source: "mistakes" | "bookmarks" | "srs";
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (disabled || pending) return;
    startTransition(async () => {
      try {
        const res = await startReviewAttempt({ source });
        router.push(`/practice/${res.attemptId}`);
      } catch (e) {
        alert(e instanceof Error ? e.message : "시작할 수 없어요.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-50",
        className,
      )}
    >
      <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
      {pending ? "준비 중…" : label}
    </button>
  );
}
