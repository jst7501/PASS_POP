/**
 * PDF → 페이지별 PNG 추출 (mupdf WASM)
 * 입력: public/exam-pdfs/[cert]/[date].pdf
 * 출력: public/exam-images/[cert]/[date]/page-NN.png (2x 해상도)
 * 실행: pnpm pdf:pages
 */
import fs from "node:fs";
import path from "node:path";
import * as mupdf from "mupdf";

const PDF_ROOT = path.resolve(process.cwd(), "public/exam-pdfs");
const IMG_ROOT = path.resolve(process.cwd(), "public/exam-images");

async function main() {
  if (!fs.existsSync(PDF_ROOT)) {
    console.error(`[err] ${PDF_ROOT} 없음`);
    process.exit(1);
  }

  const certs = fs
    .readdirSync(PDF_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let totalPdfs = 0;
  let totalPages = 0;

  for (const cert of certs) {
    const certDir = path.join(PDF_ROOT, cert);
    const pdfs = fs.readdirSync(certDir).filter((f) => f.endsWith(".pdf"));

    for (const pdfName of pdfs) {
      const pdfPath = path.join(certDir, pdfName);
      const date = pdfName.replace(/\.pdf$/, "");
      const outDir = path.join(IMG_ROOT, cert, date);
      fs.mkdirSync(outDir, { recursive: true });

      console.log(`\n[pdf] ${cert}/${pdfName} 렌더링 중...`);
      try {
        const buf = fs.readFileSync(pdfPath);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc: any = (mupdf as any).PDFDocument.openDocument(
          buf,
          "application/pdf",
        );
        const n = doc.countPages();

        for (let i = 0; i < n; i++) {
          const page = doc.loadPage(i);
          // 2x 해상도 매트릭스 [sx, 0, 0, sy, tx, ty]
          const matrix: [number, number, number, number, number, number] = [
            2, 0, 0, 2, 0, 0,
          ];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pix = page.toPixmap(matrix, (mupdf as any).ColorSpace.DeviceRGB);
          const pngBytes = pix.asPNG();
          const fileName = `page-${String(i + 1).padStart(2, "0")}.png`;
          fs.writeFileSync(
            path.join(outDir, fileName),
            Buffer.from(pngBytes),
          );
          if (typeof pix.destroy === "function") pix.destroy();
          if (typeof page.destroy === "function") page.destroy();
        }
        if (typeof doc.destroy === "function") doc.destroy();

        console.log(
          `  OK ${n} 페이지 → ${path.relative(process.cwd(), outDir)}`,
        );
        totalPdfs += 1;
        totalPages += n;
      } catch (e) {
        console.error(
          `  [fail] ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  console.log(`\n[done] PDF ${totalPdfs}개 → 페이지 ${totalPages}개 생성`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
