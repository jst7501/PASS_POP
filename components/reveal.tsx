"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 스크롤 진입 시 한 번만 나타나는 래퍼.
 *
 * 핵심 원칙: 서버 HTML 에서는 절대 숨기지 않는다.
 *   opacity:0 을 서버에서 내보내면 JS 가 실행되지 않는 순간(하이드레이션 실패,
 *   구형 브라우저, 스크립트 차단) 본문이 통째로 사라진다. 애니메이션 없는
 *   페이지가 안 보이는 페이지보다 낫다.
 *   그래서 마운트 후에 "화면 아래에 있는 것만" 숨겼다가 올려 보낸다.
 *   화면 밖이라 깜빡임은 보이지 않는다.
 *
 * 장식용 부유 애니메이션과의 차이:
 *   - 뷰포트 진입 시 1회만. 이후 옵저버를 끊는다
 *   - 이동 12px / 500ms — 읽는 흐름을 방해하지 않는 선
 *   - prefers-reduced-motion 이면 아무 것도 하지 않는다
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** 같은 그룹을 순차로 띄울 때만. 400ms 넘기지 말 것 — 느려 보인다. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // "visible" = 서버 초기 상태. 숨김은 JS 가 판단한 뒤에만 들어간다.
  const [phase, setPhase] = useState<"visible" | "hidden" | "revealed">(
    "visible",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 이미 화면 안이면 그냥 둔다 — 첫 화면이 깜빡이면 안 된다
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setPhase("hidden");

    let io: IntersectionObserver | undefined;
    const raf = requestAnimationFrame(() => {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setPhase("revealed");
            io?.disconnect();
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      io.observe(el);
    });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={phase === "revealed" && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
        phase === "hidden" ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
