"use client";

import { Printer } from "iconoir-react";

/** 브라우저 인쇄 대화상자를 연다. "PDF로 저장"이 여기서 나온다. */
export function PrintButton({ label = "인쇄 · PDF로 저장" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-text-mid transition-colors hover:border-primary/40 hover:text-text-high"
    >
      <Printer className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
