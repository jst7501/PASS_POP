/**
 * 서버 렌더 JSON-LD.
 * next/script(strategy="afterInteractive") 는 하이드레이션 이후 클라이언트에서
 * DOM 에 주입돼 초기 HTML 에 구조화 데이터가 없다 — 일부 크롤러는 못 읽는다.
 * 이 컴포넌트는 서버 컴포넌트 트리에서 <script> 를 그대로 렌더하므로
 * 구조화 데이터가 초기 응답 HTML 에 포함된다.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  // 서버 생성 신뢰 데이터지만, 카테고리명 등에 '<' 가 섞여 </script> 탈출이
  // 일어나지 않도록 방어적으로 이스케이프.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
