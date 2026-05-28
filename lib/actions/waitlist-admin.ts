"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/anon";
import type { WaitlistStatus } from "@/lib/generated/prisma-client";

async function assertAdmin() {
  const me = await getCurrentUser();
  if (!me || me.nickname !== "관리자") {
    // notFound 로 동작 — 권한 노출 회피
    notFound();
  }
  return me;
}

/** 상태 변경 (관리자만) */
export async function setWaitlistStatus(
  id: string,
  status: WaitlistStatus,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  try {
    await prisma.waitlist.update({
      where: { id },
      data: {
        status,
        confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
      },
    });
    revalidatePath("/admin/waitlist");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** 항목 삭제 (관리자만) */
export async function deleteWaitlistEntry(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  try {
    await prisma.waitlist.delete({ where: { id } });
    revalidatePath("/admin/waitlist");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** CSV 다운로드용 — 전체 명단을 escape 된 CSV 문자열로 반환 */
export async function exportWaitlistCsv(): Promise<string> {
  await assertAdmin();
  const rows = await prisma.waitlist.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "email",
    "status",
    "source",
    "referer",
    "createdAt",
    "confirmedAt",
    "notifiedAt",
  ];

  function csvCell(v: unknown): string {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.email),
        csvCell(r.status),
        csvCell(r.source),
        csvCell(r.referer),
        csvCell(r.createdAt),
        csvCell(r.confirmedAt),
        csvCell(r.notifiedAt),
      ].join(","),
    );
  }
  // BOM — Excel 한글 깨짐 방지
  return "﻿" + lines.join("\n");
}
