/** 문제 상세 스켈레톤 — 지문·보기·해설 자리를 미리 잡아 레이아웃이 튀지 않게 */
export default function Loading() {
  return (
    <article className="mx-auto max-w-3xl animate-pulse px-4 pb-24 md:px-6">
      <div className="mt-8 h-3 w-24 rounded bg-surface-mute" />
      <div className="mt-5 h-3 w-40 rounded bg-surface-mute" />
      <div className="mt-4 h-6 w-full rounded bg-surface-mute" />
      <div className="mt-2 h-6 w-3/5 rounded bg-surface-mute" />

      <div className="mt-6 h-48 rounded-md bg-surface-mute" />

      <ul className="mt-6 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="h-14 rounded-md bg-surface-mute" />
        ))}
      </ul>

      <div className="mt-8 h-20 rounded-lg bg-surface-mute" />
      <div className="mt-3 h-12 rounded-lg bg-surface-mute" />
    </article>
  );
}
