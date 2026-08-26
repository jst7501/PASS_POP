/**
 * 태그 단위 약점 집계.
 *
 * 과목별 정답률은 "조선 58%" 까지밖에 못 말해준다. 정작 필요한 건
 * "붕당 정치를 7문제 중 5개 틀렸다" 쪽이다.
 * 문항에 붙여 둔 태그(통일 신라 · 국학 · 독서삼품과 …)로 집계하면
 * 같은 데이터로 그 해상도가 나온다.
 */

export type TagStat = {
  tag: string;
  total: number;
  correct: number;
  wrong: number;
  /** 정답률 0~100 */
  rate: number;
  /** 이 태그가 가장 많이 나온 종목 — "이 주제만 풀기" 링크에 쓴다 */
  categorySlug: string;
};

export type TagWeaknessInput = {
  isCorrect: boolean;
  question: {
    tags: string[];
    subject?: { category?: { slug: string } | null } | null;
  };
};

/** 시대·종목처럼 너무 넓어서 약점으로 짚어봐야 소용없는 태그는 뺀다 */
const TOO_BROAD = new Set([
  "선사 시대",
  "선사·고대",
  "고대",
  "삼국",
  "삼국 시대",
  "남북국 시대",
  "고려",
  "조선",
  "조선 전기",
  "조선 후기",
  "근대",
  "개항기",
  "일제 강점기",
  "현대",
  "통사",
  "지역사",
  "문화유산",
]);

export function aggregateTagWeakness(
  records: TagWeaknessInput[],
  {
    /** 이 문항 수 미만인 태그는 표본이 모자라 판단하지 않는다 */
    minSample = 3,
    limit = 8,
  }: { minSample?: number; limit?: number } = {},
): TagStat[] {
  const map = new Map<
    string,
    { total: number; correct: number; cats: Map<string, number> }
  >();

  for (const r of records) {
    const catSlug = r.question.subject?.category?.slug ?? "";
    for (const raw of r.question.tags ?? []) {
      const tag = raw.trim();
      if (!tag || TOO_BROAD.has(tag)) continue;
      const cur = map.get(tag) ?? {
        total: 0,
        correct: 0,
        cats: new Map<string, number>(),
      };
      cur.total += 1;
      if (r.isCorrect) cur.correct += 1;
      if (catSlug) cur.cats.set(catSlug, (cur.cats.get(catSlug) ?? 0) + 1);
      map.set(tag, cur);
    }
  }

  return Array.from(map.entries())
    .map(([tag, v]) => ({
      tag,
      total: v.total,
      correct: v.correct,
      wrong: v.total - v.correct,
      rate: Math.round((v.correct / v.total) * 100),
      categorySlug:
        [...v.cats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "",
    }))
    .filter((t) => t.total >= minSample)
    // 정답률이 낮은 순, 같으면 많이 틀린 순
    .sort((a, b) => a.rate - b.rate || b.wrong - a.wrong)
    .slice(0, limit);
}

/** 잘하는 쪽도 같은 재료로 뽑는다 (칭찬용) */
export function aggregateTagStrength(
  records: TagWeaknessInput[],
  opts: { minSample?: number; limit?: number } = {},
): TagStat[] {
  const { minSample = 3, limit = 5 } = opts;
  return aggregateTagWeakness(records, { minSample, limit: Number.MAX_SAFE_INTEGER })
    .filter((t) => t.rate >= 80)
    .sort((a, b) => b.rate - a.rate || b.total - a.total)
    .slice(0, limit);
}
