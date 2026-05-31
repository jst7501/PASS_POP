import { ImageResponse } from "next/og";

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
          background: "#0a0a0a",
        }}
      >
        <svg width="288" height="288" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
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
