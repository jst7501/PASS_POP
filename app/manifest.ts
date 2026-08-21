import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — 자격증·공무원 시험 올인원 학습`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF8F4",
    theme_color: "#5B4BFF",
    lang: "ko-KR",
    dir: "ltr",
    categories: ["education", "productivity", "books"],
    id: SITE_URL,
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "오늘 풀 문제",
        short_name: "오늘",
        description: "오늘 풀어야 할 복습과 진행 중인 회차",
        url: "/",
        icons: [{ src: "/icon", sizes: "192x192" }],
      },
      {
        name: "오답노트",
        short_name: "오답",
        description: "최근 틀린 문제 다시 풀기",
        url: "/mistakes",
        icons: [{ src: "/icon", sizes: "192x192" }],
      },
      {
        name: "전체 시험",
        short_name: "시험",
        description: "자격증·공무원 시험 종목 둘러보기",
        url: "/exams",
        icons: [{ src: "/icon", sizes: "192x192" }],
      },
    ],
  };
}
