// Next.js 가 같은 라우트의 twitter-image 를 별도로 요구 — opengraph-image 와 동일 렌더 재사용.
// 단, runtime 은 re-export 하면 Next 정적 분석이 인식 못 하므로 직접 선언한다.
export const runtime = "edge";
export { default, size, contentType, alt } from "./opengraph-image";
