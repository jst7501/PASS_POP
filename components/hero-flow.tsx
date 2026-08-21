"use client";

import {
  Bookmark,
  CheckCircle,
  GraphUp,
  Refresh,
  Sparks,
  WarningTriangle,
  Xmark,
} from "iconoir-react";
import { useAutoSequence } from "@/components/demo-player";
import { cn } from "@/lib/utils";

/**
 * 히어로 — 들어오자마자 전 과정이 한 번에 돌아간다.
 *
 * 풀기 → 오답 선택 → 채점 → 그 선택지용 해설 → 자주 틀리는 유형 →
 * 오답노트 자동 추가 → 약점 분석 → 망각곡선 예약.
 *
 * 화면을 갈아끼우지 않는다. 문제와 선지는 위에 계속 남고, 아래 칸의 내용만
 * 바뀐다. 그래야 "이 한 문제를 두고 앱이 계속 뭔가 하고 있다" 로 읽힌다.
 * 장면을 통째로 넘기면 "다른 기능이 나왔다" 가 된다.
 *
 * 안의 값은 화면 예시다. 사용자 실적 지표가 아니다.
 */

const HOLDS = [1100, 900, 2100, 1500, 1400, 1600, 2600];
const CHOICES = [
  { l: "①", t: "지증왕" },
  { l: "②", t: "법흥왕" },
  { l: "③", t: "진흥왕" },
  { l: "④", t: "무열왕" },
];
const MINE = 2;
const ANSWER = 1;

/** 아래 칸 — 단계마다 내용이 바뀐다 */
function Panel({
  show,
  tone = "plain",
  icon: Icon,
  label,
  children,
}: {
  show: boolean;
  tone?: "plain" | "ink" | "brand" | "warn";
  icon?: typeof Sparks;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 rounded-md border p-3.5 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none",
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
        tone === "ink" && "border-text-high bg-text-high text-background",
        tone === "brand" && "border-primary/40 bg-primary/[0.06]",
        tone === "warn" && "border-danger/40 bg-danger/[0.06]",
        tone === "plain" && "border-border bg-surface-mute",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-3xs font-bold uppercase tracking-[0.14em]",
          tone === "ink" ? "text-background/60" : "text-primary",
          tone === "warn" && "text-danger",
        )}
      >
        {Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function HeroFlow() {
  const { ref, step } = useAutoSequence(HOLDS);
  const picking = step === 1;
  const graded = step >= 2;

  return (
    <div ref={ref}>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_20px_50px_-32px_rgb(var(--text-high)/0.4)]">
        <div className="flex items-center justify-between border-b border-border-soft bg-surface-mute px-4 py-3">
          <span className="text-2xs font-semibold text-text-mid">
            한국사능력검정시험{" "}
            <span className="font-normal text-text-muted">· 심화</span>
          </span>
          <span className="text-3xs tabular-nums text-text-muted">
            {step + 1} / {HOLDS.length}
          </span>
        </div>

        <div className="p-4 md:p-5">
          {/* 문제와 선지는 계속 남는다 */}
          <p className="text-sm font-bold leading-[1.55] text-text-high">
            이차돈의 순교로 불교를 공인하고, 율령을 반포한 신라의 왕은?
          </p>

          <ul className="mt-3 space-y-1.5">
            {CHOICES.map((c, i) => {
              const isMine = i === MINE;
              const isAnswer = i === ANSWER;
              return (
                <li
                  key={c.l}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md border px-3 py-2 text-xs font-medium transition-all duration-300",
                    isMine && picking && "border-primary/50 bg-primary/[0.06]",
                    isMine &&
                      graded &&
                      "border-danger bg-danger/[0.07] text-danger",
                    isAnswer &&
                      graded &&
                      "border-primary bg-primary/[0.08] text-text-high",
                    !(
                      (isMine && (picking || graded)) ||
                      (isAnswer && graded)
                    ) && "border-border-soft text-text-mid",
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
                  <span className="flex-1">{c.t}</span>
                  {isMine && graded && (
                    <Xmark className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  )}
                  {isAnswer && graded && (
                    <CheckCircle
                      className="h-3.5 w-3.5 shrink-0 text-primary"
                      strokeWidth={2.5}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {/* 아래 칸만 바뀐다 — 높이를 고정해 카드가 출렁이지 않게 */}
          <div className="relative mt-3 min-h-[124px]">
            <Panel show={step <= 1} label="풀이 중" icon={Sparks}>
              <p className="text-2xs leading-[1.7] text-text-mid">
                {picking ? "③ 을 고르는 중…" : "가입 없이 바로 풀 수 있어요."}
              </p>
            </Panel>

            <Panel
              show={step === 2}
              tone="ink"
              label="③ 을 고른 사람에게 나가는 해설"
            >
              <p className="text-2xs leading-[1.75]">
                업적이 화려해서 손이 먼저 가는 왕이에요. 화랑도와 한강 유역은
                전부{" "}
                <strong className="font-bold">
                  법흥왕이 만든 틀 위의 확장
                </strong>
                이라 순서가 뒤예요.
              </p>
            </Panel>

            <Panel
              show={step === 3}
              tone="warn"
              icon={WarningTriangle}
              label="자주 틀리는 유형"
            >
              <p className="text-2xs leading-[1.7] text-text-mid">
                왕 계보 순서 문제에서만{" "}
                <strong className="font-bold text-danger">4번 중 3번</strong>{" "}
                걸리셨어요.
              </p>
            </Panel>

            <Panel
              show={step === 4}
              tone="brand"
              icon={Bookmark}
              label="오답노트"
            >
              <p className="flex items-center gap-2 text-2xs text-text-mid">
                <span className="flex-1">신라 왕 계보 — 법흥왕</span>
                <span className="shrink-0 font-bold text-primary">
                  +1 · 13문항
                </span>
              </p>
              <p className="mt-1.5 text-3xs text-text-muted">
                개념카드도 같이 만들어 뒀어요
              </p>
            </Panel>

            <Panel
              show={step === 5}
              tone="brand"
              icon={GraphUp}
              label="약점 분석"
            >
              <ul className="space-y-1.5">
                {[
                  { s: "고대 · 신라", p: 32, weak: true },
                  { s: "고려", p: 64 },
                  { s: "조선", p: 78 },
                ].map((r) => (
                  <li key={r.s} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-14 shrink-0 text-3xs",
                        r.weak ? "font-bold text-danger" : "text-text-mid",
                      )}
                    >
                      {r.s}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                      <span
                        className={cn(
                          "block h-full rounded-full transition-[width] duration-700 ease-out",
                          r.weak ? "bg-danger" : "bg-primary/50",
                        )}
                        style={{ width: step === 5 ? r.p + "%" : "0%" }}
                      />
                    </span>
                    <span className="w-7 shrink-0 text-right text-3xs tabular-nums text-text-muted">
                      {r.p}%
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel
              show={step === 6}
              tone="brand"
              icon={Refresh}
              label="망각곡선"
            >
              <p className="text-2xs leading-[1.7] text-text-mid">
                <strong className="font-bold text-primary">3일 뒤</strong>{" "}
                비슷한 함정으로 다시 낼게요.
              </p>
              <p className="mt-2 border-t border-primary/20 pt-2 text-3xs font-bold text-text-high">
                여기까지 누른 건 선택지 하나뿐이에요.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
