"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import type { WaitlistTiming } from "@/lib/generated/prisma-client";

// ─────────────────────────────────────────────────────────────
// 검증 유틸
// ─────────────────────────────────────────────────────────────

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

/** 자유 입력 필드 정리 — 공백 정규화 + 길이 상한 + 빈 문자열은 null */
function clean(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.replace(/\s+/g, " ").trim().slice(0, max);
  return v.length > 0 ? v : null;
}

const TIMINGS = ["WITHIN_1M", "WITHIN_3M", "WITHIN_6M", "UNDECIDED"] as const;
const GRADES = ["기능사", "산업기사", "기사", "기술사", "공무원", "기타"] as const;

function parseTiming(raw: unknown): WaitlistTiming | null {
  return typeof raw === "string" && (TIMINGS as readonly string[]).includes(raw)
    ? (raw as WaitlistTiming)
    : null;
}

function parseGrade(raw: unknown): string | null {
  return typeof raw === "string" && (GRADES as readonly string[]).includes(raw)
    ? raw
    : null;
}

// ─────────────────────────────────────────────────────────────
// 레이트리밋 — DB 기준.
// 프로세스 메모리에 카운터를 두면 서버리스/멀티 워커에서 인스턴스마다
// 따로 세는 바람에 실제로는 거의 안 걸린다. 이미 DB 를 치는 김에
// 같은 ipHash 의 최근 가입 건수로 판단한다.
// ─────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;

async function isRateLimited(ipHash: string | null): Promise<boolean> {
  // 프록시 헤더가 없어 IP 를 못 잡는 환경에서는 판단 근거가 없다 — 허니팟에 맡긴다
  if (!ipHash) return false;
  const recent = await prisma.waitlist.count({
    where: { ipHash, createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) } },
  });
  return recent >= RATE_MAX;
}

// ─────────────────────────────────────────────────────────────
// 사전예약 신청
// ─────────────────────────────────────────────────────────────

export type WaitlistInput = {
  email: string;
  /** 목표 종목 — 자유 입력 ("토목기사") */
  targetCert?: string;
  /** 등급 — GRADES 화이트리스트 */
  targetGrade?: string;
  /** 시험 예정 시기 — TIMINGS 화이트리스트 */
  timing?: string;
  /** 오픈 안내 외 학습 팁·업데이트 수신 동의 */
  marketingOptIn?: boolean;
  /** 폼 출처 ("landing" / "landing-hero" 등) */
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** 허니팟 — 사람은 절대 채우지 않는 숨은 필드 */
  company?: string;
};

export type WaitlistResult =
  | { ok: true; status: "subscribed" }
  | { ok: true; status: "already" }
  | { ok: false; error: string };

/**
 * 랜딩 페이지 사전예약 폼에서 호출.
 * - 이메일 형식 검증 + 허니팟 + 레이트리밋
 * - 중복은 에러 아님 (이미 신청하셨어요) — 단, 추가 정보는 보강해서 저장
 * - 목표 종목 / 시험 시기 / UTM 을 함께 DB 에 적재
 */
export async function subscribeWaitlist(
  input: WaitlistInput,
): Promise<WaitlistResult> {
  const normalized = (input.email ?? "").trim().toLowerCase();

  // 허니팟에 값이 있으면 봇 — 성공한 척하고 조용히 버린다
  if (clean(input.company, 100)) {
    return { ok: true, status: "subscribed" };
  }

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

  const targetCert = clean(input.targetCert, 60);
  const targetGrade = parseGrade(input.targetGrade);
  const timing = parseTiming(input.timing);
  const marketingOptIn = input.marketingOptIn === true;

  try {
    const existing = await prisma.waitlist.findUnique({
      where: { email: normalized },
      select: { id: true, targetCert: true, targetGrade: true, timing: true },
    });

    if (existing) {
      // 재신청 = 정보 업데이트 기회. 이미 있는 값을 지우지는 않는다.
      const patch: Record<string, unknown> = {};
      if (targetCert && !existing.targetCert) patch.targetCert = targetCert;
      if (targetGrade && !existing.targetGrade) patch.targetGrade = targetGrade;
      if (timing && !existing.timing) patch.timing = timing;
      if (marketingOptIn) patch.marketingOptIn = true;

      if (Object.keys(patch).length > 0) {
        await prisma.waitlist.update({ where: { id: existing.id }, data: patch });
        revalidatePath("/admin/waitlist");
      }
      return { ok: true, status: "already" };
    }

    // 신규 등록만 막는다 — 위의 정보 보강 경로는 늘 통과
    if (await isRateLimited(ipHash)) {
      return {
        ok: false,
        error: "요청이 너무 잦아요. 잠시 후 다시 시도해주세요.",
      };
    }

    await prisma.waitlist.create({
      data: {
        email: normalized,
        targetCert,
        targetGrade,
        timing,
        marketingOptIn,
        source: clean(input.source, 200) ?? "landing",
        utmSource: clean(input.utmSource, 100),
        utmMedium: clean(input.utmMedium, 100),
        utmCampaign: clean(input.utmCampaign, 100),
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
