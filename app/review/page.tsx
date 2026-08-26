import Link from "next/link";
import {
  NavArrowLeft,
  NavArrowRight,
  XmarkCircle,
  Bookmark as BookmarkIcon,
  Flash,
  CheckCircle,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { ReviewStartButton } from "@/components/review-start-button";
import { getQuickStarts } from "@/lib/quick-start";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export default async function ReviewHubPage() {
  const user = await getCurrentUser();
  if (!user) return <EmptyScreen />;

  const now = new Date();
  const [mistakeCount, bookmarkCount, srsDueCount, srsAll] = await Promise.all([
    prisma.answerRecord.count({
      where: { userId: user.id, isCorrect: false, skipped: false },
    }),
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.reviewSchedule.count({
      where: { userId: user.id, nextReviewAt: { lte: now } },
    }),
    prisma.reviewSchedule.findMany({
      where: { userId: user.id },
      select: { nextReviewAt: true },
    }),
  ]);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // SRS 분포 — 오늘 / 내일 / 2-3일 / 4-7일 / 8+
  const srsBuckets = [
    { label: "오늘", count: 0 },
    { label: "내일", count: 0 },
    { label: "2-3일", count: 0 },
    { label: "4-7일", count: 0 },
    { label: "8일+", count: 0 },
  ];
  for (const s of srsAll) {
    const days = Math.floor(
      (s.nextReviewAt.getTime() - todayStart.getTime()) / 86400000,
    );
    if (days <= 0) srsBuckets[0].count += 1;
    else if (days === 1) srsBuckets[1].count += 1;
    else if (days <= 3) srsBuckets[2].count += 1;
    else if (days <= 7) srsBuckets[3].count += 1;
    else srsBuckets[4].count += 1;
  }

  const total = mistakeCount + bookmarkCount + srsDueCount;

  if (total === 0) return <EmptyScreen />;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted">
        <Link
          href="/"
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />홈
        </Link>
      </nav>

      <header className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Review
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          복습 모음
        </h1>
        <p className="mt-2 text-[13px] text-text-mid">
          오늘 풀어야 할 거리 한 곳에. 시작 버튼 하나로 바로 풀이.
        </p>
      </header>

      <ul className="mt-6 space-y-3">
        {srsDueCount > 0 && (
          <ReviewCard
            tone="accent"
            icon={<Flash className="h-4 w-4" strokeWidth={2.5} />}
            title="오늘 복습할 문제"
            count={srsDueCount}
            sub="잊을 때쯤 자동으로 다시 나오는 문제"
            source="srs"
            buttonLabel="복습 시작"
          />
        )}
        {mistakeCount > 0 && (
          <ReviewCard
            tone="danger"
            icon={<XmarkCircle className="h-4 w-4" strokeWidth={2} />}
            title="누적 오답"
            count={mistakeCount}
            sub="지금까지 틀린 문제 모두 (최대 30문)"
            source="mistakes"
            buttonLabel="오답만 풀기"
          />
        )}
        {bookmarkCount > 0 && (
          <ReviewCard
            tone="primary"
            icon={<BookmarkIcon className="h-4 w-4" strokeWidth={2} />}
            title="북마크"
            count={bookmarkCount}
            sub="나중에 보려고 표시한 문제"
            source="bookmarks"
            buttonLabel="북마크 풀기"
          />
        )}
      </ul>

      {mistakeCount > 0 && (
        <Link
          href="/note"
          className="mt-3 flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3.5 transition-colors hover:border-primary/40 hover:bg-surface-elev"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-semibold text-text-high">
              단권화 노트
            </p>
            <p className="mt-0.5 text-[12.5px] text-text-muted">
              틀린 문제의 암기 후크만 한 장으로. 시험 전날용
            </p>
          </div>
          <NavArrowRight
            className="h-4 w-4 shrink-0 text-text-muted"
            strokeWidth={2}
          />
        </Link>
      )}

      {/* SRS 분포 */}
      {srsAll.length > 0 && (
        <section className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            앞으로 일정
          </p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-text-high">
            며칠 뒤 무엇이 나올까
          </h2>
          <div className="mt-3 rounded-md border border-border bg-surface p-4">
            <ul className="flex h-24 items-end gap-2">
              {srsBuckets.map((b) => {
                const max = Math.max(...srsBuckets.map((x) => x.count), 1);
                const h = (b.count / max) * 100;
                const isToday = b.label === "오늘" && b.count > 0;
                return (
                  <li
                    key={b.label}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10.5px] font-semibold tabular-nums text-text-mid">
                      {b.count}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-t-sm",
                        isToday ? "bg-primary" : "bg-text-mid/30",
                      )}
                      style={{
                        height:
                          b.count > 0
                            ? `${Math.max(Math.round((h / 100) * 60), 4)}px`
                            : "2px",
                      }}
                    />
                    <span
                      className={cn(
                        "text-[10.5px]",
                        isToday
                          ? "font-semibold text-primary"
                          : "text-text-muted",
                      )}
                    >
                      {b.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewCard({
  tone,
  icon,
  title,
  count,
  sub,
  source,
  buttonLabel,
}: {
  tone: "accent" | "danger" | "primary";
  icon: React.ReactNode;
  title: string;
  count: number;
  sub: string;
  source: "mistakes" | "bookmarks" | "srs";
  buttonLabel: string;
}) {
  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border bg-surface p-4 md:p-5",
          tone === "accent" && "border-accent/30 bg-accent/[0.04]",
          tone === "danger" && "border-danger/30 bg-danger/[0.03]",
          tone === "primary" && "border-primary/30 bg-primary/[0.04]",
        )}
      >
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
            tone === "accent" && "bg-accent/15 text-accent",
            tone === "danger" && "bg-danger/15 text-danger",
            tone === "primary" && "bg-primary/15 text-primary",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 text-[14px] font-semibold text-text-high">
            {title}
            <span
              className={cn(
                "tabular-nums text-[15px] font-bold",
                tone === "accent" && "text-accent",
                tone === "danger" && "text-danger",
                tone === "primary" && "text-primary",
              )}
            >
              {count}
            </span>
            <span className="text-[11px] font-medium text-text-muted">문</span>
          </p>
          <p className="mt-0.5 text-[11.5px] text-text-mid">{sub}</p>
        </div>
        <ReviewStartButton source={source} label={buttonLabel} />
      </div>
    </li>
  );
}

async function EmptyScreen() {
  const quickStarts = await getQuickStarts().catch(() => []);
  return (
    <EmptyState
      icon={<CheckCircle className="h-6 w-6" strokeWidth={1.5} />}
      title="지금은 복습할 거리가 없어요"
      description="문제를 풀고 나면 틀린 문제·북마크·다시 볼 날짜가 여기 한곳에 모여요."
      primary={
        quickStarts.length ? undefined : { href: "/exams", label: "문제 풀러 가기" }
      }
      quickStarts={quickStarts}
    />
  );
}
