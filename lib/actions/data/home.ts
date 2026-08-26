// 서버 전용 모듈. "use server" 아님 — 서버 컴포넌트에서 직접 호출.
// (cached const 를 export 하려면 "use server" 와 충돌. 행동을 일으키지 않으므로
//  RPC endpoint 로 등록할 필요 없음.)
import "server-only";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { publishedExplanationWhere } from "../../explanation-visibility";

// ─── 공개 데이터 캐시 ──────────────────────────────────────────
// 카테고리/과목/회차/공개해설 — 모든 유저 동일하므로 1시간 캐시.
// 시드를 다시 돌리거나 새 해설 추가됐을 때 revalidateTag("home-public") 로 무효화.
const getPublicHomeData = unstable_cache(
  async () => {
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
      where: publishedExplanationWhere,
      distinct: ["questionId"],
      select: { question: { select: { examId: true } } },
    });
    const publishedExamIds = Array.from(
      new Set(
        publishedByExam.map((e) => e.question.examId).filter(Boolean) as string[],
      ),
    );
    return { categories, publishedExamIds };
  },
  ["home-public-v1"],
  { revalidate: 3600, tags: ["home-public", "categories", "explanations"] },
);

const OWNER_MAP: Record<string, string> = {
  "civil-engineer-gisa": "정호",
  "hvac-refrigeration-gisa": "호준",
  "3d-printer-gineungsa": "호성",
};

// ─── 타입 ──────────────────────────────────────────────────────

export type HomePickerCategory = {
  slug: string;
  name: string;
  owner: string;
  publishedCount: number;
};

export type HomeNudge = {
  message: string;
  accent: "primary" | "accent" | "warning" | "neutral";
};

export type HomeYesterdayItem = {
  recordId: string;
  questionNumber: number;
  stem: string;
  subjectName: string;
  examYear: number | null;
  examRound: number | null;
};

export type HomeScorePoint = { score: number; dateIso: string };

export type HomeHourBucket = {
  name: string;
  from: number;
  to: number;
  total: number;
  correct: number;
};

export type HomeConfBuckets = {
  GUESS: { total: number; correct: number };
  UNSURE: { total: number; correct: number };
  CONFIDENT: { total: number; correct: number };
};

export type HomeSrsBucket = { label: string; count: number };

export type HomeWeakSubject = {
  name: string;
  slug: string;
  rate: number;
  total: number;
};

export type HomeSubjectRow = {
  slug: string;
  name: string;
  questionCount: number;
  solved: number;
  mastered: number;
  progress: number;
};

export type HomeRoundAttempt = {
  id: string;
  finished: boolean;
  score: number | null;
  solved: number;
  planned: number;
};

export type HomeRoundRow = {
  id: string;
  year: number;
  round: number;
  title: string;
  totalQuestions: number;
  published: boolean;
  attempt: HomeRoundAttempt | null;
};

export type HomeSelected = {
  id: string;
  slug: string;
  name: string;
  nickname: string | null;
  owner: string;
  // 합격 예측
  passProb: number | null;
  passLow: number | null;
  passHigh: number | null;
  attemptCount: number;
  // Week strip
  streakDays: number;
  thisWeekTotal: number;
  thisWeekAcc: number | null;
  avgScore: number | null;
  // D-day
  dday: {
    examDateIso: string | null;
    dailyGoal: number | null;
    todaySolved: number;
    isCurrentCategory: boolean;
  } | null;
  // Nudge
  nudge: HomeNudge;
  // Today panel
  reviewDueCount: number;
  inProgress: {
    id: string;
    title: string;
    solved: number;
    planned: number;
  } | null;
  // 어제
  yesterdayMistakes: HomeYesterdayItem[];
  // 점수 흐름
  scoreTrendPoints: HomeScorePoint[];
  // 주간 비교
  lastWeekTotal: number;
  lastWeekAcc: number | null;
  // 시간대
  hourRecordsLength: number;
  hourBuckets: HomeHourBucket[];
  // 자신감
  confidenceRecordsLength: number;
  confBuckets: HomeConfBuckets;
  // SRS 분포
  reviewAllLength: number;
  srsBuckets: HomeSrsBucket[];
  // 약점 / 단원 / 회차
  weakSubjects: HomeWeakSubject[];
  subjects: HomeSubjectRow[];
  rounds: HomeRoundRow[];
  // 도구
  mistakeCount: number;
  bookmarkCount: number;
};

export type HomeData = {
  // Picker
  showPicker: boolean;
  isTempViewing: boolean;
  userTargetSlug: string | null;
  pickerCategories: HomePickerCategory[];
  selectedSlug: string;
  // 본 콘텐츠 (선택된 카테고리 없으면 null)
  selected: HomeSelected | null;
};

// ─── 액션 ──────────────────────────────────────────────────────

export async function getHomeData(args: {
  exam?: string;
}): Promise<HomeData> {
  const user = await getCurrentUser();
  const pickedSlug = args.exam;

  // 공개 데이터 (캐시) + 유저 데이터 (실시간) 병렬
  const { categories, publishedExamIds: publishedExamIdsArr } =
    await getPublicHomeData();
  const publishedExamIds = new Set(publishedExamIdsArr);

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

  const isAdmin = user?.nickname === "관리자";
  const showPicker = !!pickedSlug || isAdmin || !user?.targetCategoryId;
  const isTempViewing =
    !!pickedSlug && !!userTargetSlug && pickedSlug !== userTargetSlug;

  const pickerCategories: HomePickerCategory[] = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    owner: OWNER_MAP[c.slug] ?? "",
    publishedCount: c.exams.filter((e) => publishedExamIds.has(e.id)).length,
  }));

  if (!selectedCat) {
    return {
      showPicker,
      isTempViewing,
      userTargetSlug,
      pickerCategories,
      selectedSlug: selectedSlug ?? "",
      selected: null,
    };
  }

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
    yesterdayMistakesRaw,
    thisWeekRecs,
    lastWeekRecs,
    hourRecords,
    confidenceRecords,
    reviewAll,
    todaySolved,
    subjectAnswerCounts,
    allAttempts,
  ] = await Promise.all([
    user
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
    user
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
    user
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
    user
      ? prisma.reviewSchedule.count({
          where: {
            userId: user.id,
            nextReviewAt: { lte: now },
            question: { subject: { categoryId: selectedCat.id } },
          },
        })
      : Promise.resolve(0),
    user
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
    user
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
    user
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            answeredAt: { gte: weekStart },
            question: { subject: { categoryId: selectedCat.id } },
          },
          select: { isCorrect: true },
        })
      : Promise.resolve([]),
    user
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            answeredAt: { gte: lastWeekStart, lt: weekStart },
            question: { subject: { categoryId: selectedCat.id } },
          },
          select: { isCorrect: true },
        })
      : Promise.resolve([]),
    user
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
    user
      ? prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            question: { subject: { categoryId: selectedCat.id } },
            confidence: { not: null },
          },
          select: { confidence: true, isCorrect: true },
        })
      : Promise.resolve([]),
    user
      ? prisma.reviewSchedule.findMany({
          where: {
            userId: user.id,
            question: { subject: { categoryId: selectedCat.id } },
          },
          select: { nextReviewAt: true },
        })
      : Promise.resolve([]),
    user
      ? prisma.answerRecord.count({
          where: {
            userId: user.id,
            answeredAt: { gte: todayStart, lt: tomorrowStart },
            question: { subject: { categoryId: selectedCat.id } },
          },
        })
      : Promise.resolve(0),
    user
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
    user
      ? prisma.attempt.findMany({
          where: { userId: user.id, exam: { categoryId: selectedCat.id } },
          orderBy: { startedAt: "desc" },
          include: { _count: { select: { records: true } } },
        })
      : Promise.resolve([]),
  ]);

  // 가공
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
  const avgScoreNum =
    scoredAttempts.length > 0
      ? scoredAttempts.reduce((sum, s) => sum + s, 0) / scoredAttempts.length
      : null;
  const passProbInterval = computePassProbInterval(scoredAttempts);

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
  const weakSubjects: HomeWeakSubject[] = Array.from(subjectMap.values())
    .filter((s) => s.total >= 3)
    .map((s) => ({ ...s, rate: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);

  const hourBuckets: HomeHourBucket[] = [
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

  const confBuckets: HomeConfBuckets = {
    GUESS: { total: 0, correct: 0 },
    UNSURE: { total: 0, correct: 0 },
    CONFIDENT: { total: 0, correct: 0 },
  };
  for (const r of confidenceRecords) {
    const c = r.confidence as keyof HomeConfBuckets | null;
    if (!c || !(c in confBuckets)) continue;
    confBuckets[c].total += 1;
    if (r.isCorrect) confBuckets[c].correct += 1;
  }

  const srsBuckets: HomeSrsBucket[] = [
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
  const attemptMap = new Map<string, HomeRoundAttempt>();
  for (const a of allAttempts) {
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

  const subjects: HomeSubjectRow[] = selectedCat.subjects.map((s) => {
    const subjectRecs = subjectAnswerCounts.filter(
      (r) => r.question.subject.slug === s.slug,
    );
    const solved = subjectRecs.length;
    const mastered = subjectRecs.filter((r) => r.isCorrect).length;
    const total = s._count.questions;
    const progress = total > 0 ? mastered / total : 0;
    return {
      slug: s.slug,
      name: s.name,
      questionCount: total,
      solved,
      mastered,
      progress,
    };
  });

  const rounds: HomeRoundRow[] = selectedCat.exams.map((e) => ({
    id: e.id,
    year: e.year,
    round: e.round,
    title: e.title,
    totalQuestions: e.totalQuestions,
    published: publishedExamIds.has(e.id),
    attempt: attemptMap.get(e.id) ?? null,
  }));

  const yesterdayMistakes: HomeYesterdayItem[] = yesterdayMistakesRaw.map(
    (r) => ({
      recordId: r.id,
      questionNumber: r.question.number,
      stem: r.question.stem,
      subjectName: r.question.subject.name,
      examYear: r.question.exam?.year ?? null,
      examRound: r.question.exam?.round ?? null,
    }),
  );

  const scoreTrendPoints: HomeScorePoint[] = finishedAttempts
    .slice()
    .reverse()
    .map((a) => ({
      score: a.score ?? 0,
      dateIso: (a.finishedAt ?? new Date()).toISOString(),
    }));

  const streakDays = user?.streakDays ?? 0;
  const nickname = user?.nickname ?? null;
  const passProb = passProbInterval?.prob ?? null;

  const nudge = pickNudge({
    streakDays,
    mistakeCount,
    passProb,
    reviewDueCount,
    weakSubject: weakSubjects[0],
    avgScore: avgScoreNum != null ? Math.round(avgScoreNum) : null,
    thisWeekTotal,
    lastWeekTotal,
  });

  return {
    showPicker,
    isTempViewing,
    userTargetSlug,
    pickerCategories,
    selectedSlug: selectedSlug ?? "",
    selected: {
      id: selectedCat.id,
      slug: selectedCat.slug,
      name: selectedCat.name,
      nickname,
      owner: OWNER_MAP[selectedCat.slug] ?? "",
      passProb,
      passLow: passProbInterval?.lower ?? null,
      passHigh: passProbInterval?.upper ?? null,
      attemptCount: scoredAttempts.length,
      streakDays,
      thisWeekTotal,
      thisWeekAcc,
      avgScore: avgScoreNum != null ? Math.round(avgScoreNum) : null,
      dday: user
        ? {
            examDateIso:
              user.targetCategoryId === selectedCat.id && user.targetExamDate
                ? user.targetExamDate.toISOString()
                : null,
            dailyGoal:
              user.targetCategoryId === selectedCat.id
                ? (user.dailyGoal ?? null)
                : null,
            todaySolved,
            isCurrentCategory: user.targetCategoryId === selectedCat.id,
          }
        : null,
      nudge,
      reviewDueCount,
      inProgress:
        inProgress && inProgress.exam
          ? {
              id: inProgress.id,
              title: inProgress.exam.title,
              solved: inProgress._count.records,
              planned: inProgress.plannedQuestionIds.length,
            }
          : null,
      yesterdayMistakes,
      scoreTrendPoints,
      lastWeekTotal,
      lastWeekAcc,
      hourRecordsLength: hourRecords.length,
      hourBuckets,
      confidenceRecordsLength: confidenceRecords.length,
      confBuckets,
      reviewAllLength: reviewAll.length,
      srsBuckets,
      weakSubjects,
      subjects,
      rounds,
      mistakeCount,
      bookmarkCount,
    },
  };
}

// ─── helpers ──────────────────────────────────────────────────

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
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

function estimatePassProb(avg: number, n: number): number {
  const k = 0.12;
  const raw = 1 / (1 + Math.exp(-k * (avg - 60)));
  const confidence = Math.min(n / 3, 1);
  const prob = 0.5 + (raw - 0.5) * confidence;
  return Math.round(prob * 100);
}

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

function pickNudge(args: {
  streakDays: number;
  mistakeCount: number;
  passProb: number | null;
  reviewDueCount: number;
  weakSubject: { name: string; rate: number } | undefined;
  avgScore: number | null;
  thisWeekTotal: number;
  lastWeekTotal: number;
}): HomeNudge {
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
