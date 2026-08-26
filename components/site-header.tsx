"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/brand";

/**
 * 상단 헤더 — 화면 성격에 따라 다르게 보인다.
 *
 * 랜딩용 네비("둘러보기 · FAQ · 오픈 알림 받기")가 문제 푸는 화면에까지
 * 붙어 있으면 시험 중에 이탈 링크만 늘어놓는 꼴이 된다.
 *  - 풀이 화면: 로고만 (몰입)
 *  - 앱 화면(오답노트·복습·종목 등): 로고 + 앱 안 이동
 *  - 랜딩: 원래대로 마케팅 네비 + CTA
 */
const APP_PREFIXES = [
  "/exams",
  "/cbt",
  "/review",
  "/mistakes",
  "/bookmarks",
  "/dashboard",
  "/note",
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const isSolving = pathname.startsWith("/practice");
  const isApp = APP_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="PASSPOP 홈"
        >
          <LogoLockup />
        </Link>

        {/* 풀이 중에는 아무것도 걸지 않는다 */}
        {!isSolving &&
          (isApp ? (
            <nav
              className="flex items-center gap-1"
              aria-label="앱 이동"
            >
              <HeaderLink href="/exams">시험 종목</HeaderLink>
              <HeaderLink href="/review">복습</HeaderLink>
              <HeaderLink href="/dashboard">내 기록</HeaderLink>
            </nav>
          ) : (
            <>
              <nav
                className="hidden items-center gap-1 md:flex"
                aria-label="섹션 이동"
              >
                <HeaderLink href="/#browse">둘러보기</HeaderLink>
                <HeaderLink href="/cbt">시험 종목</HeaderLink>
                <HeaderLink href="/#faq">FAQ</HeaderLink>
              </nav>
              <Link
                href="#waitlist"
                className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98]"
              >
                오픈 알림 받기
              </Link>
            </>
          ))}
      </div>
    </header>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-[13.5px] font-medium text-text-mid transition-colors hover:bg-surface-mute hover:text-text-high"
    >
      {children}
    </Link>
  );
}
