import Link from "next/link";
import {
  NavArrowLeft,
  NavArrowRight,
  Bookmark as BookmarkIcon,
  BookmarkSolid,
} from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { MathText } from "@/components/practice/math-text";
import { SavedTabs } from "@/components/saved-tabs";
import { ReviewStartButton } from "@/components/review-start-button";
import {
  getQuestionImages,
  isImageDependentQuestion,
} from "@/lib/exam-images";
import { cn } from "@/lib/utils";

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat: rawCat } = await searchParams;
  const selectedCat = rawCat && rawCat !== "all" ? rawCat : null;

  const user = await getCurrentUser();
  if (!user) return <EmptyScreen />;

  const mistakeCount = await prisma.answerRecord.count({
    where: { userId: user.id, isCorrect: false, skipped: false },
  });

  const bookmarksRaw = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      question: {
        include: {
          subject: { include: { category: true } },
          exam: { select: { pdfUrl: true } },
        },
      },
    },
  });

  // 그림 의존 문제는 리스트에서 제외 (베타)
  const bookmarks = bookmarksRaw.filter(
    (b) => !isImageDependentQuestion(b.question),
  );

  if (bookmarks.length === 0) return <EmptyScreen />;

  const categoryCounts = new Map<
    string,
    { slug: string; name: string; count: number }
  >();
  for (const b of bookmarks) {
    const cat = b.question.subject.category;
    const prev = categoryCounts.get(cat.slug);
    categoryCounts.set(cat.slug, {
      slug: cat.slug,
      name: cat.name,
      count: (prev?.count ?? 0) + 1,
    });
  }
  const categories = Array.from(categoryCounts.values()).sort(
    (a, b) => b.count - a.count,
  );

  const filtered = selectedCat
    ? bookmarks.filter((b) => b.question.subject.category.slug === selectedCat)
    : bookmarks;

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
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          다시 풀 문제
        </h1>
        <SavedTabs
          active="bookmarks"
          mistakeCount={mistakeCount}
          bookmarkCount={bookmarks.length}
        />
        <p className="mt-3 text-[13px] text-text-mid">
          나중에 다시 풀 문제 모음.
        </p>
        {bookmarks.length > 0 && (
          <div className="mt-4">
            <ReviewStartButton
              source="bookmarks"
              label={`북마크 ${Math.min(bookmarks.length, 30)}문 풀기`}
            />
          </div>
        )}
      </header>

      {categories.length > 1 && (
        <div className="mt-6 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <FilterChip
            href="/bookmarks"
            label="전체"
            count={bookmarks.length}
            active={!selectedCat}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              href={`/bookmarks?cat=${c.slug}`}
              label={c.name}
              count={c.count}
              active={selectedCat === c.slug}
            />
          ))}
        </div>
      )}

      <ul className="mt-6 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
        {filtered.map((b) => {
          const q = b.question;
          const images = getQuestionImages(
            q.exam?.pdfUrl ?? null,
            q.number,
          );
          return (
            <li key={b.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 md:px-5 [&::-webkit-details-marker]:hidden">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary/12 text-primary">
                    <BookmarkSolid className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-text-muted">
                      <span className="font-semibold text-text-mid">
                        Q.{String(q.number).padStart(2, "0")}
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <span>{q.subject.name}</span>
                      <span className="h-3 w-px bg-border" />
                      <span>{q.subject.category.name}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-[14px] leading-[1.55] text-text-high group-open:hidden">
                      <MathText text={q.stem} />
                    </p>
                  </div>
                  <NavArrowRight
                    className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-90"
                    strokeWidth={2}
                  />
                </summary>

                <div className="border-t border-border-soft bg-surface-mute px-4 pb-4 pt-4 md:px-5">
                  <p className="whitespace-pre-wrap text-[14.5px] leading-[1.7] text-text-high">
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
                  <ul className="mt-3 space-y-1.5">
                    {(
                      q.choices as {
                        label: string;
                        text: string;
                        imageUrl?: string | null;
                      }[]
                    ).map(
                      (c, i) => {
                        const n = String(i + 1);
                        const isCorrect = n === q.correctAnswer;
                        return (
                          <li
                            key={c.label}
                            className={cn(
                              "flex items-start gap-2.5 rounded-sm border px-3 py-2 text-[13.5px]",
                              isCorrect
                                ? "border-accent/50 bg-accent/10 text-text-high"
                                : "border-border-soft bg-surface text-text-mid",
                            )}
                          >
                            <span className="font-semibold">{c.label}</span>
                            <span className="flex-1">
                              {c.text?.trim() && <MathText text={c.text} />}
                              {c.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={c.imageUrl}
                                  alt={`보기 ${c.label}`}
                                  className="max-h-28 w-auto rounded-sm bg-white"
                                />
                              )}
                            </span>
                          </li>
                        );
                      },
                    )}
                  </ul>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-16 text-center text-[13px] text-text-mid">
          이 영역에는 북마크가 없어요.
        </div>
      )}
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
        "inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-text-high bg-text-high text-background"
          : "border-border bg-surface text-text-mid hover:border-text-mid hover:text-text-high",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums text-[10.5px]",
          active ? "text-background/70" : "text-text-muted",
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
      <BookmarkIcon className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
      <h1 className="mt-4 text-[22px] font-bold tracking-[-0.01em] text-text-high">
        아직 북마크가 없어요
      </h1>
      <p className="mt-3 max-w-xs text-[13.5px] leading-[1.6] text-text-mid">
        풀이 중 플래그 아이콘을 누르면 여기에 모여요. 나중에 한번에 복습할 때
        써보세요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
      >
        시험 둘러보기
        <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
