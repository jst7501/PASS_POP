/**
 * PDF → 페이지별 PNG (mupdf ESM)
 * 실행: node scripts/extract-pdf-pages.mjs
 */
import * as mupdf from "mupdf";
import fs from "node:fs";
import path from "node:path";

const PDF_ROOT = path.resolve(process.cwd(), "public/exam-pdfs");
const IMG_ROOT = path.resolve(process.cwd(), "public/exam-images");

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

    console.log(`\n[pdf] ${cert}/${pdfName}`);
    try {
      const buf = fs.readFileSync(pdfPath);
      const doc = mupdf.PDFDocument.openDocument(buf, "application/pdf");
      const n = doc.countPages();

      for (let i = 0; i < n; i++) {
        const page = doc.loadPage(i);
        const pix = page.toPixmap(
          [2, 0, 0, 2, 0, 0],
          mupdf.ColorSpace.DeviceRGB,
        );
        const png = pix.asPNG();
        const filename = `page-${String(i + 1).padStart(2, "0")}.png`;
        fs.writeFileSync(path.join(outDir, filename), Buffer.from(png));
      }

      console.log(
        `  OK ${n} 페이지 → ${path.relative(process.cwd(), outDir)}`,
      );
      totalPdfs++;
      totalPages += n;
    } catch (e) {
      console.error(`  [fail] ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

console.log(`\n[done] PDF ${totalPdfs}개 → 페이지 ${totalPages}개`);
