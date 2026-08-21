"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Refresh } from "iconoir-react";
import { cn } from "@/lib/utils";

/**
 * 자동 재생 시연용 엔진.
 *
 * 왜 라이브러리를 안 쓰나: 필요한 건 "화면에 들어오면 단계를 넘기는 타이머" 하나뿐이다.
 *
 * 규칙:
 *   - 화면 밖에서는 돌리지 않는다. 안 보는 애니메이션은 배터리만 먹는다
 *   - prefers-reduced-motion 이면 마지막 단계로 바로 보낸다. 정지 화면이라도
 *     내용은 전부 보여야 한다 (중간 단계에 멈춰 있으면 정보가 잘린다)
 *   - 마지막 단계는 다음 루프까지 넉넉히 붙잡는다. 결론이 스치면 못 읽는다
 */
export function useAutoSequence<T extends HTMLElement = HTMLDivElement>(
  /** 각 단계를 붙잡을 시간(ms). 길이가 곧 단계 수 */
  holds: number[],
) {
  const ref = useRef<T>(null);
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [runId, setRunId] = useState(0);
  const entered = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setStep(holds.length - 1);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        // 처음 화면에 들어온 순간엔 첫 장면부터 보여준다
        if (e.isIntersecting && !entered.current) {
          entered.current = true;
          setStep(0);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
    // holds 는 모듈 상수라 매 렌더 같은 값이다
  }, [holds.length]);

  useEffect(() => {
    if (reduced || !inView) return;
    const t = window.setTimeout(
      () => setStep((s) => (s + 1) % holds.length),
      holds[step],
    );
    return () => window.clearTimeout(t);
  }, [step, inView, reduced, holds, runId]);

  const replay = useCallback(() => {
    setStep(0);
    setRunId((n) => n + 1);
  }, []);

  return { ref, step, replay, reduced, playing: inView && !reduced };
}

/** 몇 번째 장면인지 알려주는 점 — 멈춘 건지 도는 건지 구분되게 */
export function StepDots({
  count,
  current,
  onReplay,
  className,
}: {
  count: number;
  current: number;
  onReplay?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current ? "w-5 bg-primary" : "w-1.5 bg-border",
            )}
          />
        ))}
      </span>
      {onReplay && (
        <button
          type="button"
          onClick={onReplay}
          className="ml-1 inline-flex items-center gap-1 text-3xs font-semibold text-text-muted transition-colors hover:text-text-mid"
        >
          <Refresh className="h-3 w-3" strokeWidth={2.5} />
          처음부터
        </button>
      )}
    </div>
  );
}

/**
 * 단계에 맞춰 나타나는 조각.
 * `at` 이상이면 보이고, 나타날 때만 아래에서 올라온다.
 */
export function Cue({
  show,
  children,
  className,
  delay = 0,
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      style={show && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 화면 전환 — 항목이 쌓이는 게 아니라 앱 화면 자체가 넘어가는 것처럼 보이게 한다.
 *
 * 활성 화면만 흐름에 남겨 높이를 잡고(relative), 나머지는 겹쳐 둔다(absolute).
 * 지나간 화면은 왼쪽으로, 올 화면은 오른쪽에서 — 실제 앱 내비게이션과 같은 방향.
 */
export function Screens({
  step,
  screens,
  className,
}: {
  step: number;
  screens: React.ReactNode[];
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {screens.map((node, i) => (
        <div
          key={i}
          aria-hidden={i !== step}
          className={cn(
            "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
            i === step
              ? "relative translate-x-0 opacity-100"
              : "pointer-events-none absolute inset-0 opacity-0",
            i < step && "-translate-x-4",
            i > step && "translate-x-4",
          )}
        >
          {node}
        </div>
      ))}
    </div>
  );
}
