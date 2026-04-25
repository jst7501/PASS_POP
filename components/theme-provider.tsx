"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * PASSPOP 테마 프로바이더
 * - defaultTheme="light" (사용자 지시: 기본 라이트)
 * - attribute="class" → html.dark 토글로 globals.css 변수 스위칭
 * - enableSystem=false: 사용자 명시 토글만 반영
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      // 토글 순간 모든 transition 꺼서 색상이 부드럽게 스왑되는 대신
      // 단일 프레임에 전환되도록 함 (레이아웃 리플로우/스크롤바 플리커 방지)
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
