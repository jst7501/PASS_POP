"use client";

import Link from "next/link";
import { NavArrowLeft } from "iconoir-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-danger">
        Error
      </p>
      <h1 className="mt-4 text-[24px] font-bold tracking-[-0.01em] text-text-high md:text-[28px]">
        잠깐, 뭔가 꼬였어요
      </h1>
      <p className="mt-3 max-w-xs text-[14px] leading-[1.6] text-text-mid">
        페이지를 그리다가 문제가 생겼어요. 한 번 더 시도해 볼게요.
      </p>
      {error.digest && (
        <p className="mt-4 font-mono text-[11px] text-text-muted">
          code · {error.digest}
        </p>
      )}
      <div className="mt-8 flex items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface px-5 text-[14px] font-semibold text-text-mid transition-colors hover:text-text-high"
        >
          <NavArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          홈으로
        </Link>
      </div>
    </div>
  );
}
