import "server-only";

/**
 * 사이트 전역 SEO 상수.
 * 환경변수로 override 가능하지만 디폴트는 production 도메인.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://passpop.app";

export const SITE_NAME = "PASSPOP";

export const SITE_TITLE_DEFAULT =
  "PASSPOP — 자격증·공무원 시험 무료 기출문제 & AI 오답 해설";

export const SITE_TITLE_TEMPLATE = `%s · ${SITE_NAME}`;

export const SITE_DESCRIPTION =
  "기사·산업기사·기능사·공무원 시험을 한곳에서. 무료 기출문제 CBT, AI 오답 해설, 망각곡선 기반 복습, 합격 예측까지. 회원가입 없이 바로 풀어보세요.";

export const SITE_SHORT_DESCRIPTION =
  "자격증·공무원 시험 올인원 학습 플랫폼. 기출 CBT + AI 오답 해설 + 복습 스케줄.";

export const SITE_LOCALE = "ko_KR";

export const SITE_KEYWORDS = [
  // 일반 키워드
  "자격증",
  "공무원",
  "기출문제",
  "기출문제풀이",
  "CBT",
  "무료 CBT",
  "기사 시험",
  "산업기사",
  "기능사",
  "기술사",
  "공무원 시험",
  "오답노트",
  "AI 해설",
  "AI 오답분석",
  "복습 스케줄",
  "망각곡선",
  "합격 예측",
  // 제품/브랜드
  "PASSPOP",
  "패스팝",
  "패스팝 기출",
  "패스팝 CBT",
  // 종목 키워드 (검색 트래픽 큰 것 위주)
  "토목기사",
  "토목기사 기출",
  "공조냉동기계기사",
  "3D프린터운용기능사",
  "정보처리기사",
  "전기기사",
  "건축기사",
  "9급 공무원",
  "7급 공무원",
];

export const ORG_INFO = {
  name: SITE_NAME,
  legalName: "PASSPOP",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512`,
  sameAs: [] as string[],
  contactPoint: {
    contactType: "customer support",
    email: "support@passpop.app",
    availableLanguage: ["Korean"],
  },
};

/**
 * 절대 URL 생성기.
 * Next.js Metadata.metadataBase 와 별개로 OG/Twitter/Canonical 등에서
 * 명시적 절대 URL 이 필요한 곳에 사용.
 */
export function absoluteUrl(path: string = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
