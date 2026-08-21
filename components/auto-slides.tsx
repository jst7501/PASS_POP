"use client";

import { useAutoSequence } from "@/components/demo-player";
import { cn } from "@/lib/utils";

/**
 * 자동으로 넘어가는 슬라이드.
 *
 * 항목 서너 개를 세로로 쌓으면 그 구간만 화면 몇 개 분량이 되고, 스크롤하는
 * 사람은 세 번째쯤에서 흥미를 잃는다. 한 자리에서 넘기면 높이가 고정되고
 * 시선이 한 곳에 머문다.
 *
 * 규칙:
 *   - 자리를 미리 잡아둔다. 슬라이드마다 높이가 다르면 페이지가 밀린다
 *   - 지나간 것은 왼쪽, 올 것은 오른쪽 — 실제 스와이프와 같은 방향
 *   - 점을 눌러 직접 넘길 수 있어야 한다. 자동으로만 돌면 놓친 걸 못 본다
 */
export function AutoSlides({
  slides,
  hold = 4200,
  minH,
  className,
  labels,
}: {
  slides: React.ReactNode[];
  /** 한 장을 붙잡는 시간(ms) */
  hold?: number;
  /** 가장 긴 슬라이드에 맞춘 최소 높이 */
  minH: string;
  className?: string;
  /** 점 대신 이름표로 보여줄 때 */
  labels?: string[];
}) {
  const { ref, step, jump } = useAutoSequence<HTMLDivElement>(
    slides.map(() => hold),
  );

  return (
    <div ref={ref} className={className}>
      <div className={cn("relative overflow-hidden", minH)}>
        {slides.map((node, i) => (
          <div
            key={i}
            aria-hidden={i !== step}
            className={cn(
              "transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none",
              i === step
                ? "relative translate-x-0 opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0",
              i < step && "-translate-x-5",
              i > step && "translate-x-5",
            )}
          >
            {node}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {slides.map((_, i) =>
          labels ? (
            <button
              key={i}
              type="button"
              onClick={() => jump(i)}
              aria-current={i === step}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                i === step
                  ? "bg-primary text-primary-fg"
                  : "bg-surface-mute text-text-muted hover:text-text-mid",
              )}
            >
              {labels[i]}
            </button>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => jump(i)}
              aria-label={`${i + 1}번째 보기`}
              aria-current={i === step}
              className="py-2"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-border",
                )}
              />
            </button>
          ),
        )}
      </div>
    </div>
  );
}
