"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { Md } from "@/components/md-lite";
import { cn } from "@/lib/utils";

/**
 * 히어로 — 들어오자마자 전 과정이 끊기지 않고 이어진다.
 *
 * 풀기 → 오답 선택 → 채점 → 그 선택지용 해설 → 자주 틀리는 유형 →
 * 오답노트 자동 추가 → 약점 분석 → 망각곡선 예약.
 *
 * 카드를 넘기지 않는다:
 *   - 문제와 선지는 위에 계속 남는다
 *   - 아래 칸은 내용 높이를 재서 실제로 늘었다 줄어든다 (AutoHeight).
 *     높이가 툭툭 바뀌면 "다른 카드로 갈아탔다" 로 읽힌다
 *   - 글은 단어 단위로 차오른다. 문단이 통째로 나타나면 틱 하고 끊겨 보인다
 *   - 오답이면 문제 상자가 한 번 흔들리고, 정답이면 튀어오르며 링이 퍼진다
 *
 * 안의 값은 화면 예시다. 사용자 실적 지표가 아니다.
 */

const HOLDS = [1300, 900, 1700, 6200, 1900, 1900, 2100, 3000];

/**
 * 프리미엄 해설 — 정답만 알려주는 해설과 갈리는 지점.
 *   1) 왜 그 번호에 끌렸는지부터 짚는다
 *   2) 정답 근거를 사실로 못 박는다
 *   3) 다음에 안 틀릴 암기 고리를 준다
 * 마크다운으로 써서 굵게·목록·팁 상자가 그대로 살아난다.
 */
const EXPLANATION = `
**③ 진흥왕**에 손이 가셨죠? 신라 왕 중에 업적이 제일 화려해서 그래요.

- 화랑도 정비, 한강 유역 차지, 순수비 건립 — 전부 진흥왕이 맞아요
- 그런데 그건 모두 **법흥왕이 깔아둔 틀 위에서** 넓힌 일이에요

정답은 **② 법흥왕**이에요. **율령을 반포**해 나라의 기준을 세우고, **이차돈의 순교**를 계기로 **불교를 공인**했어요. 금관가야를 병합하고 연호 '건원'을 쓴 것도 이 왕입니다.

> 이렇게 외워보세요
> 지증왕 → 법흥왕 → 진흥왕
> **이름 짓고 → 틀 만들고 → 넓힌다**
`;
const CHOICES = [
  { l: "①", t: "지증왕" },
  { l: "②", t: "법흥왕" },
  { l: "③", t: "진흥왕" },
  { l: "④", t: "무열왕" },
];
const MINE = 2;
const ANSWER = 1;

/**
 * 아래 칸을 내용 높이에 맞춰 늘렸다 줄인다.
 *
 * 가장 긴 단계에 맞춰 고정하면 짧은 단계에서 빈 공간이 크게 남는다.
 * 히어로는 첫 화면이라 사람 시선이 여기 머물러 있고, 아래로 밀리는 것도
 * 스크롤 밖이라 거슬리지 않는다. 대신 전환을 길게(600ms) 잡아
 * 툭 바뀌는 게 아니라 숨쉬듯 늘어나게 한다.
 *
 * 아래쪽 섹션에서는 이렇게 하지 않는다 — 거기서는 읽던 자리가 밀린다.
 */
const PANEL_FLOOR = 132;

function GrowPanel({
  dep,
  children,
}: {
  dep: number;
  children: React.ReactNode;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const next = el.offsetHeight;
    if (next > 0) setH(Math.max(next, PANEL_FLOOR));
  }, [dep]);

  return (
    <div
      style={h ? { height: h } : { minHeight: PANEL_FLOOR }}
      className="overflow-hidden transition-[height] duration-[600ms] ease-out motion-reduce:transition-none"
    >
      <div ref={inner}>{children}</div>
    </div>
  );
}

/** 단어가 하나씩 차오른다 — 문단이 통째로 뜨면 끊겨 보인다 */
function Words({
  text,
  on,
  className,
  stagger = 42,
}: {
  text: string;
  on: boolean;
  className?: string;
  stagger?: number;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span
          key={i}
          style={{ transitionDelay: on ? `${i * stagger}ms` : "0ms" }}
          className={cn(
            "inline-block whitespace-pre transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none",
            on ? "translate-y-0 opacity-100" : "translate-y-[3px] opacity-0",
          )}
        >
          {w}{" "}
        </span>
      ))}
    </span>
  );
}

/** 숫자가 굴러 올라간다 */
function Roll({ value }: { value: number | string }) {
  return (
    <span key={String(value)} className="inline-block animate-roll-up">
      {value}
    </span>
  );
}

const TONE = {
  plain: "border-border bg-surface-mute",
  ink: "border-text-high bg-text-high text-background",
  brand: "border-primary/40 bg-primary/[0.06]",
  warn: "border-danger/40 bg-danger/[0.06]",
} as const;

export function HeroFlow() {
  const { ref, step } = useAutoSequence(HOLDS);
  const picking = step === 1;
  const graded = step >= 2;
  const justGraded = step === 2;

  // 채점 순간에만 한 번 흔들린다 (매 렌더 반복되면 산만하다)
  const [shake, setShake] = useState(false);
  useEffect(() => {
    if (!justGraded) return;
    setShake(true);
    const t = window.setTimeout(() => setShake(false), 450);
    return () => window.clearTimeout(t);
  }, [justGraded]);

  const progress = ((step + 1) / HOLDS.length) * 100;

  return (
    <div ref={ref}>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_20px_50px_-32px_rgb(var(--text-high)/0.4)]">
        {/* 상단 — 진행이 끊기지 않고 차오른다 */}
        <div className="border-b border-border-soft bg-surface-mute">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-2xs font-semibold text-text-mid">
              한국사능력검정시험{" "}
              <span className="font-normal text-text-muted">· 심화</span>
            </span>
            <span className="text-3xs text-text-muted">자동 재생</span>
          </div>
          <span className="block h-[2px] w-full bg-border/60">
            <span
              className="block h-full bg-primary transition-[width] duration-700 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </span>
        </div>

        <div className="p-4 md:p-5">
          {/* 문제 상자 — 오답이면 여기가 흔들린다 */}
          <div className={cn(shake && "animate-shake")}>
            <p className="text-sm font-bold leading-[1.55] text-text-high">
              이차돈의 순교로 불교를 공인하고, 율령을 반포한 신라의 왕은?
            </p>

            <ul className="mt-3 space-y-1.5">
              {CHOICES.map((c, i) => {
                const isMine = i === MINE;
                const isAnswer = i === ANSWER;
                const dim =
                  graded && !isMine && !isAnswer ? "opacity-45" : "opacity-100";
                return (
                  <li key={c.l} className="relative">
                    {/* 정답 순간 링이 퍼진다 */}
                    {isAnswer && justGraded && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 animate-ring-out rounded-md border-2 border-primary"
                      />
                    )}
                    <div
                      className={cn(
                        "flex items-center gap-2.5 rounded-md border px-3 py-2 text-xs font-medium transition-all duration-300",
                        dim,
                        isMine &&
                          picking &&
                          "scale-[0.985] border-primary/60 bg-primary/[0.06]",
                        isMine &&
                          graded &&
                          "border-danger bg-danger/[0.07] text-danger",
                        isAnswer &&
                          graded &&
                          "border-primary bg-primary/[0.08] text-text-high",
                        isAnswer && justGraded && "animate-pop-in",
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
                        <Xmark
                          className="h-3.5 w-3.5 shrink-0"
                          strokeWidth={2.5}
                        />
                      )}
                      {isAnswer && graded && (
                        <CheckCircle
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 아래 칸 — 높이가 실제로 늘었다 줄어든다 */}
          <div className="mt-3">
            <GrowPanel dep={step}>
              <div
                className={cn(
                  "rounded-md border p-3.5 transition-colors duration-500",
                  step <= 1 && TONE.plain,
                  step === 2 || step === 3 ? TONE.ink : "",
                  step === 4 && TONE.warn,
                  step >= 5 && TONE.brand,
                )}
              >
                <PanelLabel step={step} />
                <div className="mt-2">
                  <PanelBody step={step} />
                </div>
              </div>
            </GrowPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelLabel({ step }: { step: number }) {
  const map: Record<
    number,
    { icon: typeof Sparks; text: string; ink?: boolean; warn?: boolean }
  > = {
    0: { icon: Sparks, text: "풀이 중" },
    1: { icon: Sparks, text: "풀이 중" },
    2: { icon: Xmark, text: "채점", ink: true },
    3: { icon: Sparks, text: "프리미엄 해설 · ③ 을 고른 사람에게", ink: true },
    4: { icon: WarningTriangle, text: "자주 틀리는 유형", warn: true },
    5: { icon: Bookmark, text: "오답노트" },
    6: { icon: GraphUp, text: "약점 분석" },
    7: { icon: Refresh, text: "망각곡선" },
  };
  const m = map[step] ?? map[0];
  const Icon = m.icon;
  return (
    <span
      key={step}
      className={cn(
        "inline-flex animate-fade-in items-center gap-1.5 text-3xs font-bold uppercase tracking-[0.14em]",
        m.ink ? "text-background/60" : m.warn ? "text-danger" : "text-primary",
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {m.text}
    </span>
  );
}

function PanelBody({ step }: { step: number }) {
  if (step <= 1) {
    return (
      <Words
        on
        key="s0"
        className="text-2xs leading-[1.7] text-text-mid"
        text={step === 1 ? "③ 을 고르는 중…" : "가입 없이 바로 풀 수 있어요."}
      />
    );
  }

  if (step === 2) {
    return (
      <Words
        on
        key="s2"
        className="text-2xs leading-[1.7]"
        text="③ 진흥왕 — 오답이에요. 정답은 ② 법흥왕."
      />
    );
  }

  if (step === 3) {
    return <Md key="s3" src={EXPLANATION} tone="ink" />;
  }

  if (step === 4) {
    return (
      <Words
        on
        key="s4"
        className="text-2xs leading-[1.7] text-text-mid"
        text="왕 계보 순서 문제에서만 4번 중 3번 걸리셨어요."
      />
    );
  }

  if (step === 5) {
    return (
      <div key="s5">
        <p className="flex items-center gap-2 text-2xs text-text-mid">
          <Words on className="flex-1" text="신라 왕 계보 — 법흥왕" />
          <span className="shrink-0 font-bold tabular-nums text-primary">
            +1 · <Roll value={13} />
            문항
          </span>
        </p>
        <p className="mt-1.5 text-3xs text-text-muted">
          <Words on stagger={30} text="개념카드도 같이 만들어 뒀어요" />
        </p>
      </div>
    );
  }

  if (step === 6) {
    return (
      <ul key="s6" className="space-y-1.5">
        {[
          { s: "고대 · 신라", p: 32, weak: true },
          { s: "고려", p: 64 },
          { s: "조선", p: 78 },
        ].map((r, i) => (
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
                style={{ width: `${r.p}%`, transitionDelay: `${i * 120}ms` }}
              />
            </span>
            <span className="w-7 shrink-0 text-right text-3xs tabular-nums text-text-muted">
              {r.p}%
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div key="s7">
      <p className="text-2xs leading-[1.7] text-text-mid">
        <Words on text="3일 뒤 비슷한 함정으로 다시 낼게요." />
      </p>
      <p className="mt-2 border-t border-primary/20 pt-2 text-3xs font-bold text-text-high">
        <Words on stagger={38} text="여기까지 누른 건 선택지 하나뿐이에요." />
      </p>
    </div>
  );
}
