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
import { GRADE_LABEL, GRADE_ORDER, SEO_EXAMS } from "@/lib/seo/exams";
import { Reveal } from "@/components/reveal";
import {
  LiveAiExplanation,
  LiveConceptCard,
  LiveStepSolution,
} from "@/components/mockups-live";
import { cn } from "@/lib/utils";

/**
 * 랜딩과 /features 가 함께 쓰는 섹션들.
 *
 * 랜딩에 전부 이어 붙이면 스크롤이 끝나지 않아서, 기능 상세는 별도 페이지로
 * 옮기고 랜딩에는 관문만 남겼다. 두 곳이 같은 컴포넌트를 쓰므로 문구가 갈라지지 않는다.
 */

const CERTS = SEO_EXAMS.map((e) => ({
  name: e.name,
  grade: GRADE_LABEL[e.grade],
}));

const certCount = (grade: string) =>
  CERTS.filter((c) => c.grade === grade).length;

export { GRADE_ORDER };

/**
 * 올인원 — 이 페이지에서 아이콘 카드 그리드를 쓰는 유일한 곳.
 * (같은 카드 패턴이 섹션마다 반복되면 그때부터 템플릿처럼 보인다)
 */
export function AllInOne() {
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
      <div className="mx-auto max-w-6xl px-6 pb-14 md:pb-24">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold leading-[1.15] tracking-[-0.03em] text-text-high md:text-3xl">
              앱 여러 개,
              <br />안 켜도 돼요.
            </h2>
            <p className="mt-4 max-w-lg text-base text-text-mid">
              문제집 · 해설강의 · 오답노트 · 복습앱을 따로 쓸 필요 없어요.
              <br className="hidden sm:block" />
              푸는 것부터 시험 전날 훑어보는 것까지 여기서 끝나요.
            </p>
          </div>
        </Reveal>

        <ul className="mt-10 grid md:mt-14 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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

export function PremiumExplanation() {
  return (
    <section className="border-t border-border-soft">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold leading-[1.15] tracking-[-0.025em] text-text-high md:text-3xl">
            정답만 알려주는 해설은
            <br />
            이제 그만.
          </h2>
          <p className="mt-3 text-base leading-[1.65] text-text-mid md:text-base">
            그 오답을 왜 골랐는지부터 시작해요.
          </p>
        </div>

        <div className="mt-8 grid md:mt-12 auto-rows-fr items-stretch gap-4 lg:grid-cols-2">
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

export function Categories() {
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
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-[-0.025em] text-text-high md:text-3xl">
            기능사부터 공무원까지.
          </h2>
          <p className="mt-3 text-base leading-[1.65] text-text-mid md:text-base">
            한국산업인력공단·인사혁신처 주요 시험 전반을 다룹니다. 종목은 순차
            오픈됩니다.
          </p>
        </div>

        <ul className="mt-8 grid md:mt-12 auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, i) => (
            <li key={c.name}>
              <Reveal delay={Math.min(i * 50, 250)}>
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
                      {certCount(c.name) > 0
                        ? `${certCount(c.name)}개 종목`
                        : "준비중"}
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
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-surface-mute/50">
      <div className="mx-auto max-w-6xl px-6 pb-14 pt-12 md:pb-24 md:pt-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold leading-[1.15] tracking-[-0.025em] text-text-high md:text-4xl">
            무료 사이트인데,
            <br />
            유료 앱보다 자세합니다.
          </h2>
        </div>

        <ul className="mt-8 grid gap-3 md:mt-12 md:auto-rows-fr md:grid-cols-2 md:gap-5">
          <FeatureRow
            title="프리미엄 AI 오답 해설"
            desc="내가 고른 그 선택지를 기준으로 분석해요. 왜 헷갈렸는지부터, 다음에 안 틀리게 외울 후크까지."
            tone="primary"
          >
            <LiveAiExplanation />
          </FeatureRow>

          <FeatureRow
            title="개념 카드 — 막히면 그 자리에서"
            desc="틀린 그 문제에서 바로 개념을 펼칩니다. 공식 유도부터 단골 함정까지 — 교재 펴지 않고 막힌 자리에서 학습."
            tone="primary"
          >
            <LiveConceptCard />
          </FeatureRow>

          <FeatureRow
            title="단계별 완전 풀이"
            desc="계산 과목도 건너뛰는 단계 없이 보여줘요. 모르는 줄은 '이 줄 왜?' 를 누르면 그 한 줄만 더 자세히 풀어줘요."
            tone="accent"
          >
            <LiveStepSolution />
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
            foldOnMobile
            desc="당신이 틀린 문제와 약한 개념만 모아 한 장으로. 시험 전날 단권화, AI가 자동으로 만들어 PDF까지."
            tone="primary"
          >
            <ConsolidatedNoteMockup />
          </FeatureRow>

          <FeatureRow
            title="합격 예측 + 신뢰구간"
            foldOnMobile
            desc="베이지안 추정으로 합격 확률을 % 단위로. 풀이 적으면 '신뢰 낮음' 으로 솔직히 알려드립니다."
            tone="primary"
          >
            <PassPredictionMockup />
          </FeatureRow>

          <FeatureRow
            title="과락 위험 진단 → 맞춤 출제"
            foldOnMobile
            desc="평균이 합격권이어도 한 과목 과락이면 떨어져요. 위험한 과목을 짚고, 그 과목만 집중하는 모의고사를 바로 내줘요."
            tone="warning"
          >
            <FailRiskMockup />
          </FeatureRow>

          <FeatureRow
            title="자동 오답노트 + 북마크"
            foldOnMobile
            desc="틀리는 순간 노트에 자동 수집. 어려운 문제는 한 번에 북마크하고, 풀이별 메모도 가능."
            tone="warning"
          >
            <MistakesMockup />
          </FeatureRow>

          <FeatureRow
            title="실전 CBT 모의고사"
            foldOnMobile
            desc="실제 시험과 동일한 시간 제한 · 과목별 과락 체크. 전 과목 무작위 출제."
            tone="accent"
          >
            <CbtMockMockup />
          </FeatureRow>

          <FeatureRow
            title="광고 없는 풀이 화면"
            foldOnMobile
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

export function FeatureRow({
  title,
  desc,
  tone,
  children,
  /**
   * 모바일에서 목업을 접고 제목·설명만 남긴다.
   * 같은 카드 10장이 세로로 쌓이면 그 구간만 화면 몇 개 분량이 된다.
   * 앞쪽 4개는 목업을 보여주고 나머지는 목록으로 읽히게 한다.
   * (DOM 을 두 벌 만들지 않으므로 본문이 중복되지 않는다)
   */
  foldOnMobile = false,
}: {
  title: string;
  desc: string;
  tone: "primary" | "accent" | "warning" | "neutral";
  children: React.ReactNode;
  foldOnMobile?: boolean;
}) {
  return (
    <li className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-text-muted">
      <div
        className={cn(
          "h-[190px] overflow-hidden border-b border-border-soft p-4 md:h-[260px] md:p-5",
          foldOnMobile && "hidden md:block",
          tone === "primary" && "bg-primary/[0.07]",
          tone === "accent" && "bg-accent/[0.07]",
          tone === "warning" && "bg-warning/[0.08]",
          tone === "neutral" && "bg-surface-mute",
        )}
      >
        <div className="flex h-full items-center justify-center">
          {children}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col md:p-6",
          foldOnMobile ? "p-4" : "p-5",
        )}
      >
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

export function ReviewScheduleMockup() {
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
          <li key={s.label} className="flex items-center gap-2.5">
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

export function PassPredictionMockup() {
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

export function MistakesMockup() {
  const items = [
    { q: "Q.03 정규화의 주된 목적은?", subj: "DB", bookmark: true, days: 1 },
    {
      q: "Q.07 단순보 최대 처짐 위치는?",
      subj: "응용역학",
      bookmark: false,
      days: 1,
    },
    {
      q: "Q.12 등엔트로피 관계식 아닌 것은?",
      subj: "열역학",
      bookmark: true,
      days: 3,
    },
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
          <li key={i} className="flex items-center gap-2 px-3 py-2">
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

export function CbtMockMockup() {
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
        <div className="h-full bg-primary" style={{ width: "68%" }} />
      </div>

      {/* 과목별 성적 */}
      <div className="p-3">
        <p className="mb-2 text-3xs font-semibold uppercase tracking-wider text-text-muted">
          과목별 (실시간)
        </p>
        <ul className="space-y-1.5">
          {subjects.map((s) => (
            <li key={s.name} className="flex items-center gap-2">
              <span className="flex-1 text-3xs font-medium text-text-high">
                {s.name}
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-sm bg-surface-mute">
                <div
                  className={cn("h-full", s.pass ? "bg-accent" : "bg-danger")}
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

export function NoAdsMockup() {
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

export function ConsolidatedNoteMockup() {
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

export function FailRiskMockup() {
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
        <ArrowRight
          className="h-3 w-3 shrink-0 text-primary"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
