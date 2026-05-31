import { ImageResponse } from "next/og";

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
          background: "#0a0a0a",
          borderRadius: 96,
        }}
      >
        <svg width="320" height="320" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect x="1.5" y="1.5" width="29" height="29" rx="6" fill="#3b82f6" />
          <path
            d="M 11.5 9 H 17 C 19.8 9 22 11.2 22 14 C 22 16.8 19.8 19 17 19 H 14 V 23"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
