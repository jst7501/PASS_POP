// 3D프린터운용기능사 — 임시 JSON 콘텐츠 로더 (DB 미사용).
// premium.json → convert_to_app.py 로 생성된 3d-printer.json 을 타입과 함께 노출.
import raw from "./3d-printer.json";

export type DpChoice = { label: string; text: string };
export type DpExpl = {
  wrongChoice: string | null;
  html: string;
  memoryHook: string | null;
};
export type DpStatus =
  | "correct"
  | "common_trap"
  | "weak_trap"
  | "trap"
  | "dummy";
export type DpPoint = { k: string; text: string };
export type DpDiagnosis = {
  n: number;
  status: DpStatus;
  headline: string;
  points: DpPoint[];
};
export type DpTerm = { term: string; def: string };
export type DpPremium = {
  answerSummary: string;
  hook: string;
  theory: { title: string; body: string; terms: DpTerm[] };
  trapDesign: string;
  metaStrategy: { title: string; text: string };
  tags: string[];
  diagnoses: DpDiagnosis[];
};
export type DpQuestion = {
  id: string;
  number: number;
  subjectSlug: string;
  subjectName: string;
  stem: string;
  choices: DpChoice[];
  correctAnswer: string;
  difficulty: number;
  tags: string[];
  hasImage: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  explanations: DpExpl[];
  premium: DpPremium;
};
export type DpSubject = {
  slug: string;
  name: string;
  orderIdx: number;
  questionCount: number;
};
export type DpContent = {
  category: {
    slug: string;
    name: string;
    nameEn: string;
    grade: string;
    field: string;
    colorTag: string;
    description: string;
  };
  subjects: DpSubject[];
  exam: {
    year: number;
    round: number;
    title: string;
    durationMin: number;
    totalQuestions: number;
    source: string;
  };
  questions: DpQuestion[];
};

export const DP = raw as unknown as DpContent;
export const DP_SLUG = DP.category.slug;

const byId = new Map(DP.questions.map((q) => [q.id, q]));

/** 과목 슬러그로 필터 (없으면 전체). 항상 number 오름차순. */
export function dpQuestionsBySubject(subjectSlug?: string): DpQuestion[] {
  const qs = subjectSlug
    ? DP.questions.filter((q) => q.subjectSlug === subjectSlug)
    : DP.questions;
  return [...qs].sort((a, b) => a.number - b.number);
}

/** 주어진 id 순서대로 문제 반환 (없는 id 는 스킵). */
export function dpQuestionsByIds(ids: string[]): DpQuestion[] {
  return ids
    .map((id) => byId.get(id))
    .filter((q): q is DpQuestion => Boolean(q));
}

export function dpSubject(slug: string): DpSubject | undefined {
  return DP.subjects.find((s) => s.slug === slug);
}
