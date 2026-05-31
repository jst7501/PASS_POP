import Link from "next/link";
import { NavArrowLeft, NavArrowRight, Timer, BookStack, Sparks } from "iconoir-react";
import { DP, DP_SLUG, dpQuestionsBySubject } from "@/lib/content/3dp";
import { breadcrumbLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ThreeDPStartButton } from "@/components/exams/threedp-start-button";

/**
 * DP 회차(필기 모의고사) 상세 — 서버 렌더(색인 가능).
 * 과목별 출제 현황 + 전체 풀이 CTA. 과목 페이지로 내부 링크.
 */
export function ThreeDPRoundPage() {
  const allIds = dpQuestionsBySubject().map((q) => q.id);
  const roundSlug = `${DP.exam.year}-${DP.exam.round}`;

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "홈", path: "/" },
          { name: "시험 종목", path: "/exams" },
          { name: DP.category.name, path: `/exams/${DP_SLUG}` },
          {
            name: `${DP.exam.year}년 ${DP.exam.round}회`,
            path: `/exams/${DP_SLUG}/rounds/${roundSlug}`,
          },
        ])}
      />
      <div className="mx-auto max-w-4xl px-4 pb-24 md:px-6">
        <nav className="pt-6 text-[13px] text-text-muted">
          <Link
            href={`/exams/${DP_SLUG}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
          >
            <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            {DP.category.name}
          </Link>
        </nav>

        <header className="mt-4 border-b border-border pb-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              기능사
            </span>
            <span className="text-[12px] text-text-muted">· 필기 모의고사</span>
          </div>
          <h1 className="mt-3 text-[32px] font-bold tracking-[-0.02em] text-text-high md:text-[40px]">
            {DP.exam.title}
          </h1>
          <p className="mt-1 font-mono text-[13px] text-text-muted">
            {roundSlug}
            {DP.exam.source && ` · ${DP.exam.source}`}
          </p>

          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-6 md:gap-10">
            <Stat Icon={Timer} label="시간" value={`${DP.exam.durationMin}분`} />
            <Stat
              Icon={BookStack}
              label="문항"
              value={`${DP.exam.totalQuestions}문제`}
            />
            <Stat
              Icon={NavArrowRight}
              label="과목"
              value={`${DP.subjects.length}개`}
            />
          </dl>

          <div className="mt-8">
            <ThreeDPStartButton ids={allIds} label="전체 모의고사">
              <Sparks className="h-4 w-4" strokeWidth={2} />
              전체 {DP.exam.totalQuestions}문항 풀기
            </ThreeDPStartButton>
          </div>
        </header>

        <section className="pt-10">
          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-text-high">
            과목별 출제 현황
          </h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {DP.subjects.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/exams/${DP_SLUG}/subjects/${s.slug}`}
                  className="group flex items-center justify-between py-4 transition-colors"
                >
                  <div className="flex min-w-0 items-baseline gap-5">
                    <span className="w-8 shrink-0 font-mono text-[12px] font-semibold tracking-wider text-text-muted">
                      {String(s.orderIdx).padStart(2, "0")}
                    </span>
                    <span className="truncate text-[15px] font-medium text-text-high group-hover:text-primary">
                      {s.name}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 font-mono text-[13px] tabular-nums text-text-mid">
                    {s.questionCount}문항
                    <NavArrowRight
                      className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5"
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

function Stat({
  Icon,
  label,
  value,
}: {
  Icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon className="h-4 w-4 text-text-muted" strokeWidth={2} />
      <dt className="mt-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-semibold text-text-high">{value}</dd>
    </div>
  );
}
