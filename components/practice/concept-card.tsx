"use client";

import { useState } from "react";
import { OpenBook, NavArrowDown } from "iconoir-react";
import type { ConceptCard as ConceptCardData } from "@/lib/actions/explanations";
import { cn } from "@/lib/utils";

/**
 * 개념 카드 — 막힌 자리에서 그대로 펼치는 개념.
 *
 * 교재를 펴지 않아도 되도록, 그 문제를 푸는 데 필요한 개념과 출제 함정,
 * 외울 한 줄을 문제 화면 안에서 바로 연다.
 * 해설이 sections 구조를 갖고 있는 종목에서만 나타난다.
 */
export function ConceptCard({
  concept,
  defaultOpen = false,
}: {
  concept: ConceptCardData;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!concept.bodyHtml?.trim()) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-primary/35 bg-primary/[0.05]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[52px] w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-primary/[0.08]"
      >
        <OpenBook className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
        <span className="flex-1 text-[14px] font-semibold text-primary">
          개념 카드
          <span className="ml-1.5 font-normal text-text-muted">
            {open ? "접기" : "교재 없이 이 자리에서 보기"}
          </span>
        </span>
        <NavArrowDown
          className={cn(
            "h-4 w-4 shrink-0 text-primary transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="border-t border-primary/20 px-4 pb-4 pt-3.5">
          <div
            className="explanation-html"
            dangerouslySetInnerHTML={{ __html: concept.bodyHtml }}
          />

          {concept.hook && (
            <p className="mt-4 rounded-md bg-surface px-3.5 py-3 text-center text-[15px] font-bold leading-[1.55] text-text-high">
              {concept.hook}
            </p>
          )}

          {concept.trapHtml && (
            <div className="mt-4 rounded-md bg-danger/[0.06] px-3.5 py-3">
              <span className="text-[11.5px] font-bold tracking-[0.02em] text-danger">
                출제자가 숨긴 함정
              </span>
              <div
                className="explanation-html mt-1.5"
                dangerouslySetInnerHTML={{ __html: concept.trapHtml }}
              />
            </div>
          )}

          {concept.extraHtml && (
            <details className="mt-3 group">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-[13.5px] font-semibold text-primary transition-colors hover:text-primary-hover [&::-webkit-details-marker]:hidden">
                더 알아두기
              </summary>
              <div
                className="explanation-html mt-2"
                dangerouslySetInnerHTML={{ __html: concept.extraHtml }}
              />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
