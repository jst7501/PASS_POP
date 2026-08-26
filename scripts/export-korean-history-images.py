# -*- coding: utf-8 -*-
"""한능검 문제 이미지를 public/ 으로 내보낸다 (GIF → 무손실 WebP).

원본은 CBT 프로젝트(questions/_images/한국사/k1/<회차>/*.gif)에 있고,
앱에서 서빙할 사본을 public/exam-images/korean-history-simhwa/<회차>/*.webp 로 만든다.

사료 텍스트가 들어간 이미지라 손실 압축은 쓰지 않는다. 무손실 WebP 가
원본 GIF 보다 작다 (측정: 45MB → 35MB).

  python scripts/export-korean-history-images.py
  python scripts/export-korean-history-images.py --sessions 20260809 20260523
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(__file__).resolve().parent.parent
CBT = Path(r"C:/Users/jst75/pro/CBT")
SRC_ROOT = CBT / "questions" / "_images" / "한국사" / "k1"
OUT_ROOT = REPO / "public" / "exam-images" / "korean-history-simhwa"
QUESTIONS = CBT / "questions" / "한국사" / "k1.json"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sessions", nargs="*", default=None, help="회차(tablename) 지정, 없으면 전체")
    args = ap.parse_args()

    data = json.loads(QUESTIONS.read_text(encoding="utf-8"))
    sessions = args.sessions or sorted(data["sessions"], reverse=True)

    total_src = total_out = converted = skipped = 0
    manifest: dict[str, list[str]] = {}

    for tn in sessions:
        src_dir = SRC_ROOT / tn
        if not src_dir.is_dir():
            print(f"  [건너뜀] {tn}: 원본 디렉터리 없음")
            continue
        out_dir = OUT_ROOT / tn
        out_dir.mkdir(parents=True, exist_ok=True)

        names: list[str] = []
        for src in sorted(src_dir.glob("*.gif")):
            dst = out_dir / (src.stem + ".webp")
            total_src += src.stat().st_size
            if dst.exists() and dst.stat().st_size > 0:
                skipped += 1
            else:
                Image.open(src).convert("RGB").save(dst, "WEBP", lossless=True, method=5)
                converted += 1
            total_out += dst.stat().st_size
            names.append(dst.name)

        manifest[tn] = names
        print(f"  {tn}: {len(names)}장")

    (OUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8"
    )

    n = sum(len(v) for v in manifest.values())
    print()
    print(f"총 {len(manifest)}회차 / {n}장  (신규 변환 {converted}, 기존 유지 {skipped})")
    print(f"원본 GIF {total_src / 1024 / 1024:.1f}MB → WebP {total_out / 1024 / 1024:.1f}MB")
    print(f"출력: {OUT_ROOT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
