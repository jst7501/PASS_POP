"use client";

import { useState } from "react";
import { CheckCircle, XmarkCircle, NavArrowRight } from "iconoir-react";
import type { DpPremium, DpStatus, DpDiagnosis } from "@/lib/content/3dp";
import { cn } from "@/lib/utils";

// Soft Callout — 테두리 없는 파스텔 블록 (앱 토큰)
const TONE: Record<DpStatus, { label: string; bg: string; chip: string }> = {
  correct: { label: "정답", bg: "bg-accent/[0.08]", chip: "bg-accent/20 text-accent" },
  common_trap: {
    label: "자주 틀리는 함정",
    bg: "bg-danger/[0.07]",
    chip: "bg-danger/20 text-danger",
  },
  weak_trap: {
    label: "아쉬운 오답",
    bg: "bg-warning/[0.12]",
    chip: "bg-warning/25 text-warning",
  },
  trap: { label: "오답", bg: "bg-surface-mute", chip: "bg-surface-elev text-text-mid" },
  dummy: {
    label: "매력 없는 오답",
    bg: "bg-surface-mute",
    chip: "bg-surface-elev text-text-muted",
  },
};

// 포인트 라벨 알약 색 — '갈림길'(결정타)이 가장 눈에 띄게
function pointTone(k: string): string {
  if (k.includes("갈림길")) return "bg-danger/15 text-danger";
  if (k.includes("정답")) return "bg-accent/20 text-accent";
  if (k.includes("개념")) return "bg-primary/[0.12] text-primary";
  return "bg-surface-mute text-text-mid";
}

export function PremiumExplanation({
  premium,
  userAnswer,
  correctAnswer,
}: {
  premium: DpPremium;
  userAnswer: string;
  correctAnswer: string;
}) {
  const correct = userAnswer !== "" && userAnswer === correctAnswer;
  const [showOthers, setShowOthers] = useState(false);

  const picked =
    premium.diagnoses.find((d) => String(d.n) === userAnswer) ??
    premium.diagnoses.find((d) => d.status === "correct") ??
    null;
  const others = premium.diagnoses.filter((d) => String(d.n) !== userAnswer);

  return (
    <div className="mt-6 space-y-4">
      {/* 결과 줄 */}
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-text-mid">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
            correct ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger",
          )}
        >
          {correct ? (
            <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <XmarkCircle className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {correct ? "정답" : "오답"}
        </span>
        <span>
          내 답{" "}
          <strong className="text-text-high">{userAnswer || "—"}번</strong>
          {!correct && (
            <>
              {" "}
              · 정답 <strong className="text-accent">{correctAnswer}번</strong>
            </>
          )}
        </span>
      </div>

      {/* 한 줄 요약 (TL;DR) */}
      <div className="rounded-2xl bg-accent/[0.08] px-[18px] py-4 text-[15px] font-semibold leading-[1.6] text-text-high">
        {premium.answerSummary}
      </div>

      {/* 내가 고른 보기 진단 */}
      {picked && (
        <div className={cn("rounded-2xl px-[18px] py-4", TONE[picked.status].bg)}>
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                TONE[picked.status].chip,
              )}
            >
              {picked.n}
            </span>
            <span className="text-[14.5px] font-bold leading-[1.5] text-text-high">
              {picked.headline}
            </span>
          </div>
          <div className="mt-3.5 space-y-3">
            {picked.points.map((p, i) => (
              <div
                key={i}
                className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3"
              >
                <span
                  className={cn(
                    "inline-flex h-fit w-fit shrink-0 rounded-full px-3 py-0.5 text-[11.5px] font-bold",
                    pointTone(p.k),
                  )}
                >
                  {p.k}
                </span>
                <span className="text-[14px] leading-[1.72] text-text-mid">
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 핵심 개념 */}
      <div className="rounded-2xl bg-surface-mute px-[18px] py-4">
        <SectionLabel>핵심 개념</SectionLabel>
        <p className="mt-2 text-[14.5px] font-bold leading-[1.5] text-text-high">
          {premium.theory.title}
        </p>
        <p className="mt-2 text-[14px] leading-[1.8] text-text-mid">
          {premium.theory.body}
        </p>
        {premium.theory.terms.length > 0 && (
          <div className="mt-3.5 space-y-2">
            {premium.theory.terms.map((term, i) => (
              <div
                key={i}
                className="rounded-xl bg-surface px-3.5 py-2.5 text-[13px] leading-[1.55] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <span className="font-bold text-primary">{term.term}</span>
                <span className="text-text-mid"> — {term.def}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 출제자 함정 */}
      <div className="rounded-2xl bg-danger/[0.06] px-[18px] py-4">
        <SectionLabel className="text-danger/80">출제자가 숨긴 함정</SectionLabel>
        <p className="mt-2 text-[14px] leading-[1.75] text-text-mid">
          {premium.trapDesign}
        </p>
      </div>

      {/* 이렇게 풀어요 */}
      <div className="rounded-2xl bg-primary/[0.06] px-[18px] py-4">
        <SectionLabel className="text-primary/80">
          {premium.metaStrategy.title}
        </SectionLabel>
        <p className="mt-2 text-[14px] leading-[1.75] text-text-mid">
          {premium.metaStrategy.text}
        </p>
      </div>

      {/* 암기 후크 */}
      <div className="rounded-2xl bg-warning/[0.13] px-[18px] py-4">
        <span className="inline-block rounded-full bg-warning/25 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-warning">
          암기 후크
        </span>
        <p className="mt-2.5 text-[15.5px] font-bold leading-[1.5] text-text-high">
          {premium.hook}
        </p>
      </div>

      {/* 다른 보기 해설 (토글) */}
      {others.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            aria-expanded={showOthers}
            className="inline-flex items-center gap-1 rounded-md text-[12.5px] font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            {showOthers ? "다른 보기 해설 접기" : "다른 보기는 왜 아닐까? 펼치기"}
            <NavArrowRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                showOthers ? "rotate-90" : "rotate-0",
              )}
              strokeWidth={2.5}
            />
          </button>
          {showOthers && (
            <div className="mt-2.5 space-y-2.5">
              {others.map((d) => (
                <CompactDiagnosis key={d.n} d={d} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 태그 */}
      {premium.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {premium.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-mute px-3 py-1 text-[11px] text-text-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-extrabold uppercase tracking-wider text-text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

function CompactDiagnosis({ d }: { d: DpDiagnosis }) {
  const t = TONE[d.status];
  return (
    <div className={cn("rounded-xl px-4 py-3", t.bg)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
            t.chip,
          )}
        >
          {d.n}
        </span>
        <span className="text-[13px] font-bold leading-[1.45] text-text-high">
          {d.headline}
        </span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {d.points.map((p, i) => (
          <li key={i} className="text-[12.5px] leading-[1.65] text-text-mid">
            <span className="font-semibold text-text-mid">{p.k}.</span> {p.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
