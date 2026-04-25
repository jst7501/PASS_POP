import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NavArrowRight,
  NavArrowLeft,
  Clock,
  BookStack,
  Timer,
  Play,
  SortDown,
} from "iconoir-react";
import { getExamDetail, parseRoundSlug, GRADE_LABEL } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ slug: string; round: string }>;
}) {
  const { slug, round } = await params;
  const parsed = parseRoundSlug(round);
  if (!parsed) notFound();

  const exam = await getExamDetail(slug, parsed.year, parsed.round);
  if (!exam) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 md:px-6">
      <nav className="pt-6 text-[13px] text-text-muted">
        <Link
          href={`/exams/${slug}?view=rounds`}
          className="inline-flex items-center gap-1 transition-colors hover:text-text-mid"
        >
          <NavArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          {exam.category.name}
        </Link>
      </nav>

      <header className="mt-4 border-b border-border pb-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
            {GRADE_LABEL[exam.category.grade]}
          </span>
          <span className="text-[12px] text-text-muted">· 회차</span>
        </div>

        <h1 className="mt-3 text-[32px] font-bold tracking-[-0.02em] text-text-high md:text-[40px]">
          {exam.title}
        </h1>
        <p className="mt-1 font-mono text-[13px] text-text-muted">
          {exam.year}-{String(exam.round).padStart(2, "0")}
          {exam.source && ` · ${exam.source}`}
        </p>

        <dl className="mt-8 grid max-w-lg grid-cols-3 gap-6 md:gap-10">
          <Stat Icon={Timer} label="시간" value={`${exam.durationMin}분`} />
          <Stat
            Icon={BookStack}
            label="공식 문항"
            value={`${exam.totalQuestions}문제`}
          />
          <Stat
            Icon={SortDown}
            label="수록 보유"
            value={`${exam.totalAvailable}문제`}
          />
        </dl>

      </header>

      <section className="pt-10">
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-text-high">
          과목별 출제 현황
        </h2>
        <p className="mt-2 text-[13px] text-text-mid">
          이 회차에 현재 수록된 문항 기준입니다.
        </p>

        <ul className="mt-6 divide-y divide-border border-y border-border">
          {exam.subjectBreakdown.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex min-w-0 items-baseline gap-5">
                <span className="w-8 shrink-0 font-mono text-[12px] font-semibold tracking-wider text-text-muted">
                  {String(s.orderIdx).padStart(2, "0")}
                </span>
                <span className="truncate text-[15px] font-medium text-text-high">
                  {s.name}
                </span>
              </div>
              <span
                className={cn(
                  "font-mono text-[13px] tabular-nums",
                  s.questionCount === 0
                    ? "text-text-muted"
                    : "text-text-mid",
                )}
              >
                {s.questionCount}문항
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-3 md:grid-cols-2">
        <StartCard
          variant="cbt"
          title="CBT 모드"
          desc={`${exam.durationMin}분 타이머. 실제 시험과 동일.`}
          href={`/practice?exam=${exam.year}-${exam.round}&category=${slug}&mode=cbt`}
          disabled={exam.totalAvailable === 0}
        />
        <StartCard
          variant="practice"
          title="연습 모드"
          desc="시간 제한 없이 한 문제씩 해설 확인."
          href={`/practice?exam=${exam.year}-${exam.round}&category=${slug}&mode=practice`}
          disabled={exam.totalAvailable === 0}
        />
      </section>

      {exam.totalAvailable === 0 && (
        <p className="mt-8 text-[13px] leading-[1.7] text-text-muted">
          이 회차에는 아직 수록된 문항이 없어요. 다른 회차를 선택하거나 과목별
          풀이를 이용해 주세요.
        </p>
      )}
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
}: {
  Icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon className="h-4 w-4 text-text-muted" strokeWidth={2} />
      <dt className="mt-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-semibold text-text-high">{value}</dd>
    </div>
  );
}

function StartCard({
  variant,
  title,
  desc,
  href,
  disabled,
}: {
  variant: "cbt" | "practice";
  title: string;
  desc: string;
  href: string;
  disabled?: boolean;
}) {
  const isCbt = variant === "cbt";
  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      className={cn(
        "group flex items-start gap-4 rounded-md border p-6 transition-all",
        disabled
          ? "cursor-not-allowed border-border bg-surface-mute opacity-60"
          : isCbt
            ? "border-primary bg-primary text-primary-fg shadow-pop hover:shadow-pop-lg active:scale-[0.98]"
            : "border-border bg-surface hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-elev",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isCbt && !disabled
            ? "bg-white/20 text-primary-fg"
            : "bg-primary/10 text-primary",
        )}
      >
        <Play className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "text-[16px] font-bold",
            isCbt && !disabled ? "text-primary-fg" : "text-text-high",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-1 text-[13px] leading-[1.6]",
            isCbt && !disabled ? "text-primary-fg/85" : "text-text-mid",
          )}
        >
          {desc}
        </p>
      </div>
      <NavArrowRight
        className={cn(
          "mt-1 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5",
          isCbt && !disabled ? "text-primary-fg" : "text-text-muted",
        )}
        strokeWidth={2}
      />
    </Link>
  );
}
