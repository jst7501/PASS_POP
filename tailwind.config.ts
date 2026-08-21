import type { Config } from "tailwindcss";

/**
 * PASSPOP Design Tokens
 * - 라이트 기본 / 다크 토글 (class="dark")
 * - MZ 톤: 둥근 모서리, 소프트 섀도, 포인트 컬러 Indigo + Mint
 * - 이모지 금지, Lucide 금지 (Solar Icons + Iconoir 사용)
 */
export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 시맨틱 토큰 (CSS 변수로 라이트/다크 스위칭)
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-elev": "rgb(var(--surface-elev) / <alpha-value>)",
        "surface-mute": "rgb(var(--surface-mute) / <alpha-value>)",

        foreground: "rgb(var(--text-high) / <alpha-value>)",
        "text-high": "rgb(var(--text-high) / <alpha-value>)",
        "text-mid": "rgb(var(--text-mid) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",

        border: "rgb(var(--border) / <alpha-value>)",
        "border-soft": "rgb(var(--border-soft) / <alpha-value>)",

        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
          subtle: "rgb(var(--primary-subtle) / <alpha-value>)",
          fg: "rgb(var(--primary-fg) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          subtle: "rgb(var(--accent-subtle) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          subtle: "rgb(var(--danger-subtle) / <alpha-value>)",
        },
        warning: "rgb(var(--warning) / <alpha-value>)",

        // 종목 배지용 고정 액센트
        "brand-indigo": "#4F46E5",
        "brand-mint": "#10B981",
        "brand-coral": "#FF6B6B",
        "brand-amber": "#F59E0B",
        "brand-sky": "#0EA5E9",
        "brand-violet": "#8B5CF6",
        "brand-rose": "#F43F5E",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
        // font-mono 도 한글 깨짐 방지를 위해 Pretendard 우선.
        // 순수 숫자/ASCII 에만 실질적으로 적용되도록 tabular-nums 와 함께 사용할 것.
        mono: [
          "Pretendard Variable",
          "Pretendard",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      /**
       * 타입 스케일 — 임의 px 금지.
       * 한글 본문 기준 1.15~1.25 비율. 반픽셀(14.5px 등) 사용하지 말 것.
       * 4xs/3xs 는 "축소된 앱 화면 목업" 안에서만 쓰는 미니 단계.
       */
      fontSize: {
        "5xs": ["8px", { lineHeight: "1.3" }],
        "4xs": ["9px", { lineHeight: "1.35" }],
        "3xs": ["10px", { lineHeight: "1.4" }],
        "2xs": ["11px", { lineHeight: "1.45" }],
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["13px", { lineHeight: "1.6" }],
        base: ["15px", { lineHeight: "1.65" }],
        /** 폼 컨트롤 전용 — iOS 포커스 확대 방지를 위해 16px 아래로 내리지 말 것 */
        field: ["16px", { lineHeight: "1.5" }],
        lg: ["17px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.35" }],
        "2xl": ["24px", { lineHeight: "1.25" }],
        "3xl": ["30px", { lineHeight: "1.18" }],
        "4xl": ["38px", { lineHeight: "1.1" }],
        "5xl": ["52px", { lineHeight: "1.03" }],
      },
      borderRadius: {
        // Linear 톤 — 전부 축소. 2xl 이상 사용하지 말 것.
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "12px",
      },
      boxShadow: {
        // 컬러 블리드 제거 — 채도 없는 얇은 그림자만
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "soft-lg": "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 12px -4px rgb(0 0 0 / 0.08)",
        pop: "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 2px 8px -2px rgb(0 0 0 / 0.08)",
        "pop-sm": "0 1px 2px 0 rgb(0 0 0 / 0.06)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms cubic-bezier(0.4, 0, 0.2, 1)",
        "pop-in": "pop-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-up": "slide-up 320ms cubic-bezier(0.4, 0, 0.2, 1)",
        shake: "shake 180ms ease-in-out",
      },
      transitionTimingFunction: {
        pop: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
