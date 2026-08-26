/**
 * "공개 해설" 판정 기준 한 곳 모음.
 *
 * 회차를 공개할지, 사이트맵에 넣을지, 공개 회차 수를 몇으로 셀지가 전부
 * 이 기준을 따른다. 예전에는 `model: "hand-written"` 문자열이 네 파일에
 * 흩어져 있었는데, 검수를 거친 생성 해설(한국사 등)이 들어오면서
 * 그 문자열 하나로는 판정이 안 돼 여기로 모았다.
 *
 * 새 해설 세트를 공개할 때 이 목록에 모델명을 추가한다.
 */
export const PUBLISHED_EXPLANATION_MODELS = [
  // 사람이 직접 쓴 해설 (공조냉동·토목·3D프린터)
  "hand-written",
  // 문항별 이미지까지 확인해 생성하고 검수를 마친 해설 (한국사능력검정시험 심화)
  "claude-opus-5",
] as const;

/** AiExplanation where 절에 그대로 펼쳐 쓰는 공개 조건 */
export const publishedExplanationWhere = {
  userId: null,
  model: { in: [...PUBLISHED_EXPLANATION_MODELS] },
};
