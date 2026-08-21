"use client";

import {
  Bookmark,
  CheckCircle,
  NavArrowLeft,
  OpenBook,
  Refresh,
  Xmark,
} from "iconoir-react";
import { Screens, StepDots, useAutoSequence } from "@/components/demo-player";
import { cn } from "@/lib/utils";

/**
 * "틀린 다음에 일어나는 일" — 채점 이후를 화면 녹화처럼 재생한다.
 *
 * 목록에 항목이 쌓이는 방식으로 만들면 "기능이 여러 개 있구나" 로 끝난다.
 * 화면 자체가 넘어가야 "앱이 알아서 이만큼 움직인다" 로 읽힌다.
 * 그래서 채점 → 해설 → 진단 → 오답노트 → 복습까지를 각각 다른 화면으로 두고
 * 실제 내비게이션처럼 밀어 넘긴다.
 *
 * 문항은 히어로와 같은 것을 쓴다(정답 ② 법흥왕). 여기서는 ③ 을 골라 틀린 상황.
 * 안의 숫자는 화면 예시다. 사용자 실적 지표가 아니다.
 */

const HOLDS = [1400, 2100, 1700, 1500, 2600];
const TITLES = ["채점 결과", "해설", "약점 진단", "오답노트", "복습 일정"];

export function DemoAfterWrong() {
  const { ref, step, replay } = useAutoSequence(HOLDS);

  return (
    <div ref={ref}>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_20px_50px_-32px_rgb(var(--text-high)/0.4)]">
        {/* 상단 바 — 화면이 바뀌면 제목도 바뀐다 */}
        <div className="flex items-center gap-2 border-b border-border-soft bg-surface-mute px-4 py-3">
          <NavArrowLeft
            className={cn(
              "h-3.5 w-3.5 transition-opacity",
              step > 0 ? "text-text-muted opacity-100" : "opacity-0",
            )}
            strokeWidth={2.5}
          />
          <span
            key={step}
            className="animate-fade-in text-2xs font-bold text-text-high"
          >
            {TITLES[step]}
          </span>
          <span className="ml-auto text-3xs text-text-muted">
            한국사 · 심화
          </span>
        </div>

        <Screens
          step={step}
          className="min-h-[290px]"
          screens={[
            <ScoreScreen key="s0" />,
            <ExplainScreen key="s1" />,
            <DiagnoseScreen key="s2" active={step === 2} />,
            <NoteScreen key="s3" />,
            <ReviewScreen key="s4" />,
          ]}
        />
      </div>

      <StepDots
        count={HOLDS.length}
        current={step}
        onReplay={replay}
        className="mt-4 justify-center"
      />
    </div>
  );
}

const PAD = "p-4 md:p-5";

/** 0 — 채점 결과 */
function ScoreScreen() {
  return (
    <div className={PAD}>
      <p className="text-sm font-bold leading-[1.55] text-text-high">
        이차돈의 순교로 불교를 공인하고, 율령을 반포한 신라의 왕은?
      </p>
      <ul className="mt-3.5 space-y-1.5">
        {[
          { n: "①", t: "지증왕" },
          { n: "②", t: "법흥왕", right: true },
          { n: "③", t: "진흥왕", wrong: true },
          { n: "④", t: "무열왕" },
        ].map((c) => (
          <li
            key={c.n}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium",
              c.right && "border-primary bg-primary/[0.08] text-text-high",
              c.wrong && "border-danger bg-danger/[0.07] text-danger",
              !c.right && !c.wrong && "border-border-soft text-text-muted",
            )}
          >
            <span
              className={cn(
                "font-bold",
                c.right && "text-primary",
                !c.right && !c.wrong && "text-text-muted",
              )}
            >
              {c.n}
            </span>
            <span className="flex-1">{c.t}</span>
            {c.wrong && (
              <span className="inline-flex shrink-0 items-center gap-1 text-3xs font-bold">
                내 선택
                <Xmark className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            )}
            {c.right && (
              <span className="inline-flex shrink-0 items-center gap-1 text-3xs font-bold text-primary">
                정답
                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 1 — 그 선택지용 해설 */
function ExplainScreen() {
  return (
    <div className={cn(PAD, "bg-text-high text-background")}>
      <p className="text-3xs font-bold uppercase tracking-[0.14em] text-background/60">
        ③ 을 고른 사람에게 나가는 해설
      </p>
      <p className="mt-3 text-xs leading-[1.8]">
        업적이 화려해서 손이 먼저 가는 왕이에요. 화랑도를 정비하고 한강 유역을
        차지해 순수비를 세웠죠. 그런데 그건 전부{" "}
        <strong className="font-bold">법흥왕이 만든 틀 위에서 한 확장</strong>
        이라, 순서가 뒤예요.
      </p>
      <p className="mt-4 border-t border-background/25 pt-3.5 text-2xs font-bold">
        외울 후크 · 법흥왕이 틀, 진흥왕이 확장
      </p>
    </div>
  );
}

/** 2 — 약점 진단 */
function DiagnoseScreen({ active }: { active: boolean }) {
  const rows = [
    { name: "고대 · 신라 왕 계보", pct: 32, weak: true },
    { name: "고려 · 문벌귀족", pct: 64 },
    { name: "조선 · 붕당정치", pct: 78 },
  ];
  return (
    <div className={PAD}>
      <p className="text-3xs font-bold uppercase tracking-[0.14em] text-text-muted">
        최근 34회 기준
      </p>
      <ul className="mt-3.5 space-y-3">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "text-xs",
                  r.weak ? "font-bold text-text-high" : "text-text-mid",
                )}
              >
                {r.name}
              </span>
              <span
                className={cn(
                  "text-2xs font-bold tabular-nums",
                  r.weak ? "text-danger" : "text-text-muted",
                )}
              >
                {r.pct}%
              </span>
            </div>
            <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-border">
              <span
                className={cn(
                  "block h-full rounded-full transition-[width] duration-700 ease-out",
                  r.weak ? "bg-danger" : "bg-primary/50",
                )}
                style={{ width: active ? `${r.pct}%` : "0%" }}
              />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-md bg-surface-mute px-3.5 py-3 text-2xs leading-[1.6] text-text-mid">
        <strong className="text-text-high">왕 계보</strong>에서 계속 걸리고
        계세요. 다음 세션은 이 단원 위주로 낼게요.
      </p>
    </div>
  );
}

/** 3 — 오답노트 (방금 담긴 항목이 맨 위) */
function NoteScreen() {
  const items = [
    { t: "신라 왕 계보 — 법흥왕", tag: "방금 추가", fresh: true },
    { t: "고려 문벌귀족 — 이자겸", tag: "2일 전" },
    { t: "조선 붕당 — 예송논쟁", tag: "4일 전" },
  ];
  return (
    <div className={PAD}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-text-high">
          <Bookmark className="h-4 w-4 text-primary" strokeWidth={2} />
          오답노트
        </span>
        <span className="text-2xs font-bold tabular-nums text-primary">
          13문항 · +1
        </span>
      </div>
      <ul className="mt-3.5 space-y-1.5">
        {items.map((it) => (
          <li
            key={it.t}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3.5 py-2.5",
              it.fresh
                ? "border-primary/40 bg-primary/[0.06]"
                : "border-border-soft",
            )}
          >
            <span className="flex-1 text-xs font-medium text-text-high">
              {it.t}
            </span>
            <span
              className={cn(
                "shrink-0 text-3xs font-bold",
                it.fresh ? "text-primary" : "text-text-muted",
              )}
            >
              {it.tag}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 inline-flex items-center gap-2 text-2xs text-text-mid">
        <OpenBook className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
        개념카드 <strong className="text-text-high">신라 왕 계보</strong> 도 같이
        만들어 뒀어요
      </p>
    </div>
  );
}

/** 4 — 복습 일정 */
function ReviewScreen() {
  const days = [
    { d: "오늘", n: 12 },
    { d: "내일", n: 5 },
    { d: "3일 뒤", n: 8, mark: true },
    { d: "일주일 뒤", n: 3 },
  ];
  return (
    <div className={PAD}>
      <span className="inline-flex items-center gap-2 text-xs font-bold text-text-high">
        <Refresh className="h-4 w-4 text-primary" strokeWidth={2} />
        복습 일정
      </span>
      <ul className="mt-3.5 space-y-2">
        {days.map((r) => (
          <li key={r.d} className="flex items-center gap-3">
            <span
              className={cn(
                "w-16 shrink-0 text-2xs",
                r.mark ? "font-bold text-primary" : "text-text-muted",
              )}
            >
              {r.d}
            </span>
            <span className="h-5 flex-1 overflow-hidden rounded-sm bg-border/50">
              <span
                className={cn(
                  "block h-full rounded-sm",
                  r.mark ? "bg-primary" : "bg-border",
                )}
                style={{ width: `${Math.min(r.n * 8, 100)}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-2xs tabular-nums text-text-muted">
              {r.n}문항
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-md border border-primary/40 bg-primary/[0.06] px-3.5 py-3 text-2xs leading-[1.65] text-text-mid">
        방금 그 문제는{" "}
        <strong className="font-bold text-primary">3일 뒤</strong> 비슷한 함정으로
        다시 나와요.
        <br />
        여기까지{" "}
        <strong className="font-bold text-text-high">
          누른 건 선택지 하나뿐이에요.
        </strong>
      </p>
    </div>
  );
}
