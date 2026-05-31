import fs from "node:fs";
import path from "node:path";
import {
  PrismaClient,
  ExamGrade,
  QuestionType,
  ExplanationTone,
} from "../lib/generated/prisma-client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// 기출 데이터 소스
// ─────────────────────────────────────────────────────────────
// 외부 기출 데이터 루트. 작성자 로컬 경로가 기본값이며,
// 다른 머신에서는 PASSPOP_DATA_ROOT 로 덮어쓸 수 있음.
const DATA_ROOT = process.env.PASSPOP_DATA_ROOT ?? "C:/Users/jst75/pro/jst7501.github.io/c";

type RawChoice = { n: number; text: string };
type RawQuestion = {
  number: number;
  subject_name: string;
  question_text: string;
  choices: RawChoice[];
  answer: number;
  explanation?: string;
  correct_rate?: number;
};
type RoundData = {
  cert: { slug: string; name: string; level: string };
  session: { tablename: string; date: string; label: string };
  subjects: string[];
  questions: RawQuestion[];
};
type MetaData = {
  slug: string;
  name: string;
  level: string;
  sessions: { tablename: string; date: string; label: string }[];
};

type ImportTarget = {
  dirName: string; // 실제 한글 폴더명
  appSlug: string; // DB에 쓸 영문 slug
  appName: string;
  appNameEn: string;
  field: string;
  description: string;
  colorTag: string;
  grade: ExamGrade;
  roundTablenames: string[]; // 가져올 회차 tablename (최신순 원하는)
  durationMin: number;
  officialTotal: number;
};

const TARGETS: ImportTarget[] = [
  {
    dirName: "공조냉동기계기사",
    appSlug: "hvac-refrigeration-gisa",
    appName: "공조냉동기계기사",
    appNameEn: "HVAC & Refrigeration Engineer",
    field: "기계",
    description: "호준.",
    colorTag: "#00B4AA",
    grade: ExamGrade.GI_SA,
    roundTablenames: ["20220424", "20220305"],
    durationMin: 150,
    officialTotal: 100,
  },
  {
    dirName: "토목기사",
    appSlug: "civil-engineer-gisa",
    appName: "토목기사",
    appNameEn: "Civil Engineer",
    field: "건설",
    description: "정호.",
    colorTag: "#FF4438",
    grade: ExamGrade.GI_SA,
    roundTablenames: ["20220424"],
    durationMin: 150,
    officialTotal: 120,
  },
];

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
function slugify(s: string): string {
  return s
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "subject";
}

function detectHasImage(text: string): boolean {
  return /(그림|도식|도면|아래.{0,3}(그림|도))/u.test(text);
}

function detectHasMath(text: string): boolean {
  return /[\\$^_{}=]|kJ|kW|°C|kg\/|m\/s|N·m|\bh_|\bT_|\bR\b/u.test(text);
}

/** 원문자 깨짐 방지 치환 */
function normalizeChoiceMarks(s: string): string {
  return s
    .replace(/①/g, "1)")
    .replace(/②/g, "2)")
    .replace(/③/g, "3)")
    .replace(/④/g, "4)")
    .replace(/⑤/g, "5)")
    .replace(/⑥/g, "6)");
}

/**
 * 원본 comcbt 해설을 친근 톤 HTML로 변환
 * - 메타 정보(작성자, 오류신고, 댓글) 제거
 * - 원문자 치환 (①→1))
 * - 문어체 → 존댓말 어미 치환
 * - 정답 도입부 추가
 */
// ─────────────────────────────────────────────────────────────
// Hand-written 해설 등록 맵
// key: `${appSlug}::${tablename}` → number → { html, memoryHook? }
// 이 맵에 있는 문제만 AiExplanation 생성. 원본 comcbt 해설은 저장·공개 금지.
// ─────────────────────────────────────────────────────────────
import { HVAC_20220305_EXPLANATIONS } from "./data/explanations-hvac-20220305";
import { HVAC_20220424_EXPLANATIONS } from "./data/explanations-hvac-20220424";
import { CIVIL_20220424_EXPLANATIONS } from "./data/explanations-civil-20220424";
import type { ChoiceFeedback, ExplanationEntry } from "./data/explanations-hvac-20220305";

type HandEntry = {
  html: string;
  memoryHook?: string;
  choiceFeedback?: ChoiceFeedback[];
};

function buildHandMap(entries: ExplanationEntry[]): Map<number, HandEntry> {
  return new Map(
    entries.map((e) => [
      e.number,
      {
        html: e.html,
        memoryHook: e.memoryHook,
        choiceFeedback: e.choiceFeedback,
      },
    ]),
  );
}

const HAND_WRITTEN: Record<string, Map<number, HandEntry>> = {
  "hvac-refrigeration-gisa::20220305": buildHandMap(HVAC_20220305_EXPLANATIONS),
  "hvac-refrigeration-gisa::20220424": buildHandMap(HVAC_20220424_EXPLANATIONS),
  "civil-engineer-gisa::20220424": buildHandMap(CIVIL_20220424_EXPLANATIONS),
};

// ─────────────────────────────────────────────────────────────
// Import 한 종목 × 여러 회차
// ─────────────────────────────────────────────────────────────
async function importTarget(t: ImportTarget) {
  // 1) Category upsert
  const category = await prisma.category.upsert({
    where: { slug: t.appSlug },
    update: {
      name: t.appName,
      nameEn: t.appNameEn,
      grade: t.grade,
      field: t.field,
      description: t.description,
      colorTag: t.colorTag,
    },
    create: {
      slug: t.appSlug,
      name: t.appName,
      nameEn: t.appNameEn,
      grade: t.grade,
      field: t.field,
      description: t.description,
      colorTag: t.colorTag,
    },
  });

  // 2) 기존 카테고리 소속 Question 과 종속 레코드 전부 정리
  const oldQs = await prisma.question.findMany({
    where: { subject: { categoryId: category.id } },
    select: { id: true },
  });
  const oldQIds = oldQs.map((q) => q.id);
  if (oldQIds.length > 0) {
    await prisma.answerRecord.deleteMany({ where: { questionId: { in: oldQIds } } });
    // AiExplanation/ReviewSchedule/Bookmark 는 Question cascade 로 자동
    await prisma.question.deleteMany({ where: { id: { in: oldQIds } } });
  }
  // 기존 Attempt 중 이 카테고리 Exam 참조 것 정리 (회차 구조 바뀔 수 있으므로)
  const oldExams = await prisma.exam.findMany({ where: { categoryId: category.id }, select: { id: true } });
  const oldExamIds = oldExams.map((e) => e.id);
  if (oldExamIds.length > 0) {
    await prisma.attempt.deleteMany({ where: { examId: { in: oldExamIds } } });
    await prisma.exam.deleteMany({ where: { id: { in: oldExamIds } } });
  }

  // 3) 회차 데이터 로드
  const roundsRaw: RoundData[] = [];
  for (const tablename of t.roundTablenames) {
    const file = path.join(DATA_ROOT, t.dirName, "s", tablename, "data.json");
    if (!fs.existsSync(file)) {
      console.warn(`[etl] 파일 없음: ${file}`);
      continue;
    }
    const json = JSON.parse(fs.readFileSync(file, "utf8")) as RoundData;
    roundsRaw.push(json);
  }
  if (roundsRaw.length === 0) {
    // 외부 data.json 이 없는 환경 → 이 종목은 건너뜀 (전체 시드 중단 방지)
    console.warn(`[etl] ${t.appName} 회차 데이터 없음 — 건너뜀 (PASSPOP_DATA_ROOT 설정 시 적재됨)`);
    return null;
  }

  // 4) 전체 과목 합집합 수집 + 순서 유지
  const subjectOrder: string[] = [];
  for (const r of roundsRaw) {
    for (const s of r.subjects) {
      if (!subjectOrder.includes(s)) subjectOrder.push(s);
    }
  }
  // 기존 Subject 정리 (새 목록과 다른 slug 제거)
  const newSlugs = new Set(subjectOrder.map(slugify));
  const existingSubjects = await prisma.subject.findMany({ where: { categoryId: category.id } });
  for (const s of existingSubjects) {
    if (!newSlugs.has(s.slug)) {
      await prisma.subject.delete({ where: { id: s.id } });
    }
  }
  // Subject upsert
  const subjectBySlug = new Map<string, { id: string; name: string; orderIdx: number }>();
  for (let i = 0; i < subjectOrder.length; i += 1) {
    const name = subjectOrder[i];
    const slug = slugify(name);
    const row = await prisma.subject.upsert({
      where: { categoryId_slug: { categoryId: category.id, slug } },
      update: { name, orderIdx: i + 1 },
      create: { categoryId: category.id, slug, name, orderIdx: i + 1 },
    });
    subjectBySlug.set(name, { id: row.id, name: row.name, orderIdx: row.orderIdx });
  }

  // 5) 회차 정렬 및 연간 round 번호 부여
  const sortedRounds = [...roundsRaw].sort((a, b) => a.session.date.localeCompare(b.session.date));
  const yearCounter = new Map<number, number>();
  const roundOrder = sortedRounds.map((r) => {
    const year = parseInt(r.session.date.slice(0, 4), 10);
    const next = (yearCounter.get(year) ?? 0) + 1;
    yearCounter.set(year, next);
    return { raw: r, year, round: next };
  });

  // 6) 각 회차 처리
  let totalQ = 0;
  let totalE = 0;
  for (const { raw, year, round } of roundOrder) {
    // public/exam-pdfs/[cert]/[tablename].pdf 가 있으면 pdfUrl 세팅
    const pdfFsPath = path.resolve(
      process.cwd(),
      `public/exam-pdfs/${t.appSlug}/${raw.session.tablename}.pdf`,
    );
    const pdfUrl = fs.existsSync(pdfFsPath)
      ? `/exam-pdfs/${t.appSlug}/${raw.session.tablename}.pdf`
      : null;

    const exam = await prisma.exam.create({
      data: {
        categoryId: category.id,
        year,
        round,
        title: `${t.appName} ${year}년 ${round}회 (${raw.session.label})`,
        durationMin: t.durationMin,
        totalQuestions: t.officialTotal,
        source: "큐넷 복원",
        pdfUrl,
      },
    });

    // Question + Explanation 일괄
    const questionCreates: {
      subjectId: string;
      examId: string;
      number: number;
      stem: string;
      choices: { label: string; text: string }[];
      correctAnswer: string;
      hasMath: boolean;
      hasImage: boolean;
      explanationSeed: string | null;
      tags: string[];
    }[] = [];
    const explanationCreates: {
      qKey: string;
      wrongChoice: string | null;
      html: string;
      memoryHook?: string;
    }[] = [];

    for (const q of raw.questions) {
      const subj = subjectBySlug.get(q.subject_name);
      if (!subj) continue;

      const hasImage = detectHasImage(q.question_text);
      const stemClean = normalizeChoiceMarks(q.question_text);
      // 그림은 public/exam-images/<cert>/<date>/manifest.json 에서 별도 매칭됨.
      // 더 이상 stem 에 placeholder 텍스트 추가하지 않음.
      const stemFinal = stemClean;

      const choices = q.choices
        .slice(0, 5)
        .map((c) => ({
          label: String(c.n),
          text: normalizeChoiceMarks(c.text),
        }));

      questionCreates.push({
        subjectId: subj.id,
        examId: exam.id,
        number: q.number,
        stem: stemFinal,
        choices,
        correctAnswer: String(q.answer),
        hasMath: detectHasMath(q.question_text),
        hasImage,
        // 원본 comcbt 해설은 DB 저장 금지 (공개 차단)
        explanationSeed: null,
        tags: [q.subject_name, `${year}-${round}`],
      });

      // hand-written 해설만 등록. 없으면 해설 미게시.
      const handMap = HAND_WRITTEN[`${t.appSlug}::${raw.session.tablename}`];
      const hand = handMap?.get(q.number);
      if (hand) {
        // general (전체 해설, wrongChoice=null) — 정답·오답 모두에게 노출
        explanationCreates.push({
          qKey: `${subj.id}::${q.number}`,
          wrongChoice: null,
          html: hand.html,
          memoryHook: hand.memoryHook,
        });
        // 선택지별 개별 피드백 — 정답·오답 모두 포함 (각 선택지 클릭 시 노출)
        if (hand.choiceFeedback) {
          for (const cf of hand.choiceFeedback) {
            explanationCreates.push({
              qKey: `${subj.id}::${q.number}`,
              wrongChoice: String(cf.choice),
              html: cf.html,
            });
          }
        }
      }
    }

    // Question 일괄 create (createMany 후 id 알 수 없으니 개별 create)
    const created = await prisma.$transaction(
      questionCreates.map((qd) =>
        prisma.question.create({
          data: {
            subjectId: qd.subjectId,
            examId: qd.examId,
            number: qd.number,
            type: qd.choices.length === 5 ? QuestionType.MCQ5 : QuestionType.MCQ4,
            stem: qd.stem,
            choices: qd.choices,
            correctAnswer: qd.correctAnswer,
            hasMath: qd.hasMath,
            hasImage: qd.hasImage,
            difficulty: 3,
            tags: qd.tags,
            explanationSeed: qd.explanationSeed,
          },
        }),
      ),
    );

    // Explanation 적재 (general, wrongChoice=null)
    const qKeyToId = new Map<string, string>();
    created.forEach((c, i) => {
      const qd = questionCreates[i];
      qKeyToId.set(`${qd.subjectId}::${qd.number}`, c.id);
    });
    const explData: {
      questionId: string;
      userId: null;
      wrongChoice: string | null;
      explanation: string;
      memoryHook: string | null;
      model: string;
      tone: ExplanationTone;
    }[] = [];
    for (const e of explanationCreates) {
      const qid = qKeyToId.get(e.qKey);
      if (!qid) continue;
      explData.push({
        questionId: qid,
        userId: null,
        wrongChoice: e.wrongChoice,
        explanation: e.html,
        memoryHook: e.memoryHook ?? null,
        model: "hand-written",
        tone: ExplanationTone.FRIENDLY,
      });
    }
    if (explData.length > 0) {
      await prisma.aiExplanation.createMany({ data: explData });
    }

    totalQ += created.length;
    totalE += explData.length;
    console.log(
      `  [round] ${year}-${round} (${raw.session.label}) — 문제 ${created.length}, 해설 ${explData.length}`,
    );
  }

  return { name: t.appName, subjects: subjectOrder.length, rounds: roundOrder.length, questions: totalQ, explanations: totalE };
}

// ─────────────────────────────────────────────────────────────
// 정해일 문답고사 — 3D프린터 기능사로 위장 (창작, 유지)
// ─────────────────────────────────────────────────────────────
const JEONGHAEIL = {
  slug: "3d-printer-gineungsa",
  name: "3D프린터 기능사",
  nameEn: "3D Printer Operator",
  field: "제조/IT",
  description: "호성.",
  colorTag: "#FF4438",
  subjects: [{ slug: "jeonghaeil", name: "정해일 상식" }],
  exam: { year: 2024, round: 1, durationMin: 30, totalQuestions: 10 },
  questions: [
    { number: 1, stem: "정해일의 차는?", choices: ["제네시스 G70", "BMW 320i", "쏘나타", "K5"], correct: "1" },
    { number: 2, stem: "정해일의 클래스는?", choices: ["평민", "일반인", "최고존엄", "고양이"], correct: "3" },
    { number: 3, stem: "정해일의 IQ는?", choices: ["80", "100", "120", "150"], correct: "3" },
    { number: 4, stem: "정해일의 고향은?", choices: ["서울", "대구", "안동", "부산"], correct: "3" },
    { number: 5, stem: "정해일의 생일은?", choices: ["6월 15일", "7월 22일", "8월 13일", "12월 25일"], correct: "2" },
    { number: 6, stem: "정해일의 하루 물 섭취량은?", choices: ["500ml", "1L", "2L", "3L"], correct: "3" },
    { number: 7, stem: "정해일은 주 몇 회 운동을 할까요?", choices: ["안 함", "주 1~2회", "주 3~4회", "매일"], correct: "3" },
    { number: 8, stem: "정해일의 연애 횟수는?", choices: ["1회", "2회", "3회", "5회"], correct: "3" },
    { number: 9, stem: "정해일의 연애 총 기간은?", choices: ["3년", "5년", "7년", "10년"], correct: "3" },
    { number: 10, stem: "정해일이 가장 좋아하는 롤 챔피언은?", choices: ["리븐", "사미라", "그레이브즈", "카밀"], correct: "3" },
  ],
  explanations: [
    { number: 1, wrongChoice: null, html: `<p>정답은 <strong>1번 제네시스 G70</strong>이에요.</p><p>해일이는 한국차 감성파예요. G70 특유의 묵직한 주행감을 좋아해요.</p>` },
    { number: 1, wrongChoice: "2", html: `<p>2번 BMW 320i를 고르셨네요. 해일이를 독일차파로 보셨나 본데, 그쪽은 아니에요.</p><p>해일이는 <strong>제네시스 G70</strong> 타고 다녀요.</p>` },
    { number: 1, wrongChoice: "3", html: `<p>3번 쏘나타를 고르셨네요. 해일이 클래스를 너무 일반적으로 보신 것 같아요.</p><p>해일이는 <strong>제네시스 G70</strong>입니다.</p>` },
    { number: 1, wrongChoice: "4", html: `<p>4번 K5를 고르셨네요. K5도 좋은 차지만 해일이는 한 단계 위로 갔어요.</p><p>정답은 <strong>제네시스 G70</strong>이에요.</p>` },
    { number: 2, wrongChoice: null, html: `<p>정답은 <strong>3번 최고존엄</strong>이에요.</p><p>설명이 필요 없는 클래스예요.</p>` },
    { number: 2, wrongChoice: "1", html: `<p>1번 평민을 고르셨네요. 해일이한테 큰일 날 소리예요.</p><p>해일이의 클래스는 <strong>최고존엄</strong>입니다.</p>` },
    { number: 2, wrongChoice: "2", html: `<p>2번 일반인을 고르셨네요. 해일이에 대한 모욕이에요.</p><p>정답은 <strong>최고존엄</strong>입니다.</p>` },
    { number: 2, wrongChoice: "4", html: `<p>4번 고양이를 고르셨네요. 귀엽긴 한데 해일이는 인간이에요.</p><p>정답은 <strong>최고존엄</strong>입니다.</p>` },
    { number: 3, wrongChoice: null, html: `<p>정답은 <strong>3번 120</strong>이에요.</p><p>평균보다 확실히 높은 편이지만 천재는 아니고, 딱 '똑똑한 사람' 구간이에요.</p>` },
    { number: 3, wrongChoice: "1", html: `<p>1번 80을 고르셨네요. 너무 과소평가하셨어요.</p><p>해일이 IQ는 <strong>120</strong>이에요.</p>` },
    { number: 3, wrongChoice: "2", html: `<p>2번 100을 고르셨네요. 평균이라고 생각하셨나 본데, 해일이는 평균 위입니다.</p><p>정답은 <strong>120</strong>이에요.</p>` },
    { number: 3, wrongChoice: "4", html: `<p>4번 150을 고르셨네요. 과대평가예요. 해일이는 천재급은 아니에요.</p><p>정답은 <strong>120</strong>입니다.</p>` },
    { number: 4, wrongChoice: null, html: `<p>정답은 <strong>3번 안동</strong>이에요.</p><p>뼛속까지 안동 사람입니다.</p>` },
    { number: 4, wrongChoice: "1", html: `<p>1번 서울을 고르셨네요. 서울 사람처럼 보일 수 있지만 아니에요.</p><p>해일이 고향은 <strong>안동</strong>입니다.</p>` },
    { number: 4, wrongChoice: "2", html: `<p>2번 대구를 고르셨네요. 경상도 감은 맞았지만 한 지역 차이예요.</p><p>정답은 <strong>안동</strong>입니다.</p>` },
    { number: 4, wrongChoice: "4", html: `<p>4번 부산을 고르셨네요. 부산은 아니고, 같은 경상도지만 북쪽이에요.</p><p>정답은 <strong>안동</strong>입니다.</p>` },
    { number: 5, wrongChoice: null, html: `<p>정답은 <strong>2번 7월 22일</strong>이에요.</p><p>여름 한복판이에요. 기억해두면 생일 챙겨줄 수 있어요.</p>` },
    { number: 5, wrongChoice: "1", html: `<p>1번 6월 15일을 고르셨네요. 한 달 정도 차이나요.</p><p>정답은 <strong>7월 22일</strong>이에요.</p>` },
    { number: 5, wrongChoice: "3", html: `<p>3번 8월 13일을 고르셨네요. 여름인 건 맞았어요.</p><p>정답은 <strong>7월 22일</strong>이에요.</p>` },
    { number: 5, wrongChoice: "4", html: `<p>4번 12월 25일을 고르셨네요. 해일이는 크리스마스 베이비 아니에요.</p><p>정답은 <strong>7월 22일</strong>입니다.</p>` },
    { number: 6, wrongChoice: null, html: `<p>정답은 <strong>3번 2L</strong>이에요.</p><p>건강 상식에서 권장하는 하루 섭취량이랑 똑같아요. 해일이 자기관리 철저해요.</p>` },
    { number: 6, wrongChoice: "1", html: `<p>1번 500ml를 고르셨네요. 해일이를 너무 건조하게 보셨어요.</p><p>해일이는 하루 <strong>2L</strong> 마셔요.</p>` },
    { number: 6, wrongChoice: "2", html: `<p>2번 1L를 고르셨네요. 나쁘지 않지만 해일이는 더 마셔요.</p><p>정답은 <strong>2L</strong>입니다.</p>` },
    { number: 6, wrongChoice: "4", html: `<p>4번 3L를 고르셨네요. 과대평가예요. 그 정도면 화장실만 가요.</p><p>정답은 <strong>2L</strong>입니다.</p>` },
    { number: 7, wrongChoice: null, html: `<p>정답은 <strong>3번 주 3~4회</strong>예요.</p><p>꾸준한 루틴이에요. 너무 무리하지도, 게으르지도 않은 딱 좋은 빈도.</p>` },
    { number: 7, wrongChoice: "1", html: `<p>1번 "안 함"을 고르셨네요. 해일이 관리 스타일 모르시네요.</p><p>해일이는 <strong>주 3~4회</strong> 운동합니다.</p>` },
    { number: 7, wrongChoice: "2", html: `<p>2번 주 1~2회를 고르셨네요. 살짝 더 자주 합니다.</p><p>정답은 <strong>주 3~4회</strong>입니다.</p>` },
    { number: 7, wrongChoice: "4", html: `<p>4번 매일을 고르셨네요. 해일이도 쉬는 날이 있어요.</p><p>정답은 <strong>주 3~4회</strong>입니다.</p>` },
    { number: 8, wrongChoice: null, html: `<p>정답은 <strong>3번 3회</strong>예요.</p><p>많지도 적지도 않은 딱 그 정도예요.</p>` },
    { number: 8, wrongChoice: "1", html: `<p>1번 1회를 고르셨네요. 해일이 좀 더 경험 있어요.</p><p>정답은 <strong>3회</strong>입니다.</p>` },
    { number: 8, wrongChoice: "2", html: `<p>2번 2회를 고르셨네요. 한 번 더 있어요.</p><p>정답은 <strong>3회</strong>입니다.</p>` },
    { number: 8, wrongChoice: "4", html: `<p>4번 5회를 고르셨네요. 해일이 바람둥이 아니에요.</p><p>정답은 <strong>3회</strong>입니다.</p>` },
    { number: 9, wrongChoice: null, html: `<p>정답은 <strong>3번 7년</strong>이에요.</p><p>3번의 연애를 합치면 꽤 긴 시간이 나와요.</p>` },
    { number: 9, wrongChoice: "1", html: `<p>1번 3년을 고르셨네요. 생각보다 좀 더 길어요.</p><p>정답은 <strong>7년</strong>입니다.</p>` },
    { number: 9, wrongChoice: "2", html: `<p>2번 5년을 고르셨네요. 근접했지만 조금 더예요.</p><p>정답은 <strong>7년</strong>입니다.</p>` },
    { number: 9, wrongChoice: "4", html: `<p>4번 10년을 고르셨네요. 그 정도는 아니에요.</p><p>정답은 <strong>7년</strong>입니다.</p>` },
    { number: 10, wrongChoice: null, html: `<p>정답은 <strong>3번 그레이브즈</strong>예요.</p><p>해일이 AD 정글러 스타일이에요. 불타는 산탄총 한 방이 제맛이라네요.</p>` },
    { number: 10, wrongChoice: "1", html: `<p>1번 리븐을 고르셨네요. 해일이 탑 라이너로 보셨나 본데, 정글러예요.</p><p>정답은 <strong>그레이브즈</strong>입니다.</p>` },
    { number: 10, wrongChoice: "2", html: `<p>2번 사미라를 고르셨네요. 화려한 챔프긴 한데 해일이 스타일은 아니에요.</p><p>정답은 <strong>그레이브즈</strong>입니다.</p>` },
    { number: 10, wrongChoice: "4", html: `<p>4번 카밀을 고르셨네요. 해일이 그렇게 슬릭하진 않아요.</p><p>정답은 <strong>그레이브즈</strong>입니다.</p>` },
  ],
};

async function seedJeonghaeil() {
  const J = JEONGHAEIL;
  const category = await prisma.category.upsert({
    where: { slug: J.slug },
    update: { name: J.name, nameEn: J.nameEn, grade: ExamGrade.GI_NEUNG_SA, field: J.field, description: J.description, colorTag: J.colorTag },
    create: { slug: J.slug, name: J.name, nameEn: J.nameEn, grade: ExamGrade.GI_NEUNG_SA, field: J.field, description: J.description, colorTag: J.colorTag },
  });

  // 기존 정리
  const oldQs = await prisma.question.findMany({ where: { subject: { categoryId: category.id } }, select: { id: true } });
  const oldQIds = oldQs.map((q) => q.id);
  if (oldQIds.length > 0) {
    await prisma.answerRecord.deleteMany({ where: { questionId: { in: oldQIds } } });
    await prisma.question.deleteMany({ where: { id: { in: oldQIds } } });
  }
  const oldExams = await prisma.exam.findMany({ where: { categoryId: category.id } });
  for (const ex of oldExams) {
    await prisma.attempt.deleteMany({ where: { examId: ex.id } });
  }
  await prisma.exam.deleteMany({ where: { categoryId: category.id } });

  // 기존 Subject 중 새 목록에 없는 것 제거
  const newSlugs = new Set(J.subjects.map((s) => s.slug));
  const existSubs = await prisma.subject.findMany({ where: { categoryId: category.id } });
  for (const s of existSubs) {
    if (!newSlugs.has(s.slug)) {
      await prisma.subject.delete({ where: { id: s.id } });
    }
  }

  const subject = await prisma.subject.upsert({
    where: { categoryId_slug: { categoryId: category.id, slug: J.subjects[0].slug } },
    update: { name: J.subjects[0].name, orderIdx: 1 },
    create: { categoryId: category.id, slug: J.subjects[0].slug, name: J.subjects[0].name, orderIdx: 1 },
  });

  const exam = await prisma.exam.create({
    data: {
      categoryId: category.id,
      year: J.exam.year, round: J.exam.round,
      title: `${J.name} ${J.exam.year}년 ${J.exam.round}회`,
      durationMin: J.exam.durationMin, totalQuestions: J.exam.totalQuestions,
      source: "정해일 비공식",
    },
  });

  const qIdByNumber = new Map<number, string>();
  for (const q of J.questions) {
    const created = await prisma.question.create({
      data: {
        subjectId: subject.id, examId: exam.id, number: q.number, type: QuestionType.MCQ4,
        stem: q.stem,
        choices: q.choices.map((text, i) => ({ label: String(i + 1), text })),
        correctAnswer: q.correct,
        hasMath: false, hasImage: false,
        tags: ["정해일"], difficulty: 1,
        explanationSeed: null,
      },
    });
    qIdByNumber.set(q.number, created.id);
  }

  for (const e of J.explanations) {
    const qid = qIdByNumber.get(e.number);
    if (!qid) continue;
    await prisma.aiExplanation.create({
      data: {
        questionId: qid, userId: null, wrongChoice: e.wrongChoice,
        explanation: e.html, model: "hand-written", tone: ExplanationTone.FRIENDLY,
      },
    });
  }

  return { name: J.name, subjects: 1, rounds: 1, questions: J.questions.length, explanations: J.explanations.length };
}

// ─────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("[seed] PASSPOP v6 — 기출 ETL");

  for (const t of TARGETS) {
    console.log(`\n[etl] ${t.appName} 시작`);
    const r = await importTarget(t);
    if (!r) continue;
    console.log(
      `[etl] ${r.name} — 과목 ${r.subjects}, 회차 ${r.rounds}, 문제 ${r.questions}, 해설 ${r.explanations}`,
    );
  }

  console.log("\n[seed] 정해일 문답고사");
  const jr = await seedJeonghaeil();
  console.log(`[seed] ${jr.name} — 과목 ${jr.subjects}, 회차 ${jr.rounds}, 문제 ${jr.questions}, 해설 ${jr.explanations}`);

  const totals = {
    categories: await prisma.category.count(),
    subjects: await prisma.subject.count(),
    exams: await prisma.exam.count(),
    questions: await prisma.question.count(),
    explanations: await prisma.aiExplanation.count(),
  };
  console.log(
    `\n[seed] 총합 — Category ${totals.categories}, Subject ${totals.subjects}, Exam ${totals.exams}, Question ${totals.questions}, Explanation ${totals.explanations}`,
  );
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
