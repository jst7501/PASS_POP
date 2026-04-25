"""Bulk download teacher PDFs from comcbt.com for all 기능사/산업기사/기사 certs.

Usage:
  python scripts/fetch-all-comcbt-pdfs.py
  python scripts/fetch-all-comcbt-pdfs.py --limit-per-cert 5

Resumable: skips files already on disk. Rate-limited to be polite to the server.
Manifest written to public/exam-pdfs/_comcbt-manifest.json on each cert completion.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CERT_MAP = ROOT / "scripts" / "cert-map.json"
PDF_ROOT = ROOT / "public" / "exam-pdfs"
MANIFEST_PATH = PDF_ROOT / "_comcbt-manifest.json"
LOG_PATH = ROOT / "scripts" / ".fetch-pdfs.log"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}

DATE_TITLE_RE = re.compile(r"(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일")
TITLE_TAG_RE = re.compile(r"<title>([^<]+)</title>")
ATTACHMENT_RE = re.compile(
    r'data-file-srl="(\d+)"\s+href="([^"]+procFileDownload[^"]+)">([^<]+)</a>'
)

REQUEST_DELAY_SEC = 1.0
DOWNLOAD_DELAY_SEC = 1.5
MAX_RETRIES = 3
RETRY_BACKOFF_SEC = 4.0


class Logger:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.fp = open(self.path, "a", encoding="utf-8")

    def log(self, msg: str) -> None:
        ts = time.strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        print(line, flush=True)
        self.fp.write(line + "\n")
        self.fp.flush()

    def close(self) -> None:
        self.fp.close()


def http_get(url: str, *, binary: bool = False) -> bytes | str:
    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                if binary:
                    return data
                return data.decode("utf-8", errors="replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            last_err = e
            time.sleep(RETRY_BACKOFF_SEC * (attempt + 1))
    raise RuntimeError(f"GET failed after {MAX_RETRIES} retries: {url}: {last_err}")


def list_post_srls(mid: str, log: Logger, max_pages: int = 30) -> list[str]:
    post_re = re.compile(rf'href="https://www\.comcbt\.com/xe/{re.escape(mid)}/(\d+)"')
    found: list[str] = []
    seen: set[str] = set()
    for page in range(1, max_pages + 1):
        if page == 1:
            url = f"https://www.comcbt.com/xe/{mid}"
        else:
            url = f"https://www.comcbt.com/xe/index.php?mid={mid}&page={page}"
        try:
            html = http_get(url)
        except RuntimeError as e:
            log.log(f"  [page-fail] {mid} page={page}: {e}")
            break
        time.sleep(REQUEST_DELAY_SEC)
        srls = post_re.findall(html if isinstance(html, str) else "")
        new_srls = [s for s in srls if s not in seen]
        if not new_srls:
            break
        for s in new_srls:
            seen.add(s)
            found.append(s)
        if "page=" + str(page + 1) not in (html if isinstance(html, str) else ""):
            break
    return found


def parse_date_from_title(title: str) -> str | None:
    m = DATE_TITLE_RE.search(title)
    if not m:
        return None
    y, mo, d = m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)
    return f"{y}{mo}{d}"


def parse_post(html: str) -> tuple[str | None, list[dict]]:
    """Return (title, attachments) where attachments is a list of
    {file_srl, url, name} dicts (url is the full download URL with sid/module_srl)."""
    title_m = TITLE_TAG_RE.search(html)
    title = title_m.group(1).strip() if title_m else ""
    attachments: list[dict] = []
    seen: set[str] = set()
    for m in ATTACHMENT_RE.finditer(html):
        srl, raw_url, fname = m.group(1), m.group(2), m.group(3).strip()
        if srl in seen:
            continue
        seen.add(srl)
        url = raw_url.replace("&amp;", "&")
        attachments.append({"file_srl": srl, "url": url, "name": fname})
    return (title or None, attachments)


def pick_teacher_pdf(attachments: list[dict]) -> dict | None:
    for a in attachments:
        n = a["name"]
        if n.lower().endswith(".pdf") and "교사용" in n:
            return a
    return None


def download_pdf(url: str, file_srl: str, dest: Path, log: Logger) -> bool:
    try:
        buf = http_get(url, binary=True)
    except RuntimeError as e:
        log.log(f"  [download-fail] file_srl={file_srl}: {e}")
        return False
    if not isinstance(buf, (bytes, bytearray)):
        log.log(f"  [bad-type] file_srl={file_srl}")
        return False
    if len(buf) < 1024:
        log.log(f"  [too-small] file_srl={file_srl} ({len(buf)} bytes)")
        return False
    if buf[:4] != b"%PDF":
        log.log(f"  [not-pdf] file_srl={file_srl} (sig={buf[:4]!r})")
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(buf)
    return True


def load_manifest() -> dict[str, dict]:
    if not MANIFEST_PATH.exists():
        return {}
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        return {entry["mid"]: entry for entry in data.get("certs", [])}
    except Exception:
        return {}


def save_manifest(manifest: dict[str, dict]) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {"certs": list(manifest.values())}
    MANIFEST_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def process_cert(cert: dict, manifest: dict[str, dict], log: Logger, limit: int | None) -> None:
    mid: str = cert["mid"]
    name: str = cert["name"]
    level: str = cert["level"]

    log.log(f"\n=== {level} / {name} (mid={mid}) ===")

    cert_dir = PDF_ROOT / mid
    cert_dir.mkdir(parents=True, exist_ok=True)

    entry = manifest.get(mid) or {
        "mid": mid,
        "name": name,
        "level": level,
        "rounds": [],
    }
    existing_srls = {r["postSrl"] for r in entry["rounds"]}

    try:
        post_srls = list_post_srls(mid, log)
    except Exception as e:
        log.log(f"  [list-fail] {mid}: {e}")
        return
    log.log(f"  posts: {len(post_srls)}")

    if limit is not None:
        post_srls = post_srls[:limit]

    saved = 0
    for post_srl in post_srls:
        if post_srl in existing_srls:
            continue
        post_url = f"https://www.comcbt.com/xe/{mid}/{post_srl}"
        try:
            html = http_get(post_url)
        except RuntimeError as e:
            log.log(f"  [post-fail] {post_srl}: {e}")
            continue
        if not isinstance(html, str):
            continue
        time.sleep(REQUEST_DELAY_SEC)

        title, attachments = parse_post(html)
        if not title or not attachments:
            log.log(f"  [skip] {post_srl}: title={title!r} attachments={len(attachments)}")
            continue

        date = parse_date_from_title(title)
        if not date:
            log.log(f"  [no-date] {post_srl}: {title[:60]}")
            continue

        teacher = pick_teacher_pdf(attachments)
        if teacher is None:
            log.log(f"  [no-teacher-pdf] {post_srl}: names={[a['name'] for a in attachments]}")
            continue

        dest = cert_dir / f"{date}.pdf"
        if dest.exists() and dest.stat().st_size > 1024:
            entry["rounds"].append({
                "date": date,
                "title": title,
                "postSrl": post_srl,
                "fileSrl": teacher["file_srl"],
            })
            existing_srls.add(post_srl)
            continue

        ok = download_pdf(teacher["url"], teacher["file_srl"], dest, log)
        if ok:
            saved += 1
            entry["rounds"].append({
                "date": date,
                "title": title,
                "postSrl": post_srl,
                "fileSrl": teacher["file_srl"],
            })
            existing_srls.add(post_srl)
            log.log(f"  + {date}.pdf ({dest.stat().st_size // 1024} KB)")
        time.sleep(DOWNLOAD_DELAY_SEC)

    log.log(f"  [cert-done] {name}: +{saved} new, {len(entry['rounds'])} total")
    manifest[mid] = entry
    save_manifest(manifest)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit-per-cert", type=int, default=None)
    parser.add_argument("--start-from", type=int, default=0, help="Skip first N certs")
    parser.add_argument("--levels", default="기사,산업기사,기능사")
    args = parser.parse_args()

    if not CERT_MAP.exists():
        print(f"[err] {CERT_MAP} not found. Run extract-cert-map.py first.", file=sys.stderr)
        return 1

    cert_data = json.loads(CERT_MAP.read_text(encoding="utf-8"))
    certs = cert_data.get("certs", [])
    levels_filter = {s.strip() for s in args.levels.split(",") if s.strip()}
    certs = [c for c in certs if c["level"] in levels_filter]

    if args.start_from > 0:
        certs = certs[args.start_from:]

    log = Logger(LOG_PATH)
    manifest = load_manifest()

    log.log(f"[start] {len(certs)} certs, levels={sorted(levels_filter)}")

    try:
        for i, cert in enumerate(certs, start=1):
            log.log(f"\n[{i}/{len(certs)}] {cert['level']} {cert['name']}")
            try:
                process_cert(cert, manifest, log, args.limit_per_cert)
            except KeyboardInterrupt:
                raise
            except Exception as e:
                log.log(f"  [cert-error] {cert.get('mid')}: {e}")
            time.sleep(REQUEST_DELAY_SEC)
    except KeyboardInterrupt:
        log.log("[interrupted]")
    finally:
        save_manifest(manifest)
        log.log(f"[end] manifest -> {MANIFEST_PATH}")
        log.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
