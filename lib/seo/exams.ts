import "server-only";

/**
 * SEO 종목 레지스트리 — DB 와 무관한 정적 목록.
 *
 * 왜 DB 가 아니라 여기 있나:
 *   /exams 는 DB(force-dynamic) 기반이라 정적 생성이 안 되고, 아직 문제가 없는
 *   종목은 애초에 DB 에 없다. 검색 유입은 "문제가 있느냐" 와 별개로 먼저
 *   깔아둬야 하는 구조라서 분리했다.
 *
 * 사실 관계 원칙:
 *   - 정식 명칭 / 별칭 / 시행기관 / 등급까지만 담는다.
 *   - 합격 기준·응시료·시험 일정은 해마다 바뀌고 틀리면 학습자에게 해가 되므로
 *     확인된 값을 채우기 전까지 아예 넣지 않는다.
 *
 * status:
 *   - "open"      실제 문제가 있어 /exams/<slug> 에서 풀 수 있다 → 색인 대상
 *   - "preparing" 아직 문제 없음 → /cbt/<slug> 안내 페이지, noindex
 *   문제를 채운 뒤 status 만 "open" 으로 바꾸면 사이트맵·색인이 자동으로 열린다.
 */

export type ExamStatus = "open" | "preparing";

export type ExamGradeKey =
  | "gineungsa"
  | "saneobgisa"
  | "gisa"
  | "gisulsa"
  | "gongmuwon"
  | "etc";

export type SeoExam = {
  /** URL slug. open 이면 /exams/<slug> 와 반드시 같아야 한다. */
  slug: string;
  /** 정식 명칭 */
  name: string;
  /** 실제로 검색창에 쳐지는 줄임말·구어체. 키워드 생성의 핵심. */
  aliases: string[];
  grade: ExamGradeKey;
  /** 확실한 것만. 모르면 생략. */
  authority?: string;
  /** 한 줄 설명 — 목록/메타 설명에 쓴다. */
  blurb: string;
  status: ExamStatus;
};

export const GRADE_LABEL: Record<ExamGradeKey, string> = {
  gineungsa: "기능사",
  saneobgisa: "산업기사",
  gisa: "기사",
  gisulsa: "기술사",
  gongmuwon: "공무원",
  etc: "기타",
};

/** 목록에 노출할 순서 */
export const GRADE_ORDER: ExamGradeKey[] = [
  "gisa",
  "saneobgisa",
  "gineungsa",
  "gongmuwon",
  "etc",
  "gisulsa",
];

const QNET = "한국산업인력공단";
const KCCI = "대한상공회의소";

export const SEO_EXAMS: SeoExam[] = [
  // ── 검색량이 큰 순으로 (한국사·컴활·정처기·지게차 계열이 상단) ──
  {
    slug: "korean-history",
    name: "한국사능력검정시험",
    aliases: ["한능검", "한국사", "한국사시험", "한국사 자격증"],
    grade: "etc",
    authority: "국사편찬위원회",
    blurb: "공무원·공기업 가산점의 기본. 심화와 기본 모두 회차별 기출로.",
    status: "preparing",
  },
  {
    slug: "computer-specialist-1",
    name: "컴퓨터활용능력 1급",
    aliases: ["컴활 1급", "컴활1급", "컴활", "컴퓨터활용능력1급"],
    grade: "etc",
    authority: KCCI,
    blurb: "필기 3과목 CBT. 스프레드시트·데이터베이스 기출 반복 풀이.",
    status: "preparing",
  },
  {
    slug: "computer-specialist-2",
    name: "컴퓨터활용능력 2급",
    aliases: ["컴활 2급", "컴활2급", "컴퓨터활용능력2급"],
    grade: "etc",
    authority: KCCI,
    blurb: "가장 많이 보는 사무 자격증. 필기 기출 회차별 정리.",
    status: "preparing",
  },
  {
    slug: "word-processor",
    name: "워드프로세서",
    aliases: ["워드", "워드프로세서 필기", "워드 자격증"],
    grade: "etc",
    authority: KCCI,
    blurb: "사무자동화 입문 자격. 필기 기출 CBT.",
    status: "preparing",
  },
  {
    slug: "information-processing-gisa",
    name: "정보처리기사",
    aliases: ["정처기", "정보처리기사 필기", "정보처리기사 기출"],
    grade: "gisa",
    authority: QNET,
    blurb: "IT 직군 대표 자격. 5과목 필기 기출과 오답 해설.",
    status: "preparing",
  },
  {
    slug: "information-processing-saneobgisa",
    name: "정보처리산업기사",
    aliases: ["정보처리산업기사 필기", "정처산기"],
    grade: "saneobgisa",
    authority: QNET,
    blurb: "전문대 졸업·실무 2년 대상 IT 자격. 필기 기출 CBT.",
    status: "preparing",
  },
  {
    slug: "forklift-gineungsa",
    name: "지게차운전기능사",
    aliases: ["지게차", "지게차 자격증", "지게차운전기능사 필기"],
    grade: "gineungsa",
    authority: QNET,
    blurb: "검색량 최상위 기능사. 필기 60문항 CBT 반복 풀이.",
    status: "preparing",
  },
  {
    slug: "excavator-gineungsa",
    name: "굴착기운전기능사",
    aliases: ["굴착기", "굴삭기", "굴삭기 자격증", "굴착기운전기능사 필기"],
    grade: "gineungsa",
    authority: QNET,
    blurb: "건설기계 입문 자격. 필기 기출 CBT.",
    status: "preparing",
  },
  {
    slug: "industrial-safety-gisa",
    name: "산업안전기사",
    aliases: ["산안기", "산업안전기사 필기", "산업안전기사 기출"],
    grade: "gisa",
    authority: QNET,
    blurb: "중대재해처벌법 이후 수요 급증. 6과목 필기 기출.",
    status: "preparing",
  },
  {
    slug: "industrial-safety-saneobgisa",
    name: "산업안전산업기사",
    aliases: ["산업안전산업기사 필기", "산안산기"],
    grade: "saneobgisa",
    authority: QNET,
    blurb: "안전관리자 선임 요건. 필기 기출 CBT.",
    status: "preparing",
  },
  {
    slug: "electrical-gisa",
    name: "전기기사",
    aliases: ["전기기사 필기", "전기기사 기출", "전기기사 CBT"],
    grade: "gisa",
    authority: QNET,
    blurb: "전기 직군 핵심 자격. 계산 과목은 단계별 풀이로.",
    status: "preparing",
  },
  {
    slug: "electrical-saneobgisa",
    name: "전기산업기사",
    aliases: ["전기산업기사 필기", "전기산기"],
    grade: "saneobgisa",
    authority: QNET,
    blurb: "전기기사 전 단계. 필기 5과목 기출.",
    status: "preparing",
  },
  {
    slug: "electrical-gineungsa",
    name: "전기기능사",
    aliases: ["전기기능사 필기", "전기기능사 기출"],
    grade: "gineungsa",
    authority: QNET,
    blurb: "전기 입문 자격. 필기 60문항 CBT.",
    status: "preparing",
  },
  {
    slug: "hazardous-materials-saneobgisa",
    name: "위험물산업기사",
    aliases: ["위험물산업기사 필기", "위산기", "위험물"],
    grade: "saneobgisa",
    authority: QNET,
    blurb: "위험물 취급 필수 자격. 필기 기출과 오답 분석.",
    status: "preparing",
  },
  {
    slug: "hazardous-materials-gineungsa",
    name: "위험물기능사",
    aliases: ["위험물기능사 필기", "위험물 기능사"],
    grade: "gineungsa",
    authority: QNET,
    blurb: "위험물 입문 자격. 필기 기출 CBT.",
    status: "preparing",
  },
  {
    slug: "fire-equipment-gisa",
    name: "소방설비기사",
    aliases: ["소방설비기사 전기", "소방설비기사 기계", "소방기사"],
    grade: "gisa",
    authority: QNET,
    blurb: "전기분야·기계분야 각각. 필기 기출 회차별 정리.",
    status: "preparing",
  },
  {
    slug: "architecture-gisa",
    name: "건축기사",
    aliases: ["건축기사 필기", "건축기사 기출"],
    grade: "gisa",
    authority: QNET,
    blurb: "건축 직군 대표 자격. 필기 5과목 기출.",
    status: "preparing",
  },
  {
    slug: "civil-engineer-gisa",
    name: "토목기사",
    aliases: ["토목기사 필기", "토목기사 기출", "토목기사 CBT"],
    grade: "gisa",
    authority: QNET,
    blurb: "응용역학부터 토질까지. 계산 과목 단계별 완전 풀이.",
    status: "preparing",
  },
  {
    slug: "hvac-refrigeration-gisa",
    name: "공조냉동기계기사",
    aliases: ["공조냉동기계기사 필기", "공조냉동", "공조기사"],
    grade: "gisa",
    authority: QNET,
    blurb: "기계열역학·냉동공학 기출. 공식 유도까지 해설.",
    status: "preparing",
  },
  {
    slug: "korean-cook-gineungsa",
    name: "한식조리기능사",
    aliases: ["한식조리기능사 필기", "한식조리사", "조리기능사"],
    grade: "gineungsa",
    authority: QNET,
    blurb: "조리 자격 중 응시자 최다. 필기 기출 CBT.",
    status: "preparing",
  },
  {
    slug: "beautician-gineungsa",
    name: "미용사(일반)",
    aliases: ["미용사 필기", "미용사 자격증", "미용사일반"],
    grade: "gineungsa",
    authority: QNET,
    blurb: "미용 국가자격. 필기 기출 반복 풀이.",
    status: "preparing",
  },
  {
    slug: "gongmuwon-9",
    name: "9급 공무원",
    aliases: ["9급 기출", "9급 공무원 기출", "국가직 9급", "지방직 9급"],
    grade: "gongmuwon",
    authority: "인사혁신처",
    blurb: "국어·영어·한국사 + 전공. 연도별 기출 회차 풀이.",
    status: "preparing",
  },
  {
    slug: "gongmuwon-7",
    name: "7급 공무원",
    aliases: ["7급 기출", "7급 공무원 기출", "국가직 7급", "PSAT"],
    grade: "gongmuwon",
    authority: "인사혁신처",
    blurb: "PSAT 및 전공 과목 기출. 과목별 약점 분석.",
    status: "preparing",
  },
  {
    slug: "3d-printer-gineungsa",
    name: "3D프린터운용기능사",
    aliases: ["3D프린터운용기능사 필기", "3D프린터 기능사", "3d프린터 자격증"],
    grade: "gineungsa",
    authority: QNET,
    blurb: "3D 모델링·프린터 운용. 전 문항 해설 공개 중.",
    status: "open",
  },
];

export const bySlug = (slug: string): SeoExam | undefined =>
  SEO_EXAMS.find((e) => e.slug === slug);

export const openExams = () => SEO_EXAMS.filter((e) => e.status === "open");
export const preparingExams = () =>
  SEO_EXAMS.filter((e) => e.status === "preparing");

/** 등급별 묶음 — 목록 페이지 렌더용 */
export function examsByGrade() {
  return GRADE_ORDER.map((grade) => ({
    grade,
    label: GRADE_LABEL[grade],
    exams: SEO_EXAMS.filter((e) => e.grade === grade),
  })).filter((g) => g.exams.length > 0);
}

/**
 * 종목별 검색 키워드 생성.
 * 사람들이 실제로 치는 조합은 "<이름> <의도>" 형태라 별칭 × 의도로 펼친다.
 * 손으로 나열하면 종목 추가할 때마다 빠뜨린다.
 */
const INTENTS = ["기출문제", "기출", "CBT", "필기 기출", "기출문제 무료", "문제풀이"];

export function examKeywords(exam: SeoExam): string[] {
  const names = [exam.name, ...exam.aliases];
  const out = new Set<string>(names);
  for (const n of names) {
    for (const intent of INTENTS) out.add(`${n} ${intent}`);
  }
  out.add(`${exam.name} 해설`);
  out.add(`${exam.name} 오답노트`);
  return [...out];
}
