"use client";

import { useState } from "react";
import { NavArrowDown } from "iconoir-react";
import { cn } from "@/lib/utils";

/**
 * AI 기술 섹션 — 눌러서 펼치면 그 기능이 실제로 뭘 보여주는지가 나온다.
 *
 * 설명만 적어두면 "무엇을 한다" 까지만 전달되고 "그래서 화면에 뭐가 뜨는데?" 가
 * 안 남는다. 각 항목마다 실제 제품이 내보내는 화면을 축약해 붙였다.
 *
 * 안의 숫자는 전부 화면 예시다. 사용자 실적이나 성능 지표가 아니다 —
 * 그렇게 읽힐 문구를 여기에 넣지 말 것.
 *
 * 이 섹션은 잉크(반전) 배경 위에 올라간다. 라이트 모드 --primary 는 어두워서
 * 잉크 위에서 3:1 도 안 나오므로 --primary-invert 를 쓴다.
 */

type Item = {
  title: string;
  desc: string;
  demo: React.ReactNode;
};

/** 반전 배경 위의 작은 패널 */
function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-background/15 bg-background/[0.06] p-4">
      <p className="text-3xs font-bold uppercase tracking-[0.14em] text-background/50">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** 정답률 막대 — 장식이므로 색 대비는 3:1 기준 */
function Bar({ pct, weak }: { pct: number; weak?: boolean }) {
  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-background/15">
        <span
          className={cn(
            "block h-full rounded-full",
            weak ? "bg-danger" : "bg-primary-invert",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-9 shrink-0 text-right text-3xs tabular-nums text-background/60">
        {pct}%
      </span>
    </span>
  );
}

const ITEMS: Item[] = [
  {
    title: "선택지 단위 해설 생성",
    desc: "선택지가 4개면 해설도 4개 써요. 같은 문제라도 ② 를 고른 사람과 ④ 를 고른 사람이 서로 다른 설명을 받아요.",
    demo: (
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel label="② 를 고른 사람">
          <p className="text-2xs leading-[1.7] text-background/80">
            하중이 한쪽으로 치우쳤다고 보셨네요. 이 문제는 좌우 대칭이라 최대
            처짐도 대칭축 위에 옵니다.
          </p>
        </Panel>
        <Panel label="④ 를 고른 사람">
          <p className="text-2xs leading-[1.7] text-background/80">
            L/3 은 3점 재하 문제에서 자주 나오는 숫자라 손이 먼저 가요. 이
            조건에서는 나올 수 없는 위치입니다.
          </p>
        </Panel>
      </div>
    ),
  },
  {
    title: "지식 상태 추정",
    desc: "정오답 기록을 문항 태그(단원·유형·난이도)에 비춰봐요. 점수 말고 무엇을 모르는지를 추정해요.",
    demo: (
      <Panel label="지금 약한 곳">
        <ul className="space-y-2.5">
          {[
            { name: "응용역학 · 보의 처짐", pct: 32, weak: true },
            { name: "토질역학 · 압밀", pct: 58 },
            { name: "측량학 · 오차론", pct: 81 },
          ].map((r) => (
            <li
              key={r.name}
              className="flex items-center gap-3 text-2xs text-background/80"
            >
              <span className="shrink-0">{r.name}</span>
              <Bar pct={r.pct} weak={r.weak} />
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-background/15 pt-3 text-2xs font-bold text-primary-invert">
          다음 세션은 &lsquo;보의 처짐&rsquo; 위주로 낼게요
        </p>
      </Panel>
    ),
  },
  {
    title: "SM-2 복습 스케줄러",
    desc: "문항별 난이도 계수와 반복 횟수로 다음 복습일을 계산해요. 맞히면 간격이 벌어지고, 틀리면 처음으로 돌아가요.",
    demo: (
      <Panel label="예약된 재출제">
        <ul className="space-y-2">
          {[
            { when: "오늘", n: 12, now: true },
            { when: "내일", n: 5 },
            { when: "3일 뒤", n: 8 },
            { when: "일주일 뒤", n: 3 },
          ].map((r) => (
            <li key={r.when} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-16 shrink-0 text-2xs",
                  r.now
                    ? "font-bold text-primary-invert"
                    : "text-background/60",
                )}
              >
                {r.when}
              </span>
              <span className="h-5 overflow-hidden rounded-sm">
                <span
                  className={cn(
                    "block h-full rounded-sm",
                    r.now ? "bg-primary-invert" : "bg-background/20",
                  )}
                  style={{ width: `${r.n * 10}px` }}
                />
              </span>
              <span className="text-2xs tabular-nums text-background/60">
                {r.n}문항
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    ),
  },
  {
    title: "베이지안 합격 예측",
    desc: "최근 풀이를 반영해 합격 확률과 신뢰구간을 같이 내요. 표본이 적으면 구간을 넓게, 솔직하게 보여줘요.",
    demo: (
      <Panel label="현재 추정">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-extrabold tabular-nums leading-none tracking-[-0.04em] text-primary-invert">
            68
            <span className="text-xl">%</span>
          </span>
          <span className="pb-1 text-2xs text-background/60">
            ±9%p · 신뢰 보통
          </span>
        </div>
        <div className="relative mt-4 h-1.5 w-full rounded-full bg-background/15">
          <span className="absolute inset-y-0 left-[59%] w-[18%] rounded-full bg-primary-invert/40" />
          <span className="absolute inset-y-[-3px] left-[68%] w-[2px] rounded-full bg-primary-invert" />
        </div>
        <p className="mt-4 border-t border-background/15 pt-3 text-2xs text-background/60">
          풀이 47회 기준. 회차가 쌓일수록 구간이 좁아져요.
        </p>
      </Panel>
    ),
  },
];

export function AiTechCards() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="mt-10 divide-y divide-background/15 border-y border-background/15 md:mt-14">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.title}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-4 py-5 text-left transition-opacity hover:opacity-80 md:py-6"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold tracking-[-0.02em]">
                  {it.title}
                </span>
                <span className="mt-2 block text-sm leading-[1.7] text-background/70">
                  {it.desc}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-background/25 transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              >
                <NavArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </button>

            {/* 0fr → 1fr 은 내용 높이를 몰라도 부드럽게 열린다 (max-height 추정 불필요) */}
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-6">{it.demo}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
