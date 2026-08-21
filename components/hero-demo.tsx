"use client";

import { useState } from "react";
import { Refresh } from "iconoir-react";
import { cn } from "@/lib/utils";

/**
 * 히어로 인터랙티브 데모.
 *
 * 구조가 핵심이다: 해설이 들어가는 자리는 하나뿐이고, 그 자리가 다시 쓰인다.
 *   처음   — 다른 CBT 가 주는 해설("정답은 ③번입니다")이 그 자리에 있다
 *   누르면 — 같은 자리가 내가 고른 번호용 해설로 바뀐다
 * 아래에 패널을 하나 더 붙이면 "기능이 하나 더 있네" 로 읽히지만,
 * 같은 자리를 덮어쓰면 "이게 저걸 대체하는구나" 로 읽힌다.
 *
 * 해설 텍스트는 실제 제품이 내보내는 구조와 같다:
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
      "지점은 처짐이 0인 자리예요. 단순보의 양 끝은 지지되어 있어서 수직으로 내려앉을 수가 없어요. 하중이 놓인 곳과 가장 많이 처지는 곳을 바꿔 생각하신 거예요.",
    hook: "지점 = 0, 중앙 = 최대",
  },
  {
    label: "②",
    text: "지점 B",
    feedback:
      "하중이 한쪽으로 치우쳤다고 보고 반대편이 더 처진다고 판단하신 것 같아요. 이 문제는 하중이 '중앙'에 있어서 좌우가 대칭이에요. 대칭이면 최대 처짐도 대칭축 위에 옵니다.",
    hook: "대칭 하중이면 대칭축에서 최대",
  },
  {
    label: "③",
    text: "보의 중앙",
    feedback:
      "맞았어요. 중앙 집중하중의 최대 처짐은 δ = PL³/48EI, 위치는 정확히 L/2 예요. 다음엔 하중이 중앙에서 벗어났을 때로 한 단계 올려서 물어볼게요.",
  },
  {
    label: "④",
    text: "지점 A에서 L/3 떨어진 곳",
    feedback:
      "L/3 은 3점 재하나 등분포하중 문제에서 자주 나오는 숫자라 손이 먼저 가요. 이 문제의 하중 조건에서는 나올 수 없는 위치예요.",
    hook: "익숙한 숫자라고 조건까지 같진 않다",
  },
];

export function HeroDemo() {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const choice = answered ? CHOICES[picked] : null;
  const isCorrect = picked === QUESTION.correctIdx;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_20px_50px_-32px_rgb(var(--text-high)/0.4)]">
      {/* ── 해설 자리 — 누르기 전과 후가 같은 칸을 쓴다 ────────── */}
      <div
        aria-live="polite"
        className={cn(
          "border-b p-5 transition-colors",
          answered
            ? "border-border-soft bg-primary/[0.05]"
            : "border-border-soft bg-surface-mute/60",
        )}
      >
        {!answered ? (
          <>
            <p className="text-3xs font-bold uppercase tracking-[0.14em] text-text-muted">
              다른 곳의 해설
            </p>
            <p className="mt-3 text-xl font-extrabold leading-[1.3] tracking-[-0.02em] text-text-muted">
              &ldquo;정답은 ③번입니다.&rdquo;
            </p>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-[1.7] text-text-mid">
              이건 해설이 아니라 답지예요. 내가 왜 그 번호에 끌렸는지는 아무도
              안 짚어주니까, 다음에도 같은 자리에서 걸려요.
            </p>
          </>
        ) : (
          <div key={picked} className="animate-slide-up [animation-fill-mode:both]">
            <p
              className={cn(
                "text-3xs font-bold uppercase tracking-[0.14em]",
                isCorrect ? "text-accent" : "text-primary",
              )}
            >
              {isCorrect
                ? "정답을 고른 사람에게"
                : `${choice!.label} 를 고른 사람에게`}
            </p>
            <p className="mt-3 text-sm leading-[1.75] text-text-high">
              {choice!.feedback}
            </p>
            {choice!.hook && (
              <p className="mt-3 border-t border-primary/20 pt-3 text-xs font-bold text-primary">
                외울 후크 · {choice!.hook}
              </p>
            )}
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-4 inline-flex items-center gap-1.5 text-2xs font-semibold text-text-mid transition-colors hover:text-text-high"
            >
              <Refresh className="h-3 w-3" strokeWidth={2.5} />
              다른 번호도 눌러보기
            </button>
          </div>
        )}
      </div>

      {/* ── 문항 ─────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xs tabular-nums text-text-muted">
            Q.{String(QUESTION.number).padStart(2, "0")} · {QUESTION.cert} ·{" "}
            {QUESTION.year}-{QUESTION.round}
          </p>
          <span className="text-3xs font-bold tracking-[-0.02em] text-text-muted">
            {QUESTION.subject}
          </span>
        </div>

        <p className="mt-3 text-sm font-semibold leading-[1.6] text-text-high">
          {QUESTION.stem}
        </p>

        <ul className="mt-4 space-y-1.5">
          {CHOICES.map((c, i) => {
            const isPicked = picked === i;
            return (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => setPicked(i)}
                  aria-pressed={isPicked}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-xs transition-colors",
                    isPicked
                      ? "border-primary bg-primary/[0.06] text-text-high"
                      : "border-border-soft text-text-mid hover:border-primary/50 hover:bg-primary/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "font-bold",
                      isPicked ? "text-primary" : "text-text-muted",
                    )}
                  >
                    {c.label}
                  </span>
                  <span className="flex-1 break-keep">{c.text}</span>
                  {isPicked && (
                    <span className="shrink-0 text-3xs font-bold text-primary">
                      내 선택
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {!answered && (
          <p className="mt-4 text-2xs leading-[1.7] text-text-muted">
            하나 눌러보세요. 위 문장이{" "}
            <strong className="font-bold text-text-mid">
              고른 번호에 맞춰 다시 쓰여요.
            </strong>{" "}
            그게 이 제품이 하는 일 전부예요.
          </p>
        )}
      </div>
    </div>
  );
}
