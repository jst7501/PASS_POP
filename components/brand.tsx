import {
  LOGO_CHECK_D,
  LOGO_RING_D,
  LOGO_STROKE,
  LOGO_VIEWBOX,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * 로고 마크. currentColor 를 따라가므로 부모에서 text-primary 등으로 색을 정한다.
 * 타일(둥근 사각형) 안에 넣지 않는다 — 타일은 OS 아이콘에서만 쓴다.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={LOGO_RING_D}
        stroke="currentColor"
        strokeWidth={LOGO_STROKE}
        strokeLinecap="round"
      />
      <path
        d={LOGO_CHECK_D}
        stroke="currentColor"
        strokeWidth={LOGO_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 워드마크. 자간을 -0.045em 까지 조여 마크의 굵기와 무게를 맞춘다.
 * 두 톤(PASS + POP 색 분리) 으로 쪼개지 않는다 — 단색이 더 단단하다.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-extrabold tracking-[-0.045em]", className)}>
      PASSPOP
    </span>
  );
}

/** 헤더·푸터 공통 락업. 마크와 워드마크 사이 간격은 마크 폭의 약 1/3. */
export function LogoLockup({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("h-7 w-7 text-primary", markClassName)} />
      <Wordmark className={cn("text-lg text-text-high", wordClassName)} />
    </span>
  );
}
