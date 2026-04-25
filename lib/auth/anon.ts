import "server-only";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * 익명 유저 조회/생성
 * - 쿠키 세팅은 middleware.ts에서 수행 (Edge runtime)
 * - 여기선 쿠키의 UUID를 User.id로 삼아 upsert (idempotent)
 * - 모든 서버 컴포넌트·서버 액션에서 안전하게 호출 가능
 */
const COOKIE_NAME = "passpop_uid";

export async function getCurrentUser() {
  const jar = await cookies();
  const uid = jar.get(COOKIE_NAME)?.value;
  if (!uid) {
    // middleware 미동작 방어 — 정상 흐름에선 발생 안 함
    return null;
  }

  return prisma.user.upsert({
    where: { id: uid },
    create: {
      id: uid,
      email: `anon-${uid}@passpop.local`,
    },
    update: {},
  });
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
