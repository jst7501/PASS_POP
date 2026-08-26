import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuestionDetail, parseRoundSlug, GRADE_LABEL } from "@/lib/queries";
import { DP, DP_SLUG, dpQuestionByNumber } from "@/lib/content/3dp";
import { ThreeDPQuestionPage } from "@/components/exams/threedp-question";
import { buildMeta } from "@/lib/seo/metadata";
import { DbQuestionPage } from "@/components/exams/db-question";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; round: string; number: string }>;

/** 3D프린터는 JSON 콘텐츠라 DB 대신 그쪽에서 문항을 찾는다 */
function isDpRound(slug: string, round: string) {
  const parsed = parseRoundSlug(round);
  return (
    slug === DP_SLUG &&
    parsed?.year === DP.exam.year &&
    parsed?.round === DP.exam.round
  );
}

async function load(params: Params) {
  const { slug, round, number } = await params;
  const parsed = parseRoundSlug(round);
  const n = Number(number);
  if (!parsed || !Number.isInteger(n) || n < 1) return null;
  if (slug === DP_SLUG) return null; // DP 는 아래 전용 컴포넌트가 그린다
  const data = await getQuestionDetail(slug, parsed.year, parsed.round, n);
  if (!data) return null;
  return { data, roundSlug: round, slug, number: n };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const loaded = await load(params);
  const { slug, round, number } = await params;
  const path = `/exams/${slug}/rounds/${round}/questions/${number}`;
  if (!loaded) {
    return buildMeta({ title: "문제를 찾을 수 없어요", path, index: false });
  }

  const q = loaded.data.question;
  const exam = q.exam!;
  const cat = exam.category;
  const choices = (q.choices as { label: string; text: string }[]) ?? [];
  const answerText =
    choices.find((c) => c.label === q.correctAnswer)?.text ?? "";
  const stemShort = q.stem.length > 38 ? `${q.stem.slice(0, 38)}…` : q.stem;

  return buildMeta({
    title: `${cat.name} ${exam.round}회 ${q.number}번 — ${stemShort}`,
    description: `${cat.name} ${exam.year}년 ${exam.round}회 ${q.number}번 정답·해설. 정답 ${q.correctAnswer}번${answerText ? ` ${answerText}` : ""}. 보기마다 왜 맞고 왜 틀렸는지 짚어주는 프리미엄 해설과 암기 후크.`,
    path,
    keywords: [
      `${cat.name} ${exam.round}회`,
      `${cat.name} ${exam.round}회 ${q.number}번`,
      `${cat.name} 기출`,
      `${cat.name} 해설`,
      ...q.tags.slice(0, 5),
      GRADE_LABEL[cat.grade],
    ],
  });
}

export default async function Page({ params }: { params: Params }) {
  const { slug, round, number } = await params;
  const n = Number(number);
  if (isDpRound(slug, round)) {
    if (!Number.isInteger(n) || !dpQuestionByNumber(n)) notFound();
    return <ThreeDPQuestionPage number={n} />;
  }
  const loaded = await load(params);
  if (!loaded) notFound();
  return <DbQuestionPage data={loaded.data} roundSlug={loaded.roundSlug} />;
}
