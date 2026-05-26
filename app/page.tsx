import type { Metadata } from "next";
import Script from "next/script";
import {
  Sparks,
  CheckCircle,
  Flash,
  GraphUp,
  Bell,
  Lock,
  Coins,
  LightBulb,
  BookmarkBook,
  Timer,
  Brain,
  Trophy,
  MagicWand,
  CursorPointer,
  ShieldCheck,
} from "iconoir-react";
import { buildMeta } from "@/lib/seo/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  title:
    "PASSPOP — 세상에 없던 무료 CBT, 프리미엄 AI 해설 | 자격증·공무원 시험 올인원",
  description:
    "완전 무료 기출 CBT, 찍은 오답까지 분석하는 프리미엄 AI 해설, 망각곡선 복습, 합격 예측까지. 기사·산업기사·기능사·공무원 시험을 한곳에서. 오픈 임박 — 알림 신청 받는 중.",
  path: "/",
  keywords: [
    "무료 CBT",
    "무료 기출문제",
    "프리미엄 해설",
    "AI 오답 해설",
    "AI 기출 해설",
    "찍은 오답 분석",
    "자격증 무료 사이트",
    "공무원 기출문제 사이트",
    "기사 시험 CBT",
    "산업기사 CBT",
    "기능사 CBT",
    "공무원 CBT",
    "망각곡선 복습",
    "SM-2 복습 앱",
    "합격 예측",
    "토목기사 기출",
    "공조냉동기계기사 기출",
    "3D프린터운용기능사",
    "정보처리기사 기출",
    "전기기사 기출",
    "건축기사 기출",
    "9급 공무원 기출",
    "7급 공무원 기출",
    "PASSPOP",
    "패스팝",
  ],
});

const FAQ = [
  {
    q: "정말 무료인가요? 결제 유도는 없나요?",
    a: "네, 모든 기출 CBT와 AI 오답 해설이 전부 무료입니다. 회원가입조차 없이 바로 풀 수 있습니다. 광고도 학습을 방해하지 않는 선에서만 운영됩니다.",
  },
  {
    q: "프리미엄 해설은 뭐가 다른가요?",
    a: "일반 해설은 정답을 알려주지만, PASSPOP의 프리미엄 AI 해설은 '당신이 찍은 그 오답'을 기준으로 왜 헷갈렸는지 분석하고, 다음에 안 틀리도록 암기 후크와 추천 단원까지 제시합니다.",
  },
  {
    q: "어떤 시험을 다루나요?",
    a: "기능사·산업기사·기사·기술사·공무원(9급/7급) 등 한국산업인력공단·인사혁신처 주요 시험을 다룹니다. 토목기사, 공조냉동기계기사, 3D프린터운용기능사, 정보처리기사, 전기기사 등을 우선 오픈합니다.",
  },
  {
    q: "망각곡선 복습은 어떻게 작동하나요?",
    a: "SM-2 알고리즘 기반으로, 맞힌 문제는 간격을 늘려 재출제하고 틀린 문제는 다음 날 다시 띄워줍니다. '잊을 때쯤' 정확히 복습이 들어와 장기기억으로 굳히는 방식입니다.",
  },
  {
    q: "합격 예측은 믿을 만한가요?",
    a: "최근 풀이 기록을 기반으로 베이지안 추정을 돌려 합격 확률과 신뢰구간을 함께 제시합니다. 풀이가 3회 미만이면 '신뢰 낮음'으로 표기해 과신을 막습니다.",
  },
  {
    q: "언제 오픈하나요?",
    a: "정식 오픈은 곧 진행됩니다. 페이지 하단에서 알림 신청을 해두시면 오픈 즉시 메일로 안내드립니다.",
  },
];

const SUPPORTED_EXAMS = [
  { name: "토목기사", grade: "기사", desc: "응용역학 · 측량 · 수리수문 · 철근콘크리트 · 토질 · 상하수도" },
  { name: "공조냉동기계기사", grade: "기사", desc: "기계열역학 · 냉동공학 · 공기조화 · 전기제어" },
  { name: "3D프린터운용기능사", grade: "기능사", desc: "3D 모델링 · 출력 · 후가공 · 안전" },
  { name: "정보처리기사", grade: "기사", desc: "소프트웨어 설계 · DB · 프로그래밍 · 정보시스템" },
  { name: "전기기사", grade: "기사", desc: "전기자기학 · 회로이론 · 전력공학 · 전기기기" },
  { name: "건축기사", grade: "기사", desc: "건축계획 · 시공 · 구조 · 설비 · 법규" },
  { name: "9급 공무원", grade: "공무원", desc: "국어 · 영어 · 한국사 · 행정학 · 행정법" },
  { name: "7급 공무원", grade: "공무원", desc: "PSAT · 헌법 · 행정법 · 경제학" },
];

export default function LandingPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Exam Preparation",
    operatingSystem: "Web, iOS, Android",
    url: SITE_URL,
    description:
      "자격증·공무원 시험 올인원 학습 플랫폼. 무료 기출 CBT, 프리미엄 AI 오답 해설, 망각곡선 복습, 합격 예측.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
      availability: "https://schema.org/PreOrder",
    },
    aggregateRating: undefined,
    inLanguage: "ko-KR",
    featureList: [
      "무료 기출문제 CBT",
      "프리미엄 AI 오답 해설",
      "망각곡선 기반 복습 (SM-2)",
      "합격 예측 (베이지안)",
      "오답노트 자동 생성",
      "북마크 및 메모",
      "약점 과목 자동 분석",
      "회차별·과목별·랜덤 풀이",
      "실전 CBT 모의고사",
    ],
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: SITE_URL,
      },
    ],
  };

  const courseListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PASSPOP에서 준비할 수 있는 시험",
    itemListElement: SUPPORTED_EXAMS.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: `${e.name} 기출문제 풀이`,
        description: `${e.name} (${e.grade}) — ${e.desc}`,
        provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        url: SITE_URL,
        inLanguage: "ko-KR",
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT10H",
          inLanguage: "ko-KR",
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "KRW",
          category: "Free",
        },
      },
    })),
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "PASSPOP으로 자격증·공무원 시험 공부하기",
    description:
      "회원가입 없이 무료로 기출 CBT를 풀고, AI 오답 해설로 약점을 잡고, 망각곡선 복습으로 합격까지 가는 방법.",
    inLanguage: "ko-KR",
    totalTime: "PT30M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "종목 선택",
        text: "기능사·산업기사·기사·공무원 등 준비하는 시험을 고릅니다. 회원가입·결제·인증 절차가 없습니다.",
        url: `${SITE_URL}/#how`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "기출 CBT 풀이",
        text: "연습 모드는 즉시 채점 + 실시간 해설, 실전 모드는 시간 제한·과락 체크 CBT 환경에서 풀어봅니다.",
        url: `${SITE_URL}/#how`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "AI 오답 해설 확인",
        text: "찍은 오답을 기준으로 왜 헷갈렸는지, 다음에 안 틀리는 암기 후크가 무엇인지 AI가 분석해 줍니다.",
        url: `${SITE_URL}/#features`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "망각곡선 복습 반복",
        text: "SM-2 알고리즘이 잊을 때쯤 다시 띄워줍니다. 합격 예측 % 를 보며 진척률을 확인합니다.",
        url: `${SITE_URL}/#features`,
      },
    ],
  };

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "온라인 자격증·공무원 시험 학습",
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "Republic of Korea" },
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
      availability: "https://schema.org/PreOrder",
      url: SITE_URL,
    },
  };

  return (
    <>
      <Script
        id="ld-software-application"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Script
        id="ld-breadcrumb"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id="ld-course-list"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseListLd) }}
      />
      <Script
        id="ld-how-to"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <Script
        id="ld-service"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />

      <Hero />
      <SocialProofStrip />
      <Features />
      <HowItWorks />
      <SupportedExams />
      <PremiumExplanationShowcase />
      <ComparisonTable />
      <FaqSection />
      <FinalCta />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-soft">
      {/* 배경 그라데이션 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.07] via-background to-background"
      />
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.12] blur-3xl"
      />

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-16 text-center md:px-6 md:pb-32 md:pt-24">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.08] px-3 py-1 text-[12px] font-semibold text-primary">
          <Sparks className="h-3.5 w-3.5" strokeWidth={2.5} />
          오픈 임박 — 베타 알림 신청 받는 중
        </div>

        <h1 className="mt-6 text-[40px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text-high md:text-[68px]">
          세상에 없던{" "}
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            완전 무료 CBT
          </span>
          .
          <br />
          그리고{" "}
          <span className="relative inline-block">
            <span className="relative z-10">프리미엄 해설.</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-primary/25 md:h-4"
            />
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-[16px] leading-[1.7] text-text-mid md:text-[18px]">
          기사·산업기사·기능사·공무원 시험을 한곳에서.
          <br className="hidden md:block" /> 회원가입 없이 풀고, 찍은 오답까지
          AI가 분석하고, 망각곡선이 복습 일정을 잡아줍니다.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#waitlist"
            className="inline-flex h-12 min-w-[200px] items-center justify-center gap-1.5 rounded-md bg-primary px-6 text-[15px] font-bold text-primary-fg shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/30 active:scale-[0.98]"
          >
            <Bell className="h-4 w-4" strokeWidth={2.5} />
            오픈 알림 받기
          </a>
          <a
            href="#how"
            className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-md border border-border bg-surface px-6 text-[15px] font-semibold text-text-high transition-colors hover:border-text-mid"
          >
            어떻게 다른지 보기
          </a>
        </div>

        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-text-mid">
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle
              className="h-4 w-4 text-accent"
              strokeWidth={2.5}
            />
            회원가입 불필요
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle
              className="h-4 w-4 text-accent"
              strokeWidth={2.5}
            />
            전 종목 완전 무료
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle
              className="h-4 w-4 text-accent"
              strokeWidth={2.5}
            />
            AI 오답 해설 무제한
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle
              className="h-4 w-4 text-accent"
              strokeWidth={2.5}
            />
            광고 없는 학습
          </li>
        </ul>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SOCIAL PROOF STRIP
// ─────────────────────────────────────────────────────────────
function SocialProofStrip() {
  const items = [
    { label: "지원 시험 종목", value: "8+", suffix: "개" },
    { label: "보유 기출 문항", value: "10,000+", suffix: "문" },
    { label: "AI 해설 톤", value: "3", suffix: "종" },
    { label: "복습 알고리즘", value: "SM-2", suffix: "" },
  ];
  return (
    <section className="border-b border-border-soft bg-surface/40">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((it) => (
            <li key={it.label} className="text-center">
              <p className="text-[28px] font-extrabold tracking-[-0.02em] text-text-high md:text-[32px]">
                {it.value}
                <span className="ml-0.5 text-[14px] font-semibold text-text-mid">
                  {it.suffix}
                </span>
              </p>
              <p className="mt-1 text-[12px] font-medium text-text-muted">
                {it.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      Icon: Coins,
      title: "100% 무료. 회원가입조차 없음",
      desc: "결제도, 광고로 가린 해설도 없습니다. 들어와서 바로 풀고, 바로 닫고 가도 됩니다. 쿠키 하나로 기록은 그대로 남아요.",
      tag: "FREE",
    },
    {
      Icon: MagicWand,
      title: "프리미엄 AI 오답 해설",
      desc: "정답이 아니라 '당신이 찍은 오답'을 기준으로 왜 헷갈렸는지 짚어주고, 다음에 안 틀리는 암기 후크까지 던져줍니다.",
      tag: "PRO 무료 공개",
    },
    {
      Icon: Brain,
      title: "잊을 때쯤 정확히 복습 (SM-2)",
      desc: "맞힌 문제는 간격 늘려 재출제, 틀린 문제는 다음 날. 머리 안 쓰고 알고리즘이 잡아주는 일정대로만 풀면 됩니다.",
      tag: "망각곡선",
    },
    {
      Icon: GraphUp,
      title: "합격 예측 + 신뢰구간",
      desc: "최근 풀이 기반 베이지안 추정으로 합격 확률을 % 단위로 보여줍니다. 풀이가 적으면 '신뢰 낮음' 으로 솔직히 알려드려요.",
      tag: "데이터 기반",
    },
    {
      Icon: BookmarkBook,
      title: "자동 오답노트 + 북마크",
      desc: "틀리는 순간 오답노트에 들어가고, 어려운 문제는 한 번에 북마크. 풀이 메모도 문제별로 따로 남길 수 있어요.",
      tag: "자동화",
    },
    {
      Icon: Timer,
      title: "실전 CBT 모의고사",
      desc: "실제 시험과 동일한 시간 제한·과락 체크 환경. 전 과목 무작위 출제로 진짜 실력 측정.",
      tag: "실전 모드",
    },
  ];

  return (
    <section
      id="features"
      className="border-b border-border-soft bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeader
          eyebrow="왜 PASSPOP인가"
          title={
            <>
              무료 사이트인데,
              <br className="md:hidden" /> 유료 앱보다 자세합니다.
            </>
          }
          desc="기출 PDF만 풀던 시절은 끝났습니다. 이제 풀이 하나가 데이터가 되고, 데이터가 다음 풀이를 만듭니다."
        />

        <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li
              key={f.title}
              className="group relative flex flex-col rounded-lg border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <f.Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="mt-4 inline-block w-fit rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                {f.tag}
              </span>
              <h3 className="mt-2 text-[17px] font-bold tracking-[-0.01em] text-text-high">
                {f.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-text-mid">
                {f.desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-text-high md:text-[44px]">
        {title}
      </h2>
      {desc && (
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.7] text-text-mid md:text-[16px]">
          {desc}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: "01",
      Icon: CursorPointer,
      title: "들어와서 종목 선택",
      desc: "회원가입·결제·인증 없습니다. 토목기사·정보처리기사·9급 공무원 같은 종목을 고르고 바로 시작.",
    },
    {
      n: "02",
      Icon: Flash,
      title: "풀고, 채점받고, 해설 본다",
      desc: "연습 모드는 즉시 채점 + 실시간 해설. 실전 모드는 시간 제한·과락 체크 CBT 환경.",
    },
    {
      n: "03",
      Icon: LightBulb,
      title: "찍은 오답을 AI가 분석",
      desc: "단순 정답 해설이 아닌, '당신이 왜 ②번을 골랐는지' 까지 들어가 다음에 안 틀리는 후크를 만들어줍니다.",
    },
    {
      n: "04",
      Icon: Trophy,
      title: "복습 알고리즘이 합격으로",
      desc: "SM-2가 잊을 때쯤 다시 띄우고, 합격 예측이 진척률을 % 로 보여줍니다.",
    },
  ];
  return (
    <section
      id="how"
      className="border-b border-border-soft bg-surface/40"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeader
          eyebrow="어떻게 작동하나"
          title={
            <>
              4단계면 끝.
              <br className="md:hidden" /> 머리 안 써도 됩니다.
            </>
          }
          desc="다른 사이트가 '문제를 모아두고 알아서 풀어라' 라면, PASSPOP은 알고리즘이 다음 한 문제를 골라줍니다."
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative flex flex-col rounded-lg border border-border bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] font-bold tracking-[0.14em] text-primary">
                  STEP {s.n}
                </span>
                <s.Icon
                  className="h-5 w-5 text-text-muted"
                  strokeWidth={2}
                />
              </div>
              <h3 className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-text-high">
                {s.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-text-mid">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SUPPORTED EXAMS
// ─────────────────────────────────────────────────────────────
function SupportedExams() {
  return (
    <section
      id="exams"
      className="border-b border-border-soft bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeader
          eyebrow="지원 시험"
          title={
            <>
              기능사부터 공무원까지,
              <br className="md:hidden" /> 한 사이트에서.
            </>
          }
          desc="기능사·산업기사·기사·기술사·공무원(9급/7급) 등 한국산업인력공단·인사혁신처 주요 시험을 다룹니다."
        />

        <ul className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {SUPPORTED_EXAMS.map((e) => (
            <li
              key={e.name}
              className="flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/30"
            >
              <span className="w-fit rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                {e.grade}
              </span>
              <h3 className="mt-3 text-[15px] font-bold text-text-high">
                {e.name}
              </h3>
              <p className="mt-1.5 text-[12px] leading-[1.55] text-text-muted">
                {e.desc}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary">
                <Bell className="h-3 w-3" strokeWidth={2.5} />
                오픈 즉시 풀이 가능
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-[12.5px] text-text-muted">
          이 외에도 정보처리산업기사, 산업안전기사, 위험물기능사 등 순차 추가
          예정입니다. 원하시는 종목은 알림 신청 시 함께 알려주세요.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// PREMIUM EXPLANATION SHOWCASE
// ─────────────────────────────────────────────────────────────
function PremiumExplanationShowcase() {
  return (
    <section className="border-b border-border-soft bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeader
          eyebrow="프리미엄 해설"
          title={
            <>
              정답을 알려주는 해설은
              <br className="md:hidden" /> 끝났습니다.
            </>
          }
          desc="PASSPOP은 '당신이 그 오답을 왜 골랐는가' 부터 시작합니다."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          {/* 기존 해설 */}
          <div className="flex flex-col rounded-lg border border-border bg-surface p-6">
            <span className="w-fit rounded-sm bg-danger/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-danger">
              기존 사이트
            </span>
            <h3 className="mt-3 text-[18px] font-bold tracking-[-0.01em] text-text-high">
              "정답은 ②번입니다."
            </h3>
            <div className="mt-4 space-y-2 text-[13.5px] leading-[1.7] text-text-mid">
              <p>
                ▸ 공식을 외워서 대입하면 답이 나옵니다.
              </p>
              <p>
                ▸ ①은 부호가 반대라 오답.
              </p>
              <p>
                ▸ ③, ④는 단위가 다릅니다.
              </p>
            </div>
            <p className="mt-5 text-[12px] italic text-text-muted">
              → 다음에 또 틀립니다. 왜 헷갈렸는지 아무도 안 알려줬으니까.
            </p>
          </div>

          {/* PASSPOP 해설 */}
          <div className="relative flex flex-col overflow-hidden rounded-lg border-2 border-primary/40 bg-primary/[0.03] p-6 shadow-lg shadow-primary/[0.08]">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl"
            />
            <span className="w-fit rounded-sm bg-primary/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              PASSPOP 프리미엄 해설
            </span>
            <h3 className="mt-3 text-[18px] font-bold tracking-[-0.01em] text-text-high">
              "②번 찍으셨네요. 이 함정 자주 걸려요."
            </h3>
            <div className="mt-4 space-y-2 text-[13.5px] leading-[1.7] text-text-mid">
              <p>
                ▸{" "}
                <strong className="text-text-high">
                  ②와 ③의 차이가 부호 한 끗
                </strong>
                . 출제자가 의도적으로 헷갈리게 한 패턴이에요.
              </p>
              <p>
                ▸ 공식 자체보다, 단위 분석을 먼저 했으면 ②가 떨어져 나갔을 거예요.
              </p>
              <p>
                ▸{" "}
                <strong className="text-accent">
                  💡 외울 후크: 부호 = 방향, 방향 헷갈리면 단위부터.
                </strong>
              </p>
              <p>
                ▸ 같은 함정이 자주 나오는 단원:{" "}
                <span className="font-semibold text-text-high">
                  응용역학 · 보의 처짐
                </span>{" "}
                — 약점 분석에 추가합니다.
              </p>
            </div>
            <p className="mt-5 text-[12px] font-semibold text-primary">
              → 망각곡선 큐에 들어갑니다. 3일 뒤 비슷한 함정으로 한 번 더
              물어볼게요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPARISON TABLE
// ─────────────────────────────────────────────────────────────
function ComparisonTable() {
  const rows: { feat: string; us: string | true; them: string | true | false }[] =
    [
      { feat: "전 종목 완전 무료", us: true, them: "일부만 무료" },
      { feat: "회원가입 없이 풀이", us: true, them: false },
      { feat: "찍은 오답 기준 AI 해설", us: true, them: false },
      { feat: "망각곡선 자동 복습", us: "SM-2", them: false },
      { feat: "합격 예측 + 신뢰구간", us: true, them: false },
      { feat: "약점 과목 자동 분석", us: true, them: "수동" },
      { feat: "실전 CBT 모의고사", us: true, them: true },
      { feat: "광고 없는 풀이 화면", us: true, them: false },
    ];
  return (
    <section className="border-b border-border-soft bg-background">
      <div className="mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeader
          eyebrow="비교"
          title="다른 무료 기출 사이트와 뭐가 다른가"
        />

        <div className="mt-14 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-surface">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-4 font-semibold text-text-mid md:px-6"
                >
                  기능
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-center font-bold text-primary md:px-6"
                >
                  PASSPOP
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-center font-semibold text-text-muted md:px-6"
                >
                  기존 무료 사이트
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft bg-background">
              {rows.map((r) => (
                <tr key={r.feat}>
                  <td className="px-4 py-4 font-medium text-text-high md:px-6">
                    {r.feat}
                  </td>
                  <td className="px-4 py-4 text-center md:px-6">
                    <Mark v={r.us} highlight />
                  </td>
                  <td className="px-4 py-4 text-center md:px-6">
                    <Mark v={r.them} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Mark({
  v,
  highlight,
}: {
  v: string | true | false;
  highlight?: boolean;
}) {
  if (v === true) {
    return (
      <span
        className={
          highlight
            ? "inline-flex items-center gap-1 font-bold text-accent"
            : "inline-flex items-center gap-1 text-text-mid"
        }
      >
        <CheckCircle className="h-4 w-4" strokeWidth={2.5} />
        있음
      </span>
    );
  }
  if (v === false) {
    return <span className="text-text-muted">—</span>;
  }
  return (
    <span
      className={
        highlight
          ? "font-bold text-accent"
          : "text-text-mid"
      }
    >
      {v}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────
function FaqSection() {
  return (
    <section id="faq" className="border-b border-border-soft bg-surface/40">
      <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeader eyebrow="자주 묻는 질문" title="궁금하실 만한 것들" />
        <ul className="mt-14 divide-y divide-border-soft overflow-hidden rounded-lg border border-border bg-surface">
          {FAQ.map((item) => (
            <li key={item.q}>
              <details className="group p-5 md:p-6">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-semibold text-text-high">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-mute text-text-mid transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[13.5px] leading-[1.7] text-text-mid">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FINAL CTA — "곧 오픈"
// ─────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-background"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.05] to-background"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.10] blur-3xl"
      />

      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6 md:py-32">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/[0.08] px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-accent">
          <Sparks className="h-3.5 w-3.5" strokeWidth={2.5} />
          Coming Soon
        </div>
        <h2 className="mt-6 text-[40px] font-extrabold leading-[1.15] tracking-[-0.02em] text-text-high md:text-[56px]">
          곧 오픈합니다.
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            첫 풀이는 무료
          </span>
          , 영원히.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.7] text-text-mid">
          이메일을 남겨두시면 정식 오픈 즉시 안내드립니다. 베타 기간에는 모든
          기능이 무제한 무료입니다.
        </p>

        <form
          action={`mailto:${"hello@passpop.app"}`}
          method="post"
          encType="text/plain"
          className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="waitlist-email" className="sr-only">
            오픈 알림을 받을 이메일
          </label>
          <input
            id="waitlist-email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            className="h-12 flex-1 rounded-md border border-border bg-surface px-4 text-[14px] text-text-high placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-md bg-primary px-6 text-[14px] font-bold text-primary-fg shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/30 active:scale-[0.98]"
          >
            <Bell className="h-4 w-4" strokeWidth={2.5} />
            알림 신청
          </button>
        </form>

        <ul className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-text-muted">
          <li className="inline-flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            스팸 없음 · 오픈 안내만 1회
          </li>
          <li className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
            언제든지 수신 거부 가능
          </li>
        </ul>

        <p className="mx-auto mt-12 max-w-lg text-[12px] leading-[1.7] text-text-muted">
          오픈 전까지 종목별 기출 데이터·해설 품질을 다듬고 있어요. 빠른 안내가
          필요하시면{" "}
          <a
            href="mailto:hello@passpop.app"
            className="font-semibold text-text-mid underline-offset-2 hover:text-text-high hover:underline"
          >
            hello@passpop.app
          </a>{" "}
          으로도 연락 주세요.
        </p>
      </div>
    </section>
  );
}
