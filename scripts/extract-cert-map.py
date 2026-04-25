"""Parse comcbt home page to build a cert mid -> name mapping for 기사/산업기사/기능사."""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOME_URL = "https://www.comcbt.com/xe/"
OUT_PATH = ROOT / "scripts" / "cert-map.json"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)

A2_RE = re.compile(
    r'<a\s+href="https://www\.comcbt\.com/xe/([a-z0-9_]+)"\s+class="a2"><span>([^<]+)</span></a>'
)
A3_RE = re.compile(
    r'<a\s+href="https://www\.comcbt\.com/xe/([a-z0-9_]+)"\s+class="a3"><span>([^<]+)</span></a>'
)

LEVELS = {"기사", "산업기사", "기능사"}


def fetch_home() -> str:
    req = urllib.request.Request(HOME_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_certs(html: str) -> list[dict]:
    """Walk the document; track current level header (a2 of 기사/산업기사/기능사),
    collect a3 entries beneath each.
    """
    pattern = re.compile(
        r'<a\s+href="https://www\.comcbt\.com/xe/([a-z0-9_]+)"\s+class="(a2|a3)"><span>([^<]+)</span></a>'
    )
    current_level: str | None = None
    out: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for m in pattern.finditer(html):
        mid, cls, name = m.group(1), m.group(2), m.group(3).strip()
        if cls == "a2":
            current_level = name if name in LEVELS else None
            continue
        if cls == "a3" and current_level:
            key = (mid, name)
            if key in seen:
                continue
            seen.add(key)
            out.append({"mid": mid, "name": name, "level": current_level})
    return out


def main() -> int:
    html = fetch_home()
    certs = parse_certs(html)

    by_level: dict[str, int] = {}
    for c in certs:
        by_level[c["level"]] = by_level.get(c["level"], 0) + 1

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps({"certs": certs}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    total = len(certs)
    print(f"[done] {total} certs ({by_level})")
    print(f"  -> {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
