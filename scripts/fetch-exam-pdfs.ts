/**
 * comcbt 교사용 PDF 자동 다운로드
 * 실행: pnpm fetch:pdfs
 * 저장: public/exam-pdfs/[cert]/[date].pdf
 */
import fs from "node:fs";
import path from "node:path";

type Target = {
  cert: string;
  date: string;
  url: string;
};

const TARGETS: Target[] = [
  { cert: "civil-engineer-gisa", date: "20220424", url: "https://www.comcbt.com/xe/n1/5855371" },
  { cert: "hvac-refrigeration-gisa", date: "20220305", url: "https://www.comcbt.com/xe/cer/5705512" },
  { cert: "hvac-refrigeration-gisa", date: "20220424", url: "https://www.comcbt.com/xe/cer/5850130" },
];

const OUT = path.resolve(process.cwd(), "public/exam-pdfs");

const HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
  if (!res.ok) throw new Error(`HTML fetch fail ${res.status} ${url}`);
  return res.text();
}

async function fetchPdfBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
  if (!res.ok) throw new Error(`PDF fetch fail ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function extractFileSrls(html: string): string[] {
  const matches = [...html.matchAll(/file_srl=(\d+)/g)];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

async function processTarget(t: Target) {
  console.log(`\n[fetch] ${t.cert} / ${t.date}`);
  const html = await fetchHtml(t.url);
  const srls = extractFileSrls(html);
  console.log(`  file_srl 추출: [${srls.join(", ")}]`);

  // 관행상 순서: HWP교사(0), PDF교사(1), HWP학생(2), PDF학생(3)
  if (srls.length < 2) throw new Error(`file_srl 부족: ${srls.length}개`);
  const teacherPdfSrl = srls[1];
  const pdfUrl = `https://www.comcbt.com/xe/?module=file&act=procFileDownload&file_srl=${teacherPdfSrl}`;
  console.log(`  PDF 교사용 file_srl=${teacherPdfSrl}`);

  const dir = path.join(OUT, t.cert);
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, `${t.date}.pdf`);

  const buf = await fetchPdfBuffer(pdfUrl);
  const sig = buf.subarray(0, 4).toString("ascii");
  if (sig !== "%PDF") {
    // 처음 256바이트 살짝 덤프 (디버그)
    const preview = buf.subarray(0, 256).toString("utf8").replace(/\s+/g, " ");
    throw new Error(`PDF 시그니처 아님 (첫 시그니처: "${sig}"). preview: ${preview.slice(0, 200)}`);
  }
  fs.writeFileSync(dst, buf);
  console.log(`  저장 → ${path.relative(process.cwd(), dst)} (${(buf.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  let ok = 0, fail = 0;
  for (const t of TARGETS) {
    try {
      await processTarget(t);
      ok += 1;
    } catch (e) {
      fail += 1;
      console.error(`  [fail] ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.log(`\n[done] 성공 ${ok}, 실패 ${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
