/**
 * 암기 후크 한 줄 표시.
 *
 * 후크는 해설과 달리 HTML 로 변환하지 않고 평문 그대로 두는데,
 * 생성된 문장 안에 **굵게** 가 섞여 들어오는 경우가 있어 별표가 그대로 보였다.
 * 굵게 하나만 살리고 나머지는 평문으로 둔다.
 */
export function HookText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-bold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
