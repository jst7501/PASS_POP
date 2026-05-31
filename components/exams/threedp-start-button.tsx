"use client";

import { useRouter } from "next/navigation";
import { createLocalAttempt } from "@/lib/local/progress";
import { cn } from "@/lib/utils";

/**
 * DP(3D프린터) 서버 렌더 상세 페이지에서 풀이를 시작하는 클라이언트 아일랜드.
 * 서버에서 question id 배열을 받아 로컬 attempt 를 만들고 /practice/[id] 로 보낸다.
 * (페이지 본문은 서버 렌더 → 색인 가능, 시작 동작만 클라이언트)
 */
export function ThreeDPStartButton({
  ids,
  label,
  children,
  className,
}: {
  ids: string[];
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const disabled = ids.length === 0;
  const start = () => {
    if (disabled) return;
    const id = createLocalAttempt(ids, label);
    router.push(`/practice/${id}`);
  };
  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      className={cn(
        "inline-flex h-12 items-center gap-1.5 rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}
