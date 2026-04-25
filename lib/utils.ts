import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * className 안전 병합 유틸
 * - 조건부 클래스: cn("p-4", isActive && "bg-primary")
 * - Tailwind 충돌 병합: cn("p-2", "p-4") → "p-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
