import "server-only";
import { SITE_NAME, SITE_URL, absoluteUrl } from "./site";

/**
 * 페이지별 구조화 데이터(JSON-LD) 빌더.
 * 반환값은 plain object — <JsonLd> 컴포넌트로 서버 렌더한다.
 */

type Crumb = { name: string; path: string };

/** 빵부스러기 — 모든 deep 페이지 공통. breadcrumb 리치 결과 후보. */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** 종목(Category) 페이지 — 무료 학습 코스로 표현. */
export function courseLd(input: {
  name: string;
  description: string;
  path: string;
  gradeLabel: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: "ko-KR",
    educationalLevel: input.gradeLabel,
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      category: "Free",
      price: "0",
      priceCurrency: "KRW",
    },
  };
}

/** 개별 문제 페이지 — QAPage(Question + acceptedAnswer). 리치 결과 후보. */
export function qaPageLd(input: {
  question: string;
  answerText: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    inLanguage: "ko-KR",
    mainEntity: {
      "@type": "Question",
      name: input.question,
      text: input.question,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: input.answerText,
        url: absoluteUrl(input.path),
      },
    },
  };
}

/** 종목 목록 등 컬렉션 페이지 — ItemList 포함. */
export function collectionPageLd(input: {
  name: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(input.path),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "ko-KR",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: absoluteUrl(it.path),
      })),
    },
  };
}
