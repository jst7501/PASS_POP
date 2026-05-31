"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, XmarkCircle, NavArrowRight } from "iconoir-react";
import { DP, dpQuestionsByIds, type DpQuestion } from "@/lib/content/3dp";
import { PremiumExplanation } from "./premium-explanation";
import {
  getLocalAttempt,
  getLocalMistakeIds,
  createLocalAttempt,
  type LocalAttempt,
} from "@/lib/local/progress";
import { cn } from "@/lib/utils";

const PASS_THRESHOLD = 60;

export function LocalResult({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [att, setAtt] = useState<LocalAttempt | null>(null);

  useEffect(() => {
    const a = getLocalAttempt(attemptId);
    if (!a) {
      router.replace(`/exams/${DP.category.slug}`);
      return;
    }
    if (!a.finishedAt) {
      router.replace(`/practice/${attemptId}`);
      return;
    }
    setAtt(a);
  }, [attemptId, router]);

  const qById = useMemo(() => {
    if (!att) return new Map<string, DpQuestion>();
    return new Map(
      dpQuestionsByIds(att.plannedQuestionIds).map((q) => [q.id, q]),
    );
  }, [att]);

  if (!att) {
    return (
      <div className="mx-auto max-w-md py-32 text-center text-text-mid">
        결과 불러오는 중…
      </div>
    );
  }

  const total = att.records.length;
  const correctCount = att.records.filter((r) => r.isCorrect).length;
  const score = att.score ?? 0;
  const passed = score >= PASS_THRESHOLD;

  const retryMistakes = () => {
    const ids = getLocalMistakeIds();
    if (ids.length === 0) return;
    const id = createLocalAttempt(ids, "오답 다시풀기");
    router.push(`/practice/${id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 md:px-6">
      {/* 점수 헤더 */}
      <div className="rounded-md border border-border bg-surface p-6 md:p-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {DP.category.name} · {att.label}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span
              className={cn(
                "font-mono text-[52px] font-bold leading-none tabular-nums",
                passed ? "text-accent" : "text-danger",
              )}
            >
              {score}
            </span>
            <span className="ml-1 text-[18px] text-text-mid">점</span>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-semibold",
              passed
                ? "bg-accent/15 text-accent"
                : "bg-danger/15 text-danger",
            )}
          >
            {passed ? "합격선 통과" : "합격선 미달"} · {correctCount}/{total}
          </span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-mute">
          <div
            className={cn(
              "h-full rounded-full",
              passed ? "bg-accent" : "bg-danger",
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 액션 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={retryMistakes}
          disabled={correctCount === total}
          className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          오답만 다시 풀기
        </button>
        <Link
          href={`/exams/${DP.category.slug}`}
          className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
        >
          종목 홈으로
          <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>

      {/* 문항별 리뷰 */}
      <h2 className="mt-10 text-[15px] font-bold text-text-high">문항별 리뷰</h2>
      <ul className="mt-4 space-y-3">
        {att.plannedQuestionIds.map((qid) => {
          const q = qById.get(qid);
          const rec = att.records.find((r) => r.questionId === qid);
          if (!q || !rec) return null;
          return (
            <ReviewItem key={qid} q={q} userAnswer={rec.userAnswer} isCorrect={rec.isCorrect} />
          );
        })}
      </ul>
    </div>
  );
}

function ReviewItem({
  q,
  userAnswer,
  isCorrect,
}: {
  q: DpQuestion;
  userAnswer: string;
  isCorrect: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="overflow-hidden rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        {isCorrect ? (
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
        ) : (
          <XmarkCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" strokeWidth={2} />
        )}
        <span className="min-w-0 flex-1">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-text-muted">
            Q.{String(q.number).padStart(2, "0")} · {q.subjectName}
          </span>
          <span className="mt-1 block truncate text-[14px] text-text-high">
            {q.stem}
          </span>
          <span className="mt-1 block text-[12px] text-text-muted">
            내 답 {userAnswer || "—"}번 · 정답 {q.correctAnswer}번
          </span>
        </span>
        <NavArrowRight
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform",
            open ? "rotate-90" : "rotate-0",
          )}
          strokeWidth={2.5}
        />
      </button>
      {open && (
        <div className="border-t border-border-soft px-4 pb-4 pt-2">
          {q.imageUrl && (
            <div className="mb-1 mt-3 overflow-hidden rounded-md border border-border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.imageUrl}
                alt={q.imageAlt ?? ""}
                className="mx-auto max-h-60 w-auto"
              />
            </div>
          )}
          <PremiumExplanation
            premium={q.premium}
            userAnswer={userAnswer}
            correctAnswer={q.correctAnswer}
          />
        </div>
      )}
    </li>
  );
}
