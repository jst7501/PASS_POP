import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { publishedExplanationWhere } from "@/lib/explanation-visibility";

/**
 * 아무 기록도 없는 화면(오답노트·복습·대시보드·노트)에서 보여줄 시작점.
 *
 * "아직 없어요 + 둘러보기 버튼" 하나만 두면 화면이 텅 비어 버린다.
 * 해설이 가장 많이 붙은 종목의 최신 회차를 바로 집어서, 이 자리에서
 * 곧장 풀기 시작할 수 있게 한다.
 */
export type QuickStart = {
  href: string;
  label: string;
  sub: string;
};

export const getQuickStarts = unstable_cache(
  async (): Promise<QuickStart[]> => {
    const [categories, bySubject, byExam] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          name: true,
          subjects: {
            orderBy: { orderIdx: "asc" },
            select: { id: true, slug: true, name: true },
          },
          exams: {
            orderBy: [{ year: "desc" }, { round: "desc" }],
            select: { id: true, year: true, round: true },
          },
        },
      }),
      prisma.question.groupBy({
        by: ["subjectId"],
        where: { explanations: { some: publishedExplanationWhere } },
        _count: { _all: true },
      }),
      prisma.question.groupBy({
        by: ["examId"],
        where: { explanations: { some: publishedExplanationWhere } },
        _count: { _all: true },
      }),
    ]);

    const subjectCount = new Map(bySubject.map((r) => [r.subjectId, r._count._all]));
    const examCount = new Map(
      byExam.filter((r) => r.examId).map((r) => [r.examId as string, r._count._all]),
    );

    // 해설이 붙은 문항이 가장 많은 종목 하나
    let best: (typeof categories)[number] | null = null;
    let bestCount = 0;
    for (const c of categories) {
      const n = c.subjects.reduce((sum, s) => sum + (subjectCount.get(s.id) ?? 0), 0);
      if (n > bestCount) {
        best = c;
        bestCount = n;
      }
    }
    if (!best || bestCount === 0) return [];

    const latest = best.exams.find((e) => (examCount.get(e.id) ?? 0) > 0);
    const out: QuickStart[] = [];
    if (latest) {
      const key = `${latest.year}-${latest.round}`;
      out.push({
        href: `/practice?exam=${key}&category=${best.slug}&mode=practice`,
        label: `${best.name} ${latest.round}회 연습`,
        sub: "한 문제씩 풀고 바로 해설 확인",
      });
      out.push({
        href: `/practice?exam=${key}&category=${best.slug}&mode=cbt`,
        label: `${latest.round}회 실전 CBT`,
        sub: "타이머 켜고 실제 시험처럼",
      });
    }
    out.push({
      href: `/exams/${best.slug}`,
      label: "과목별로 골라 풀기",
      sub: `${best.name} · 총 ${bestCount.toLocaleString("ko-KR")}문항`,
    });
    return out;
  },
  ["quick-starts-v1"],
  { revalidate: 3600, tags: ["home-public", "categories", "explanations"] },
);
