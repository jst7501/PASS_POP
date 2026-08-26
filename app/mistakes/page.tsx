import Link from "next/link";
import {
  NavArrowLeft,
  NavArrowRight,
  XmarkCircle,
  CheckCircle,
  Xmark,
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
import { getQuickStarts } from "@/lib/quick-start";
import { EmptyState } from "@/components/empty-state";
import { HookText } from "@/components/hook-text";
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
  // 같은 문제를 몇 번 틀렸는지 — 오답노트에서 가장 중요한 신호라 세어 둔다.
  // (중복 제거로 최근 것만 남기더라도 횟수는 잃지 않는다)
  const wrongCountByQuestion = new Map<string, number>();
  for (const r of records) {
    wrongCountByQuestion.set(
      r.questionId,
      (wrongCountByQuestion.get(r.questionId) ?? 0) + 1,
    );
  }

  const seen = new Set<string>();
  const deduped = records.filter((r) => {
    if (seen.has(r.questionId)) return false;
    seen.add(r.questionId);
    if (isImageDependentQuestion(r.question)) return false;
    return true;
  });

  const repeatedCount = deduped.filter(
    (r) => (wrongCountByQuestion.get(r.questionId) ?? 1) >= 2,
  ).length;

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

  const filtered = (
    selectedCat
      ? deduped.filter((r) => r.question.subject.category.slug === selectedCat)
      : deduped
  )
    // 여러 번 틀린 문제를 위로 — 반복해서 놓치는 게 제일 급하다
    .slice()
    .sort(
      (a, b) =>
        (wrongCountByQuestion.get(b.questionId) ?? 1) -
        (wrongCountByQuestion.get(a.questionId) ?? 1),
    );

  // 시대별로 묶는다 — 51개를 한 줄로 늘어놓으면 그냥 벽으로 읽힌다
  const groupMap = new Map<string, { name: string; items: typeof filtered }>();
  for (const r of filtered) {
    const subj = r.question.subject;
    const g = groupMap.get(subj.slug) ?? { name: subj.name, items: [] };
    g.items.push(r);
    groupMap.set(subj.slug, g);
  }
  const groups = Array.from(groupMap.entries())
    .map(([slug, g]) => ({ slug, ...g }))
    .sort((a, b) => b.items.length - a.items.length);

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
          label="걸린 시대"
          value={subjectCounts.size.toString()}
          suffix="곳"
          accent="mid"
        />
        {repeatedCount > 0 ? (
          <StatCard
            label="두 번 이상 틀림"
            value={repeatedCount.toString()}
            suffix="개"
            accent="primary"
          />
        ) : (
          topSubject && (
            <StatCard
              label="가장 많이 틀린 과목"
              value={topSubject.name}
              suffix={`${topSubject.count}개`}
              accent="mid"
              textValue
            />
          )
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

      {/* 시대별 묶음 */}
      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.slug}>
            <div className="flex items-baseline justify-between px-0.5">
              <h2 className="text-[14.5px] font-bold tracking-[-0.01em] text-text-high">
                {g.name}
              </h2>
              <span className="text-[12px] text-text-muted">
                <span className="font-semibold tabular-nums text-text-mid">
                  {g.items.length}
                </span>
                문제
              </span>
            </div>
            <ul className="mt-2.5 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
        {g.items.map((r) => {
          const q = r.question;
          const choices = q.choices as {
            label: string;
            text: string;
            imageUrl?: string | null;
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
          const wrongTimes = wrongCountByQuestion.get(r.questionId) ?? 1;

          return (
            <li key={r.id}>
              <details className="group transition-colors open:bg-danger/[0.03]">
                <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 md:px-5 [&::-webkit-details-marker]:hidden">
                  <div className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/12 text-danger">
                    <XmarkCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-muted">
                      <span className="font-mono font-semibold text-text-mid">
                        Q.{String(q.number).padStart(2, "0")}
                      </span>
                      {wrongTimes >= 2 && (
                        <>
                          <span className="h-3 w-px bg-border" />
                          <span className="rounded-sm bg-danger px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            {wrongTimes}번 틀림
                          </span>
                        </>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                        내 답 {r.userAnswer} · 정답 {q.correctAnswer}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[14.5px] leading-[1.5] text-text-high group-open:hidden">
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

                  {q.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-md border border-border bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={q.imageUrl}
                        alt=""
                        className="mx-auto max-h-56 w-auto"
                      />
                    </div>
                  )}

                  {!q.imageUrl &&
                    (images?.body?.length ||
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
                            {c.text?.trim() && <MathText text={c.text} />}
                            {c.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={c.imageUrl}
                                alt={`보기 ${c.label}`}
                                className="max-h-32 w-auto rounded-sm bg-white"
                              />
                            )}
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
                          <HookText text={exp.memoryHook} />
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
          </section>
        ))}
      </div>

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

async function EmptyScreen() {
  const quickStarts = await getQuickStarts().catch(() => []);
  return (
    <EmptyState
      icon={<Xmark className="h-6 w-6" strokeWidth={2} />}
      title="틀린 문제가 아직 없어요"
      description="문제를 풀다가 틀린 게 생기면 여기 자동으로 모여요. 몇 번 틀렸는지, 어느 시대에서 자꾸 걸리는지까지 정리해 드려요."
      primary={
        quickStarts.length ? undefined : { href: "/exams", label: "시험 둘러보기" }
      }
      quickStarts={quickStarts}
    />
  );
}
