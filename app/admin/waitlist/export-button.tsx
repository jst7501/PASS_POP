"use client";

import { useTransition } from "react";
import { Download } from "iconoir-react";
import { exportWaitlistCsv } from "@/lib/actions/waitlist-admin";
import { cn } from "@/lib/utils";

export function ExportCsvButton() {
  const [pending, start] = useTransition();

  function download() {
    start(async () => {
      const csv = await exportWaitlistCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `passpop-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-[13px] font-semibold transition-colors",
        pending
          ? "cursor-not-allowed text-text-muted"
          : "text-text-mid hover:border-text-mid hover:text-text-high",
      )}
    >
      <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
      {pending ? "내보내는 중…" : "CSV 다운로드"}
    </button>
  );
}
