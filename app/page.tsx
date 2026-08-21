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
import { HeroFlow } from "@/components/hero-flow";
import { Reveal } from "@/components/reveal";
import { AutoSlides } from "@/components/auto-slides";
import { TechFlow } from "@/components/tech-flow";
import { StudyFlow } from "@/components/study-flow";
import { PremiumExplanation } from "@/components/premium-compare";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  title:
    "PASSPOP — 세상에 없던 무료 CBT, 프리미엄 해설 | 자격증·공무원 시험 올인원",
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
    tag: "프리미엄 해설",
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
    tag: "프리미엄 해설",
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

const LANDING_SAMPLE_CARDS: ExamCard[] = LANDING_SAMPLE_SLOTS.map((grade) =>
  EXAM_CARDS.find((c) => c.grade === grade),
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
      "자격증·공무원 시험 올인원 학습 플랫폼. 무료 기출 CBT, 프리미엄 오답 해설, 망각곡선 복습, 합격 예측.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
      availability: "https://schema.org/PreOrder",
    },
    inLanguage: "ko-KR",
    featureList: [
      "무료 기출문제 CBT",
      "프리미엄 오답 해설",
      "개념 카드 즉시 학습 (교재 없이)",
      "단계별 완전 풀이",
      "망각곡선 기반 복습 (SM-2)",
      "자동 단권화 노트",
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
      <CertStripCompact />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <BrowseSection />
      </Reveal>
      <Stats />
      <Reveal>
        <Study />
      </Reveal>
      <Reveal>
        <PremiumExplanation />
      </Reveal>
      <Reveal>
        <Tech />
      </Reveal>
      <Reveal>
        <Gateway />
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
      <Reveal>
        <FinalCta />
      </Reveal>
      <Reveal>
        <Support />
      </Reveal>
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
      <div className="mx-auto max-w-3xl px-6 pb-12 pt-10 text-center md:pb-16 md:pt-20">
        {/* 등장은 CSS 애니메이션으로만 — JS 가 없어도 반드시 보인다.
            fill-mode:both 라 지연 중에도 최종 상태가 보장된다. */}
        <h1 className="animate-slide-up text-3xl font-extrabold leading-[1.18] tracking-[-0.035em] text-text-high [animation-fill-mode:both] sm:text-4xl sm:leading-[1.12] md:text-5xl">
          <span className="text-text-mid">
            <span className="text-primary">②</span> 를 고른 사람과{" "}
            <span className="text-primary">④</span> 를 고른 사람은
          </span>
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
          className="mx-auto mt-10 max-w-lg animate-slide-up text-left [animation-fill-mode:both]"
          style={{ animationDelay: "180ms" }}
        >
          <HeroFlow />
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
function CertStripCompact() {
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
              <CheckCircle
                className="h-3.5 w-3.5 text-accent"
                strokeWidth={2.5}
              />
              {t}
            </li>
          ))}
        </ul>

        {/* 24개를 전부 깔면 읽히지 않고 자리만 먹는다. 검색용 전체 목록은 /cbt 가 진다. */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border-soft pt-5">
          {CERTS.slice(0, 8).map((c) => (
            <span
              key={c.name}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-mid"
            >
              {c.name}
            </span>
          ))}
          <a
            href="/cbt"
            className="group inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-primary hover:text-primary-hover"
          >
            +{CERTS.length - 8}개 더
            <ArrowRight
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.5}
            />
          </a>
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
    <section className="mx-auto max-w-6xl px-6 pb-12 pt-14 md:pb-20 md:pt-24">
      <h2 className="max-w-lg text-3xl font-extrabold tracking-[-0.03em] text-text-high md:text-4xl">
        공부 계획,
        <br />안 짜도 돼요.
      </h2>
      <p className="mt-4 max-w-xl text-base text-text-mid">
        세 단계가 알아서 돌아가거든요.
      </p>

      {/* 세로로 쌓으면 이 구간만 화면 몇 개 분량이 된다. 한 자리에서 넘긴다. */}
      <AutoSlides
        className="mt-8 md:mt-12"
        minH="min-h-[168px] md:min-h-[136px]"
        labels={steps.map((x) => x.step)}
        slides={steps.map(({ step, title, desc }) => (
          <div key={step} className="border-t-2 border-text-high pt-5">
            <span className="text-2xs font-bold tabular-nums tracking-[0.16em] text-text-muted">
              {step}
            </span>
            <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-text-high md:text-3xl">
              {title}
            </h3>
            <p className="mt-3 max-w-xl text-base text-text-mid">{desc}</p>
          </div>
        ))}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// ALL IN ONE — 한 곳에서 되는 것들 (아이콘 그리드)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// BROWSE — Mobbin masonry 스타일 mock 기출 카드
// ─────────────────────────────────────────────────────────────
function BrowseSection() {
  return (
    <section
      id="browse"
      className="border-t border-border-soft bg-surface-mute/50"
    >
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-14 md:pb-20 md:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold tracking-[-0.025em] text-text-high md:text-3xl">
              실제 풀이 화면, 그대로.
            </h2>
            <p className="mt-3 text-base leading-[1.6] text-text-mid md:text-base">
              어느 종목을 골라도 화면은 똑같아요.
              <br />
              지문부터 즉시 채점, 해설까지 한 흐름이에요.
            </p>

            <p className="mt-4 text-2xs text-text-muted">
              등급별로 한 문제씩 넘겨가며 보여드릴게요.
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
        <AutoSlides
          className="mt-8 md:mt-12"
          minH="min-h-[340px]"
          hold={5000}
          labels={LANDING_SAMPLE_CARDS.map((c) => c.grade)}
          slides={LANDING_SAMPLE_CARDS.map((c, i) => (
            <div key={i} className="mx-auto max-w-md">
              <ExamPreviewCard exam={c} />
            </div>
          ))}
        />

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
        className={cn("absolute left-0 top-0 h-full w-[3px]", accentBar)}
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
              exam.tag === "프리미엄 해설" && "bg-accent/12 text-accent",
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
          즉시 채점 + 프리미엄 해설
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
      <div className="mx-auto max-w-6xl border-y border-border px-6 py-10 md:py-14">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {items.map((it, i) => (
            <li key={it.label}>
              <Reveal delay={i * 70}>
                <p className="text-4xl font-extrabold tabular-nums leading-none tracking-[-0.045em] text-primary md:text-5xl">
                  {it.value}
                </p>
                <p className="mt-3 text-xs font-semibold text-text-mid">
                  {it.label}
                </p>
              </Reveal>
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

// ─────────────────────────────────────────────────────────────
// FEATURES — 4분할 그리드
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Feature row + mockups
// ─────────────────────────────────────────────────────────────

// 프리미엄 오답 해설 — 풀이 카드 + AI 풍선

// 망각곡선 복습 — 일정 막대 그래프

// 합격 예측 — gauge + 신뢰구간

// 오답노트 + 북마크 — 리스트

// CBT 모의고사 — 타이머 + 과목별 성적

// 광고 없는 풀이 — Before/After 분할

// 개념 카드 — 문제에서 그 자리 펼치는 개념

// 단계별 완전 풀이 — 빠짐없는 스텝 + '이 줄 왜?'

// 자동 단권화 노트 — 내 약점만 모은 한 장 + PDF

// 과락 위험 진단 — 과목별 위험 + 맞춤 출제 처방

// ─────────────────────────────────────────────────────────────
// PREMIUM EXPLANATION — Before/After
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────
/**
 * 관문 — 상세는 각자 페이지가 진다.
 * 랜딩에 기능 10개와 AI 4종을 전부 이어 붙이면 스크롤이 끝나지 않는다.
 */
/**
 * 기술 — /ai 페이지에 흩어져 있던 네 가지를 하나로 합쳤다.
 * 셋 다 "표본이 쌓이면 값이 움직인다" 는 같은 원리라 따로 둘 이유가 없었다.
 */
/** 틀린 다음에 받는 것 — 해설·개념카드·단계별풀이·노트를 한 흐름으로 */
function Study() {
  return (
    <section className="border-y border-border-soft bg-surface-mute/50">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-24">
        <StudyFlow />
      </div>
    </section>
  );
}

function Tech() {
  return (
    <section className="border-b border-border-soft">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-24">
        <TechFlow />
      </div>
    </section>
  );
}

function Gateway() {
  return (
    <section className="border-y border-border-soft bg-surface-mute/50">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-24">
        <h2 className="max-w-xl text-3xl font-extrabold leading-[1.2] tracking-[-0.035em] text-text-high md:text-4xl">
          무료 사이트인데,
          <br />
          유료 앱보다 자세합니다.
        </h2>
        <p className="mt-4 max-w-lg text-base text-text-mid">
          푸는 것만 되는 곳은 이미 많아요. 틀린 다음에 뭘 해주는지가 다릅니다.
        </p>

        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5">
          {[
            "실전 CBT 모의고사 · 과목별 과락 체크",
            "풀이 화면에 광고 없음",
            "회원가입 없이 바로",
          ].map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-1.5 text-sm text-text-mid"
            >
              <CheckCircle
                className="h-4 w-4 shrink-0 text-primary"
                strokeWidth={2.5}
              />
              {t}
            </li>
          ))}
        </ul>

        <a
          href="/cbt"
          className="group mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover"
        >
          {CERTS.length}개 종목 전체 보기
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.5}
          />
        </a>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section
      id="faq"
      className="border-t border-border-soft bg-surface-mute/50"
    >
      <div className="mx-auto max-w-3xl px-6 py-14 md:py-24">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-[-0.025em] text-text-high md:text-3xl">
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
              <CheckCircle
                className="h-3.5 w-3.5 text-accent"
                strokeWidth={2.5}
              />
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
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
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
