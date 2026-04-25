import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteMobileNav } from "@/components/site-mobile-nav";
import { AuthGate } from "@/components/auth/auth-gate";
import { SiteUserBadge } from "@/components/auth/site-user-badge";
import { getCurrentUser } from "@/lib/auth/anon";

export const metadata: Metadata = {
  title: "PASSPOP — 자격증·공무원 시험 올인원",
  description:
    "기사·기능사·공무원. 풀면서 실력이 쌓이는 방식. AI가 오답을 읽고 복습 간격까지 잡아줍니다.",
  metadataBase: new URL("https://passpop.app"),
  openGraph: {
    title: "PASSPOP",
    description: "자격증·공무원 시험 올인원 학습 플랫폼",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const nickname = user?.nickname ?? null;
  const isAdmin = nickname === "관리자";
  const needsOnboarding = !nickname;

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-text-high antialiased">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader nickname={nickname} isAdmin={isAdmin} />
            <main className="flex-1">{children}</main>
          </div>
          {needsOnboarding && <AuthGate />}
        </ThemeProvider>
      </body>
    </html>
  );
}

function SiteHeader({
  nickname,
  isAdmin,
}: {
  nickname: string | null;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-background/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="PASSPOP 홈"
        >
          <LogoMark className="h-7 w-7" />
          <span className="text-[17px] font-bold tracking-[-0.02em] text-text-high">
            PASSPOP
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/review">복습</NavLink>
          <NavLink href="/dashboard">내 기록</NavLink>
          <NavLink href="/mistakes">오답</NavLink>
          <NavLink href="/bookmarks">북마크</NavLink>
          {isAdmin && (
            <NavLink href="/admin">
              <span className="text-primary">관리자</span>
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <SiteUserBadge nickname={nickname} isAdmin={isAdmin} />
          <ThemeToggle />
          <SiteMobileNav />
        </div>
      </div>
    </header>
  );
}

function NavLink({
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

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="6"
        className="fill-primary"
      />
      <path
        d="M 11.5 9 H 17 C 19.8 9 22 11.2 22 14 C 22 16.8 19.8 19 17 19 H 14 V 23"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
