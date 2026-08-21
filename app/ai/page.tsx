import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "iconoir-react";
import { buildMeta } from "@/lib/seo/metadata";
import { breadcrumbLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { WaitlistForm } from "@/components/waitlist-form";
import {
  DemoChoiceExplanations,
  DemoKnowledgeState,
  DemoPassPrediction,
  DemoReviewScheduler,
} from "@/components/demos-ai";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  title: "AI 기술 — 선택지마다 다른 해설을 쓰는 방법",
  description:
    "PASSPOP 이 해설을 쓰고, 무엇을 모르는지 추정하고, 복습일을 계산하고, 합격 확률을 내는 방식. 각 기능이 실제로 어떤 화면을 내보내는지 직접 보세요.",
  path: "/ai",
  keywords: [
    "AI 기출 해설",
    "AI 오답 분석",
    "선택지별 해설",
    "SM-2 복습",
    "망각곡선 복습 알고리즘",
    "합격 예측",
    "베이지안 합격 예측",
  ],
});

const SECTIONS = [
  {
    id: "explanation",
    kicker: "01",
    title: "선택지 단위 해설 생성",
    body: "문제당 해설 하나가 아니라, 틀릴 수 있는 선택지마다 따로 써요. 같은 문제라도 ② 를 고른 사람과 ④ 를 고른 사람이 서로 다른 설명을 받습니다.",
    demo: <DemoChoiceExplanations />,
  },
  {
    id: "knowledge",
    kicker: "02",
    title: "지식 상태 추정",
    body: "정오답 기록을 문항 태그(단원·유형·난이도)에 비춰봐요. 점수 말고 무엇을 모르는지를 추정하고, 다음 세션을 그 기준으로 구성합니다.",
    demo: <DemoKnowledgeState />,
  },
  {
    id: "review",
    kicker: "03",
    title: "SM-2 복습 스케줄러",
    body: "문항별 난이도 계수와 반복 횟수로 다음 복습일을 계산해요. 맞히면 간격이 벌어지고, 틀리면 처음으로 돌아갑니다.",
    demo: <DemoReviewScheduler />,
  },
  {
    id: "prediction",
    kicker: "04",
    title: "베이지안 합격 예측",
    body: "최근 풀이를 반영해 합격 확률과 신뢰구간을 같이 내요. 표본이 적으면 구간을 넓게, 그리고 적다고 말합니다.",
    demo: <DemoPassPrediction />,
  },
];

export default function AiPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "AI 기술", path: "/ai" },
          ]),
        ]}
      />

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <section className="bg-text-high text-background">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-24">
          <nav className="text-2xs text-background/50" aria-label="위치">
            <Link href="/" className="hover:text-background/80">
              홈
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-background/80">AI 기술</span>
          </nav>

          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.18] tracking-[-0.035em] sm:text-4xl md:text-5xl">
            이걸 사람이 다 쓸 순 없어요.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-[1.75] text-background/70">
            기출 10,000 문제에 선택지가 4개씩이면 &lsquo;왜 틀렸는지&rsquo; 가
            4만 개 필요해요. 강사 한 명이 감당할 분량이 아니라서, 그걸 전부
            채우는 쪽을 택했습니다.
          </p>
          <p className="mt-4 text-sm text-background/50">
            아래 네 가지가 각각 어떤 화면을 내보내는지 그대로 재생됩니다.
          </p>
        </div>
      </section>

      {/* ── 기능 4종 ─────────────────────────────────────── */}
      {SECTIONS.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className={i % 2 === 1 ? "bg-surface-mute/50" : undefined}
        >
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
            <Reveal>
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                  <span className="text-3xs font-bold tabular-nums tracking-[0.16em] text-primary">
                    {s.kicker}
                  </span>
                  <h2 className="mt-3 text-2xl font-extrabold leading-[1.25] tracking-[-0.03em] text-text-high md:text-3xl">
                    {s.title}
                  </h2>
                  <p className="mt-4 max-w-lg text-base text-text-mid">
                    {s.body}
                  </p>
                </div>
                <div
                  className={
                    i % 2 === 1
                      ? "lg:order-1 mx-auto w-full max-w-[440px]"
                      : "mx-auto w-full max-w-[440px]"
                  }
                >
                  {s.demo}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* ── 고지 + CTA ───────────────────────────────────── */}
      <section className="border-t border-border-soft">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
          <Reveal>
            <p className="mx-auto max-w-2xl text-xs leading-[1.8] text-text-muted">
              AI 가 쓴 해설에는 오류가 있을 수 있어요. 핵심 개념 해설은 검수를
              거치고, 검수 전 생성분은 화면에 따로 표시해요. 합격 예측은 참고용
              추정치예요 — 실제 시험 결과를 보장하지 않습니다.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="mt-10 text-2xl font-extrabold tracking-[-0.03em] text-text-high md:text-3xl">
              열리면 알려드릴게요
            </h2>
            <div className="mt-6">
              <WaitlistForm variant="inline" source="ai-page" />
            </div>
            <Link
              href="/cbt"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-mid transition-colors hover:text-text-high"
            >
              어떤 종목이 열리는지 볼래요
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.5}
              />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
