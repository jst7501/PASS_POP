/**
 * 어드민 권한 부여 — User.nickname 을 "관리자" 로 세팅한다.
 *
 * 이 앱에는 로그인이 없다. 방문자마다 passpop_uid 쿠키가 발급되고 그게 곧
 * 계정이며, 어드민 판별은 그 User 의 nickname 이 "관리자" 인지 하나뿐이다.
 * (app/admin/waitlist/page.tsx 의 notFound() 게이트)
 *
 * 쓰는 법:
 *   1. 브라우저에서 사이트를 연다 (쿠키가 발급된다)
 *   2. F12 → Application → Cookies → passpop_uid 값 복사
 *   3. node scripts/make-admin.mjs <붙여넣기>
 *
 * 해제:
 *   node scripts/make-admin.mjs <uid> --revoke
 *
 * 주의: 닉네임을 사용자가 직접 바꿀 수 있는 기능을 붙이는 순간 아무나 어드민이
 * 된다. 그 전에 환경변수 기반(ADMIN_USER_IDS)으로 옮길 것.
 */
import { PrismaClient } from "../lib/generated/prisma-client/index.js";

const uid = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!uid) {
  console.error("사용법: node scripts/make-admin.mjs <passpop_uid> [--revoke]");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    console.error(
      `해당 uid 의 유저가 없습니다: ${uid}\n` +
        `사이트를 한 번 열어 쿠키가 발급된 뒤 다시 실행하세요.`,
    );
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: uid },
    data: { nickname: revoke ? null : "관리자" },
    select: { id: true, nickname: true },
  });

  console.log(
    revoke
      ? `해제됨: ${updated.id}`
      : `관리자 지정됨: ${updated.id}\n이제 /admin/waitlist 에 접근할 수 있습니다.`,
  );
} finally {
  await prisma.$disconnect();
}
