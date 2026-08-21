import { ImageResponse } from "next/og";
import {
  BRAND,
  LOGO_CHECK_D,
  LOGO_RING_D,
  LOGO_STROKE,
  LOGO_VIEWBOX,
} from "@/lib/brand";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS 가 자체적으로 모서리를 깎으므로 배경은 full-bleed 로 둔다.
export default function AppleIcon() {
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
        <svg width="104" height="104" viewBox={LOGO_VIEWBOX} fill="none">
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
    { ...size },
  );
}
