"""Probe PDF embedded images: count, positions, surrounding text. Read-only, stdout only."""
import re
import sys
from pathlib import Path
import fitz

DOWNLOADS = Path("C:/Users/jst75/Downloads")

PDFS = [
    DOWNLOADS / "공조냉동기계기사20220305(교사용).pdf",
    DOWNLOADS / "공조냉동기계기사20220424(교사용) (1).pdf",
    DOWNLOADS / "토목기사20220424(교사용).pdf",
]

OPTION_MARKERS = ["\u2460", "\u2461", "\u2462", "\u2463"]


def probe(pdf_path: Path) -> None:
    if not pdf_path.exists():
        print(f"[MISSING] {pdf_path}")
        return
    print(f"\n===== {pdf_path.name} =====")
    doc = fitz.open(str(pdf_path))
    total_imgs = 0
    for pno, page in enumerate(doc, start=1):
        img_list = page.get_images(full=True)
        if not img_list:
            continue
        print(f"\n-- Page {pno} ({page.rect.width:.0f}x{page.rect.height:.0f}pt) --")
        print(f"   Embedded image entries: {len(img_list)}")
        for idx, img in enumerate(img_list):
            xref = img[0]
            rects = page.get_image_rects(xref)
            for r_idx, r in enumerate(rects):
                print(
                    f"   [{idx}.{r_idx}] xref={xref} "
                    f"rect=({r.x0:.0f},{r.y0:.0f},{r.x1:.0f},{r.y1:.0f}) "
                    f"w={r.width:.0f} h={r.height:.0f}"
                )
                total_imgs += 1

        text_dict = page.get_text("dict")
        q_nums = []
        option_marks = []
        for block in text_dict.get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    txt = span.get("text", "").strip()
                    if not txt:
                        continue
                    bbox = span.get("bbox", [0, 0, 0, 0])
                    m = re.match(r"^(\d{1,3})\.\s", txt)
                    if m and bbox[0] < 60:
                        q_nums.append((int(m.group(1)), bbox[1]))
                    for marker in OPTION_MARKERS:
                        if marker in txt:
                            option_marks.append((marker, bbox[0], bbox[1]))
        q_nums.sort(key=lambda t: t[1])
        print(f"   Q# on page: {[n for n,_ in q_nums]}")
        print(f"   Option markers count: {len(option_marks)}")

    print(f"\n[TOTAL] {total_imgs} image rects across doc")
    doc.close()


def main() -> int:
    for p in PDFS:
        probe(p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
