"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * 라우트 전환 중 상단에 얇은 진행바 노출.
 * - pathname 또는 searchParams 가 바뀌면 잠시 active
 * - 링크 클릭 가로채서 즉시 표시 (next/link 의 prefetch 가 끝나기 전이라도 반응)
 */
export function NavProgress() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);

  // 라우트 변경 감지 → 짧게 풀바 보여줬다가 사라짐
  useEffect(() => {
    setActive(true);
    setWidth(15);
    const t1 = setTimeout(() => setWidth(60), 50);
    const t2 = setTimeout(() => setWidth(85), 200);
    const t3 = setTimeout(() => setWidth(100), 400);
    const t4 = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [pathname, sp]);

  // 링크/버튼 클릭 가로채서 즉시 풀바 시작
  useEffect(() => {
    const onAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const a = target.closest("a") as HTMLAnchorElement | null;
      if (!a) return;
      // 같은 페이지 / 외부 / 다운로드 / 새 창 무시
      if (
        !a.href ||
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      )
        return;
      try {
        const url = new URL(a.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        )
          return;
      } catch {
        return;
      }
      setActive(true);
      setWidth(20);
    };
    document.addEventListener("click", onAnchorClick, true);
    return () => document.removeEventListener("click", onAnchorClick, true);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 bg-transparent"
    >
      <div
        className="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${width}%`,
          opacity: active ? 1 : 0,
        }}
      />
    </div>
  );
}
