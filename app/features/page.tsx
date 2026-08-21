import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "iconoir-react";
import { buildMeta } from "@/lib/seo/metadata";
import { breadcrumbLd } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { WaitlistForm } from "@/components/waitlist-form";
import { Features, PremiumExplanation } from "@/components/landing-sections";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  title: "기능 — 무료인데 유료 앱보다 자세한 이유",
  description:
    "오답 기준 해설, 개념 카드, 단계별 완전 풀이, 망각곡선 복습, 단권화 노트, 합격 예측, 과락 위험 진단까지. PASSPOP 이 제공하는 기능을 화면과 함께 정리했습니다.",
  path: "/features",
  keywords: [
    "기출 오답노트",
    "AI 오답 해설",
    "개념 카드",
    "단계별 풀이",
    "망각곡선 복습",
    "단권화 노트",
    "과락 위험",
    "합격 예측",
  ],
});

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "기능", path: "/features" },
          ]),
        ]}
      />

      <section className="border-b border-border-soft">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-20">
          <nav className="text-2xs text-text-muted" aria-label="위치">
            <Link href="/" className="hover:text-text-mid">
              홈
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-text-mid">기능</span>
          </nav>

          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.18] tracking-[-0.035em] text-text-high sm:text-4xl md:text-5xl">
            무료 사이트인데,
            <br />
            유료 앱보다 자세합니다.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-text-mid">
            푸는 것만 되는 곳은 이미 많아요. 틀린 다음에 뭘 해주는지가 다릅니다.
          </p>
        </div>
      </section>

      <Features />
      <Reveal>
        <PremiumExplanation />
      </Reveal>

      <section className="border-t border-border-soft bg-surface-mute/50">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-text-high md:text-3xl">
              열리면 알려드릴게요
            </h2>
            <div className="mt-6">
              <WaitlistForm variant="inline" source="features-page" />
            </div>
            <Link
              href="/ai"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-mid transition-colors hover:text-text-high"
            >
              이걸 어떻게 만드는지 보기
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
