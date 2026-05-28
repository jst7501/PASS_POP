"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCircle, WarningTriangle, Lock, ShieldCheck } from "iconoir-react";
import { subscribeWaitlist } from "@/lib/actions/waitlist";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "duplicate" }
  | { kind: "error"; message: string };

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [state, setState] = useState<State>({ kind: "idle" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;

    setState({ kind: "idle" });
    start(async () => {
      // 폼 출처 — UTM 등이 있으면 잡아서 함께 저장
      let source = "landing";
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const utm = sp.get("utm_source") || sp.get("ref");
        if (utm) source = `landing:${utm}`;
      }

      const res = await subscribeWaitlist(v, source);
      if (!res.ok) {
        setState({ kind: "error", message: res.error });
        return;
      }
      if (res.status === "already") {
        setState({ kind: "duplicate" });
      } else {
        setState({ kind: "success" });
        setEmail("");
      }
    });
  }

  // 성공 상태에서는 폼 자리에 큰 안내 카드
  if (state.kind === "success") {
    return (
      <SuccessCard />
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          오픈 알림을 받을 이메일
        </label>
        <input
          id="waitlist-email"
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
            "inline-flex h-12 items-center justify-center gap-1.5 rounded-lg bg-primary px-6 text-[14px] font-bold text-primary-fg transition-colors active:scale-[0.98]",
            (pending || email.trim().length === 0)
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-primary-hover",
          )}
        >
          {pending ? (
            <Spinner />
          ) : (
            <>
              <Bell className="h-4 w-4" strokeWidth={2.5} />
              알림 신청
            </>
          )}
        </button>
      </form>

      {/* 상태 메시지 */}
      {state.kind === "duplicate" && (
        <StatusBanner
          tone="info"
          icon={<CheckCircle className="h-4 w-4" strokeWidth={2.5} />}
          title="이미 신청하셨어요"
          desc="오픈 시 등록된 이메일로 안내 드릴게요."
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
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11.5px] text-text-muted">
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

function SuccessCard() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-accent/40 bg-accent/[0.06] p-6 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
        <CheckCircle className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <h3 className="mt-4 text-[18px] font-bold tracking-[-0.01em] text-text-high">
        신청 완료!
      </h3>
      <p className="mt-2 text-[13.5px] leading-[1.65] text-text-mid">
        정식 오픈 시 등록하신 이메일로 안내드릴게요.
        <br />
        그동안 종목별 기출·해설을 다듬고 있어요.
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
        <p className="mt-0.5 text-[12px] leading-[1.55] text-text-mid">
          {desc}
        </p>
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
