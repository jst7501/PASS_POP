import Link from "next/link";
import {
  NavArrowLeft,
  NavArrowRight,
  ShieldCheck,
  User,
  BookStack,
  XmarkCircle,
  Bookmark,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { AttemptMode } from "@/lib/generated/prisma-client";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<AttemptMode, string> = {
  EXAM: "모의고사",
  PRACTICE: "연습",
  REVIEW: "오답 복습",
  WEAK: "약점 집중",
};

export default async function AdminPage() {
  // 접근 제한 없음 — 주소를 아는 사람은 누구나 볼 수 있다.
  // robots.txt 로 색인만 막아둔 상태이므로 주소가 알려지면 막을 방법이 없다.
  // 다시 잠그려면 여기서 getCurrentUser() 로 걸거나 /admin 을 미들웨어로 감싼다.

  const users = await prisma.user.findMany({
    where: { nickname: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          attempts: true,
          answerRecords: true,
          bookmarks: true,
        },
      },
    },
  });

  const recentAttempts = await prisma.attempt.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      user: { select: { nickname: true, id: true } },
      exam: { include: { category: true } },
    },
  });

  const [totalRecords, totalWrong, totalBookmarks] = await Promise.all([
    prisma.answerRecord.count(),
    prisma.answerRecord.count({ where: { isCorrect: false, skipped: false } }),
    prisma.bookmark.count(),
  ]);

  const statsByUser = await Promise.all(
    users.map(async (u) => {
      const finished = await prisma.attempt.findMany({
        where: { userId: u.id, finishedAt: { not: null } },
        select: { score: true, finishedAt: true },
        orderBy: { finishedAt: "desc" },
        take: 10,
      });
      const scores = finished
        .map((a) => a.score)
        .filter((s): s is number => s != null);
      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : null;
      const lastActive = finished[0]?.finishedAt ?? null;
      return {
        id: u.id,
        nickname: u.nickname!,
        streakDays: u.streakDays,
        lastActivityDate: u.lastActivityDate,
        createdAt: u.createdAt,
        avgScore: avg,
        completed: scores.length,
        attempts: u._count.attempts,
        records: u._count.answerRecords,
        bookmarks: u._count.bookmarks,
        lastActive,
      };
    }),
  );

  statsByUser.sort((a, b) => {
    if (a.nickname === "관리자") return 1;
    if (b.nickname === "관리자") return -1;
    const at = a.lastActive?.getTime() ?? 0;
    const bt = b.lastActive?.getTime() ?? 0;
    return bt - at;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted">
        <Link
          href="/"
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />홈
        </Link>
      </nav>

      <header className="mt-3">
        <div className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-2 py-0.5">
          <ShieldCheck className="h-3 w-3 text-primary" strokeWidth={2.5} />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
            Admin
          </p>
        </div>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          전체 현황
        </h1>
        <p className="mt-1 text-[13px] text-text-mid">
          가입한 분들 모두의 데이터를 봅니다. 읽기 전용.
        </p>
      </header>

      <section className="mt-6">
        <ul className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-surface sm:grid-cols-4">
          <TotalCell
            icon={<User className="h-3.5 w-3.5" strokeWidth={2} />}
            label="유저"
            value={users.length}
            suffix="명"
          />
          <TotalCell
            icon={<BookStack className="h-3.5 w-3.5" strokeWidth={2} />}
            label="총 답안"
            value={totalRecords}
            suffix="개"
            bordered
          />
          <TotalCell
            icon={<XmarkCircle className="h-3.5 w-3.5" strokeWidth={2} />}
            label="오답"
            value={totalWrong}
            suffix="개"
            bordered
          />
          <TotalCell
            icon={<Bookmark className="h-3.5 w-3.5" strokeWidth={2} />}
            label="북마크"
            value={totalBookmarks}
            suffix="개"
            bordered
          />
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-text-high md:text-[18px]">
          유저
        </h2>
        <div className="mt-3 overflow-hidden rounded-md border border-border bg-surface">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr] gap-2 border-b border-border bg-surface-mute px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-muted md:px-5">
            <span>닉네임</span>
            <span className="text-right">연속</span>
            <span className="text-right">완료</span>
            <span className="text-right">평균점</span>
            <span className="text-right">답안</span>
            <span className="text-right">최근활동</span>
          </div>
          <ul className="divide-y divide-border-soft">
            {statsByUser.map((u) => (
              <li key={u.id}>
                <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-2 px-4 py-3 text-[13px] md:px-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold",
                        u.nickname === "관리자"
                          ? "bg-primary text-primary-fg"
                          : "bg-text-high text-background",
                      )}
                    >
                      {u.nickname.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate font-semibold text-text-high">
                      {u.nickname}
                    </span>
                  </div>
                  <span className="text-right tabular-nums text-text-mid">
                    {u.streakDays}일
                  </span>
                  <span className="text-right tabular-nums text-text-mid">
                    {u.completed}
                  </span>
                  <span
                    className={cn(
                      "text-right tabular-nums font-semibold",
                      u.avgScore == null
                        ? "text-text-muted"
                        : u.avgScore >= 60
                          ? "text-accent"
                          : "text-danger",
                    )}
                  >
                    {u.avgScore ?? "—"}
                  </span>
                  <span className="text-right tabular-nums text-text-mid">
                    {u.records}
                  </span>
                  <span className="text-right text-[11.5px] tabular-nums text-text-muted">
                    {u.lastActive ? formatShortDate(u.lastActive) : "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-text-high md:text-[18px]">
          최근 풀이
        </h2>
        <ul className="mt-3 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
          {recentAttempts.map((a) => {
            const title =
              a.exam?.title ?? `${a.exam?.category.name ?? "연습"} 세션`;
            const href = a.finishedAt
              ? `/practice/${a.id}/result`
              : `/practice/${a.id}`;
            return (
              <li key={a.id}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-mute md:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11.5px] text-text-muted">
                      <span className="font-semibold text-text-mid">
                        {a.user.nickname ?? "익명"}
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <span>{MODE_LABEL[a.mode]}</span>
                      <span className="h-3 w-px bg-border" />
                      <span className="tabular-nums">
                        {formatShortDate(a.startedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13.5px] font-semibold text-text-high">
                      {title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pl-3">
                    {a.finishedAt && a.score != null ? (
                      <span
                        className={cn(
                          "text-[18px] font-bold tabular-nums tracking-[-0.01em]",
                          a.score >= 60 ? "text-accent" : "text-danger",
                        )}
                      >
                        {a.score}
                      </span>
                    ) : (
                      <span className="rounded-sm bg-warning/15 px-1.5 py-0 text-[10px] font-semibold text-warning">
                        진행중
                      </span>
                    )}
                    <NavArrowRight
                      className="h-4 w-4 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-text-high"
                      strokeWidth={2}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function TotalCell({
  icon,
  label,
  value,
  suffix,
  bordered,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  bordered?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex flex-col px-4 py-3.5",
        bordered && "sm:border-l border-border",
      )}
    >
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        {icon}
        {label}
      </span>
      <span className="mt-1.5 flex items-baseline gap-0.5">
        <span className="text-[22px] font-bold tabular-nums text-text-high">
          {value}
        </span>
        <span className="text-[11px] font-medium text-text-muted">
          {suffix}
        </span>
      </span>
    </li>
  );
}

function formatShortDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}
