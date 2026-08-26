import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * 공개 콘텐츠 캐시 무효화.
 *
 * 문항·해설을 적재해도 /exams 목록과 카테고리 상세는 unstable_cache(1시간)에
 * 걸려 옛 데이터를 그대로 서빙한다. 무효화 함수는 서버 액션이라 적재 스크립트
 * 에서 직접 못 부르기 때문에, 스크립트가 두드릴 창구를 하나 둔다.
 *
 *   curl -X POST https://<host>/api/revalidate -H "x-revalidate-token: <TOKEN>"
 *
 * REVALIDATE_TOKEN 환경변수가 없으면 아무도 못 부른다 (열어두면 누구나
 * 캐시를 날려 DB 부하를 만들 수 있다).
 */

const TAGS = ["home-public", "categories", "explanations"] as const;

export async function POST(req: Request) {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_TOKEN 이 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const given =
    req.headers.get("x-revalidate-token") ??
    new URL(req.url).searchParams.get("token");

  if (given !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  for (const tag of TAGS) revalidateTag(tag);

  return NextResponse.json({
    ok: true,
    revalidated: TAGS,
    at: new Date().toISOString(),
  });
}
