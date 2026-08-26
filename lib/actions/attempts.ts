"use server";

import prisma from "@/lib/prisma";
import { getOrCreateAnonUser } from "@/lib/auth/anon";
import {
  AttemptMode,
  QuestionType,
} from "@/lib/generated/prisma-client";
import { markTodayActivity, scheduleReview } from "./user-actions";
import { isImageDependentQuestion } from "@/lib/exam-images";

type StartParams = {
  categorySlug: string;
  subjectSlug?: string;
  examSlug?: string; // "YYYY-N"
  /** 약점 집중 — 이 태그가 붙은 문항만 모아 푼다 */
  tag?: string;
  mode:
    | "sequence"
    | "random"
    | "wrong"
    | "cbt"
    | "practice"
    | "mock"
    | "daily"
    | "weak";
};

function mapMode(m: StartParams["mode"]): AttemptMode {
  switch (m) {
    case "cbt":
    case "mock":
      return AttemptMode.EXAM;
    case "wrong":
      return AttemptMode.REVIEW;
    case "weak":
      return AttemptMode.WEAK;
    default:
      return AttemptMode.PRACTICE;
  }
}

export async function startAttempt(p: StartParams) {
  const user = await getOrCreateAnonUser();

  const category = await prisma.category.findUnique({
    where: { slug: p.categorySlug },
  });
  if (!category) throw new Error("카테고리를 찾을 수 없습니다.");

  const where: {
    subject: { categoryId: string; slug?: string };
    examId?: string;
    tags?: { has: string };
  } = {
    subject: { categoryId: category.id },
  };

  // 약점 태그로 모아 풀기 — 대시보드의 "무엇을 모르는지"에서 바로 넘어온다
  if (p.tag) {
    where.tags = { has: p.tag };
  }

  if (p.subjectSlug) {
    where.subject.slug = p.subjectSlug;
  }

  let examRecord = null;
  if (p.examSlug) {
    const m = p.examSlug.match(/^(\d{4})-(\d+)$/);
    if (m) {
      examRecord = await prisma.exam.findFirst({
        where: {
          categoryId: category.id,
          year: parseInt(m[1], 10),
          round: parseInt(m[2], 10),
        },
      });
      if (examRecord) {
        where.examId = examRecord.id;
      }
    }
  }

  const allRaw = await prisma.question.findMany({
    where,
    orderBy: [
      { subject: { orderIdx: "asc" } },
      { number: "asc" },
    ],
    include: {
      subject: true,
      exam: { select: { pdfUrl: true } },
    },
  });

  // 베타: 그림/도식 있는 문제는 풀이에서 제외 (이미지 매칭 정밀도 미완)
  // hasImage 플래그 + [img:] 링크 + 매니페스트 매칭 종합 판정.
  const questionsRaw = allRaw.filter((q) => !isImageDependentQuestion(q));

  let questions = questionsRaw;
  if (p.mode === "mock") {
    questions = [...questionsRaw].sort(() => Math.random() - 0.5);
  } else if (p.mode === "random") {
    // 무작위 10문 (회차 섞은 뒤 10개만)
    questions = [...questionsRaw]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
  } else if (p.mode === "weak") {
    // 틀린 적 있는 문항을 앞에 세우고, 최대 20문으로 자른다
    const wrongIds = new Set(
      (
        await prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            isCorrect: false,
            questionId: { in: questionsRaw.map((q) => q.id) },
          },
          select: { questionId: true },
          distinct: ["questionId"],
        })
      ).map((r) => r.questionId),
    );
    questions = [...questionsRaw]
      .sort((a, b) => Number(wrongIds.has(b.id)) - Number(wrongIds.has(a.id)))
      .slice(0, 20);
  } else if (p.mode === "daily") {
    // 결정적 1문제 — 같은 유저·같은 날엔 같은 문제
    if (questionsRaw.length > 0) {
      const seed = hashString(`${user.id}-${dailyKey(new Date())}`);
      const idx = seed % questionsRaw.length;
      questions = [questionsRaw[idx]];
    }
  }

  if (questions.length === 0) {
    throw new Error("수록된 문제가 없습니다.");
  }

  const plannedQuestionIds = questions.map((q) => q.id);
  const isTimed = p.mode === "cbt" || p.mode === "mock";
  const durationMinSnap = isTimed
    ? (examRecord?.durationMin ?? estimateMockDuration(questions.length))
    : null;

  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      examId: examRecord?.id ?? null,
      mode: mapMode(p.mode),
      totalMax: questions.length,
      plannedQuestionIds,
      durationMinSnap,
    },
  });

  return {
    attemptId: attempt.id,
    questionIds: plannedQuestionIds,
  };
}

/** 모의고사 자체 타이머 계산 (문제 수 × 1.5분, 최소 60분) */
function estimateMockDuration(n: number): number {
  return Math.max(60, Math.ceil(n * 1.5));
}

// ─────────────────────────────────────────────────────────────
// 빠른 복습 — 오답/북마크/SRS 등 미리 모은 question id 들을 곧장 attempt 로
// ─────────────────────────────────────────────────────────────

export async function startReviewAttempt(args: {
  source: "mistakes" | "bookmarks" | "srs";
  categorySlug?: string; // 있으면 그 카테고리만
  limit?: number;
}) {
  const user = await getOrCreateAnonUser();
  const limit = args.limit ?? 30;

  let categoryId: string | undefined;
  if (args.categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: args.categorySlug },
    });
    if (!cat) throw new Error("카테고리를 찾을 수 없습니다.");
    categoryId = cat.id;
  }

  let questionIds: string[] = [];

  if (args.source === "mistakes") {
    const recs = await prisma.answerRecord.findMany({
      where: {
        userId: user.id,
        isCorrect: false,
        skipped: false,
        ...(categoryId
          ? { question: { subject: { categoryId } } }
          : {}),
      },
      orderBy: { answeredAt: "desc" },
      distinct: ["questionId"],
      take: limit,
      select: { questionId: true },
    });
    questionIds = recs.map((r) => r.questionId);
  } else if (args.source === "bookmarks") {
    const bms = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
        ...(categoryId
          ? { question: { subject: { categoryId } } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { questionId: true },
    });
    questionIds = bms.map((b) => b.questionId);
  } else if (args.source === "srs") {
    const due = await prisma.reviewSchedule.findMany({
      where: {
        userId: user.id,
        nextReviewAt: { lte: new Date() },
        ...(categoryId
          ? { question: { subject: { categoryId } } }
          : {}),
      },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
      select: { questionId: true },
    });
    questionIds = due.map((d) => d.questionId);
  }

  if (questionIds.length === 0) {
    throw new Error("복습할 문제가 없어요.");
  }

  // 베타: 이미지 의존 문제 제외 (텍스트/매니페스트 다 검사)
  const qDetails = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      number: true,
      hasImage: true,
      stem: true,
      choices: true,
      exam: { select: { pdfUrl: true } },
    },
  });
  const qById = new Map(qDetails.map((q) => [q.id, q]));
  const filteredIds = questionIds.filter((id) => {
    const q = qById.get(id);
    if (!q) return false;
    return !isImageDependentQuestion(q);
  });

  if (filteredIds.length === 0) {
    throw new Error(
      "복습할 문제가 모두 이미지 문제예요. 베타에서 이미지 문제는 처리 중이에요.",
    );
  }

  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      mode: AttemptMode.REVIEW,
      totalMax: filteredIds.length,
      plannedQuestionIds: filteredIds,
      durationMinSnap: null,
    },
  });

  return { attemptId: attempt.id };
}

function dailyKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

// ─────────────────────────────────────────────────────────────
// 채점 & 제출
// ─────────────────────────────────────────────────────────────

type Answer = {
  questionId: string;
  userAnswer: string;
  timeSpentSec: number;
  flagged?: boolean;
  /** 풀이 시 자신감 */
  confidence?: "GUESS" | "UNSURE" | "CONFIDENT" | null;
};

export async function submitAttempt(attemptId: string, answers: Answer[]) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) throw new Error("세션을 찾을 수 없습니다.");
  if (attempt.finishedAt) {
    // score 는 백분율이라 맞은 개수로 쓸 수 없다 — 기록에서 직접 센다
    const correctCount = await prisma.answerRecord.count({
      where: { attemptId, isCorrect: true },
    });
    return {
      correctCount,
      total: attempt.totalMax ?? 0,
      score: attempt.score ?? 0,
      alreadyFinished: true,
    };
  }

  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, correctAnswer: true, points: true, type: true },
  });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  const records = answers.map((a) => {
    const q = qMap.get(a.questionId);
    const skipped = a.userAnswer.trim() === "";
    const isCorrect =
      !skipped &&
      !!q &&
      normalize(a.userAnswer, q.type) === normalize(q.correctAnswer, q.type);
    return {
      attemptId,
      userId: attempt.userId,
      questionId: a.questionId,
      userAnswer: a.userAnswer,
      isCorrect,
      timeSpentSec: a.timeSpentSec,
      skipped,
      flagged: !!a.flagged,
      confidence: a.confidence ?? null,
    };
  });

  await prisma.answerRecord.deleteMany({ where: { attemptId } });
  // confidence 필드는 prisma client 재생성 전까지 타입에 없음 — 런타임에 raw 로 후속 업데이트.
  await prisma.answerRecord.createMany({
    data: records.map(({ confidence: _c, ...rest }) => {
      void _c;
      return rest;
    }),
  });
  // confidence 가 있는 것만 raw 로 업데이트
  // (schema 에 컬럼·enum 이 아직 반영되지 않은 환경도 있으므로 try/catch)
  try {
    for (const r of records) {
      if (!r.confidence) continue;
      await prisma.$executeRaw`
        UPDATE "AnswerRecord"
        SET "confidence" = ${r.confidence}::"ConfidenceLevel"
        WHERE "attemptId" = ${attemptId} AND "questionId" = ${r.questionId}
      `;
    }
  } catch {
    /* ConfidenceLevel 컬럼 없으면 무시 — prisma db push 전까지 */
  }

  const correctCount = records.filter((r) => r.isCorrect).length;
  // 점수는 배점 합으로 낸다. 한능검처럼 1~3점이 섞인 시험은
  // 맞힌 "개수" 비율과 실제 점수가 달라서 급수 판정까지 틀어진다.
  const pointsOf = (id: string) => qMap.get(id)?.points ?? 1;
  const maxPoints = records.reduce((sum, r) => sum + pointsOf(r.questionId), 0);
  const gotPoints = records.reduce(
    (sum, r) => sum + (r.isCorrect ? pointsOf(r.questionId) : 0),
    0,
  );
  const score =
    maxPoints > 0 ? Math.round((gotPoints / maxPoints) * 100) : 0;

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      finishedAt: new Date(),
      score,
      totalMax: records.length,
    },
  });

  // Streak 갱신 (실패해도 전체 플로우 중단하지 않음)
  try {
    await markTodayActivity();
  } catch {
    /* streak 업데이트 실패는 결과 화면에 영향 없음 */
  }

  // SRS 스케줄 (오답은 1일, 정답은 간격 늘려 재출제)
  try {
    await Promise.all(
      records.map((r) =>
        scheduleReview(r.questionId, r.isCorrect).catch(() => null),
      ),
    );
  } catch {
    /* SRS 실패도 무시 */
  }

  return { correctCount, total: records.length, score, alreadyFinished: false };
}

function normalize(answer: string, type: QuestionType): string {
  if (type === QuestionType.MULTI_SELECT) {
    return answer
      .split(/[,\s]+/)
      .filter(Boolean)
      .sort()
      .join(",");
  }
  return answer.trim();
}
