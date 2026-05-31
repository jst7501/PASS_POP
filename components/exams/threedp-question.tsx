import Link from "next/link";
import { NavArrowLeft, NavArrowRight, CheckCircle, Sparks } from "iconoir-react";
import {
  DP,
  DP_SLUG,
  dpQuestionByNumber,
  dpQuestionsSorted,
  dpQuestionsBySubject,
  dpSubject,
  type DpStatus,
} from "@/lib/content/3dp";
import { breadcrumbLd, qaPageLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ThreeDPStartButton } from "@/components/exams/threedp-start-button";
import { cn } from "@/lib/utils";

const TONE: Record<DpStatus, { label: string; bg: string; chip: string }> = {
  correct: { label: "정답", bg: "bg-accent/[0.08]", chip: "bg-accent/20 text-accent" },
  common_trap: { label: "자주 틀리는 함정", bg: "bg-danger/[0.07]", chip: "bg-danger/20 text-danger" },
  weak_trap: { label: "아쉬운 오답", bg: "bg-warning/[0.12]", chip: "bg-warning/25 text-warning" },
  trap: { label: "오답", bg: "bg-surface-mute", chip: "bg-surface-elev text-text-mid" },
  dummy: { label: "매력 없는 오답", bg: "bg-surface-mute", chip: "bg-surface-elev text-text-muted" },
};
function pointTone(k: string): string {
  if (k.includes("갈림길")) return "bg-danger/15 text-danger";
  if (k.includes("정답")) return "bg-accent/20 text-accent";
  if (k.includes("개념")) return "bg-primary/[0.12] text-primary";
  return "bg-surface-mute text-text-mid";
}

/**
 * DP 개별 문제 SEO 페이지 — 서버 렌더(정적 생성·색인 대상).
 * 지문·보기·정답·전체 프리미엄 해설을 모두 공개하고, 이전/다음·같은 과목으로 내부 링크.
 */
export function ThreeDPQuestionPage({ number }: { number: number }) {
  const q = dpQuestionByNumber(number);
  if (!q) return null;
  const subject = dpSubject(q.subjectSlug);
  const sorted = dpQuestionsSorted();
  const idx = sorted.findIndex((x) => x.number === number);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const sameSubject = dpQuestionsBySubject(q.subjectSlug).filter(
    (x) => x.number !== number,
  );
  const answerText =
    q.choices.find((c) => c.label === q.correctAnswer)?.text ?? "";
  const base = `/exams/${DP_SLUG}`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "시험 종목", path: "/exams" },
            { name: DP.category.name, path: base },
            { name: subject?.name ?? "과목", path: `${base}/subjects/${q.subjectSlug}` },
            { name: `${q.number}번 문제`, path: `${base}/questions/${q.number}` },
          ]),
          qaPageLd({
            question: q.stem,
            answerText: `정답: ${q.correctAnswer}번 ${answerText}. ${q.premium.answerSummary}`,
            path: `${base}/questions/${q.number}`,
          }),
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 pb-24 md:px-6">
        <nav className="pt-6 text-[13px] text-text-muted">
          <Link
            href={`${base}/subjects/${q.subjectSlug}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
          >
            <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            {subject?.name ?? DP.category.name}
          </Link>
        </nav>

        <header className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
              기능사
            </span>
            <Link
              href={base}
              className="text-[11.5px] text-text-muted hover:text-text-mid"
            >
              {DP.category.name}
            </Link>
            <span className="text-[11.5px] text-text-muted">· {subject?.name}</span>
          </div>
          <p className="mt-3 font-mono text-[12px] font-semibold tracking-wider text-text-muted">
            Q.{String(q.number).padStart(2, "0")}
          </p>
          <h1 className="mt-1.5 text-[20px] font-bold leading-[1.55] tracking-[-0.01em] text-text-high md:text-[23px]">
            {q.stem}
          </h1>
        </header>

        {q.imageUrl && (
          <div className="mt-5 overflow-hidden rounded-md border border-border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={q.imageUrl}
              alt={q.imageAlt ?? `${DP.category.name} ${q.number}번 그림`}
              className="mx-auto max-h-72 w-auto"
            />
          </div>
        )}

        {/* 보기 */}
        <ul className="mt-6 space-y-2">
          {q.choices.map((c) => {
            const correct = c.label === q.correctAnswer;
            return (
              <li
                key={c.label}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-4 py-3 text-[15px]",
                  correct
                    ? "border-accent/40 bg-accent/[0.07] font-medium text-text-high"
                    : "border-border bg-surface text-text-mid",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold",
                    correct ? "bg-accent text-white" : "bg-surface-mute text-text-mid",
                  )}
                >
                  {c.label}
                </span>
                <span className="flex-1 leading-[1.55]">{c.text}</span>
                {correct && (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[13px] text-text-mid">
          정답 <strong className="font-mono text-accent">{q.correctAnswer}번</strong>
          {answerText && <> · {answerText}</>}
        </p>

        {/* 해설 — 전체 공개 (색인 대상) */}
        <section className="mt-10">
          <h2 className="text-[16px] font-bold tracking-[-0.01em] text-text-high">
            해설
          </h2>

          <div className="mt-4 space-y-4">
            {/* 한 줄 요약 */}
            <div className="rounded-2xl bg-accent/[0.08] px-[18px] py-4 text-[15px] font-semibold leading-[1.6] text-text-high">
              {q.premium.answerSummary}
            </div>

            {/* 보기별 풀이 — 4개 전부 */}
            <h3 className="pt-2 text-[13px] font-bold text-text-high">보기별 풀이</h3>
            {q.premium.diagnoses.map((d) => (
              <div key={d.n} className={cn("rounded-2xl px-[18px] py-4", TONE[d.status].bg)}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                      TONE[d.status].chip,
                    )}
                  >
                    {d.n}
                  </span>
                  <span className="text-[14px] font-bold leading-[1.5] text-text-high">
                    {d.headline}
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {d.points.map((p, i) => (
                    <div key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                      <span
                        className={cn(
                          "inline-flex h-fit w-fit shrink-0 rounded-full px-3 py-0.5 text-[11.5px] font-bold",
                          pointTone(p.k),
                        )}
                      >
                        {p.k}
                      </span>
                      <span className="text-[13.5px] leading-[1.7] text-text-mid">{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 핵심 개념 */}
            <div className="rounded-2xl bg-surface-mute px-[18px] py-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">핵심 개념</p>
              <p className="mt-2 text-[14.5px] font-bold leading-[1.5] text-text-high">{q.premium.theory.title}</p>
              <p className="mt-2 text-[14px] leading-[1.8] text-text-mid">{q.premium.theory.body}</p>
              {q.premium.theory.terms.length > 0 && (
                <div className="mt-3.5 space-y-2">
                  {q.premium.theory.terms.map((t, i) => (
                    <div key={i} className="rounded-xl bg-surface px-3.5 py-2.5 text-[13px] leading-[1.55]">
                      <span className="font-bold text-primary">{t.term}</span>
                      <span className="text-text-mid"> — {t.def}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 함정 */}
            <div className="rounded-2xl bg-danger/[0.06] px-[18px] py-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-danger/80">출제자가 숨긴 함정</p>
              <p className="mt-2 text-[14px] leading-[1.75] text-text-mid">{q.premium.trapDesign}</p>
            </div>

            {/* 전략 */}
            <div className="rounded-2xl bg-primary/[0.06] px-[18px] py-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary/80">{q.premium.metaStrategy.title}</p>
              <p className="mt-2 text-[14px] leading-[1.75] text-text-mid">{q.premium.metaStrategy.text}</p>
            </div>

            {/* 암기 후크 */}
            <div className="rounded-2xl bg-warning/[0.13] px-[18px] py-4">
              <span className="inline-block rounded-full bg-warning/25 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-warning">암기 후크</span>
              <p className="mt-2.5 text-[15.5px] font-bold leading-[1.5] text-text-high">{q.premium.hook}</p>
            </div>

            {q.premium.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {q.premium.tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface-mute px-3 py-1 text-[11px] text-text-muted">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-8">
          <ThreeDPStartButton ids={[q.id]} label={`${q.number}번 직접 풀기`}>
            <Sparks className="h-4 w-4" strokeWidth={2} />이 문제 직접 풀어보기
          </ThreeDPStartButton>
        </div>

        {/* 이전 / 다음 */}
        <nav className="mt-10 flex items-stretch gap-3">
          {prev ? (
            <Link
              href={`${base}/questions/${prev.number}`}
              className="group flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/30"
            >
              <NavArrowLeft className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
              <span className="min-w-0">
                <span className="block text-[11px] text-text-muted">이전 {prev.number}번</span>
                <span className="block truncate text-[13px] font-medium text-text-high">{prev.stem}</span>
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              href={`${base}/questions/${next.number}`}
              className="group flex flex-1 items-center justify-end gap-2 rounded-md border border-border bg-surface px-4 py-3 text-right transition-colors hover:border-primary/30"
            >
              <span className="min-w-0">
                <span className="block text-[11px] text-text-muted">다음 {next.number}번</span>
                <span className="block truncate text-[13px] font-medium text-text-high">{next.stem}</span>
              </span>
              <NavArrowRight className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>

        {/* 같은 과목 다른 문제 — 내부 링크 */}
        {sameSubject.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[15px] font-semibold text-text-high">
              {subject?.name} 다른 문제
            </h2>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {sameSubject.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`${base}/questions/${x.number}`}
                    className="group flex items-start gap-2 rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/30 hover:bg-surface-mute"
                  >
                    <span className="font-mono text-[12px] font-semibold text-text-muted">
                      {String(x.number).padStart(2, "0")}
                    </span>
                    <span className="line-clamp-2 flex-1 text-[13px] leading-[1.5] text-text-mid">
                      {x.stem}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
