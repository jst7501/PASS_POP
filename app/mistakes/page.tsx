import Link from "next/link";
import {
  NavArrowLeft,
  NavArrowRight,
  XmarkCircle,
  CheckCircle,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { ExplanationHtml } from "@/components/practice/explanation-html";
import { MathText } from "@/components/practice/math-text";
import { SavedTabs } from "@/components/saved-tabs";
import { ReviewStartButton } from "@/components/review-start-button";
import {
  getQuestionImages,
  isImageDependentQuestion,
} from "@/lib/exam-images";
import { cn } from "@/lib/utils";

export default async function MistakesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat: rawCat } = await searchParams;
  const selectedCat = rawCat && rawCat !== "all" ? rawCat : null;

  const user = await getCurrentUser();
  if (!user) return <EmptyScreen />;

  const bookmarkCount = await prisma.bookmark.count({
    where: { userId: user.id },
  });

  const records = await prisma.answerRecord.findMany({
    where: { userId: user.id, isCorrect: false, skipped: false },
    orderBy: { answeredAt: "desc" },
    include: {
      question: {
        include: {
          subject: { include: { category: true } },
          exam: { select: { pdfUrl: true } },
          explanations: {
            where: { userId: null },
          },
        },
      },
    },
  });

  if (records.length === 0) return <EmptyScreen />;

  // 같은 문제 중복은 가장 최근 오답 하나만 남기고,
  // 그림 의존 문제는 리스트에서 제외 (베타에서 그림 매칭 보류 중).
  const seen = new Set<string>();
  const deduped = records.filter((r) => {
    if (seen.has(r.questionId)) return false;
    seen.add(r.questionId);
    if (isImageDependentQuestion(r.question)) return false;
    return true;
  });

  // 통계 — 필터 영향 받지 않는 전체 기준
  const categoryCounts = new Map<
    string,
    { slug: string; name: string; count: number }
  >();
  const subjectCounts = new Map<string, { name: string; count: number }>();
  for (const r of deduped) {
    const cat = r.question.subject.category;
    const prev = categoryCounts.get(cat.slug);
    categoryCounts.set(cat.slug, {
      slug: cat.slug,
      name: cat.name,
      count: (prev?.count ?? 0) + 1,
    });
    const subj = r.question.subject;
    const sprev = subjectCounts.get(subj.slug);
    subjectCounts.set(subj.slug, {
      name: subj.name,
      count: (sprev?.count ?? 0) + 1,
    });
  }
  const categories = Array.from(categoryCounts.values()).sort(
    (a, b) => b.count - a.count,
  );
  const topSubject = Array.from(subjectCounts.values()).sort(
    (a, b) => b.count - a.count,
  )[0];

  const filtered = selectedCat
    ? deduped.filter(
        (r) => r.question.subject.category.slug === selectedCat,
      )
    : deduped;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted">
        <Link
          href="/"
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />홈
        </Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          다시 풀 문제
        </h1>
        <SavedTabs
          active="mistakes"
          mistakeCount={deduped.length}
          bookmarkCount={bookmarkCount}
        />
        <p className="mt-3 text-[13px] text-text-mid">
          틀린 문제를 모아뒀어요. 반복해서 열어보면 머리에 남아요.
        </p>
        {deduped.length > 0 && (
          <div className="mt-4">
            <ReviewStartButton
              source="mistakes"
              label={`최근 오답 ${Math.min(deduped.length, 30)}문 다시 풀기`}
            />
          </div>
        )}
      </header>

      {/* 통계 밴드 */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="총 오답"
          value={deduped.length.toString()}
          suffix="개"
          accent="primary"
        />
        <StatCard
          label="영역"
          value={categories.length.toString()}
          suffix="개"
          accent="mid"
        />
        {topSubject && (
          <StatCard
            label="가장 많이 틀린 과목"
            value={topSubject.name}
            suffix={`${topSubject.count}개`}
            accent="mid"
            textValue
          />
        )}
      </section>

      {/* 카테고리 필터 */}
      {categories.length > 1 && (
        <div className="mt-8 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <FilterChip
            href="/mistakes"
            label="전체"
            count={deduped.length}
            active={!selectedCat}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              href={`/mistakes?cat=${c.slug}`}
              label={c.name}
              count={c.count}
              active={selectedCat === c.slug}
            />
          ))}
        </div>
      )}

      {/* 카드 리스트 */}
      <ul className="mt-6 space-y-3">
        {filtered.map((r) => {
          const q = r.question;
          const choices = q.choices as {
            label: string;
            text: string;
          }[];
          const correctIdx = parseInt(q.correctAnswer, 10);
          const userIdx = parseInt(r.userAnswer, 10);
          // 틀린 선택지에 맞춘 해설 우선, 없으면 일반 해설
          const wrongSpecific = q.explanations.find(
            (e) => e.wrongChoice === r.userAnswer,
          );
          const general = q.explanations.find((e) => e.wrongChoice === null);
          const exp = wrongSpecific ?? general ?? null;
          const images = getQuestionImages(
            q.exam?.pdfUrl ?? null,
            q.number,
          );

          return (
            <li key={r.id}>
              <details className="group rounded-md border border-border bg-surface transition-colors open:border-danger/25 open:bg-danger/[0.03]">
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 md:gap-4 md:p-5 [&::-webkit-details-marker]:hidden">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
                    <XmarkCircle className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-muted">
                      <span className="font-mono font-semibold text-text-mid">
                        Q.{String(q.number).padStart(2, "0")}
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <span>{q.subject.name}</span>
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-danger">
                        내 답 {r.userAnswer} · 정답 {q.correctAnswer}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[15px] leading-[1.55] text-text-high group-open:hidden">
                      <MathText text={q.stem} />
                    </p>
                  </div>
                  <NavArrowRight
                    className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-90"
                    strokeWidth={2}
                  />
                </summary>

                <div className="border-t border-danger/10 px-4 pb-5 pt-4 md:px-5">
                  {/* 확장 시 문제 전문 */}
                  <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-text-high">
                    <MathText text={q.stem} />
                  </p>

                  {(images?.body?.length ||
                    Object.values(images?.options ?? {}).some(
                      (a) => (a?.length ?? 0) > 0,
                    )) && (
                    <div className="mt-3 rounded-md border border-warning/30 bg-warning/[0.05] px-3 py-2 text-[11.5px] text-text-mid">
                      그림 포함 — 베타에서 그림 표시 보류 중
                    </div>
                  )}

                  <ul className="mt-4 space-y-2">
                    {choices.map((c, i) => {
                      const n = i + 1;
                      const isCorrect = n === correctIdx;
                      const isUserPick = n === userIdx;
                      return (
                        <li
                          key={c.label}
                          className={cn(
                            "flex items-start gap-3 rounded-md border px-3.5 py-2.5 text-[14px]",
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
                              "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
                              isCorrect
                                ? "bg-accent text-white"
                                : isUserPick
                                  ? "bg-danger text-white"
                                  : "bg-surface-mute text-text-muted",
                            )}
                          >
                            {c.label}
                          </span>
                          <span className="min-w-0 flex-1">
                            <MathText text={c.text} />
                          </span>
                          {isCorrect && (
                            <CheckCircle
                              className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                              strokeWidth={2.5}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {exp && (
                    <div className="mt-5 rounded-xl bg-primary-subtle/50 p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                          해설
                        </span>
                        {wrongSpecific && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {r.userAnswer}번 고른 분 맞춤
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <ExplanationHtml html={exp.explanation} />
                      </div>
                      {exp.memoryHook && (
                        <p className="mt-3 border-t border-primary/15 pt-2.5 text-[13px] leading-[1.6] text-text-mid">
                          <span className="font-semibold text-primary">
                            암기 팁 ·{" "}
                          </span>
                          {exp.memoryHook}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-[14px] text-text-mid">
            이 영역에는 아직 틀린 문제가 없어요.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  textValue,
}: {
  label: string;
  value: string;
  suffix: string;
  accent: "primary" | "mid";
  textValue?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <p className="text-[11px] font-medium text-text-muted">{label}</p>
      <p className="mt-2 flex items-baseline gap-1">
        <span
          className={cn(
            textValue
              ? "text-[16px] font-bold tracking-[-0.01em]"
              : "font-mono text-[28px] font-bold tabular-nums tracking-[-0.02em] md:text-[32px]",
            accent === "primary" ? "text-primary" : "text-text-high",
          )}
        >
          {value}
        </span>
        <span className="text-[12px] font-medium text-text-muted">
          {suffix}
        </span>
      </p>
    </div>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-surface text-text-mid hover:border-border hover:text-text-high",
      )}
    >
      {label}
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          active ? "text-primary-fg/80" : "text-text-muted",
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function EmptyScreen() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
        Mistakes
      </p>
      <h1 className="mt-4 text-[24px] font-bold tracking-[-0.01em] text-text-high">
        틀린 문제가 아직 없어요
      </h1>
      <p className="mt-3 max-w-xs text-[14px] leading-[1.6] text-text-mid">
        문제를 풀다가 틀린 게 생기면 여기 자동으로 모여요. 비슷한 유형을 반복
        연습할 때 쓰기 좋아요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
      >
        시험 둘러보기
        <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
