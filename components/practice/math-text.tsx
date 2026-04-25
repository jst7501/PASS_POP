"use client";

import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * $...$ 구간을 KaTeX InlineMath로 렌더
 */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/);
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
