"use client";

import { useState } from "react";
import { CheckCircle, Refresh, Timer } from "iconoir-react";
import { cn } from "@/lib/utils";

/**
 * 히어로 인터랙티브 데모.
 *
 * 왜 목업이 아니라 진짜 눌리게 만들었나:
 *   PASSPOP 의 차별점은 "선택지마다 해설이 다르다" 하나다. 그건 문장으로
 *   설명하면 다른 CBT 사이트의 카피와 구분이 안 되고, 정지된 목업으로도
 *   전달되지 않는다. 직접 ② 를 눌러 ② 용 해설을 받아봐야 안다.
 *   그래서 실제 문항 하나를 가입 없이 풀 수 있게 히어로에 박았다.
 *
 * 해설 텍스트는 실제 제품이 내보내는 것과 같은 구조:
 *   왜 그 선택지에 끌렸는지 → 무엇을 헷갈린 건지 → 다음에 안 틀릴 후크
 */

type Choice = {
  label: string;
  text: string;
  /** 이 선택지를 고른 사람에게만 나가는 해설 */
  feedback: string;
  hook?: string;
};

const QUESTION = {
  cert: "토목기사",
  subject: "응용역학",
  year: 2024,
  round: 1,
  number: 7,
  stem: "단순보 중앙에 집중하중 P가 작용할 때 최대 처짐 위치는?",
  correctIdx: 2,
};

const CHOICES: Choice[] = [
  {
    label: "①",
    text: "지점 A",
    feedback:
      "지점은 처짐이 0인 자리예요. 단순보의 양 끝은 지지되어 있어 수직 변위가 생길 수 없습니다. 하중이 놓인 곳과 가장 많이 처지는 곳을 바꿔 생각하신 경우입니다.",
    hook: "지점 = 0, 중앙 = 최대",
  },
  {
    label: "②",
    text: "지점 B",
    feedback:
      "하중이 한쪽으로 치우쳤다고 보고 반대편이 더 처진다고 판단하신 것 같아요. 이 문제는 하중이 '중앙'에 있어 좌우 대칭입니다. 대칭 하중이면 최대 처짐도 대칭축 위에 옵니다.",
    hook: "대칭 하중 → 대칭축에서 최대",
  },
  {
    label: "③",
    text: "보의 중앙",
    feedback:
      "맞았습니다. 중앙 집중하중의 최대 처짐은 δ = PL³/48EI 이고 위치는 정확히 L/2 입니다. 다음엔 하중이 중앙에서 벗어났을 때로 한 단계 올려 물어볼게요.",
  },
  {
    label: "④",
    text: "지점 A에서 L/3 떨어진 곳",
    feedback:
      "L/3 은 3점 재하나 등분포하중 문제에서 자주 나오는 숫자라 반사적으로 고르기 쉽습니다. 이 문제의 하중 조건에서는 나올 수 없는 위치예요.",
    hook: "숫자가 익숙하다고 조건까지 같진 않다",
  },
];

export function HeroDemo() {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const isCorrect = picked === QUESTION.correctIdx;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_20px_50px_-32px_rgb(var(--text-high)/0.4)]">
      {/* 상단 바 */}
      <div className="flex items-center justify-between border-b border-border-soft bg-surface-mute/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-high">
            {QUESTION.cert}
          </span>
          <span className="text-2xs text-text-muted">· {QUESTION.subject}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-2xs font-semibold tabular-nums text-text-mid">
          <Timer className="h-3 w-3" strokeWidth={2} />
          {QUESTION.year}년 {QUESTION.round}회
        </span>
      </div>

      <div className="p-4">
        <p className="text-2xs font-semibold tabular-nums text-text-muted">
          Q.{String(QUESTION.number).padStart(2, "0")}
        </p>
        <p className="mt-2 text-sm font-semibold leading-[1.55] text-text-high">
          {QUESTION.stem}
        </p>

        <ul className="mt-4 space-y-1.5">
          {CHOICES.map((c, i) => {
            const isPicked = picked === i;
            const isAnswer = i === QUESTION.correctIdx;
            const showRight = answered && isAnswer;
            const showWrong = answered && isPicked && !isAnswer;

            return (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => setPicked(i)}
                  aria-pressed={isPicked}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-xs transition-colors",
                    !answered &&
                      "border-border-soft text-text-mid hover:border-primary/50 hover:bg-primary/[0.04]",
                    showRight && "border-accent/50 bg-accent/[0.08] text-text-high",
                    showWrong && "border-danger/50 bg-danger/[0.07] text-danger",
                    answered &&
                      !showRight &&
                      !showWrong &&
                      "border-border-soft text-text-muted",
                  )}
                >
                  <span className="font-bold">{c.label}</span>
                  <span className="flex-1 break-keep">{c.text}</span>
                  {showWrong && (
                    <span className="shrink-0 text-3xs font-bold">내 선택</span>
                  )}
                  {showRight && (
                    <CheckCircle
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* 선택 전 안내 */}
        {!answered && (
          <p className="mt-4 text-center text-2xs text-text-muted">
            아무거나 눌러보세요. 고른 선택지에 맞춰 해설이 나옵니다.
          </p>
        )}

        {/* 선택지별 해설 */}
        {answered && (
          <div
            aria-live="polite"
            className={cn(
              "mt-4 animate-fade-in rounded-md border p-3",
              isCorrect
                ? "border-accent/30 bg-accent/[0.05]"
                : "border-primary/30 bg-primary/[0.04]",
            )}
          >
            <span
              className={cn(
                "text-3xs font-bold uppercase tracking-[0.1em]",
                isCorrect ? "text-accent" : "text-primary",
              )}
            >
              {isCorrect
                ? "정답 해설"
                : `${CHOICES[picked].label} 를 고른 사람에게 나가는 해설`}
            </span>
            <p className="mt-2 text-2xs leading-[1.65] text-text-mid">
              {CHOICES[picked].feedback}
            </p>
            {CHOICES[picked].hook && (
              <p className="mt-2.5 border-t border-border-soft pt-2.5 text-2xs font-semibold text-text-high">
                외울 후크 · {CHOICES[picked].hook}
              </p>
            )}

            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-3 inline-flex items-center gap-1 text-2xs font-semibold text-text-mid transition-colors hover:text-text-high"
            >
              <Refresh className="h-3 w-3" strokeWidth={2.5} />
              다른 선택지도 눌러보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
