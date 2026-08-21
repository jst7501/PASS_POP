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
import { MergedFeatures } from "@/components/feature-merged";
import {
  LiveAiExplanation,
  LiveConceptCard,
  LiveStepSolution,
} from "@/components/mockups-live";
import {
  LiveCbtMock,
  LiveConsolidatedNote,
  LiveFailRisk,
  LiveMistakes,
  LivePassPrediction,
  LiveReviewSchedule,
} from "@/components/mockups-live-2";
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
        <ul className="mt-8 md:mt-10">
          <MergedFeatures />
          <FeatureRow
            index={3}
            title="망각곡선 복습 (SM-2)"
            desc="맞힌 건 간격 늘려 재출제, 틀린 건 다음 날. 알고리즘이 잊을 때쯤 정확히 복습을 띄워줍니다."
          >
            <LiveReviewSchedule />
          </FeatureRow>

          <FeatureRow
            index={4}
            title="실전 CBT 모의고사"
            foldOnMobile
            desc="실제 시험과 동일한 시간 제한 · 과목별 과락 체크. 전 과목 무작위 출제."
          >
            <LiveCbtMock />
          </FeatureRow>

          <FeatureRow
            index={5}
            title="광고 없는 풀이 화면"
            foldOnMobile
            desc="풀이와 해설 화면엔 광고가 없어요. 팝업도 배너도 안 띄워요."
          >
            <NoAdsMockup />
          </FeatureRow>
        </ul>
      </div>
    </section>
  );
}

/**
 * 기능 한 줄.
 *
 * 카드로 묶고 목업 칸을 따로 두면 열 개가 같은 상자로 반복돼 목록처럼 읽힌다.
 * 테두리를 걷고 좌우를 번갈아 두면 훑으면서 읽힌다.
 */
export function FeatureRow({
  index,
  title,
  desc,
  children,
  /** 모바일에서 시연을 접는다. 열 개가 1열로 쌓이면 그 구간만 화면 몇 개 분량이 된다. */
  foldOnMobile = false,
}: {
  index: number;
  title: string;
  desc: string;
  children: React.ReactNode;
  foldOnMobile?: boolean;
}) {
  const flip = index % 2 === 1;
  return (
    <li className="grid gap-7 border-t border-border py-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
      <div className={flip ? "lg:order-2" : undefined}>
        <span className="text-3xs font-bold tabular-nums tracking-[0.18em] text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-3 text-xl font-extrabold leading-[1.3] tracking-[-0.03em] text-text-high md:text-2xl">
          {title}
        </h3>
        <p className="mt-3 max-w-lg text-base text-text-mid">{desc}</p>
      </div>

      <div
        className={cn(
          "justify-center lg:flex",
          flip ? "lg:order-1" : undefined,
          foldOnMobile ? "hidden lg:flex" : "flex",
        )}
      >
        {children}
      </div>
    </li>
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
