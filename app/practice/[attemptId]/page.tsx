import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { NavArrowLeft } from "iconoir-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import { PracticeSession } from "@/components/practice/practice-session";
import { renderMathInHtml } from "@/components/practice/explanation-html";
import { AttemptMode } from "@/lib/generated/prisma-client";
import { isImageDependentQuestion } from "@/lib/exam-images";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { category: true } },
    },
  });
  if (!attempt) notFound();

  const user = await getCurrentUser();
  if (!user || user.id !== attempt.userId) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Access denied
        </p>
        <h1 className="mt-4 text-[22px] font-bold tracking-[-0.01em] text-text-high">
          이 세션은 다른 분의 풀이예요.
        </h1>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
        >
          <NavArrowLeft className="h-4 w-4" strokeWidth={2} />
          홈으로
        </Link>
      </div>
    );
  }

  if (attempt.finishedAt) {
    redirect(`/practice/${attemptId}/result`);
  }

  if (attempt.plannedQuestionIds.length === 0) {
    return <NoQuestionsScreen />;
  }

  // 연습모드(실전 모의고사 아님)면 정답·해설도 함께 내려줌 (즉시 채점용)
  const isPractice = attempt.mode !== AttemptMode.EXAM;

  const questionsRaw = await prisma.question.findMany({
    where: { id: { in: attempt.plannedQuestionIds } },
    include: {
      subject: { include: { category: true } },
      // 문제별 원본 회차 — 매니페스트 매칭에 필요 (subject/random/daily 모드도 작동하게)
      exam: { select: { pdfUrl: true } },
      // 연습모드일 때 모든 해설 (general + wrongChoice별) 로드
      explanations: isPractice
        ? {
            where: { userId: null },
          }
        : false,
    },
  });

  const byId = new Map(questionsRaw.map((q) => [q.id, q]));
  const orderedAll = attempt.plannedQuestionIds
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  // 옛 attempt 안전망: 이미 plannedQuestionIds 에 들어가 있는 그림 의존 문제도
  // 풀이 화면에서는 숨김 (필터 도입 전 만든 attempt 대응).
  const ordered = orderedAll.filter((q) => !isImageDependentQuestion(q));

  const clientQuestions = ordered.map((q) => {
    const base = {
      id: q.id,
      number: q.number,
      stem: q.stem,
      choices: q.choices as { label: string; text: string }[],
      hasMath: q.hasMath,
      subject: {
        name: q.subject.name,
        slug: q.subject.slug,
      },
      images: null,
    };
    if (!isPractice) return base;
    const rawExps =
      (q as typeof q & {
        explanations?: {
          wrongChoice: string | null;
          explanation: string;
          memoryHook: string | null;
        }[];
      }).explanations ?? [];
    const explanations = rawExps.map((e) => ({
      wrongChoice: e.wrongChoice,
      html: renderMathInHtml(e.explanation),
      memoryHook: e.memoryHook,
    }));
    return {
      ...base,
      correctAnswer: q.correctAnswer,
      explanations,
    };
  });

  const categoryName =
    attempt.exam?.category.name ?? ordered[0]?.subject.category.name ?? "";

  // 이 유저가 이미 북마크한 question 들 id 셋 (초기 렌더)
  const [bookmarks, notes] = await Promise.all([
    prisma.bookmark.findMany({
      where: {
        userId: attempt.userId,
        questionId: { in: attempt.plannedQuestionIds },
      },
      select: { questionId: true },
    }),
    prisma.questionNote.findMany({
      where: {
        userId: attempt.userId,
        questionId: { in: attempt.plannedQuestionIds },
      },
      select: { questionId: true, content: true },
    }),
  ]);
  const initialBookmarks = bookmarks.map((b) => b.questionId);
  const initialNotes: Record<string, string> = {};
  for (const n of notes) initialNotes[n.questionId] = n.content;

  // 모든 문제가 필터링된 경우 (옛 attempt 가 전부 그림 문제)
  if (clientQuestions.length === 0) {
    return <NoQuestionsScreen reason="image" />;
  }

  return (
    <PracticeSession
      attemptId={attempt.id}
      questions={clientQuestions}
      categoryName={categoryName}
      durationMin={attempt.durationMinSnap}
      initialBookmarks={initialBookmarks}
      initialNotes={initialNotes}
    />
  );
}

function NoQuestionsScreen({ reason }: { reason?: "image" }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
      <h1 className="text-[22px] font-bold text-text-high">
        {reason === "image"
          ? "이 세션의 문제는 모두 그림 의존 문제예요"
          : "문제가 없어요"}
      </h1>
      {reason === "image" && (
        <p className="mt-3 max-w-xs text-[13.5px] leading-[1.6] text-text-mid">
          베타에서 그림 매칭 정밀도 작업 중이라 풀이에서 임시 제외되어
          있어요. 다른 회차/모드로 시작해보세요.
        </p>
      )}
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
      >
        <NavArrowLeft className="h-4 w-4" strokeWidth={2} />
        홈으로
      </Link>
    </div>
  );
}
