import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  DP,
  DP_SLUG,
  dpQuestionByNumber,
  dpQuestionsSorted,
} from "@/lib/content/3dp";
import { buildMeta } from "@/lib/seo/metadata";
import { ThreeDPQuestionPage } from "@/components/exams/threedp-question";

// 3D프린터 60문항을 정적 생성 (색인 대상). 다른 종목 slug 는 런타임 notFound.
export function generateStaticParams() {
  return dpQuestionsSorted().map((q) => ({
    slug: DP_SLUG,
    number: String(q.number),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}): Promise<Metadata> {
  const { slug, number } = await params;
  const q = slug === DP_SLUG ? dpQuestionByNumber(Number(number)) : undefined;
  if (!q) {
    return buildMeta({
      title: "문제를 찾을 수 없어요",
      path: `/exams/${slug}/questions/${number}`,
      index: false,
    });
  }
  const ans = q.choices.find((c) => c.label === q.correctAnswer)?.text ?? "";
  const stemShort = q.stem.length > 38 ? `${q.stem.slice(0, 38)}…` : q.stem;
  return buildMeta({
    title: `${DP.category.name} ${q.number}번 — ${stemShort}`,
    description: `${DP.category.name} ${q.number}번 정답·해설. 정답 ${q.correctAnswer}번 ${ans}. 찍은 오답까지 짚어주는 프리미엄 해설과 암기 후크.`,
    path: `/exams/${slug}/questions/${q.number}`,
    keywords: [
      `${DP.category.name} ${q.number}번`,
      `${DP.category.name} 기출`,
      `${DP.category.name} 해설`,
      `${DP.category.name} 필기`,
      q.subjectName,
      "기능사",
    ],
  });
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;
  if (slug !== DP_SLUG) notFound();
  const n = Number(number);
  if (!Number.isInteger(n) || !dpQuestionByNumber(n)) notFound();
  return <ThreeDPQuestionPage number={n} />;
}
