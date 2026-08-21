import { ImageResponse } from "next/og";
import {
  BRAND,
  LOGO_CHECK_D,
  LOGO_RING_D,
  LOGO_STROKE,
  LOGO_VIEWBOX,
} from "@/lib/brand";

// manifest(icons 512 "maskable") 참조. OS 가 임의 모양으로 마스킹하므로
// 배경은 full-bleed(모서리 둥글림 없음), 로고는 중앙 안전영역(~60%) 안에 둔다.
export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.primary,
        }}
      >
        <svg width="256" height="256" viewBox={LOGO_VIEWBOX} fill="none">
          <path
            d={LOGO_RING_D}
            stroke={BRAND.white}
            strokeWidth={LOGO_STROKE}
            strokeLinecap="round"
          />
          <path
            d={LOGO_CHECK_D}
            stroke={BRAND.white}
            strokeWidth={LOGO_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
