import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo/site";
import { DP, DP_SLUG } from "@/lib/content/3dp";
import { indexablePreparing } from "@/lib/seo/exams";

// 사이트맵은 매 빌드/요청마다 DB에서 카테고리·과목·회차를 끌어와 동적으로 구성한다.
// Next.js 가 ISR 처럼 캐시하므로 revalidate 로 갱신 주기 제어.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/exams"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // 종목 허브 — 검색 유입의 진입점. 개별 종목 안내 페이지(/cbt/<slug>) 는
    // 아직 문제가 없어 noindex 이므로 사이트맵에 넣지 않는다.
    {
      url: absoluteUrl("/cbt"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // 카테고리 / 과목 / 회차 동적 수집
  // - isActive 카테고리만
  // - 공개 회차 (해설 1건 이상 hand-written) 만 색인 가능 후보로 포함
  let categories: Array<{
    slug: string;
    updatedAt: Date;
    subjects: { slug: string; createdAt: Date }[];
    exams: {
      year: number;
      round: number;
      createdAt: Date;
      _publishedCount: number;
    }[];
  }> = [];

  try {
    const raw = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        slug: true,
        updatedAt: true,
        subjects: {
          orderBy: { orderIdx: "asc" },
          select: { slug: true, createdAt: true },
        },
        exams: {
          orderBy: [{ year: "desc" }, { round: "desc" }],
          select: {
            id: true,
            year: true,
            round: true,
            createdAt: true,
          },
        },
      },
    });

    // 회차별 공개 해설 개수 일괄 집계 (회차 단위로 published 여부 판정)
    const examIds = raw.flatMap((c) => c.exams.map((e) => e.id));
    let publishedExamIds = new Set<string>();
    if (examIds.length > 0) {
      const grouped = await prisma.aiExplanation.findMany({
        where: {
          userId: null,
          model: "hand-written",
          question: { examId: { in: examIds } },
        },
        distinct: ["questionId"],
        select: { question: { select: { examId: true } } },
      });
      publishedExamIds = new Set(
        grouped
          .map((g) => g.question.examId)
          .filter((v): v is string => Boolean(v)),
      );
    }

    categories = raw.map((c) => ({
      slug: c.slug,
      updatedAt: c.updatedAt,
      subjects: c.subjects,
      exams: c.exams.map((e) => ({
        year: e.year,
        round: e.round,
        createdAt: e.createdAt,
        _publishedCount: publishedExamIds.has(e.id) ? 1 : 0,
      })),
    }));
  } catch (err) {
    // 빌드 시 DB 미연결인 경우에도 정적 항목은 살리도록 swallow
    console.error("[sitemap] db query failed:", err);
  }

  const dynamicEntries: MetadataRoute.Sitemap = [];

  for (const c of categories) {
    // DP(3D프린터)는 JSON 콘텐츠 기반이라 DB 파생 URL(시드 잔재) 대신 아래에서 별도 생성
    if (c.slug === DP_SLUG) continue;
    dynamicEntries.push({
      url: absoluteUrl(`/exams/${c.slug}`),
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
    });

    for (const s of c.subjects) {
      dynamicEntries.push({
        url: absoluteUrl(`/exams/${c.slug}/subjects/${s.slug}`),
        lastModified: s.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const e of c.exams) {
      // 공개되지 않은 회차는 noindex 상태이므로 사이트맵에 넣지 않음
      if (e._publishedCount === 0) continue;
      dynamicEntries.push({
        url: absoluteUrl(`/exams/${c.slug}/rounds/${e.year}-${e.round}`),
        lastModified: e.createdAt,
        changeFrequency: "monthly",
        priority: 0.75,
      });
    }
  }

  // DP(3D프린터운용기능사) — JSON 콘텐츠 기반. 종목/과목/회차를 3dp.ts 에서 생성.
  const dpBase = `/exams/${DP_SLUG}`;
  dynamicEntries.push({
    url: absoluteUrl(dpBase),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  });
  for (const s of DP.subjects) {
    dynamicEntries.push({
      url: absoluteUrl(`${dpBase}/subjects/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  dynamicEntries.push({
    url: absoluteUrl(`${dpBase}/rounds/${DP.exam.year}-${DP.exam.round}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  });
  // 개별 문제 페이지 (지문+정답+전체 해설, 색인 대상)
  for (const q of DP.questions) {
    dynamicEntries.push({
      url: absoluteUrl(`${dpBase}/questions/${q.number}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // 색인을 허용한 준비중 종목만 (기본은 없음 — exams.ts 의 indexable 참고)
  for (const e of indexablePreparing()) {
    dynamicEntries.push({
      url: absoluteUrl(`/cbt/${e.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return [...staticEntries, ...dynamicEntries];
}
