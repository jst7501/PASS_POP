import type { Metadata } from "next";
import Script from "next/script";
import {
  Sparks,
  CheckCircle,
  Search,
  ArrowRight,
  Bell,
  Lock,
  ShieldCheck,
  MagicWand,
  Brain,
  Clock,
  Bookmark,
  GraphUp,
} from "iconoir-react";
import { buildMeta } from "@/lib/seo/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  title:
    "PASSPOP — 세상에 없던 무료 CBT, 프리미엄 AI 해설 | 자격증·공무원 시험 올인원",
  description:
    "10,000+ 기출문제, 8+ 시험 종목. 회원가입 없이 풀고, 찍은 오답까지 AI가 분석합니다. 망각곡선 복습, 합격 예측까지 — 곧 오픈, 알림 신청 중.",
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
    a: "네, 모든 기출 CBT와 AI 오답 해설이 전부 무료입니다. 회원가입조차 없이 바로 풀 수 있습니다.",
  },
  {
    q: "프리미엄 해설은 뭐가 다른가요?",
    a: "일반 해설은 정답을 알려주지만, PASSPOP 프리미엄 AI 해설은 '당신이 찍은 그 오답'을 기준으로 왜 헷갈렸는지 분석하고, 다음에 안 틀리도록 암기 후크와 추천 단원까지 제시합니다.",
  },
  {
    q: "어떤 시험을 다루나요?",
    a: "기능사·산업기사·기사·기술사·공무원(9급/7급) 등 한국산업인력공단·인사혁신처 주요 시험을 다룹니다.",
  },
  {
    q: "망각곡선 복습은 어떻게 작동하나요?",
    a: "SM-2 알고리즘으로 맞힌 문제는 간격을 늘려 재출제하고, 틀린 문제는 다음 날 다시 띄워줍니다.",
  },
  {
    q: "합격 예측은 믿을 만한가요?",
    a: "최근 풀이 기반 베이지안 추정으로 확률과 신뢰구간을 함께 제시합니다. 풀이가 3회 미만이면 '신뢰 낮음'으로 표기해 과신을 막습니다.",
  },
  {
    q: "언제 오픈하나요?",
    a: "정식 오픈은 곧 진행됩니다. 페이지 하단에서 알림 신청을 해두시면 오픈 즉시 메일로 안내드립니다.",
  },
];

const GRADES = [
  { key: "all", label: "전체", count: 12 },
  { key: "gisa", label: "기사", count: 6 },
  { key: "sangieobgisa", label: "산업기사", count: 1 },
  { key: "gineungsa", label: "기능사", count: 2 },
  { key: "gisulsa", label: "기술사", count: 1 },
  { key: "gongmuwon", label: "공무원", count: 2 },
];

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
  size?: "sm" | "md" | "lg";
};

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
    size: "md",
  },
  {
    name: "공조냉동기계기사",
    grade: "기사",
    subject: "기계열역학",
    qNumber: 12,
    year: 2024,
    round: 2,
    stem: "이상기체의 등엔트로피 과정에서 성립하지 않는 관계식은?",
    choices: ["TV^(k-1) = const", "PV^k = const", "TP^((1-k)/k) = const", "PV = nRT"],
    correctIdx: 3,
    tag: "프리미엄",
    size: "lg",
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
    size: "sm",
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
    size: "md",
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
    size: "lg",
  },
  {
    name: "건축기사",
    grade: "기사",
    subject: "건축구조",
    qNumber: 22,
    year: 2024,
    round: 1,
    stem: "철근콘크리트 보의 휨강도 설계에서 강도감소계수 φ는?",
    choices: ["0.65", "0.75", "0.85", "0.90"],
    correctIdx: 2,
    size: "sm",
  },
  {
    name: "9급 공무원 (국어)",
    grade: "공무원",
    subject: "어법",
    qNumber: 4,
    year: 2024,
    round: 1,
    stem: "다음 중 표준어로 옳은 것은?",
    choices: ["가까히", "깨끗히", "꼼꼼히", "조용이"],
    correctIdx: 2,
    tag: "오답분석",
    size: "md",
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
    size: "sm",
  },
  {
    name: "산업안전기사",
    grade: "기사",
    subject: "안전관리론",
    qNumber: 14,
    year: 2024,
    round: 1,
    stem: "하인리히의 사고 발생 비율 1:29:300에서 '300'에 해당하는 것은?",
    choices: ["중상해", "경상해", "무상해 사고", "사망"],
    correctIdx: 2,
    tag: "AI 해설",
    size: "md",
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
    size: "lg",
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
    size: "md",
  },
  {
    name: "정보처리산업기사",
    grade: "산업기사",
    subject: "프로그래밍",
    qNumber: 11,
    year: 2024,
    round: 1,
    stem: "다음 중 시간 복잡도가 O(n log n)인 정렬 알고리즘은?",
    choices: ["버블 정렬", "삽입 정렬", "병합 정렬", "선택 정렬"],
    correctIdx: 2,
    tag: "신규",
    size: "sm",
  },
];

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
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
    ],
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

      <Hero />
      <BrowseSection />
      <Stats />
      <Categories />
      <Features />
      <PremiumExplanation />
      <Faq />
      <FinalCta />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO — Mobbin 스타일: 큰 H1 + 가짜 검색바 + 카테고리 pill
// ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative border-b border-border-soft">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-12 md:px-6 md:pb-16 md:pt-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1 text-[11.5px] font-semibold text-primary">
            <Sparks className="h-3 w-3" strokeWidth={2.5} />
            COMING SOON · 베타 알림 신청 받는 중
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-[42px] font-extrabold leading-[1.05] tracking-[-0.035em] text-text-high md:text-[68px]">
            모든 자격증 기출,
            <br />
            <span className="text-text-mid">한 곳에서. </span>
            <span className="text-primary">무료로.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-[1.65] text-text-mid md:text-[17px]">
            10,000+ 기출문제 · 8+ 시험 종목 · 회원가입 없이.
            <br className="hidden md:block" />
            찍은 오답까지 AI가 분석하는 프리미엄 해설, 무료로 공개.
          </p>

          {/* 가짜 검색바 — Mobbin 스타일의 인터랙티브한 둘러보기 입구 */}
          <div className="mx-auto mt-10 max-w-xl">
            <a
              href="#browse"
              className="group flex h-14 items-center gap-3 rounded-md border border-border bg-surface px-4 text-left shadow-sm transition-all hover:border-text-mid hover:shadow-md"
            >
              <Search
                className="h-4 w-4 shrink-0 text-text-muted"
                strokeWidth={2}
              />
              <span className="flex-1 truncate text-[14px] text-text-muted">
                토목기사, 정보처리기사, 9급 공무원…
              </span>
              <span className="hidden items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 font-mono text-[10.5px] font-semibold text-text-muted group-hover:text-text-mid md:inline-flex">
                ⌘ K
              </span>
            </a>

            <ul className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {GRADES.map((g) => (
                <li key={g.key}>
                  <a
                    href={`#browse`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                      g.key === "all"
                        ? "border-text-high bg-text-high text-background"
                        : "border-border bg-surface text-text-mid hover:border-text-mid hover:text-text-high",
                    )}
                  >
                    {g.label}
                    <span className="text-[10.5px] tabular-nums opacity-60">
                      {g.count}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-text-mid">
            <li className="inline-flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
              회원가입 불필요
            </li>
            <li className="inline-flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
              전 종목 완전 무료
            </li>
            <li className="inline-flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
              AI 해설 무제한
            </li>
            <li className="inline-flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
              광고 없는 학습
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// BROWSE — Mobbin masonry 스타일 mock 기출 카드
// ─────────────────────────────────────────────────────────────
function BrowseSection() {
  return (
    <section id="browse" className="border-b border-border-soft">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              둘러보기 · 미리보기
            </p>
            <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.025em] text-text-high md:text-[36px]">
              실제 풀이 화면, 그대로.
            </h2>
            <p className="mt-2 max-w-xl text-[14px] text-text-mid">
              오픈 시 모든 종목에서 동일한 인터페이스. 지문, 선지, 즉시 채점,
              AI 해설까지.
            </p>
          </div>

          <div className="hidden items-center gap-1.5 md:flex">
            <FilterPill active>전체</FilterPill>
            <FilterPill>기사</FilterPill>
            <FilterPill>산업기사</FilterPill>
            <FilterPill>기능사</FilterPill>
            <FilterPill>공무원</FilterPill>
            <FilterPill>기술사</FilterPill>
          </div>
        </div>

        {/* Masonry 느낌의 grid - CSS columns */}
        <div className="mt-10 [column-fill:_balance] columns-1 gap-3 sm:columns-2 lg:columns-3">
          {EXAM_CARDS.map((c, i) => (
            <div key={i} className="mb-3 break-inside-avoid">
              <ExamPreviewCard exam={c} />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary-hover"
          >
            전체 시험 종목 보기 (오픈 시)
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </section>
  );
}

function FilterPill({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-text-high bg-text-high text-background"
          : "border-border bg-surface text-text-mid hover:border-text-mid hover:text-text-high",
      )}
    >
      {children}
    </button>
  );
}

function ExamPreviewCard({ exam }: { exam: ExamCard }) {
  const choiceLabels = ["①", "②", "③", "④"];
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-md border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-text-mid hover:shadow-sm",
        // 사이즈별 패딩 조절로 mosaic 효과
        exam.size === "lg" ? "p-5" : exam.size === "sm" ? "p-4" : "p-4.5",
      )}
    >
      {/* Hover 시 종목명 floating */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        <span className="inline-flex items-center gap-1 rounded-sm bg-text-high px-1.5 py-0.5 text-[10px] font-bold text-background shadow-sm">
          <ArrowRight className="h-2.5 w-2.5" strokeWidth={2.5} />
          {exam.name}
        </span>
      </div>

      {/* 헤더 — 종목명 + 메타 */}
      <header className="flex items-center justify-between gap-2 border-b border-border-soft pb-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-primary">
            {exam.grade}
          </span>
          <span className="truncate text-[11.5px] font-semibold text-text-high">
            {exam.name}
          </span>
        </div>
        {exam.tag && (
          <span
            className={cn(
              "shrink-0 rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
              exam.tag === "AI 해설" && "bg-accent/15 text-accent",
              exam.tag === "프리미엄" && "bg-primary/15 text-primary",
              exam.tag === "신규" && "bg-warning/15 text-warning",
              exam.tag === "오답분석" && "bg-accent/15 text-accent",
            )}
          >
            {exam.tag}
          </span>
        )}
      </header>

      {/* Q 번호 + 회차 */}
      <div className="mt-3 flex items-center gap-2 font-mono text-[10.5px] text-text-muted">
        <span className="font-bold text-text-mid">
          Q.{String(exam.qNumber).padStart(2, "0")}
        </span>
        <span>·</span>
        <span>{exam.subject}</span>
        <span>·</span>
        <span>
          {exam.year}-{exam.round}회
        </span>
      </div>

      {/* 지문 */}
      <p
        className={cn(
          "mt-2 font-medium leading-[1.5] text-text-high",
          exam.size === "lg"
            ? "text-[14px]"
            : exam.size === "sm"
              ? "text-[12.5px]"
              : "text-[13px]",
        )}
      >
        {exam.stem}
      </p>

      {/* 보기 */}
      <ul className="mt-3 space-y-1">
        {exam.choices.map((ch, i) => {
          const isCorrect = i === exam.correctIdx;
          return (
            <li
              key={i}
              className={cn(
                "flex items-start gap-1.5 rounded-sm px-1.5 py-1 text-[11.5px] leading-[1.45]",
                isCorrect
                  ? "bg-accent/[0.08] text-text-high"
                  : "text-text-mid",
              )}
            >
              <span
                className={cn(
                  "shrink-0 font-mono font-bold",
                  isCorrect ? "text-accent" : "text-text-muted",
                )}
              >
                {choiceLabels[i]}
              </span>
              <span className="line-clamp-2">{ch}</span>
              {isCorrect && (
                <CheckCircle
                  className="ml-auto h-3 w-3 shrink-0 text-accent"
                  strokeWidth={2.5}
                />
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// STATS — 미니멀 한 줄
// ─────────────────────────────────────────────────────────────
function Stats() {
  const items = [
    { label: "기출문제", value: "10,000+" },
    { label: "시험 종목", value: "8+" },
    { label: "수록 회차", value: "50+" },
    { label: "AI 해설 톤", value: "3종" },
    { label: "복습 알고리즘", value: "SM-2" },
  ];
  return (
    <section className="border-b border-border-soft bg-surface-mute/40">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <ul className="grid grid-cols-2 gap-y-5 md:grid-cols-5 md:gap-x-4">
          {items.map((it) => (
            <li key={it.label} className="text-center md:text-left">
              <p className="font-mono text-[24px] font-extrabold tabular-nums tracking-[-0.02em] text-text-high md:text-[28px]">
                {it.value}
              </p>
              <p className="mt-0.5 text-[11.5px] font-medium uppercase tracking-wider text-text-muted">
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
      count: 2,
    },
    {
      name: "산업기사",
      desc: "중급 기술 자격증. 전문대 졸업자 / 실무 2년.",
      examples: "위험물산업기사, 정보처리산업기사, 건설안전산업기사",
      count: 2,
    },
    {
      name: "기사",
      desc: "고급 기술 자격증. 대졸자가 주로 응시.",
      examples: "토목기사, 정보처리기사, 전기기사, 건축기사",
      count: 6,
    },
    {
      name: "기술사",
      desc: "최고급 기술 자격증. 실무 + 학식 종합.",
      examples: "토목시공기술사, 건축구조기술사",
      count: 1,
    },
    {
      name: "공무원",
      desc: "9급 / 7급 공채. 국어·영어·한국사 + 전공.",
      examples: "9급 일반행정, 7급 행정학, PSAT",
      count: 2,
    },
    {
      name: "기타",
      desc: "민간 자격 / 어학 / 기타 시험.",
      examples: "TOEIC, 한국사 능력검정, IT 자격",
      count: 0,
    },
  ];

  return (
    <section id="categories" className="border-b border-border-soft">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            시험 등급
          </p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.025em] text-text-high md:text-[36px]">
            기능사부터 공무원까지.
          </h2>
          <p className="mt-3 text-[14px] leading-[1.65] text-text-mid">
            한국산업인력공단·인사혁신처 주요 시험 전반을 다룹니다. 종목은 순차
            오픈됩니다.
          </p>
        </div>

        <ul className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.name}>
              <article className="group flex h-full flex-col rounded-md border border-border bg-surface p-5 transition-colors hover:border-text-mid">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-bold tracking-[-0.01em] text-text-high">
                    {c.name}
                  </h3>
                  <span className="font-mono text-[11px] tabular-nums text-text-muted">
                    {c.count > 0 ? `${c.count}개 종목` : "준비중"}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-[1.6] text-text-mid">
                  {c.desc}
                </p>
                <p className="mt-3 line-clamp-2 text-[11.5px] text-text-muted">
                  예: {c.examples}
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
  const items = [
    {
      Icon: MagicWand,
      title: "프리미엄 AI 오답 해설",
      desc: "정답이 아니라 '당신이 찍은 그 오답' 을 기준으로 분석합니다.",
    },
    {
      Icon: Brain,
      title: "망각곡선 복습 (SM-2)",
      desc: "맞힌 건 간격 늘려 재출제, 틀린 건 다음 날. 알고리즘이 알아서.",
    },
    {
      Icon: GraphUp,
      title: "합격 예측 + 신뢰구간",
      desc: "베이지안 추정으로 % 단위 + '신뢰 낮음' 솔직 표기.",
    },
    {
      Icon: Bookmark,
      title: "자동 오답노트 + 북마크",
      desc: "틀리는 순간 노트에 들어가고, 어려운 건 한 번에 북마크.",
    },
    {
      Icon: Clock,
      title: "실전 CBT 모의고사",
      desc: "실제 시험과 동일한 시간 제한·과락 체크 환경.",
    },
    {
      Icon: ShieldCheck,
      title: "광고 없는 풀이 화면",
      desc: "집중을 해치지 않습니다. 풀이 페이지엔 광고 일절 없음.",
    },
  ];

  return (
    <section id="features" className="border-b border-border-soft bg-surface-mute/30">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            왜 PASSPOP
          </p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.025em] text-text-high md:text-[36px]">
            무료 사이트인데,
            <br />
            유료 앱보다 자세합니다.
          </h2>
        </div>

        <ul className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <li
              key={f.title}
              className="flex flex-col rounded-md border border-border bg-surface p-5 transition-colors hover:border-text-mid"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <f.Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-[15px] font-bold tracking-[-0.01em] text-text-high">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.6] text-text-mid">
                {f.desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// PREMIUM EXPLANATION — Before/After
// ─────────────────────────────────────────────────────────────
function PremiumExplanation() {
  return (
    <section className="border-b border-border-soft">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            프리미엄 해설
          </p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.025em] text-text-high md:text-[36px]">
            정답을 알려주는 해설은 끝났습니다.
          </h2>
          <p className="mt-3 text-[14px] leading-[1.65] text-text-mid">
            PASSPOP 은 '당신이 그 오답을 왜 골랐는가' 부터 시작합니다.
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-3 lg:grid-cols-2">
          {/* Before */}
          <div className="flex flex-col rounded-md border border-border bg-surface p-5">
            <span className="w-fit rounded-sm bg-danger/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-danger">
              기존 사이트
            </span>
            <h3 className="mt-3 text-[16px] font-bold text-text-high">
              "정답은 ②번입니다."
            </h3>
            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-[1.65] text-text-mid">
              <li>▸ 공식을 외워서 대입하면 답이 나옵니다.</li>
              <li>▸ ①은 부호가 반대라 오답.</li>
              <li>▸ ③, ④는 단위가 다릅니다.</li>
            </ul>
            <p className="mt-4 text-[11.5px] italic text-text-muted">
              → 다음에 또 틀립니다. 왜 헷갈렸는지 안 알려줬으니까.
            </p>
          </div>

          {/* After */}
          <div className="relative flex flex-col overflow-hidden rounded-md border-2 border-primary/40 bg-primary/[0.03] p-5">
            <span className="w-fit rounded-sm bg-primary/20 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary">
              PASSPOP 프리미엄
            </span>
            <h3 className="mt-3 text-[16px] font-bold text-text-high">
              "②번 찍으셨네요. 이 함정 자주 걸려요."
            </h3>
            <ul className="mt-3 space-y-1.5 text-[12.5px] leading-[1.65] text-text-mid">
              <li>
                ▸{" "}
                <strong className="text-text-high">
                  ②와 ③의 차이가 부호 한 끗
                </strong>
                . 출제자가 의도적으로 헷갈리게 한 패턴.
              </li>
              <li>
                ▸ 공식 자체보다, 단위 분석을 먼저 했으면 ②가 떨어져 나갔을 거예요.
              </li>
              <li>
                ▸{" "}
                <strong className="text-accent">
                  💡 외울 후크: 부호 = 방향, 방향 헷갈리면 단위부터.
                </strong>
              </li>
              <li>
                ▸ 같은 함정 자주 나오는 단원:{" "}
                <span className="font-semibold text-text-high">
                  응용역학 · 보의 처짐
                </span>
              </li>
            </ul>
            <p className="mt-4 text-[11.5px] font-semibold text-primary">
              → 망각곡선 큐에 들어갑니다. 3일 뒤 비슷한 함정으로 한 번 더.
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
    <section id="faq" className="border-b border-border-soft bg-surface-mute/30">
      <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-24">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            자주 묻는 질문
          </p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.025em] text-text-high md:text-[36px]">
            궁금하실 만한 것들
          </h2>
        </div>

        <ul className="mt-10 divide-y divide-border-soft overflow-hidden rounded-md border border-border bg-surface">
          {FAQ.map((item) => (
            <li key={item.q}>
              <details className="group p-5">
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[14.5px] font-semibold text-text-high">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-mute text-text-mid transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[13px] leading-[1.7] text-text-mid">
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
// FINAL CTA — 곧 오픈
// ─────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section id="waitlist" className="border-b border-border-soft">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6 md:py-32">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/[0.06] px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider text-accent">
          <Sparks className="h-3 w-3" strokeWidth={2.5} />
          Coming Soon
        </span>

        <h2 className="mt-6 text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text-high md:text-[56px]">
          곧 오픈합니다.
          <br />
          <span className="text-primary">첫 풀이는 무료</span>, 영원히.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-[14px] leading-[1.65] text-text-mid md:text-[15px]">
          이메일을 남겨두시면 정식 오픈 즉시 안내드립니다. 베타 기간엔 모든
          기능이 무제한 무료입니다.
        </p>

        <form
          action="mailto:hello@passpop.app"
          method="post"
          encType="text/plain"
          className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
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
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-md bg-primary px-6 text-[14px] font-bold text-primary-fg transition-colors hover:bg-primary-hover active:scale-[0.98]"
          >
            <Bell className="h-4 w-4" strokeWidth={2.5} />
            알림 신청
          </button>
        </form>

        <ul className="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11.5px] text-text-muted">
          <li className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" strokeWidth={2} />
            스팸 없음 · 오픈 안내만 1회
          </li>
          <li className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" strokeWidth={2} />
            언제든지 수신 거부 가능
          </li>
        </ul>

        <p className="mx-auto mt-10 max-w-lg text-[11.5px] leading-[1.6] text-text-muted">
          빠른 안내가 필요하시면{" "}
          <a
            href="mailto:hello@passpop.app"
            className="font-semibold text-text-mid underline-offset-2 hover:text-text-high hover:underline"
          >
            hello@passpop.app
          </a>{" "}
          으로 연락 주세요.
        </p>
      </div>
    </section>
  );
}
