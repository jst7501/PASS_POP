import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * 오답노트 / 북마크 사이의 공유 탭 스트립
 */
export function SavedTabs({
  active,
  mistakeCount,
  bookmarkCount,
}: {
  active: "mistakes" | "bookmarks";
  mistakeCount: number;
  bookmarkCount: number;
}) {
  return (
    <div className="mt-4 inline-flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
      <Tab
        href="/mistakes"
        label="오답노트"
        count={mistakeCount}
        active={active === "mistakes"}
      />
      <Tab
        href="/bookmarks"
        label="북마크"
        count={bookmarkCount}
        active={active === "bookmarks"}
      />
    </div>
  );
}

function Tab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-[12.5px] font-semibold transition-colors",
        active
          ? "bg-text-high text-background"
          : "text-text-mid hover:text-text-high",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums text-[10.5px]",
          active ? "text-background/70" : "text-text-muted",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
