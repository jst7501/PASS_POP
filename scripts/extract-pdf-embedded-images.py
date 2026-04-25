"""Extract embedded images from PDFs and classify them as question-body or option images.

Inputs (from C:/Users/jst75/Downloads):
  - 공조냉동기계기사20220305(교사용).pdf -> hvac-refrigeration-gisa/20220305
  - 공조냉동기계기사20220424(교사용) (1).pdf -> hvac-refrigeration-gisa/20220424
  - 토목기사20220424(교사용).pdf -> civil-engineer-gisa/20220424

Outputs (cleared before writing):
  public/exam-images/{cert}/{date}/body/q-NNN.png
  public/exam-images/{cert}/{date}/body/q-NNN-b{k}.png      (2nd+ body image)
  public/exam-images/{cert}/{date}/option/q-NNN-o{1|2|3|4}.png
  public/exam-images/{cert}/{date}/manifest.json

manifest.json schema:
  { cert, date("YYYYMMDD"), source, items: [
      { question:int, kind:"body"|"option", file:str, page:int,
        rect:[x0,y0,x1,y1], optionIndex?:1|2|3|4 }
  ] }

Classification:
  For each embedded image rect on a page:
    1. Assign question number: highest y question# at or above the image (same page or earlier).
    2. Gather ① ② ③ ④ markers inside that question's y-range (up to next question).
    3. Match image center to nearest same-column marker by weighted distance.
    4. If matched within threshold -> option with that index; else body.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

import fitz

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_IMG = ROOT / "public" / "exam-images"
DOWNLOADS = Path("C:/Users/jst75/Downloads")

OPTION_CHARS = ["\u2460", "\u2461", "\u2462", "\u2463"]
OPTION_INDEX = {c: i + 1 for i, c in enumerate(OPTION_CHARS)}

JOBS = [
    {
        "pdf": DOWNLOADS / "공조냉동기계기사20220305(교사용).pdf",
        "cert": "hvac-refrigeration-gisa",
        "date": "20220305",
    },
    {
        "pdf": DOWNLOADS / "공조냉동기계기사20220424(교사용) (1).pdf",
        "cert": "hvac-refrigeration-gisa",
        "date": "20220424",
    },
    {
        "pdf": DOWNLOADS / "토목기사20220424(교사용).pdf",
        "cert": "civil-engineer-gisa",
        "date": "20220424",
    },
]


@dataclass
class Span:
    text: str
    x0: float
    y0: float
    x1: float
    y1: float


@dataclass
class QNum:
    number: int
    y: float
    x: float
    page: int


@dataclass
class Marker:
    char: str
    index: int
    x: float
    y: float
    page: int


@dataclass
class ImageRect:
    xref: int
    page: int
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def cx(self) -> float:
        return (self.x0 + self.x1) / 2

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2


@dataclass
class ManifestItem:
    question: int
    kind: str
    file: str
    page: int
    rect: list[float]
    optionIndex: Optional[int] = None


def collect_spans(page: fitz.Page) -> list[Span]:
    data = page.get_text("dict")
    out: list[Span] = []
    for block in data.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "")
                if not text:
                    continue
                bbox = span.get("bbox", [0, 0, 0, 0])
                out.append(Span(text=text, x0=bbox[0], y0=bbox[1], x1=bbox[2], y1=bbox[3]))
    return out


def collect_qnums(spans: list[Span], page_idx: int) -> list[QNum]:
    qnums: list[QNum] = []
    q_pattern = re.compile(r"^\s*(\d{1,3})\.\s")
    for s in spans:
        m = q_pattern.match(s.text)
        if not m:
            continue
        if not (s.x0 < 60 or 280 <= s.x0 < 360):
            continue
        num = int(m.group(1))
        if num < 1 or num > 200:
            continue
        qnums.append(QNum(number=num, y=s.y0, x=s.x0, page=page_idx))
    qnums.sort(key=lambda q: (q.page, q.y, q.x))
    return qnums


def question_column(q: QNum) -> str:
    return "left" if q.x < 100 else "right"


def image_column(img: ImageRect) -> str:
    return "left" if img.cx < 300 else "right"


def marker_column(m: Marker) -> str:
    return "left" if m.x < 300 else "right"


def collect_markers(spans: list[Span], page_idx: int) -> list[Marker]:
    markers: list[Marker] = []
    for s in spans:
        for ch in s.text:
            if ch in OPTION_INDEX:
                markers.append(
                    Marker(
                        char=ch,
                        index=OPTION_INDEX[ch],
                        x=s.x0,
                        y=(s.y0 + s.y1) / 2,
                        page=page_idx,
                    )
                )
    return markers


def collect_image_rects(page: fitz.Page, page_idx: int) -> list[ImageRect]:
    rects: list[ImageRect] = []
    for img in page.get_images(full=True):
        xref = img[0]
        for r in page.get_image_rects(xref):
            rects.append(
                ImageRect(
                    xref=xref,
                    page=page_idx,
                    x0=r.x0,
                    y0=r.y0,
                    x1=r.x1,
                    y1=r.y1,
                )
            )
    return rects


def assign_question(img: ImageRect, qnums_sorted: list[QNum]) -> Optional[QNum]:
    img_col = image_column(img)
    same_col = [
        q for q in qnums_sorted
        if q.page == img.page and q.y <= img.y0 + 2 and question_column(q) == img_col
    ]
    if same_col:
        return same_col[-1]
    any_col = [q for q in qnums_sorted if q.page == img.page and q.y <= img.y0 + 2]
    if any_col:
        return any_col[-1]
    earlier = [q for q in qnums_sorted if q.page < img.page]
    return earlier[-1] if earlier else None


def next_question_same_column(q: QNum, qnums_sorted: list[QNum]) -> Optional[QNum]:
    col = question_column(q)
    for nq in qnums_sorted:
        if nq.page < q.page:
            continue
        if nq.page == q.page and nq.y <= q.y:
            continue
        if question_column(nq) == col:
            return nq
    return None


def classify_image(
    img: ImageRect,
    qnums: list[QNum],
    markers: list[Marker],
    page_heights: dict[int, float],
) -> tuple[str, Optional[int]]:
    q = assign_question(img, qnums)
    if q is None:
        return ("body", None)

    next_q = next_question_same_column(q, qnums)
    if next_q is not None:
        q_end_page = next_q.page
        q_end_y = next_q.y
    else:
        q_end_page = img.page
        q_end_y = page_heights.get(img.page, 1e9)

    img_col = image_column(img)
    relevant: list[Marker] = []
    for m in markers:
        if marker_column(m) != img_col:
            continue
        in_range = False
        if m.page == q.page and q.page == q_end_page:
            if q.y - 5 <= m.y <= q_end_y:
                in_range = True
        elif m.page == q.page:
            if m.y >= q.y - 5:
                in_range = True
        elif q.page < m.page < q_end_page:
            in_range = True
        elif m.page == q_end_page and q.page != q_end_page:
            if m.y <= q_end_y:
                in_range = True
        if in_range:
            relevant.append(m)

    page_markers = [m for m in relevant if m.page == img.page]
    if not page_markers:
        return ("body", None)

    candidates = page_markers

    best: Optional[Marker] = None
    best_score = 1e18
    for m in candidates:
        if m.y > img.y1 + 12:
            continue
        if m.y < img.y0 - 80:
            continue
        dy = abs(img.cy - m.y)
        x_gap = max(0.0, m.x - img.x0)
        dx = abs(img.cx - m.x)
        score = dy + 0.3 * x_gap + 0.05 * dx
        if score < best_score:
            best_score = score
            best = m

    if best is None or best_score > 90:
        return ("body", None)
    return ("option", best.index)


def _cluster_values(values: list[float], tol: float) -> list[list[int]]:
    order = sorted(range(len(values)), key=lambda i: values[i])
    groups: list[list[int]] = []
    cur: list[int] = []
    last = None
    for idx in order:
        v = values[idx]
        if last is None or v - last <= tol:
            cur.append(idx)
        else:
            groups.append(cur)
            cur = [idx]
        last = v
    if cur:
        groups.append(cur)
    return groups


def classify_question_group(
    imgs: list[ImageRect],
    qnums: list[QNum],
    markers: list[Marker],
    page_heights: dict[int, float],
) -> list[tuple[str, Optional[int]]]:
    """Classify all images assigned to same question. Prefers geometric pattern when clear."""
    n = len(imgs)
    results: list[tuple[str, Optional[int]]] = [("body", None)] * n

    if n == 0:
        return results

    widths = [img.x1 - img.x0 for img in imgs]
    heights = [img.y1 - img.y0 for img in imgs]
    avg_w = sum(widths) / n
    avg_h = sum(heights) / n

    def similar_to_avg(i: int) -> bool:
        return (
            abs(widths[i] - avg_w) / max(avg_w, 1) < 0.35
            and abs(heights[i] - avg_h) / max(avg_h, 1) < 0.45
            and widths[i] < 180
            and heights[i] < 70
        )

    if n == 4 and all(similar_to_avg(i) for i in range(n)):
        x_groups = _cluster_values([img.x0 for img in imgs], tol=25)
        y_groups = _cluster_values([img.y0 for img in imgs], tol=20)

        if len(x_groups) == 2 and len(y_groups) == 2:
            x_sorted = sorted(x_groups, key=lambda g: imgs[g[0]].x0)
            y_sorted = sorted(y_groups, key=lambda g: imgs[g[0]].y0)
            left_idxs = set(x_sorted[0])
            top_idxs = set(y_sorted[0])
            for i in range(n):
                is_left = i in left_idxs
                is_top = i in top_idxs
                if is_top and is_left:
                    oidx = 1
                elif is_top and not is_left:
                    oidx = 2
                elif not is_top and is_left:
                    oidx = 3
                else:
                    oidx = 4
                results[i] = ("option", oidx)
            return results

        if len(x_groups) == 1 and len(y_groups) == 4:
            order = sorted(range(n), key=lambda i: imgs[i].y0)
            for rank, i in enumerate(order):
                results[i] = ("option", rank + 1)
            return results

        if len(y_groups) == 1 and len(x_groups) == 4:
            order = sorted(range(n), key=lambda i: imgs[i].x0)
            for rank, i in enumerate(order):
                results[i] = ("option", rank + 1)
            return results

    for i, img in enumerate(imgs):
        results[i] = classify_image(img, qnums, markers, page_heights)
    return results


def clear_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def save_pixmap(doc: fitz.Document, xref: int, target: Path) -> None:
    pix = fitz.Pixmap(doc, xref)
    try:
        if pix.alpha or pix.colorspace is None or pix.colorspace.n > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(str(target))
    finally:
        pix = None


def process_pdf(pdf_path: Path, cert: str, date: str) -> Optional[dict]:
    if not pdf_path.exists():
        print(f"[SKIP] missing: {pdf_path}")
        return None

    out_root = PUBLIC_IMG / cert / date
    clear_dir(out_root)
    body_dir = out_root / "body"
    opt_dir = out_root / "option"
    body_dir.mkdir(parents=True, exist_ok=True)
    opt_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[OPEN] {pdf_path.name}")
    doc = fitz.open(str(pdf_path))

    all_qnums: list[QNum] = []
    all_markers: list[Marker] = []
    all_images: list[ImageRect] = []
    page_heights: dict[int, float] = {}

    for pno, page in enumerate(doc):
        page_heights[pno] = page.rect.height
        spans = collect_spans(page)
        all_qnums.extend(collect_qnums(spans, pno))
        all_markers.extend(collect_markers(spans, pno))
        all_images.extend(collect_image_rects(page, pno))

    all_qnums.sort(key=lambda q: (q.page, q.y))

    items: list[ManifestItem] = []
    body_counter: dict[int, int] = {}
    opt_seen: dict[tuple[int, int], int] = {}

    by_question: dict[int, list[ImageRect]] = {}
    orphan_images: list[ImageRect] = []
    for img in all_images:
        q = assign_question(img, all_qnums)
        if q is None:
            orphan_images.append(img)
            continue
        by_question.setdefault(q.number, []).append(img)

    for img in orphan_images:
        print(f"  [WARN] no question on p{img.page+1} y={img.y0:.0f}")

    for q_num in sorted(by_question.keys()):
        q_imgs = by_question[q_num]
        classifications = classify_question_group(q_imgs, all_qnums, all_markers, page_heights)

        for img, (kind, oidx) in zip(q_imgs, classifications):
            if kind == "body":
                n = body_counter.get(q_num, 0) + 1
                body_counter[q_num] = n
                suffix = "" if n == 1 else f"-b{n}"
                fname = f"q-{q_num:03d}{suffix}.png"
                target = body_dir / fname
                save_pixmap(doc, img.xref, target)
                items.append(
                    ManifestItem(
                        question=q_num,
                        kind="body",
                        file=f"body/{fname}",
                        page=img.page + 1,
                        rect=[img.x0, img.y0, img.x1, img.y1],
                    )
                )
            else:
                key = (q_num, oidx or 0)
                dup = opt_seen.get(key, 0) + 1
                opt_seen[key] = dup
                suffix = "" if dup == 1 else f"-d{dup}"
                fname = f"q-{q_num:03d}-o{oidx}{suffix}.png"
                target = opt_dir / fname
                save_pixmap(doc, img.xref, target)
                items.append(
                    ManifestItem(
                        question=q_num,
                        kind="option",
                        file=f"option/{fname}",
                        page=img.page + 1,
                        rect=[img.x0, img.y0, img.x1, img.y1],
                        optionIndex=oidx,
                    )
                )

    doc.close()

    manifest = {
        "cert": cert,
        "date": date,
        "source": pdf_path.name,
        "items": [asdict(i) for i in items],
    }
    (out_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    body_count = sum(1 for i in items if i.kind == "body")
    opt_count = sum(1 for i in items if i.kind == "option")
    print(f"  body={body_count} option={opt_count} total={len(items)}")
    print(f"  -> {out_root}")
    return manifest


def main() -> int:
    if not PUBLIC_IMG.exists():
        PUBLIC_IMG.mkdir(parents=True, exist_ok=True)

    for child in list(PUBLIC_IMG.iterdir()):
        if child.is_dir():
            shutil.rmtree(child)
            print(f"[CLEAR] {child}")

    for job in JOBS:
        process_pdf(job["pdf"], job["cert"], job["date"])

    print("\n[DONE]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
