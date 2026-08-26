"use server";

import prisma from "@/lib/prisma";
import { renderExplanationHtml } from "@/lib/explanation-render";

/** 개념 카드 — 문제 화면에서 그 자리 펼치는 개념·함정·암기 */
export type ConceptCard = {
  /** 개념 설명 (계보·배경까지) */
  bodyHtml: string;
  /** 출제자가 파둔 함정 */
  trapHtml: string | null;
  /** 더 알아두기 */
  extraHtml: string | null;
  /** 시험장에서 떠올릴 한 줄 */
  hook: string | null;
};

export type ExplanationEntry = {
  wrongChoice: string | null;
  html: string;
  memoryHook: string | null;
  /** general(wrongChoice=null) 해설에만 붙는다. 없는 종목도 있다. */
  concept?: ConceptCard | null;
};

type Sections = {
  tldr?: string | null;
  source?: string | null;
  body?: string | null;
  trap?: string | null;
  extra?: string | null;
};

function asSections(v: unknown): Sections | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const s = v as Sections;
  return s.body || s.tldr ? s : null;
}

/**
 * 문항 하나의 공개 해설을 가져온다.
 *
 * 풀이 화면이 처음 뜰 때 50문항 해설을 통째로 내려보내면 페이로드가 커진다
 * (한국사 79회 기준 33만 자 중 해설이 94.8%). 해설은 답을 고른 뒤에야 필요하니
 * 그 시점에 이 액션으로 한 문항씩 가져온다.
 *
 * sections 가 있는 해설(한국사 등)은 전체 풀이를 '정답 요약 + 자료 해독'까지만
 * 보여주고, 개념·함정·더 알아두기는 개념 카드로 접어 둔다. 같은 내용을 두 번
 * 보여주지 않으면서 "막히면 그 자리에서 펼친다"는 흐름이 된다.
 */
export async function fetchQuestionExplanations(
  questionId: string,
): Promise<ExplanationEntry[]> {
  if (!questionId) return [];

  const rows = await prisma.aiExplanation.findMany({
    where: { questionId, userId: null },
    select: {
      wrongChoice: true,
      explanation: true,
      memoryHook: true,
      sections: true,
    },
  });

  return rows.map((e) => {
    const sections = e.wrongChoice === null ? asSections(e.sections) : null;
    if (!sections) {
      return {
        wrongChoice: e.wrongChoice,
        html: renderExplanationHtml(e.explanation),
        memoryHook: e.memoryHook,
        concept: null,
      };
    }

    const lead = [sections.tldr, sections.source]
      .filter((s): s is string => Boolean(s && s.trim()))
      .join("\n\n");

    return {
      wrongChoice: null,
      // 개념 카드로 뺀 부분을 제외한 앞머리만. 앞머리가 비면 원문을 그대로 쓴다.
      html: renderExplanationHtml(lead || e.explanation),
      memoryHook: e.memoryHook,
      concept: {
        bodyHtml: renderExplanationHtml(sections.body ?? ""),
        trapHtml: sections.trap?.trim()
          ? renderExplanationHtml(sections.trap)
          : null,
        extraHtml: sections.extra?.trim()
          ? renderExplanationHtml(sections.extra)
          : null,
        hook: e.memoryHook,
      },
    };
  });
}
