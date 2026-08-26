/**
 * 한국사능력검정시험 심화 — 기출 문항 + 프리미엄 해설 DB 적재
 *
 * 소스 (CBT 프로젝트, 이 저장소 밖):
 *   questions/한국사/k1.json                 문항·보기·정답·정답률
 *   sessions/한국사_k1_rounds.json           회차 번호 매핑 (20260809 → 79회)
 *   explanations/k1/<회차>/q01.json          문항별 프리미엄 해설
 *
 * 이미지는 scripts/export-korean-history-images.py 로 public/ 에 먼저 내보낸다.
 *
 * 기본은 dry-run. 실제로 쓰려면 --write 를 붙인다.
 *   pnpm tsx scripts/import-korean-history.ts
 *   pnpm tsx scripts/import-korean-history.ts --write --sessions 20260809
 */
import fs from "node:fs";
import path from "node:path";
import {
  PrismaClient,
  ExamGrade,
  QuestionType,
  ExplanationTone,
} from "../lib/generated/prisma-client";

const prisma = new PrismaClient();

const CBT_ROOT = process.env.CBT_DATA_ROOT ?? "C:/Users/jst75/pro/CBT";
const QUESTIONS_PATH = path.join(CBT_ROOT, "questions/한국사/k1.json");
const ROUNDS_PATH = path.join(CBT_ROOT, "sessions/한국사_k1_rounds.json");
const EXPL_ROOT = path.join(CBT_ROOT, "explanations/k1");
// 문항별 시대 분류 (scratchpad/build_subject_map.py 가 생성)
const SUBJECTS_PATH = path.join(EXPL_ROOT, "_subjects.json");

const CATEGORY_SLUG = "korean-history-simhwa";
const IMAGE_BASE = "/exam-images/korean-history-simhwa";
const MODEL_NAME = "claude-opus-5";
const DURATION_MIN = 80; // 한능검 심화 시험 시간

// ─────────────────────────────────────────────────────────────
// 소스 타입
// ─────────────────────────────────────────────────────────────
type RawChoice = { n: number; text: string; images: string[] };
type RawQuestion = {
  number: number;
  question_text: string;
  choices: RawChoice[];
  answer: number;
  answer_rate: number | null;
  question_images: string[];
  images: string[];
};
type RawSession = { date_label: string; image_dir?: string; questions: RawQuestion[] };
type RawData = { name: string; dbname: string; sessions: Record<string, RawSession> };
type RoundInfo = { round: number; year: number; date_label: string };
type SubjectDef = { slug: string; name: string; orderIdx: number };
type SubjectMap = {
  subjects: SubjectDef[];
  /** 회차 → 문항번호 → 과목 slug */
  byQuestion: Record<string, Record<string, string>>;
};

type ExplChoice = { n: number; isCorrect: boolean; md: string };
type Explanation = {
  number: number;
  answer: number;
  tldr: string;
  source: string | null;
  body: string;
  choices: ExplChoice[];
  trap: string | null;
  hook: string;
  extra: string | null;
  tags: string[];
};

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

/**
 * 적재 후 공개 캐시를 날린다.
 * 이걸 안 하면 /exams 목록과 카테고리 상세가 최대 1시간 동안 옛 데이터를 보여준다.
 * APP_URL / REVALIDATE_TOKEN 이 없으면 조용히 건너뛴다 (로컬 스크립트 실행 대비).
 */
async function revalidatePublicCache() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) {
    console.log(
      "\n  [캐시] REVALIDATE_TOKEN 이 없어 건너뜁니다 — 목록이 최대 1시간 옛 데이터일 수 있어요.",
    );
    return;
  }
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-token": token },
    });
    console.log(
      res.ok
        ? `\n  [캐시] 무효화 완료 (${base})`
        : `\n  [캐시] 무효화 실패 — ${res.status}`,
    );
  } catch (e) {
    console.log(`\n  [캐시] 무효화 요청 실패 — ${(e as Error).message}`);
  }
}

/** 정답률 → 난이도 1(쉬움)~5(어려움) */
function difficultyFromRate(rate: number | null): number {
  if (rate === null) return 3;
  if (rate >= 80) return 1;
  if (rate >= 65) return 2;
  if (rate >= 50) return 3;
  if (rate >= 35) return 4;
  return 5;
}

/** comcbt 이미지 URL → public 경로 (.gif → .webp) */
function imagePath(session: string, url: string): string {
  const file = url.split("?")[0].split("/").pop() ?? "";
  const stem = file.replace(/\.[^.]+$/, "");
  return `${IMAGE_BASE}/${session}/${stem}.webp`;
}

/** 프리미엄 해설 구간들을 하나의 마크다운으로 잇는다 (sections 에 원본 구조가 남는다) */
function toMarkdown(e: Explanation): string {
  return [e.tldr, e.source, e.body, e.trap, e.extra]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join("\n\n");
}

function loadExplanations(session: string): Map<number, Explanation> {
  const dir = path.join(EXPL_ROOT, session);
  const out = new Map<number, Explanation>();
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((f) => /^q\d+\.json$/.test(f))) {
    const e = readJson<Explanation>(path.join(dir, f));
    out.set(e.number, e);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 적재
// ─────────────────────────────────────────────────────────────
async function importSession(
  session: string,
  raw: RawSession,
  round: RoundInfo,
  categoryId: string,
  subjectIds: Map<string, string>,
  eraByNumber: Record<string, string>,
  fallbackSubjectId: string,
  write: boolean,
) {
  const expls = loadExplanations(session);
  const title = `한국사능력검정시험 심화 ${round.round}회`;

  const stats = {
    session,
    round: round.round,
    questions: raw.questions.length,
    withExplanation: 0,
    explanationRows: 0,
    missing: [] as number[],
  };

  for (const q of raw.questions) {
    if (expls.has(q.number)) {
      stats.withExplanation += 1;
      // 전체 해설 1건 + 보기별 5건
      stats.explanationRows += 1 + (expls.get(q.number)?.choices.length ?? 0);
    } else {
      stats.missing.push(q.number);
    }
  }

  if (!write) return stats;

  const exam = await prisma.exam.upsert({
    where: {
      categoryId_year_round: { categoryId, year: round.year, round: round.round },
    },
    update: { title, durationMin: DURATION_MIN, totalQuestions: raw.questions.length },
    create: {
      categoryId,
      year: round.year,
      round: round.round,
      title,
      durationMin: DURATION_MIN,
      totalQuestions: raw.questions.length,
      source: "comcbt.com",
    },
  });

  // 이 회차의 기존 문항 정리 (AiExplanation 은 cascade)
  const old = await prisma.question.findMany({
    where: { examId: exam.id },
    select: { id: true },
  });
  if (old.length > 0) {
    const ids = old.map((o) => o.id);
    await prisma.answerRecord.deleteMany({ where: { questionId: { in: ids } } });
    await prisma.question.deleteMany({ where: { id: { in: ids } } });
  }

  for (const q of raw.questions) {
    const e = expls.get(q.number);
    const bodyImage = q.question_images[0];

    const created = await prisma.question.create({
      data: {
        examId: exam.id,
        subjectId:
          subjectIds.get(eraByNumber[String(q.number)] ?? "") ?? fallbackSubjectId,
        number: q.number,
        type: QuestionType.MCQ5,
        stem: q.question_text,
        choices: q.choices.map((c) => ({
          label: String(c.n),
          text: c.text,
          imageUrl: c.images[0] ? imagePath(session, c.images[0]) : null,
        })),
        correctAnswer: String(q.answer),
        difficulty: difficultyFromRate(q.answer_rate),
        tags: e?.tags ?? [],
        hasImage: q.question_images.length > 0,
        imageUrl: bodyImage ? imagePath(session, bodyImage) : null,
        explanationSeed:
          q.answer_rate !== null ? `원본 정답률 ${q.answer_rate}%` : null,
      },
    });

    if (!e) continue;

    // 전체 해설 — 자료 해독이 여기 들어가므로 지문 없는 문제의 텍스트 보강 역할도 한다
    await prisma.aiExplanation.create({
      data: {
        questionId: created.id,
        wrongChoice: null,
        explanation: toMarkdown(e),
        memoryHook: e.hook,
        sections: {
          tldr: e.tldr,
          source: e.source,
          body: e.body,
          trap: e.trap,
          extra: e.extra,
        },
        model: MODEL_NAME,
        tone: ExplanationTone.FRIENDLY,
      },
    });

    // 보기별 해설
    for (const c of e.choices) {
      await prisma.aiExplanation.create({
        data: {
          questionId: created.id,
          wrongChoice: String(c.n),
          explanation: c.md,
          model: MODEL_NAME,
          tone: ExplanationTone.FRIENDLY,
        },
      });
    }
  }

  return stats;
}

async function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes("--write");
  const sIdx = argv.indexOf("--sessions");
  const only = sIdx >= 0 ? argv.slice(sIdx + 1).filter((a) => /^\d{8}$/.test(a)) : null;

  const raw = readJson<RawData>(QUESTIONS_PATH);
  const rounds = readJson<Record<string, RoundInfo>>(ROUNDS_PATH);

  const sessions = (only && only.length > 0 ? only : Object.keys(raw.sessions)).sort().reverse();

  console.log(`${write ? "적재" : "DRY-RUN"} — ${sessions.length}개 회차\n`);

  const subjectMap = readJson<SubjectMap>(SUBJECTS_PATH);

  let categoryId = "(dry-run)";
  const subjectIds = new Map<string, string>();
  let fallbackSubjectId = "(dry-run)";

  if (write) {
    const category = await prisma.category.upsert({
      where: { slug: CATEGORY_SLUG },
      update: { name: "한국사능력검정시험 심화" },
      create: {
        slug: CATEGORY_SLUG,
        name: "한국사능력검정시험 심화",
        nameEn: "Korean History Proficiency Test (Advanced)",
        grade: ExamGrade.ETC,
        field: "한국사",
        description: "1~3급 인증 시험. 50문항 5지선다, 80분.",
        colorTag: "#C0392B",
      },
    });
    categoryId = category.id;

    // 한능검 시험지 자체에는 과목 구분이 없지만, 문항이 시대순으로 배열되고
    // 학습·약점 분석도 시대 단위로 하는 게 맞아 시대를 과목으로 쓴다.
    for (const s of subjectMap.subjects) {
      const subject = await prisma.subject.upsert({
        where: { categoryId_slug: { categoryId, slug: s.slug } },
        update: { name: s.name, orderIdx: s.orderIdx },
        create: {
          categoryId,
          slug: s.slug,
          name: s.name,
          orderIdx: s.orderIdx,
        },
      });
      subjectIds.set(s.slug, subject.id);
    }
    fallbackSubjectId = subjectIds.get("integrated") ?? "";
  }

  const all: Awaited<ReturnType<typeof importSession>>[] = [];
  for (const s of sessions) {
    const sess = raw.sessions[s];
    const round = rounds[s];
    if (!sess) {
      console.log(`  [건너뜀] ${s}: 문항 데이터 없음`);
      continue;
    }
    if (!round) {
      console.log(`  [건너뜀] ${s}: 회차 번호 매핑 없음`);
      continue;
    }
    const st = await importSession(
      s,
      sess,
      round,
      categoryId,
      subjectIds,
      subjectMap.byQuestion[s] ?? {},
      fallbackSubjectId,
      write,
    );
    all.push(st);
    const miss = st.missing.length > 0 ? ` / 해설없음 ${st.missing.length}문항` : "";
    console.log(
      `  ${s} ${st.round}회: 문항 ${st.questions} / 해설 ${st.withExplanation}` +
        ` (레코드 ${st.explanationRows})${miss}`,
    );
  }

  if (write) {
    // 문항이 다 옮겨간 뒤에 빈 과목 정리 (예전 단일 과목 "한국사" 등).
    // 재배정 전에 지우려 하면 아직 문항이 붙어 있어 안 지워진다.
    const removed = await prisma.subject.deleteMany({
      where: { categoryId, questions: { none: {} } },
    });
    if (removed.count > 0) {
      console.log(`\n  빈 과목 ${removed.count}개 정리`);
    }
  }

  if (write) await revalidatePublicCache();

  const q = all.reduce((a, b) => a + b.questions, 0);
  const e = all.reduce((a, b) => a + b.withExplanation, 0);
  const rows = all.reduce((a, b) => a + b.explanationRows, 0);
  console.log(`\n합계: 문항 ${q} / 해설 있는 문항 ${e} / AiExplanation 레코드 ${rows}`);
  if (!write) console.log("\n실제로 쓰려면 --write 를 붙여 다시 실행하세요.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
