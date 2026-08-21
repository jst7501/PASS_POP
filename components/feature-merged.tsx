"use client";

import { useAutoSequence } from "@/components/demo-player";
import {
  LiveAiExplanation,
  LiveConceptCard,
  LiveStepSolution,
} from "@/components/mockups-live";
import {
  LiveConsolidatedNote,
  LiveFailRisk,
  LiveMistakes,
  LivePassPrediction,
} from "@/components/mockups-live-2";
import { cn } from "@/lib/utils";

/**
 * 같은 주제의 기능을 한 블록으로 묶는다.
 *
 * 기능마다 카드를 하나씩 두면 열 개가 같은 상자로 반복돼 목록처럼 읽힌다.
 * 주제로 묶고, 설명 문장과 시연을 같은 단계에 물려 함께 넘기면
 * 한 이야기가 이어지는 것으로 읽힌다.
 *
 * 텍스트와 시연이 같은 step 을 쓰는 게 핵심이다 — 따로 돌면 어긋나 보인다.
 */

type Part = {
  title: string;
  desc: string;
  visual: React.ReactNode;
};

/** 각 부분을 얼마나 붙잡을지. 시연 한 바퀴보다 살짝 길게. */
const PART_HOLD = 5200;

function MergedBlock({
  index,
  kicker,
  parts,
}: {
  index: number;
  kicker: string;
  parts: Part[];
}) {
  const { ref, step } = useAutoSequence<HTMLLIElement>(
    parts.map(() => PART_HOLD),
  );
  const flip = index % 2 === 1;
  const cur = parts[Math.min(step, parts.length - 1)];

  return (
    <li
      ref={ref}
      className="grid gap-7 border-t border-border py-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16"
    >
      <div className={flip ? "lg:order-2" : undefined}>
        <span className="text-3xs font-bold tabular-nums tracking-[0.18em] text-primary">
          {kicker}
        </span>

        {/* 제목·설명이 시연과 같은 단계로 넘어간다 */}
        <div key={step} className="animate-slide-up [animation-fill-mode:both]">
          <h3 className="mt-3 text-xl font-extrabold leading-[1.3] tracking-[-0.03em] text-text-high md:text-2xl">
            {cur.title}
          </h3>
          <p className="mt-3 max-w-lg text-base text-text-mid">{cur.desc}</p>
        </div>

        {/* 이 묶음에 몇 개가 들어있는지 */}
        <ul className="mt-6 flex flex-wrap gap-1.5">
          {parts.map((p, i) => (
            <li key={p.title}>
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-1 text-3xs font-semibold transition-colors duration-300",
                  i === step
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-mute text-text-muted",
                )}
              >
                {p.title}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={cn(
          "hidden justify-center lg:flex",
          flip ? "lg:order-1" : undefined,
        )}
      >
        {/* 시연은 전부 붙여두고 현재 것만 보인다 — 매번 마운트되면 처음부터 다시 돈다 */}
        <div className="relative w-full max-w-[300px]">
          {parts.map((p, i) => (
            <div
              key={i}
              aria-hidden={i !== step}
              className={cn(
                "transition-opacity duration-300",
                i === step
                  ? "relative opacity-100"
                  : "pointer-events-none absolute inset-0 opacity-0",
              )}
            >
              {p.visual}
            </div>
          ))}
        </div>
      </div>

      {/* 모바일에선 현재 것 하나만 */}
      <div className="flex justify-center lg:hidden">{cur.visual}</div>
    </li>
  );
}

export function MergedFeatures() {
  return (
    <>
      <MergedBlock
        index={0}
        kicker="01 · 틀렸을 때"
        parts={[
          {
            title: "오답 기준 해설",
            desc: "정답 하나를 설명하고 끝내지 않아요. 내가 고른 그 선택지를 기준으로, 왜 거기 끌렸는지부터 짚어줍니다.",
            visual: <LiveAiExplanation />,
          },
          {
            title: "개념 카드",
            desc: "막힌 그 자리에서 개념을 펼쳐요. 교재를 펴지 않아도 공식 유도부터 단골 함정까지 바로 확인합니다.",
            visual: <LiveConceptCard />,
          },
          {
            title: "단계별 완전 풀이",
            desc: "계산 과목도 건너뛰는 단계 없이 보여줘요. 모르는 줄은 '이 줄 왜?' 를 눌러 그 한 줄만 더 자세히.",
            visual: <LiveStepSolution />,
          },
        ]}
      />

      <MergedBlock
        index={1}
        kicker="02 · 자동으로 쌓이는 것"
        parts={[
          {
            title: "오답노트",
            desc: "틀리는 순간 노트에 담깁니다. 따로 정리할 필요도, 옮겨 적을 필요도 없어요.",
            visual: <LiveMistakes />,
          },
          {
            title: "단권화 노트",
            desc: "틀린 것과 약한 개념만 모아 시험 전날 훑을 한 장으로 만들어요. PDF 로도 내보낼 수 있습니다.",
            visual: <LiveConsolidatedNote />,
          },
        ]}
      />

      <MergedBlock
        index={2}
        kicker="03 · 나를 진단하는 것"
        parts={[
          {
            title: "합격 예측",
            desc: "최근 풀이를 반영해 확률과 신뢰구간을 같이 내요. 표본이 적으면 구간을 넓게, 그리고 적다고 말합니다.",
            visual: <LivePassPrediction />,
          },
          {
            title: "과락 위험 진단",
            desc: "평균이 합격권이어도 한 과목 과락이면 떨어져요. 위험한 과목을 짚고 그 과목만 집중하는 모의고사를 냅니다.",
            visual: <LiveFailRisk />,
          },
        ]}
      />
    </>
  );
}
