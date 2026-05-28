import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NavArrowLeft,
  Download,
  CheckCircle,
  XmarkCircle,
  Clock,
  WarningTriangle,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { cn } from "@/lib/utils";
import { WaitlistRowActions } from "./row-actions";
import { ExportCsvButton } from "./export-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  CONFIRMED: "확인",
  UNSUBSCRIBED: "수신거부",
  SPAM: "스팸",
};

export default async function WaitlistAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || me.nickname !== "관리자") notFound();

  const sp = await searchParams;
  const status = sp.status?.toUpperCase();
  const q = sp.q?.trim() ?? "";

  const where = {
    AND: [
      status && ["PENDING", "CONFIRMED", "UNSUBSCRIBED", "SPAM"].includes(status)
        ? { status: status as never }
        : {},
      q ? { email: { contains: q.toLowerCase(), mode: "insensitive" as const } } : {},
    ],
  };

  const [items, total, pending, confirmed, unsub, spam, todayCount, weekCount] =
    await Promise.all([
      prisma.waitlist.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.waitlist.count(),
      prisma.waitlist.count({ where: { status: "PENDING" } }),
      prisma.waitlist.count({ where: { status: "CONFIRMED" } }),
      prisma.waitlist.count({ where: { status: "UNSUBSCRIBED" } }),
      prisma.waitlist.count({ where: { status: "SPAM" } }),
      prisma.waitlist.count({
        where: { createdAt: { gte: startOfDayKST() } },
      }),
      prisma.waitlist.count({
        where: { createdAt: { gte: daysAgoKST(7) } },
      }),
    ]);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-6">
      <nav className="text-[12.5px] text-text-muted">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          관리자
        </Link>
      </nav>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Waitlist
          </p>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] md:text-[32px]">
            오픈 알림 신청 명단
          </h1>
          <p className="mt-1 text-[13px] text-text-mid">
            랜딩 페이지 폼에서 수집된 이메일. 오픈 시 일괄 발송용.
          </p>
        </div>
        <ExportCsvButton />
      </header>

      {/* 지표 */}
      <ul className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface md:grid-cols-5">
        <KpiCell label="총합" value={total} accent="default" />
        <KpiCell label="오늘" value={todayCount} accent="primary" border />
        <KpiCell label="최근 7일" value={weekCount} accent="default" border />
        <KpiCell label="대기" value={pending} accent="default" border />
        <KpiCell label="확인됨" value={confirmed} accent="accent" border />
      </ul>

      {/* 필터 */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <form
          method="get"
          action="/admin/waitlist"
          className="flex items-center gap-2"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="이메일 검색…"
            className="h-9 w-60 rounded-md border border-border bg-surface px-3 text-[13px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-text-high px-3 text-[12.5px] font-semibold text-background hover:opacity-90"
          >
            검색
          </button>
        </form>
        <nav className="flex flex-wrap items-center gap-1.5">
          <FilterLink current={status} target={undefined} q={q}>
            전체
          </FilterLink>
          <FilterLink current={status} target="PENDING" q={q}>
            대기 ({pending})
          </FilterLink>
          <FilterLink current={status} target="CONFIRMED" q={q}>
            확인 ({confirmed})
          </FilterLink>
          <FilterLink current={status} target="UNSUBSCRIBED" q={q}>
            거부 ({unsub})
          </FilterLink>
          <FilterLink current={status} target="SPAM" q={q}>
            스팸 ({spam})
          </FilterLink>
        </nav>
      </div>

      {/* 테이블 */}
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        {items.length === 0 ? (
          <p className="p-10 text-center text-[13px] text-text-muted">
            조건에 맞는 신청자가 없어요.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface-mute/50 text-[10.5px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 md:px-5">이메일</th>
                  <th className="px-4 py-2.5 md:px-5">상태</th>
                  <th className="px-4 py-2.5 md:px-5">출처</th>
                  <th className="px-4 py-2.5 md:px-5">가입일</th>
                  <th className="px-4 py-2.5 text-right md:px-5">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-mute/40"
                  >
                    <td className="px-4 py-3 md:px-5">
                      <a
                        href={`mailto:${row.email}`}
                        className="font-mono font-semibold text-text-high hover:text-primary hover:underline"
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 md:px-5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted md:px-5">
                      {row.source ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-text-mid md:px-5">
                      {formatKstDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right md:px-5">
                      <WaitlistRowActions
                        id={row.id}
                        currentStatus={row.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {items.length === 500 && (
        <p className="mt-3 text-center text-[11.5px] text-text-muted">
          최대 500건만 표시. 전체는 CSV 다운로드를 사용하세요.
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === "PENDING"
      ? Clock
      : status === "CONFIRMED"
        ? CheckCircle
        : status === "UNSUBSCRIBED"
          ? XmarkCircle
          : WarningTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        status === "PENDING" && "bg-text-mid/15 text-text-mid",
        status === "CONFIRMED" && "bg-accent/15 text-accent",
        status === "UNSUBSCRIBED" && "bg-text-muted/15 text-text-muted",
        status === "SPAM" && "bg-danger/15 text-danger",
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function FilterLink({
  current,
  target,
  q,
  children,
}: {
  current?: string;
  target?: string;
  q?: string;
  children: React.ReactNode;
}) {
  const isActive =
    (current ?? "") === (target ?? "") || (!current && !target);
  const url = new URL("https://x.local/admin/waitlist");
  if (target) url.searchParams.set("status", target);
  if (q) url.searchParams.set("q", q);
  return (
    <Link
      href={url.pathname + url.search}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-[11.5px] font-semibold transition-colors",
        isActive
          ? "border-text-high bg-text-high text-background"
          : "border-border bg-surface text-text-mid hover:border-text-mid hover:text-text-high",
      )}
    >
      {children}
    </Link>
  );
}

function KpiCell({
  label,
  value,
  accent,
  border,
}: {
  label: string;
  value: number;
  accent: "default" | "primary" | "accent";
  border?: boolean;
}) {
  const color =
    accent === "primary"
      ? "text-primary"
      : accent === "accent"
        ? "text-accent"
        : "text-text-high";
  return (
    <li
      className={cn(
        "px-5 py-4",
        border && "border-l border-border-soft md:border-l",
      )}
    >
      <p className="text-[10.5px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[24px] font-extrabold tabular-nums leading-none tracking-[-0.02em]",
          color,
        )}
      >
        {value.toLocaleString("ko-KR")}
      </p>
    </li>
  );
}

function formatKstDateTime(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(/\.\s*/g, "-")
    .replace(/-$/, "");
}

function startOfDayKST(): Date {
  const now = new Date();
  // KST 자정 — UTC 기준 어제 15:00:00Z
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const ymd = kst.toISOString().slice(0, 10);
  return new Date(`${ymd}T00:00:00+09:00`);
}

function daysAgoKST(n: number): Date {
  const d = startOfDayKST();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
