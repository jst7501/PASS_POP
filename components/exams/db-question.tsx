import Link from "next/link";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { breadcrumbLd, qaPageLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ExplanationHtml } from "@/components/practice/explanation-html";
import { ConceptCard } from "@/components/practice/concept-card";
import { renderExplanationHtml } from "@/lib/explanation-render";
import { gradeBadge } from "@/lib/queries";
import type { ExamGrade } from "@/lib/generated/prisma-client";
import { cn } from "@/lib/utils";
import { HookText } from "@/components/hook-text";

type Choice = { label: string; text: string; imageUrl?: string | null };
type Expl = {
  wrongChoice: string | null;
  explanation: string;
  memoryHook: string | null;
  sections?: unknown;
};

type Sections = {
  tldr?: string | null;
  source?: string | null;
  body?: string | null;
  trap?: string | null;
  extra?: string | null;
};

function asSections(v: unknown): Sections | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const s = v as Sections;
  return s.body || s.tldr ? s : null;
}

/**
 * DB 종목의 개별 문제 SEO 페이지 — 서버 렌더.
 * 지문·그림·보기·정답·해설을 모두 공개하고 이전/다음 문제로 내부 링크한다.
 * 3D프린터(JSON 종목)는 ThreeDPQuestionPage 가 따로 담당한다.
 */
export function DbQuestionPage({
  data,
  roundSlug,
}: {
  data: {
    question: {
      number: number;
      stem: string;
      correctAnswer: string;
      choices: unknown;
      imageUrl: string | null;
      tags: string[];
      subject: { name: string; slug: string };
      exam: {
        year: number;
        round: number;
        title: string;
        category: { slug: string; name: string; grade: ExamGrade };
      } | null;
      explanations: Expl[];
    };
    prev: number | null;
    next: number | null;
  };
  roundSlug: string;
}) {
  const q = data.question;
  const exam = q.exam;
  if (!exam) return null;

  const cat = exam.category;
  const base = `/exams/${cat.slug}`;
  const roundBase = `${base}/rounds/${roundSlug}`;
  const path = `${roundBase}/questions/${q.number}`;
  const choices = (q.choices as Choice[]) ?? [];
  const answerText =
    choices.find((c) => c.label === q.correctAnswer)?.text ?? "";

  const main = q.explanations.find((e) => e.wrongChoice === null) ?? null;
  const mainSections = main ? asSections(main.sections) : null;
  const perChoice = q.explanations
    .filter((e) => e.wrongChoice !== null)
    .sort((a, b) => Number(a.wrongChoice) - Number(b.wrongChoice));

  // 자료가 그림 안에 있는 문항이 많아, 요약은 해설 첫 문단에서 가져온다
  const summary = main
    ? main.explanation.replace(/\*\*/g, "").split("\n")[0].slice(0, 200)
    : `정답은 ${q.correctAnswer}번이에요.`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "시험 종목", path: "/exams" },
            { name: cat.name, path: base },
            { name: `${exam.year}년 ${exam.round}회`, path: roundBase },
            { name: `${q.number}번 문제`, path },
          ]),
          qaPageLd({
            question: q.stem,
            answerText: `정답: ${q.correctAnswer}번 ${answerText}. ${summary}`,
            path,
          }),
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 pb-24 md:px-6">
        <nav className="pt-6 text-[13px] text-text-muted">
          <Link
            href={roundBase}
            className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
          >
            <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            {exam.year}년 {exam.round}회
          </Link>
        </nav>

        <header className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[11.5px] font-semibold tracking-[0.02em] text-primary">
              {gradeBadge(cat)}
            </span>
            <Link
              href={base}
              className="text-[12.5px] text-text-muted hover:text-text-mid"
            >
              {cat.name}
            </Link>
            <span className="text-[12.5px] text-text-muted">
              · {q.subject.name}
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="font-mono text-[30px] font-extrabold leading-none tracking-[-0.03em] text-primary md:text-[36px]">
              {q.number}
            </span>
            <span className="text-[12.5px] font-semibold text-text-muted">
              번 문제
            </span>
          </div>
          <h1 className="mt-2.5 text-[21px] font-bold leading-[1.5] tracking-[-0.015em] text-text-high md:text-[26px]">
            {q.stem}
          </h1>
        </header>

        {q.imageUrl && (
          <div className="mt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={q.imageUrl}
              alt={`${cat.name} ${exam.round}회 ${q.number}번 자료`}
              className="mx-auto max-h-[420px] w-full max-w-[520px] rounded-md object-contain"
            />
          </div>
        )}

        <ul className="mt-6 space-y-2">
          {choices.map((c) => {
            const correct = c.label === q.correctAnswer;
            return (
              <li
                key={c.label}
                className={cn(
                  "flex items-start gap-3 rounded-md px-4 py-3.5 text-[15.5px] leading-[1.6]",
                  correct
                    ? "border-l-[3px] border-accent bg-accent/[0.10] font-semibold text-text-high"
                    : "bg-surface-mute text-text-mid",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[12.5px] font-bold",
                    correct
                      ? "bg-accent text-white"
                      : "bg-surface text-text-muted",
                  )}
                >
                  {c.label}
                </span>
                <span className="flex-1">
                  {c.text?.trim()}
                  {correct && (
                    <span className="ml-2 align-middle text-[11.5px] font-bold text-accent">
                      정답
                    </span>
                  )}
                  {c.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imageUrl}
                      alt={`보기 ${c.label}`}
                      className="max-h-44 w-auto rounded-sm bg-white"
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {main && (
          <section className="mt-8">
            {/* 글이 길다. 결론 한 줄을 먼저 세우고 나머지는 접어 둔다. */}
            {mainSections?.tldr ? (
              <div className="rounded-lg border-l-[3px] border-accent bg-accent/[0.08] px-5 py-4">
                <span className="text-[11.5px] font-bold text-accent">
                  왜 {q.correctAnswer}번인가
                </span>
                <div className="mt-1.5">
                  <ExplanationHtml html={mainSections.tldr} />
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-surface-mute px-5 py-5">
                <ExplanationHtml html={main.explanation} />
              </div>
            )}

            {mainSections?.source?.trim() && (
              <details className="group mt-3 rounded-lg bg-surface-mute">
                <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-2 px-4 text-[13.5px] font-semibold text-text-mid transition-colors hover:text-text-high [&::-webkit-details-marker]:hidden">
                  자료는 무슨 내용이었나요
                  <NavArrowRight
                    className="h-4 w-4 transition-transform group-open:rotate-90"
                    strokeWidth={2.5}
                  />
                </summary>
                <div className="border-t border-border px-4 pb-4 pt-3.5">
                  <ExplanationHtml html={mainSections.source} />
                </div>
              </details>
            )}

            {main.memoryHook && !mainSections && (
              <p className="mt-4 rounded-lg bg-warning/[0.13] px-4 py-3 text-[14.5px] font-semibold leading-[1.5] text-text-high">
                <HookText text={main.memoryHook} />
              </p>
            )}
          </section>
        )}

        {perChoice.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[16px] font-bold tracking-[-0.01em] text-text-high">
              보기별로 왜 맞고 왜 틀렸을까요
            </h2>
            <ul className="mt-3 space-y-3">
              {perChoice.map((e) => {
                const correct = e.wrongChoice === q.correctAnswer;
                // 번호만 있으면 그게 무슨 보기였는지 위로 다시 올라가야 한다
                const choice = choices.find((c) => c.label === e.wrongChoice);
                return (
                  <li
                    key={e.wrongChoice}
                    className={cn(
                      "rounded-lg px-4 py-4",
                      correct ? "bg-accent/[0.08]" : "bg-surface-mute",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold",
                          correct
                            ? "bg-accent text-white"
                            : "bg-surface-elev text-text-mid",
                        )}
                      >
                        {e.wrongChoice}
                      </span>
                      <p
                        className={cn(
                          "flex-1 text-[14px] font-semibold leading-[1.5]",
                          correct ? "text-text-high" : "text-text-mid",
                        )}
                      >
                        {choice?.text?.trim() || "사진 보기"}
                      </p>
                      {correct && (
                        <span className="mt-0.5 shrink-0 rounded-sm bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                          정답
                        </span>
                      )}
                    </div>
                    <div className="mt-3 border-t border-border-soft pt-3">
                      <ExplanationHtml html={e.explanation} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 개념 카드 — 교재 없이 이 자리에서 개념·함정·암기까지 */}
        {mainSections?.body && (
          <ConceptCard
            concept={{
              bodyHtml: renderExplanationHtml(mainSections.body),
              trapHtml: mainSections.trap?.trim()
                ? renderExplanationHtml(mainSections.trap)
                : null,
              extraHtml: mainSections.extra?.trim()
                ? renderExplanationHtml(mainSections.extra)
                : null,
              hook: main?.memoryHook ?? null,
            }}
          />
        )}

        {q.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {q.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-full bg-surface-mute px-3 py-1.5 text-[12px] text-text-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        )}


        {/* 검색으로 들어온 사람이 여기서 끝나지 않게 — 이 회차를 바로 풀 수 있는 자리 */}
        <div className="mt-9 rounded-lg border border-border bg-surface px-5 py-5">
          <p className="text-[15px] font-bold leading-[1.5] text-text-high">
            {exam.year}년 {exam.round}회를 직접 풀어볼까요?
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.7] text-text-mid">
            가입 없이 바로 시작해요. 고른 번호에 맞춘 해설이 문제마다 붙어요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/practice?category=${cat.slug}&exam=${roundSlug}&mode=practice`}
              className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98]"
            >
              이 회차 풀어보기
              <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href={roundBase}
              className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 text-[14px] font-semibold text-text-mid transition-colors hover:border-primary/40 hover:text-text-high"
            >
              회차 정보
            </Link>
          </div>
        </div>

        <nav className="mt-8 flex items-center justify-between border-t border-border pt-5 text-[13.5px]">
          {data.prev ? (
            <Link
              href={`${roundBase}/questions/${data.prev}`}
              className="inline-flex items-center gap-1.5 text-text-mid transition-colors hover:text-text-high"
            >
              <NavArrowLeft className="h-4 w-4" strokeWidth={2} />
              {data.prev}번
            </Link>
          ) : (
            <span />
          )}
          {data.next ? (
            <Link
              href={`${roundBase}/questions/${data.next}`}
              className="inline-flex items-center gap-1.5 text-text-mid transition-colors hover:text-text-high"
            >
              {data.next}번
              <NavArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </>
  );
}
