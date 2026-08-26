/**
 * 해설용 축소판 마크다운 → HTML.
 *
 * 지원 문법은 해설 작성 스펙과 동일하게 네 가지뿐이다:
 *   **굵게**  /  - 목록  /  > 인용  /  빈 줄로 문단 구분
 * 그 외 문자는 전부 이스케이프하므로 사료에 섞인 <, > 도 그대로 보인다.
 *
 * KaTeX 를 쓰지 않는 순수 함수라 노드에서 바로 테스트할 수 있다.
 * (컴포넌트 쪽은 katex CSS 를 import 해서 노드에서 못 불러온다)
 */

/** 이미 HTML 로 저장된 해설인지 — 블록 태그가 있으면 HTML 로 본다 */
export const BLOCK_HTML_RE = /<(p|ul|ol|li|div|table|blockquote|h[1-6])\b/i;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** **굵게** → <strong> (이스케이프 후에 적용) */
function inline(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function mdToHtml(src: string): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (!lines[i].trim()) {
      i++;
      continue;
    }

    if (lines[i].trimStart().startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("- ")) {
        items.push(inline(escapeHtml(lines[i].trimStart().slice(2).trim())));
        i++;
      }
      out.push(`<ul>${items.map((t) => `<li>${t}</li>`).join("")}</ul>`);
      continue;
    }

    if (lines[i].trimStart().startsWith("> ")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("> ")) {
        rows.push(inline(escapeHtml(lines[i].trimStart().slice(2).trim())));
        i++;
      }
      out.push(`<blockquote>${rows.join("<br/>")}</blockquote>`);
      continue;
    }

    // 빈 줄 전까지가 한 문단. 문단 안의 줄바꿈은 <br/>
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trimStart().startsWith("- ") &&
      !lines[i].trimStart().startsWith("> ")
    ) {
      buf.push(inline(escapeHtml(lines[i].trim())));
      i++;
    }
    out.push(`<p>${buf.join("<br/>")}</p>`);
  }

  return out.join("");
}

/** 마크다운으로 저장된 해설이면 HTML 로 바꾼다. 이미 HTML 이면 그대로 둔다. */
export function explanationToHtml(src: string): string {
  return BLOCK_HTML_RE.test(src) ? src : mdToHtml(src);
}
