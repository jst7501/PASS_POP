"use client";

import {
  Bookmark,
  CheckCircle,
  NavArrowDown,
  OpenBook,
  Sparks,
  WarningTriangle,
  Xmark,
} from "iconoir-react";
import { useAutoSequence } from "@/components/demo-player";
import { Md } from "@/components/md-lite";
import { cn } from "@/lib/utils";

/**
 * 같은 주제의 기능을 한 편으로 묶는다.
 *
 * 기능마다 시연을 따로 돌리면 "기능이 세 개" 로 읽힌다. 한 문제에서 시작해
 * 끝까지 이어져야 "이게 다 알아서 굴러간다" 가 된다.
 *
 * 공통 규칙:
 *   - 윗부분(문제·헤더)은 계속 남고 아랫부분만 바뀐다. 카드를 갈아끼우지 않는다
 *   - 아래 칸은 자리를 미리 잡아둔다. 높이가 변하면 페이지 전체가 밀린다
 *   - 설명 문장은 시연과 같은 step 을 쓴다. 따로 돌면 어긋나 보인다
 *
 * 안의 값은 전부 화면 예시다. 사용자 실적 지표가 아니다.
 */

const SLOT = "min-h-[196px]";
const CARD =
  "overflow-hidden rounded-lg border border-border bg-surface shadow-[0_16px_40px_-30px_rgb(var(--text-high)/0.35)]";

function Bar({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft bg-surface-mute px-4 py-2.5">
      <span className="text-3xs font-bold text-text-high">{label}</span>
      <span className="text-4xs text-text-muted">자동 재생</span>
    </div>
  );
}

/** 같은 자리에서 내용만 바뀐다 */
function Slot({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none",
        on
          ? "relative translate-y-0 opacity-100"
          : "pointer-events-none absolute inset-0 translate-y-2 opacity-0",
      )}
    >
      {children}
    </div>
  );
}

function Block({
  index,
  kicker,
  steps,
  holds,
  render,
}: {
  index: number;
  kicker: string;
  steps: { title: string; desc: string }[];
  holds: number[];
  render: (step: number) => React.ReactNode;
}) {
  const { ref, step, jump } = useAutoSequence<HTMLLIElement>(holds);
  const flip = index % 2 === 1;
  const cur = steps[Math.min(step, steps.length - 1)];

  return (
    <li
      ref={ref}
      className="grid gap-7 border-t border-border py-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16"
    >
      <div className={flip ? "lg:order-2" : undefined}>
        <span className="text-3xs font-bold tabular-nums tracking-[0.18em] text-primary">
          {kicker}
        </span>

        {/* 지금 화면에서 무슨 일이 일어나는지 — 자리를 잡아둬야 글이 안 튄다 */}
        <div className="min-h-[136px]">
          <div
            key={step}
            className="animate-slide-up [animation-fill-mode:both]"
          >
            <h3 className="mt-3 text-xl font-extrabold leading-[1.3] tracking-[-0.03em] text-text-high md:text-2xl">
              {cur.title}
            </h3>
            <p className="mt-3 max-w-lg text-base text-text-mid">{cur.desc}</p>
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {steps.map((p, i) => (
            <li key={p.title}>
              <button
                type="button"
                onClick={() => jump(i)}
                aria-current={i === step}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-3xs font-semibold transition-colors",
                  i === step
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-mute text-text-muted hover:text-text-mid",
                )}
              >
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={cn("mx-auto w-full max-w-[340px]", flip && "lg:order-1")}>
        {render(step)}
      </div>
    </li>
  );
}

// ── 01 · 틀렸을 때 ───────────────────────────────────────────
const EXPLAIN = `
**③ 진흥왕**에 손이 가셨죠? 업적이 제일 화려해서 그래요.

정답은 **② 법흥왕**. **율령을 반포**하고 **이차돈의 순교**로 불교를 공인했어요.

> 이렇게 외워보세요
> **이름 짓고 → 틀 만들고 → 넓힌다**
`;

function WrongFlow({ step }: { step: number }) {
  return (
    <div className={CARD}>
      <Bar label="한국사 · 심화" />
      <div className="p-4">
        <p className="text-3xs font-bold leading-[1.5] text-text-high">
          이차돈의 순교로 불교를 공인하고, 율령을 반포한 신라의 왕은?
        </p>
        <ul className="mt-2 space-y-1">
          {[
            { l: "②", t: "법흥왕", ok: true },
            { l: "③", t: "진흥왕", ok: false },
          ].map((c) => (
            <li
              key={c.l}
              className={cn(
                "flex items-center gap-2 rounded-sm border px-2 py-1.5 text-3xs",
                c.ok
                  ? "border-primary bg-primary/[0.08] text-text-high"
                  : "border-danger bg-danger/[0.07] text-danger",
              )}
            >
              <span className="font-bold">{c.l}</span>
              <span className="flex-1">{c.t}</span>
              {c.ok ? (
                <CheckCircle
                  className="h-3 w-3 text-primary"
                  strokeWidth={2.5}
                />
              ) : (
                <Xmark className="h-3 w-3" strokeWidth={2.5} />
              )}
            </li>
          ))}
        </ul>

        <div className={cn("relative mt-2.5", SLOT)}>
          <Slot on={step === 0}>
            <div className="rounded-md border border-border bg-surface-mute px-3 py-2.5 text-3xs leading-[1.7] text-text-mid">
              채점했어요. 왜 틀렸는지 지금 정리하고 있어요.
            </div>
          </Slot>

          <Slot on={step === 1}>
            <div className="rounded-md bg-text-high p-3 text-background">
              <span className="inline-flex items-center gap-1 text-4xs font-bold uppercase tracking-[0.12em] text-background/60">
                <Sparks className="h-2.5 w-2.5" strokeWidth={2.5} />
                프리미엄 해설
              </span>
              <div className="mt-2">
                <Md src={EXPLAIN} on={step === 1} tone="ink" />
              </div>
            </div>
          </Slot>

          <Slot on={step === 2}>
            <div className="rounded-md border border-primary/40 bg-primary/[0.06] p-3">
              <span className="inline-flex items-center gap-1 text-4xs font-bold uppercase tracking-[0.12em] text-primary">
                <OpenBook className="h-2.5 w-2.5" strokeWidth={2.5} />
                개념 카드
                <NavArrowDown className="h-2 w-2 rotate-180" strokeWidth={3} />
              </span>
              <p className="mt-2 text-3xs leading-[1.75] text-text-mid">
                지증왕(국호·왕호) → 법흥왕(율령·불교) → 진흥왕(화랑·한강)
              </p>
              <p className="mt-2 rounded-sm bg-surface px-2 py-1.5 text-center text-3xs font-bold text-text-high">
                6세기 = 법흥 · 진흥
              </p>
            </div>
          </Slot>

          <Slot on={step === 3}>
            <div className="rounded-md border border-border bg-surface p-3">
              <span className="text-4xs font-bold uppercase tracking-[0.12em] text-primary">
                단계별 풀이
              </span>
              <ul className="mt-2 space-y-1.5">
                {[
                  ["①", "왕 순서 확인", "지증→법흥→진흥"],
                  ["②", "업적 대응", "율령·불교 = 법흥"],
                  ["③", "선지 대조", "정답 ②"],
                ].map(([n, t, r]) => (
                  <li key={n} className="flex items-center gap-2 text-3xs">
                    <span className="font-bold text-primary">{n}</span>
                    <span className="text-text-mid">{t}</span>
                    <span className="ml-auto font-bold text-text-high">
                      {r}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Slot>
        </div>
      </div>
    </div>
  );
}

// ── 02 · 자동으로 쌓이는 것 ──────────────────────────────────
function NoteFlow({ step }: { step: number }) {
  return (
    <div className={CARD}>
      <Bar label="내 노트" />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-3xs font-bold text-text-high">
            <Bookmark className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            오답노트
          </span>
          <span className="text-4xs font-bold tabular-nums text-primary">
            {step === 0 ? "+1 · 13문항" : "13문항"}
          </span>
        </div>

        <div className={cn("relative mt-2.5", SLOT)}>
          <Slot on={step === 0}>
            <div className="rounded-md border border-primary/40 bg-primary/[0.06] px-3 py-2.5">
              <p className="text-3xs font-bold text-text-high">
                신라 왕 계보 — 법흥왕
              </p>
              <p className="mt-1 text-4xs text-text-muted">
                방금 담았어요 · 옮겨 적을 필요 없어요
              </p>
            </div>
          </Slot>

          <Slot on={step === 1}>
            <ul className="space-y-1">
              {[
                ["신라 왕 계보 — 법흥왕", "오늘"],
                ["고려 문벌귀족 — 이자겸", "2일 전"],
                ["조선 붕당 — 예송논쟁", "4일 전"],
                ["근대 — 갑오개혁", "6일 전"],
              ].map(([t, d]) => (
                <li
                  key={t}
                  className="flex items-center gap-2 rounded-sm border border-border-soft px-2.5 py-1.5 text-3xs"
                >
                  <span className="flex-1 truncate text-text-mid">{t}</span>
                  <span className="shrink-0 text-4xs text-text-muted">{d}</span>
                </li>
              ))}
            </ul>
          </Slot>

          <Slot on={step === 2}>
            <div className="rounded-md border border-primary/40 bg-primary/[0.06] p-3">
              <span className="text-4xs font-bold uppercase tracking-[0.12em] text-primary">
                단권화 노트 · 시험 전날용 1장
              </span>
              <ul className="mt-2 space-y-1">
                {[
                  "신라 — 이름 짓고 → 틀 만들고 → 넓힌다",
                  "고려 — 문벌귀족의 한계",
                  "조선 — 예송은 상복 기간 다툼",
                ].map((r) => (
                  <li
                    key={r}
                    className="flex gap-1.5 text-3xs leading-[1.6] text-text-mid"
                  >
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {r}
                  </li>
                ))}
              </ul>
              <p className="mt-2 rounded-sm bg-surface px-2 py-1.5 text-center text-4xs font-bold text-primary">
                PDF 로 내보내기
              </p>
            </div>
          </Slot>
        </div>
      </div>
    </div>
  );
}

// ── 03 · 나를 진단하는 것 ────────────────────────────────────
function DiagnoseFlow({ step }: { step: number }) {
  return (
    <div className={CARD}>
      <Bar label="내 상태" />
      <div className="p-4">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-extrabold leading-none tabular-nums tracking-[-0.04em] text-primary">
            68<span className="text-sm">%</span>
          </span>
          <span className="pb-0.5 text-4xs text-text-mid">
            ±9%p · 신뢰 보통 · 풀이 47회
          </span>
        </div>

        <div className={cn("relative mt-3", SLOT)}>
          <Slot on={step === 0}>
            <div>
              <div className="relative h-2 w-full rounded-full bg-border">
                <span className="absolute inset-y-0 left-[59%] w-[18%] rounded-full bg-primary/30" />
                <span className="absolute inset-y-[-3px] left-[68%] w-[2px] rounded-full bg-primary" />
              </div>
              <p className="mt-2.5 text-3xs leading-[1.75] text-text-mid">
                표본이 적으면 구간을 넓게, 그리고{" "}
                <strong className="font-bold text-text-high">
                  적다고 말해요.
                </strong>
              </p>
            </div>
          </Slot>

          <Slot on={step === 1}>
            <ul className="space-y-2">
              {[
                { s: "응용역학", p: 72 },
                { s: "측량학", p: 34, risk: true },
                { s: "토질역학", p: 61 },
              ].map((r) => (
                <li key={r.s}>
                  <div className="flex items-center justify-between text-4xs">
                    <span
                      className={
                        r.risk ? "font-bold text-danger" : "text-text-mid"
                      }
                    >
                      {r.s}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums",
                        r.risk ? "font-bold text-danger" : "text-text-muted",
                      )}
                    >
                      {r.p}%
                    </span>
                  </div>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <span
                      className={cn(
                        "block h-full rounded-full transition-[width] duration-700 ease-out",
                        r.risk ? "bg-danger" : "bg-primary/50",
                      )}
                      style={{ width: step === 1 ? `${r.p}%` : "0%" }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </Slot>

          <Slot on={step === 2}>
            <div className="rounded-md border border-danger/40 bg-danger/[0.06] p-3">
              <span className="inline-flex items-center gap-1 text-4xs font-bold uppercase tracking-[0.12em] text-danger">
                <WarningTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />
                측량학 과락 위험
              </span>
              <p className="mt-2 text-3xs leading-[1.75] text-text-mid">
                평균은 합격권인데 이 과목 하나로 떨어질 수 있어요.
              </p>
              <p className="mt-2 rounded-sm bg-surface px-2 py-1.5 text-center text-3xs font-bold text-text-high">
                측량학만 20문항 처방
              </p>
            </div>
          </Slot>
        </div>
      </div>
    </div>
  );
}

export function MergedFeatures() {
  return (
    <>
      <Block
        index={0}
        kicker="01 · 틀렸을 때"
        holds={[1900, 6000, 3400, 3200]}
        steps={[
          {
            title: "채점은 시작일 뿐이에요",
            desc: "틀렸다고 알려주고 끝내지 않아요. 여기서부터가 본론입니다.",
          },
          {
            title: "오답 기준 프리미엄 해설",
            desc: "내가 고른 그 번호를 기준으로, 왜 거기 끌렸는지부터 짚고 외울 고리까지 줘요.",
          },
          {
            title: "개념 카드",
            desc: "막힌 그 자리에서 개념을 펼쳐요. 교재를 펴지 않아도 계보가 한눈에 들어옵니다.",
          },
          {
            title: "단계별 완전 풀이",
            desc: "어떻게 답에 닿는지 건너뛰는 단계 없이 보여줘요.",
          },
        ]}
        render={(s) => <WrongFlow step={s} />}
      />

      <Block
        index={1}
        kicker="02 · 자동으로 쌓이는 것"
        holds={[2700, 3200, 3600]}
        steps={[
          {
            title: "틀리는 순간 담겨요",
            desc: "따로 정리할 필요도, 옮겨 적을 필요도 없어요.",
          },
          {
            title: "오답노트",
            desc: "틀린 것만 모여요. 언제 틀렸는지까지 남아서 다시 풀 순서를 잡을 수 있어요.",
          },
          {
            title: "단권화 노트",
            desc: "시험 전날 훑을 한 장으로 정리해요. PDF 로도 내보낼 수 있어요.",
          },
        ]}
        render={(s) => <NoteFlow step={s} />}
      />

      <Block
        index={2}
        kicker="03 · 나를 진단하는 것"
        holds={[3200, 3200, 3600]}
        steps={[
          {
            title: "합격 확률",
            desc: "최근 풀이를 반영해 확률과 신뢰구간을 같이 내요. 과신하지 않게요.",
          },
          {
            title: "과목별로 쪼개보면",
            desc: "평균 뒤에 가려진 과목이 보여요. 한 과목만 유독 낮을 때가 있어요.",
          },
          {
            title: "과락 위험 처방",
            desc: "평균이 합격권이어도 한 과목 과락이면 떨어져요. 그 과목만 집중해서 냅니다.",
          },
        ]}
        render={(s) => <DiagnoseFlow step={s} />}
      />
    </>
  );
}
