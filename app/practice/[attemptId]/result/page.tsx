import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  NavArrowLeft,
  NavArrowRight,
  CheckCircle,
  XmarkCircle,
  Timer,
  Sparks,
  Flash,
  WarningTriangle,
  Hourglass,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { MathText } from "@/components/practice/math-text";
import { ExplanationHtml } from "@/components/practice/explanation-html";
import { getQuestionImages, type QuestionImages } from "@/lib/exam-images";
import { LocalResult } from "@/components/practice/local-result";
import { passRuleFor, judge, type PassVerdict } from "@/lib/exam-rules";
import { cn } from "@/lib/utils";
import { HookText } from "@/components/hook-text";

const PASS_THRESHOLD = 60;

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  // 로컬(localStorage) 결과 — DB 미사용 JSON 종목
  if (attemptId.startsWith("local-")) {
    return <LocalResult attemptId={attemptId} />;
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { category: true } },
      records: {
        include: {
          question: {
            include: {
              subject: { include: { category: true } },
              // 문제별 원본 회차 — attempt.examId 가 null 인 모드도 매니페스트 매칭
              exam: { select: { pdfUrl: true } },
              explanations: true,
            },
          },
        },
      },
    },
  });
  if (!attempt) notFound();

  const user = await getCurrentUser();
  if (!user || user.id !== attempt.userId) return <Denied />;

  if (!attempt.finishedAt) redirect(`/practice/${attemptId}`);

  const byQid = new Map(attempt.records.map((r) => [r.questionId, r]));
  const records = attempt.plannedQuestionIds
    .map((id) => byQid.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  // 문제별 pdfUrl 로 매니페스트 조회 (과목별/무작위/데일리 모드도 작동)
  const imagesByQuestion = new Map<string, QuestionImages | null>();
  for (const r of records) {
    imagesByQuestion.set(
      r.questionId,
      getQuestionImages(r.question.exam?.pdfUrl ?? null, r.question.number),
    );
  }

  const total = records.length;
  const correctCount = records.filter((r) => r.isCorrect).length;
  const wrongCount = records.filter((r) => !r.isCorrect && !r.skipped).length;
  const skippedCount = records.filter((r) => r.skipped).length;
  const scorePct = attempt.score ?? 0;

  const totalTimeSec = records.reduce((s, r) => s + r.timeSpentSec, 0);
  const timed = records.filter((r) => r.timeSpentSec > 0);
  const avgTimeSec =
    timed.length > 0
      ? Math.round(timed.reduce((s, r) => s + r.timeSpentSec, 0) / timed.length)
      : 0;

  // 단원별 종합
  const subMap = new Map<
    string,
    {
      name: string;
      slug: string;
      orderIdx: number;
      total: number;
      correct: number;
      timeSec: number;
    }
  >();
  for (const r of records) {
    const k = r.question.subject.slug;
    const cur = subMap.get(k);
    if (cur) {
      cur.total += 1;
      if (r.isCorrect) cur.correct += 1;
      cur.timeSec += r.timeSpentSec;
    } else {
      subMap.set(k, {
        name: r.question.subject.name,
        slug: k,
        orderIdx: r.question.subject.orderIdx,
        total: 1,
        correct: r.isCorrect ? 1 : 0,
        timeSec: r.timeSpentSec,
      });
    }
  }
  const subjects = Array.from(subMap.values())
    .sort((a, b) => a.orderIdx - b.orderIdx)
    .map((s) => ({
      ...s,
      rate: s.total > 0 ? s.correct / s.total : 0,
      avgSec: s.total > 0 ? Math.round(s.timeSec / s.total) : 0,
    }));

  const bestSubject = [...subjects]
    .filter((s) => s.total >= 2)
    .sort((a, b) => b.rate - a.rate)[0];
  const worstSubject = [...subjects]
    .filter((s) => s.total >= 2)
    .sort((a, b) => a.rate - b.rate)[0];
  const slowestSubject = [...subjects]
    .filter((s) => s.total >= 2)
    .sort((a, b) => b.avgSec - a.avgSec)[0];

  // 시간 버킷 (0-30 / 30-60 / 60-120 / 120+)
  const timeBuckets = [
    { name: "30초 이하", from: 0, to: 30, total: 0, correct: 0 },
    { name: "30-60초", from: 30, to: 60, total: 0, correct: 0 },
    { name: "1-2분", from: 60, to: 120, total: 0, correct: 0 },
    { name: "2분 이상", from: 120, to: Infinity, total: 0, correct: 0 },
  ];
  for (const r of timed) {
    const t = r.timeSpentSec;
    const b = timeBuckets.find((b) => t >= b.from && t < b.to);
    if (!b) continue;
    b.total += 1;
    if (r.isCorrect) b.correct += 1;
  }

  // 풀이 흐름 — 3구간 (전반/중반/후반)
  const thirdSize = Math.ceil(total / 3);
  const thirds = [
    { name: "전반", correct: 0, total: 0 },
    { name: "중반", correct: 0, total: 0 },
    { name: "후반", correct: 0, total: 0 },
  ];
  records.forEach((r, i) => {
    const idx = Math.min(2, Math.floor(i / thirdSize));
    thirds[idx].total += 1;
    if (r.isCorrect) thirds[idx].correct += 1;
  });

  // 사분면 — 평균 시간 기준
  const quad = {
    fastCorrect: 0, // 빠르게 맞춤 (실력)
    fastWrong: 0, // 빠르게 틀림 (성급)
    slowCorrect: 0, // 오래 풀고 맞춤 (집요)
    slowWrong: 0, // 오래 풀고 틀림 (진짜 약점)
  };
  for (const r of timed) {
    const fast = r.timeSpentSec <= avgTimeSec;
    if (r.isCorrect) {
      if (fast) quad.fastCorrect += 1;
      else quad.slowCorrect += 1;
    } else {
      if (fast) quad.fastWrong += 1;
      else quad.slowWrong += 1;
    }
  }

  // 답안 분포 — 1~5번 어떤 번호로 답했는지
  const choicesPerQ = Math.max(
    ...records.map(
      (r) => (r.question.choices as { label: string }[]).length || 4,
    ),
    4,
  );
  const answerDist: number[] = Array(choicesPerQ).fill(0);
  for (const r of records) {
    const idx = parseInt(r.userAnswer, 10);
    if (Number.isFinite(idx) && idx >= 1 && idx <= choicesPerQ) {
      answerDist[idx - 1] += 1;
    }
  }

  // 주의 문제 (성급한 실수 / 진짜 약점)
  const fastWrongs = [...timed]
    .filter((r) => !r.isCorrect && !r.skipped && r.timeSpentSec <= avgTimeSec)
    .sort((a, b) => a.timeSpentSec - b.timeSpentSec)
    .slice(0, 3);
  const slowWrongs = [...timed]
    .filter((r) => !r.isCorrect && !r.skipped && r.timeSpentSec > avgTimeSec)
    .sort((a, b) => b.timeSpentSec - a.timeSpentSec)
    .slice(0, 3);

  const categoryName =
    attempt.exam?.category.name ??
    records[0]?.question.subject.category.name ??
    "";
  const categorySlug =
    attempt.exam?.category.slug ??
    records[0]?.question.subject.category.slug ??
    "";
  const categoryGrade =
    attempt.exam?.category.grade ??
    records[0]?.question.subject.category.grade ??
    null;

  // 종목별 합격 규칙으로 판정 (기술자격은 과목당 40점 과락, 한능검은 등급제)
  const passVerdict = judge(
    passRuleFor(categorySlug, categoryGrade, subjects.length),
    scorePct,
    subjects.map((x) => ({
      slug: x.slug,
      name: x.name,
      rate: x.rate,
      total: x.total,
    })),
  );
  const isPass = passVerdict.isPass;

  // 종합 한 줄
  const verdict = composeVerdict({
    isPass,
    scorePct,
    bestSubject,
    worstSubject,
    quad,
    thirds,
  });

  // 1문 세션(데일리)에선 분석 의미 X. 2문부터는 일부 의미 있음.
  // 섹션별로 자체 데이터 임계값을 따로 둠 (기존 showAnalytics 일괄 가드 폐기)
  const isMicroSession = total <= 1;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted">
        <Link
          href={`/exams/${categorySlug}`}
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          {categoryName}
        </Link>
      </nav>

      {/* Header / Score */}
      <header className="mt-6 border-b border-border pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
          {attempt.exam?.title ?? "연습 세션"}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[42px] font-bold tabular-nums tracking-[-0.02em] text-text-high md:text-[56px]">
              {scorePct}
              <span className="text-[28px] text-text-mid md:text-[36px]">
                {" "}/ 100
              </span>
            </h1>
            <p className="mt-2 text-[14px] text-text-mid">
              {correctCount}문제 정답 · 전체 {total}문제
            </p>
          </div>
          <PassBadge verdict={passVerdict} />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          <MetaStat
            icon={<CheckCircle className="h-4 w-4" strokeWidth={2} />}
            label="정답"
            value={correctCount}
            tone="accent"
          />
          <MetaStat
            icon={<XmarkCircle className="h-4 w-4" strokeWidth={2} />}
            label="오답"
            value={wrongCount}
            tone="danger"
          />
          <MetaStat label="건너뜀" value={skippedCount} tone="muted" />
          <MetaStat
            icon={<Timer className="h-4 w-4" strokeWidth={2} />}
            label="소요 시간"
            value={formatDuration(totalTimeSec)}
            tone="muted"
          />
        </dl>

        {/* 종합 한 줄 */}
        <div className="mt-6 rounded-md border border-border bg-surface px-4 py-3">
          <p className="text-[13px] leading-[1.55] text-text-mid">
            <Sparks
              className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-primary"
              strokeWidth={2}
            />
            <span className="text-text-high">{verdict}</span>
          </p>
        </div>
      </header>

      {/* 추천 액션 — 1문 세션에서도 항상 표시 */}
      <section className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          이거 다음에 해보세요
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {worstSubject && worstSubject.rate < 0.6 && (
            <ActionCard
              href={`/exams/${categorySlug}/subjects/${worstSubject.slug}`}
              title={`${worstSubject.name} 집중`}
              desc={`정답률 ${Math.round(worstSubject.rate * 100)}%. 이 과목만 집중 풀이.`}
              accent="danger"
            />
          )}
          {wrongCount > 0 && (
            <ActionCard
              href="/mistakes"
              title="오답노트 복습"
              desc={
                isMicroSession
                  ? "쌓인 오답을 한 번에 다시 풀기"
                  : `이번 회차에서 ${wrongCount}문제 오답.`
              }
              accent="primary"
            />
          )}
          {slowestSubject &&
            slowestSubject.avgSec > avgTimeSec * 1.3 && (
              <ActionCard
                href={`/exams/${categorySlug}/subjects/${slowestSubject.slug}`}
                title={`${slowestSubject.name} 시간 줄이기`}
                desc={`평균보다 ${Math.round((slowestSubject.avgSec / avgTimeSec - 1) * 100)}% 더 걸렸어요.`}
                accent="warning"
              />
            )}
          {isMicroSession && (
            <ActionCard
              href={`/practice?category=${categorySlug}&mode=daily`}
              title="내일도 한 문제"
              desc="streak 만 유지해도 합격 가까워져요."
              accent="primary"
            />
          )}
          <ActionCard
            href={`/practice?category=${categorySlug}&mode=random`}
            title="무작위 10문 워밍업"
            desc="짧게 머리 푸는 시간."
            accent="neutral"
          />
          <ActionCard
            href="/review"
            title="복습 모음으로"
            desc="오답·북마크·SRS 한 번에"
            accent="neutral"
          />
        </div>
      </section>

      {/* 세부 분석 — 접을 수 있게 */}
      {subjects.length > 1 && total >= 3 && (
        <section className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            단원별 종합
          </p>
          <h2 className="mt-1 text-[18px] font-bold tracking-[-0.01em] text-text-high">
            과목별 정답률 + 평균 풀이시간
          </h2>
          <ul className="mt-4 space-y-2">
            {subjects.map((s) => {
              const ratePct = Math.round(s.rate * 100);
              const isBest = bestSubject?.slug === s.slug;
              const isWorst = worstSubject?.slug === s.slug;
              const isCutoff = passVerdict.failedSubjects.some(
                (f) => f.slug === s.slug,
              );
              return (
                <li
                  key={s.slug}
                  className={cn(
                    "rounded-md border px-4 py-3",
                    isCutoff
                      ? "border-danger bg-danger/[0.06]"
                      : "bg-surface",
                    !isCutoff && isBest && "border-accent/40",
                    !isCutoff && isWorst && "border-danger/40",
                    !isCutoff && !isBest && !isWorst && "border-border",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold text-text-high">
                          {s.name}
                        </span>
                        {isBest && (
                          <span className="rounded-sm bg-accent/15 px-1.5 py-0 text-[10px] font-semibold text-accent">
                            최고
                          </span>
                        )}
                        {isCutoff ? (
                          <span className="rounded-sm bg-danger px-1.5 py-0 text-[10px] font-semibold text-white">
                            과락
                          </span>
                        ) : (
                          isWorst && (
                            <span className="rounded-sm bg-danger/15 px-1.5 py-0 text-[10px] font-semibold text-danger">
                              약점
                            </span>
                          )
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-text-muted">
                        <span className="tabular-nums">{s.correct}</span>/
                        <span className="tabular-nums">{s.total}</span> 맞춤
                        <span className="mx-1.5">·</span>
                        평균{" "}
                        <span className="tabular-nums">
                          {formatSec(s.avgSec)}
                        </span>{" "}
                        / 문제
                        <span className="mx-1.5">·</span>총{" "}
                        <span className="tabular-nums">
                          {formatDuration(s.timeSec)}
                        </span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[18px] font-bold tabular-nums tracking-[-0.01em]",
                        ratePct >= 60 ? "text-accent" : "text-danger",
                      )}
                    >
                      {ratePct}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-surface-mute">
                    <div
                      className={cn(
                        "h-full",
                        ratePct >= 60 ? "bg-accent" : "bg-danger",
                      )}
                      style={{ width: `${Math.max(ratePct, 3)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 풀이 시간 분포 + 사분면 */}
      {timed.length >= 3 && (
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <TimeBuckets buckets={timeBuckets} avgSec={avgTimeSec} />
          {timed.length >= 5 && (
            <TimeQuadrant quad={quad} avgSec={avgTimeSec} />
          )}
        </section>
      )}

      {/* 풀이 흐름 (전반/중반/후반) */}
      {total >= 6 && (
        <section className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            풀이 흐름
          </p>
          <h2 className="mt-1 text-[18px] font-bold tracking-[-0.01em] text-text-high">
            구간별 정답률
          </h2>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {thirds.map((t) => {
              const rate =
                t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
              return (
                <li
                  key={t.name}
                  className="rounded-md border border-border bg-surface px-3 py-3"
                >
                  <p className="text-[11px] font-medium text-text-muted">
                    {t.name}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[20px] font-bold tabular-nums tracking-[-0.01em]",
                      rate >= 60 ? "text-accent" : "text-danger",
                    )}
                  >
                    {rate}%
                  </p>
                  <p className="mt-1 text-[10.5px] text-text-muted">
                    <span className="tabular-nums">{t.correct}</span>/
                    <span className="tabular-nums">{t.total}</span>
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[12px] text-text-mid">
            {flowComment(thirds)}
          </p>
        </section>
      )}

      {/* 답안 분포 */}
      {records.length >= 5 && (
        <section className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            답안 분포
          </p>
          <h2 className="mt-1 text-[18px] font-bold tracking-[-0.01em] text-text-high">
            어떤 번호를 자주 골랐나
          </h2>
          <div className="mt-3 rounded-md border border-border bg-surface p-4">
            <ul className="space-y-2">
              {answerDist.map((cnt, i) => {
                const max = Math.max(...answerDist, 1);
                const w = (cnt / max) * 100;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-6 text-[11px] font-semibold tabular-nums text-text-mid">
                      {i + 1}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-mute">
                      <div
                        className="h-full bg-text-mid"
                        style={{ width: cnt > 0 ? `${Math.max(w, 3)}%` : "0%" }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11.5px] tabular-nums text-text-muted">
                      {cnt}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* 주의 문제 */}
      {!isMicroSession &&
        (fastWrongs.length > 0 || slowWrongs.length > 0) && (
        <section className="mt-10 grid gap-3 md:grid-cols-2">
          {fastWrongs.length > 0 && (
            <SuspectList
              title="성급한 실수"
              subtitle={`평균보다 빨리 틀림 (${formatSec(avgTimeSec)} 미만)`}
              icon={<Flash className="h-3.5 w-3.5" strokeWidth={2} />}
              tone="warning"
              items={fastWrongs.map((r) => ({
                id: r.id,
                number: r.question.number,
                subject: r.question.subject.name,
                stem: r.question.stem,
                timeSec: r.timeSpentSec,
              }))}
            />
          )}
          {slowWrongs.length > 0 && (
            <SuspectList
              title="진짜 약점"
              subtitle={`오래 풀었는데 틀린 문제 — 복습 1순위`}
              icon={<Hourglass className="h-3.5 w-3.5" strokeWidth={2} />}
              tone="danger"
              items={slowWrongs.map((r) => ({
                id: r.id,
                number: r.question.number,
                subject: r.question.subject.name,
                stem: r.question.stem,
                timeSec: r.timeSpentSec,
              }))}
            />
          )}
        </section>
      )}

      {/* 문항별 결과 */}
      <section className="mt-12">
        <h2 className="text-[18px] font-bold tracking-[-0.01em] text-text-high">
          문항별 결과
        </h2>
        <p className="mt-2 text-[13px] text-text-mid">
          각 카드를 클릭하면 선택지와 해설이 펼쳐져요.
        </p>
        <ul className="mt-6 space-y-3">
          {records.map((r) => (
            <li key={r.id}>
              <QuestionReview
                record={r}
                avgSec={avgTimeSec}
                images={imagesByQuestion.get(r.questionId) ?? null}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 rounded-md border border-border bg-surface-elev/50 p-6 md:p-8">
        <h3 className="text-[18px] font-bold tracking-[-0.01em] text-text-high">
          다시 도전할까요?
        </h3>
        <p className="mt-2 text-[14px] text-text-mid">
          다른 모드로 풀거나, 다른 회차로 이어가 보세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/exams/${categorySlug}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
          >
            {categoryName}으로
            <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
          >
            홈으로
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 시간 버킷 히스토그램
// ─────────────────────────────────────────────────────────────
function TimeBuckets({
  buckets,
  avgSec,
}: {
  buckets: { name: string; total: number; correct: number }[];
  avgSec: number;
}) {
  const max = Math.max(...buckets.map((b) => b.total), 1);
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        풀이 시간 분포
      </p>
      <h3 className="mt-1 text-[15px] font-bold tracking-[-0.01em] text-text-high">
        시간대별 정답률
      </h3>
      <div className="mt-3 rounded-md border border-border bg-surface p-4">
        <ul className="space-y-2">
          {buckets.map((b) => {
            const rate =
              b.total > 0 ? Math.round((b.correct / b.total) * 100) : null;
            const w = (b.total / max) * 100;
            return (
              <li key={b.name} className="space-y-1">
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-medium text-text-mid">{b.name}</span>
                  <span className="tabular-nums text-text-muted">
                    <span className="tabular-nums text-text-mid">
                      {b.total}
                    </span>
                    문 ·{" "}
                    <span
                      className={cn(
                        "font-bold",
                        rate == null
                          ? "text-text-muted"
                          : rate >= 60
                            ? "text-accent"
                            : "text-danger",
                      )}
                    >
                      {rate != null ? `${rate}%` : "—"}
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-sm bg-surface-mute">
                  <div
                    className={cn(
                      "h-full",
                      rate == null
                        ? "bg-text-mid/30"
                        : rate >= 60
                          ? "bg-accent"
                          : "bg-danger",
                    )}
                    style={{ width: b.total > 0 ? `${Math.max(w, 4)}%` : "0%" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 border-t border-border-soft pt-2.5 text-[11.5px] text-text-muted">
          평균 풀이시간{" "}
          <span className="tabular-nums font-semibold text-text-mid">
            {formatSec(avgSec)}
          </span>
          /문제
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 시간 × 정답 사분면
// ─────────────────────────────────────────────────────────────
function TimeQuadrant({
  quad,
  avgSec,
}: {
  quad: {
    fastCorrect: number;
    fastWrong: number;
    slowCorrect: number;
    slowWrong: number;
  };
  avgSec: number;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        시간 × 정답
      </p>
      <h3 className="mt-1 text-[15px] font-bold tracking-[-0.01em] text-text-high">
        풀이 패턴 사분면
      </h3>
      <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-surface">
        <QuadCell
          label="빠르게 맞춤"
          subtitle="실력"
          value={quad.fastCorrect}
          tone="accent"
        />
        <QuadCell
          label="빠르게 틀림"
          subtitle="성급"
          value={quad.fastWrong}
          tone="warning"
          bordered
        />
        <QuadCell
          label="오래 풀고 맞춤"
          subtitle="집요"
          value={quad.slowCorrect}
          tone="default"
          topBordered
        />
        <QuadCell
          label="오래 풀고 틀림"
          subtitle="진짜 약점"
          value={quad.slowWrong}
          tone="danger"
          bordered
          topBordered
        />
      </div>
      <p className="mt-2 text-[11.5px] text-text-muted">
        기준선:{" "}
        <span className="tabular-nums font-semibold text-text-mid">
          {formatSec(avgSec)}
        </span>{" "}
        (이번 세션 평균)
      </p>
    </div>
  );
}

function QuadCell({
  label,
  subtitle,
  value,
  tone,
  bordered,
  topBordered,
}: {
  label: string;
  subtitle: string;
  value: number;
  tone: "accent" | "warning" | "danger" | "default";
  bordered?: boolean;
  topBordered?: boolean;
}) {
  const color =
    tone === "accent"
      ? "text-accent"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-danger"
          : "text-text-high";
  return (
    <div
      className={cn(
        "px-3 py-3",
        bordered && "border-l border-border",
        topBordered && "border-t border-border",
      )}
    >
      <p className="text-[11px] font-medium text-text-mid">{label}</p>
      <p className="text-[10px] text-text-muted">{subtitle}</p>
      <p
        className={cn(
          "mt-1 text-[22px] font-bold tabular-nums tracking-[-0.01em]",
          color,
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 주의 문제 리스트
// ─────────────────────────────────────────────────────────────
function SuspectList({
  title,
  subtitle,
  icon,
  tone,
  items,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "warning" | "danger";
  items: {
    id: string;
    number: number;
    subject: string;
    stem: string;
    timeSec: number;
  }[];
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-surface p-4",
        tone === "warning" && "border-warning/30",
        tone === "danger" && "border-danger/30",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
        )}
      >
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          {title}
        </p>
      </div>
      <p className="mt-1 text-[11.5px] text-text-muted">{subtitle}</p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-sm border border-border-soft bg-background px-3 py-2"
          >
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>
                <span className="font-semibold text-text-mid">
                  Q.{String(it.number).padStart(2, "0")}
                </span>
                <span className="mx-1">·</span>
                {it.subject}
              </span>
              <span
                className={cn(
                  "tabular-nums font-semibold",
                  tone === "warning" ? "text-warning" : "text-danger",
                )}
              >
                {formatSec(it.timeSec)}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-text-high">
              {stripStem(it.stem)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Action card
// ─────────────────────────────────────────────────────────────
function ActionCard({
  href,
  title,
  desc,
  accent,
}: {
  href: string;
  title: string;
  desc: string;
  accent: "danger" | "primary" | "warning" | "neutral";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start justify-between gap-3 rounded-md border bg-surface px-4 py-3.5 transition-colors",
        accent === "danger" && "border-danger/30 hover:border-danger/60",
        accent === "primary" && "border-primary/30 hover:border-primary/60",
        accent === "warning" && "border-warning/30 hover:border-warning/60",
        accent === "neutral" && "border-border hover:border-text-mid",
      )}
    >
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-text-high">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[11.5px] text-text-mid">
          {desc}
        </p>
      </div>
      <NavArrowRight
        className={cn(
          "mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5",
          accent === "danger" && "text-danger",
          accent === "primary" && "text-primary",
          accent === "warning" && "text-warning",
          accent === "neutral" && "text-text-muted",
        )}
        strokeWidth={2.5}
      />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Question review (with time per question)
// ─────────────────────────────────────────────────────────────
type RecordWithQ = {
  id: string;
  userAnswer: string;
  isCorrect: boolean;
  skipped: boolean;
  flagged: boolean;
  timeSpentSec: number;
  question: {
    id: string;
    number: number;
    stem: string;
    choices: unknown;
    correctAnswer: string;
    hasMath: boolean;
    explanationSeed: string | null;
    subject: { name: string };
    explanations: {
      id: string;
      explanation: string;
      wrongChoice: string | null;
      memoryHook: string | null;
    }[];
  };
};

function QuestionReview({
  record,
  avgSec,
  images,
}: {
  record: RecordWithQ;
  avgSec: number;
  images: QuestionImages | null;
}) {
  const q = record.question;
  const choices = q.choices as { label: string; text: string }[];
  const correctIdx = parseInt(q.correctAnswer, 10);
  const userIdx = record.userAnswer ? parseInt(record.userAnswer, 10) : -1;

  const status: "correct" | "wrong" | "skipped" = record.skipped
    ? "skipped"
    : record.isCorrect
      ? "correct"
      : "wrong";

  const matched =
    q.explanations.find((e) => e.wrongChoice === record.userAnswer) ??
    q.explanations.find((e) => !e.wrongChoice) ??
    null;
  const explanationHtml = matched?.explanation ?? "";

  const slow = record.timeSpentSec > avgSec * 1.5 && record.timeSpentSec > 60;

  return (
    <details
      className={cn(
        "group rounded-md border bg-surface",
        status === "correct" && "border-border",
        status === "wrong" && "border-danger/30 bg-danger/[0.03]",
        status === "skipped" && "border-border bg-surface-mute",
      )}
    >
      <summary className="flex cursor-pointer list-none items-start gap-4 p-5 [&::-webkit-details-marker]:hidden md:p-6">
        <StatusDot status={status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 text-[12px] text-text-muted">
            <span className="font-semibold text-text-mid">
              Q.{String(q.number).padStart(2, "0")}
            </span>
            <span>{q.subject.name}</span>
            <StatusLabel status={status} />
            {record.timeSpentSec > 0 && (
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-0.5 tabular-nums",
                  slow ? "text-danger" : "",
                )}
              >
                <Timer className="h-3 w-3" strokeWidth={2} />
                {formatSec(record.timeSpentSec)}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[15px] leading-[1.6] text-text-high group-open:line-clamp-none">
            <MathText text={q.stem} />
          </p>
        </div>
        <NavArrowRight
          className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-90"
          strokeWidth={2}
        />
      </summary>

      <div className="border-t border-border px-5 py-5 md:px-6 md:py-6">
        {/* 베타 알림 — 그림 문제는 표시 보류 중 */}
        {(images?.body?.length ||
          Object.values(images?.options ?? {}).some(
            (a) => (a?.length ?? 0) > 0,
          )) && (
          <div className="mb-5 rounded-md border border-warning/30 bg-warning/[0.05] px-3.5 py-2.5 text-[12px] text-text-mid">
            그림 포함 문제예요. 베타에서 그림 매칭 정밀도가 낮아 표시 보류 중.
          </div>
        )}
        <ul className="space-y-2">
          {choices.map((c, i) => {
            const n = i + 1;
            const isCorrect = n === correctIdx;
            const isUserPick = n === userIdx;
            return (
              <li
                key={c.label}
                className={cn(
                  "flex items-start gap-3 rounded-sm border px-3.5 py-2.5 text-[14px]",
                  isCorrect &&
                    "border-accent/60 bg-accent/10 text-text-high",
                  !isCorrect &&
                    isUserPick &&
                    "border-danger/50 bg-danger/10 text-text-mid line-through",
                  !isCorrect &&
                    !isUserPick &&
                    "border-border text-text-mid",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-mono text-[11px] font-semibold",
                    isCorrect
                      ? "bg-accent text-white"
                      : isUserPick
                        ? "bg-danger text-white"
                        : "bg-surface-mute text-text-muted",
                  )}
                >
                  {c.label}
                </span>
                <span className="flex-1">
                  <MathText text={c.text} />
                </span>
                {isCorrect && (
                  <span className="shrink-0 text-[10px] font-semibold tracking-wider text-accent">
                    정답
                  </span>
                )}
                {!isCorrect && isUserPick && (
                  <span className="shrink-0 text-[10px] font-semibold tracking-wider text-danger">
                    내 답
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {explanationHtml ? (
          <div className="mt-6 rounded-sm bg-primary-subtle/50 p-5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              해설
            </span>
            <div className="mt-2.5">
              <ExplanationHtml html={explanationHtml} />
            </div>
            {matched?.memoryHook && (
              <p className="mt-4 border-t border-primary/15 pt-3 text-[13px] leading-[1.6] text-text-mid">
                <span className="font-semibold text-primary">암기 팁 · </span>
                <HookText text={matched.memoryHook} />
              </p>
            )}
          </div>
        ) : (
          <p className="mt-6 rounded-sm border border-dashed border-border px-4 py-3 text-[12px] text-text-muted">
            이 문제 해설은 아직 준비 중이에요.
          </p>
        )}
      </div>
    </details>
  );
}

function StatusDot({
  status,
}: {
  status: "correct" | "wrong" | "skipped";
}) {
  return (
    <div
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm",
        status === "correct" && "bg-accent/15 text-accent",
        status === "wrong" && "bg-danger/15 text-danger",
        status === "skipped" && "bg-surface-mute text-text-muted",
      )}
    >
      {status === "correct" && (
        <CheckCircle className="h-4 w-4" strokeWidth={2.5} />
      )}
      {status === "wrong" && <XmarkCircle className="h-4 w-4" strokeWidth={2.5} />}
      {status === "skipped" && (
        <span className="text-[11px] font-semibold">—</span>
      )}
    </div>
  );
}

function StatusLabel({
  status,
}: {
  status: "correct" | "wrong" | "skipped";
}) {
  const cls = cn(
    "rounded-sm px-1.5 py-0 text-[10px] font-semibold tracking-wider",
    status === "correct" && "bg-accent/15 text-accent",
    status === "wrong" && "bg-danger/15 text-danger",
    status === "skipped" && "bg-surface-mute text-text-muted",
  );
  return (
    <span className={cls}>
      {status === "correct" ? "정답" : status === "wrong" ? "오답" : "건너뜀"}
    </span>
  );
}

function PassBadge({ verdict }: { verdict: PassVerdict }) {
  const { isPass, gradeLabel, failedSubjects, gap } = verdict;
  const hasCutoff = failedSubjects.length > 0;

  // 총점은 넘겼는데 과락으로 떨어진 경우를 따로 말해준다 — 원인이 다르니까
  const headline = gradeLabel
    ? `${gradeLabel} 합격권`
    : isPass
      ? "합격 추정"
      : hasCutoff
        ? "과락"
        : "불합격 추정";

  const detail = hasCutoff
    ? `${failedSubjects.map((s) => s.name).join(" · ")} 40점 미만`
    : gap >= 0
      ? `+${gap}점 여유`
      : `합격선까지 ${Math.abs(gap)}점`;

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-1 rounded-md border px-4 py-2.5",
        isPass
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-danger/40 bg-danger/10 text-danger",
      )}
    >
      <span className="text-[13px] font-semibold">{headline}</span>
      <span
        className={cn(
          "text-[10.5px] opacity-80",
          !hasCutoff && "tabular-nums",
        )}
      >
        {detail}
      </span>
    </div>
  );
}

function MetaStat({
  icon,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  tone: "accent" | "danger" | "muted";
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "danger"
        ? "text-danger"
        : "text-text-high";
  return (
    <div>
      <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 text-[22px] font-bold tabular-nums md:text-[26px]",
          toneClass,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function formatDuration(sec: number): string {
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  if (mm === 0) return `${ss}초`;
  return `${mm}분 ${ss}초`;
}

function formatSec(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function stripStem(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/\$[^$]+\$/g, "[식]")
    .replace(/\s+/g, " ")
    .trim();
}

function composeVerdict(args: {
  isPass: boolean;
  scorePct: number;
  bestSubject: { name: string; rate: number } | undefined;
  worstSubject: { name: string; rate: number } | undefined;
  quad: {
    fastCorrect: number;
    fastWrong: number;
    slowCorrect: number;
    slowWrong: number;
  };
  thirds: { name: string; correct: number; total: number }[];
}): string {
  const { isPass, scorePct, bestSubject, worstSubject, quad, thirds } = args;

  const bits: string[] = [];

  if (isPass) {
    bits.push(`합격선 ${PASS_THRESHOLD}점을 ${scorePct - PASS_THRESHOLD}점 넘었어요.`);
  } else {
    bits.push(`합격선까지 ${PASS_THRESHOLD - scorePct}점 부족.`);
  }

  if (bestSubject && worstSubject && bestSubject.name !== worstSubject.name) {
    bits.push(
      `과목 편차가 커요 — ${bestSubject.name} ${Math.round(
        bestSubject.rate * 100,
      )}%, ${worstSubject.name} ${Math.round(worstSubject.rate * 100)}%.`,
    );
  }

  if (quad.fastWrong >= 3) {
    bits.push(`성급하게 틀린 문제가 ${quad.fastWrong}개 — 침착하면 더 올라가요.`);
  } else if (quad.slowWrong >= 3) {
    bits.push(`오래 붙잡고 틀린 문제가 ${quad.slowWrong}개 — 진짜 약점이에요.`);
  }

  // 후반 무너짐
  const last = thirds[2];
  const first = thirds[0];
  if (
    last.total > 0 &&
    first.total > 0 &&
    last.correct / last.total < first.correct / first.total - 0.15
  ) {
    bits.push(`후반에 정답률이 떨어졌어요 — 페이스 안배도 같이 봐요.`);
  }

  return bits.join(" ");
}

function flowComment(
  thirds: { name: string; correct: number; total: number }[],
): string {
  const rates = thirds.map((t) =>
    t.total > 0 ? t.correct / t.total : null,
  );
  const [a, b, c] = rates;
  if (a == null || b == null || c == null) return "";
  if (c < a - 0.15) return "후반으로 갈수록 떨어졌어요. 시간 분배 점검 필요.";
  if (c > a + 0.1) return "후반에 더 잘 풀었어요. 워밍업 시간이 필요했나봐요.";
  if (b < a - 0.1 && b < c - 0.1) return "중간이 가장 흔들렸어요.";
  return "전반적으로 일정한 페이스로 풀었어요.";
}

function Denied() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
      <WarningTriangle className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Access denied
      </p>
      <h1 className="mt-2 text-[22px] font-bold tracking-[-0.01em] text-text-high">
        이 결과는 다른 분의 기록이에요.
      </h1>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
      >
        <NavArrowLeft className="h-4 w-4" strokeWidth={2} />
        홈으로
      </Link>
    </div>
  );
}
