import { CheckCircle } from "iconoir-react";

/**
 * 프리미엄 해설이 기존 해설과 어떻게 갈리는지 나란히 보여준다.
 * 애니메이션이 아니라 비교라서 정지 화면이 맞다 — 두 글을 동시에 읽어야 차이가 보인다.
 */
export function PremiumExplanation() {
  return (
    <section className="border-t border-border-soft">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold leading-[1.15] tracking-[-0.025em] text-text-high md:text-3xl">
            정답만 알려주는 해설은
            <br />
            이제 그만.
          </h2>
          <p className="mt-3 text-base leading-[1.65] text-text-mid md:text-base">
            그 오답을 왜 골랐는지부터 시작해요.
          </p>
        </div>

        <div className="mt-8 grid md:mt-12 auto-rows-fr items-stretch gap-4 lg:grid-cols-2">
          {/* Before */}
          <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-7">
            <span className="w-fit rounded-md bg-danger/12 px-2.5 py-1 text-3xs font-bold uppercase tracking-[0.12em] text-danger">
              기존 사이트
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-[-0.01em] text-text-high">
              "정답은 ②번입니다."
            </h3>
            <ul className="mt-4 space-y-2 text-sm leading-[1.7] text-text-mid">
              <li>▸ 공식을 외워서 대입하면 답이 나옵니다.</li>
              <li>▸ ① 은 부호가 반대라 오답.</li>
              <li>▸ ③, ④ 는 단위가 다릅니다.</li>
            </ul>
            <p className="mt-auto pt-6 text-xs italic text-text-muted">
              → 다음에 또 틀려요. 왜 헷갈렸는지는 안 알려줬으니까.
            </p>
          </div>

          {/* After */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-lg border-2 border-primary/40 bg-primary/[0.03] p-7">
            <span className="w-fit rounded-md bg-primary/20 px-2.5 py-1 text-3xs font-bold uppercase tracking-[0.12em] text-primary">
              PASSPOP 프리미엄
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-[-0.01em] text-text-high">
              "② 번 찍으셨네요. 이 함정 자주 걸려요."
            </h3>
            <ul className="mt-4 space-y-2 text-sm leading-[1.7] text-text-mid">
              <li>
                ▸{" "}
                <strong className="text-text-high">
                  ② 와 ③ 의 차이가 부호 한 끗
                </strong>
                . 출제자가 일부러 헷갈리게 만든 자리예요.
              </li>
              <li>
                ▸ 공식보다 단위부터 봤으면 ② 는 바로 떨어져 나갔을 거예요.
              </li>
              <li>
                ▸{" "}
                <strong className="text-accent">
                  외울 후크 · 부호 = 방향, 방향 헷갈리면 단위부터.
                </strong>
              </li>
              <li>
                ▸ 같은 함정 자주 나오는 단원:{" "}
                <span className="font-semibold text-text-high">
                  응용역학 · 보의 처짐
                </span>
              </li>
            </ul>
            <p className="mt-auto pt-6 text-xs font-semibold text-primary">
              → 망각곡선 큐에 들어가요. 3일 뒤에 비슷한 함정으로 한 번 더.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
