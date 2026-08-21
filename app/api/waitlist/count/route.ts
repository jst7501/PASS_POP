import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * 사전예약 신청자 수 — 랜딩 페이지 카운터용.
 *
 * 랜딩(`/`)은 force-static 이라 빌드 타임에 DB 를 읽을 수 없다.
 * 그래서 숫자만 이 라우트에서 따로 내려주고, 클라이언트가 마운트 후 붙인다.
 * DB 가 없는 환경(로컬/프리뷰 빌드)에서도 페이지는 그대로 떠야 하므로
 * 실패 시에도 200 + count: null 로 응답한다.
 *
 * force-dynamic 인 이유: 빌드 타임 프리렌더에 DB 가 없으면 null 이 그대로
 * 굳어버린다. 대신 s-maxage 로 CDN 에서 60초 캐시한다.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.waitlist.count({
      where: { status: { in: ["PENDING", "CONFIRMED"] } },
    });
    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("[waitlist] count failed:", err);
    return NextResponse.json({ count: null });
  }
}
