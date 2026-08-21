"use client";

import { useAutoSequence } from "@/components/demo-player";
import { Expand, Line } from "@/components/mockups-live";
import { cn } from "@/lib/utils";

/**
 * 기능 카드 목업 (2) — mockups-live.tsx 와 같은 원칙.
 * 화면을 갈아끼우지 않고 한 자리에서 값이 차오르고 칸이 채워진다.
 * 안의 값은 전부 화면 예시다. 사용자 실적 지표가 아니다.
 */

const CARD = "rounded-md border border-border bg-surface px-3 py-2.5 shadow-sm";

// ── 망각곡선 복습 — 날짜 칸이 하나씩 채워진다 ────────────────
const RV_HOLDS = [700, 700, 700, 700, 2400];
const RV_DAYS = [
  { d: "오늘", n: 12 },
  { d: "내일", n: 5 },
  { d: "3일 뒤", n: 8 },
  { d: "7일 뒤", n: 4 },
];

export function LiveReviewSchedule() {
  const { ref, step } = useAutoSequence(RV_HOLDS);
  const total = RV_DAYS.slice(0, step).reduce((a, b) => a + b.n, 0);
  return (
    <div ref={ref} className="w-full max-w-[300px]">
      <div className={CARD}>
        <div className="flex items-center justify-between">
          <span className="text-3xs font-bold text-text-high">복습 예약</span>
          <span className="text-4xs tabular-nums text-text-muted">
            총 {total}문항
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {RV_DAYS.map((r, i) => {
            const on = step >= i + 1;
            return (
              <li key={r.d}>
                <Line show={on}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-11 shrink-0 text-4xs",
                        i === 0 ? "font-bold text-primary" : "text-text-muted",
                      )}
                    >
                      {r.d}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
                      <span
                        className={cn(
                          "block h-full rounded-full transition-[width] duration-500 ease-out",
                          i === 0 ? "bg-primary" : "bg-primary/40",
                        )}
                        style={{ width: on ? r.n * 8 + "%" : "0%" }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-4xs tabular-nums text-text-mid">
                      {r.n}
                    </span>
                  </span>
                </Line>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── 합격 예측 — 확률이 오르고 구간이 좁아진다 ────────────────
const PP_HOLDS = [900, 900, 900, 2600];
const PP = [
  { s: 5, p: 62, b: 21, t: "낮음" },
  { s: 18, p: 65, b: 14, t: "보통" },
  { s: 47, p: 68, b: 9, t: "보통" },
  { s: 120, p: 71, b: 5, t: "높음" },
];

export function LivePassPrediction() {
  const { ref, step } = useAutoSequence(PP_HOLDS);
  const f = PP[Math.min(step, PP.length - 1)];
  return (
    <div ref={ref} className="w-full max-w-[300px]">
      <div className={CARD}>
        <div className="flex items-baseline justify-between">
          <span className="text-3xs font-bold text-text-high">합격 예측</span>
          <span className="text-4xs tabular-nums text-text-muted">
            풀이 {f.s}회
          </span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-extrabold leading-none tabular-nums tracking-[-0.04em] text-primary">
            {f.p}
            <span className="text-base">%</span>
          </span>
          <span className="pb-1 text-4xs text-text-mid">
            ±{f.b}%p
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-4xs font-bold transition-colors duration-300",
                f.t === "낮음"
                  ? "bg-danger/12 text-danger"
                  : f.t === "보통"
                    ? "bg-surface-mute text-text-mid"
                    : "bg-primary/12 text-primary",
              )}
            >
              신뢰 {f.t}
            </span>
          </span>
        </div>
        <div className="relative mt-3 h-2 w-full rounded-full bg-border">
          <span
            className="absolute inset-y-0 rounded-full bg-primary/30 transition-all duration-500 ease-out"
            style={{
              left: Math.max(0, f.p - f.b) + "%",
              width: f.b * 2 + "%",
            }}
          />
          <span
            className="absolute inset-y-[-3px] w-[2px] rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ left: f.p + "%" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── 오답노트 — 틀린 문제가 노트로 들어온다 ───────────────────
const MS_HOLDS = [800, 800, 800, 2400];
const MS_ITEMS = [
  { s: "응용역학", t: "보의 처짐 위치" },
  { s: "열역학", t: "등엔트로피 관계식" },
  { s: "측량학", t: "오차 전파" },
];

export function LiveMistakes() {
  const { ref, step } = useAutoSequence(MS_HOLDS);
  return (
    <div ref={ref} className="w-full max-w-[300px]">
      <div className={CARD}>
        <div className="flex items-center justify-between">
          <span className="text-3xs font-bold text-text-high">오답 노트</span>
          <span className="text-4xs font-bold tabular-nums text-primary">
            {step > 0 ? "+" + Math.min(step, 3) : ""}
          </span>
        </div>
        <ul className="mt-2 space-y-1">
          {MS_ITEMS.map((m, i) => (
            <li key={m.t}>
              <Line show={step >= i + 1}>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-3xs transition-colors duration-300",
                    step === i + 1
                      ? "bg-primary/[0.08] text-text-high"
                      : "text-text-mid",
                  )}
                >
                  <span className="text-4xs font-bold text-primary">{m.s}</span>
                  <span className="truncate">{m.t}</span>
                  <span className="ml-auto shrink-0 text-4xs text-text-muted">
                    {step === i + 1 ? "방금" : "저장됨"}
                  </span>
                </span>
              </Line>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── 실전 CBT — 타이머가 흐르고 진행도가 찬다 ─────────────────
const CB_HOLDS = [800, 800, 800, 800, 2400];
const CB_TIME = ["59:12", "44:05", "28:31", "12:47", "03:20"];
const CB_PCT = [8, 27, 52, 78, 96];
const CB_SOLVED = [3, 11, 21, 31, 38];

export function LiveCbtMock() {
  const { ref, step } = useAutoSequence(CB_HOLDS);
  const i = Math.min(step, 4);
  return (
    <div ref={ref} className="w-full max-w-[300px]">
      <div className={CARD}>
        <div className="flex items-center justify-between">
          <span className="text-3xs font-bold text-text-high">실전 CBT</span>
          <span
            className={cn(
              "rounded-sm px-1.5 py-0.5 text-4xs font-bold tabular-nums transition-colors duration-300",
              step >= 4
                ? "bg-danger/12 text-danger"
                : "bg-surface-mute text-text-mid",
            )}
          >
            {CB_TIME[i]}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-4xs text-text-muted">
          <span className="tabular-nums">{CB_SOLVED[i]} / 40 문항</span>
          <span className="tabular-nums">{CB_PCT[i]}%</span>
        </div>
        <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-border">
          <span
            className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: CB_PCT[i] + "%" }}
          />
        </span>
        <div className="mt-2.5 grid grid-cols-4 gap-1">
          {["응용역학", "측량학", "수리수문", "토질역학"].map((s, j) => (
            <span
              key={s}
              className={cn(
                "rounded-sm px-1 py-1 text-center text-4xs transition-colors duration-300",
                step > j
                  ? "bg-primary/10 font-bold text-primary"
                  : "bg-surface-mute text-text-muted",
              )}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 단권화 노트 — 흩어진 항목이 한 장으로 모인다 ─────────────
const CN_HOLDS = [800, 800, 800, 2600];
const CN_ROWS = [
  "보의 처짐 — 지점 0, 중앙 최대",
  "등엔트로피 — PV^k = const",
  "오차 전파 — 제곱합의 제곱근",
];

export function LiveConsolidatedNote() {
  const { ref, step } = useAutoSequence(CN_HOLDS);
  return (
    <div ref={ref} className="w-full max-w-[300px]">
      <div className={CARD}>
        <div className="flex items-center justify-between">
          <span className="text-3xs font-bold text-text-high">단권화 노트</span>
          <span className="text-4xs text-text-muted">시험 전날용 1장</span>
        </div>
        <ul className="mt-2 space-y-1">
          {CN_ROWS.map((r, i) => (
            <li key={r}>
              <Line show={step >= i + 1}>
                <span className="flex items-start gap-1.5 text-3xs leading-[1.6] text-text-mid">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {r}
                </span>
              </Line>
            </li>
          ))}
        </ul>
        <Expand open={step >= 3}>
          <span className="mt-2 block rounded-sm bg-primary/[0.06] px-2 py-1.5 text-center text-4xs font-bold text-primary">
            PDF 로 내보내기 준비됨
          </span>
        </Expand>
      </div>
    </div>
  );
}

// ── 과락 위험 — 막대가 차오르고 위험 과목이 붉어진다 ─────────
const FR_HOLDS = [800, 800, 800, 900, 2600];
const FR_SUBJ = [
  { s: "응용역학", p: 72 },
  { s: "측량학", p: 34, risk: true },
  { s: "토질역학", p: 61 },
];

export function LiveFailRisk() {
  const { ref, step } = useAutoSequence(FR_HOLDS);
  return (
    <div ref={ref} className="w-full max-w-[300px]">
      <div className={CARD}>
        <span className="text-3xs font-bold text-text-high">
          과락 위험 진단
        </span>
        <ul className="mt-2 space-y-2">
          {FR_SUBJ.map((r, i) => {
            const on = step >= i + 1;
            const flag = on && r.risk && step >= 3;
            return (
              <li key={r.s}>
                <div className="flex items-center justify-between text-4xs">
                  <span
                    className={cn(
                      flag ? "font-bold text-danger" : "text-text-mid",
                    )}
                  >
                    {r.s}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums",
                      flag ? "font-bold text-danger" : "text-text-muted",
                    )}
                  >
                    {r.p}%
                  </span>
                </div>
                <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width,background-color] duration-500 ease-out",
                      flag ? "bg-danger" : "bg-primary/50",
                    )}
                    style={{ width: on ? r.p + "%" : "0%" }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
        <Expand open={step >= 4}>
          <span className="mt-2 block rounded-sm border border-danger/40 bg-danger/[0.06] px-2 py-1.5 text-4xs font-bold text-danger">
            측량학 과락 위험 — 이 과목만 20문항 처방
          </span>
        </Expand>
      </div>
    </div>
  );
}
