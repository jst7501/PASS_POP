import "katex/dist/katex.min.css";
import { renderExplanationHtml } from "@/lib/explanation-render";

/**
 * 해설 렌더러 (서버 컴포넌트)
 * - 입력은 신뢰 가능한 시드 데이터. 마크다운으로 저장된 해설(한국사)과
 *   HTML 로 저장된 해설(공조냉동·토목)이 섞여 있고, 둘 다 처리한다.
 * - 실제 변환은 lib/explanation-render.ts 가 한다. 이 파일은 CSS 를 물고 있어서
 *   서버 액션 쪽에서 import 하면 안 된다.
 */
export function ExplanationHtml({ html }: { html: string }) {
  return (
    <div
      className="explanation-html"
      dangerouslySetInnerHTML={{ __html: renderExplanationHtml(html) }}
    />
  );
}

export { renderExplanationHtml as renderExplanation } from "@/lib/explanation-render";
