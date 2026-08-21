"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bell,
  CheckCircle,
  WarningTriangle,
  Lock,
  ShieldCheck,
  NavArrowDown,
} from "iconoir-react";
import { subscribeWaitlist } from "@/lib/actions/waitlist";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "duplicate" }
  | { kind: "error"; message: string };

/** 서버 액션의 화이트리스트와 반드시 같은 값을 써야 저장된다. */
const GRADES = ["기능사", "산업기사", "기사", "기술사", "공무원", "기타"] as const;

const TIMINGS = [
  { value: "WITHIN_1M", label: "1개월 안에" },
  { value: "WITHIN_3M", label: "3개월 안에" },
  { value: "WITHIN_6M", label: "6개월 안에" },
  { value: "UNDECIDED", label: "아직 미정" },
] as const;

/** 현재 URL 에서 유입 파라미터를 긁어온다 (없으면 전부 undefined). */
function readUtm() {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  return {
    utmSource: sp.get("utm_source") ?? sp.get("ref") ?? undefined,
    utmMedium: sp.get("utm_medium") ?? undefined,
    utmCampaign: sp.get("utm_campaign") ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// 사전예약 폼
//   variant="inline" → 히어로용. 이메일 한 줄.
//   variant="full"   → 하단 CTA용. 목표 종목 / 등급 / 시기까지 함께 수집.
// ─────────────────────────────────────────────────────────────
export function WaitlistForm({
  variant = "full",
  source = "landing",
}: {
  variant?: "inline" | "full";
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [targetCert, setTargetCert] = useState("");
  const [targetGrade, setTargetGrade] = useState("");
  const [timing, setTiming] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [company, setCompany] = useState(""); // 허니팟
  const [pending, start] = useTransition();
  const [state, setState] = useState<State>({ kind: "idle" });

  const detailed = variant === "full";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;

    setState({ kind: "idle" });
    start(async () => {
      const res = await subscribeWaitlist({
        email: v,
        targetCert: detailed ? targetCert : undefined,
        targetGrade: detailed ? targetGrade : undefined,
        timing: detailed ? timing : undefined,
        marketingOptIn: detailed ? marketingOptIn : false,
        source,
        company,
        ...readUtm(),
      });

      if (!res.ok) {
        setState({ kind: "error", message: res.error });
        return;
      }
      if (res.status === "already") {
        setState({ kind: "duplicate" });
      } else {
        setState({ kind: "success" });
        setEmail("");
        setTargetCert("");
        setTargetGrade("");
        setTiming("");
      }
    });
  }

  // 성공 상태에서는 폼 자리에 큰 안내 카드
  if (state.kind === "success") {
    return <SuccessCard compact={!detailed} />;
  }

  return (
    <div className={cn("mx-auto", detailed ? "max-w-xl" : "max-w-md")}>
      <form onSubmit={submit} noValidate>
        {/* 허니팟 — 스크린리더/탭 이동에서 제외, 봇만 채운다 */}
        <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor={`wl-company-${variant}`}>회사명</label>
          <input
            id={`wl-company-${variant}`}
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`waitlist-email-${variant}`} className="sr-only">
            오픈 알림을 받을 이메일
          </label>
          <input
            id={`waitlist-email-${variant}`}
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state.kind !== "idle") setState({ kind: "idle" });
            }}
            disabled={pending}
            aria-invalid={state.kind === "error"}
            className={cn(
              "h-12 flex-1 rounded-lg border bg-surface px-4 text-[14px] text-text-high placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2",
              state.kind === "error"
                ? "border-danger focus:border-danger focus:ring-danger/30"
                : "border-border focus:border-primary focus:ring-primary/30",
              pending && "cursor-not-allowed opacity-70",
            )}
          />
          <button
            type="submit"
            disabled={pending || email.trim().length === 0}
            className={cn(
              "inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-6 text-[14px] font-bold text-primary-fg transition-colors active:scale-[0.98]",
              pending || email.trim().length === 0
                ? "cursor-not-allowed opacity-60"
                : "hover:bg-primary-hover",
            )}
          >
            {pending ? (
              <Spinner />
            ) : (
              <>
                <Bell className="h-4 w-4" strokeWidth={2.5} />
                사전예약 신청
              </>
            )}
          </button>
        </div>

        {/* 상세 항목 — 전부 선택 입력. 오픈 순서를 정하는 데 쓴다. */}
        {detailed && (
          <fieldset className="mt-3 rounded-lg border border-border-soft bg-surface/60 p-4 text-left">
            {/* legend 는 보더를 뚫고 지나가서 지저분해진다 — 접근성만 남기고 시각은 p 로 */}
            <legend className="sr-only">추가 정보 (모두 선택 입력)</legend>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              선택 · 알려주시면 이 종목부터 엽니다
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="wl-cert"
                  className="block text-[12px] font-medium text-text-mid"
                >
                  목표 종목
                </label>
                <input
                  id="wl-cert"
                  type="text"
                  name="targetCert"
                  maxLength={60}
                  placeholder="예) 토목기사"
                  value={targetCert}
                  onChange={(e) => setTargetCert(e.target.value)}
                  disabled={pending}
                  className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-[13.5px] text-text-high placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div>
                <label
                  htmlFor="wl-grade"
                  className="block text-[12px] font-medium text-text-mid"
                >
                  등급
                </label>
                <SelectShell>
                  <select
                    id="wl-grade"
                    name="targetGrade"
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    disabled={pending}
                    className="h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-[13.5px] text-text-high focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">선택 안 함</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </SelectShell>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="wl-timing"
                  className="block text-[12px] font-medium text-text-mid"
                >
                  시험 예정 시기
                </label>
                <SelectShell>
                  <select
                    id="wl-timing"
                    name="timing"
                    value={timing}
                    onChange={(e) => setTiming(e.target.value)}
                    disabled={pending}
                    className="h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-[13.5px] text-text-high focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">선택 안 함</option>
                    {TIMINGS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </SelectShell>
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[12px] leading-[1.6] text-text-mid">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                disabled={pending}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[rgb(var(--primary))]"
              />
              <span>
                오픈 안내 외에{" "}
                <strong className="font-semibold text-text-high">
                  종목별 기출 업데이트·학습 팁
                </strong>{" "}
                도 받아볼래요.{" "}
                <span className="text-text-muted">(선택, 언제든 해지)</span>
              </span>
            </label>
          </fieldset>
        )}
      </form>

      {/* 상태 메시지 */}
      {state.kind === "duplicate" && (
        <StatusBanner
          tone="info"
          icon={<CheckCircle className="h-4 w-4" strokeWidth={2.5} />}
          title="이미 신청하셨어요"
          desc="오픈 시 등록된 이메일로 안내 드릴게요. 새로 적어주신 정보는 반영했어요."
        />
      )}

      {state.kind === "error" && (
        <StatusBanner
          tone="danger"
          icon={<WarningTriangle className="h-4 w-4" strokeWidth={2.5} />}
          title="신청에 실패했어요"
          desc={state.message}
        />
      )}

      {/* 보조 안내 */}
      {state.kind === "idle" && (
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11.5px] text-text-muted">
          <li className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" strokeWidth={2} />
            스팸 없음 · 오픈 안내만 1회
          </li>
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" strokeWidth={2} />
            언제든지 수신 거부 가능
          </li>
        </ul>
      )}
    </div>
  );
}

/** select 오른쪽에 화살표를 얹는 래퍼 (appearance-none 이라 직접 그린다) */
function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mt-1.5">
      {children}
      <NavArrowDown
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
        strokeWidth={2}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 신청자 수 — 실제 DB 카운트. 표본이 너무 적으면 아예 숨긴다.
// ─────────────────────────────────────────────────────────────
const COUNT_FLOOR = 30;

export function WaitlistCount({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/waitlist/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && typeof d?.count === "number") setCount(d.count);
      })
      .catch(() => {
        /* 카운터는 부가 정보 — 실패하면 조용히 숨긴다 */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (count === null || count < COUNT_FLOOR) return null;

  return (
    <p className={cn("text-[12.5px] text-text-mid", className)}>
      지금까지{" "}
      <strong className="font-bold tabular-nums text-text-high">
        {count.toLocaleString("ko-KR")}명
      </strong>
      이 오픈을 기다리고 있어요.
    </p>
  );
}

function SuccessCard({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto rounded-xl border border-accent/40 bg-accent/[0.06] text-center",
        compact ? "max-w-md p-5" : "max-w-xl p-6",
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
        <CheckCircle className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <h3 className="mt-4 text-[18px] font-bold tracking-[-0.01em] text-text-high">
        사전예약 완료!
      </h3>
      <p className="mt-2 text-[13.5px] leading-[1.65] text-text-mid">
        정식 오픈 시 등록하신 이메일로 안내드릴게요.
        <br />
        적어주신 종목은 오픈 순서를 정할 때 먼저 반영합니다.
      </p>
      <p className="mt-4 text-[11px] text-text-muted">
        받은편지함을 열어보지 않으셔도 자동으로 도착해요.
      </p>
    </div>
  );
}

function StatusBanner({
  tone,
  icon,
  title,
  desc,
}: {
  tone: "info" | "danger";
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-3 rounded-lg border p-3.5 text-left",
        tone === "info" && "border-accent/30 bg-accent/[0.05]",
        tone === "danger" && "border-danger/30 bg-danger/[0.05]",
      )}
      role="status"
    >
      <span
        className={cn(
          "mt-0.5 shrink-0",
          tone === "info" && "text-accent",
          tone === "danger" && "text-danger",
        )}
      >
        {icon}
      </span>
      <div>
        <p
          className={cn(
            "text-[13px] font-semibold",
            tone === "info" && "text-accent",
            tone === "danger" && "text-danger",
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-[1.55] text-text-mid">{desc}</p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-fg/30 border-t-primary-fg"
      aria-label="처리 중"
    />
  );
}
