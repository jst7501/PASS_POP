import Link from "next/link";
import type { Metadata } from "next";
import { NavArrowLeft, BookmarkBook } from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { aggregateTagWeakness } from "@/lib/weakness";
import { PrintButton } from "@/components/print-button";
import { HookText } from "@/components/hook-text";
import { getQuickStarts } from "@/lib/quick-start";
import { EmptyState } from "@/components/empty-state";
import { buildMeta } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMeta({
  title: "단권화 노트 — 시험 전날 한 장",
  description:
    "틀린 문제에서 뽑은 암기 후크만 시대별로 모았어요. 시험 전날 이 한 장만 훑으세요.",
  path: "/note",
  index: false,
});

/** 시험 전날 훑을 한 장 — 내가 틀린 것에서 뽑은 암기 후크만 모은다 */
export default async function NotePage() {
  const user = await getCurrentUser();
  if (!user) return <EmptyScreen />;

  const records = await prisma.answerRecord.findMany({
    where: { userId: user.id, isCorrect: false, skipped: false },
    orderBy: { answeredAt: "desc" },
    select: {
      questionId: true,
      question: {
        select: {
          number: true,
          tags: true,
          subject: {
            select: {
              name: true,
              slug: true,
              orderIdx: true,
              category: { select: { name: true, slug: true } },
            },
          },
          explanations: {
            where: { userId: null, wrongChoice: null },
            select: { memoryHook: true },
            take: 1,
          },
        },
      },
    },
  });

  if (records.length === 0) return <EmptyScreen />;

  // 몇 번 틀렸는지 — 자주 놓친 것을 위로 올린다
  const wrongTimes = new Map<string, number>();
  for (const r of records) {
    wrongTimes.set(r.questionId, (wrongTimes.get(r.questionId) ?? 0) + 1);
  }

  const weakTags = aggregateTagWeakness(
    records.map((r) => ({ isCorrect: false, question: r.question })),
    { minSample: 2, limit: 10 },
  );

  // 문항 중복 제거 + 암기 후크가 있는 것만 (노트는 후크로 이뤄진다)
  const seen = new Set<string>();
  type Line = {
    questionId: string;
    hook: string;
    tags: string[];
    times: number;
    subject: { name: string; slug: string; orderIdx: number };
    categoryName: string;
  };
  const lines: Line[] = [];
  for (const r of records) {
    if (seen.has(r.questionId)) continue;
    seen.add(r.questionId);
    const hook = r.question.explanations[0]?.memoryHook?.trim();
    if (!hook) continue;
    lines.push({
      questionId: r.questionId,
      hook,
      tags: r.question.tags.slice(0, 3),
      times: wrongTimes.get(r.questionId) ?? 1,
      subject: r.question.subject,
      categoryName: r.question.subject.category.name,
    });
  }

  if (lines.length === 0) return <NoHookScreen />;

  // 같은 후크가 여러 문항에 걸쳐 반복되면 한 줄로 합친다
  const byHook = new Map<string, Line>();
  for (const l of lines) {
    const prev = byHook.get(l.hook);
    if (prev) {
      prev.times += l.times;
      prev.tags = Array.from(new Set([...prev.tags, ...l.tags])).slice(0, 4);
    } else {
      byHook.set(l.hook, { ...l });
    }
  }

  // 시대(과목)별로 묶고, 각 묶음 안에서는 자주 틀린 순
  const groups = new Map<string, { name: string; orderIdx: number; items: Line[] }>();
  for (const l of byHook.values()) {
    const g = groups.get(l.subject.slug) ?? {
      name: l.subject.name,
      orderIdx: l.subject.orderIdx,
      items: [],
    };
    g.items.push(l);
    groups.set(l.subject.slug, g);
  }
  const ordered = Array.from(groups.values())
    .map((g) => ({
      ...g,
      items: g.items.sort((a, b) => b.times - a.times),
    }))
    .sort((a, b) => a.orderIdx - b.orderIdx);

  const totalLines = byHook.size;
  const categoryName = lines[0]?.categoryName ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted print:hidden">
        <Link
          href="/review"
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          복습 모음
        </Link>
      </nav>

      <header className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Cram Sheet
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          단권화 노트
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.7] text-text-mid">
          {categoryName ? `${categoryName} ` : ""}틀린 문제에서 뽑은 암기 후크{" "}
          <strong className="text-text-high">{totalLines}줄</strong>이에요. 시험
          전날 이것만 훑으세요.
        </p>

        <div className="mt-4 print:hidden">
          <PrintButton />
        </div>
      </header>

      {weakTags.length > 0 && (
        <section className="mt-8 rounded-md border border-danger/25 bg-danger/[0.04] px-4 py-3.5">
          <p className="text-[12px] font-bold text-danger">
            여기가 제일 급해요
          </p>
          <p className="mt-2 text-[13.5px] leading-[1.8] text-text-mid">
            {weakTags.slice(0, 6).map((t, i) => (
              <span key={t.tag}>
                {i > 0 && <span className="text-text-muted"> · </span>}
                <span className="font-semibold text-text-high">{t.tag}</span>
                <span className="text-text-muted"> {t.wrong}회</span>
              </span>
            ))}
          </p>
        </section>
      )}

      <div className="mt-8 space-y-7">
        {ordered.map((g) => (
          <section key={g.name} className="break-inside-avoid">
            <h2 className="flex items-baseline gap-2 border-b border-border pb-2">
              <span className="text-[16px] font-bold tracking-[-0.01em] text-text-high">
                {g.name}
              </span>
              <span className="text-[11.5px] tabular-nums text-text-muted">
                {g.items.length}줄
              </span>
            </h2>
            <ul className="mt-3 space-y-2.5">
              {g.items.map((l) => (
                <li
                  key={l.questionId}
                  className="flex items-start gap-2.5 break-inside-avoid"
                >
                  <span
                    className={cn(
                      "mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full",
                      l.times >= 2 ? "bg-danger" : "bg-text-muted/50",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] leading-[1.65] text-text-high">
                      <HookText text={l.hook} />
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-text-muted">
                      {l.tags.join(" · ")}
                      {l.times >= 2 && (
                        <span className="ml-1.5 font-semibold text-danger">
                          {l.times}번 틀림
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 text-[11.5px] leading-[1.7] text-text-muted print:mt-6">
        틀린 문제가 늘면 이 노트도 자동으로 채워져요. 해설에는 오류가 있을 수
        있으니 이상하면 알려주세요.
      </p>
    </div>
  );
}

async function EmptyScreen() {
  const quickStarts = await getQuickStarts().catch(() => []);
  return (
    <EmptyState
      icon={<BookmarkBook className="h-6 w-6" strokeWidth={1.5} />}
      title="아직 노트에 담을 게 없어요"
      description="문제를 풀다가 틀리면 그 문제의 암기 후크가 여기 한 장으로 모여요. 시험 전날 이 페이지만 읽으면 되게."
      primary={
        quickStarts.length ? undefined : { href: "/exams", label: "문제 풀러 가기" }
      }
      quickStarts={quickStarts}
    />
  );
}

function NoHookScreen() {
  return (
    <EmptyState
      icon={<BookmarkBook className="h-6 w-6" strokeWidth={1.5} />}
      title="아직 정리할 후크가 없어요"
      description="틀린 문제는 있는데 암기 후크가 달린 해설이 아직 없네요. 해설이 준비된 종목을 풀면 노트가 채워져요."
      primary={{ href: "/mistakes", label: "오답노트 보기" }}
    />
  );
}
