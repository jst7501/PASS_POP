"use client";

import { useState } from "react";
import { CheckCircle, Refresh } from "iconoir-react";
import { cn } from "@/lib/utils";

/**
 * 히어로 인터랙티브 데모.
 *
 * 구조: 해설이 들어가는 자리는 하나뿐이고, 그 자리가 다시 쓰인다.
 *   처음   — 다른 CBT 가 주는 해설("정답은 ②번입니다")이 그 자리에 있다
 *   누르면 — 같은 자리가 내가 고른 번호용 해설로 덮어써진다
 * 아래에 패널을 더 붙이면 "기능이 하나 더 있네" 로 읽히지만,
 * 같은 자리를 덮어쓰면 "이게 저걸 대체하는구나" 로 읽힌다.
 *
 * 왜 한국사인가:
 *   전공 문항(예: 단순보 처짐)은 해당 전공자가 아니면 해설이 좋은지 나쁜지
 *   판단조차 못 한다. 데모가 작동하려면 누구나 읽고 바로 납득해야 한다.
 *
 * 오답 해설은 선택지마다 "왜 거기 끌렸는지" 가 서로 달라야 의미가 있다.
 * 네 개가 같은 이유로 틀리는 문항은 이 데모에 쓰지 말 것.
 */

type Choice = {
  label: string;
  text: string;
  /** 이 선택지를 고른 사람에게만 나가는 해설 */
  feedback: string;
  hook?: string;
};

const QUESTION = {
  cert: "한국사능력검정시험",
  level: "심화",
  topic: "고대 · 신라",
  stem: "이차돈의 순교로 불교를 공인하고, 율령을 반포한 신라의 왕은?",
  correctIdx: 1,
};

const CHOICES: Choice[] = [
  {
    label: "①",
    text: "지증왕",
    feedback:
      "바로 앞 왕이라 업적이 자주 붙어 다녀요. 지증왕이 한 건 '이름 정하기' 예요. 국호를 신라로, 칭호를 왕으로 정하고 우산국을 복속했죠. 나라의 틀을 세우는 일은 그 다음 왕이 합니다.",
    hook: "지증왕은 이름, 법흥왕은 틀",
  },
  {
    label: "②",
    text: "법흥왕",
    feedback:
      "맞았어요. 율령을 반포해 통치 기준을 세우고, 이차돈의 순교를 계기로 불교를 공인했어요. 금관가야를 병합하고 '건원' 연호를 쓴 것도 이 왕입니다.",
  },
  {
    label: "③",
    text: "진흥왕",
    feedback:
      "업적이 화려해서 손이 먼저 가는 왕이에요. 화랑도를 정비하고 한강 유역을 차지해 순수비를 세웠죠. 그런데 그건 전부 법흥왕이 만든 틀 위에서 한 확장이라, 순서가 뒤예요.",
    hook: "법흥왕이 틀, 진흥왕이 확장",
  },
  {
    label: "④",
    text: "무열왕",
    feedback:
      "무열왕(김춘추)은 당과 손잡고 백제를 무너뜨린 왕이라 시대가 한참 뒤예요. 불교 공인은 6세기 초, 무열왕은 7세기 중반. 130년쯤 차이가 납니다.",
    hook: "6세기 초 법흥왕 / 7세기 중반 무열왕",
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
          "p-5 transition-colors md:p-6",
          !answered && "border-b border-border bg-surface-mute",
          answered && isCorrect && "bg-primary text-primary-fg",
          answered && !isCorrect && "bg-text-high text-background",
        )}
      >
        {!answered ? (
          <>
            <p className="text-3xs font-bold uppercase tracking-[0.16em] text-text-muted">
              다른 곳의 해설
            </p>
            <p className="mt-3 text-2xl font-extrabold leading-[1.25] tracking-[-0.03em] text-text-muted md:text-3xl">
              &ldquo;정답은 ②번
              <br />
              입니다.&rdquo;
            </p>
            <p className="mt-4 border-t border-border pt-4 text-xs leading-[1.75] text-text-mid">
              이건 해설이 아니라 답지예요. 내가 왜 그 번호에 끌렸는지는 아무도
              안 짚어주니까, 다음에도 같은 자리에서 걸려요.
            </p>
          </>
        ) : (
          <div key={picked} className="animate-slide-up [animation-fill-mode:both]">
            <p
              className={cn(
                "text-3xs font-bold uppercase tracking-[0.16em]",
                isCorrect ? "text-primary-fg/70" : "text-background/60",
              )}
            >
              {isCorrect
                ? "정답이에요 · 이 사람에게 나가는 해설"
                : `${choice!.label} 를 고른 사람에게 나가는 해설`}
            </p>
            <p className="mt-3 text-sm font-medium leading-[1.8] md:text-base">
              {choice!.feedback}
            </p>
            {choice!.hook && (
              <p
                className={cn(
                  "mt-4 border-t pt-4 text-xs font-bold",
                  isCorrect ? "border-primary-fg/25" : "border-background/25",
                )}
              >
                외울 후크 · {choice!.hook}
              </p>
            )}
            <button
              type="button"
              onClick={() => setPicked(null)}
              className={cn(
                "mt-5 inline-flex items-center gap-1.5 text-2xs font-semibold transition-colors",
                isCorrect
                  ? "text-primary-fg/70 hover:text-primary-fg"
                  : "text-background/60 hover:text-background",
              )}
            >
              <Refresh className="h-3 w-3" strokeWidth={2.5} />
              다른 번호도 눌러보기
            </button>
          </div>
        )}
      </div>

      {/* ── 문항 ─────────────────────────────────────────────── */}
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xs font-semibold text-text-mid">
            {QUESTION.cert}{" "}
            <span className="font-normal text-text-muted">
              · {QUESTION.level}
            </span>
          </p>
          <span className="text-3xs text-text-muted">{QUESTION.topic}</span>
        </div>

        <p className="mt-3 text-base font-bold leading-[1.6] tracking-[-0.01em] text-text-high">
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
                    "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left text-sm font-medium transition-colors",
                    !answered &&
                      "border-border-soft text-text-mid hover:border-primary/60 hover:bg-primary/[0.04]",
                    showRight && "border-primary bg-primary/[0.08] text-text-high",
                    showWrong && "border-danger bg-danger/[0.07] text-danger",
                    answered &&
                      !showRight &&
                      !showWrong &&
                      "border-border-soft text-text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "font-bold",
                      showRight && "text-primary",
                      showWrong && "text-danger",
                      !showRight && !showWrong && "text-text-muted",
                    )}
                  >
                    {c.label}
                  </span>
                  <span className="flex-1 break-keep">{c.text}</span>
                  {showWrong && (
                    <span className="shrink-0 text-3xs font-bold">내 선택</span>
                  )}
                  {showRight && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-3xs font-bold text-primary">
                      {isPicked && "내 선택 · "}정답
                      <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
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
            <strong className="font-bold text-text-high">
              고른 번호에 맞춰 통째로 다시 쓰여요.
            </strong>
          </p>
        )}
      </div>
    </div>
  );
}
