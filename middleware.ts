import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 익명 유저 쿠키 보장 middleware
 * - Edge runtime에서 쿠키 생성 (Server Action/Route Handler 밖에서도 OK)
 * - User row는 lib/auth/anon.ts 의 getCurrentUser()에서 upsert 로 lazy 생성
 */

const COOKIE_NAME = "passpop_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function middleware(req: NextRequest) {
  if (req.cookies.has(COOKIE_NAME)) {
    return NextResponse.next();
  }

  const id = crypto.randomUUID();
  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
