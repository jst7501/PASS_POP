"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NavArrowRight } from "iconoir-react";
import { setNickname, saveExamGoal } from "@/lib/actions/user-actions";
import { cn } from "@/lib/utils";

const OWNER_MAP: Record<string, string> = {
  "civil-engineer-gisa": "정호",
  "hvac-refrigeration-gisa": "호준",
  "3d-printer-gineungsa": "호성",
};

type Category = { id: string; slug: string; name: string };

/**
 * AuthGate — 2단계 온보딩 오버레이
 * 1) 닉네임 입력
 * 2) 시험 선택
 *
 * 두 단계 모두 끝나야 오버레이가 사라짐 (RootLayout 의 needsOnboarding 가드).
 */
export function AuthGate({
  initialStage,
  categories,
}: {
  initialStage: "nickname" | "exam";
  categories: Category[];
}) {
  const [stage, setStage] = useState<"nickname" | "exam">(initialStage);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-md border border-border bg-surface p-6 shadow-soft-lg">
        {stage === "nickname" ? (
          <NicknameStep onDone={() => setStage("exam")} />
        ) : (
          <ExamStep categories={categories} />
        )}
      </div>
    </div>
  );
}

function NicknameStep({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!value.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const res = await setNickname(value);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // 관리자는 시험 선택 스킵 — 페이지 새로고침으로 마무리
      if (res.admin) {
        window.location.reload();
        return;
      }
      // 일반 유저는 다음 단계로
      onDone();
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          PASSPOP
        </p>
        <p className="text-[10px] tabular-nums text-text-muted">1 / 2</p>
      </div>
      <h1 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-text-high">
        닉네임 하나만 알려주세요
      </h1>
      <p className="mt-2 text-[13px] leading-[1.6] text-text-mid">
        비밀번호 없이, 닉네임만으로 기록이 이어져요. 기기가 바뀌어도 같은
        닉네임을 넣으면 그대로 돌아와요.
      </p>

      <div className="mt-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          닉네임
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="예) 호준, 정호, 호성"
          maxLength={24}
          autoFocus
          className={cn(
            "mt-2 block w-full rounded-md border bg-background px-3.5 py-2.5 text-[15px] text-text-high placeholder:text-text-muted/70 focus:outline-none",
            error
              ? "border-danger focus:border-danger"
              : "border-border focus:border-text-mid",
          )}
        />
        {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-1 rounded-md bg-primary text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "저장 중…" : "다음"}
        <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </button>

      <p className="mt-4 text-[11.5px] leading-[1.6] text-text-muted">
        같은 닉네임이 이미 있으면 그 계정으로 로그인돼요. (비번 없는 닫힌 베타)
      </p>
    </>
  );
}

function ExamStep({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!picked) return;
    startTransition(async () => {
      await saveExamGoal({
        categoryId: picked,
        examDate: null,
        dailyGoal: null,
      });
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          PASSPOP
        </p>
        <p className="text-[10px] tabular-nums text-text-muted">2 / 2</p>
      </div>
      <h1 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-text-high">
        어떤 시험을 준비하세요?
      </h1>
      <p className="mt-2 text-[13px] leading-[1.6] text-text-mid">
        기본 시험을 정하면 홈에 그 시험만 노출돼요. 다른 시험은 언제든 메뉴에서.
      </p>

      <ul className="mt-5 space-y-2">
        {categories.map((c) => {
          const owner = OWNER_MAP[c.slug] ?? "";
          const active = picked === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setPicked(c.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/[0.06]"
                    : "border-border bg-surface hover:border-text-mid",
                )}
              >
                <div>
                  {owner && (
                    <p className="text-[11px] text-text-muted">{owner}</p>
                  )}
                  <p
                    className={cn(
                      "mt-0.5 text-[14.5px] font-bold tracking-[-0.01em]",
                      active ? "text-primary" : "text-text-high",
                    )}
                  >
                    {c.name}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    active
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-surface",
                  )}
                >
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-primary-fg" />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={submit}
        disabled={!picked || pending}
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "저장 중…" : "시작하기"}
      </button>

      <p className="mt-3 text-[11.5px] leading-[1.6] text-text-muted">
        나중에 헤더의 “다른 시험” 에서 언제든 바꿀 수 있어요.
      </p>
    </>
  );
}
