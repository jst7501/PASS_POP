import { ImageResponse } from "next/og";
import {
  BRAND,
  LOGO_CHECK_D,
  LOGO_RING_D,
  LOGO_STROKE,
  LOGO_VIEWBOX,
} from "@/lib/brand";

export const runtime = "edge";
export const alt = "PASSPOP — 자격증·공무원 시험 무료 기출문제 & AI 오답 해설";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_BASE =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static";

/**
 * satori 는 woff2 를 못 읽어서 globals.css 의 가변 폰트를 재사용할 수 없다.
 * 정적 otf 를 받아 쓰되, CDN 이 죽어도 OG 자체는 나가야 하므로 실패 시 기본 폰트로 떨어진다.
 */
async function loadFonts() {
  try {
    const [regular, extraBold] = await Promise.all([
      fetch(`${FONT_BASE}/Pretendard-Regular.otf`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      }),
      fetch(`${FONT_BASE}/Pretendard-ExtraBold.otf`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      }),
    ]);
    return [
      { name: "Pretendard", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Pretendard", data: extraBold, weight: 800 as const, style: "normal" as const },
    ];
  } catch {
    return undefined;
  }
}

// 크림 페이퍼 + 잉크. 그라데이션 금지(globals.css 와 동일 원칙) —
// 타임라인에 깔리는 어두운 그라데이션 카드들 사이에서 오히려 눈에 띈다.
export default async function OG() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BRAND.paper,
          fontFamily: "Pretendard, system-ui, sans-serif",
        }}
      >
        {/* 좌측 브랜드 밴드 — 인쇄물 재단선 느낌 */}
        <div style={{ width: 20, height: "100%", background: BRAND.primary }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="56" height="56" viewBox={LOGO_VIEWBOX} fill="none">
              <path
                d={LOGO_RING_D}
                stroke={BRAND.primary}
                strokeWidth={LOGO_STROKE}
                strokeLinecap="round"
              />
              <path
                d={LOGO_CHECK_D}
                stroke={BRAND.primary}
                strokeWidth={LOGO_STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-0.045em",
                color: BRAND.ink,
              }}
            >
              PASSPOP
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.035em",
                color: BRAND.ink,
              }}
            >
              <span>모든 자격증 기출,</span>
              <span>
                한 곳에서. <span style={{ color: BRAND.primary }}>무료로.</span>
              </span>
            </div>
            <div
              style={{
                fontSize: 25,
                color: BRAND.inkMid,
                maxWidth: 900,
                lineHeight: 1.5,
              }}
            >
              찍은 오답까지 분석하는 AI 해설 · 망각곡선 복습 · 합격 예측
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 19,
              color: BRAND.inkMid,
              fontWeight: 600,
              borderTop: `1px solid ${BRAND.border}`,
              paddingTop: 26,
            }}
          >
            <span>기사 · 산업기사 · 기능사 · 기술사</span>
            <span style={{ color: BRAND.border }}>|</span>
            <span>9급 · 7급 공무원</span>
            <span style={{ color: BRAND.border }}>|</span>
            <span style={{ color: BRAND.primary }}>회원가입 없이 시작</span>
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts ? { fonts } : {}) },
  );
}
