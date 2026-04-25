"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setNickname } from "@/lib/actions/user-actions";
import { cn } from "@/lib/utils";

/**
 * AuthGate — 닉네임 없는 유저에게 오버레이로 닉네임 입력받기
 * RootLayout 에서 user.nickname 이 null 일 때만 마운트.
 */
export function AuthGate() {
  const router = useRouter();
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
      setValue("");
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-md border border-border bg-surface p-6 shadow-soft-lg">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          PASSPOP
        </p>
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
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "저장 중…" : "시작하기"}
        </button>

        <p className="mt-4 text-[11.5px] leading-[1.6] text-text-muted">
          같은 닉네임이 이미 있으면 그 계정으로 로그인돼요. (비번 없는 닫힌 베타)
        </p>
      </div>
    </div>
  );
}
