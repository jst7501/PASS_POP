import Link from "next/link";
import {
  NavArrowRight,
  Shuffle,
  XmarkCircle,
  GraphUp,
  Notes,
  Play,
  BookStack,
  CheckCircle,
  Flash,
  Bookmark as BookmarkIcon,
  Trophy,
  WarningTriangle,
  Sparks,
  Clock,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { cn } from "@/lib/utils";
import { DdayBanner } from "@/components/home/dday-banner";

const OWNER_MAP: Record<string, { owner: string }> = {
  "civil-engineer-gisa": { owner: "정호" },
  "hvac-refrigeration-gisa": { owner: "호준" },
  "3d-printer-gineungsa": { owner: "호성" },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const user = await getCurrentUser();
  const { exam: pickedSlug } = await searchParams;

  // 카테고리 + 회차 + 과목
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { subjects: true } },
      subjects: {
        orderBy: { orderIdx: "asc" },
        include: { _count: { select: { questions: true } } },
      },
      exams: {
        orderBy: [{ year: "desc" }, { round: "desc" }],
        select: {
          id: true,
          year: true,
          round: true,
          title: true,
          totalQuestions: true,
        },
      },
    },
  });

  const publishedByExam = await prisma.aiExplanation.findMany({
    where: { userId: null, model: "hand-written" },
    distinct: ["questionId"],
    select: { question: { select: { examId: true } } },
  });
  const publishedExamIds = new Set(
    publishedByExam.map((e) => e.question.examId).filter(Boolean) as string[],
  );

  // 우선순위: URL ?exam → 유저 targetCategoryId → 공개회차 있는 첫 카테고리 → 첫 카테고리
  const userTargetSlug = user?.targetCategoryId
    ? (categories.find((c) => c.id === user.targetCategoryId)?.slug ?? null)
    : null;
  const fallbackSlug =
    categories.find((c) => c.exams.some((e) => publishedExamIds.has(e.id)))
      ?.slug ?? categories[0]?.slug;
  const selectedSlug =
    pickedSlug && categories.some((c) => c.slug === pickedSlug)
      ? pickedSlug
      : (userTargetSlug ?? fallbackSlug);
  const selectedCat = categories.find((c) => c.slug === selectedSlug) ?? null;
  // picker 노출 조건:
  //   - URL 로 임시 변경 중이거나 (pickedSlug)
  //   - 관리자 (시험 미선택 가능)
  //   - 또는 targetCategoryId 안 잡혔을 때
  const isAdmin = user?.nickname === "관리자";
  const showPicker =
    !!pickedSlug || isAdmin || !user?.targetCategoryId;
  // URL 임시 모드 — targetCategoryId 와 다른 카테고리 보고있을 때 표시
  const isTempViewing =
    !!pickedSlug && userTargetSlug && pickedSlug !== userTargetSlug;

  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = addDays(weekStart, -7);
  const yesterdayStart = addDays(startOfDay(now), -1);
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  const [
    inProgress,
    finishedAttempts,
    mistakeCount,
    bookmarkCount,
    reviewDueCount,
    subjectRecords,
    yesterdayMistakes,
    thisWeekRecs,
    lastWeekRecs,
    hourRecords,
    confidenceRecords,
    reviewAll,
    todaySolved,
    subjectAnswerCounts,
  ] = await Promise.all([
    user && selectedCat
      ? prisma.attempt.findFirst({
          where: {
            userId: user.id,
            finishedAt: null,
            exam: { categoryId: selectedCat.id },
          },
          orderBy: { startedAt: "desc" },
          include: { exam: true, _count: { select: { records: true } } },
        })
      : Promise.resolve(null),
    user && selectedCat
      ? prisma.attempt.findMany({
          where: {
            userId: user.id,
            finishedAt: { not: null },
            exam: { categoryId: selectedCat.id },
          },
          orderBy: { finishedAt: "desc" },
          take: 8,
          select: { id: true, score: true, finishedAt: true },
        })
      : Promise.resolve([]),
    user && selectedCat
      ? prisma.answerRecord.count({
          where: {
            userId: user.id,
            isCorrect: false,
            skipped: false,
            question: { subject: { categoryId: selectedCat.id } },
          },
        })
      : Promise.resolve(0),
    user
      ? prisma.bookmark.count({ where: { userId: user.id } })
      : Promise.resolve(0),
    user && selectedCat
      ? prisma.reviewSchedule.count({
          where: {
            userId: user.id,
            nextReviewAt: { lte: now },
            question: { subject: { categoryId: selectedCat.id } },
          },
        })
      : Promise.resolve(0),
    user && selectedCat
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            question: { subject: { categoryId: selectedCat.id } },
          },
          select: {
            isCorrect: true,
            question: {
              select: { subject: { select: { name: true, slug: true } } },
            },
          },
        })
      : Promise.resolve([]),
    // 어제 틀린 문제 3개
    user && selectedCat
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            isCorrect: false,
            skipped: false,
            answeredAt: { gte: yesterdayStart, lt: todayStart },
            question: { subject: { categoryId: selectedCat.id } },
          },
          orderBy: { answeredAt: "desc" },
          take: 3,
          include: {
            question: {
              select: {
                id: true,
                number: true,
                stem: true,
                subject: { select: { name: true } },
                exam: { select: { year: true, round: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    // 이번 주 기록
    user && selectedCat
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            answeredAt: { gte: weekStart },
            question: { subject: { categoryId: selectedCat.id } },
          },
          select: { isCorrect: true },
        })
      : Promise.resolve([]),
    // 지난 주 기록
    user && selectedCat
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            answeredAt: { gte: lastWeekStart, lt: weekStart },
            question: { subject: { categoryId: selectedCat.id } },
          },
          select: { isCorrect: true },
        })
      : Promise.resolve([]),
    // 시간대별 (최근 200개)
    user && selectedCat
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            question: { subject: { categoryId: selectedCat.id } },
          },
          orderBy: { answeredAt: "desc" },
          take: 200,
          select: { answeredAt: true, isCorrect: true },
        })
      : Promise.resolve([]),
    // confidence 분석
    user && selectedCat
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            question: { subject: { categoryId: selectedCat.id } },
            confidence: { not: null },
          },
          select: { confidence: true, isCorrect: true },
        })
      : Promise.resolve([]),
    // SRS 분포
    user && selectedCat
      ? prisma.reviewSchedule.findMany({
          where: {
            userId: user.id,
            question: { subject: { categoryId: selectedCat.id } },
          },
          select: { nextReviewAt: true },
        })
      : Promise.resolve([]),
    // 오늘 푼 문제 수 (D-day 일일 목표용)
    user && selectedCat
      ? prisma.answerRecord.count({
          where: {
            userId: user.id,
            answeredAt: { gte: todayStart, lt: tomorrowStart },
            question: { subject: { categoryId: selectedCat.id } },
          },
        })
      : Promise.resolve(0),
    // 과목별 마스터율 (가장 최근 풀이가 정답인지)
    user && selectedCat
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            question: { subject: { categoryId: selectedCat.id } },
          },
          orderBy: { answeredAt: "desc" },
          distinct: ["questionId"],
          select: {
            isCorrect: true,
            question: {
              select: { subject: { select: { slug: true } } },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const thisWeekTotal = thisWeekRecs.length;
  const thisWeekCorrect = thisWeekRecs.filter((r) => r.isCorrect).length;
  const thisWeekAcc =
    thisWeekTotal > 0
      ? Math.round((thisWeekCorrect / thisWeekTotal) * 100)
      : null;

  const lastWeekTotal = lastWeekRecs.length;
  const lastWeekCorrect = lastWeekRecs.filter((r) => r.isCorrect).length;
  const lastWeekAcc =
    lastWeekTotal > 0
      ? Math.round((lastWeekCorrect / lastWeekTotal) * 100)
      : null;

  const scoredAttempts = finishedAttempts
    .map((a) => a.score)
    .filter((s): s is number => s != null);
  const avgScore =
    scoredAttempts.length > 0
      ? scoredAttempts.reduce((sum, s) => sum + s, 0) / scoredAttempts.length
      : null;
  const passProbInterval = computePassProbInterval(scoredAttempts);
  const passProb = passProbInterval?.prob ?? null;

  // 약점 과목
  const subjectMap = new Map<
    string,
    { name: string; slug: string; total: number; correct: number }
  >();
  for (const r of subjectRecords) {
    const key = r.question.subject.slug;
    const cur = subjectMap.get(key) ?? {
      name: r.question.subject.name,
      slug: key,
      total: 0,
      correct: 0,
    };
    cur.total += 1;
    if (r.isCorrect) cur.correct += 1;
    subjectMap.set(key, cur);
  }
  const weakSubjects = Array.from(subjectMap.values())
    .filter((s) => s.total >= 3)
    .map((s) => ({ ...s, rate: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);

  // 시간대 버킷 (0-5 새벽, 6-11 오전, 12-17 오후, 18-23 저녁)
  const hourBuckets = [
    { name: "새벽", from: 0, to: 5, total: 0, correct: 0 },
    { name: "오전", from: 6, to: 11, total: 0, correct: 0 },
    { name: "오후", from: 12, to: 17, total: 0, correct: 0 },
    { name: "저녁", from: 18, to: 23, total: 0, correct: 0 },
  ];
  for (const r of hourRecords) {
    const h = r.answeredAt.getHours();
    const b = hourBuckets.find((b) => h >= b.from && h <= b.to);
    if (!b) continue;
    b.total += 1;
    if (r.isCorrect) b.correct += 1;
  }

  // Confidence 분석
  const confBuckets = {
    GUESS: { total: 0, correct: 0 },
    UNSURE: { total: 0, correct: 0 },
    CONFIDENT: { total: 0, correct: 0 },
  };
  for (const r of confidenceRecords) {
    const c = r.confidence as keyof typeof confBuckets | null;
    if (!c || !(c in confBuckets)) continue;
    confBuckets[c].total += 1;
    if (r.isCorrect) confBuckets[c].correct += 1;
  }

  // SRS 분포 (오늘 / 1일 / 2-3일 / 4-7일 / 8+)
  const srsBuckets = [
    { label: "오늘", count: 0 },
    { label: "내일", count: 0 },
    { label: "2-3일", count: 0 },
    { label: "4-7일", count: 0 },
    { label: "8일+", count: 0 },
  ];
  for (const s of reviewAll) {
    const days = Math.floor(
      (s.nextReviewAt.getTime() - todayStart.getTime()) / 86400000,
    );
    if (days <= 0) srsBuckets[0].count += 1;
    else if (days === 1) srsBuckets[1].count += 1;
    else if (days <= 3) srsBuckets[2].count += 1;
    else if (days <= 7) srsBuckets[3].count += 1;
    else srsBuckets[4].count += 1;
  }

  // 회차 attempt 매핑
  const attemptMap = new Map<
    string,
    {
      id: string;
      finished: boolean;
      score: number | null;
      solved: number;
      planned: number;
    }
  >();
  if (user && selectedCat) {
    const all = await prisma.attempt.findMany({
      where: { userId: user.id, exam: { categoryId: selectedCat.id } },
      orderBy: { startedAt: "desc" },
      include: { _count: { select: { records: true } } },
    });
    for (const a of all) {
      if (!a.examId) continue;
      if (attemptMap.has(a.examId)) continue;
      attemptMap.set(a.examId, {
        id: a.id,
        finished: !!a.finishedAt,
        score: a.score,
        solved: a._count.records,
        planned: a.plannedQuestionIds.length,
      });
    }
  }

  const streakDays = user?.streakDays ?? 0;
  const nickname = user?.nickname ?? null;

  // 격려 문구 결정
  const nudge = pickNudge({
    streakDays,
    mistakeCount,
    passProb,
    reviewDueCount,
    weakSubject: weakSubjects[0],
    avgScore: avgScore != null ? Math.round(avgScore) : null,
    thisWeekTotal,
    lastWeekTotal,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:px-6 md:pt-8">
      {showPicker && (
        <ExamPicker
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            owner: OWNER_MAP[c.slug]?.owner ?? "",
            publishedCount: c.exams.filter((e) => publishedExamIds.has(e.id))
              .length,
          }))}
          selectedSlug={selectedSlug ?? ""}
        />
      )}

      {/* 임시로 다른 시험 보고있을 때 — 내 시험으로 돌아가기 안내 */}
      {isTempViewing && userTargetSlug && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/[0.05] px-3 py-2 text-[12px]">
          <span className="text-text-mid">
            <span className="font-semibold text-warning">임시로</span> 다른
            시험 보고 있어요
          </span>
          <Link
            href={`/?exam=${userTargetSlug}`}
            scroll={false}
            className="font-semibold text-primary hover:text-primary-hover"
          >
            내 시험으로
          </Link>
        </div>
      )}

      {selectedCat && (
        <>
          <SelectedHeader
            nickname={nickname}
            owner={OWNER_MAP[selectedCat.slug]?.owner ?? ""}
            categoryName={selectedCat.name}
            passProb={passProb}
            passLow={passProbInterval?.lower ?? null}
            passHigh={passProbInterval?.upper ?? null}
            attemptCount={scoredAttempts.length}
          />

          <WeekStrip
            streakDays={streakDays}
            weekTotal={thisWeekTotal}
            weekAcc={thisWeekAcc}
            avgScore={avgScore != null ? Math.round(avgScore) : null}
          />

          {user && (
            <DdayBanner
              categoryId={selectedCat.id}
              categoryName={selectedCat.name}
              examDate={
                user.targetCategoryId === selectedCat.id && user.targetExamDate
                  ? user.targetExamDate.toISOString()
                  : null
              }
              dailyGoal={
                user.targetCategoryId === selectedCat.id
                  ? (user.dailyGoal ?? null)
                  : null
              }
              todaySolved={todaySolved}
              isCurrentCategory={user.targetCategoryId === selectedCat.id}
            />
          )}

          <NudgeBanner message={nudge.message} accent={nudge.accent} />

          <TodayPanel
            reviewDueCount={reviewDueCount}
            inProgress={
              inProgress && inProgress.exam
                ? {
                    id: inProgress.id,
                    title: inProgress.exam.title,
                    solved: inProgress._count.records,
                    planned: inProgress.plannedQuestionIds.length,
                  }
                : null
            }
            categorySlug={selectedCat.slug}
          />

          <DailyQuestionCard categorySlug={selectedCat.slug} />

          {yesterdayMistakes.length > 0 && (
            <YesterdayMistakes
              items={yesterdayMistakes.map((r) => ({
                recordId: r.id,
                questionNumber: r.question.number,
                stem: r.question.stem,
                subjectName: r.question.subject.name,
                examYear: r.question.exam?.year ?? null,
                examRound: r.question.exam?.round ?? null,
                categorySlug: selectedCat.slug,
              }))}
            />
          )}

          {finishedAttempts.length >= 2 && (
            <ScoreTrend
              points={finishedAttempts
                .slice()
                .reverse()
                .map((a) => ({
                  score: a.score ?? 0,
                  date: a.finishedAt ?? new Date(),
                }))}
            />
          )}

          {(thisWeekTotal > 0 || lastWeekTotal > 0) && (
            <WeekCompareCard
              thisWeek={{ total: thisWeekTotal, acc: thisWeekAcc }}
              lastWeek={{ total: lastWeekTotal, acc: lastWeekAcc }}
            />
          )}

          {hourRecords.length >= 20 && (
            <TimeOfDayInsight buckets={hourBuckets} />
          )}

          {confidenceRecords.length >= 5 && (
            <ConfidenceAnalysis buckets={confBuckets} />
          )}

          {reviewAll.length > 0 && (
            <ReviewDistribution buckets={srsBuckets} />
          )}

          {weakSubjects.length > 0 && (
            <WeakSubjects
              subjects={weakSubjects}
              categorySlug={selectedCat.slug}
            />
          )}

          <SubjectList
            categorySlug={selectedCat.slug}
            subjects={selectedCat.subjects.map((s) => {
              const subjectRecs = subjectAnswerCounts.filter(
                (r) => r.question.subject.slug === s.slug,
              );
              const solved = subjectRecs.length;
              const mastered = subjectRecs.filter((r) => r.isCorrect).length;
              const total = s._count.questions;
              // 마스터율: 가장 최근 풀이가 정답인 question / 전체 question
              const progress = total > 0 ? mastered / total : 0;
              return {
                slug: s.slug,
                name: s.name,
                questionCount: total,
                solved,
                mastered,
                progress,
              };
            })}
          />

          <RoundList
            categorySlug={selectedCat.slug}
            exams={selectedCat.exams.map((e) => ({
              id: e.id,
              year: e.year,
              round: e.round,
              title: e.title,
              totalQuestions: e.totalQuestions,
              published: publishedExamIds.has(e.id),
              attempt: attemptMap.get(e.id) ?? null,
            }))}
          />

          <ToolsDock
            mistakeCount={mistakeCount}
            bookmarkCount={bookmarkCount}
            categorySlug={selectedCat.slug}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Exam Picker
// ─────────────────────────────────────────────────────────────
function ExamPicker({
  categories,
  selectedSlug,
}: {
  categories: {
    slug: string;
    name: string;
    owner: string;
    publishedCount: number;
  }[];
  selectedSlug: string;
}) {
  return (
    <section>
      <p className="text-[12px] font-medium text-text-muted">
        누구 시험 볼까요?
      </p>
      <ul className="-mx-4 mt-2.5 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {categories.map((c) => {
          const active = c.slug === selectedSlug;
          const has = c.publishedCount > 0;
          return (
            <li
              key={c.slug}
              className="w-[60%] shrink-0 snap-start sm:w-auto sm:flex-1"
            >
              <Link
                href={`/?exam=${c.slug}`}
                scroll={false}
                className={cn(
                  "flex h-full items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 transition-colors",
                  active
                    ? "border-text-high bg-text-high text-background"
                    : has
                      ? "border-border bg-surface text-text-mid hover:border-text-mid hover:text-text-high"
                      : "border-border-soft bg-surface text-text-muted",
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[11px]",
                      active ? "text-background/70" : "text-text-muted",
                    )}
                  >
                    {c.owner || "\u00A0"}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-semibold tracking-[-0.01em]">
                    {c.name}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? "bg-background/20 text-background"
                      : has
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-mute text-text-muted",
                  )}
                >
                  {has ? `${c.publishedCount}회차` : "준비중"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SelectedHeader({
  nickname,
  owner,
  categoryName,
  passProb,
  passLow,
  passHigh,
  attemptCount,
}: {
  nickname: string | null;
  owner: string;
  categoryName: string;
  passProb: number | null;
  passLow: number | null;
  passHigh: number | null;
  attemptCount: number;
}) {
  const displayName = nickname || owner;
  const lowConfidence = attemptCount < 3;
  return (
    <header className="mt-8 flex items-end justify-between gap-4 md:mt-10">
      <div>
        <h1 className="text-[26px] font-bold leading-[1.2] tracking-[-0.02em] text-text-high md:text-[30px]">
          {displayName ? `${displayName}의 ` : ""}서재
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">{categoryName}</p>
      </div>
      {passProb != null && (
        <div className="shrink-0 rounded-md border border-border bg-surface px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            합격 예측
          </p>
          <p className="mt-0.5 flex items-baseline gap-0.5">
            <span
              className={cn(
                "text-[22px] font-bold tabular-nums leading-none tracking-[-0.02em]",
                lowConfidence
                  ? "text-text-mid"
                  : passProb >= 60
                    ? "text-accent"
                    : "text-text-high",
              )}
            >
              {passProb}
            </span>
            <span className="text-[11px] font-medium text-text-muted">
              %
            </span>
          </p>
          {passLow != null && passHigh != null && passLow !== passHigh && (
            <p className="text-[10px] tabular-nums text-text-muted">
              {passLow}–{passHigh}%
            </p>
          )}
          <p
            className={cn(
              "mt-0.5 text-[10px] tabular-nums",
              lowConfidence ? "text-warning" : "text-text-muted",
            )}
          >
            {lowConfidence
              ? `${attemptCount}회 · 신뢰 낮음`
              : `${attemptCount}회 기준`}
          </p>
        </div>
      )}
    </header>
  );
}

function WeekStrip({
  streakDays,
  weekTotal,
  weekAcc,
  avgScore,
}: {
  streakDays: number;
  weekTotal: number;
  weekAcc: number | null;
  avgScore: number | null;
}) {
  return (
    <section className="mt-5">
      <ul className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-surface sm:grid-cols-4">
        <StripCell
          icon={<Flash className="h-3.5 w-3.5" strokeWidth={2} />}
          label="연속"
          value={streakDays}
          suffix="일"
          tint={streakDays > 0 ? "primary" : "muted"}
        />
        <StripCell
          icon={<BookStack className="h-3.5 w-3.5" strokeWidth={2} />}
          label="이번주"
          value={weekTotal}
          suffix="문"
          tint="default"
          border
        />
        <StripCell
          icon={<CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />}
          label="정답률"
          value={weekAcc}
          suffix="%"
          tint={weekAcc != null && weekAcc >= 60 ? "accent" : "default"}
          border
        />
        <StripCell
          icon={<Trophy className="h-3.5 w-3.5" strokeWidth={2} />}
          label="평균점수"
          value={avgScore}
          suffix="점"
          tint={avgScore != null && avgScore >= 60 ? "accent" : "muted"}
          border
        />
      </ul>
    </section>
  );
}

function StripCell({
  icon,
  label,
  value,
  suffix,
  tint,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  suffix: string;
  tint: "primary" | "accent" | "default" | "muted";
  border?: boolean;
}) {
  const color =
    tint === "primary"
      ? "text-primary"
      : tint === "accent"
        ? "text-accent"
        : tint === "muted"
          ? "text-text-muted"
          : "text-text-high";
  return (
    <li
      className={cn(
        "flex flex-col px-3.5 py-3",
        border && "sm:border-l border-border",
      )}
    >
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        {icon}
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-0.5">
        <span
          className={cn("text-[19px] font-bold tabular-nums leading-none", color)}
        >
          {value ?? "—"}
        </span>
        {value !== null && (
          <span className="text-[11px] font-medium text-text-muted">
            {suffix}
          </span>
        )}
      </span>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// NudgeBanner — 상황 한 줄
// ─────────────────────────────────────────────────────────────
function NudgeBanner({
  message,
  accent,
}: {
  message: string;
  accent: "primary" | "accent" | "warning" | "neutral";
}) {
  return (
    <section className="mt-4">
      <div
        className={cn(
          "rounded-md border px-3.5 py-2.5",
          accent === "primary" && "border-primary/30 bg-primary/[0.04]",
          accent === "accent" && "border-accent/30 bg-accent/[0.04]",
          accent === "warning" && "border-warning/30 bg-warning/[0.04]",
          accent === "neutral" && "border-border bg-surface",
        )}
      >
        <p className="text-[13px] leading-[1.55] text-text-high">
          <Sparks
            className={cn(
              "mr-1 inline h-3.5 w-3.5 -translate-y-0.5",
              accent === "primary" && "text-primary",
              accent === "accent" && "text-accent",
              accent === "warning" && "text-warning",
              accent === "neutral" && "text-text-muted",
            )}
            strokeWidth={2}
          />
          {message}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Today Panel
// ─────────────────────────────────────────────────────────────
function TodayPanel({
  reviewDueCount,
  inProgress,
  categorySlug,
}: {
  reviewDueCount: number;
  inProgress: {
    id: string;
    title: string;
    solved: number;
    planned: number;
  } | null;
  categorySlug: string;
}) {
  const primary =
    reviewDueCount > 0
      ? ("review" as const)
      : inProgress
        ? ("continue" as const)
        : ("start" as const);

  return (
    <section className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        오늘 할 일
      </p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {primary === "review" ? (
          <TodayCard
            href="/mistakes"
            tone="accent"
            badge="복습"
            title={`잊을 때쯤 다시 풀 ${reviewDueCount}문제`}
            desc="맞힌 건 간격 늘려 재출제, 틀린 건 다음날."
            cta="바로 시작"
          />
        ) : primary === "continue" && inProgress ? (
          <TodayCard
            href={`/practice/${inProgress.id}`}
            tone="primary"
            badge="이어서"
            title={inProgress.title}
            desc={`${inProgress.solved}/${inProgress.planned} 풀었어요`}
            cta="이어서 풀기"
          />
        ) : (
          <TodayCard
            href={`/exams/${categorySlug}`}
            tone="primary"
            badge="시작"
            title="오늘 회차 하나 풀기"
            desc="연습모드는 답 즉시 채점 + 해설 실시간."
            cta="회차 고르기"
          />
        )}

        {primary === "review" && inProgress ? (
          <TodayCard
            href={`/practice/${inProgress.id}`}
            tone="primary"
            badge="이어서"
            title={inProgress.title}
            desc={`${inProgress.solved}/${inProgress.planned} 풀었어요`}
            cta="이어서"
          />
        ) : primary !== "review" && reviewDueCount > 0 ? (
          <TodayCard
            href="/mistakes"
            tone="accent"
            badge="복습"
            title={`복습할 ${reviewDueCount}문제`}
            desc="오답노트에서 바로 시작"
            cta="열기"
          />
        ) : (
          <TodayCard
            href={`/practice?category=${categorySlug}&mode=random`}
            tone="neutral"
            badge="워밍업"
            title="무작위 10문 풀기"
            desc="짧게 머리 푸는 시간 3분."
            cta="시작"
          />
        )}
      </div>
    </section>
  );
}

function TodayCard({
  href,
  tone,
  badge,
  title,
  desc,
  cta,
}: {
  href: string;
  tone: "primary" | "accent" | "neutral";
  badge: string;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-stretch justify-between gap-3 rounded-md border p-4 transition-colors md:p-5",
        tone === "primary" &&
          "border-primary/30 bg-primary/[0.04] hover:border-primary/60",
        tone === "accent" &&
          "border-accent/30 bg-accent/[0.04] hover:border-accent/60",
        tone === "neutral" && "border-border bg-surface hover:border-text-mid",
      )}
    >
      <div className="flex min-w-0 flex-col justify-between gap-2">
        <div>
          <span
            className={cn(
              "inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-semibold",
              tone === "primary" && "bg-primary/15 text-primary",
              tone === "accent" && "bg-accent/15 text-accent",
              tone === "neutral" && "bg-surface-mute text-text-mid",
            )}
          >
            {badge}
          </span>
          <h3 className="mt-2 text-[15px] font-bold tracking-[-0.01em] text-text-high md:text-[16px]">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] text-text-mid">{desc}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-semibold",
            tone === "primary" && "text-primary",
            tone === "accent" && "text-accent",
            tone === "neutral" && "text-text-mid group-hover:text-text-high",
          )}
        >
          {cta}
          <NavArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Daily Question Card
// ─────────────────────────────────────────────────────────────
function DailyQuestionCard({ categorySlug }: { categorySlug: string }) {
  return (
    <section className="mt-6">
      <Link
        href={`/practice?category=${categorySlug}&mode=daily`}
        className="group flex items-center gap-3 rounded-md border border-primary/30 bg-primary/[0.04] px-4 py-3.5 transition-colors hover:border-primary/60 md:px-5"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/15 text-primary">
          <Sparks className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            오늘의 한 문제
          </p>
          <p className="mt-0.5 text-[13.5px] font-semibold text-text-high">
            매일 자정에 바뀌어요. 1분이면 끝나요.
          </p>
        </div>
        <NavArrowRight
          className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </Link>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Yesterday Mistakes
// ─────────────────────────────────────────────────────────────
function YesterdayMistakes({
  items,
}: {
  items: {
    recordId: string;
    questionNumber: number;
    stem: string;
    subjectName: string;
    examYear: number | null;
    examRound: number | null;
    categorySlug: string;
  }[];
}) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            어제 틀린 것
          </p>
          <h2 className="mt-1 text-[15px] font-bold tracking-[-0.01em] text-text-high">
            다시 한 번만 볼까요?
          </h2>
        </div>
        <Link
          href="/mistakes"
          className="text-[11.5px] font-medium text-text-muted hover:text-text-mid"
        >
          전체 →
        </Link>
      </div>
      <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-2.5 md:overflow-visible md:px-0">
        {items.map((it) => {
          const href =
            it.examYear && it.examRound
              ? `/exams/${it.categorySlug}/rounds/${it.examYear}-${it.examRound}`
              : "/mistakes";
          return (
            <li
              key={it.recordId}
              className="w-[76%] shrink-0 snap-start md:w-auto"
            >
              <Link
                href={href}
                className="group flex h-full flex-col gap-2 rounded-md border border-danger/20 bg-danger/[0.03] p-3.5 transition-colors hover:border-danger/40"
              >
                <div className="flex items-center gap-2 text-[10.5px] text-text-muted">
                  <span className="inline-flex h-4 items-center rounded-sm bg-danger/15 px-1 font-semibold text-danger">
                    오답
                  </span>
                  <span className="font-semibold text-text-mid">
                    Q.{String(it.questionNumber).padStart(2, "0")}
                  </span>
                  <span>·</span>
                  <span>{it.subjectName}</span>
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-[13px] leading-[1.55] text-text-high">
                  {stripTagsShort(it.stem)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Score Trend
// ─────────────────────────────────────────────────────────────
function ScoreTrend({
  points,
}: {
  points: { score: number; date: Date }[];
}) {
  const w = 600;
  const h = 80;
  const pad = 8;
  const n = points.length;
  const stepX = (w - pad * 2) / Math.max(n - 1, 1);

  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - p.score / 100);
    return { x, y, score: p.score };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const guideY = pad + (h - pad * 2) * (1 - 60 / 100);

  const last = points[points.length - 1];
  const first = points[0];
  const diff = last.score - first.score;

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          점수 흐름
        </p>
        <p
          className={cn(
            "text-[11.5px] font-semibold tabular-nums",
            diff > 0
              ? "text-accent"
              : diff < 0
                ? "text-danger"
                : "text-text-muted",
          )}
        >
          {diff > 0 ? "▲" : diff < 0 ? "▼" : "—"} {Math.abs(diff)}점
          <span className="ml-1 font-normal text-text-muted">
            ({points.length}회)
          </span>
        </p>
      </div>
      <div className="mt-2 rounded-md border border-border bg-surface p-3">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1={pad}
            x2={w - pad}
            y1={guideY}
            y2={guideY}
            stroke="rgb(var(--border))"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <path
            d={path}
            fill="none"
            stroke="rgb(var(--primary))"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={i === n - 1 ? 3.5 : 2}
              fill="rgb(var(--primary))"
            />
          ))}
          <text
            x={w - pad}
            y={guideY - 3}
            textAnchor="end"
            className="fill-text-muted"
            style={{ fontSize: 9 }}
          >
            합격선 60
          </text>
        </svg>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Week Compare
// ─────────────────────────────────────────────────────────────
function WeekCompareCard({
  thisWeek,
  lastWeek,
}: {
  thisWeek: { total: number; acc: number | null };
  lastWeek: { total: number; acc: number | null };
}) {
  const totalDelta = thisWeek.total - lastWeek.total;
  const accDelta =
    thisWeek.acc != null && lastWeek.acc != null
      ? thisWeek.acc - lastWeek.acc
      : null;
  return (
    <section className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        이번 주 vs 지난 주
      </p>
      <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-md border border-border bg-surface">
        <CompareCell
          icon={<BookStack className="h-3.5 w-3.5" strokeWidth={2} />}
          label="풀이량"
          current={`${thisWeek.total}문`}
          prev={`지난주 ${lastWeek.total}문`}
          delta={totalDelta}
          suffix="문"
          positiveIsGood
        />
        <CompareCell
          icon={<CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />}
          label="정답률"
          current={thisWeek.acc != null ? `${thisWeek.acc}%` : "—"}
          prev={lastWeek.acc != null ? `지난주 ${lastWeek.acc}%` : "지난주 —"}
          delta={accDelta}
          suffix="%p"
          positiveIsGood
          bordered
        />
      </div>
    </section>
  );
}

function CompareCell({
  icon,
  label,
  current,
  prev,
  delta,
  suffix,
  positiveIsGood,
  bordered,
}: {
  icon: React.ReactNode;
  label: string;
  current: string;
  prev: string;
  delta: number | null;
  suffix: string;
  positiveIsGood: boolean;
  bordered?: boolean;
}) {
  const goodColor = positiveIsGood ? "text-accent" : "text-danger";
  const badColor = positiveIsGood ? "text-danger" : "text-accent";
  return (
    <div className={cn("px-4 py-3.5", bordered && "border-l border-border")}>
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        {icon}
        {label}
      </span>
      <p className="mt-1 text-[20px] font-bold tabular-nums leading-none tracking-[-0.01em] text-text-high">
        {current}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px]">
        <span className="text-text-muted">{prev}</span>
        {delta != null && delta !== 0 && (
          <span
            className={cn(
              "font-semibold tabular-nums",
              delta > 0 ? goodColor : badColor,
            )}
          >
            {delta > 0 ? "▲" : "▼"}
            {Math.abs(delta)}
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Time of Day Insight
// ─────────────────────────────────────────────────────────────
function TimeOfDayInsight({
  buckets,
}: {
  buckets: { name: string; from: number; to: number; total: number; correct: number }[];
}) {
  const withData = buckets.filter((b) => b.total > 0);
  if (withData.length === 0) return null;
  const best = [...withData].sort(
    (a, b) => b.correct / b.total - a.correct / a.total,
  )[0];
  const worst = [...withData].sort(
    (a, b) => a.correct / a.total - b.correct / b.total,
  )[0];

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          시간대별 정답률
        </p>
        <p className="text-[11.5px] text-text-muted">
          <Clock className="mr-0.5 inline h-3 w-3" strokeWidth={2} />
          최근 기록
        </p>
      </div>
      <div className="mt-2 rounded-md border border-border bg-surface p-4">
        <ul className="grid grid-cols-4 gap-2">
          {buckets.map((b) => {
            const rate =
              b.total > 0 ? Math.round((b.correct / b.total) * 100) : null;
            return (
              <li key={b.name} className="flex flex-col items-center gap-1.5">
                <div className="h-16 w-full overflow-hidden rounded-sm bg-surface-mute">
                  <div
                    className={cn(
                      "w-full transition-all",
                      rate == null
                        ? ""
                        : rate >= 60
                          ? "bg-accent"
                          : rate >= 40
                            ? "bg-warning"
                            : "bg-danger",
                    )}
                    style={{
                      height: rate != null ? `${rate}%` : "0%",
                      marginTop: rate != null ? `${100 - rate}%` : "100%",
                    }}
                  />
                </div>
                <p className="text-[11px] font-medium text-text-mid">
                  {b.name}
                </p>
                <p
                  className={cn(
                    "text-[11.5px] font-bold tabular-nums",
                    rate == null
                      ? "text-text-muted"
                      : rate >= 60
                        ? "text-accent"
                        : rate >= 40
                          ? "text-warning"
                          : "text-danger",
                  )}
                >
                  {rate != null ? `${rate}%` : "—"}
                </p>
              </li>
            );
          })}
        </ul>
        {best && worst && best.name !== worst.name && (
          <p className="mt-3 border-t border-border-soft pt-3 text-[12px] leading-[1.55] text-text-mid">
            <strong className="text-text-high">{best.name}</strong>에 가장
            잘 맞추고 (<span className="tabular-nums">
              {Math.round((best.correct / best.total) * 100)}%
            </span>
            ),{" "}
            <strong className="text-danger">{worst.name}</strong>엔 떨어져요
            (<span className="tabular-nums">
              {Math.round((worst.correct / worst.total) * 100)}%
            </span>
            ).
          </p>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Confidence Analysis
// ─────────────────────────────────────────────────────────────
function ConfidenceAnalysis({
  buckets,
}: {
  buckets: {
    GUESS: { total: number; correct: number };
    UNSURE: { total: number; correct: number };
    CONFIDENT: { total: number; correct: number };
  };
}) {
  const rows = [
    { key: "CONFIDENT", label: "확신", color: "accent" as const },
    { key: "UNSURE", label: "애매", color: "warning" as const },
    { key: "GUESS", label: "찍음", color: "danger" as const },
  ] as const;

  return (
    <section className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        자신감 vs 정답률
      </p>
      <div className="mt-2 rounded-md border border-border bg-surface p-4">
        <ul className="space-y-3">
          {rows.map((r) => {
            const b = buckets[r.key];
            const rate =
              b.total > 0 ? Math.round((b.correct / b.total) * 100) : null;
            return (
              <li key={r.key} className="space-y-1">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="font-medium text-text-mid">{r.label}</span>
                  <span className="tabular-nums text-text-muted">
                    <span className="text-text-mid">{b.correct}</span>/{b.total}{" "}
                    ·{" "}
                    <span
                      className={cn(
                        "font-bold",
                        rate == null
                          ? "text-text-muted"
                          : r.color === "accent"
                            ? "text-accent"
                            : r.color === "warning"
                              ? "text-warning"
                              : "text-danger",
                      )}
                    >
                      {rate != null ? `${rate}%` : "—"}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-sm bg-surface-mute">
                  <div
                    className={cn(
                      "h-full",
                      r.color === "accent" && "bg-accent",
                      r.color === "warning" && "bg-warning",
                      r.color === "danger" && "bg-danger",
                    )}
                    style={{ width: rate != null ? `${rate}%` : "0%" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {buckets.GUESS.total > 0 && buckets.GUESS.correct > 0 && (
          <p className="mt-3 border-t border-border-soft pt-3 text-[12px] leading-[1.55] text-text-mid">
            찍어서 맞은 게{" "}
            <strong className="tabular-nums text-danger">
              {buckets.GUESS.correct}문제
            </strong>
            . 이건 실력 아니에요, 복습 1순위.
          </p>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Review Distribution — 망각 곡선
// ─────────────────────────────────────────────────────────────
function ReviewDistribution({
  buckets,
}: {
  buckets: { label: string; count: number }[];
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          복습 대기
        </p>
        <p className="text-[11.5px] text-text-muted">
          총 <span className="tabular-nums font-semibold">{total}</span>문 예정
        </p>
      </div>
      <div className="mt-2 rounded-md border border-border bg-surface p-4">
        <ul className="flex items-end gap-2 h-24">
          {buckets.map((b) => {
            const h = (b.count / max) * 100;
            const isToday = b.label === "오늘" && b.count > 0;
            return (
              <li
                key={b.label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10.5px] tabular-nums font-semibold text-text-mid">
                  {b.count}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-sm",
                    isToday ? "bg-primary" : "bg-text-mid/30",
                  )}
                  style={{ height: b.count > 0 ? `${Math.max(h, 6)}%` : "2px" }}
                />
                <span
                  className={cn(
                    "text-[10.5px]",
                    isToday ? "font-semibold text-primary" : "text-text-muted",
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
  );
}

// ─────────────────────────────────────────────────────────────
// Weak Subjects (linkable to subject page)
// ─────────────────────────────────────────────────────────────
function WeakSubjects({
  subjects,
  categorySlug,
}: {
  subjects: { name: string; slug: string; rate: number; total: number }[];
  categorySlug: string;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          약점 과목
        </p>
        <Link
          href="/dashboard"
          className="text-[11.5px] font-medium text-text-muted hover:text-text-mid"
        >
          상세 →
        </Link>
      </div>
      <ul className="mt-2 space-y-1 rounded-md border border-border bg-surface p-2">
        {subjects.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/exams/${categorySlug}/subjects/${s.slug}`}
              className="group flex items-center gap-3 rounded-sm px-2 py-1.5 transition-colors hover:bg-surface-mute"
            >
              <WarningTriangle
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  s.rate < 40 ? "text-danger" : "text-warning",
                )}
                strokeWidth={2}
              />
              <span className="truncate text-[13px] font-medium text-text-high">
                {s.name}
              </span>
              <span className="ml-auto flex items-center gap-2 text-[11.5px]">
                <span className="text-text-muted tabular-nums">
                  {s.total}문
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    s.rate >= 60 ? "text-accent" : "text-danger",
                  )}
                >
                  {s.rate}%
                </span>
                <NavArrowRight
                  className="h-3.5 w-3.5 text-text-muted transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Subject List — 과목별 풀어보기
// ─────────────────────────────────────────────────────────────
function SubjectList({
  categorySlug,
  subjects,
}: {
  categorySlug: string;
  subjects: {
    slug: string;
    name: string;
    questionCount: number;
    solved: number;
    mastered: number;
    progress: number;
  }[];
}) {
  if (subjects.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            과목별 마스터율
          </p>
          <h2 className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-text-high md:text-[18px]">
            단원별 연습 + 마스터
          </h2>
          <p className="mt-1 text-[11px] text-text-muted">
            마스터 = 가장 최근 풀이가 정답인 문제
          </p>
        </div>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {subjects.map((s) => {
          const pct = Math.round(s.progress * 100);
          const solvedPct =
            s.questionCount > 0
              ? Math.round((s.solved / s.questionCount) * 100)
              : 0;
          return (
            <li key={s.slug}>
              <Link
                href={`/exams/${categorySlug}/subjects/${s.slug}`}
                className="group flex flex-col gap-2 rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-text-mid"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[13.5px] font-semibold text-text-high">
                    {s.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 text-[11.5px] font-bold tabular-nums",
                      pct >= 80
                        ? "text-accent"
                        : pct > 0
                          ? "text-primary"
                          : "text-text-muted",
                    )}
                  >
                    {pct}%
                  </span>
                </div>
                {/* 마스터(진한) + 풀이만 한 비율(연한) 이중 바 */}
                <div className="relative h-[4px] overflow-hidden rounded-sm bg-border-soft">
                  <div
                    className="absolute inset-y-0 left-0 bg-text-mid/30"
                    style={{ width: `${solvedPct}%` }}
                  />
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0",
                      pct >= 80 ? "bg-accent" : "bg-primary",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  마스터{" "}
                  <span className="tabular-nums font-semibold text-text-mid">
                    {s.mastered}
                  </span>{" "}
                  · 풀이{" "}
                  <span className="tabular-nums">{s.solved}</span>/
                  <span className="tabular-nums">{s.questionCount}</span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Round List
// ─────────────────────────────────────────────────────────────
function RoundList({
  categorySlug,
  exams,
}: {
  categorySlug: string;
  exams: {
    id: string;
    year: number;
    round: number;
    title: string;
    totalQuestions: number;
    published: boolean;
    attempt: {
      id: string;
      finished: boolean;
      score: number | null;
      solved: number;
      planned: number;
    } | null;
  }[];
}) {
  const visible = exams.filter((e) => e.published);
  const shown = visible.length > 0 ? visible : exams;
  if (shown.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            기출 회차
          </p>
          <h2 className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-text-high md:text-[18px]">
            회차 골라 풀기
          </h2>
        </div>
        <Link
          href={`/exams/${categorySlug}`}
          className="text-[12px] font-medium text-text-muted transition-colors hover:text-text-mid"
        >
          전체 회차 →
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
        {shown.slice(0, 6).map((e) => (
          <li key={e.id}>
            <RoundRow categorySlug={categorySlug} exam={e} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RoundRow({
  categorySlug,
  exam,
}: {
  categorySlug: string;
  exam: {
    id: string;
    year: number;
    round: number;
    title: string;
    totalQuestions: number;
    published: boolean;
    attempt: {
      id: string;
      finished: boolean;
      score: number | null;
      solved: number;
      planned: number;
    } | null;
  };
}) {
  const { attempt, published } = exam;
  const href = published
    ? `/exams/${categorySlug}/rounds/${exam.year}-${exam.round}`
    : `/exams/${categorySlug}`;

  const status = attempt?.finished
    ? "done"
    : attempt
      ? "inprogress"
      : "fresh";

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 px-4 py-3.5 transition-colors md:px-5",
        published ? "hover:bg-surface-mute" : "opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm",
          status === "done" && "bg-accent/15 text-accent",
          status === "inprogress" && "bg-primary/15 text-primary",
          status === "fresh" && "bg-surface-mute text-text-muted",
        )}
      >
        {status === "done" ? (
          <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : status === "inprogress" ? (
          <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <BookStack className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-semibold text-text-high md:text-[15px]">
            {exam.year}년 {exam.round}회차
          </span>
          {!published && (
            <span className="rounded-sm border border-border px-1.5 py-0 text-[10px] text-text-muted">
              준비중
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11.5px] text-text-muted">
          {exam.totalQuestions > 0 ? (
            <>
              <span className="tabular-nums">{exam.totalQuestions}</span>문제
              {attempt && !attempt.finished && (
                <>
                  <span className="mx-1.5">·</span>
                  <span className="text-primary">
                    <span className="tabular-nums">{attempt.solved}</span>
                    /<span className="tabular-nums">{attempt.planned}</span>{" "}
                    풀이중
                  </span>
                </>
              )}
              {attempt?.finished && attempt.score != null && (
                <>
                  <span className="mx-1.5">·</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      attempt.score >= 60 ? "text-accent" : "text-danger",
                    )}
                  >
                    {attempt.score}점
                  </span>
                </>
              )}
            </>
          ) : (
            <span>문제 준비중</span>
          )}
        </p>
      </div>

      <NavArrowRight
        className={cn(
          "h-4 w-4 shrink-0 text-text-muted transition-all",
          published && "group-hover:translate-x-0.5 group-hover:text-text-high",
        )}
        strokeWidth={2}
      />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Tools Dock
// ─────────────────────────────────────────────────────────────
function ToolsDock({
  mistakeCount,
  bookmarkCount,
  categorySlug,
}: {
  mistakeCount: number;
  bookmarkCount: number;
  categorySlug: string;
}) {
  const items = [
    {
      href: "/review",
      label: "복습",
      Icon: Flash,
      badge: null,
    },
    {
      href: "/mistakes",
      label: "오답",
      Icon: XmarkCircle,
      badge: mistakeCount > 0 ? mistakeCount : null,
    },
    {
      href: "/bookmarks",
      label: "북마크",
      Icon: BookmarkIcon,
      badge: bookmarkCount > 0 ? bookmarkCount : null,
    },
    {
      href: "/dashboard",
      label: "내 기록",
      Icon: GraphUp,
      badge: null,
    },
    {
      href: `/practice?category=${categorySlug}&mode=random`,
      label: "무작위",
      Icon: Shuffle,
      badge: null,
    },
    {
      href: "/exams",
      label: "다른 시험",
      Icon: Notes,
      badge: null,
    },
  ];
  return (
    <section className="mt-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        도구
      </p>
      <ul className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="group flex flex-col items-center gap-1.5 rounded-md border border-border bg-surface py-3 transition-colors hover:border-text-mid"
            >
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm bg-surface-mute text-text-mid group-hover:text-text-high">
                <it.Icon className="h-4 w-4" strokeWidth={2} />
                {it.badge != null && (
                  <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-primary px-1 py-0 text-center font-mono text-[9px] font-bold tabular-nums text-primary-fg">
                    {it.badge > 99 ? "99+" : it.badge}
                  </span>
                )}
              </span>
              <span className="text-[10.5px] font-medium text-text-mid group-hover:text-text-high">
                {it.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function estimatePassProb(avg: number, n: number): number {
  const k = 0.12;
  const raw = 1 / (1 + Math.exp(-k * (avg - 60)));
  const confidence = Math.min(n / 3, 1);
  const prob = 0.5 + (raw - 0.5) * confidence;
  return Math.round(prob * 100);
}

/**
 * 합격 확률 점추정 + 신뢰구간 (점수 평균의 95% CI 를 로지스틱에 통과)
 * - n=1 이면 ±15점 폭 가정 (불확실성)
 * - n>=2 이면 표본 표준편차 / sqrt(n) * 1.96
 */
function computePassProbInterval(scores: number[]): {
  prob: number;
  lower: number;
  upper: number;
  n: number;
} | null {
  if (scores.length === 0) return null;
  const n = scores.length;
  const mean = scores.reduce((s, v) => s + v, 0) / n;

  let halfWidth = 15;
  if (n >= 2) {
    const variance =
      scores.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
    const stddev = Math.sqrt(variance);
    halfWidth = (1.96 * stddev) / Math.sqrt(n);
  }

  const meanLow = Math.max(0, mean - halfWidth);
  const meanHigh = Math.min(100, mean + halfWidth);
  return {
    prob: estimatePassProb(mean, n),
    lower: estimatePassProb(meanLow, n),
    upper: estimatePassProb(meanHigh, n),
    n,
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 일요일=0
  x.setDate(x.getDate() - day);
  return x;
}

function stripTagsShort(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/\$[^$]+\$/g, "[식]")
    .replace(/\s+/g, " ")
    .trim();
}

function pickNudge(args: {
  streakDays: number;
  mistakeCount: number;
  passProb: number | null;
  reviewDueCount: number;
  weakSubject: { name: string; rate: number } | undefined;
  avgScore: number | null;
  thisWeekTotal: number;
  lastWeekTotal: number;
}): { message: string; accent: "primary" | "accent" | "warning" | "neutral" } {
  // 우선순위 순
  if (args.passProb != null && args.passProb >= 70) {
    return {
      message: "합격권 진입. 이 페이스만 유지하세요.",
      accent: "accent",
    };
  }
  if (args.weakSubject && args.weakSubject.rate < 40) {
    return {
      message: `${args.weakSubject.name}이 ${args.weakSubject.rate}%로 발목 잡고 있어요. 이 과목만 10문 풀어볼까요?`,
      accent: "warning",
    };
  }
  if (args.reviewDueCount >= 10) {
    return {
      message: `복습 ${args.reviewDueCount}문제 밀림. 한 번 돌려야 점수 올라요.`,
      accent: "primary",
    };
  }
  if (args.streakDays >= 3) {
    return {
      message: `${args.streakDays}일 연속 풀고 있어요. 이 페이스면 3주 안에 한 바퀴.`,
      accent: "accent",
    };
  }
  if (args.mistakeCount >= 10) {
    return {
      message: `오답 ${args.mistakeCount}개가 쌓였어요. 복습 한 번 돌려야 해요.`,
      accent: "warning",
    };
  }
  if (args.thisWeekTotal > args.lastWeekTotal && args.lastWeekTotal > 0) {
    return {
      message: `이번 주 풀이가 지난주 대비 ${Math.round(
        (args.thisWeekTotal / args.lastWeekTotal - 1) * 100,
      )}% 늘었어요.`,
      accent: "accent",
    };
  }
  if (args.passProb != null && args.passProb >= 50) {
    return {
      message: "합격 턱 밑. 오답 위주로만 한 번 긁으면 돼요.",
      accent: "primary",
    };
  }
  if (args.streakDays === 0) {
    return {
      message: "오늘 아직 한 문제도 안 풀었어요. 1분이면 돼요.",
      accent: "warning",
    };
  }
  return {
    message: "꾸준히 풀수록 합격 예측이 더 정확해져요.",
    accent: "neutral",
  };
}

