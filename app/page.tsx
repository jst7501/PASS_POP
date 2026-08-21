import type { Metadata } from "next";
import {
  ArrowRight,
  Bookmark,
  BookmarkBook,
  CheckCircle,
  Clock,
  GraphUp,
  OpenBook,
  Refresh,
  Reports,
  Sparks,
} from "iconoir-react";
import { buildMeta } from "@/lib/seo/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/json-ld";
import { WaitlistForm, WaitlistCount } from "@/components/waitlist-form";
import { SEO_EXAMS, GRADE_LABEL } from "@/lib/seo/exams";
import { HeroDemo } from "@/components/hero-demo";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  title:
    "PASSPOP — 세상에 없던 무료 CBT, 프리미엄 AI 해설 | 자격증·공무원 시험 올인원",
  description:
    "한국사·컴활·정처기부터 9급 공무원까지. 가입 없이 기출 CBT를 풀고, 내가 고른 선택지를 기준으로 쓰인 해설을 받아요. 망각곡선 복습과 합격 예측까지. 곧 열어요.",
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

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "정말 무료인가요? 결제 유도는 없나요?",
    a: "네, 기출 CBT와 오답 해설 전부 무료예요. 회원가입도 없이 바로 풀 수 있어요.",
  },
  {
    q: "프리미엄 해설은 뭐가 다른가요?",
    a: "보통 해설은 정답 하나를 설명해요. PASSPOP은 내가 고른 그 선택지를 기준으로 왜 헷갈렸는지 짚고, 다음에 안 틀리게 외울 후크와 볼 단원까지 알려줘요.",
  },
  {
    q: "교재 없이 PASSPOP만으로 공부해도 되나요?",
    a: "그걸 목표로 만들고 있어요. 틀린 문제에서 바로 개념 카드를 펼쳐 공식과 함정까지 보고, 풀이는 건너뛰는 단계 없이 보여줘요. 핵심 개념 해설은 검수를 거치고, 검수 전 생성분은 따로 표시해요.",
  },
  {
    q: "어떤 시험을 다루나요?",
    a: "기능사·산업기사·기사·기술사와 9급·7급 공무원을 다뤄요. 한국사능력검정시험과 컴퓨터활용능력도 준비하고 있어요.",
  },
  {
    q: "망각곡선 복습은 어떻게 작동하나요?",
    a: "SM-2 알고리즘을 써요. 맞힌 문제는 간격을 늘려서 다시 내고, 틀린 문제는 다음 날 또 띄워줘요.",
  },
  {
    q: "합격 예측은 믿을 만한가요?",
    a: "최근 풀이를 바탕으로 확률과 신뢰구간을 같이 보여줘요. 푼 횟수가 3회보다 적으면 '신뢰 낮음'이라고 적어둬요. 과신하면 오히려 손해라서요.",
  },
  {
    q: "언제 오픈하나요?",
    a: "곧 열어요. 아래에서 알림 신청을 해두시면 열리는 날 메일로 알려드려요.",
  },
];

/** 종목 목록의 단일 원본은 lib/seo/exams.ts — 여기서 다시 적지 않는다. */
const CERTS = SEO_EXAMS.map((e) => ({
  name: e.name,
  grade: GRADE_LABEL[e.grade],
}));

const GRADE_ORDER = [
  "기능사",
  "산업기사",
  "기사",
  "기술사",
  "공무원",
  "기타",
] as const;

/** 종목 수는 전부 CERTS 에서 파생한다 — 하드코딩하면 또 어긋난다. */
const certCount = (grade: string) =>
  CERTS.filter((c) => c.grade === grade).length;

type ExamCard = {
  name: string;
  grade: string;
  subject: string;
  qNumber: number;
  year: number;
  round: number;
  stem: string;
  choices: string[];
  correctIdx: number;
  tag?: string;
  /** mosaic 시각적 변주용 — 없으면 기본 */
  accent?: "primary" | "accent" | "warning" | "neutral";
};

/** 랜딩에 노출할 3장 — 기사 / 기능사 / 공무원이 하나씩 걸리게 고른다. */
const LANDING_SAMPLE_SLOTS = ["기사", "기능사", "공무원"] as const;

const EXAM_CARDS: ExamCard[] = [
  {
    name: "토목기사",
    grade: "기사",
    subject: "응용역학",
    qNumber: 7,
    year: 2024,
    round: 1,
    stem: "단순보 중앙에 집중하중 P가 작용할 때 최대 처짐 위치는?",
    choices: ["지점 A", "지점 B", "보의 중앙", "지점 A에서 L/3 떨어진 곳"],
    correctIdx: 2,
    tag: "AI 해설",
    accent: "primary",
  },
  {
    name: "공조냉동기계기사",
    grade: "기사",
    subject: "기계열역학",
    qNumber: 12,
    year: 2024,
    round: 2,
    stem: "이상기체의 등엔트로피 과정에서 성립하지 않는 관계식은?",
    choices: [
      "TV^(k-1) = const",
      "PV^k = const",
      "TP^((1-k)/k) = const",
      "PV = nRT",
    ],
    correctIdx: 3,
    tag: "프리미엄",
    accent: "primary",
  },
  {
    name: "정보처리기사",
    grade: "기사",
    subject: "데이터베이스",
    qNumber: 3,
    year: 2024,
    round: 1,
    stem: "관계형 데이터베이스에서 정규화의 주된 목적은?",
    choices: ["성능 향상", "중복 제거", "보안 강화", "복구 단순화"],
    correctIdx: 1,
    accent: "accent",
  },
  {
    name: "3D프린터운용기능사",
    grade: "기능사",
    subject: "3D 모델링",
    qNumber: 18,
    year: 2024,
    round: 3,
    stem: "FDM 방식 3D 프린터에서 서포트가 필요한 출력 각도는 일반적으로?",
    choices: ["0~15°", "15~45°", "45~60° 이상", "각도 무관"],
    correctIdx: 2,
    tag: "신규",
    accent: "warning",
  },
  {
    name: "전기기사",
    grade: "기사",
    subject: "전기자기학",
    qNumber: 5,
    year: 2024,
    round: 2,
    stem: "정전계에서 전기력선의 성질로 옳지 않은 것은?",
    choices: [
      "전위가 높은 곳에서 낮은 곳으로 향한다",
      "도체 표면에서는 수직으로 출입한다",
      "전기력선은 서로 교차한다",
      "전하가 없는 곳에서는 연속이다",
    ],
    correctIdx: 2,
    accent: "neutral",
  },
  {
    name: "건축기사",
    grade: "기사",
    subject: "건축구조",
    qNumber: 22,
    year: 2024,
    round: 1,
    stem: "철근콘크리트 보의 휨강도 설계에서 강도감소계수 φ 는?",
    choices: ["0.65", "0.75", "0.85", "0.90"],
    correctIdx: 2,
    accent: "neutral",
  },
  {
    name: "9급 공무원 (국어)",
    grade: "공무원",
    subject: "어법",
    qNumber: 4,
    year: 2024,
    round: 1,
    stem: "다음 중 표준어 표기로 옳은 것은?",
    choices: ["가까히", "깨끗히", "꼼꼼히", "조용이"],
    correctIdx: 2,
    tag: "오답분석",
    accent: "accent",
  },
  {
    name: "위험물산업기사",
    grade: "산업기사",
    subject: "위험물의 성질",
    qNumber: 9,
    year: 2024,
    round: 2,
    stem: "제4류 위험물 중 인화점이 가장 낮은 것은?",
    choices: ["휘발유", "등유", "경유", "중유"],
    correctIdx: 0,
    accent: "primary",
  },
  {
    name: "산업안전기사",
    grade: "기사",
    subject: "안전관리론",
    qNumber: 14,
    year: 2024,
    round: 1,
    stem: "하인리히 사고 발생 비율 1:29:300 에서 '300' 에 해당하는 것은?",
    choices: ["중상해", "경상해", "무상해 사고", "사망"],
    correctIdx: 2,
    tag: "AI 해설",
    accent: "accent",
  },
  {
    name: "토목기술사",
    grade: "기술사",
    subject: "토질역학",
    qNumber: 1,
    year: 2024,
    round: 1,
    stem: "흙의 다짐도에 영향을 주는 요인이 아닌 것은?",
    choices: ["함수비", "다짐 에너지", "지하수위", "흙의 종류"],
    correctIdx: 2,
    accent: "neutral",
  },
  {
    name: "7급 공무원 (행정학)",
    grade: "공무원",
    subject: "정책론",
    qNumber: 8,
    year: 2024,
    round: 1,
    stem: "정책 의제설정의 주도자 유형 중 외부주도형의 특징으로 옳은 것은?",
    choices: [
      "정부 내부에서 발의된다",
      "사회 운동에 의해 형성된다",
      "전문가 집단이 주도한다",
      "정치 엘리트가 독점한다",
    ],
    correctIdx: 1,
    accent: "primary",
  },
  {
    name: "정보처리산업기사",
    grade: "산업기사",
    subject: "프로그래밍",
    qNumber: 11,
    year: 2024,
    round: 1,
    stem: "다음 중 시간 복잡도가 O(n log n) 인 정렬 알고리즘은?",
    choices: ["버블 정렬", "삽입 정렬", "병합 정렬", "선택 정렬"],
    correctIdx: 2,
    tag: "신규",
    accent: "warning",
  },
];

const LANDING_SAMPLE_CARDS: ExamCard[] = LANDING_SAMPLE_SLOTS.map(
  (grade) => EXAM_CARDS.find((c) => c.grade === grade),
).filter((c): c is ExamCard => Boolean(c));

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
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
    inLanguage: "ko-KR",
    featureList: [
      "무료 기출문제 CBT",
      "프리미엄 AI 오답 해설",
      "개념 카드 즉시 학습 (교재 없이)",
      "단계별 완전 풀이",
      "망각곡선 기반 복습 (SM-2)",
      "AI 자동 단권화 노트",
      "합격 예측 (베이지안)",
      "과락 위험 진단 및 맞춤 출제",
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
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
    ],
  };

  return (
    <>
      <JsonLd data={[softwareLd, faqLd, breadcrumbLd]} />

      <Hero />
      <CertStrip />
      <HowItWorks />
      <AllInOne />
      <BrowseSection />
      <Stats />
      <Features />
      <PremiumExplanation />
      <AiTech />
      <Categories />
      <Faq />
      <FinalCta />
      <Support />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO — Mobbin 스타일: 큰 H1 + 가짜 검색바 + 카테고리 pill
// ─────────────────────────────────────────────────────────────
/**
 * 히어로.
 *
 * 왜 "모든 자격증 기출, 한 곳에서" 같은 문장을 안 쓰나:
 *   그 문장은 CBT 사이트면 어디든 쓸 수 있어서 경쟁사 페이지에 그대로 붙여도
 *   티가 안 난다. 실제로 allcbt.co.kr 상단이 "기출문제, 똑똑하게" + 같은 구조다.
 *   수록량으로 겨루면 이미 8만 문항을 가진 쪽이 이긴다.
 *
 * 그래서 이 제품에만 있는 것 하나로 좁혔다 — 선택지마다 해설이 따로 있다는 것.
 * 그건 글로 주장하면 전달이 안 되고 정지된 목업으로도 안 되므로,
 * 히어로에서 직접 눌러보게 했다.
 */
function Hero() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center md:pt-24">
        {/* 등장은 CSS 애니메이션으로만 — JS 가 없어도 반드시 보인다.
            fill-mode:both 라 지연 중에도 최종 상태가 보장된다. */}
        <h1 className="animate-slide-up text-4xl font-extrabold leading-[1.1] tracking-[-0.04em] text-text-high [animation-fill-mode:both] md:text-5xl">
          <span className="text-primary">②</span> 를 고른 사람과{" "}
          <span className="text-primary">④</span> 를 고른 사람은
          <br />
          다른 해설을 받아요.
        </h1>

        <p
          className="mx-auto mt-6 max-w-xl animate-slide-up text-base text-text-mid [animation-fill-mode:both]"
          style={{ animationDelay: "90ms" }}
        >
          기출 CBT 는 이미 여러 곳에 있어요. 우리가 다른 건 해설이에요.
        </p>

        {/* 직접 풀어보는 문항 — 이 제품의 차이를 말로 설명하는 대신 만지게 한다 */}
        <div
          className="mx-auto mt-12 max-w-lg animate-slide-up text-left [animation-fill-mode:both]"
          style={{ animationDelay: "180ms" }}
        >
          <HeroDemo />
        </div>

        <div
          className="mx-auto mt-12 max-w-md animate-slide-up [animation-fill-mode:both]"
          style={{ animationDelay: "270ms" }}
        >
          <WaitlistForm variant="inline" source="landing-hero" />
          <div className="mt-4 flex flex-col items-center gap-2">
            <WaitlistCount />
            <a
              href="/cbt"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-mid transition-colors hover:text-text-high"
            >
              어떤 종목이 열리는지 볼래요
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.5}
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}






// ─────────────────────────────────────────────────────────────
// CERT STRIP — 지원 종목 무한 스트립
// ─────────────────────────────────────────────────────────────
function CertStrip() {
  return (
    <section
      className="border-y border-border-soft"
      aria-label="수록 예정 종목"
    >
      <div className="mx-auto max-w-6xl px-6 py-7">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-mid lg:justify-start">
          {[
            "회원가입 불필요",
            "전 종목 무료",
            "해설 무제한",
            "풀이 화면에 광고 없음",
          ].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-soft pt-5">
          <span className="mr-1 text-2xs font-semibold text-text-muted">
            순차 오픈 {CERTS.length}종목
          </span>
          {CERTS.map((c) => (
            <span
              key={c.name}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-mid"
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────
// HOW IT WORKS — 3 스텝
// ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "그냥 풀어요",
      desc: "가입도 결제도 앱 설치도 없어요. 종목만 고르면 바로 시작해요.",
    },
    {
      step: "02",
      title: "틀린 이유를 받아요",
      desc: "정답만 알려주고 끝내지 않아요. 내가 고른 선택지를 기준으로 왜 걸렸는지 짚어줘요.",
    },
    {
      step: "03",
      title: "잊을 때쯤 다시 만나요",
      desc: "SM-2 가 복습 시점을 계산해서 다시 띄워요. 맞히면 간격이 벌어지고, 틀리면 내일 또 나와요.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-20 md:pt-24">
      <h2 className="max-w-lg text-3xl font-extrabold tracking-[-0.03em] text-text-high md:text-4xl">
        공부 계획,
        <br />
        안 짜도 돼요.
      </h2>
      <p className="mt-4 max-w-xl text-base text-text-mid">
        세 단계가 알아서 돌아가거든요.
      </p>

      <ol className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
        {steps.map(({ step, title, desc }) => (
          <li key={step} className="border-t-2 border-text-high pt-5">
            <span className="text-2xs font-bold tabular-nums tracking-[0.16em] text-text-muted">
              {step}
            </span>
            <h3 className="mt-3 text-xl font-bold tracking-[-0.02em] text-text-high">
              {title}
            </h3>
            <p className="mt-3 text-sm text-text-mid">{desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────
// ALL IN ONE — 한 곳에서 되는 것들 (아이콘 그리드)
// ─────────────────────────────────────────────────────────────
/**
 * 올인원 — 이 페이지에서 아이콘 카드 그리드를 쓰는 유일한 곳.
 * (같은 카드 패턴이 섹션마다 반복되면 그때부터 템플릿처럼 보인다)
 */
function AllInOne() {
  const items = [
    {
      Icon: Reports,
      title: "기출 CBT",
      desc: "회차별 · 과목별 · 랜덤 출제를 실제 시험장과 같은 화면에서 풀어요.",
    },
    {
      Icon: OpenBook,
      title: "선택지별 해설",
      desc: "내가 고른 선택지를 기준으로, 왜 거기 끌렸는지부터 설명해요.",
    },
    {
      Icon: Bookmark,
      title: "개념 카드",
      desc: "막힌 자리에서 교재 안 펴고 그 개념만 바로 펼쳐 봐요.",
    },
    {
      Icon: Refresh,
      title: "망각곡선 복습",
      desc: "SM-2 가 계산한 날짜에 자동으로 다시 나와요.",
    },
    {
      Icon: GraphUp,
      title: "합격 예측",
      desc: "확률과 신뢰구간을 같이 내요. 표본이 적으면 적다고 말해요.",
    },
    {
      Icon: BookmarkBook,
      title: "단권화 노트",
      desc: "틀린 것과 약한 개념만 모아서 시험 전날 한 장으로 만들어요.",
    },
  ];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 pb-20 md:pb-24">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] text-text-high md:text-4xl">
              앱 여러 개,
              <br />
              안 켜도 돼요.
            </h2>
            <p className="mt-4 max-w-lg text-base text-text-mid">
              문제집 · 해설강의 · 오답노트 · 복습앱을 따로 쓸 필요 없어요.
              <br className="hidden sm:block" />
              푸는 것부터 시험 전날 훑어보는 것까지 여기서 끝나요.
            </p>
          </div>
        </Reveal>

        <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ Icon, title, desc }, i) => (
            <li key={title}>
              <Reveal delay={Math.min(i * 60, 300)}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-primary">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-[-0.02em] text-text-high">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-text-mid">{desc}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}



// ─────────────────────────────────────────────────────────────
// BROWSE — Mobbin masonry 스타일 mock 기출 카드
// ─────────────────────────────────────────────────────────────
function BrowseSection() {
  return (
    <section id="browse" className="border-t border-border-soft bg-surface-mute/50">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-20 md:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-text-high md:text-4xl">
              실제 풀이 화면, 그대로.
            </h2>
            <p className="mt-3 text-base leading-[1.6] text-text-mid md:text-base">
              어느 종목을 골라도 화면은 똑같아요.
              <br />
              지문부터 즉시 채점, 해설까지 한 흐름이에요.
            </p>

            <p className="mt-4 text-2xs text-text-muted">
              아래는 그중 세 문제예요.
            </p>
          </div>

          <ul className="hidden items-center gap-x-4 gap-y-1 md:flex md:flex-wrap">
            {GRADE_ORDER.filter((g) => certCount(g) > 0).map((g) => (
              <li key={g} className="text-xs text-text-mid">
                {g}
                <span className="ml-1 tabular-nums text-text-muted">
                  {certCount(g)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 같은 형태의 카드를 12장 늘어놓아도 정보가 늘지 않는다.
            등급이 다른 세 장만 보여주고 나머지는 /cbt 로 넘긴다. */}
        <ul className="mt-8 grid auto-rows-fr gap-3 md:mt-12 md:grid-cols-3 md:gap-4">
          {LANDING_SAMPLE_CARDS.map((c, i) => (
            <li key={i}>
              <ExamPreviewCard exam={c} />
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <a
            href="/cbt"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            {CERTS.length}개 종목 전체 보기
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.5}
            />
          </a>
        </div>
      </div>
    </section>
  );
}


function ExamPreviewCard({ exam }: { exam: ExamCard }) {
  const choiceLabels = ["①", "②", "③", "④"];

  // accent → 좌측 상단 thin bar 색
  const accentBar =
    exam.accent === "primary"
      ? "bg-primary"
      : exam.accent === "accent"
        ? "bg-accent"
        : exam.accent === "warning"
          ? "bg-warning"
          : "bg-text-mid/40";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface p-6 transition-all duration-200 hover:border-text-mid hover:shadow-[0_8px_24px_-12px_rgb(var(--text-high)/0.12)]">
      {/* 좌측 thin accent bar */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0 h-full w-[3px]",
          accentBar,
        )}
      />

      {/* 헤더 — 등급 뱃지 + 종목명 + 태그 */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="inline-flex w-fit items-center rounded-full bg-surface-mute px-2 py-0.5 font-mono text-3xs font-bold uppercase tracking-[0.1em] text-text-mid">
            {exam.grade}
          </span>
          <h3 className="truncate text-base font-bold tracking-[-0.01em] text-text-high">
            {exam.name}
          </h3>
        </div>
        {exam.tag && (
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-3xs font-bold uppercase tracking-[0.08em]",
              exam.tag === "AI 해설" && "bg-accent/12 text-accent",
              exam.tag === "프리미엄" && "bg-primary/12 text-primary",
              exam.tag === "신규" && "bg-warning/15 text-warning",
              exam.tag === "오답분석" && "bg-accent/12 text-accent",
            )}
          >
            {exam.tag}
          </span>
        )}
      </header>

      {/* 메타 — Q번호 · 과목 · 회차 (inline 한 줄, nowrap) */}
      <p className="mt-5 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-3xs text-text-muted">
        <span className="font-bold text-text-mid">
          Q.{String(exam.qNumber).padStart(2, "0")}
        </span>
        <span aria-hidden="true">·</span>
        <span>{exam.subject}</span>
        <span aria-hidden="true">·</span>
        <span>
          {exam.year}년 {exam.round}회
        </span>
      </p>

      {/* 지문 */}
      <p className="mt-3 line-clamp-3 text-base font-semibold leading-[1.55] tracking-[-0.005em] text-text-high">
        {exam.stem}
      </p>

      {/* 선지 — flex inline 강제, label 과 텍스트 한 줄 묶음 */}
      <ul className="mt-5 flex flex-1 flex-col gap-1.5">
        {exam.choices.map((ch, i) => {
          const isCorrect = i === exam.correctIdx;
          return (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2.5 rounded-md border px-3 py-2 text-xs leading-[1.45] transition-colors",
                isCorrect
                  ? "border-accent/30 bg-accent/[0.05] text-text-high"
                  : "border-transparent bg-surface-mute/40 text-text-mid",
              )}
            >
              <span
                className={cn(
                  "inline-block w-3 shrink-0 text-center font-mono font-bold leading-[1.45]",
                  isCorrect ? "text-accent" : "text-text-muted",
                )}
                aria-hidden="true"
              >
                {choiceLabels[i]}
              </span>
              <span className="flex-1 break-keep">{ch}</span>
              {isCorrect && (
                <CheckCircle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100"
                  strokeWidth={2.5}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* 푸터 — hover 시 reveal */}
      <footer className="mt-5 flex items-center justify-between border-t border-border-soft pt-4 text-2xs text-text-muted">
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-accent" strokeWidth={2.5} />
          즉시 채점 + AI 해설
        </span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-text-mid opacity-0 transition-opacity group-hover:opacity-100">
          풀어보기
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </footer>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// STATS — 미니멀 한 줄
// ─────────────────────────────────────────────────────────────
function Stats() {
  const items = [
    { label: "기출문제", value: "10,000+" },
    { label: "시험 종목", value: String(CERTS.length) },
    { label: "수록 회차", value: "50+" },
    { label: "복습 알고리즘", value: "SM-2" },
  ];
  return (
    <section className="bg-surface-mute/50">
      <div className="mx-auto max-w-6xl border-y border-border px-6 py-8">
        <ul className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:gap-x-6">
          {items.map((it) => (
            <li key={it.label} className="text-center md:text-left">
              <p className="text-2xl font-extrabold tabular-nums tracking-[-0.03em] text-text-high md:text-3xl">
                {it.value}
              </p>
              <p className="mt-1 text-2xs font-medium uppercase tracking-[0.12em] text-text-muted">
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
// CATEGORIES — 시험 등급별 카드 row
// ─────────────────────────────────────────────────────────────
function Categories() {
  const cats = [
    {
      name: "기능사",
      desc: "초급 기술 자격증. 입문자 친화적인 시험.",
      examples: "3D프린터운용기능사, 위험물기능사, 전기기능사",
    },
    {
      name: "산업기사",
      desc: "중급 기술 자격증. 전문대 졸업자 / 실무 2년.",
      examples: "위험물산업기사, 정보처리산업기사, 건설안전산업기사",
    },
    {
      name: "기사",
      desc: "고급 기술 자격증. 대졸자가 주로 응시.",
      examples: "토목기사, 정보처리기사, 전기기사, 건축기사",
    },
    {
      name: "기술사",
      desc: "최고급 기술 자격증. 실무 + 학식 종합.",
      examples: "토목시공기술사, 건축구조기술사",
    },
    {
      name: "공무원",
      desc: "9급 / 7급 공채. 국어·영어·한국사 + 전공.",
      examples: "9급 일반행정, 7급 행정학, PSAT",
    },
    {
      name: "기타",
      desc: "민간 자격 / 어학 / 기타 시험.",
      examples: "TOEIC, 한국사 능력검정, IT 자격",
    },
  ];

  return (
    <section id="categories">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-text-high md:text-4xl">
            기능사부터 공무원까지.
          </h2>
          <p className="mt-3 text-base leading-[1.65] text-text-mid md:text-base">
            한국산업인력공단·인사혁신처 주요 시험 전반을 다룹니다. 종목은 순차
            오픈됩니다.
          </p>
        </div>

        <ul className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.name}>
              <article className="group flex h-full flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-text-mid hover:shadow-[0_8px_24px_-12px_rgb(var(--text-high)/0.1)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold tracking-[-0.01em] text-text-high">
                    {c.name}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 font-mono text-3xs font-semibold tabular-nums",
                      certCount(c.name) > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-mute text-text-muted",
                    )}
                  >
                    {certCount(c.name) > 0 ? `${certCount(c.name)}개 종목` : "준비중"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-[1.6] text-text-mid">
                  {c.desc}
                </p>
                <p className="mt-auto pt-5 text-2xs leading-[1.55] text-text-muted">
                  <span className="font-semibold uppercase tracking-wider">
                    예시
                  </span>{" "}
                  · {c.examples}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FEATURES — 4분할 그리드
// ─────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="bg-surface-mute/50">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pb-24 md:pt-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.025em] text-text-high md:text-4xl">
            무료 사이트인데,
            <br />
            유료 앱보다 자세합니다.
          </h2>
        </div>

        <ul className="mt-12 grid auto-rows-fr gap-5 md:grid-cols-2">
          <FeatureRow
            title="프리미엄 AI 오답 해설"
            desc="내가 고른 그 선택지를 기준으로 분석해요. 왜 헷갈렸는지부터, 다음에 안 틀리게 외울 후크까지."
            tone="primary"
          >
            <AiExplanationMockup />
          </FeatureRow>

          <FeatureRow
            title="개념 카드 — 막히면 그 자리에서"
            desc="틀린 그 문제에서 바로 개념을 펼칩니다. 공식 유도부터 단골 함정까지 — 교재 펴지 않고 막힌 자리에서 학습."
            tone="primary"
          >
            <ConceptCardMockup />
          </FeatureRow>

          <FeatureRow
            title="단계별 완전 풀이"
            desc="계산 과목도 건너뛰는 단계 없이 보여줘요. 모르는 줄은 '이 줄 왜?' 를 누르면 그 한 줄만 더 자세히 풀어줘요."
            tone="accent"
          >
            <StepSolutionMockup />
          </FeatureRow>

          <FeatureRow
            title="망각곡선 복습 (SM-2)"
            desc="맞힌 건 간격 늘려 재출제, 틀린 건 다음 날. 알고리즘이 잊을 때쯤 정확히 복습을 띄워줍니다."
            tone="accent"
          >
            <ReviewScheduleMockup />
          </FeatureRow>

          <FeatureRow
            title="AI 자동 단권화 노트"
            desc="당신이 틀린 문제와 약한 개념만 모아 한 장으로. 시험 전날 단권화, AI가 자동으로 만들어 PDF까지."
            tone="primary"
          >
            <ConsolidatedNoteMockup />
          </FeatureRow>

          <FeatureRow
            title="합격 예측 + 신뢰구간"
            desc="베이지안 추정으로 합격 확률을 % 단위로. 풀이 적으면 '신뢰 낮음' 으로 솔직히 알려드립니다."
            tone="primary"
          >
            <PassPredictionMockup />
          </FeatureRow>

          <FeatureRow
            title="과락 위험 진단 → 맞춤 출제"
            desc="평균이 합격권이어도 한 과목 과락이면 떨어져요. 위험한 과목을 짚고, 그 과목만 집중하는 모의고사를 바로 내줘요."
            tone="warning"
          >
            <FailRiskMockup />
          </FeatureRow>

          <FeatureRow
            title="자동 오답노트 + 북마크"
            desc="틀리는 순간 노트에 자동 수집. 어려운 문제는 한 번에 북마크하고, 풀이별 메모도 가능."
            tone="warning"
          >
            <MistakesMockup />
          </FeatureRow>

          <FeatureRow
            title="실전 CBT 모의고사"
            desc="실제 시험과 동일한 시간 제한 · 과목별 과락 체크. 전 과목 무작위 출제."
            tone="accent"
          >
            <CbtMockMockup />
          </FeatureRow>

          <FeatureRow
            title="광고 없는 풀이 화면"
            desc="풀이와 해설 화면엔 광고가 없어요. 팝업도 배너도 안 띄워요."
            tone="neutral"
          >
            <NoAdsMockup />
          </FeatureRow>
        </ul>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Feature row + mockups
// ─────────────────────────────────────────────────────────────
function FeatureRow({
  title,
  desc,
  tone,
  children,
}: {
  title: string;
  desc: string;
  tone: "primary" | "accent" | "warning" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <li className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-text-muted">
      <div className="h-[260px] overflow-hidden border-b border-border-soft bg-surface-mute/50 p-5">
        <div className="flex h-full items-center justify-center">{children}</div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span
          aria-hidden="true"
          className={cn(
            "block h-[3px] w-8 rounded-full",
            tone === "primary" && "bg-primary",
            tone === "accent" && "bg-accent",
            tone === "warning" && "bg-warning",
            tone === "neutral" && "bg-text-muted",
          )}
        />
        <h3 className="mt-4 text-lg font-bold tracking-[-0.02em] text-text-high">
          {title}
        </h3>
        <p className="mt-2 text-sm text-text-mid">{desc}</p>
      </div>
    </li>
  );
}

// AI 오답 해설 — 풀이 카드 + AI 풍선
function AiExplanationMockup() {
  return (
    <div className="w-full max-w-[300px] space-y-2">
      {/* 문제 미니 */}
      <div className="rounded-md border border-border bg-surface px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-4xs font-bold uppercase tracking-wider text-primary">
            기사
          </span>
          <span className="font-mono text-3xs font-bold text-text-mid">
            Q.07
          </span>
          <span className="font-mono text-4xs text-text-muted">
            응용역학
          </span>
        </div>
        <div className="mt-1.5 space-y-1">
          {[
            { l: "①", t: "지점 A", state: "off" },
            { l: "②", t: "지점 B", state: "wrong" },
            { l: "③", t: "보의 중앙", state: "correct" },
            { l: "④", t: "L/3 떨어진 곳", state: "off" },
          ].map((c) => (
            <div
              key={c.l}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-3xs",
                c.state === "correct" && "bg-accent/10 text-text-high",
                c.state === "wrong" && "bg-danger/10 text-text-high",
                c.state === "off" && "text-text-mid",
              )}
            >
              <span
                className={cn(
                  "font-mono font-bold",
                  c.state === "correct" && "text-accent",
                  c.state === "wrong" && "text-danger",
                  c.state === "off" && "text-text-muted",
                )}
              >
                {c.l}
              </span>
              <span>{c.t}</span>
              {c.state === "correct" && (
                <CheckCircle
                  className="ml-auto h-2.5 w-2.5 text-accent"
                  strokeWidth={2.5}
                />
              )}
              {c.state === "wrong" && (
                <span className="ml-auto font-mono text-4xs font-semibold text-danger">
                  내 선택
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI 해설 풍선 */}
      <div className="relative rounded-md border-2 border-primary/40 bg-primary/[0.05] px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-primary-fg">
            <Sparks className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
          <span className="font-mono text-4xs font-bold uppercase tracking-wider text-primary">
            AI 해설
          </span>
        </div>
        <p className="mt-1.5 text-2xs font-semibold leading-[1.45] text-text-high">
          ②번 찍으셨네요. 부호 한 끗 차이의 함정 패턴이에요.
        </p>
        <p className="mt-1 text-3xs leading-[1.45] text-text-mid">
          외울 후크 · 부호 = 방향, 헷갈리면 단위부터.
        </p>
      </div>
    </div>
  );
}

// 망각곡선 복습 — 일정 막대 그래프
function ReviewScheduleMockup() {
  const schedule = [
    { label: "오늘", count: 12, bar: 100, today: true },
    { label: "내일", count: 3, bar: 30, today: false },
    { label: "3일 뒤", count: 7, bar: 60, today: false },
    { label: "7일 뒤", count: 5, bar: 42, today: false },
    { label: "21일 뒤", count: 2, bar: 18, today: false },
  ];
  return (
    <div className="w-full max-w-[300px] rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-soft pb-2">
        <p className="text-2xs font-bold tracking-[-0.01em] text-text-high">
          복습 일정
        </p>
        <p className="font-mono text-4xs text-text-muted">총 29문</p>
      </div>
      <ul className="mt-3 space-y-2">
        {schedule.map((s) => (
          <li
            key={s.label}
            className="flex items-center gap-2.5"
          >
            <span
              className={cn(
                "w-12 shrink-0 text-3xs font-medium",
                s.today ? "font-bold text-primary" : "text-text-mid",
              )}
            >
              {s.label}
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-surface-mute">
              <div
                className={cn(
                  "h-full rounded-sm",
                  s.today ? "bg-primary" : "bg-text-mid/40",
                )}
                style={{ width: `${s.bar}%` }}
              />
            </div>
            <span
              className={cn(
                "w-9 shrink-0 text-right font-mono text-3xs font-bold tabular-nums",
                s.today ? "text-primary" : "text-text-muted",
              )}
            >
              {s.count}문
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-border-soft pt-2 text-4xs leading-[1.45] text-text-muted">
        SM-2 알고리즘이 EaseFactor 와 interval 을 자동 계산
      </p>
    </div>
  );
}

// 합격 예측 — gauge + 신뢰구간
function PassPredictionMockup() {
  const value = 76;
  const low = 65;
  const high = 84;
  return (
    <div className="w-full max-w-[300px] rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-bold tracking-[-0.01em] text-text-high">
          합격 예측
        </p>
        <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-4xs font-bold text-accent">
          신뢰 높음
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="flex items-baseline justify-center gap-0.5">
          <span className="text-4xl font-extrabold leading-none tracking-[-0.03em] text-accent">
            {value}
          </span>
          <span className="text-base font-bold text-text-mid">%</span>
        </p>
        <p className="mt-0.5 font-mono text-4xs text-text-muted">
          12회 풀이 기준
        </p>
      </div>

      {/* 신뢰구간 bar */}
      <div className="mt-4">
        <div className="relative h-1.5 rounded-full bg-surface-mute">
          <div
            className="absolute h-full rounded-full bg-accent/40"
            style={{
              left: `${low}%`,
              width: `${high - low}%`,
            }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
            style={{ left: `${value}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-4xs tabular-nums text-text-muted">
          <span>0</span>
          <span className="font-bold text-text-mid">
            {low}~{high}% 신뢰구간
          </span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

// 오답노트 + 북마크 — 리스트
function MistakesMockup() {
  const items = [
    { q: "Q.03 정규화의 주된 목적은?", subj: "DB", bookmark: true, days: 1 },
    { q: "Q.07 단순보 최대 처짐 위치는?", subj: "응용역학", bookmark: false, days: 1 },
    { q: "Q.12 등엔트로피 관계식 아닌 것은?", subj: "열역학", bookmark: true, days: 3 },
    { q: "Q.18 FDM 서포트 각도는?", subj: "3D모델", bookmark: false, days: 7 },
  ];
  return (
    <div className="w-full max-w-[300px] rounded-md border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border-soft px-3 py-2">
        <div className="flex items-center gap-1.5">
          <p className="text-2xs font-bold text-text-high">오답 노트</p>
          <span className="rounded-sm bg-danger/15 px-1.5 py-0.5 font-mono text-4xs font-bold text-danger">
            24
          </span>
        </div>
        <Bookmark className="h-3 w-3 text-text-muted" strokeWidth={2} />
      </div>
      <ul className="divide-y divide-border-soft">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-center gap-2 px-3 py-2"
          >
            <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-danger/15 font-mono text-4xs font-bold text-danger">
              ✕
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-3xs font-semibold text-text-high">
                {it.q}
              </p>
              <p className="font-mono text-4xs text-text-muted">
                {it.subj} · {it.days}일 뒤 재출제
              </p>
            </div>
            {it.bookmark && (
              <Bookmark
                className="h-3 w-3 shrink-0 text-warning"
                strokeWidth={2.5}
                style={{ fill: "rgb(var(--warning))" }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// CBT 모의고사 — 타이머 + 과목별 성적
function CbtMockMockup() {
  const subjects = [
    { name: "응용역학", score: 78, pass: true },
    { name: "측량학", score: 32, pass: false },
    { name: "수리수문", score: 65, pass: true },
    { name: "토질역학", score: 58, pass: true },
  ];
  return (
    <div className="w-full max-w-[300px] rounded-md border border-border bg-surface shadow-sm">
      {/* 상단 타이머 바 */}
      <div className="flex items-center justify-between border-b border-border-soft bg-text-high/[0.02] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-primary" strokeWidth={2.5} />
          <span className="font-mono text-2xs font-bold tabular-nums text-text-high">
            01:23:45
          </span>
        </div>
        <span className="font-mono text-3xs text-text-muted">
          <span className="font-bold text-text-mid">68</span>/100
        </span>
      </div>

      {/* 진행 바 */}
      <div className="h-1 bg-surface-mute">
        <div
          className="h-full bg-primary"
          style={{ width: "68%" }}
        />
      </div>

      {/* 과목별 성적 */}
      <div className="p-3">
        <p className="mb-2 text-3xs font-semibold uppercase tracking-wider text-text-muted">
          과목별 (실시간)
        </p>
        <ul className="space-y-1.5">
          {subjects.map((s) => (
            <li
              key={s.name}
              className="flex items-center gap-2"
            >
              <span className="flex-1 text-3xs font-medium text-text-high">
                {s.name}
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-sm bg-surface-mute">
                <div
                  className={cn(
                    "h-full",
                    s.pass ? "bg-accent" : "bg-danger",
                  )}
                  style={{ width: `${s.score}%` }}
                />
              </div>
              <span
                className={cn(
                  "w-9 text-right font-mono text-3xs font-bold tabular-nums",
                  s.pass ? "text-accent" : "text-danger",
                )}
              >
                {s.score}
              </span>
              {!s.pass && (
                <span className="rounded-sm bg-danger/15 px-1 py-0.5 font-mono text-5xs font-bold uppercase text-danger">
                  과락
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 광고 없는 풀이 — Before/After 분할
function NoAdsMockup() {
  return (
    <div className="grid w-full max-w-[320px] grid-cols-2 gap-2">
      {/* Before: 광고 범벅 */}
      <div className="relative overflow-hidden rounded-md border border-border bg-surface shadow-sm">
        <div className="border-b border-border-soft bg-text-high/[0.03] px-2 py-1">
          <p className="text-5xs font-bold uppercase tracking-wider text-danger">
            기존 사이트
          </p>
        </div>
        <div className="space-y-1 p-2">
          <div className="flex h-5 items-center justify-center rounded-sm bg-warning/20 text-5xs font-bold text-warning">
            🚨 광고 배너
          </div>
          <div className="h-3 w-3/4 rounded-sm bg-surface-mute" />
          <div className="h-2 w-full rounded-sm bg-surface-mute" />
          <div className="flex h-6 items-center justify-center rounded-sm bg-danger/15 text-5xs font-bold text-danger">
            💸 결제 유도
          </div>
          <div className="h-2 w-2/3 rounded-sm bg-surface-mute" />
          <div className="flex h-4 items-center justify-center rounded-sm bg-warning/20 text-5xs font-bold text-warning">
            🔔 팝업
          </div>
        </div>
      </div>

      {/* After: PASSPOP */}
      <div className="relative overflow-hidden rounded-md border-2 border-primary/40 bg-surface shadow-sm">
        <div className="border-b border-border-soft bg-primary/[0.05] px-2 py-1">
          <p className="text-5xs font-bold uppercase tracking-wider text-primary">
            PASSPOP
          </p>
        </div>
        <div className="space-y-1.5 p-2">
          <div className="h-3 w-3/4 rounded-sm bg-text-high/15" />
          <div className="h-2 w-full rounded-sm bg-text-high/10" />
          <div className="h-2 w-5/6 rounded-sm bg-text-high/10" />
          <div className="mt-2 space-y-1">
            <div className="h-2 w-full rounded-sm bg-text-high/8" />
            <div className="h-2 w-full rounded-sm bg-accent/30" />
            <div className="h-2 w-full rounded-sm bg-text-high/8" />
            <div className="h-2 w-full rounded-sm bg-text-high/8" />
          </div>
          <div className="mt-2 flex items-center justify-center gap-1 rounded-sm border border-accent/30 bg-accent/10 py-1 text-5xs font-bold text-accent">
            <CheckCircle className="h-2 w-2" strokeWidth={2.5} />
            깔끔
          </div>
        </div>
      </div>
    </div>
  );
}

// 개념 카드 — 문제에서 그 자리 펼치는 개념
function ConceptCardMockup() {
  return (
    <div className="w-full max-w-[300px] space-y-2">
      {/* 문제 + 펼치기 트리거 */}
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 shadow-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="font-mono text-3xs font-bold text-text-mid">
            Q.07
          </span>
          <span className="truncate text-3xs font-semibold text-text-high">
            단순보 최대 처짐 위치는?
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-4xs font-bold text-primary">
          개념 펼치기 ▾
        </span>
      </div>

      {/* 펼쳐진 개념 카드 */}
      <div className="rounded-md border-2 border-primary/40 bg-primary/[0.04] px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-primary-fg">
            <OpenBook className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
          <span className="font-mono text-4xs font-bold uppercase tracking-wider text-primary">
            개념 · 단순보 처짐
          </span>
        </div>
        <p className="mt-1.5 text-3xs leading-[1.5] text-text-high">
          중앙 집중하중이면{" "}
          <strong className="font-bold">최대 처짐은 보의 중앙</strong>에서 발생.
        </p>
        <p className="mt-1.5 rounded-sm bg-surface px-2 py-1 text-center font-mono text-2xs font-bold text-text-high">
          δ<sub>max</sub> = PL³ / 48EI
        </p>
        <p className="mt-1.5 text-4xs leading-[1.45] text-warning">
          ⚠ 함정: 등분포하중이면 5wL⁴ / 384EI — 공식이 다름
        </p>
      </div>
    </div>
  );
}

// 단계별 완전 풀이 — 빠짐없는 스텝 + '이 줄 왜?'
function StepSolutionMockup() {
  const steps = [
    { n: "①", t: "반력 산정", v: "R_A = P/2", why: false },
    { n: "②", t: "처짐 공식 적용", v: "δ = PL³/48EI", why: true },
    { n: "③", t: "값 대입·계산", v: "δ = 2.1 mm", why: false },
  ];
  return (
    <div className="w-full max-w-[300px] rounded-md border border-border bg-surface p-3.5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-soft pb-2">
        <p className="text-2xs font-bold text-text-high">풀이 · 단계별</p>
        <span className="font-mono text-4xs text-text-muted">건너뛴 단계 0</span>
      </div>
      <ul className="mt-2.5 space-y-2">
        {steps.map((s) => (
          <li key={s.n}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xs font-bold text-accent">
                {s.n}
              </span>
              <span className="flex-1 text-3xs font-medium text-text-high">
                {s.t}
              </span>
              <span className="font-mono text-3xs text-text-mid">{s.v}</span>
            </div>
            {s.why && (
              <div className="ml-5 mt-1 flex items-start gap-1.5 rounded-sm border-l-2 border-accent/50 bg-accent/[0.06] px-2 py-1">
                <span className="shrink-0 font-mono text-4xs font-bold text-accent">
                  이 줄 왜?
                </span>
                <span className="text-4xs leading-[1.4] text-text-mid">
                  중앙하중 단순보의 표준 처짐식이라서.
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 자동 단권화 노트 — 내 약점만 모은 한 장 + PDF
function ConsolidatedNoteMockup() {
  return (
    <div className="w-full max-w-[280px] rounded-md border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border-soft px-3 py-2">
        <div className="flex items-center gap-1.5">
          <BookmarkBook className="h-3 w-3 text-primary" strokeWidth={2} />
          <p className="text-2xs font-bold text-text-high">
            나만의 단권화 노트
          </p>
        </div>
        <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-5xs font-bold uppercase text-primary">
          PDF
        </span>
      </div>
      <div className="space-y-2.5 p-3">
        <div>
          <p className="font-mono text-4xs font-bold uppercase tracking-wider text-text-muted">
            응용역학
          </p>
          <ul className="mt-1 space-y-1 text-3xs leading-[1.4] text-text-mid">
            <li className="flex items-center gap-1.5">
              <span className="text-text-muted">•</span>
              <span className="flex-1">처짐 공식 δ=PL³/48EI</span>
              <span className="shrink-0 rounded-sm bg-danger/15 px-1 font-mono text-5xs font-bold text-danger">
                내 약점
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-text-muted">•</span>
              <span>전단력·모멘트 부호 규약</span>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-4xs font-bold uppercase tracking-wider text-warning">
            측량학 · 과락 주의
          </p>
          <ul className="mt-1 space-y-1 text-3xs leading-[1.4] text-text-mid">
            <li className="flex items-center gap-1.5">
              <span className="text-text-muted">•</span>
              <span>오차론: 표준편차 ∝ √n</span>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-border-soft px-3 py-1.5 text-4xs text-text-muted">
        틀린 문제에서 12개 약점 개념 자동 수집
      </p>
    </div>
  );
}

// 과락 위험 진단 — 과목별 위험 + 맞춤 출제 처방
function FailRiskMockup() {
  const subjects = [
    { name: "측량학", risk: 68, level: "danger" as const },
    { name: "토질역학", risk: 24, level: "mid" as const },
    { name: "응용역학", risk: 6, level: "safe" as const },
  ];
  const labelOf = (s: (typeof subjects)[number]) =>
    s.level === "danger"
      ? `위험 ${s.risk}%`
      : s.level === "mid"
        ? `주의 ${s.risk}%`
        : `안전 ${s.risk}%`;
  return (
    <div className="w-full max-w-[300px] rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-bold text-text-high">과락 위험 진단</p>
        <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-4xs font-bold text-accent">
          평균은 합격권
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {subjects.map((s) => (
          <li key={s.name} className="flex items-center gap-2.5">
            <span className="w-14 shrink-0 text-3xs font-medium text-text-high">
              {s.name}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-sm bg-surface-mute">
              <div
                className={cn(
                  "h-full rounded-sm",
                  s.level === "danger" && "bg-danger",
                  s.level === "mid" && "bg-warning",
                  s.level === "safe" && "bg-accent",
                )}
                style={{ width: `${s.risk}%` }}
              />
            </div>
            <span
              className={cn(
                "w-16 shrink-0 text-right font-mono text-4xs font-bold tabular-nums",
                s.level === "danger" && "text-danger",
                s.level === "mid" && "text-warning",
                s.level === "safe" && "text-text-muted",
              )}
            >
              {labelOf(s)}
            </span>
          </li>
        ))}
      </ul>
      {/* 처방 — 약점 과목 집중 출제 */}
      <div className="mt-3 flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/[0.05] px-2.5 py-2">
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-fg">
          <Sparks className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
        <span className="flex-1 text-3xs font-semibold text-text-high">
          측량학 집중 모의고사 20문 생성
        </span>
        <ArrowRight className="h-3 w-3 shrink-0 text-primary" strokeWidth={2.5} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PREMIUM EXPLANATION — Before/After
// ─────────────────────────────────────────────────────────────
function PremiumExplanation() {
  return (
    <section className="border-t border-border-soft">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.025em] text-text-high md:text-4xl">
            정답만 알려주는 해설은
            <br />
            이제 그만.
          </h2>
          <p className="mt-3 text-base leading-[1.65] text-text-mid md:text-base">
            그 오답을 왜 골랐는지부터 시작해요.
          </p>
        </div>

        <div className="mt-12 grid auto-rows-fr items-stretch gap-4 lg:grid-cols-2">
          {/* Before */}
          <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-7">
            <span className="w-fit rounded-md bg-danger/12 px-2.5 py-1 text-3xs font-bold uppercase tracking-[0.12em] text-danger">
              기존 사이트
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-[-0.01em] text-text-high">
              "정답은 ②번입니다."
            </h3>
            <ul className="mt-4 space-y-2 text-sm leading-[1.7] text-text-mid">
              <li>▸ 공식을 외워서 대입하면 답이 나옵니다.</li>
              <li>▸ ① 은 부호가 반대라 오답.</li>
              <li>▸ ③, ④ 는 단위가 다릅니다.</li>
            </ul>
            <p className="mt-auto pt-6 text-xs italic text-text-muted">
              → 다음에 또 틀려요. 왜 헷갈렸는지는 안 알려줬으니까.
            </p>
          </div>

          {/* After */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-lg border-2 border-primary/40 bg-primary/[0.03] p-7">
            <span className="w-fit rounded-md bg-primary/20 px-2.5 py-1 text-3xs font-bold uppercase tracking-[0.12em] text-primary">
              PASSPOP 프리미엄
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-[-0.01em] text-text-high">
              "② 번 찍으셨네요. 이 함정 자주 걸려요."
            </h3>
            <ul className="mt-4 space-y-2 text-sm leading-[1.7] text-text-mid">
              <li>
                ▸{" "}
                <strong className="text-text-high">
                  ② 와 ③ 의 차이가 부호 한 끗
                </strong>
                . 출제자가 일부러 헷갈리게 만든 자리예요.
              </li>
              <li>
                ▸ 공식보다 단위부터 봤으면 ② 는 바로 떨어져 나갔을 거예요.
              </li>
              <li>
                ▸{" "}
                <strong className="text-accent">
                  외울 후크 · 부호 = 방향, 방향 헷갈리면 단위부터.
                </strong>
              </li>
              <li>
                ▸ 같은 함정 자주 나오는 단원:{" "}
                <span className="font-semibold text-text-high">
                  응용역학 · 보의 처짐
                </span>
              </li>
            </ul>
            <p className="mt-auto pt-6 text-xs font-semibold text-primary">
              → 망각곡선 큐에 들어가요. 3일 뒤에 비슷한 함정으로 한 번 더.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────
function Faq() {
  return (
    <section id="faq" className="border-t border-border-soft bg-surface-mute/50">
      <div className="mx-auto max-w-3xl px-6 py-24 md:py-28">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-text-high md:text-4xl">
            궁금하실 만한 것들
          </h2>
        </div>

        <ul className="mt-12 divide-y divide-border-soft overflow-hidden rounded-lg border border-border bg-surface">
          {FAQ.map((item) => (
            <li key={item.q}>
              <details className="group p-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold leading-[1.5] text-text-high marker:hidden">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-mute text-lg font-bold text-text-mid transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-[1.7] text-text-mid">
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
// AI TECH — 반전 톤 다크 섹션
// ─────────────────────────────────────────────────────────────
function AiTech() {
  const cards = [
    {
      title: "선택지 단위 해설 생성",
      desc: "선택지가 4개면 해설도 4개 써요. 같은 문제라도 ② 를 고른 사람과 ④ 를 고른 사람이 서로 다른 설명을 받아요.",
    },
    {
      title: "지식 상태 추정",
      desc: "정오답 기록을 문항 태그(단원·유형·난이도)에 비춰봐요. 점수 말고 무엇을 모르는지를 추정해요.",
    },
    {
      title: "SM-2 복습 스케줄러",
      desc: "문항별 난이도 계수와 반복 횟수로 다음 복습일을 계산해요. 맞히면 간격이 벌어지고, 틀리면 처음으로 돌아가요.",
    },
    {
      title: "베이지안 합격 예측",
      desc: "최근 풀이를 반영해 합격 확률과 신뢰구간을 같이 내요. 표본이 적으면 구간을 넓게, 솔직하게 보여줘요.",
    },
  ];

  return (
    <section className="bg-text-high text-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] md:text-4xl">
            이걸 사람이 다 쓸 순 없어요.
          </h2>
          <p className="mt-5 text-base leading-[1.7] text-background/70">
            기출 10,000 문제에 선택지가 4개씩이면
            &lsquo;왜 틀렸는지&rsquo; 가 4만 개 필요해요.
            <br />
            강사 한 명이 감당할 분량이 아니라서, 그걸 전부 채우는 쪽을 택했어요.
          </p>
        </div>

        <ul className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {cards.map(({ title, desc }) => (
            <li key={title} className="border-t border-background/20 pt-5">
              <h3 className="text-lg font-bold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2.5 text-sm leading-[1.7] text-background/70">
                {desc}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-14 max-w-3xl border-t border-background/15 pt-6 text-xs leading-[1.7] text-background/55">
          AI 가 쓴 해설에는 오류가 있을 수 있어요. 핵심 개념 해설은 검수를
          거치고, 검수 전 생성분은 화면에 따로 표시해요.
          <br />
          합격 예측은 참고용 추정치예요. 실제 시험 결과를 보장하지 않아요.
        </p>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────
// FINAL CTA — 사전예약
// ─────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section id="waitlist" className="bg-surface-mute/50">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <h2 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-text-high md:text-5xl">
          곧 열어요.
          <br />
          <span className="text-primary">푸는 건 계속 무료예요.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base text-text-mid">
          이메일만 남겨두면 열리는 날 바로 알려드려요.
          <br className="hidden sm:block" />
          목표 종목까지 적어주시면 그 순서대로 채울게요.
        </p>

        <div className="mt-10">
          <WaitlistForm variant="full" source="landing-final" />
        </div>

        <WaitlistCount className="mt-6" />

        <ul className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-text-mid">
          {[
            "오픈 메일 1순위 발송",
            "신청한 종목부터 기출을 채웁니다",
            "베타 기간 전 기능 무료",
          ].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-lg text-2xs leading-[1.65] text-text-muted">
          받는 건 이메일과 직접 적어주신 목표 종목·시험 시기뿐이에요.
          <br className="hidden sm:block" />
          오픈 안내 외에는 쓰지 않고, 수신 거부는 메일 맨 아래에서 한 번에 돼요.
        </p>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────
// SUPPORT — 문의 / 제보 창구
// ─────────────────────────────────────────────────────────────
function Support() {
  const channels = [
    {
      title: "일반 문의",
      desc: "무엇이든 물어보세요",
      href: "mailto:hello@passpop.app",
    },
    {
      title: "종목 요청",
      desc: "원하는 시험을 알려주세요",
      href: "mailto:hello@passpop.app?subject=%5B%EC%A2%85%EB%AA%A9%20%EC%9A%94%EC%B2%AD%5D",
    },
    {
      title: "오탈자 · 오답 제보",
      desc: "틀린 해설을 찾으셨다면",
      href: "mailto:hello@passpop.app?subject=%5B%EC%98%A4%EB%A5%98%20%EC%A0%9C%EB%B3%B4%5D",
    },
    {
      title: "자주 묻는 질문",
      desc: "먼저 확인해 보세요",
      href: "#faq",
    },
  ];

  return (
    <section className="bg-surface-mute/50">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-text-high md:text-3xl">
              막히면 그냥 물어보세요
            </h2>
            <p className="mt-3 text-sm text-text-mid">
              오픈 전이라 창구는 메일 하나예요. 대신 전부 직접 읽고 답해요.
            </p>
          </div>

          <ul className="border-t border-border">
            {channels.map(({ title, desc, href }) => (
              <li key={title} className="border-b border-border">
                <a
                  href={href}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:text-text-high"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-text-high">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {desc}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-text-high"
                    strokeWidth={2}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

