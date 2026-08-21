"use client";

import {
  CheckCircle,
  NavArrowDown,
  OpenBook,
  Sparks,
  WarningTriangle,
} from "iconoir-react";
import { useAutoSequence } from "@/components/demo-player";
import { cn } from "@/lib/utils";

/**
 * 기능 카드 안에서 스스로 진행되는 목업.
 *
 * 화면을 갈아끼우지 않는다. 한 화면 안에서 상태가 바뀌고 빈칸이 채워진다 —
 * 선지가 눌리고, 채점되고, 해설이 써지고, 개념이 펼쳐지는 식으로.
 * 장면 전환은 "다음 기능" 처럼 읽히지만, 같은 자리에서 채워지면
 * "지금 이게 돌아가고 있다" 로 읽힌다.
 *
 * 안의 값은 전부 화면 예시다. 사용자 실적 지표가 아니다.
 */

/** 글이 써지는 동안 깜빡이는 커서 */
export function Caret({ on }: { on: boolean }) {
  return on ? (
    <span className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[2px] animate-pulse bg-primary align-baseline" />
  ) : null;
}

/** 한 줄씩 차오르는 글 */
export function Line({
  show,
  children,
  className,
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none",
        show ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 높이를 모르는 영역을 부드럽게 펼친다 */
export function Expand({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 오답 기준 해설 — 고르고, 채점되고, 해설이 써진다
// ─────────────────────────────────────────────────────────────
const AI_HOLDS = [900, 700, 900, 900, 900, 2400];

const AI_CHOICES = [
  { l: "①", t: "지점 A" },
  { l: "②", t: "지점 B" },
  { l: "③", t: "보의 중앙" },
  { l: "④", t: "L/3 떨어진 곳" },
];

export function LiveAiExplanation() {
  const { ref, step } = useAutoSequence(AI_HOLDS);
  const hovering = step === 1;
  const picked = step >= 2;
  const graded = step >= 3;

  return (
    <div ref={ref} className="w-full max-w-[300px] space-y-2">
      <div className="rounded-md border border-border bg-surface px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-4xs font-bold uppercase tracking-wider text-primary">
            기사
          </span>
          <span className="text-3xs font-bold text-text-mid">Q.07</span>
          <span className="text-4xs text-text-muted">응용역학</span>
        </div>

        <div className="mt-1.5 space-y-1">
          {AI_CHOICES.map((c, i) => {
            const isMine = i === 1;
            const isAnswer = i === 2;
            return (
              <div
                key={c.l}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-3xs transition-all duration-300",
                  // 고르는 중 — 손가락이 올라간 것처럼
                  isMine &&
                    hovering &&
                    "bg-primary/[0.07] ring-1 ring-primary/40",
                  isMine && picked && !graded && "bg-primary/10 text-text-high",
                  isMine && graded && "bg-danger/10 text-text-high",
                  isAnswer && graded && "bg-primary/10 text-text-high",
                  !((isMine && (hovering || picked)) || (isAnswer && graded)) &&
                    "text-text-mid",
                )}
              >
                <span
                  className={cn(
                    "font-bold transition-colors duration-300",
                    isMine && graded && "text-danger",
                    isAnswer && graded && "text-primary",
                    !graded && "text-text-muted",
                  )}
                >
                  {c.l}
                </span>
                <span>{c.t}</span>
                {isMine && graded && (
                  <span className="ml-auto text-4xs font-semibold text-danger">
                    내 선택
                  </span>
                )}
                {isAnswer && graded && (
                  <CheckCircle
                    className="ml-auto h-2.5 w-2.5 text-primary"
                    strokeWidth={2.5}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 해설이 열리고, 글이 한 줄씩 써진다 */}
      <Expand open={step >= 4}>
        <div className="rounded-md border border-primary/40 bg-primary/[0.05] px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Sparks className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
            <span className="text-4xs font-bold uppercase tracking-[0.1em] text-primary">
              프리미엄 해설
            </span>
          </div>
          <Line
            show={step >= 4}
            className="mt-1.5 text-3xs leading-[1.7] text-text-mid"
          >
            <strong className="font-bold text-text-high">② 찍으셨네요.</strong>{" "}
            지점은 처짐이 0인 자리예요.
            <Caret on={step === 4} />
          </Line>
          <Line
            show={step >= 5}
            className="mt-1.5 border-t border-primary/20 pt-1.5 text-3xs font-bold text-primary"
          >
            외울 후크 · 지점 = 0, 중앙 = 최대
          </Line>
        </div>
      </Expand>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 개념 카드 — 버튼이 눌리고 개념이 펼쳐진다
// ─────────────────────────────────────────────────────────────
const CC_HOLDS = [1100, 600, 900, 900, 2400];

export function LiveConceptCard() {
  const { ref, step } = useAutoSequence(CC_HOLDS);
  const pressing = step === 1;
  const open = step >= 2;

  return (
    <div ref={ref} className="w-full max-w-[300px] space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2.5 shadow-sm">
        <span className="text-3xs font-bold text-text-high">
          <span className="text-text-mid">Q.07</span> 단순보 최대 처짐 위치는?
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-1 text-4xs font-bold transition-all duration-200",
            pressing
              ? "scale-95 bg-primary text-primary-fg"
              : "bg-primary/10 text-primary",
          )}
        >
          개념 펼치기
          <NavArrowDown
            className={cn(
              "h-2 w-2 transition-transform duration-300",
              open && "rotate-180",
            )}
            strokeWidth={3}
          />
        </span>
      </div>

      <Expand open={open}>
        <div className="rounded-md border border-primary/40 bg-primary/[0.05] px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <OpenBook className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
            <span className="text-4xs font-bold uppercase tracking-[0.1em] text-primary">
              개념 · 단순보 처짐
            </span>
          </div>
          <Line
            show={open}
            className="mt-1.5 text-3xs leading-[1.65] text-text-mid"
          >
            중앙 집중하중이면{" "}
            <strong className="font-bold text-text-high">
              최대 처짐은 보의 중앙
            </strong>
            에서 발생.
          </Line>
          <Line show={step >= 3} className="mt-2">
            <span className="block rounded-sm bg-surface px-2 py-1.5 text-center text-3xs font-bold text-text-high">
              δ<sub className="text-4xs">max</sub> = PL³ / 48EI
            </span>
          </Line>
          <Line
            show={step >= 4}
            className="mt-1.5 flex items-start gap-1 text-4xs leading-[1.6] text-warning"
          >
            <WarningTriangle
              className="mt-[1px] h-2 w-2 shrink-0"
              strokeWidth={2.5}
            />
            <span>함정: 등분포하중이면 5wL⁴ / 384EI — 공식이 다름</span>
          </Line>
        </div>
      </Expand>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 단계별 풀이 — 한 줄씩 계산되어 채워진다
// ─────────────────────────────────────────────────────────────
const ST_HOLDS = [800, 800, 800, 900, 2400];

const ST_STEPS = [
  { n: "①", t: "반력 산정", r: "R_A = P/2" },
  { n: "②", t: "처짐 공식 적용", r: "δ = PL³/48EI" },
  { n: "③", t: "값 대입", r: "δ = 12.5mm" },
];

export function LiveStepSolution() {
  const { ref, step } = useAutoSequence(ST_HOLDS);

  return (
    <div ref={ref} className="w-full max-w-[300px]">
      <div className="rounded-md border border-border bg-surface px-3 py-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-3xs font-bold text-text-high">
            풀이 · 단계별
          </span>
          <span className="text-4xs text-text-muted">건너뛴 단계 0</span>
        </div>

        <ul className="mt-2 space-y-1.5">
          {ST_STEPS.map((s, i) => {
            const on = step >= i + 1;
            return (
              <li key={s.n}>
                <Line show={on}>
                  <span className="flex items-center gap-1.5 text-3xs">
                    <span
                      className={cn(
                        "font-bold",
                        on ? "text-primary" : "text-text-muted",
                      )}
                    >
                      {s.n}
                    </span>
                    <span className="text-text-mid">{s.t}</span>
                    <span className="ml-auto font-bold text-text-high">
                      {s.r}
                      <Caret on={step === i + 1} />
                    </span>
                  </span>
                </Line>
              </li>
            );
          })}
        </ul>

        {/* 마지막에 "이 줄 왜?" 가 열린다 */}
        <Expand open={step >= 4}>
          <div className="mt-2 rounded-sm border border-primary/40 bg-primary/[0.05] px-2 py-1.5">
            <span className="text-4xs font-bold text-primary">
              이 줄 왜? · ② 번
            </span>
            <span className="mt-1 block text-4xs leading-[1.6] text-text-mid">
              중앙 집중하중일 때만 48EI 예요. 하중 형태가 바뀌면 분모가
              바뀝니다.
            </span>
          </div>
        </Expand>
      </div>
    </div>
  );
}
