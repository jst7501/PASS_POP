"use client";

import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

// 시드 초기에 stem 에 들어간 placeholder. 이제 manifest 이미지로 대체됐으므로 제거.
const PLACEHOLDER_RE = /\s*\[그림 원본 준비 중\]\s*/g;

/**
 * $...$ 구간을 KaTeX InlineMath로 렌더
 */
export function MathText({ text }: { text: string }) {
  const cleaned = text.replace(PLACEHOLDER_RE, "");
  const parts = cleaned.split(/(\$[^$]+\$)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const math = part.slice(1, -1);
          try {
            return <InlineMath key={i} math={math} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
