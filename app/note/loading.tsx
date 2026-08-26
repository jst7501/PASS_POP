/** 단권화 노트 스켈레톤 — 시대별 묶음 형태를 미리 잡아 둔다 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 pb-24 md:px-6">
      <div className="mt-8 h-3 w-20 rounded bg-surface-mute" />
      <div className="mt-4 h-8 w-40 rounded bg-surface-mute" />
      <div className="mt-4 h-4 w-4/5 rounded bg-surface-mute" />
      <div className="mt-5 h-10 w-40 rounded-md bg-surface-mute" />

      <div className="mt-8 h-20 rounded-md bg-surface-mute" />

      {[0, 1].map((g) => (
        <section key={g} className="mt-8">
          <div className="h-5 w-24 rounded bg-surface-mute" />
          <ul className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="space-y-1.5">
                <div className="h-4 w-full rounded bg-surface-mute" />
                <div className="h-3 w-1/3 rounded bg-surface-mute" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
