import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "iconoir-react";
import { buildMeta } from "@/lib/seo/metadata";
import { breadcrumbLd, collectionPageLd } from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/seo/site";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { WaitlistForm } from "@/components/waitlist-form";
import { SEO_EXAMS, examsByGrade, openExams } from "@/lib/seo/exams";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  title: `무료 CBT 기출문제 종목 ${SEO_EXAMS.length}개 — 한국사·컴활·기사·공무원`,
  description:
    "한국사능력검정시험, 컴퓨터활용능력, 정보처리기사, 지게차운전기능사, 전기기사부터 9급·7급 공무원까지. 종목별 기출문제를 무료 CBT로 풀고 찍은 오답까지 분석받으세요.",
  path: "/cbt",
  keywords: [
    "무료 CBT",
    "CBT 기출문제",
    "기출문제 사이트",
    "자격증 기출문제 무료",
    "한국사 기출문제",
    "한능검 기출",
    "컴활 기출",
    "정처기 기출",
    "지게차 기출",
    "전기기사 기출",
    "9급 공무원 기출",
  ],
});

export default function CbtHubPage() {
  const groups = examsByGrade();
  const opened = openExams();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "CBT 종목", path: "/cbt" },
          ]),
          collectionPageLd({
            name: "무료 CBT 기출문제 종목 전체",
            path: "/cbt",
            items: SEO_EXAMS.map((e) => ({
              name: e.name,
              path:
                e.status === "open" ? `/exams/${e.slug}` : `/cbt/${e.slug}`,
            })),
          }),
        ]}
      />

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="border-b border-border-soft">
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-14 md:pb-16 md:pt-20">
          <Reveal>
            <nav className="text-2xs text-text-muted" aria-label="위치">
              <Link href="/" className="hover:text-text-mid">
                홈
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-text-mid">CBT 종목</span>
            </nav>

            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-text-high md:text-5xl">
              풀어야 할 기출,
              <br />
              <span className="text-primary">{SEO_EXAMS.length}개 종목</span>{" "}
              전부 무료로.
            </h1>
          </Reveal>

          <Reveal delay={80}>
            <p className="mt-6 max-w-2xl text-base text-text-mid">
              한국사능력검정시험·컴퓨터활용능력·정보처리기사부터
              <br className="hidden sm:block" />
              9급·7급 공무원까지. 가입 없이 풀고,
              내가 고른 선택지를 기준으로 쓰인 해설을 받아요.
            </p>
          </Reveal>

          <Reveal delay={140}>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <dt className="text-2xs font-medium uppercase tracking-[0.12em] text-text-muted">
                  수록 예정 종목
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-text-high">
                  {SEO_EXAMS.length}
                </dd>
              </div>
              <div>
                <dt className="text-2xs font-medium uppercase tracking-[0.12em] text-text-muted">
                  지금 풀 수 있는 종목
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-text-high">
                  {opened.length}
                </dd>
              </div>
              <div>
                <dt className="text-2xs font-medium uppercase tracking-[0.12em] text-text-muted">
                  응시료
                </dt>
                <dd className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-accent">
                  무료
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── 등급별 종목 ──────────────────────────────────── */}
      {groups.map((group, gi) => (
        <section
          key={group.grade}
          className={cn(
            "border-b border-border-soft",
            gi % 2 === 1 && "bg-surface-mute/30",
          )}
        >
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
            <Reveal>
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
                <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-text-high md:text-3xl">
                  {group.label}
                </h2>
                <span className="shrink-0 text-sm tabular-nums text-text-muted">
                  {group.exams.length}개 종목
                </span>
              </div>
            </Reveal>

            <ul className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {group.exams.map((exam, i) => (
                <li key={exam.slug}>
                  <Reveal delay={Math.min(i * 45, 270)}>
                    <Link
                      href={
                        exam.status === "open"
                          ? `/exams/${exam.slug}`
                          : `/cbt/${exam.slug}`
                      }
                      className="group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-text-muted"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold tracking-[-0.02em] text-text-high">
                          {exam.name}
                        </h3>
                        <span
                          className={cn(
                            "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-3xs font-bold",
                            exam.status === "open"
                              ? "bg-accent/12 text-accent"
                              : "bg-surface-mute text-text-muted",
                          )}
                        >
                          {exam.status === "open" ? "풀이 가능" : "준비 중"}
                        </span>
                      </div>

                      <p className="mt-2 flex-1 text-sm text-text-mid">
                        {exam.blurb}
                      </p>

                      {/* 별칭 — 사람들이 실제로 검색하는 말. 본문에 있어야 매칭된다. */}
                      <p className="mt-4 text-2xs text-text-muted">
                        {exam.aliases.slice(0, 3).join(" · ")}
                      </p>

                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        {exam.status === "open" ? "기출 풀어보기" : "오픈 알림 받기"}
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                          strokeWidth={2.5}
                        />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="bg-surface-mute/30">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-text-high md:text-4xl">
              찾는 종목이 없나요?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-text-mid">
              신청서에 종목을 적어주시면 그 순서대로 채울게요.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8">
              <WaitlistForm variant="full" source="cbt-hub" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
