import { cn } from "@/lib/utils";

/**
 * 공용 스켈레톤 셀.
 * pulse 애니메이션 + 라운드 작게.
 */
export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-surface-mute",
        className,
      )}
    />
  );
}

/**
 * 카드 한 줄짜리 스켈레톤.
 */
export function SkelLine({
  className,
}: {
  className?: string;
}) {
  return <Skeleton className={cn("h-3", className)} />;
}

export function SkelCard({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-4",
        className,
      )}
    >
      <SkelLine className="w-1/3" />
      <SkelLine className="mt-3 w-3/4" />
      <SkelLine className="mt-2 w-1/2" />
    </div>
  );
}

/**
 * 페이지 공용 스켈레톤 — 헤더 + 섹션 3-4 개.
 */
export function PageSkeleton({
  hideHeader,
}: {
  hideHeader?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:px-6 md:pt-8">
      {!hideHeader && (
        <>
          <SkelLine className="w-20" />
          <Skeleton className="mt-3 h-7 w-2/3" />
          <SkelLine className="mt-2 w-1/3" />
        </>
      )}
      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-surface sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-3.5">
            <SkelLine className="w-12" />
            <SkelLine className="mt-2 h-5 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-2 md:grid-cols-2">
        <SkelCard />
        <SkelCard />
      </div>
      <div className="mt-8 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
