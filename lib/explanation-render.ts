import katex from "katex";
import { explanationToHtml } from "./explanation-markdown";

/**
 * 해설 문자열 → 화면에 넣을 HTML.
 *
 * 마크다운으로 저장된 해설은 HTML 로 바꾸고, 이미 HTML 인 해설은 그대로 둔 뒤
 * $...$ 인라인 수식을 KaTeX 로 렌더한다.
 *
 * katex CSS 는 여기서 import 하지 않는다. 서버 액션에서도 불러야 해서
 * CSS 를 물고 있으면 안 되고, 스타일은 이미 화면 쪽(practice-session,
 * explanation-html)에서 로드한다.
 */
export function renderExplanationHtml(src: string): string {
  return renderMathInHtml(explanationToHtml(src));
}

export function renderMathInHtml(html: string): string {
  return html.replace(/\$([^$]+)\$/g, (_match, expr) => {
    try {
      return katex.renderToString(expr, {
        throwOnError: false,
        displayMode: false,
        output: "html",
      });
    } catch {
      return `<code>$${expr}$</code>`;
    }
  });
}
