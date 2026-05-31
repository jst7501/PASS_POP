import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import prisma from "@/lib/prisma";
import { GRADE_LABEL } from "@/lib/queries";
import { ExamGrade } from "@/lib/generated/prisma-client";
import { DP, DP_SLUG } from "@/lib/content/3dp";
import { buildMeta } from "@/lib/seo/metadata";
import { breadcrumbLd, collectionPageLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMeta({
  title: "시험 종목 전체 — 자격증·공무원 무료 기출 CBT",
  description:
    "토목기사·정보처리기사·전기기사·건축기사부터 9급·7급 공무원까지. 종목별 기출문제를 무료 CBT로 풀고, 찍은 오답까지 AI가 분석합니다. 회원가입 없이 바로 시작하세요.",
  path: "/exams",
  keywords: [
    "자격증 종목",
    "자격증 기출 목록",
    "공무원 기출문제",
    "무료 CBT 사이트",
    "기사 시험 종목",
    "산업기사 기출",
    "기능사 기출",
  ],
});

const OWNER_MAP: Record<string, string> = {
  "civil-engineer-gisa": "정호",
  "hvac-refrigeration-gisa": "호준",
  "3d-printer-gineungsa": "호성",
};

const getExamsList = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { subjects: true, exams: true } },
      },
    });
    const publishedByExam = await prisma.aiExplanation.findMany({
      where: { userId: null, model: "hand-written" },
      distinct: ["questionId"],
      select: { question: { select: { examId: true, subject: { select: { categoryId: true } } } } },
    });
    const publishedByCategory = new Map<string, Set<string>>();
    for (const e of publishedByExam) {
      const catId = e.question.subject.categoryId;
      const examId = e.question.examId;
      if (!examId) continue;
      const set = publishedByCategory.get(catId) ?? new Set<string>();
      set.add(examId);
      publishedByCategory.set(catId, set);
    }
    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      grade: c.grade,
      subjectCount: c._count.subjects,
      examCount: c._count.exams,
      publishedCount: publishedByCategory.get(c.id)?.size ?? 0,
    }));
  },
  ["exams-index-v1"],
  { revalidate: 3600, tags: ["home-public", "categories", "explanations"] },
);

type ExamCard = Awaited<ReturnType<typeof getExamsList>>[number];

export default async function ExamsIndexPage() {
  let dbCategories: ExamCard[] = [];
  try {
    dbCategories = await getExamsList();
  } catch {
    // 무료 DB 미연결/지연 시에도 JSON 종목(3D프린터)은 노출
    dbCategories = [];
  }
  const dpCard: ExamCard = {
    id: "json-3dp",
    slug: DP_SLUG,
    name: DP.category.name,
    grade: ExamGrade.GI_NEUNG_SA,
    subjectCount: DP.subjects.length,
    examCount: 1,
    publishedCount: 1,
  };
  const categories = [
    dpCard,
    ...dbCategories.filter((c) => c.slug !== DP_SLUG),
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "시험 종목", path: "/exams" },
          ]),
          collectionPageLd({
            name: "시험 종목 전체",
            path: "/exams",
            items: categories.map((c) => ({
              name: c.name,
              path: `/exams/${c.slug}`,
            })),
          }),
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 pb-24 md:px-6">
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
          Exams
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          시험 종목
        </h1>
        <p className="mt-2 text-[13px] text-text-mid">
          준비하실 시험을 골라보세요. 클릭하면 해당 종목 회차/과목으로 이동해요.
        </p>
      </header>

      <ul className="mt-6 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
        {categories.map((c) => {
          const owner = OWNER_MAP[c.slug] ?? "";
          const has = c.publishedCount > 0;
          return (
            <li key={c.id}>
              <Link
                href={`/exams/${c.slug}`}
                className={cn(
                  "group flex items-center gap-3 px-4 py-4 transition-colors md:px-5",
                  has ? "hover:bg-surface-mute" : "opacity-70",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                      {GRADE_LABEL[c.grade]}
                    </span>
                    {owner && (
                      <span className="text-[11px] text-text-muted">
                        {owner}
                      </span>
                    )}
                    {!has && (
                      <span className="rounded-sm border border-border px-1.5 py-0 text-[10px] text-text-muted">
                        준비중
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.01em] text-text-high md:text-[16px]">
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-text-muted">
                    {has ? (
                      <>
                        공개 회차{" "}
                        <span className="tabular-nums font-semibold text-text-mid">
                          {c.publishedCount}
                        </span>
                        개 · 과목{" "}
                        <span className="tabular-nums">{c.subjectCount}</span>
                      </>
                    ) : (
                      <>
                        과목{" "}
                        <span className="tabular-nums">{c.subjectCount}</span>
                        개
                      </>
                    )}
                  </p>
                </div>
                <NavArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all",
                    has
                      ? "text-text-muted group-hover:translate-x-0.5 group-hover:text-text-high"
                      : "text-text-muted/60",
                  )}
                  strokeWidth={2}
                />
              </Link>
            </li>
          );
        })}
      </ul>
      </div>
    </>
  );
}
