"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck } from "iconoir-react";
import { clearSession } from "@/lib/actions/user-actions";
import { cn } from "@/lib/utils";

/**
 * 헤더의 닉네임 뱃지 + 드롭다운 (로그아웃 / 관리자 페이지 링크)
 */
export function SiteUserBadge({
  nickname,
  isAdmin,
}: {
  nickname: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const doLogout = () => {
    startTransition(async () => {
      await clearSession();
      setOpen(false);
      router.refresh();
    });
  };

  if (!nickname) return null;
  const initial = nickname.slice(0, 1).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface pl-1.5 pr-1.5 transition-colors hover:border-text-mid sm:pr-2.5",
          isAdmin && "border-primary/50 bg-primary/5",
        )}
        aria-label={`${nickname} 메뉴`}
      >
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-sm text-[11px] font-bold",
            isAdmin
              ? "bg-primary text-primary-fg"
              : "bg-text-high text-background",
          )}
        >
          {initial}
        </span>
        <span className="hidden max-w-[100px] truncate text-[12.5px] font-semibold text-text-high sm:inline">
          {nickname}
        </span>
        {isAdmin && (
          <ShieldCheck
            className="hidden h-3.5 w-3.5 text-primary sm:inline"
            strokeWidth={2.5}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-48 overflow-hidden rounded-md border border-border bg-surface shadow-soft-lg">
          <div className="border-b border-border-soft px-3 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              로그인됨
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-text-high">
              {nickname}
            </p>
          </div>
          <ul className="py-1">
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-mid transition-colors hover:bg-surface-mute hover:text-text-high"
                >
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  관리자 페이지
                </Link>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={doLogout}
                disabled={pending}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-text-mid transition-colors hover:bg-surface-mute hover:text-text-high disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                {pending ? "로그아웃 중…" : "로그아웃"}
              </button>
            </li>
          </ul>
          <div className="border-t border-border-soft px-3 py-2 text-[11px] text-text-muted">
            <User className="mr-1 inline h-3 w-3" strokeWidth={2} />
            로그아웃해도 같은 닉으로 다시 들어오면 기록이 이어져요.
          </div>
        </div>
      )}
    </div>
  );
}
