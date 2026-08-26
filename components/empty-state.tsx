import Link from "next/link";
import { NavArrowRight } from "iconoir-react";
import type { QuickStart } from "@/lib/quick-start";
import { cn } from "@/lib/utils";

/**
 * 기록이 하나도 없을 때 쓰는 공용 빈 화면.
 *
 * 예전에는 화면 높이를 다 차지하고 가운데 정렬이라 위아래가 통째로 비어 보였다.
 * 지금은 헤더 바로 아래에 붙이고, 그 밑에 "바로 시작" 카드를 깔아
 * 빈 화면이 곧 출발점이 되게 한다.
 */
export function EmptyState({
  icon,
  title,
  description,
  primary,
  quickStarts = [],
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primary?: { href: string; label: string };
  quickStarts?: QuickStart[];
}) {
  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-14 md:px-6 md:pt-20">
      <div className="flex flex-col items-center text-center">
        {icon && (
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-mute text-text-muted">
            {icon}
          </span>
        )}
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-text-high md:text-[25px]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-sm text-pretty text-[14px] leading-[1.7] text-text-mid">
          {description}
        </p>
        {primary && (
          <Link
            href={primary.href}
            className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            {primary.label}
            <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        )}
      </div>

      {quickStarts.length > 0 && (
        <section className="mt-12">
          <p className="text-[12.5px] font-semibold text-text-mid">
            지금 바로 시작할 수 있어요
          </p>
          <ul className="mt-3 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
            {quickStarts.map((q, i) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-mute"
                >
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold tabular-nums",
                      i === 0
                        ? "bg-primary text-primary-fg"
                        : "bg-surface-mute text-text-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-text-high">
                      {q.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-text-muted">
                      {q.sub}
                    </span>
                  </span>
                  <NavArrowRight
                    className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
