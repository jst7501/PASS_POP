import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "./prisma";
import { publishedExplanationWhere } from "./explanation-visibility";
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

/**
 * 배지에 쓸 종목 이름표.
 * 등급이 "기타"면 그 단어만으론 아무 정보가 없어서, 분야(한국사 등)를 대신 쓴다.
 */
export function gradeBadge(c: {
  grade: ExamGrade;
  field?: string | null;
}): string {
  if (c.grade === "ETC" && c.field) return c.field;
  return GRADE_LABEL[c.grade];
}

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
            ...publishedExplanationWhere,
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
  ["getCategoryDetail-v2"],
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

    // 문제별 상세 페이지로 들어갈 링크를 회차 페이지에서 만들려면 번호가 필요하다
    const questions = await prisma.question.findMany({
      where: { examId: exam.id },
      select: { number: true },
      orderBy: { number: "asc" },
    });

    return {
      ...exam,
      subjectBreakdown,
      totalAvailable,
      questionNumbers: questions.map((q) => q.number),
    };
  },
  ["getExamDetail-v2"],
  PUBLIC_CACHE,
);

// ─────────────────────────────────────────────────────────────
// 문항 상세 — 회차 안의 한 문제 (SEO 상세 페이지용)
// 문제 번호는 회차마다 1번부터 다시 시작하므로 회차까지 있어야 특정된다.
// ─────────────────────────────────────────────────────────────
export const getQuestionDetail = unstable_cache(
  async (
    categorySlug: string,
    year: number,
    round: number,
    number: number,
  ) => {
    const question = await prisma.question.findFirst({
      where: {
        number,
        exam: { year, round, category: { slug: categorySlug } },
      },
      include: {
        subject: true,
        exam: { include: { category: true } },
        explanations: { where: { userId: null } },
      },
    });
    if (!question?.examId) return null;

    const neighbors = await prisma.question.findMany({
      where: {
        examId: question.examId,
        number: { in: [number - 1, number + 1] },
      },
      select: { number: true },
    });

    return {
      question,
      prev: neighbors.some((n) => n.number === number - 1) ? number - 1 : null,
      next: neighbors.some((n) => n.number === number + 1) ? number + 1 : null,
    };
  },
  ["getQuestionDetail-v1"],
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
