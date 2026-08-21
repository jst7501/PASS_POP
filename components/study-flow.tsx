"use client";

import {
  Bookmark,
  CheckCircle,
  NavArrowDown,
  OpenBook,
  Sparks,
  Xmark,
} from "iconoir-react";
import { useAutoSequence } from "@/components/demo-player";
import { Md } from "@/components/md-lite";
import { cn } from "@/lib/utils";

/**
 * 틀린 다음에 받는 것들 — 하나의 화면에서 이어서 재생한다.
 *
 * 기능마다 카드를 두거나 슬라이드로 넘기면 "기능이 여러 개" 로 읽힌다.
 * 한 문제에서 시작해 노트에 쌓일 때까지 끊기지 않고 이어져야
 * "이게 다 알아서 굴러간다" 가 된다.
 *
 * 규칙:
 *   - 문제와 채점 결과는 위에 계속 남는다. 카드를 갈아끼우지 않는다
 *   - 아래 칸은 자리를 미리 잡아둔다. 높이가 변하면 페이지 전체가 밀린다
 *   - 왼쪽 설명은 시연과 같은 step 을 쓴다. 따로 돌면 어긋나 보인다
 *
 * 안의 값은 전부 화면 예시다. 사용자 실적 지표가 아니다.
 */

const HOLDS = [1900, 6200, 3400, 3200, 3600];

const STEPS = [
  {
    tag: "채점",
    title: "채점은 시작일 뿐이에요",
    desc: "틀렸다고 알려주고 끝내지 않아요. 여기서부터가 본론입니다.",
  },
  {
    tag: "프리미엄 해설",
    title: "내가 고른 그 번호 기준으로",
    desc: "왜 거기에 끌렸는지부터 짚고, 정답 근거와 외울 고리까지 같이 줘요.",
  },
  {
    tag: "개념 카드",
    title: "막힌 자리에서 바로 펼쳐요",
    desc: "교재를 펴지 않아도 계보와 함정이 한눈에 들어옵니다.",
  },
  {
    tag: "단계별 풀이",
    title: "건너뛰는 단계가 없어요",
    desc: "어떻게 답에 닿는지 한 줄씩 보여줘요. 모르는 줄만 더 파고들 수도 있고요.",
  },
  {
    tag: "노트",
    title: "노트는 알아서 쌓여요",
    desc: "틀린 순간 오답노트에 담기고, 시험 전날 훑을 한 장으로도 정리됩니다.",
  },
];

const EXPLAIN = `
**③ 진흥왕**에 손이 가셨죠? 신라 왕 중에 업적이 제일 화려해서 그래요.

정답은 **② 법흥왕**. **율령을 반포**해 나라의 기준을 세우고 **이차돈의 순교**로 불교를 공인했어요.

> 이렇게 외워보세요
> **이름 짓고 → 틀 만들고 → 넓힌다**
`;

const SLOT = "min-h-[212px]";

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

export function StudyFlow() {
  const { ref, step, jump } = useAutoSequence<HTMLDivElement>(HOLDS);
  const cur = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <div
      ref={ref}
      className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16"
    >
      {/* 설명 — 시연과 같은 단계로 넘어간다 */}
      <div>
        <span className="text-3xs font-bold uppercase tracking-[0.18em] text-primary">
          틀렸을 때
        </span>

        <div className="min-h-[168px]">
          <div
            key={step}
            className="animate-slide-up [animation-fill-mode:both]"
          >
            <h2 className="mt-3 text-2xl font-extrabold leading-[1.25] tracking-[-0.035em] text-text-high md:text-3xl">
              {cur.title}
            </h2>
            <p className="mt-4 max-w-lg text-base text-text-mid">{cur.desc}</p>
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s.tag}>
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
                {s.tag}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 한 화면 — 위는 고정, 아래만 바뀐다 */}
      <div className="mx-auto w-full max-w-[380px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_16px_40px_-30px_rgb(var(--text-high)/0.35)]">
          <div className="flex items-center justify-between border-b border-border-soft bg-surface-mute px-4 py-2.5">
            <span className="text-3xs font-bold text-text-high">
              한국사 · 심화
            </span>
            <span className="text-4xs text-text-muted">자동 재생</span>
          </div>

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
                    <NavArrowDown
                      className="h-2 w-2 rotate-180"
                      strokeWidth={3}
                    />
                  </span>
                  <p className="mt-2 text-3xs leading-[1.75] text-text-mid">
                    지증왕(국호·왕호) → 법흥왕(율령·불교) → 진흥왕(화랑·한강)
                  </p>
                  <p className="mt-2 rounded-sm bg-surface px-2 py-1.5 text-center text-3xs font-bold text-text-high">
                    6세기 = 법흥 · 진흥
                  </p>
                  <p className="mt-2 text-4xs leading-[1.6] text-text-muted">
                    함정: 화랑도와 한강은 진흥왕. 순서를 바꿔 묻는 문항이
                    많아요.
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
                  <p className="mt-2 rounded-sm bg-surface-mute px-2 py-1.5 text-4xs text-text-muted">
                    모르는 줄은 &lsquo;이 줄 왜?&rsquo; 로 더 파고들 수 있어요
                  </p>
                </div>
              </Slot>

              <Slot on={step === 4}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/[0.06] px-3 py-2.5">
                    <Bookmark
                      className="h-3.5 w-3.5 shrink-0 text-primary"
                      strokeWidth={2}
                    />
                    <span className="flex-1 text-3xs font-semibold text-text-high">
                      오답노트에 담김
                    </span>
                    <span className="text-4xs font-bold tabular-nums text-primary">
                      +1 · 13문항
                    </span>
                  </div>
                  <div className="rounded-md border border-border bg-surface p-3">
                    <span className="text-4xs font-bold uppercase tracking-[0.12em] text-primary">
                      단권화 노트 · 시험 전날 1장
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
                  </div>
                </div>
              </Slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
