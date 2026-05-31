"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PracticeSession } from "./practice-session";
import { DP, dpQuestionsByIds, type DpQuestion } from "@/lib/content/3dp";
import {
  getLocalAttempt,
  finishLocalAttempt,
  getLocalBookmarks,
  toggleLocalBookmark,
  getLocalNotes,
  saveLocalNote,
  type LocalRecord,
} from "@/lib/local/progress";

/**
 * 로컬(localStorage) 풀이 — attemptId 가 "local-" 로 시작할 때 사용.
 * 기존 PracticeSession UI 를 그대로 재사용하되, 제출/북마크/메모를
 * 서버 액션 대신 localStorage 로 처리한다 (DB 미사용).
 */
export function LocalPractice({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [qs, setQs] = useState<DpQuestion[] | null>(null);

  useEffect(() => {
    const att = getLocalAttempt(attemptId);
    if (!att) {
      router.replace(`/exams/${DP.category.slug}`);
      return;
    }
    if (att.finishedAt) {
      router.replace(`/practice/${attemptId}/result`);
      return;
    }
    setQs(dpQuestionsByIds(att.plannedQuestionIds));
  }, [attemptId, router]);

  if (!qs) {
    return (
      <div className="mx-auto max-w-md py-32 text-center text-text-mid">
        불러오는 중…
      </div>
    );
  }

  const questions = qs.map((q) => ({
    id: q.id,
    number: q.number,
    stem: q.stem,
    choices: q.choices,
    hasMath: false,
    subject: { name: q.subjectName, slug: q.subjectSlug },
    imageUrl: q.imageUrl,
    imageAlt: q.imageAlt,
    correctAnswer: q.correctAnswer,
    explanations: q.explanations,
  }));

  const correctById = new Map(qs.map((q) => [q.id, q.correctAnswer]));

  return (
    <PracticeSession
      attemptId={attemptId}
      questions={questions}
      categoryName={DP.category.name}
      durationMin={null}
      initialBookmarks={getLocalBookmarks()}
      initialNotes={getLocalNotes()}
      resultHref={`/practice/${attemptId}/result`}
      onToggleBookmark={async (id) => toggleLocalBookmark(id)}
      onSaveNote={async (id, content) => {
        saveLocalNote(id, content);
      }}
      onSubmit={async (_aid, payload) => {
        const records: LocalRecord[] = payload.map((p) => ({
          questionId: p.questionId,
          userAnswer: p.userAnswer,
          isCorrect:
            p.userAnswer.trim() !== "" &&
            correctById.get(p.questionId) === p.userAnswer,
          timeSpentSec: p.timeSpentSec,
          flagged: p.flagged,
          confidence: p.confidence,
        }));
        finishLocalAttempt(attemptId, records);
      }}
    />
  );
}
