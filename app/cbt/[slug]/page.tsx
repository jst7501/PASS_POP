import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle } from "iconoir-react";
import { buildMeta } from "@/lib/seo/metadata";
import { breadcrumbLd, courseLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { WaitlistForm } from "@/components/waitlist-form";
import {
  GRADE_LABEL,
  bySlug,
  examKeywords,
  preparingExams,
  SEO_EXAMS,
} from "@/lib/seo/exams";

export const dynamic = "force-static";
export const revalidate = 3600;

/**
 * 아직 문제가 없는 종목의 안내 페이지.
 *
 * 색인 정책: noindex.
 *   내용 없는 페이지를 20여 개 색인시키면 얇은 콘텐츠로 도메인 전체가 눌린다.
 *   lib/seo/exams.ts 에서 status 를 "open" 으로 바꾸면 이 라우트는
 *   /exams/<slug> 로 넘기고, 사이트맵이 그 URL 을 대신 싣는다.
 */
export function generateStaticParams() {
  return preparingExams().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = bySlug(slug);
  if (!exam) return buildMeta({ title: "종목을 찾을 수 없습니다", index: false });

  return buildMeta({
    title: `${exam.name} 기출문제 CBT — 무료 준비 중`,
    description: `${exam.name}(${exam.aliases[0]}) 기출문제를 무료 CBT로 준비하고 있습니다. ${exam.blurb} 오픈 알림을 신청하면 이 종목부터 채웁니다.`,
    path: `/cbt/${exam.slug}`,
    keywords: examKeywords(exam),
    // 문제 데이터가 들어가기 전까지는 색인하지 않는다
    index: false,
  });
}

export default async function CbtExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exam = bySlug(slug);
  if (!exam) notFound();

  // 이미 열린 종목은 실제 풀이 페이지가 정식 URL — 중복 콘텐츠를 만들지 않는다
  if (exam.status === "open") redirect(`/exams/${exam.slug}`);

  const gradeLabel = GRADE_LABEL[exam.grade];
  const related = SEO_EXAMS.filter(
    (e) => e.grade === exam.grade && e.slug !== exam.slug,
  ).slice(0, 6);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "CBT 종목", path: "/cbt" },
            { name: exam.name, path: `/cbt/${exam.slug}` },
          ]),
          courseLd({
            name: `${exam.name} 기출문제 CBT`,
            description: exam.blurb,
            path: `/cbt/${exam.slug}`,
            gradeLabel,
          }),
        ]}
      />

      <section className="border-b border-border-soft">
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-14 md:pt-20">
          <Reveal>
            <nav className="text-2xs text-text-muted" aria-label="위치">
              <Link href="/" className="hover:text-text-mid">
                홈
              </Link>
              <span className="mx-1.5">/</span>
              <Link href="/cbt" className="hover:text-text-mid">
                CBT 종목
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-text-mid">{exam.name}</span>
            </nav>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface-mute px-2.5 py-1 text-2xs font-bold text-text-mid">
                {gradeLabel}
              </span>
              {exam.authority && (
                <span className="text-2xs text-text-muted">
                  {exam.authority} 시행
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] tracking-[-0.03em] text-text-high md:text-4xl">
              {exam.name} 기출문제,
              <br />
              <span className="text-primary">무료 CBT로 준비하고 있어요.</span>
            </h1>

            <p className="mt-5 text-base text-text-mid">{exam.blurb}</p>

            {/* 별칭 노출 — 검색어와 본문이 맞물리게 */}
            <p className="mt-3 text-sm text-text-muted">
              {[exam.name, ...exam.aliases].join(" · ")}
            </p>
          </Reveal>

          <Reveal delay={90}>
            <div className="mt-10 rounded-lg border border-border bg-surface p-6">
              <p className="text-sm font-bold text-text-high">
                열리면 이렇게 풀어요
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  "회차별 · 과목별 · 랜덤 기출을 실제 CBT 와 같은 화면에서",
                  "내가 고른 선택지를 기준으로 쓰인 해설",
                  "틀린 문제는 SM-2 가 계산한 날짜에 자동으로 다시",
                  "과목별 과락 위험 진단과 약점 과목 집중 모의고사",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-text-mid">
                    <CheckCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      strokeWidth={2.5}
                    />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="mt-10 text-center">
              <p className="text-base font-bold text-text-high">
                {exam.name} 부터 채울까요?
              </p>
              <p className="mt-2 text-sm text-text-mid">
                신청서에 적어주시면 그 순서대로 넣을게요.
              </p>
              <div className="mt-6">
                <WaitlistForm
                  variant="full"
                  source={`cbt-${exam.slug}`}
                  defaultCert={exam.name}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-surface-mute/30">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <Reveal>
              <h2 className="text-lg font-bold tracking-[-0.02em] text-text-high">
                같은 {gradeLabel} 종목
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={
                        r.status === "open" ? `/exams/${r.slug}` : `/cbt/${r.slug}`
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-mid transition-colors hover:border-text-muted hover:text-text-high"
                    >
                      {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/cbt"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                전체 {SEO_EXAMS.length}개 종목 보기
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
