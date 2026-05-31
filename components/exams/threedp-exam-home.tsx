"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavArrowLeft, NavArrowRight, BookStack, Sparks } from "iconoir-react";
import {
  DP,
  dpQuestionsBySubject,
  type DpSubject,
} from "@/lib/content/3dp";
import {
  createLocalAttempt,
  getLocalMistakeIds,
  getLocalBookmarks,
} from "@/lib/local/progress";
import { cn } from "@/lib/utils";

/**
 * 3D프린터운용기능사 종목 홈 — JSON 콘텐츠 + localStorage 진도 (DB 미사용).
 * 기존 /exams/[slug] 디자인을 따르되, 풀이 시작은 로컬 attempt 를 만들어
 * 기존 /practice/[attemptId] 라우트(로컬 분기)로 보낸다.
 */
export function ThreeDPExamHome() {
  const router = useRouter();
  const [mistakeCount, setMistakeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    setMistakeCount(getLocalMistakeIds().length);
    setBookmarkCount(getLocalBookmarks().length);
  }, []);

  const start = (ids: string[], label: string) => {
    if (ids.length === 0) return;
    const id = createLocalAttempt(ids, label);
    router.push(`/practice/${id}`);
  };

  const startSubject = (s: DpSubject) =>
    start(
      dpQuestionsBySubject(s.slug).map((q) => q.id),
      `${s.name} 풀이`,
    );

  const startAll = () =>
    start(
      dpQuestionsBySubject().map((q) => q.id),
      "전체 모의고사",
    );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted">
        <Link
          href="/exams"
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          시험 종목
        </Link>
      </nav>

      <header className="mt-4 border-b border-border pb-10 md:pb-12">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
            기능사
          </span>
          <span className="text-[12px] text-text-muted">· {DP.category.field}</span>
        </div>
        <h1 className="mt-3 text-[36px] font-bold tracking-[-0.02em] text-text-high md:text-[48px]">
          {DP.category.name}
        </h1>
        <p className="mt-1 font-mono text-[13px] text-text-muted">
          {DP.category.nameEn}
        </p>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-text-mid">
          {DP.category.description}
        </p>

        <dl className="mt-8 grid max-w-md grid-cols-2 gap-6 md:gap-10">
          <Stat label="과목" value={DP.subjects.length} suffix="개" />
          <Stat label="문제" value={DP.questions.length} suffix="문제" />
        </dl>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startAll}
            className="inline-flex h-12 items-center gap-1.5 rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            <Sparks className="h-4 w-4" strokeWidth={2} />
            전체 {DP.questions.length}문항 풀기
          </button>
          {mistakeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                start(getLocalMistakeIds(), "오답 다시풀기")
              }
              className="inline-flex h-12 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
            >
              오답 다시 풀기 · {mistakeCount}
            </button>
          )}
          {bookmarkCount > 0 && (
            <button
              type="button"
              onClick={() =>
                start(
                  getLocalBookmarks().filter((id) =>
                    DP.questions.some((q) => q.id === id),
                  ),
                  "북마크 풀이",
                )
              }
              className="inline-flex h-12 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
            >
              북마크 · {bookmarkCount}
            </button>
          )}
        </div>
      </header>

      <section className="pt-10">
        <p className="text-[14px] text-text-mid">
          과목 단위로 풀어요. 답을 고르면 바로 찍은 보기에 맞춘 해설이 떠요.
        </p>
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {DP.subjects.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => startSubject(s)}
                className="group flex w-full items-center justify-between rounded-md border border-border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-elev md:p-6"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-semibold tracking-wider text-text-muted">
                    {String(s.orderIdx).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 flex items-center gap-2 text-[17px] font-bold text-text-high">
                    <BookStack className="h-4 w-4 text-text-muted" strokeWidth={2} />
                    {s.name}
                  </h3>
                  <p className="mt-1 text-[13px] text-text-muted">
                    {s.questionCount}문항
                  </p>
                </div>
                <NavArrowRight
                  className="h-5 w-5 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                  strokeWidth={2}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div>
      <dt className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1.5 flex items-baseline gap-1">
        <span className="font-mono text-[28px] font-bold tabular-nums text-text-high md:text-[32px]">
          {value}
        </span>
        <span className="text-[14px] text-text-mid">{suffix}</span>
      </dd>
    </div>
  );
}
