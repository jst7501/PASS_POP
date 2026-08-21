"use client";

import {
  Bookmark,
  BookmarkBook,
  CheckCircle,
  OpenBook,
  Refresh,
  Xmark,
} from "iconoir-react";
import { Cue, StepDots, useAutoSequence } from "@/components/demo-player";
import { cn } from "@/lib/utils";

/**
 * "틀린 다음에 일어나는 일" — 채점 이후 흐름을 알아서 재생한다.
 *
 * 히어로 데모는 직접 눌러보는 것이고, 이건 그 다음 이야기다.
 * 채점 → 해설 → 약점 진단 → 오답노트·개념카드 자동 생성 → 복습 예약까지가
 * 한 번에 이어져야 "개인화" 가 말이 아니라 화면으로 전달된다.
 *
 * 문항은 히어로와 같은 것을 쓴다(정답 ② 법흥왕). 여기서는 ③ 을 골라 틀린 상황.
 * 두 화면이 다른 문제를 쓰면 같은 제품이라는 느낌이 끊긴다.
 *
 * 안의 숫자는 전부 화면 예시다. 사용자 실적 지표가 아니다.
 */

const HOLDS = [1500, 3200, 2400, 1700, 1700, 3200];
const LAST = HOLDS.length - 1;

export function DemoAfterWrong() {
  const { ref, step, replay } = useAutoSequence(HOLDS);
  const at = (n: number) => step >= n;

  return (
    <div ref={ref}>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_20px_50px_-32px_rgb(var(--text-high)/0.4)]">
        {/* 상단 바 */}
        <div className="flex items-center justify-between border-b border-border-soft bg-surface-mute px-4 py-3">
          <span className="text-2xs font-semibold text-text-mid">
            한국사능력검정시험{" "}
            <span className="font-normal text-text-muted">· 심화</span>
          </span>
          <span className="text-3xs text-text-muted">채점 완료</span>
        </div>

        <div className="p-4 md:p-5">
          {/* ── 0. 채점 결과 ───────────────────────────────── */}
          <p className="text-sm font-bold leading-[1.6] text-text-high">
            이차돈의 순교로 불교를 공인하고, 율령을 반포한 신라의 왕은?
          </p>

          <ul className="mt-3 space-y-1.5">
            <li className="flex items-center gap-3 rounded-md border border-danger bg-danger/[0.07] px-3 py-2.5 text-sm font-medium text-danger">
              <span className="font-bold">③</span>
              <span className="flex-1">진흥왕</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-3xs font-bold">
                내 선택
                <Xmark className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-md border border-primary bg-primary/[0.08] px-3 py-2.5 text-sm font-medium text-text-high">
              <span className="font-bold text-primary">②</span>
              <span className="flex-1">법흥왕</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-3xs font-bold text-primary">
                정답
                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </li>
          </ul>

          {/* ── 1. 해설 ────────────────────────────────────── */}
          <Cue show={at(1)} className="mt-3">
            <div className="rounded-md bg-text-high p-4 text-background">
              <p className="text-3xs font-bold uppercase tracking-[0.14em] text-background/60">
                ③ 을 고른 사람에게 나가는 해설
              </p>
              <p className="mt-2.5 text-xs leading-[1.75]">
                업적이 화려해서 손이 먼저 가는 왕이에요. 화랑도를 정비하고 한강
                유역을 차지했죠. 그런데 그건 전부 법흥왕이 만든 틀 위에서 한
                확장이라, 순서가 뒤예요.
              </p>
              <p className="mt-3 border-t border-background/25 pt-3 text-2xs font-bold">
                외울 후크 · 법흥왕이 틀, 진흥왕이 확장
              </p>
            </div>
          </Cue>

          {/* ── 2. 약점 진단 ───────────────────────────────── */}
          <Cue show={at(2)} className="mt-3">
            <div className="rounded-md border border-border bg-surface-mute px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-text-high">
                  고대 · 신라 왕 계보
                </p>
                <span className="text-3xs font-semibold tabular-nums text-danger">
                  최근 정답률 32%
                </span>
              </div>
              <span className="mt-2.5 block h-1.5 w-full overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-danger transition-[width] duration-700 ease-out"
                  style={{ width: at(2) ? "32%" : "0%" }}
                />
              </span>
              <p className="mt-2.5 text-2xs text-text-mid">
                이 단원에서 계속 걸리고 계세요. 왕 순서를 한 번 정리하고 갈게요.
              </p>
            </div>
          </Cue>

          {/* ── 3~5. 자동으로 쌓이는 것들 ───────────────────── */}
          <div className="mt-3 space-y-1.5">
            <Cue show={at(3)}>
              <AutoRow
                Icon={Bookmark}
                title="오답노트에 담았어요"
                meta="13문항"
                metaBump
              />
            </Cue>
            <Cue show={at(4)}>
              <AutoRow
                Icon={OpenBook}
                title="개념카드를 만들었어요"
                meta="신라 왕 계보 1장"
              />
            </Cue>
            <Cue show={at(5)}>
              <AutoRow
                Icon={Refresh}
                title="복습을 예약했어요"
                meta="3일 뒤 · 비슷한 함정으로"
                highlight
              />
            </Cue>
          </div>

          {/* 마지막에 한 줄로 묶어준다 */}
          <Cue show={at(LAST)} delay={200} className="mt-4">
            <p className="flex items-start gap-2 text-2xs leading-[1.65] text-text-mid">
              <BookmarkBook
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                strokeWidth={2.5}
              />
              <span>
                여기까지{" "}
                <strong className="font-bold text-text-high">
                  누른 건 선택지 하나뿐이에요.
                </strong>{" "}
                노트도 복습도 알아서 쌓입니다.
              </span>
            </p>
          </Cue>
        </div>
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

function AutoRow({
  Icon,
  title,
  meta,
  metaBump,
  highlight,
}: {
  Icon: typeof Bookmark;
  title: string;
  meta: string;
  /** 숫자가 방금 하나 늘었다는 표시 */
  metaBump?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border px-3.5 py-2.5",
        highlight
          ? "border-primary/40 bg-primary/[0.06]"
          : "border-border-soft bg-surface",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          highlight ? "text-primary" : "text-text-muted",
        )}
        strokeWidth={2}
      />
      <span className="flex-1 text-xs font-semibold text-text-high">
        {title}
      </span>
      <span
        className={cn(
          "shrink-0 text-3xs font-bold tabular-nums",
          metaBump ? "text-primary" : "text-text-muted",
        )}
      >
        {metaBump && "+1 · "}
        {meta}
      </span>
    </div>
  );
}
