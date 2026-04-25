import { PrismaClient } from "./generated/prisma-client";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * Vercel 서버리스 + Prisma Postgres free tier 조합 주의:
 *  1) 콜드 스타트마다 새 PrismaClient → globalThis 싱글턴으로 방어.
 *  2) 직결 URL 은 Prisma 기본 풀이 CPU×2+1 (≈9~17) 만큼 연결 시도.
 *     free tier 한도 (~3-5) 를 즉시 초과 → connection_limit=1 강제.
 *  3) 진짜 해결책은 DATABASE_URL 을 Prisma Accelerate URL (prisma://...)
 *     로 교체하는 것. 그때는 자동으로 connection_limit 무시함.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function getDbUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  if (!base) return base;
  // 이미 명시된 connection_limit 이 있으면 손대지 않음
  if (base.includes("connection_limit=")) return base;
  // Accelerate URL 은 프록시가 풀링 처리 — 클라이언트 limit 의미 없음
  if (base.startsWith("prisma:") || base.startsWith("prisma+")) return base;
  // 직결 URL → 풀 강제로 1개 + 큐 대기 20초
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}connection_limit=1&pool_timeout=20`;
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: getDbUrl(),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  }).$extends(withAccelerate());
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 항상 캐시 — production 도 warm container 안에서는 재사용해야 connection 폭주 방지.
globalForPrisma.prisma = prisma;

export default prisma;
