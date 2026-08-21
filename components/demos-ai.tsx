"use client";

import { CheckCircle, Xmark } from "iconoir-react";
import { Screens, StepDots, useAutoSequence } from "@/components/demo-player";
import { cn } from "@/lib/utils";

/**
 * AI 기술 4종 자동 재생 시연.
 *
 * 두 가지 방식을 쓴다:
 *   - 화면 전환(Screens): 시간이 흐르며 "다음 화면" 으로 넘어가는 기능
 *   - 값 변화: 표본이 쌓이며 같은 화면의 숫자·막대가 움직이는 기능
 * 목록에 항목이 쌓이는 방식은 쓰지 않는다 — "기능이 여러 개" 로만 읽힌다.
 *
 * 안의 숫자는 전부 화면 예시다. 사용자 실적이나 모델 성능 지표가 아니다.
 */

function Frame({
  children,
  step,
  count,
  onReplay,
  minH = "min-h-[260px]",
}: {
  children: React.ReactNode;
  step: number;
  count: number;
  onReplay: () => void;
  minH?: string;
}) {
  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-surface",
          minH,
        )}
      >
        {children}
      </div>
      <StepDots count={count} current={step} onReplay={onReplay} className="mt-3.5" />
    </>
  );
}

const PAD = "p-5";

function Head({ left, right }: { left: string; right?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-3xs font-bold uppercase tracking-[0.14em] text-text-muted">
        {left}
      </p>
      {right && (
        <span className="text-2xs font-semibold tabular-nums text-text-mid">
          {right}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. 선택지 단위 해설 생성 — 선택지를 하나씩 돌며 해설을 쓴다
// ─────────────────────────────────────────────────────────────
const A_HOLDS = [1100, 1100, 1100, 1100, 2400];

const A_ROWS = [
  {
    n: "①",
    t: "지증왕",
    why: "바로 앞 왕이라 업적이 붙어 다녀요. 지증왕이 한 건 국호와 왕 칭호를 정한 일입니다.",
  },
  {
    n: "②",
    t: "법흥왕",
    why: "정답이에요. 율령을 반포해 통치 기준을 세우고 이차돈의 순교로 불교를 공인했어요.",
    ok: true,
  },
  {
    n: "③",
    t: "진흥왕",
    why: "업적이 화려해서 손이 먼저 가요. 화랑도와 한강 유역은 법흥왕이 만든 틀 위의 확장입니다.",
  },
  {
    n: "④",
    t: "무열왕",
    why: "시대가 130년쯤 뒤예요. 불교 공인은 6세기 초, 무열왕은 7세기 중반입니다.",
  },
];

export function DemoChoiceExplanations() {
  const { ref, step, replay } = useAutoSequence(A_HOLDS);
  return (
    <div ref={ref}>
      <Frame step={step} count={A_HOLDS.length} onReplay={replay}>
        <Screens
          step={step}
          screens={[
            ...A_ROWS.map((r) => (
              <div key={r.n} className={PAD}>
                <Head left={`${r.n} 번 해설 작성`} right={`${r.n} / ④`} />
                <div
                  className={cn(
                    "mt-3.5 rounded-md border px-3.5 py-3",
                    r.ok
                      ? "border-primary bg-primary/[0.08]"
                      : "border-border bg-surface-mute/60",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold",
                      r.ok ? "text-primary" : "text-text-mid",
                    )}
                  >
                    {r.n} {r.t}
                  </span>
                </div>
                <p className="mt-3.5 text-xs leading-[1.8] text-text-mid">
                  {r.why}
                </p>
              </div>
            )),
            <div key="sum" className={cn(PAD, "bg-text-high text-background")}>
              <p className="text-3xs font-bold uppercase tracking-[0.14em] text-background/60">
                문항 하나가 끝나면
              </p>
              <p className="mt-4 text-3xl font-extrabold tabular-nums leading-none tracking-[-0.04em]">
                해설 4개
              </p>
              <p className="mt-4 text-xs leading-[1.8] text-background/80">
                기출 10,000 문제면{" "}
                <strong className="font-bold">40,000개</strong>가 필요해요.
                강사 한 명이 감당할 분량이 아니라서 이 쪽을 택했습니다.
              </p>
            </div>,
          ]}
        />
      </Frame>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. 지식 상태 추정 — 표본이 쌓이며 같은 화면의 값이 움직인다
// ─────────────────────────────────────────────────────────────
const B_HOLDS = [1300, 1300, 1300, 1400, 2400];

const B_FRAMES = [
  { solved: 3, note: "아직 판단하기 일러요", bars: [52, 50, 51] },
  { solved: 12, note: "차이가 벌어지기 시작해요", bars: [41, 55, 66] },
  { solved: 34, note: "한 단원이 계속 걸려요", bars: [32, 58, 81] },
  { solved: 34, note: "약점 확정", bars: [32, 58, 81] },
  { solved: 34, note: "약점 확정", bars: [32, 58, 81] },
];
const B_NAMES = ["응용역학 · 보의 처짐", "토질역학 · 압밀", "측량학 · 오차론"];

export function DemoKnowledgeState() {
  const { ref, step, replay } = useAutoSequence(B_HOLDS);
  const f = B_FRAMES[Math.min(step, B_FRAMES.length - 1)];
  const locked = step >= 3;

  return (
    <div ref={ref}>
      <Frame step={step} count={B_HOLDS.length} onReplay={replay}>
        <div className={PAD}>
          <Head left="단원별 추정" right={`풀이 ${f.solved}회`} />
          <ul className="mt-4 space-y-3.5">
            {B_NAMES.map((name, i) => {
              const pct = f.bars[i];
              const weak = locked && i === 0;
              return (
                <li key={name}>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "text-xs transition-colors duration-300",
                        weak ? "font-bold text-text-high" : "text-text-mid",
                      )}
                    >
                      {name}
                    </span>
                    <span
                      className={cn(
                        "text-2xs font-bold tabular-nums transition-colors duration-300",
                        weak ? "text-danger" : "text-text-muted",
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                  <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-border">
                    <span
                      className={cn(
                        "block h-full rounded-full transition-[width,background-color] duration-500 ease-out",
                        weak ? "bg-danger" : "bg-primary/50",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-2xs text-text-muted">{f.note}</p>
          {step >= 4 && (
            <div className="mt-3 animate-slide-up rounded-md border border-primary/40 bg-primary/[0.06] px-3.5 py-3 [animation-fill-mode:both]">
              <p className="text-2xs font-bold text-primary">
                다음 세션 구성 · 10문항
              </p>
              <p className="mt-1.5 text-2xs leading-[1.6] text-text-mid">
                보의 처짐 <strong className="text-text-high">6문항</strong> ·
                나머지 단원 4문항. 점수가 아니라 무엇을 모르는지로 골라요.
              </p>
            </div>
          )}
        </div>
      </Frame>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. SM-2 — 시도할 때마다 다음 복습일이 다시 계산된다
// ─────────────────────────────────────────────────────────────
const C_HOLDS = [1200, 1200, 1200, 1300, 2400];

const C_TRIES = [
  { day: "1일차", ok: false, next: "1일 뒤", w: "14%", note: "처음 만났고 틀렸어요. 내일 바로 다시 냅니다." },
  { day: "2일차", ok: true, next: "3일 뒤", w: "43%", note: "맞혔으니 간격을 벌립니다." },
  { day: "5일차", ok: true, next: "7일 뒤", w: "100%", note: "또 맞혔어요. 한 번 더 벌립니다." },
  { day: "12일차", ok: false, next: "1일 뒤", w: "14%", note: "틀렸어요. 간격이 처음으로 돌아갑니다." },
];

export function DemoReviewScheduler() {
  const { ref, step, replay } = useAutoSequence(C_HOLDS);
  return (
    <div ref={ref}>
      <Frame step={step} count={C_HOLDS.length} onReplay={replay}>
        <Screens
          step={step}
          screens={[
            ...C_TRIES.map((t) => (
              <div key={t.day} className={PAD}>
                <Head left="한국사 · 신라 왕 계보" right={t.day} />
                <div className="mt-4 flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      t.ok
                        ? "bg-primary/12 text-primary"
                        : "bg-danger/12 text-danger",
                    )}
                  >
                    {t.ok ? (
                      <CheckCircle className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <Xmark className="h-5 w-5" strokeWidth={2.5} />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-extrabold tracking-[-0.02em]",
                      t.ok ? "text-primary" : "text-danger",
                    )}
                  >
                    {t.ok ? "맞힘" : "틀림"}
                  </span>
                  <span className="ml-auto text-right">
                    <span className="block text-3xs text-text-muted">
                      다음 복습
                    </span>
                    <span
                      className={cn(
                        "block text-sm font-extrabold tabular-nums",
                        t.ok ? "text-primary" : "text-danger",
                      )}
                    >
                      {t.next}
                    </span>
                  </span>
                </div>
                <span className="mt-4 block h-2.5 w-full overflow-hidden rounded-full bg-border/60">
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width] duration-500 ease-out",
                      t.ok ? "bg-primary" : "bg-danger",
                    )}
                    style={{ width: t.w }}
                  />
                </span>
                <p className="mt-3.5 text-2xs leading-[1.7] text-text-mid">
                  {t.note}
                </p>
              </div>
            )),
            <div key="sum" className={cn(PAD, "bg-text-high text-background")}>
              <p className="text-3xs font-bold uppercase tracking-[0.14em] text-background/60">
                SM-2 가 하는 일
              </p>
              <p className="mt-4 text-xl font-extrabold leading-[1.35] tracking-[-0.02em]">
                맞히면 벌어지고
                <br />
                틀리면 처음으로.
              </p>
              <p className="mt-4 text-xs leading-[1.8] text-background/80">
                문항별 난이도 계수와 반복 횟수로 다음 날짜를 계산해요. 잊을 때쯤
                정확히 다시 만나게 하려고요.
              </p>
            </div>,
          ]}
        />
      </Frame>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. 베이지안 합격 예측 — 표본이 쌓이며 구간이 좁아진다
// ─────────────────────────────────────────────────────────────
const D_HOLDS = [1300, 1300, 1300, 1300, 2400];

const D_FRAMES = [
  { solved: 5, pct: 62, band: 21, trust: "낮음" },
  { solved: 18, pct: 65, band: 14, trust: "보통" },
  { solved: 47, pct: 68, band: 9, trust: "보통" },
  { solved: 120, pct: 71, band: 5, trust: "높음" },
  { solved: 120, pct: 71, band: 5, trust: "높음" },
];

export function DemoPassPrediction() {
  const { ref, step, replay } = useAutoSequence(D_HOLDS);
  const f = D_FRAMES[Math.min(step, D_FRAMES.length - 1)];
  const low = Math.max(0, f.pct - f.band);

  return (
    <div ref={ref}>
      <Frame step={step} count={D_HOLDS.length} onReplay={replay}>
        <div className={PAD}>
          <Head left="합격 확률 추정" right={`풀이 ${f.solved}회`} />

          <div className="mt-4 flex items-end gap-3">
            <span className="text-5xl font-extrabold leading-none tabular-nums tracking-[-0.045em] text-primary">
              {f.pct}
              <span className="text-2xl">%</span>
            </span>
            <span className="pb-1.5 text-2xs text-text-mid">
              ±{f.band}%p
              <span
                className={cn(
                  "ml-1.5 rounded-full px-2 py-0.5 text-3xs font-bold transition-colors duration-300",
                  f.trust === "낮음"
                    ? "bg-danger/12 text-danger"
                    : f.trust === "보통"
                      ? "bg-surface-mute text-text-mid"
                      : "bg-primary/12 text-primary",
                )}
              >
                신뢰 {f.trust}
              </span>
            </span>
          </div>

          <div className="relative mt-5 h-2.5 w-full rounded-full bg-border">
            <span
              className="absolute inset-y-0 rounded-full bg-primary/30 transition-all duration-500 ease-out"
              style={{ left: `${low}%`, width: `${f.band * 2}%` }}
            />
            <span
              className="absolute inset-y-[-4px] w-[3px] rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ left: `${f.pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-3xs tabular-nums text-text-muted">
            <span>0%</span>
            <span>100%</span>
          </div>

          {step >= 4 && (
            <p className="mt-4 animate-slide-up border-t border-border-soft pt-3.5 text-2xs leading-[1.7] text-text-mid [animation-fill-mode:both]">
              표본이 적으면 구간을 넓게, 그리고{" "}
              <strong className="text-text-high">적다고 말해요.</strong> 확률만
              크게 띄우면 과신하게 되니까요.
            </p>
          )}
        </div>
      </Frame>
    </div>
  );
}
