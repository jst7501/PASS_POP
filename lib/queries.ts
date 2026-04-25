import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "./prisma";
import type { ExamGrade } from "./generated/prisma-client";

// 공개 콘텐츠 — 모든 유저 동일. 1시간 캐시.
// 시드 갱신 후 invalidatePublicCache() 로 즉시 무효화 가능.
const PUBLIC_CACHE: { revalidate: number; tags: string[] } = {
  revalidate: 3600,
  tags: ["home-public", "categories", "explanations"],
};

/**
 * 서버 전용 Prisma 쿼리 헬퍼
 * - 페이지 단위로 필요한 조합을 모아 반환
 */

export const GRADE_LABEL: Record<ExamGrade, string> = {
  GI_NEUNG_SA: "기능사",
  SAN_EOB_GI_SA: "산업기사",
  GI_SA: "기사",
  GI_SUL_SA: "기술사",
  GONG_MU_WON: "공무원",
  ETC: "기타",
};

// ─────────────────────────────────────────────────────────────
// Category 상세 — 과목·회차·문제수 집계 포함
// ─────────────────────────────────────────────────────────────
export const getCategoryDetail = unstable_cache(
  async (slug: string) => {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        subjects: {
          orderBy: { orderIdx: "asc" },
          include: {
            _count: { select: { questions: true } },
          },
        },
        exams: {
          orderBy: [{ year: "desc" }, { round: "desc" }],
        },
      },
    });

    if (!category) return null;

    const totalQuestions = await prisma.question.count({
      where: { subject: { categoryId: category.id } },
    });

    // 각 exam 의 hand-written 해설 개수 집계 (해설 없는 회차 UI 숨김용)
    const explanationCounts = await Promise.all(
      category.exams.map(async (ex) => {
        const count = await prisma.aiExplanation.count({
          where: {
            userId: null,
            model: "hand-written",
            question: { examId: ex.id },
          },
        });
        return [ex.id, count] as const;
      }),
    );
    const explMap = new Map(explanationCounts);
    const examsWithCount = category.exams.map((ex) => ({
      ...ex,
      explanationCount: explMap.get(ex.id) ?? 0,
    }));

    return {
      ...category,
      exams: examsWithCount,
      totalQuestions,
    };
  },
  ["getCategoryDetail-v1"],
  PUBLIC_CACHE,
);

// ─────────────────────────────────────────────────────────────
// Subject 상세
// ─────────────────────────────────────────────────────────────
export const getSubjectDetail = unstable_cache(
  async (categorySlug: string, subjectSlug: string) => {
    const subject = await prisma.subject.findFirst({
      where: {
        slug: subjectSlug,
        category: { slug: categorySlug },
      },
      include: {
        category: true,
        _count: { select: { questions: true } },
      },
    });

    if (!subject) return null;

    const practiceQuestionCount = await prisma.question.count({
      where: { subjectId: subject.id, examId: null },
    });

    const roundBoundQuestionCount = await prisma.question.count({
      where: { subjectId: subject.id, examId: { not: null } },
    });

    return {
      ...subject,
      practiceQuestionCount,
      roundBoundQuestionCount,
    };
  },
  ["getSubjectDetail-v1"],
  PUBLIC_CACHE,
);

// ─────────────────────────────────────────────────────────────
// Exam 상세 — 과목별 문제 수 포함
// ─────────────────────────────────────────────────────────────
export const getExamDetail = unstable_cache(
  async (categorySlug: string, year: number, round: number) => {
    const exam = await prisma.exam.findFirst({
      where: {
        year,
        round,
        category: { slug: categorySlug },
      },
      include: { category: true },
    });

    if (!exam) return null;

    const perSubject = await prisma.question.groupBy({
      by: ["subjectId"],
      where: { examId: exam.id },
      _count: { _all: true },
    });

    const subjects = await prisma.subject.findMany({
      where: { categoryId: exam.categoryId },
      orderBy: { orderIdx: "asc" },
    });

    const subjectBreakdown = subjects.map((s) => ({
      ...s,
      questionCount:
        perSubject.find((p) => p.subjectId === s.id)?._count._all ?? 0,
    }));

    const totalAvailable = perSubject.reduce(
      (sum, p) => sum + p._count._all,
      0,
    );

    return {
      ...exam,
      subjectBreakdown,
      totalAvailable,
    };
  },
  ["getExamDetail-v1"],
  PUBLIC_CACHE,
);

// ─────────────────────────────────────────────────────────────
// Round slug parser ("2024-1" → {year, round})
// ─────────────────────────────────────────────────────────────
export function parseRoundSlug(slug: string) {
  const m = slug.match(/^(\d{4})-(\d+)$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const round = parseInt(m[2], 10);
  if (Number.isNaN(year) || Number.isNaN(round)) return null;
  return { year, round };
}
