import { PrismaClient } from "./generated/prisma-client";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * Vercel 서버리스에서 콜드 스타트마다 새 PrismaClient 가 만들어지면
 * 빠르게 connection limit 에 도달함. globalThis 에 싱글턴으로 보관해서
 * 같은 lambda warm container 내 재사용을 보장.
 *
 * DATABASE_URL 은 반드시 Prisma Accelerate URL (prisma://...) 이어야 함.
 * 직결 URL 을 쓰면 풀링 안 돼서 free tier 금방 막힘.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  }).$extends(withAccelerate());
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 항상 캐시 — 프로덕션에서도 warm container 안에서는 재사용해야 connection 폭주 방지.
globalForPrisma.prisma = prisma;

export default prisma;
