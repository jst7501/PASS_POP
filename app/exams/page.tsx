import Link from "next/link";
import { unstable_cache } from "next/cache";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import prisma from "@/lib/prisma";
import { GRADE_LABEL } from "@/lib/queries";
import { cn } from "@/lib/utils";

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

export default async function ExamsIndexPage() {
  const categories = await getExamsList();

  return (
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
  );
}
