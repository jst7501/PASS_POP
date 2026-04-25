import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NavArrowRight,
  NavArrowLeft,
  BookStack,
  Clock,
  Timer,
  StatsReport,
} from "iconoir-react";
import { getCategoryDetail, GRADE_LABEL } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ViewKey = "subjects" | "rounds" | "mock";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "subjects", label: "과목별 풀이" },
  { key: "rounds", label: "회차별 풀이" },
  { key: "mock", label: "실전 모의고사" },
];

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const view: ViewKey =
    sp.view === "rounds" || sp.view === "mock" ? sp.view : "subjects";

  const category = await getCategoryDetail(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted">
        <Link
          href="/"
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          홈
        </Link>
      </nav>

      <header className="mt-4 border-b border-border pb-10 md:pb-12">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
            {GRADE_LABEL[category.grade]}
          </span>
          {category.field && (
            <span className="text-[12px] text-text-muted">· {category.field}</span>
          )}
        </div>

        <h1 className="mt-3 text-[36px] font-bold tracking-[-0.02em] text-text-high md:text-[48px]">
          {category.name}
        </h1>
        {category.nameEn && (
          <p className="mt-1 font-mono text-[13px] text-text-muted">
            {category.nameEn}
          </p>
        )}
        {category.description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-text-mid">
            {category.description}
          </p>
        )}

        <dl className="mt-8 grid max-w-xl grid-cols-3 gap-6 md:gap-10">
          <Stat label="과목" value={category.subjects.length} suffix="개" />
          <Stat label="기출 회차" value={category.exams.length} suffix="회" />
          <Stat
            label="보유 문제"
            value={category.totalQuestions}
            suffix="문제"
          />
        </dl>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mt-2 border-b border-border bg-background/95 px-4 md:-mx-6 md:px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {VIEWS.map((v) => {
            const active = v.key === view;
            const href =
              v.key === "subjects"
                ? `/exams/${slug}`
                : `/exams/${slug}?view=${v.key}`;
            return (
              <Link
                key={v.key}
                href={href}
                scroll={false}
                className={cn(
                  "relative whitespace-nowrap px-4 py-4 text-[14px] font-semibold transition-colors",
                  active
                    ? "text-text-high"
                    : "text-text-muted hover:text-text-mid",
                )}
              >
                {v.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-px h-[2px] bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <section className="pt-10">
        {view === "subjects" && <SubjectsView category={category} slug={slug} />}
        {view === "rounds" && <RoundsView category={category} slug={slug} />}
        {view === "mock" && <MockView category={category} slug={slug} />}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div>
      <dt className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1.5 flex items-baseline gap-1">
        <span className="font-mono text-[28px] font-bold tabular-nums text-text-high md:text-[32px]">
          {value}
        </span>
        <span className="text-[14px] text-text-mid">{suffix}</span>
      </dd>
    </div>
  );
}

function SubjectsView({
  category,
  slug,
}: {
  category: NonNullable<Awaited<ReturnType<typeof getCategoryDetail>>>;
  slug: string;
}) {
  return (
    <>
      <p className="text-[14px] text-text-mid">
        과목 단위로 누적된 문제를 풀어요. 순서대로·랜덤·오답만 모드 선택.
      </p>
      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {category.subjects.map((s) => (
          <li key={s.id}>
            <Link
              href={`/exams/${slug}/subjects/${s.slug}`}
              className="group flex items-center justify-between rounded-md border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-elev md:p-6"
            >
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-semibold tracking-wider text-text-muted">
                  {String(s.orderIdx).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-[17px] font-bold text-text-high">
                  {s.name}
                </h3>
                <p className="mt-1 text-[13px] text-text-muted">
                  보유 문제 {s._count.questions}개
                </p>
              </div>
              <NavArrowRight
                className="h-5 w-5 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                strokeWidth={2}
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function RoundsView({
  category,
  slug,
}: {
  category: NonNullable<Awaited<ReturnType<typeof getCategoryDetail>>>;
  slug: string;
}) {
  // 해설 0건인 회차는 목록에서 숨김 (준비 전 상태 노출 금지)
  const publishedExams = category.exams.filter((ex) => ex.explanationCount > 0);

  if (publishedExams.length === 0) {
    return (
      <p className="text-[14px] text-text-mid">
        아직 공개된 회차가 없어요. 해설이 준비되면 여기에 뜨게 돼요.
      </p>
    );
  }

  const byYear = publishedExams.reduce<Record<number, typeof publishedExams>>(
    (acc, ex) => {
      (acc[ex.year] ??= []).push(ex);
      return acc;
    },
    {},
  );
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <>
      <p className="text-[14px] text-text-mid">
        연도·회차 단위로 풀어요. 실제 시험과 동일한 시간 제한 CBT 환경.
      </p>

      <div className="mt-8 space-y-10">
        {years.map((year) => (
          <div key={year}>
            <h2 className="font-mono text-[14px] font-bold tabular-nums text-text-mid">
              {year}년
            </h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {byYear[year].map((ex) => (
                <li key={ex.id}>
                  <Link
                    href={`/exams/${slug}/rounds/${ex.year}-${ex.round}`}
                    className="group -mx-3 flex items-center justify-between rounded-xl px-3 py-5 transition-colors hover:bg-surface-mute"
                  >
                    <div className="flex min-w-0 items-center gap-5">
                      <span className="w-10 shrink-0 font-mono text-[12px] font-semibold tracking-wider text-text-muted">
                        {String(ex.round).padStart(2, "0")}회
                      </span>
                      <span className="truncate text-[16px] font-semibold text-text-high">
                        {ex.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-5 text-[13px] text-text-muted">
                      <span className="hidden items-center gap-1 md:inline-flex">
                        <Clock className="h-4 w-4" strokeWidth={2} />
                        {ex.durationMin}분
                      </span>
                      <span className="hidden md:inline">
                        {ex.totalQuestions}문제
                      </span>
                      <NavArrowRight
                        className="h-5 w-5 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                        strokeWidth={2}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function MockView({
  category,
  slug,
}: {
  category: NonNullable<Awaited<ReturnType<typeof getCategoryDetail>>>;
  slug: string;
}) {
  const totalTarget = category.exams[0]?.totalQuestions ?? 100;
  const durationMin = category.exams[0]?.durationMin ?? 150;

  return (
    <>
      <p className="text-[14px] text-text-mid">
        전 과목 섞어서 실제 CBT 환경으로. 시간 제한·과락 체크 포함.
      </p>

      <div className="mt-8 rounded-md border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.01em] text-text-high md:text-[26px]">
              실전 모의고사
            </h2>
            <p className="mt-2 text-[14px] text-text-mid">
              {category.name} 기출 풀에서 전 과목 무작위 출제.
            </p>
          </div>
          <Link
            href={`/practice?category=${slug}&mode=mock`}
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            시작하기
            <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
          <MockStat Icon={BookStack} label="출제" value={`${totalTarget}문제`} />
          <MockStat Icon={Timer} label="시간" value={`${durationMin}분`} />
          <MockStat
            Icon={StatsReport}
            label="과락"
            value="과목당 40점 미만"
          />
        </dl>
      </div>
    </>
  );
}

function MockStat({
  Icon,
  label,
  value,
}: {
  Icon: typeof BookStack;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon className="h-4 w-4 text-text-muted" strokeWidth={2} />
      <dt className="mt-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] font-semibold text-text-high">{value}</dd>
    </div>
  );
}
