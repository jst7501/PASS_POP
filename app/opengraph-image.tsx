import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PASSPOP — 자격증·공무원 시험 무료 기출문제 & AI 오답 해설";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #1e3a8a 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg
            width="72"
            height="72"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="1.5"
              y="1.5"
              width="29"
              height="29"
              rx="6"
              fill="#3b82f6"
            />
            <path
              d="M 11.5 9 H 17 C 19.8 9 22 11.2 22 14 C 22 16.8 19.8 19 17 19 H 14 V 23"
              stroke="white"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            PASSPOP
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            <span>자격증·공무원 시험</span>
            <span style={{ color: "#60a5fa" }}>풀면서 합격까지.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#cbd5e1",
              maxWidth: 1000,
              lineHeight: 1.5,
            }}
          >
            무료 CBT 기출 · AI 오답 해설 · 망각곡선 복습 · 합격 예측
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 18,
            color: "#94a3b8",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              padding: "8px 16px",
              border: "1px solid #334155",
              borderRadius: 8,
            }}
          >
            기사·산업기사·기능사
          </span>
          <span
            style={{
              padding: "8px 16px",
              border: "1px solid #334155",
              borderRadius: 8,
            }}
          >
            9급·7급 공무원
          </span>
          <span
            style={{
              padding: "8px 16px",
              border: "1px solid #334155",
              borderRadius: 8,
            }}
          >
            회원가입 없이 시작
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
