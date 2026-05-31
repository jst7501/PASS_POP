import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NavArrowRight,
  NavArrowLeft,
  NumberedListLeft,
  Shuffle,
  WarningTriangle,
  CheckCircle,
  XmarkCircle,
  Book,
} from "iconoir-react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getSubjectDetail, GRADE_LABEL } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth/anon";
import { buildMeta } from "@/lib/seo/metadata";
import { breadcrumbLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ReviewStartButton } from "@/components/review-start-button";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; subjectSlug: string }>;
}): Promise<Metadata> {
  const { slug, subjectSlug: raw } = await params;
  let subjectSlug = raw;
  try {
    subjectSlug = decodeURIComponent(raw);
  } catch {
    /* 원본 유지 */
  }
  const subject = await getSubjectDetail(slug, subjectSlug);
  if (!subject) {
    return buildMeta({
      title: "과목을 찾을 수 없어요",
      path: `/exams/${slug}/subjects/${encodeURIComponent(subjectSlug)}`,
      index: false,
    });
  }
  const gradeLabel = GRADE_LABEL[subject.category.grade];
  return buildMeta({
    title: `${subject.name} — ${subject.category.name} 기출 문제풀이`,
    description: `${subject.category.name} ${subject.name} 과목 기출문제 ${subject._count.questions}문제를 무료로. 순서대로·랜덤·오답만 모드와 찍은 오답까지 분석하는 AI 해설. 회원가입 없이 바로 풀이.`,
    path: `/exams/${slug}/subjects/${encodeURIComponent(subjectSlug)}`,
    keywords: [
      subject.name,
      `${subject.category.name} ${subject.name}`,
      `${subject.category.name} 기출`,
      `${subject.name} 기출문제`,
      gradeLabel,
    ],
  });
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; subjectSlug: string }>;
}) {
  const { slug, subjectSlug: rawSubjectSlug } = await params;
  // Next.js 가 한글 param 을 인코딩된 채로 넘기는 경우 방어적으로 디코드
  let subjectSlug = rawSubjectSlug;
  try {
    subjectSlug = decodeURIComponent(rawSubjectSlug);
  } catch {
    /* 이미 디코딩됐거나 invalid sequence → 원본 유지 */
  }
  const subject = await getSubjectDetail(slug, subjectSlug);
  if (!subject) notFound();

  const user = await getCurrentUser();
  // 이 과목 진척률 / 정답률 / 오답수
  const myStats = user
    ? await (async () => {
        // 가장 최근 풀이만 questionId 별로
        const latest = await prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            question: { subjectId: subject.id },
          },
          orderBy: { answeredAt: "desc" },
          distinct: ["questionId"],
          select: { isCorrect: true, questionId: true },
        });
        // 전체 횟수 (정답률 계산용)
        const allRecords = await prisma.answerRecord.findMany({
          where: {
            userId: user.id,
            question: { subjectId: subject.id },
          },
          select: { isCorrect: true },
        });
        const solved = latest.length;
        const mastered = latest.filter((r) => r.isCorrect).length;
        const wrongs = latest.filter((r) => !r.isCorrect).length;
        const totalAnswered = allRecords.length;
        const correct = allRecords.filter((r) => r.isCorrect).length;
        const acc =
          totalAnswered > 0
            ? Math.round((correct / totalAnswered) * 100)
            : null;
        return { solved, mastered, wrongs, acc };
      })()
    : null;

  const total = subject._count.questions;
  const masterPct =
    myStats && total > 0
      ? Math.round((myStats.mastered / total) * 100)
      : 0;
  const solvedPct =
    myStats && total > 0
      ? Math.round((myStats.solved / total) * 100)
      : 0;

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "홈", path: "/" },
          { name: "시험 종목", path: "/exams" },
          { name: subject.category.name, path: `/exams/${slug}` },
          {
            name: subject.name,
            path: `/exams/${slug}/subjects/${encodeURIComponent(subjectSlug)}`,
          },
        ])}
      />
      <div className="mx-auto max-w-3xl px-4 pb-24 md:px-6">
        <nav className="pt-6 text-[13px] text-text-muted">
          <Link
            href={`/exams/${slug}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
          >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          {subject.category.name}
        </Link>
      </nav>

      <header className="mt-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
            {GRADE_LABEL[subject.category.grade]}
          </span>
          <span className="text-[11.5px] text-text-muted">
            · {subject.category.name}
          </span>
        </div>

        <h1 className="mt-3 text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
          {subject.name}
        </h1>
      </header>

      {/* 내 마스터율 + 풀이 비율 + 정답률 */}
      {myStats && (
        <section className="mt-5 rounded-md border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                마스터율
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-[24px] font-bold tabular-nums tracking-[-0.02em]",
                    masterPct >= 80
                      ? "text-accent"
                      : masterPct > 0
                        ? "text-primary"
                        : "text-text-muted",
                  )}
                >
                  {masterPct}
                </span>
                <span className="text-[12px] text-text-muted">%</span>
                <span className="ml-2 text-[11.5px] text-text-muted">
                  <span className="tabular-nums">{myStats.mastered}</span>/
                  <span className="tabular-nums">{total}</span>문제
                </span>
              </p>
              <p className="mt-1 text-[10.5px] text-text-muted">
                마스터 = 가장 최근 풀이가 정답인 문제
              </p>
            </div>
            <div className="flex gap-3 text-right">
              {myStats.acc != null && (
                <div>
                  <p className="text-[10.5px] text-text-muted">정답률</p>
                  <p
                    className={cn(
                      "text-[16px] font-bold tabular-nums",
                      myStats.acc >= 60 ? "text-accent" : "text-danger",
                    )}
                  >
                    {myStats.acc}%
                  </p>
                </div>
              )}
              {myStats.wrongs > 0 && (
                <div>
                  <p className="text-[10.5px] text-text-muted">오답</p>
                  <p className="text-[16px] font-bold tabular-nums text-danger">
                    {myStats.wrongs}
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* 이중 바: 풀이(연) + 마스터(진) */}
          <div className="relative mt-3 h-[4px] overflow-hidden rounded-sm bg-border-soft">
            <div
              className="absolute inset-y-0 left-0 bg-text-mid/30"
              style={{ width: `${solvedPct}%` }}
            />
            <div
              className={cn(
                "absolute inset-y-0 left-0",
                masterPct >= 80 ? "bg-accent" : "bg-primary",
              )}
              style={{ width: `${masterPct}%` }}
            />
          </div>
        </section>
      )}

      {/* 이론 요약 카드 (Subject.description) */}
      {subject.description && subject.description.trim() && (
        <section className="mt-6 rounded-md border border-border bg-surface p-4 md:p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Book className="h-3.5 w-3.5" strokeWidth={2} />
            이 단원 핵심
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-[1.7] text-text-high">
            {subject.description}
          </p>
        </section>
      )}

      {/* 문제 통계 */}
      <section className="mt-6 grid grid-cols-3 overflow-hidden rounded-md border border-border bg-surface">
        <Stat label="총 문제" value={total} />
        <Stat
          label="연습 전용"
          value={subject.practiceQuestionCount}
          bordered
        />
        <Stat
          label="회차별"
          value={subject.roundBoundQuestionCount}
          bordered
        />
      </section>

      {/* 모드 선택 */}
      <section className="mt-8">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-text-high">
          어떻게 풀어볼까요?
        </h2>
        <ul className="mt-3 grid gap-2">
          <li>
            <Link
              href={`/practice?subject=${subjectSlug}&category=${slug}&mode=sequence`}
              className="group flex items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors hover:border-text-mid"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/12 text-primary">
                <NumberedListLeft className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold text-text-high">
                  순서대로 풀기
                </h3>
                <p className="mt-0.5 text-[12px] text-text-mid">
                  1번부터 차근차근. 시간 제한 없음.
                </p>
              </div>
              <NavArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-text-high"
                strokeWidth={2}
              />
            </Link>
          </li>
          <li>
            <Link
              href={`/practice?subject=${subjectSlug}&category=${slug}&mode=mock`}
              className="group flex items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors hover:border-text-mid"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-mute text-text-mid">
                <Shuffle className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold text-text-high">
                  랜덤 풀기
                </h3>
                <p className="mt-0.5 text-[12px] text-text-mid">
                  섞어서 풀어요. 매번 다른 순서.
                </p>
              </div>
              <NavArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-text-high"
                strokeWidth={2}
              />
            </Link>
          </li>
          {myStats && myStats.wrongs > 0 && (
            <li>
              <div className="flex items-start gap-3 rounded-md border border-danger/30 bg-danger/[0.03] p-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-danger/15 text-danger">
                  <WarningTriangle className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-text-high">
                    오답만 다시 풀기
                  </h3>
                  <p className="mt-0.5 text-[12px] text-text-mid">
                    이 단원에서 틀린{" "}
                    <span className="tabular-nums font-semibold text-danger">
                      {myStats.wrongs}
                    </span>
                    문제 모아 풀이.
                  </p>
                </div>
                <ReviewStartButton
                  source="mistakes"
                  label="시작"
                  className="!h-9 !px-3 !text-[12px]"
                />
              </div>
            </li>
          )}
        </ul>
      </section>

      {/* 풀기 / 풀기 결과 — 시각 가이드 */}
      <section className="mt-10 rounded-md border border-border-soft bg-surface-mute p-4">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          <CheckCircle className="h-3 w-3" strokeWidth={2} />
          연습 모드 안내
        </p>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-text-mid">
          답을 선택하면 즉시 채점되고, 고른 답에 맞춘 해설이 바로 떠요.
        </p>
        <p className="mt-1 text-[12.5px] leading-[1.6] text-text-mid">
          <XmarkCircle
            className="mr-0.5 inline h-3 w-3 text-danger"
            strokeWidth={2}
          />
          틀린 문제는 자동으로 오답노트에 저장돼요. 1일 → 3일 → 7일 간격으로
          다시 출제됩니다.
        </p>
      </section>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  bordered,
}: {
  label: string;
  value: number;
  bordered?: boolean;
}) {
  return (
    <div className={cn("px-3 py-3", bordered && "border-l border-border")}>
      <p className="text-[10.5px] text-text-muted">{label}</p>
      <p className="mt-1 text-[18px] font-bold tabular-nums tracking-[-0.01em] text-text-high">
        {value}
      </p>
    </div>
  );
}
