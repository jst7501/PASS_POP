import { ImageResponse } from "next/og";
import {
  BRAND,
  LOGO_CHECK_D,
  LOGO_RING_D,
  LOGO_STROKE,
  LOGO_VIEWBOX,
} from "@/lib/brand";

// manifest(icons 512 "any") 및 schema.org Organization.logo 가 참조.
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
          borderRadius: 112,
        }}
      >
        <svg width="298" height="298" viewBox={LOGO_VIEWBOX} fill="none">
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
