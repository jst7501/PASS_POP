import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * 해설 HTML 렌더러
 * - 서버 컴포넌트 (Node runtime) — katex.renderToString 사용
 * - 입력은 신뢰 가능한 HTML (시드에서 직접 작성)
 * - $...$ 인라인 수식 → KaTeX HTML로 치환
 * - 나머지 <p>, <strong>, <svg> 등은 그대로 전달
 */
export function ExplanationHtml({ html }: { html: string }) {
  const rendered = renderMathInHtml(html);
  return (
    <div
      className="explanation-html"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
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
