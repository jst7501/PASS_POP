import "server-only";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma-client";

/**
 * 익명 유저 조회/생성
 * - 쿠키 세팅은 middleware.ts에서 수행 (Edge runtime)
 * - 여기선 쿠키의 UUID를 User.id로 삼아 조회·생성 (idempotent)
 * - 모든 서버 컴포넌트·서버 액션에서 안전하게 호출 가능
 *
 * race condition 대응:
 *  prisma.user.upsert 는 내부적으로 SELECT → 없으면 INSERT 인데, 동일 uid 로
 *  거의 동시에 두 요청이 들어오면 둘 다 INSERT 를 시도해 unique violation 이
 *  난다. (Next.js prefetch + actual nav 가 흔한 트리거)
 *  → findUnique → 없을 때만 create, P2002 시 한 번 더 findUniqueOrThrow.
 */
const COOKIE_NAME = "passpop_uid";

export async function getCurrentUser() {
  const jar = await cookies();
  const uid = jar.get(COOKIE_NAME)?.value;
  if (!uid) {
    // middleware 미동작 방어 — 정상 흐름에선 발생 안 함
    return null;
  }

  const existing = await prisma.user.findUnique({ where: { id: uid } });
  if (existing) return existing;

  try {
    return await prisma.user.create({
      data: {
        id: uid,
        email: `anon-${uid}@passpop.local`,
      },
    });
  } catch (e) {
    // 다른 동시 요청이 먼저 만들어 둔 경우 → 그 row 를 그대로 반환
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return prisma.user.findUniqueOrThrow({ where: { id: uid } });
    }
    throw e;
  }
}

// 기존 호출자 호환 (startAttempt 등에서 사용)
export async function getOrCreateAnonUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(
      "쿠키가 초기화되지 않았습니다. 새로고침 후 다시 시도해 주세요.",
    );
  }
  return user;
}
