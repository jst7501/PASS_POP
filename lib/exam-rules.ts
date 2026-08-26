import type { ExamGrade } from "./generated/prisma-client";

/**
 * 종목별 합격 판정 규칙.
 *
 * 지금까지는 전 종목에 "총점 60점" 하나만 썼는데, 시험마다 기준이 다르다.
 * - 국가기술자격 필기(기사·산업기사·기능사): 과목당 40점 미만이면 **과락**,
 *   그리고 전 과목 평균 60점 이상이어야 합격. 한 과목만 무너져도 떨어진다.
 * - 한국사능력검정시험: **과락이 없다.** 총점만 보고 등급을 준다.
 *   여기에 과락을 적용하면 없는 규칙을 만들어 내는 셈이라 쓰면 안 된다.
 */

export type PassRule =
  | {
      kind: "average";
      /** 합격 총점 (평균) */
      passScore: number;
      /** 과목별 과락선. null 이면 과락 없음 */
      subjectFloor: number | null;
    }
  | {
      kind: "grade";
      /** 위에서부터 먼저 걸리는 등급 */
      grades: { min: number; label: string }[];
    };

const KOREAN_HISTORY: PassRule = {
  kind: "grade",
  grades: [
    { min: 80, label: "1급" },
    { min: 70, label: "2급" },
    { min: 60, label: "3급" },
  ],
};

/** 국가기술자격 필기 공통 — 과목당 40점 미만 과락, 평균 60점 이상 합격 */
const NATIONAL_TECH: PassRule = {
  kind: "average",
  passScore: 60,
  subjectFloor: 40,
};

/** 단일 과목 시험은 과락이 따로 없다 (총점이 곧 그 과목 점수라서) */
const SINGLE_SUBJECT: PassRule = {
  kind: "average",
  passScore: 60,
  subjectFloor: null,
};

const BY_SLUG: Record<string, PassRule> = {
  "korean-history-simhwa": KOREAN_HISTORY,
};

export function passRuleFor(
  categorySlug: string,
  grade: ExamGrade | null | undefined,
  subjectCount: number,
): PassRule {
  const bySlug = BY_SLUG[categorySlug];
  if (bySlug) return bySlug;
  if (subjectCount <= 1) return SINGLE_SUBJECT;
  if (grade === "GI_SA" || grade === "SAN_EOB_GI_SA" || grade === "GI_NEUNG_SA") {
    return NATIONAL_TECH;
  }
  return SINGLE_SUBJECT;
}

export type SubjectScore = { slug: string; name: string; rate: number; total: number };

export type PassVerdict = {
  /** 합격 추정 여부 */
  isPass: boolean;
  /** 총점(%) */
  scorePct: number;
  /** 등급제 종목의 등급. 등급 미달이면 null */
  gradeLabel: string | null;
  /** 과락 기준 (없으면 null) */
  subjectFloor: number | null;
  /** 과락 걸린 과목들 */
  failedSubjects: SubjectScore[];
  /** 합격선까지 남은 점수 (합격이면 여유분) */
  gap: number;
};

/**
 * 총점과 과목별 정답률로 합격 여부를 판정한다.
 * 과락이 있는 종목은 총점이 넘어도 한 과목이 무너지면 불합격이다.
 */
export function judge(
  rule: PassRule,
  scorePct: number,
  subjects: SubjectScore[],
  /** 과락 판정에 쓸 최소 문항 수 — 표본이 적으면 과락으로 몰지 않는다 */
  minSubjectQuestions = 3,
): PassVerdict {
  if (rule.kind === "grade") {
    const hit = rule.grades.find((g) => scorePct >= g.min) ?? null;
    const lowest = rule.grades[rule.grades.length - 1];
    return {
      isPass: hit != null,
      scorePct,
      gradeLabel: hit?.label ?? null,
      subjectFloor: null,
      failedSubjects: [],
      gap: scorePct - lowest.min,
    };
  }

  const failed =
    rule.subjectFloor == null
      ? []
      : subjects.filter(
          (s) =>
            s.total >= minSubjectQuestions &&
            Math.round(s.rate * 100) < rule.subjectFloor!,
        );

  return {
    isPass: scorePct >= rule.passScore && failed.length === 0,
    scorePct,
    gradeLabel: null,
    subjectFloor: rule.subjectFloor,
    failedSubjects: failed,
    gap: scorePct - rule.passScore,
  };
}
