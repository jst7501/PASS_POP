"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getOrCreateAnonUser } from "@/lib/auth/anon";

const COOKIE_NAME = "passpop_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

// ─────────────────────────────────────────────────────────────
// Nickname 기반 초간단 로그인
// - 닉네임 이미 존재 → 그 user 의 id 로 쿠키 스왑 (비밀번호 없음)
// - 닉네임 없음 → 현재 쿠키 유저에 nickname 세팅
// - "관리자" 닉은 admin 권한
// ─────────────────────────────────────────────────────────────

function normalizeNickname(raw: string): string {
  return raw.trim();
}

export async function setNickname(
  raw: string,
): Promise<
  | { ok: true; nickname: string; admin: boolean }
  | { ok: false; error: string }
> {
  const nickname = normalizeNickname(raw);
  if (!nickname) return { ok: false, error: "닉네임을 입력해주세요." };
  if (nickname.length > 24)
    return { ok: false, error: "닉네임이 너무 길어요. 24자 이내." };

  const user = await getOrCreateAnonUser();

  // 이미 누군가 쓰고 있는 닉네임?
  const existing = await prisma.user.findFirst({
    where: { nickname },
  });

  if (existing && existing.id !== user.id) {
    // 쿠키 스왑 — 닉네임 가진 계정으로 "로그인"
    const jar = await cookies();
    jar.set(COOKIE_NAME, existing.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
      secure: process.env.NODE_ENV === "production",
    });
    revalidatePath("/", "layout");
    return { ok: true, nickname, admin: nickname === "관리자" };
  }

  // 현재 유저에 닉네임 세팅
  await prisma.user.update({
    where: { id: user.id },
    data: { nickname },
  });
  revalidatePath("/", "layout");
  return { ok: true, nickname, admin: nickname === "관리자" };
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Bookmark (북마크 / 나중에 볼 문제)
// ─────────────────────────────────────────────────────────────

export async function toggleBookmark(questionId: string) {
  const user = await getOrCreateAnonUser();
  const existing = await prisma.bookmark.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_questionId: { userId: user.id, questionId } },
    });
    revalidatePath("/bookmarks");
    return { bookmarked: false };
  }

  await prisma.bookmark.create({
    data: { userId: user.id, questionId },
  });
  revalidatePath("/bookmarks");
  return { bookmarked: true };
}

// ─────────────────────────────────────────────────────────────
// Confidence — AnswerRecord.confidence 업데이트
// (enum 추가 후 prisma client 재생성 전까지 raw sql 사용)
// ─────────────────────────────────────────────────────────────

export async function setConfidence(
  recordId: string,
  confidence: "GUESS" | "UNSURE" | "CONFIDENT",
) {
  const user = await getOrCreateAnonUser();
  const rec = await prisma.answerRecord.findUnique({
    where: { id: recordId },
    select: { userId: true },
  });
  if (!rec || rec.userId !== user.id) return { ok: false };

  await prisma.$executeRaw`UPDATE "AnswerRecord" SET "confidence" = ${confidence}::"ConfidenceLevel" WHERE "id" = ${recordId}`;
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// QuestionNote — 풀이 중 자유 메모
// ─────────────────────────────────────────────────────────────

export async function saveQuestionNote(
  questionId: string,
  content: string,
) {
  const user = await getOrCreateAnonUser();
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    // 빈 내용이면 삭제
    await prisma.questionNote.deleteMany({
      where: { userId: user.id, questionId },
    });
    return { ok: true, removed: true };
  }
  await prisma.questionNote.upsert({
    where: { userId_questionId: { userId: user.id, questionId } },
    create: { userId: user.id, questionId, content: trimmed },
    update: { content: trimmed },
  });
  return { ok: true, removed: false };
}

// ─────────────────────────────────────────────────────────────
// 시험 목표 (D-day, 일일 목표) 저장
// ─────────────────────────────────────────────────────────────

export async function saveExamGoal(args: {
  categoryId: string | null;
  examDate: string | null; // ISO string
  dailyGoal: number | null;
}) {
  const user = await getOrCreateAnonUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      targetCategoryId: args.categoryId,
      targetExamDate: args.examDate ? new Date(args.examDate) : null,
      dailyGoal: args.dailyGoal,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Streak — 오늘 활동 마킹
// ─────────────────────────────────────────────────────────────

export async function markTodayActivity() {
  try {
    const user = await getOrCreateAnonUser();
    const today = startOfDay(new Date());
    const last = user.lastActivityDate
      ? startOfDay(new Date(user.lastActivityDate))
      : null;

    if (last && last.getTime() === today.getTime()) {
      return { streakDays: user.streakDays, unchanged: true };
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const continued = last && last.getTime() === yesterday.getTime();
    const nextStreak = continued ? (user.streakDays ?? 0) + 1 : 1;

    await prisma.user.update({
      where: { id: user.id },
      data: { streakDays: nextStreak, lastActivityDate: today },
    });

    return { streakDays: nextStreak, unchanged: false };
  } catch {
    // streakDays/lastActivityDate 컬럼이 아직 DB에 없으면 무시
    return { streakDays: 0, unchanged: true };
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// ─────────────────────────────────────────────────────────────
// ReviewSchedule — SM-2 경량 구현
// ─────────────────────────────────────────────────────────────

export async function scheduleReview(
  questionId: string,
  wasCorrect: boolean,
) {
  const user = await getOrCreateAnonUser();
  const existing = await prisma.reviewSchedule.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });

  const now = new Date();
  let interval: number;
  let ease: number;
  let reps: number;

  if (!existing) {
    interval = wasCorrect ? 3 : 1;
    ease = 2.5;
    reps = wasCorrect ? 1 : 0;
  } else {
    if (wasCorrect) {
      reps = existing.repetitions + 1;
      ease = Math.min(existing.easeFactor + 0.1, 3.0);
      interval = Math.round(existing.intervalDays * ease);
    } else {
      reps = 0;
      ease = Math.max(existing.easeFactor - 0.2, 1.3);
      interval = 1;
    }
  }

  const next = new Date(now);
  next.setDate(next.getDate() + interval);

  await prisma.reviewSchedule.upsert({
    where: { userId_questionId: { userId: user.id, questionId } },
    create: {
      userId: user.id,
      questionId,
      nextReviewAt: next,
      intervalDays: interval,
      easeFactor: ease,
      repetitions: reps,
      lastReviewAt: now,
    },
    update: {
      nextReviewAt: next,
      intervalDays: interval,
      easeFactor: ease,
      repetitions: reps,
      lastReviewAt: now,
    },
  });
}
