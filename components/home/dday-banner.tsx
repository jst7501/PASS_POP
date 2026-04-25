"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Xmark, Flash } from "iconoir-react";
import { saveExamGoal } from "@/lib/actions/user-actions";
import { cn } from "@/lib/utils";

/**
 * D-day 배너 + 설정 모달
 * - 현재 선택된 카테고리에 대한 시험일/일일 목표 표시
 * - 미설정 시 "이 시험 일정 등록" CTA
 */
export function DdayBanner({
  categoryId,
  categoryName,
  examDate,
  dailyGoal,
  todaySolved,
  isCurrentCategory,
}: {
  categoryId: string;
  categoryName: string;
  examDate: string | null; // ISO string from server
  dailyGoal: number | null;
  todaySolved: number;
  isCurrentCategory: boolean; // user.targetCategoryId === categoryId
}) {
  const [open, setOpen] = useState(false);

  if (!isCurrentCategory || !examDate) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mt-4 flex w-full items-center gap-3 rounded-md border border-dashed border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-surface-mute text-text-mid group-hover:bg-primary/10 group-hover:text-primary">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-text-high">
              시험 일정 등록하고 D-day 받기
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              매일 풀어야 할 양도 같이 계산해드려요
            </p>
          </div>
          <span className="text-[11.5px] font-semibold text-text-muted group-hover:text-primary">
            등록 →
          </span>
        </button>
        {open && (
          <DdaySetupDialog
            categoryId={categoryId}
            categoryName={categoryName}
            initial={{ examDate, dailyGoal }}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  // D-day 계산
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dDays = Math.round((exam.getTime() - today.getTime()) / 86400000);

  const goal = dailyGoal ?? 0;
  const goalPct =
    goal > 0 ? Math.min(100, Math.round((todaySolved / goal) * 100)) : 0;

  return (
    <>
      <div className="mt-4 rounded-md border border-primary/30 bg-primary/[0.04] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-fg">
            <span className="text-[10px] font-bold tracking-wider">D</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="text-[24px] font-bold tabular-nums leading-none tracking-[-0.02em] text-primary">
                {dDays >= 0 ? `-${dDays}` : `+${Math.abs(dDays)}`}
              </span>
              <span className="text-[11px] text-text-muted">
                {dDays >= 0
                  ? `${formatDate(exam)} 시험까지`
                  : "시험 종료"}
              </span>
            </p>
            {goal > 0 && (
              <p className="mt-0.5 text-[11.5px] text-text-muted">
                <Flash className="mr-0.5 inline h-3 w-3" strokeWidth={2} />
                오늘 목표{" "}
                <span className="tabular-nums font-semibold text-text-mid">
                  {todaySolved}
                </span>
                /
                <span className="tabular-nums">{goal}</span>문
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11.5px] font-medium text-text-muted hover:text-text-mid"
          >
            수정
          </button>
        </div>
        {goal > 0 && (
          <div className="mt-2 h-[3px] overflow-hidden rounded-sm bg-primary/15">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.max(goalPct, 2)}%` }}
            />
          </div>
        )}
      </div>
      {open && (
        <DdaySetupDialog
          categoryId={categoryId}
          categoryName={categoryName}
          initial={{ examDate, dailyGoal }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function DdaySetupDialog({
  categoryId,
  categoryName,
  initial,
  onClose,
}: {
  categoryId: string;
  categoryName: string;
  initial: { examDate: string | null; dailyGoal: number | null };
  onClose: () => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState(
    initial.examDate ? initial.examDate.slice(0, 10) : "",
  );
  const [goal, setGoal] = useState(
    initial.dailyGoal != null ? String(initial.dailyGoal) : "",
  );
  const [pending, startTransition] = useTransition();

  const submit = (clear: boolean) => {
    startTransition(async () => {
      await saveExamGoal({
        categoryId: clear ? null : categoryId,
        examDate: clear ? null : date || null,
        dailyGoal: clear ? null : goal ? parseInt(goal, 10) : null,
      });
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-md border border-border bg-surface p-5 shadow-soft-lg">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            시험 일정
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-muted hover:text-text-high"
            aria-label="닫기"
          >
            <Xmark className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <h2 className="mt-2 text-[18px] font-bold tracking-[-0.01em] text-text-high">
          {categoryName}
        </h2>
        <p className="mt-1 text-[12.5px] text-text-mid">
          시험일을 알려주면 D-day 와 하루 풀이량을 잡아드려요.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              시험 일자
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(
                "mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-[14px] text-text-high focus:border-text-mid focus:outline-none",
              )}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              하루 목표 (문제수)
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="예) 20"
              className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-[14px] text-text-high focus:border-text-mid focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={pending || !date}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-fg disabled:opacity-60"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
          {initial.examDate && (
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-3 text-[12.5px] font-semibold text-text-mid hover:text-danger"
            >
              해제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}.${String(m).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
}
