import { ImageResponse } from "next/og";
import {
  BRAND,
  LOGO_CHECK_D,
  LOGO_RING_D,
  LOGO_STROKE,
  LOGO_VIEWBOX,
} from "@/lib/brand";

export const runtime = "edge";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 42,
        }}
      >
        <svg width="112" height="112" viewBox={LOGO_VIEWBOX} fill="none">
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
