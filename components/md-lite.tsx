"use client";

import { cn } from "@/lib/utils";

/**
 * 해설 표시용 마크다운(축소판).
 *
 * 왜 파서를 안 쓰나: 해설에 필요한 건 굵게 / 목록 / 인용(암기 팁) 세 가지뿐이고,
 * 단어 단위로 차오르는 애니메이션과 물려야 해서 렌더 결과를 직접 다뤄야 한다.
 * 전체 마크다운이 필요해지면 그때 파서로 바꾸면 된다.
 *
 * 지원:
 *   **굵게**      강조
 *   - 항목        목록
 *   > 문장        암기 팁 상자 (첫 줄이 제목)
 *   빈 줄         문단 구분
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "tip"; title: string; lines: string[] };

export function parseMd(src: string): Block[] {
  const out: Block[] = [];
  const lines = src.trim().split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      out.push({ kind: "ul", items });
      continue;
    }
    if (line.startsWith("> ")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        rows.push(lines[i].trim().slice(2));
        i++;
      }
      out.push({ kind: "tip", title: rows[0], lines: rows.slice(1) });
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("> ")
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    out.push({ kind: "p", text: buf.join(" ") });
  }
  return out;
}

/** **굵게** 를 살리면서 단어 단위로 차오르게 한다 */
function Rich({
  text,
  on,
  start = 0,
  stagger = 0,
  strongClass,
}: {
  text: string;
  on: boolean;
  start?: number;
  stagger?: number;
  strongClass?: string;
}) {
  let n = start;
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, pi) => {
        const bold = part.startsWith("**") && part.endsWith("**");
        const body = bold ? part.slice(2, -2) : part;
        return body.split(" ").map((w, wi) => {
          if (!w) return null;
          const delay = on ? n++ * stagger : 0;
          return (
            <span
              key={`${pi}-${wi}`}
              style={{ transitionDelay: `${delay}ms` }}
              className={cn(
                "inline-block whitespace-pre transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none",
                on
                  ? "translate-y-0 opacity-100"
                  : "translate-y-[3px] opacity-0",
                bold && (strongClass ?? "font-bold text-text-high"),
              )}
            >
              {w}{" "}
            </span>
          );
        });
      })}
    </>
  );
}

export function Md({
  src,
  on = true,
  className,
  tone = "light",
}: {
  src: string;
  on?: boolean;
  className?: string;
  /** ink 는 어두운 배경 위 */
  tone?: "light" | "ink";
}) {
  const blocks = parseMd(src);
  const ink = tone === "ink";
  // 앞 블록의 단어 수만큼 뒤 블록의 시작을 미뤄 한 흐름으로 이어지게 한다
  let cursor = 0;
  const count = (t: string) =>
    t.replace(/\*\*/g, "").split(" ").filter(Boolean).length;

  return (
    <div className={cn("animate-slide-in space-y-2.5", className)}>
      {blocks.map((b, i) => {
        if (b.kind === "p") {
          const s = cursor;
          cursor += count(b.text);
          return (
            <p key={i} className="text-2xs leading-[1.8]">
              <Rich
                text={b.text}
                on={on}
                start={s}
                strongClass={ink ? "font-bold" : "font-bold text-text-high"}
              />
            </p>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={i} className="space-y-1">
              {b.items.map((it, j) => {
                const s = cursor;
                cursor += count(it);
                return (
                  <li key={j} className="flex gap-1.5 text-2xs leading-[1.75]">
                    <span
                      className={cn(
                        "mt-[7px] h-1 w-1 shrink-0 rounded-full",
                        ink ? "bg-background/50" : "bg-primary",
                      )}
                    />
                    <span>
                      <Rich
                        text={it}
                        on={on}
                        start={s}
                        strongClass={
                          ink ? "font-bold" : "font-bold text-text-high"
                        }
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }
        const s = cursor;
        cursor += count(b.title) + b.lines.reduce((a, l) => a + count(l), 0);
        return (
          <div
            key={i}
            className={cn(
              "rounded-md border px-3 py-2.5",
              ink
                ? "border-background/25 bg-background/[0.07]"
                : "border-primary/30 bg-primary/[0.06]",
            )}
          >
            <p
              className={cn(
                "text-3xs font-bold uppercase tracking-[0.12em]",
                ink ? "text-background/70" : "text-primary",
              )}
            >
              <Rich text={b.title} on={on} start={s} stagger={20} />
            </p>
            {b.lines.map((l, j) => (
              <p key={j} className="mt-1 text-2xs leading-[1.75]">
                <Rich
                  text={l}
                  on={on}
                  start={s + count(b.title) + j * 3}
                  stagger={20}
                  strongClass={ink ? "font-bold" : "font-bold text-text-high"}
                />
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
