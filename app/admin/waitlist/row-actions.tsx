"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Xmark, Trash, WarningTriangle } from "iconoir-react";
import {
  setWaitlistStatus,
  deleteWaitlistEntry,
} from "@/lib/actions/waitlist-admin";
import type { WaitlistStatus } from "@/lib/generated/prisma-client";
import { cn } from "@/lib/utils";

export function WaitlistRowActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: WaitlistStatus;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function update(next: WaitlistStatus) {
    if (next === currentStatus) return;
    start(async () => {
      await setWaitlistStatus(id, next);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("정말 삭제할까요? 되돌릴 수 없습니다.")) return;
    start(async () => {
      await deleteWaitlistEntry(id);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1",
        pending && "opacity-60",
      )}
    >
      <ActionBtn
        title="확인됨"
        onClick={() => update("CONFIRMED")}
        active={currentStatus === "CONFIRMED"}
        tone="accent"
        disabled={pending}
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </ActionBtn>
      <ActionBtn
        title="수신거부"
        onClick={() => update("UNSUBSCRIBED")}
        active={currentStatus === "UNSUBSCRIBED"}
        tone="muted"
        disabled={pending}
      >
        <Xmark className="h-3 w-3" strokeWidth={2.5} />
      </ActionBtn>
      <ActionBtn
        title="스팸"
        onClick={() => update("SPAM")}
        active={currentStatus === "SPAM"}
        tone="warning"
        disabled={pending}
      >
        <WarningTriangle className="h-3 w-3" strokeWidth={2.5} />
      </ActionBtn>
      <ActionBtn
        title="삭제"
        onClick={remove}
        active={false}
        tone="danger"
        disabled={pending}
      >
        <Trash className="h-3 w-3" strokeWidth={2.5} />
      </ActionBtn>
    </div>
  );
}

function ActionBtn({
  title,
  onClick,
  active,
  tone,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  active: boolean;
  tone: "accent" | "muted" | "warning" | "danger";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        active
          ? tone === "accent"
            ? "border-accent bg-accent text-background"
            : tone === "muted"
              ? "border-text-mid bg-text-mid text-background"
              : tone === "warning"
                ? "border-warning bg-warning text-background"
                : "border-danger bg-danger text-background"
          : "border-border bg-surface text-text-mid hover:border-text-mid hover:text-text-high",
      )}
    >
      {children}
    </button>
  );
}
