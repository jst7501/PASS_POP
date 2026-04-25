/**
 * PDF → 문제별 이미지 크롭
 *
 * 동작:
 *   1. public/exam-pdfs/[cert]/[date].pdf 를 열어 각 페이지를 2x 해상도로 렌더링
 *   2. 각 페이지의 텍스트 구조에서 "N." 형식의 문제 번호 y 좌표를 파싱
 *   3. 각 문제의 y 범위를 다음 문제 번호 y 또는 페이지 끝까지로 확정
 *   4. 해당 영역을 페이지 비트맵에서 크롭해 q-NNN.png 로 저장
 *
 * 출력:
 *   public/exam-images/[cert]/[date]/q-NNN.png (2x PNG)
 *   public/exam-images/[cert]/[date]/manifest.json (생성된 파일 목록)
 *
 * 실행: pnpm pdf:figures
 */
import fs from "node:fs";
import path from "node:path";
import * as mupdf from "mupdf";
import { PNG } from "pngjs";

const PDF_ROOT = path.resolve(process.cwd(), "public/exam-pdfs");
const IMG_ROOT = path.resolve(process.cwd(), "public/exam-images");

const SCALE = 2;
const PAGE_MARGIN_TOP_PX = 6 * SCALE;
const PAGE_MARGIN_BOTTOM_PX = 4 * SCALE;

type TextLine = {
  x: number;
  y: number;
  h: number;
  text: string;
  size: number;
};

type PageParse = {
  pageIndex: number;
  widthPt: number;
  heightPt: number;
  lines: TextLine[];
  questions: { number: number; yTopPt: number }[];
};

type QuestionRegion = {
  number: number;
  pageIndex: number;
  yTopPt: number;
  yBottomPt: number;
};

type Manifest = {
  cert: string;
  date: string;
  scale: number;
  questions: { number: number; file: string; pageIndex: number }[];
};

type MupdfPage = {
  getBounds(): [number, number, number, number];
  toStructuredText(opts: string): { asJSON(): string };
  toPixmap(
    matrix: [number, number, number, number, number, number],
    colorspace: unknown,
  ): MupdfPixmap;
};

type MupdfPixmap = {
  getWidth(): number;
  getHeight(): number;
  getStride(): number;
  getNumberOfComponents(): number;
  getAlpha(): number;
  getPixels(): ArrayBuffer | Uint8Array;
  destroy?(): void;
};

type MupdfDoc = {
  countPages(): number;
  loadPage(i: number): MupdfPage;
  destroy?(): void;
};

function parsePage(page: MupdfPage, pageIndex: number): PageParse {
  const [x0, y0, x1, y1] = page.getBounds();
  const widthPt = x1 - x0;
  const heightPt = y1 - y0;

  const stext = page.toStructuredText("preserve-whitespace");
  const json = JSON.parse(stext.asJSON()) as {
    blocks?: {
      type: string;
      lines?: {
        bbox: { x: number; y: number; w: number; h: number };
        font?: { size: number };
        text: string;
      }[];
    }[];
  };

  const lines: TextLine[] = [];
  for (const b of json.blocks ?? []) {
    if (b.type !== "text") continue;
    for (const ln of b.lines ?? []) {
      lines.push({
        x: ln.bbox.x,
        y: ln.bbox.y,
        h: ln.bbox.h,
        text: ln.text ?? "",
        size: ln.font?.size ?? 0,
      });
    }
  }

  const questions: { number: number; yTopPt: number }[] = [];
  for (const ln of lines) {
    const m = ln.text.match(/^\s*(\d{1,3})\.\s/);
    if (!m) continue;
    if (ln.x >= 40) continue;
    if (ln.size < 7) continue;
    const num = parseInt(m[1], 10);
    if (num < 1 || num > 200) continue;
    questions.push({ number: num, yTopPt: ln.y });
  }
  questions.sort((a, b) => a.yTopPt - b.yTopPt);

  return { pageIndex, widthPt, heightPt, lines, questions };
}

function buildRegions(pages: PageParse[]): QuestionRegion[] {
  const all: { pageIndex: number; yTopPt: number; number: number }[] = [];
  for (const p of pages) {
    for (const q of p.questions) {
      all.push({ pageIndex: p.pageIndex, yTopPt: q.yTopPt, number: q.number });
    }
  }
  all.sort((a, b) => a.number - b.number);

  const regions: QuestionRegion[] = [];
  for (let i = 0; i < all.length; i += 1) {
    const cur = all[i];
    const next = all[i + 1];
    const page = pages[cur.pageIndex];
    let yBottomPt: number;
    if (next && next.pageIndex === cur.pageIndex) {
      yBottomPt = next.yTopPt;
    } else {
      yBottomPt = page.heightPt - 24;
    }
    regions.push({
      number: cur.number,
      pageIndex: cur.pageIndex,
      yTopPt: cur.yTopPt,
      yBottomPt,
    });
  }
  return regions;
}

function cropPixmap(
  full: MupdfPixmap,
  xPx: number,
  yPx: number,
  wPx: number,
  hPx: number,
): Buffer {
  const fullW = full.getWidth();
  const fullH = full.getHeight();
  const stride = full.getStride();
  const comps = full.getNumberOfComponents();
  const hasAlpha = full.getAlpha() ? 1 : 0;
  const bytesPerPixel = comps + hasAlpha;

  const x = Math.max(0, Math.min(fullW - 1, Math.floor(xPx)));
  const y = Math.max(0, Math.min(fullH - 1, Math.floor(yPx)));
  const w = Math.max(1, Math.min(fullW - x, Math.floor(wPx)));
  const h = Math.max(1, Math.min(fullH - y, Math.floor(hPx)));

  const pixels = full.getPixels();
  const src = Buffer.from(pixels as Uint8Array);
  const png = new PNG({ width: w, height: h, colorType: 6 });

  for (let row = 0; row < h; row += 1) {
    const srcOff = (y + row) * stride + x * bytesPerPixel;
    const dstOff = row * w * 4;
    if (bytesPerPixel === 4) {
      src.copy(png.data, dstOff, srcOff, srcOff + w * 4);
    } else {
      for (let col = 0; col < w; col += 1) {
        png.data[dstOff + col * 4 + 0] = src[srcOff + col * 3 + 0];
        png.data[dstOff + col * 4 + 1] = src[srcOff + col * 3 + 1];
        png.data[dstOff + col * 4 + 2] = src[srcOff + col * 3 + 2];
        png.data[dstOff + col * 4 + 3] = 255;
      }
    }
  }

  return PNG.sync.write(png, { deflateLevel: 9, deflateStrategy: 3 });
}

async function processPdf(cert: string, pdfName: string): Promise<void> {
  const pdfPath = path.join(PDF_ROOT, cert, pdfName);
  const date = pdfName.replace(/\.pdf$/, "");
  const outDir = path.join(IMG_ROOT, cert, date);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n[pdf] ${cert}/${pdfName}`);
  const buf = fs.readFileSync(pdfPath);
  const mpAny = mupdf as unknown as {
    PDFDocument: { openDocument(b: Buffer, mime: string): MupdfDoc };
    ColorSpace: { DeviceRGB: unknown };
  };
  const doc = mpAny.PDFDocument.openDocument(buf, "application/pdf");
  const n = doc.countPages();

  const parsed: PageParse[] = [];
  const pagePixmaps: MupdfPixmap[] = [];
  for (let i = 0; i < n; i += 1) {
    const page = doc.loadPage(i);
    parsed.push(parsePage(page, i));
    const pix = page.toPixmap(
      [SCALE, 0, 0, SCALE, 0, 0],
      mpAny.ColorSpace.DeviceRGB,
    );
    pagePixmaps.push(pix);
  }

  const regions = buildRegions(parsed);
  console.log(`  감지된 문제 수: ${regions.length}`);

  const manifest: Manifest = {
    cert,
    date,
    scale: SCALE,
    questions: [],
  };

  for (const r of regions) {
    const page = parsed[r.pageIndex];
    const pix = pagePixmaps[r.pageIndex];
    const pxPerPt = SCALE;
    const xPx = 10 * pxPerPt;
    const widthUsablePt = page.widthPt - 20;
    const wPx = widthUsablePt * pxPerPt;
    const yPx = Math.max(0, r.yTopPt * pxPerPt - PAGE_MARGIN_TOP_PX);
    const hPx = Math.max(
      10,
      (r.yBottomPt - r.yTopPt) * pxPerPt + PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX,
    );

    const pngBuf = cropPixmap(pix, xPx, yPx, wPx, hPx);
    const fileName = `q-${String(r.number).padStart(3, "0")}.png`;
    fs.writeFileSync(path.join(outDir, fileName), pngBuf);
    manifest.questions.push({
      number: r.number,
      file: fileName,
      pageIndex: r.pageIndex,
    });
  }

  for (const pix of pagePixmaps) {
    if (typeof pix.destroy === "function") pix.destroy();
  }
  if (typeof doc.destroy === "function") doc.destroy();

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    `  → ${manifest.questions.length}개 이미지 저장: ${path.relative(process.cwd(), outDir)}`,
  );
}

async function main(): Promise<void> {
  if (!fs.existsSync(PDF_ROOT)) {
    console.error(`[err] ${PDF_ROOT} 없음`);
    process.exit(1);
  }

  const certs = fs
    .readdirSync(PDF_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const cert of certs) {
    const certDir = path.join(PDF_ROOT, cert);
    const pdfs = fs.readdirSync(certDir).filter((f) => f.endsWith(".pdf"));
    for (const pdfName of pdfs) {
      await processPdf(cert, pdfName);
    }
  }
  console.log("\n[done] 문제 이미지 추출 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
