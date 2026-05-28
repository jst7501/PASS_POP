"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";

/** 유효한 이메일 형식인지 + 기본 sanity check */
function isValidEmail(raw: string): boolean {
  if (raw.length < 5 || raw.length > 254) return false;
  // RFC5322 풀 regex 는 과해서 실용적인 수준만
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(raw);
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export type WaitlistResult =
  | { ok: true; status: "subscribed" }
  | { ok: true; status: "already" }
  | { ok: false; error: string };

/**
 * 랜딩 페이지 폼에서 호출.
 * - 이메일 형식 검증
 * - 중복은 에러 아님 (이미 신청하셨어요)
 * - 폼 source (utm 등) 같이 받음
 */
export async function subscribeWaitlist(
  email: string,
  source?: string,
): Promise<WaitlistResult> {
  const normalized = email.trim().toLowerCase();

  if (!isValidEmail(normalized)) {
    return { ok: false, error: "이메일 형식을 확인해주세요." };
  }

  // 헤더에서 메타데이터 수집 (스팸 필터링·분석용, PII 최소화)
  const h = await headers();
  const userAgent = h.get("user-agent") ?? null;
  const referer = h.get("referer") ?? null;
  const rawIp =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const ipHash = hashIp(rawIp);

  try {
    // upsert 안 함 — 이미 있으면 알려주기 (스푸핑 방지: 항상 "신청됐어요" 식으로 모호하게 응답하는 옵션도 있지만 UX 우선)
    const existing = await prisma.waitlist.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    if (existing) {
      return { ok: true, status: "already" };
    }

    await prisma.waitlist.create({
      data: {
        email: normalized,
        source: source?.slice(0, 200) ?? null,
        referer: referer?.slice(0, 500) ?? null,
        userAgent: userAgent?.slice(0, 500) ?? null,
        ipHash,
      },
    });

    // admin 페이지 캐시 무효화
    revalidatePath("/admin/waitlist");

    return { ok: true, status: "subscribed" };
  } catch (err) {
    console.error("[waitlist] subscribe failed:", err);
    return {
      ok: false,
      error: "일시적 오류예요. 잠시 후 다시 시도해주세요.",
    };
  }
}
