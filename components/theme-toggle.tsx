"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunLight, HalfMoon } from "iconoir-react";
import { cn } from "@/lib/utils";

/**
 * PASSPOP 테마 토글
 * - Iconoir의 SunLight / HalfMoon (Lucide 아님)
 * - 라이트 기본, 클릭 시 다크 토글
 * - Hydration mismatch 방지 위해 mounted 체크
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <button
      type="button"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group inline-flex h-10 w-10 items-center justify-center",
        "rounded-md border border-border bg-surface",
        "text-text-mid hover:text-primary",
        "hover:border-primary/30 hover:bg-primary-subtle",
        "transition-all duration-200 active:scale-95",
        className,
      )}
    >
      <span className="relative block h-5 w-5">
        <SunLight
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
          strokeWidth={2}
        />
        <HalfMoon
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
          strokeWidth={2}
        />
      </span>
    </button>
  );
}
