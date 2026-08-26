import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // 문제 상세 URL 은 회차형 하나로 통일했다.
        // 3D프린터만 회차 없는 옛 경로를 쓰고 있었어서 넘겨준다.
        // 페이지 안에서 redirect() 를 부르면 프리렌더된 라우트라
        // meta refresh 로 나가 SEO 신호가 약해진다 — 라우팅 레벨에서 308 로 처리.
        source: "/exams/3d-printer-gineungsa/questions/:number",
        destination:
          "/exams/3d-printer-gineungsa/rounds/2024-1/questions/:number",
        permanent: true,
      },
      {
        // 한국사는 심화 회차부터 열려서 종목 slug 를 DB 와 맞췄다.
        // 예전 안내 페이지 주소로 들어오는 링크를 실제 종목으로 넘긴다.
        source: "/cbt/korean-history",
        destination: "/exams/korean-history-simhwa",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
