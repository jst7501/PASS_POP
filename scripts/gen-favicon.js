/**
 * app/favicon.ico 생성. lib/brand.ts 의 기하를 그대로 아날리틱 래스터라이즈한다.
 * (sharp/resvg 없이 pngjs 만으로 — 링 원호 + 체크 폴리라인은 SDF 로 충분히 정확)
 */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const OUT = process.argv[2];

const PRIMARY = [0x2c, 0x52, 0x82]; // lib/brand.ts BRAND.primary 와 동일
const WHITE = [255, 255, 255];

// lib/brand.ts 와 동일한 값
const RING = { cx: 16, cy: 16, r: 10, start: -21, end: 298 }; // deg, start→end 증가 방향
const CHECK = [
  [10.5, 16.2],
  [14.6, 20.6],
  [26.4, 5.6],
];
const HALF = 4 / 2; // LOGO_STROKE / 2

const ptAt = (deg) => [
  RING.cx + RING.r * Math.cos((deg * Math.PI) / 180),
  RING.cy + RING.r * Math.sin((deg * Math.PI) / 180),
];
const CAP0 = ptAt(RING.start);
const CAP1 = ptAt(RING.end);

function distRing(x, y) {
  const dx = x - RING.cx;
  const dy = y - RING.cy;
  let th = (Math.atan2(dy, dx) * 180) / Math.PI;
  while (th < RING.start) th += 360;
  while (th >= RING.start + 360) th -= 360;
  if (th <= RING.end) return Math.abs(Math.hypot(dx, dy) - RING.r);
  return Math.min(Math.hypot(x - CAP0[0], y - CAP0[1]), Math.hypot(x - CAP1[0], y - CAP1[1]));
}

function distSeg(x, y, a, b) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const wx = x - a[0];
  const wy = y - a[1];
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  return Math.hypot(wx - t * vx, wy - t * vy);
}

function distCheck(x, y) {
  let d = Infinity;
  for (let i = 0; i < CHECK.length - 1; i++) {
    d = Math.min(d, distSeg(x, y, CHECK[i], CHECK[i + 1]));
  }
  return d;
}

/** 마크 위(뷰박스 좌표)이면 true */
const inMark = (x, y) => Math.min(distRing(x, y), distCheck(x, y)) <= HALF;

/** 둥근 사각형 (픽셀 좌표) */
function inRoundRect(px, py, size, r) {
  const cx = Math.min(Math.max(px, r), size - r);
  const cy = Math.min(Math.max(py, r), size - r);
  if (px >= r && px <= size - r) return py >= 0 && py <= size;
  if (py >= r && py <= size - r) return px >= 0 && px <= size;
  return Math.hypot(px - cx, py - cy) <= r;
}

function render(size) {
  const png = new PNG({ width: size, height: size });
  const radius = size * 0.22;
  // 마크 bbox 는 뷰박스 4..28 (24 units). 타일의 62% 를 차지하게 축소.
  const scale = (size * 0.62) / 24.4;
  const SS = 4; // 4x4 슈퍼샘플링
  const step = 1 / SS;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgHits = 0;
      let markHits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) * step;
          const py = y + (sy + 0.5) * step;
          if (!inRoundRect(px, py, size, radius)) continue;
          bgHits++;
          const vx = (px - size / 2) / scale + 16.2;
          const vy = (py - size / 2) / scale + 15.8;
          if (inMark(vx, vy)) markHits++;
        }
      }
      const total = SS * SS;
      const bgA = bgHits / total;
      const markA = markHits / total;
      const idx = (size * y + x) << 2;
      if (bgA === 0) {
        png.data[idx] = png.data[idx + 1] = png.data[idx + 2] = png.data[idx + 3] = 0;
        continue;
      }
      // 인디고 위에 흰 마크 합성 → 그 결과를 bgA 로 알파
      const k = markA / bgA;
      for (let c = 0; c < 3; c++) {
        png.data[idx + c] = Math.round(PRIMARY[c] * (1 - k) + WHITE[c] * k);
      }
      png.data[idx + 3] = Math.round(bgA * 255);
    }
  }
  return PNG.sync.write(png);
}

const sizes = [16, 32, 48];
const images = sizes.map(render);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

let offset = 6 + 16 * images.length;
const entries = images.map((buf, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0);
  e.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});

fs.writeFileSync(OUT, Buffer.concat([header, ...entries, ...images]));
console.log("wrote", OUT, fs.statSync(OUT).size, "bytes;", sizes.join("/"));

// 눈으로 확인할 수 있게 128px 미리보기도 남긴다
const preview = path.join(path.dirname(process.argv[3] || OUT), "favicon-preview.png");
fs.writeFileSync(process.argv[3] || preview, render(128));
console.log("preview", process.argv[3] || preview);
