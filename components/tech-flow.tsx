"use client";

import { CheckCircle, Xmark } from "iconoir-react";
import { StoryBars, useAutoSequence } from "@/components/demo-player";
import { cn } from "@/lib/utils";

/**
 * 기술 — 풀이가 쌓일수록 정확해지는 과정을 한 화면에서 재생한다.
 *
 * 히어로와 겹치지 않게 각도를 나눴다:
 *   히어로 = 한 문제에서 지금 일어나는 일
 *   여기   = 회차가 쌓이며 추정이 조여지는 일
 *
 * 지식 상태 추정 · SM-2 · 합격 예측을 따로 보여주면 "기능 세 개" 로 읽힌다.
 * 셋 다 "표본이 쌓이면 값이 움직인다" 는 같은 원리라 한 흐름으로 묶었다.
 * 화면은 그대로 두고 안의 숫자와 막대만 움직인다 — 카드를 갈아끼우지 않는다.
 *
 * 안의 값은 전부 화면 예시다. 사용자 실적이나 모델 성능 지표가 아니다.
 */

const HOLDS = [2000, 2000, 2200, 2800];

const FRAMES = [
  {
    solved: 3,
    bars: [52, 50, 51],
    weak: -1,
    pct: 62,
    band: 21,
    trust: "낮음",
    gap: "—",
    note: "아직 판단하기 일러요. 구간을 넓게 두고 기다립니다.",
  },
  {
    solved: 12,
    bars: [44, 55, 63],
    weak: -1,
    pct: 65,
    band: 14,
    trust: "낮음",
    gap: "1일",
    note: "단원마다 차이가 벌어지기 시작해요.",
  },
  {
    solved: 47,
    bars: [32, 58, 81],
    weak: 0,
    pct: 68,
    band: 9,
    trust: "보통",
    gap: "3일",
    note: "약점이 잡혔어요. 이 단원만 간격을 좁혀 다시 냅니다.",
  },
  {
    solved: 120,
    bars: [51, 66, 84],
    weak: -1,
    pct: 74,
    band: 5,
    trust: "높음",
    gap: "7일",
    note: "약점이 메워지면서 구간도 같이 좁아졌어요.",
  },
];

const NAMES = ["고대 · 신라", "고려 · 문벌귀족", "조선 · 붕당"];

export function TechFlow() {
  const { ref, step, jump } = useAutoSequence<HTMLDivElement>(HOLDS);
  const f = FRAMES[Math.min(step, FRAMES.length - 1)];

  return (
    <div
      ref={ref}
      className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16"
    >
      {/* 설명 — 시연과 같은 단계로 넘어간다 */}
      <div>
        <span className="text-3xs font-bold uppercase tracking-[0.18em] text-primary">
          기술
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-[1.25] tracking-[-0.035em] text-text-high md:text-3xl">
          풀수록 정확해져요.
        </h2>
        <p className="mt-4 max-w-lg text-base text-text-mid">
          점수가 아니라 무엇을 모르는지를 추정해요. 회차가 쌓일수록 약점이
          또렷해지고, 복습 간격과 합격 확률이 같이 조여집니다.
        </p>

        <div className="mt-6 min-h-[52px]">
          <p
            key={step}
            className="animate-slide-up text-sm font-semibold text-text-high [animation-fill-mode:both]"
          >
            {f.note}
          </p>
        </div>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {FRAMES.map((x, i) => (
            <li key={x.solved}>
              <button
                type="button"
                onClick={() => jump(i)}
                aria-current={i === step}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-3xs font-semibold tabular-nums transition-colors",
                  i === step
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-mute text-text-muted hover:text-text-mid",
                )}
              >
                풀이 {x.solved}회
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 한 화면 — 숫자와 막대만 움직인다 */}
      <div className="mx-auto w-full max-w-[380px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_16px_40px_-30px_rgb(var(--text-high)/0.35)]">
          <div className="flex items-center justify-between border-b border-border-soft bg-surface-mute px-4 py-2.5">
            <span className="text-3xs font-bold text-text-high">내 상태</span>
            <span className="text-4xs tabular-nums text-text-muted">
              풀이 {f.solved}회
            </span>
          </div>
          <StoryBars
            holds={HOLDS}
            step={step}
            onJump={jump}
            className="px-4 pb-2"
          />

          <div className="space-y-4 p-4">
            {/* 단원별 추정 */}
            <div>
              <span className="text-4xs font-bold uppercase tracking-[0.12em] text-text-muted">
                단원별 추정
              </span>
              <ul className="mt-2 space-y-2">
                {NAMES.map((n, i) => {
                  const weak = f.weak === i;
                  return (
                    <li key={n}>
                      <div className="flex items-center justify-between text-4xs">
                        <span
                          className={cn(
                            "transition-colors duration-300",
                            weak ? "font-bold text-danger" : "text-text-mid",
                          )}
                        >
                          {n}
                        </span>
                        <span
                          className={cn(
                            "tabular-nums transition-colors duration-300",
                            weak ? "font-bold text-danger" : "text-text-muted",
                          )}
                        >
                          {f.bars[i]}%
                        </span>
                      </div>
                      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <span
                          className={cn(
                            "block h-full rounded-full transition-[width,background-color] duration-700 ease-out",
                            weak ? "bg-danger" : "bg-primary/50",
                          )}
                          style={{ width: `${f.bars[i]}%` }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 복습 간격 */}
            <div className="flex items-center justify-between border-t border-border-soft pt-3">
              <span className="text-4xs font-bold uppercase tracking-[0.12em] text-text-muted">
                다음 복습 간격
              </span>
              <span
                key={f.gap}
                className="inline-flex animate-roll-up items-center gap-1.5 text-xs font-extrabold tabular-nums text-primary"
              >
                {f.gap === "—" ? (
                  <span className="text-text-muted">계산 중</span>
                ) : (
                  <>
                    {step === 2 ? (
                      <Xmark
                        className="h-3 w-3 text-danger"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <CheckCircle className="h-3 w-3" strokeWidth={2.5} />
                    )}
                    {f.gap} 뒤
                  </>
                )}
              </span>
            </div>

            {/* 합격 예측 */}
            <div className="border-t border-border-soft pt-3">
              <div className="flex items-end justify-between">
                <span className="text-4xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  합격 확률
                </span>
                <span className="flex items-end gap-1.5">
                  <span className="text-xl font-extrabold leading-none tabular-nums tracking-[-0.03em] text-primary">
                    {f.pct}
                    <span className="text-3xs">%</span>
                  </span>
                  <span className="pb-0.5 text-4xs tabular-nums text-text-mid">
                    ±{f.band}%p
                  </span>
                  <span
                    className={cn(
                      "mb-0.5 rounded-full px-1.5 py-0.5 text-4xs font-bold transition-colors duration-300",
                      f.trust === "낮음"
                        ? "bg-danger/12 text-danger"
                        : f.trust === "보통"
                          ? "bg-surface-mute text-text-mid"
                          : "bg-primary/12 text-primary",
                    )}
                  >
                    {f.trust}
                  </span>
                </span>
              </div>
              {/* 표본이 쌓일수록 눈에 띄게 좁아진다 */}
              <div className="relative mt-2.5 h-2 w-full rounded-full bg-border">
                <span
                  className="absolute inset-y-0 rounded-full bg-primary/30 transition-all duration-700 ease-out"
                  style={{
                    left: `${Math.max(0, f.pct - f.band)}%`,
                    width: `${f.band * 2}%`,
                  }}
                />
                <span
                  className="absolute inset-y-[-3px] w-[2px] rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ left: `${f.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-3xs leading-[1.7] text-text-muted">
          해설에는 오류가 있을 수 있어요. 핵심 개념 해설은 검수를 거칩니다. 합격
          예측은 참고용 추정치예요.
        </p>
      </div>
    </div>
  );
}
