import Link from "next/link";
import { NavArrowLeft, NavArrowRight, Sparks } from "iconoir-react";
import { DP, DP_SLUG, dpSubject, dpQuestionsBySubject } from "@/lib/content/3dp";
import { breadcrumbLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ThreeDPStartButton } from "@/components/exams/threedp-start-button";

/**
 * DP 과목 상세 — 서버 렌더(색인 가능). 수록 문제(지문+보기)를 미리 보여주고,
 * 정답/해설은 풀이(/practice) 안에서만 노출. 형제 과목으로 내부 링크.
 */
export function ThreeDPSubjectPage({ subjectSlug }: { subjectSlug: string }) {
  const subject = dpSubject(subjectSlug);
  if (!subject) return null; // 호출부(page)에서 notFound 처리 — 방어적 가드
  const questions = dpQuestionsBySubject(subjectSlug);
  const ids = questions.map((q) => q.id);
  const others = DP.subjects.filter((s) => s.slug !== subjectSlug);

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "홈", path: "/" },
          { name: "시험 종목", path: "/exams" },
          { name: DP.category.name, path: `/exams/${DP_SLUG}` },
          {
            name: subject.name,
            path: `/exams/${DP_SLUG}/subjects/${subject.slug}`,
          },
        ])}
      />
      <div className="mx-auto max-w-3xl px-4 pb-24 md:px-6">
        <nav className="pt-6 text-[13px] text-text-muted">
          <Link
            href={`/exams/${DP_SLUG}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
          >
            <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            {DP.category.name}
          </Link>
        </nav>

        <header className="mt-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
              기능사
            </span>
            <span className="text-[11.5px] text-text-muted">
              · {DP.category.name}
            </span>
          </div>
          <h1 className="mt-3 text-[26px] font-bold tracking-[-0.02em] text-text-high md:text-[30px]">
            {subject.name}
          </h1>
          <p className="mt-2 text-[13.5px] leading-[1.7] text-text-mid">
            {DP.category.name} {subject.name} 과목 수록 {subject.questionCount}
            문항. 답을 고르면 찍은 보기에 맞춘 프리미엄 해설이 바로 떠요.
          </p>
        </header>

        <div className="mt-6">
          <ThreeDPStartButton ids={ids} label={`${subject.name} 풀이`}>
            <Sparks className="h-4 w-4" strokeWidth={2} />
            {subject.questionCount}문항 풀기
          </ThreeDPStartButton>
        </div>

        {/* 수록 문제 미리보기 — 지문 + 보기 (정답/해설은 풀이에서만) */}
        <section className="mt-10">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-text-high">
            수록 문제
          </h2>
          <ol className="mt-4 space-y-3">
            {questions.map((q) => (
              <li
                key={q.id}
                className="rounded-md border border-border bg-surface p-4"
              >
                <p className="text-[14px] font-semibold leading-[1.6] text-text-high">
                  <span className="mr-1 font-mono text-text-muted">
                    {String(q.number).padStart(2, "0")}.
                  </span>
                  {q.stem}
                </p>
                <ul className="mt-2.5 space-y-1">
                  {q.choices.map((c) => (
                    <li
                      key={c.label}
                      className="text-[13px] leading-[1.5] text-text-mid"
                    >
                      <span className="mr-1 font-mono text-text-muted">
                        {c.label}
                      </span>
                      {c.text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {/* 다른 과목 — 내부 링크 */}
        <section className="mt-10">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-text-high">
            다른 과목
          </h2>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/exams/${DP_SLUG}/subjects/${s.slug}`}
                  className="group flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/30 hover:bg-surface-mute"
                >
                  <span className="text-[13.5px] font-medium text-text-high">
                    {s.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] text-text-muted">
                    {s.questionCount}문항
                    <NavArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
