import Link from "next/link";
import { NavArrowLeft } from "iconoir-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 text-center md:px-6">
      <p className="font-mono text-[60px] font-bold leading-none tabular-nums text-primary/90 md:text-[80px]">
        404
      </p>
      <h1 className="mt-6 text-[24px] font-bold tracking-[-0.01em] text-text-high md:text-[28px]">
        이 페이지는 어디 갔을까요
      </h1>
      <p className="mt-3 max-w-xs text-[14px] leading-[1.6] text-text-mid">
        주소가 맞는지 다시 한번 확인해 주세요. 아니면 홈에서 원하시는 시험을
        찾을 수도 있어요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
      >
        <NavArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        홈으로
      </Link>
    </div>
  );
}
