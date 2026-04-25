import Link from "next/link";
import {
  NavArrowLeft,
  NavArrowRight,
  Timer,
  BookStack,
  GraphUp,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { AttemptMode } from "@/lib/generated/prisma-client";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<AttemptMode, string> = {
  EXAM: "모의고사",
  PRACTICE: "연습",
  REVIEW: "오답 복습",
  WEAK: "약점 집중",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <EmptyScreen />;

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      exam: { include: { category: true } },
      _count: { select: { records: true } },
    },
  });

  if (attempts.length === 0) return <EmptyScreen />;

  // 과목별 정답률 (레이더용)
  const recordsForRadar = await prisma.answerRecord.findMany({
    where: { userId: user.id },
    select: {
      isCorrect: true,
      question: { select: { subject: { select: { name: true, slug: true } } } },
    },
  });
  const subjectMap = new Map<
    string,
    { name: string; total: number; correct: number }
  >();
  for (const r of recordsForRadar) {
    const key = r.question.subject.slug;
    const cur = subjectMap.get(key) ?? {
      name: r.question.subject.name,
      total: 0,
      correct: 0,
    };
    cur.total += 1;
    if (r.isCorrect) cur.correct += 1;
    subjectMap.set(key, cur);
  }
  const subjects = Array.from(subjectMap.values())
    .filter((s) => s.total >= 3)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // 느린 문제 Top 5
  const slowRecords = await prisma.answerRecord.findMany({
    where: { userId: user.id, timeSpentSec: { gt: 0 } },
    orderBy: { timeSpentSec: "desc" },
    take: 5,
    include: {
      question: {
        select: {
          number: true,
          stem: true,
          subject: { select: { name: true } },
        },
      },
    },
  });

  const finished = attempts.filter((a) => a.finishedAt);
  const totalAttempts = attempts.length;
  const completedCount = finished.length;
  const avgScore =
    finished.length > 0
      ? Math.round(
          finished.reduce((s, a) => s + (a.score ?? 0), 0) / finished.length,
        )
      : 0;

  const scoredAttempts = finished
    .map((a) => a.score)
    .filter((s): s is number => s != null);
  const passProb = computePassProb(scoredAttempts);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 md:px-6">
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
          My Records
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          내 기록
        </h1>
      </header>

      <section className="mt-6">
        <ul className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-surface sm:grid-cols-4">
          <StatCell label="총 세션" value={totalAttempts} suffix="개" />
          <StatCell
            label="완료"
            value={completedCount}
            suffix="개"
            bordered
          />
          <StatCell
            label="평균 점수"
            value={avgScore}
            suffix="점"
            tone={avgScore >= 60 ? "accent" : "default"}
            bordered
          />
          <StatCell
            label="합격 예측"
            value={passProb}
            suffix="%"
            tone={passProb != null && passProb >= 60 ? "accent" : "muted"}
            bordered
          />
        </ul>
      </section>

      {subjects.length >= 3 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Skill Map
              </p>
              <h2 className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-text-high">
                과목별 정답률
              </h2>
            </div>
            <p className="text-[11.5px] text-text-muted">
              최근 풀이 전체 기준
            </p>
          </div>
          <div className="mt-4 rounded-md border border-border bg-surface p-5">
            <RadarChart
              subjects={subjects.map((s) => ({
                name: s.name,
                rate: Math.round((s.correct / s.total) * 100),
                total: s.total,
              }))}
            />
          </div>
        </section>
      )}

      {passProb != null && scoredAttempts.length >= 1 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Prediction
              </p>
              <h2 className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-text-high">
                합격 예측
              </h2>
            </div>
            <p className="text-[11.5px] text-text-muted">
              모의고사 {scoredAttempts.length}회 기준
            </p>
          </div>
          <div className="mt-4 rounded-md border border-border bg-surface p-5">
            <div className="flex items-baseline gap-3">
              <span
                className={cn(
                  "text-[42px] font-bold tabular-nums tracking-[-0.03em] md:text-[52px]",
                  passProb >= 60 ? "text-accent" : "text-text-high",
                )}
              >
                {passProb}
              </span>
              <span className="text-[16px] text-text-muted">%</span>
            </div>
            <p className="mt-2 text-[13px] text-text-mid">
              {passProb >= 70
                ? "합격권. 지금 페이스 유지만 해도 붙어요."
                : passProb >= 50
                  ? "합격 턱 밑. 오답 위주로 한 번만 더 긁어내면 돼요."
                  : "아직 거리가 있어요. 과목 편차부터 줄여봐요."}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-sm bg-border-soft">
              <div
                className={cn(
                  "h-full",
                  passProb >= 60 ? "bg-accent" : "bg-primary",
                )}
                style={{ width: `${passProb}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10.5px] text-text-muted">
              <span>0%</span>
              <span>60% 합격선</span>
              <span>100%</span>
            </div>
          </div>
        </section>
      )}

      {slowRecords.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Time
              </p>
              <h2 className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-text-high">
                오래 붙잡은 문제
              </h2>
            </div>
            <p className="text-[11.5px] text-text-muted">시간 기준 Top 5</p>
          </div>
          <ul className="mt-4 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
            {slowRecords.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 px-4 py-3 md:px-5"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-surface-mute text-text-mid">
                  <Timer className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-high">
                    Q.{String(r.question.number).padStart(2, "0")} ·{" "}
                    {r.question.subject.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11.5px] text-text-muted">
                    {stripTags(r.question.stem)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[13px] font-semibold tabular-nums",
                    r.isCorrect ? "text-accent" : "text-danger",
                  )}
                >
                  {formatSec(r.timeSpentSec)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          History
        </p>
        <h2 className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-text-high">
          풀이 이력
        </h2>

        <ul className="mt-4 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
          {attempts.map((a) => {
            const isDone = !!a.finishedAt;
            const href = isDone
              ? `/practice/${a.id}/result`
              : `/practice/${a.id}`;
            const duration =
              a.finishedAt && a.startedAt
                ? Math.round(
                    (a.finishedAt.getTime() - a.startedAt.getTime()) /
                      1000 /
                      60,
                  )
                : null;
            const title =
              a.exam?.title ?? `${a.exam?.category.name ?? "연습"} 세션`;

            return (
              <li key={a.id}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-mute md:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span className="tabular-nums">
                        {formatDate(a.startedAt)}
                      </span>
                      <span>·</span>
                      <span className="font-medium text-text-mid">
                        {MODE_LABEL[a.mode]}
                      </span>
                      {!isDone && (
                        <span className="rounded-sm bg-warning/15 px-1.5 py-0 text-[10px] font-semibold text-warning">
                          진행중
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 truncate text-[14px] font-semibold text-text-high">
                      {title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <BookStack className="h-3 w-3" strokeWidth={2} />
                        <span className="tabular-nums">
                          {a._count.records}/{a.totalMax ?? "?"}
                        </span>
                      </span>
                      {duration != null && (
                        <span className="inline-flex items-center gap-1">
                          <Timer className="h-3 w-3" strokeWidth={2} />
                          <span className="tabular-nums">{duration}분</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-3">
                    {isDone && a.score != null && (
                      <div className="text-right">
                        <div
                          className={cn(
                            "text-[22px] font-bold tabular-nums tracking-[-0.02em]",
                            a.score >= 60 ? "text-accent" : "text-danger",
                          )}
                        >
                          {a.score}
                        </div>
                      </div>
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

function StatCell({
  label,
  value,
  suffix,
  tone,
  bordered,
}: {
  label: string;
  value: number | null;
  suffix: string;
  tone?: "accent" | "default" | "muted";
  bordered?: boolean;
}) {
  const colorCls =
    tone === "accent"
      ? "text-accent"
      : tone === "muted"
        ? "text-text-muted"
        : "text-text-high";
  return (
    <li
      className={cn(
        "flex flex-col px-4 py-3.5",
        bordered && "sm:border-l border-border",
      )}
    >
      <span className="text-[11px] font-medium text-text-muted">{label}</span>
      <span className="mt-1.5 flex items-baseline gap-0.5">
        <span
          className={cn(
            "text-[22px] font-bold tabular-nums leading-none tracking-[-0.01em] md:text-[24px]",
            colorCls,
          )}
        >
          {value ?? "—"}
        </span>
        {value != null && (
          <span className="text-[11px] font-medium text-text-muted">
            {suffix}
          </span>
        )}
      </span>
    </li>
  );
}

function RadarChart({
  subjects,
}: {
  subjects: { name: string; rate: number; total: number }[];
}) {
  const n = subjects.length;
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;

  const angleFor = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pointOnAxis = (i: number, r: number) => {
    const a = angleFor(i);
    return {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
    };
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = subjects.map((s, i) =>
    pointOnAxis(i, (radius * s.rate) / 100),
  );
  const pathData = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="flex flex-col items-center md:flex-row md:gap-8">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-64 w-64 shrink-0 md:h-72 md:w-72"
        aria-hidden="true"
      >
        {rings.map((r, ri) => (
          <polygon
            key={ri}
            points={Array.from({ length: n })
              .map((_, i) => {
                const p = pointOnAxis(i, radius * r);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: n }).map((_, i) => {
          const p = pointOnAxis(i, radius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgb(var(--border-soft))"
              strokeWidth={1}
            />
          );
        })}
        <path
          d={`${pathData} Z`}
          fill="rgb(var(--primary) / 0.18)"
          stroke="rgb(var(--primary))"
          strokeWidth={1.5}
        />
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="rgb(var(--primary))"
          />
        ))}
        {subjects.map((s, i) => {
          const p = pointOnAxis(i, radius + 20);
          const anchor =
            Math.abs(p.x - cx) < 5
              ? "middle"
              : p.x > cx
                ? "start"
                : "end";
          return (
            <text
              key={s.name}
              x={p.x}
              y={p.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-text-mid"
              style={{ fontSize: 10, fontWeight: 500 }}
            >
              {truncate(s.name, 8)}
            </text>
          );
        })}
      </svg>
      <ul className="mt-4 grid w-full grid-cols-2 gap-x-4 gap-y-2 md:mt-0 md:flex-1">
        {subjects.map((s) => (
          <li
            key={s.name}
            className="flex items-baseline justify-between text-[12.5px]"
          >
            <span className="truncate text-text-mid">{s.name}</span>
            <span
              className={cn(
                "shrink-0 font-semibold tabular-nums",
                s.rate >= 60 ? "text-accent" : "text-danger",
              )}
            >
              {s.rate}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function computePassProb(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const k = 0.12;
  const raw = 1 / (1 + Math.exp(-k * (avg - 60)));
  const confidence = Math.min(scores.length / 3, 1);
  const prob = 0.5 + (raw - 0.5) * confidence;
  return Math.round(prob * 100);
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/\$[^$]+\$/g, "[식]")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSec(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(d: Date): string {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

function EmptyScreen() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
      <GraphUp className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
      <h1 className="mt-4 text-[22px] font-bold tracking-[-0.01em] text-text-high">
        아직 풀이 이력이 없어요
      </h1>
      <p className="mt-3 max-w-xs text-[13.5px] leading-[1.6] text-text-mid">
        시험 한 회차만 풀어도 여기에 기록이 쌓여요. 점수 변화도 같이 보실 수
        있고요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
      >
        시험 둘러보기
        <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
