import prisma from "../lib/prisma";

async function main() {
  // 모든 stem에서 "\n\n[그림 원본 준비 중]" suffix 제거
  const targets = await prisma.question.findMany({
    where: { stem: { contains: "[그림 원본 준비 중]" } },
    select: { id: true, stem: true },
  });
  console.log("대상 문제 수:", targets.length);

  let updated = 0;
  for (const q of targets) {
    const cleaned = q.stem
      .replace(/\n\n\[그림 원본 준비 중\]$/u, "")
      .replace(/\[그림 원본 준비 중\]/gu, "")
      .trim();
    if (cleaned !== q.stem) {
      await prisma.question.update({
        where: { id: q.id },
        data: { stem: cleaned },
      });
      updated += 1;
    }
  }
  console.log("업데이트:", updated, "건");
  await prisma.$disconnect();
}
main();
