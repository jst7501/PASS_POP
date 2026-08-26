import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { publishedExplanationWhere } from "@/lib/explanation-visibility";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import prisma from "@/lib/prisma";
import { gradeBadge } from "@/lib/queries";
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
    "토목기사·정보처리기사·전기기사·건축기사부터 9급·7급 공무원까지. 종목별 기출문제를 무료 CBT로 풀고, 찍은 오답까지 분석합니다. 회원가입 없이 바로 시작하세요.",
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
      where: publishedExplanationWhere,
      distinct: ["questionId"],
      select: { question: { select: { examId: true, subject: { select: { categoryId: true } } } } },
    });
    const publishedByCategory = new Map<string, Set<string>>();
    const questionsByCategory = new Map<string, number>();
    for (const e of publishedByExam) {
      const catId = e.question.subject.categoryId;
      questionsByCategory.set(catId, (questionsByCategory.get(catId) ?? 0) + 1);
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
      field: c.field,
      subjectCount: c._count.subjects,
      examCount: c._count.exams,
      publishedCount: publishedByCategory.get(c.id)?.size ?? 0,
      questionCount: questionsByCategory.get(c.id) ?? 0,
    }));
  },
  ["exams-index-v4"],
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
    field: DP.category.field,
    subjectCount: DP.subjects.length,
    examCount: 1,
    publishedCount: 1,
    questionCount: DP.questions.length,
  };
  // 해설이 준비된 종목이 위로. 그다음은 문항이 많은 순.
  const categories = [dpCard, ...dbCategories.filter((c) => c.slug !== DP_SLUG)]
    .slice()
    .sort((a, b) => {
      const av = a.publishedCount > 0 ? 1 : 0;
      const bv = b.publishedCount > 0 ? 1 : 0;
      if (av !== bv) return bv - av;
      return b.questionCount - a.questionCount;
    });
  const [lead, ...rest] = categories;

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

      {lead && <LeadCard c={lead} />}

      {rest.length > 0 && (
        <>
          <p className="mt-10 text-[12.5px] font-semibold text-text-mid">
            다른 종목
          </p>
          <ul className="mt-3 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
            {rest.map((c) => (
              <li key={c.id}>
                <ExamRow c={c} />
              </li>
            ))}
          </ul>
        </>
      )}
      </div>
    </>
  );
}

/** 해설이 가장 많이 준비된 대표 종목 — 목록 위에 크게 하나 */
function LeadCard({ c }: { c: ExamCard }) {
  return (
    <Link
      href={`/exams/${c.slug}`}
      className="group mt-6 block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/40 md:p-6"
    >
      <div className="flex items-center gap-1.5">
        <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          {gradeBadge(c)}
        </span>
        <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
          프리미엄 해설
        </span>
      </div>
      <p className="mt-2.5 text-[20px] font-bold tracking-[-0.02em] text-text-high md:text-[23px]">
        {c.name}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border-soft pt-4">
        <Stat label="기출 회차" value={c.publishedCount} unit="회" />
        <Stat label="보유 문제" value={c.questionCount} unit="문제" />
        <Stat label="과목" value={c.subjectCount} unit="개" />
      </dl>
      <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
        지금 풀러 가기
        <NavArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </span>
    </Link>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div>
      <dt className="text-[11.5px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-[19px] font-bold tabular-nums tracking-[-0.02em] text-text-high">
        {value.toLocaleString("ko-KR")}
        <span className="ml-0.5 text-[11.5px] font-medium text-text-muted">
          {unit}
        </span>
      </dd>
    </div>
  );
}

function ExamRow({ c }: { c: ExamCard }) {
  const has = c.publishedCount > 0;
  return (
    <Link
      href={`/exams/${c.slug}`}
      className={cn(
        "group flex items-center gap-3 px-4 py-3.5 transition-colors md:px-5",
        has ? "hover:bg-surface-mute" : "opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            {gradeBadge(c)}
          </span>
          {!has && (
            <span className="rounded-sm border border-border px-1.5 text-[10px] text-text-muted">
              준비중
            </span>
          )}
        </div>
        <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-text-high">
          {c.name}
        </p>
        <p className="mt-0.5 text-[11.5px] text-text-muted">
          {has ? (
            <>
              회차 <span className="tabular-nums">{c.publishedCount}</span> · 문항{" "}
              <span className="tabular-nums">
                {c.questionCount.toLocaleString("ko-KR")}
              </span>
            </>
          ) : (
            <>
              과목 <span className="tabular-nums">{c.subjectCount}</span>개 ·
              해설 준비 중
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
  );
}
