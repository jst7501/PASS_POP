import "server-only";
import type { Metadata } from "next";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_URL,
  absoluteUrl,
} from "./site";

type BuildMetaInput = {
  title: string;
  description?: string;
  /** "/" 시작 경로 (canonical/OG URL 자동 생성용) */
  path?: string;
  /** 가능하면 종목/페이지별로 다양화 */
  keywords?: string[];
  /** 검색엔진 색인 정책 (private 페이지면 false) */
  index?: boolean;
  /** OG 이미지 경로. 미지정시 동적 OG (`<route>/opengraph-image`) 또는 기본 OG */
  ogImage?: string;
  /** og:type, 기본 website. 글 형식이면 article */
  ogType?: "website" | "article" | "profile";
  /** article 메타 */
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Next.js Metadata 생성기 - 페이지에서 한 줄로 풀세트 SEO 메타 적용.
 */
export function buildMeta(input: BuildMetaInput): Metadata {
  const {
    title,
    description = SITE_DESCRIPTION,
    path,
    keywords,
    index = true,
    ogImage,
    ogType = "website",
    publishedTime,
    modifiedTime,
  } = input;

  const canonical = path ? absoluteUrl(path) : undefined;
  const images = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: title }]
    : undefined;

  const meta: Metadata = {
    title,
    description,
    keywords,
    alternates: canonical
      ? {
          canonical,
          languages: { "ko-KR": canonical, "x-default": canonical },
        }
      : undefined,
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        },
    openGraph: {
      title,
      description,
      url: canonical ?? SITE_URL,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: ogType as "website",
      images,
      ...(ogType === "article" && {
        publishedTime,
        modifiedTime,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };

  return meta;
}
