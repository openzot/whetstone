#!/usr/bin/env bash
# Hold the whetstone's shape: site/ is the index page, the ledger and the
# versions shelf; versions/ holds exactly the folders 0..N where N is the
# number of passes in the ledger; every version is the three-file game with
# its preview.png (recorded by scripts/probe.sh, so the shelf shows what
# every version looked like) plus an optional assets/ folder of media and
# data - never code - with no external requests and the fixed API in place; and the ledger is a valid honing log -
# sequential passes, dated, one facet each, no facet two passes running.
# Exit 0 when the site is publishable.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 - <<'PY'
import json, os, re, sys

problems = []
def bad(msg): problems.append(msg)

GAME_FILES = ["index.html", "game.css", "game.js"]
# media and data an assets/ folder may hold - never code, which belongs in
# the three files above
ASSET_EXT = {
    "png", "jpg", "jpeg", "webp", "gif", "svg", "ico",
    "glb", "gltf", "obj", "mtl", "bin", "ktx2", "basis", "hdr",
    "mp3", "ogg", "wav", "flac",
    "woff", "woff2", "ttf", "otf",
    "json", "csv", "txt",
}
FACETS = {"feel", "challenge", "depth", "world", "audio", "looks", "clarity", "reach", "craft", "repair"}

external = re.compile(
    r"""(?:src|href|action|poster|data)\s*=\s*["']\s*(?:https?:)?//|url\(\s*["']?\s*(?:https?:)?//|"""
    r"""\bfetch\(\s*["'`](?:https?:)?//|\bimport\(\s*["'`](?:https?:)?//|^\s*import\s.*from\s*["'`](?:https?:)?//|"""
    r"""new\s+(?:WebSocket|EventSource|XMLHttpRequest|Audio|Image|Worker)\s*\(\s*["'`](?:https?:)?//""",
    re.I | re.M,
)

# --- the ledger -----------------------------------------------------------
ledger = None
try:
    with open("site/ledger.json", encoding="utf-8") as f:
        ledger = json.load(f)
except FileNotFoundError:
    bad("site/ledger.json does not exist")
except Exception as e:
    bad(f"site/ledger.json is not valid JSON: {e}")
if ledger is not None and not isinstance(ledger, list):
    bad("site/ledger.json must be a JSON array")
    ledger = None

required = ["shift", "date", "facet", "grievance", "change", "proof"]
if ledger:
    prev_facet = None
    for i, e in enumerate(ledger):
        where = f"ledger entry {i}"
        if not isinstance(e, dict):
            bad(f"{where}: not an object"); continue
        for k in required:
            v = e.get(k)
            ok = isinstance(v, int) if k == "shift" else (isinstance(v, str) and v.strip())
            if not ok:
                bad(f"{where}: missing or empty field '{k}'")
        if isinstance(e.get("shift"), int) and e["shift"] != i + 1:
            bad(f"{where}: shift is {e['shift']}, expected {i + 1} (passes are sequential from 1)")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(e.get("date", ""))):
            bad(f"{where}: date must be YYYY-MM-DD")
        facet = str(e.get("facet", "")).strip().lower()
        if facet not in FACETS:
            bad(f"{where}: facet {facet!r} is not one of {', '.join(sorted(FACETS))}")
        if facet == prev_facet and facet != "repair":
            bad(f"{where}: facet {facet!r} repeats the previous pass; the stone turns")
        prev_facet = facet
passes = len(ledger) if isinstance(ledger, list) else 0

# --- the shape: index + ledger + versions/0..N ----------------------------
if not os.path.isdir("site"):
    print("check: site/ does not exist"); sys.exit(1)
top = sorted(n for n in os.listdir("site") if n != ".DS_Store")
expected_top = ["index.html", "ledger.json", "versions"]
for n in expected_top:
    if n not in top:
        bad(f"site/ is missing {n}")
extra = [n for n in top if n not in expected_top]
if extra:
    bad(f"extra files in site/: {', '.join(extra)} (the whetstone is exactly {', '.join(expected_top)})")

# The log page may *link out* (to the repository, to the sibling factories)
# but may not *load* anything external - no scripts, styles, fonts or fetches.
external_resource = re.compile(
    r"""(?:src|action|poster|data)\s*=\s*["']\s*(?:https?:)?//|url\(\s*["']?\s*(?:https?:)?//|"""
    r"""<link\b[^>]*\bhref\s*=\s*["']\s*(?:https?:)?//|"""
    r"""\bfetch\(\s*["'`](?:https?:)?//|\bimport\(\s*["'`](?:https?:)?//|"""
    r"""new\s+(?:WebSocket|EventSource|XMLHttpRequest|Audio|Image|Worker)\s*\(\s*["'`](?:https?:)?//""",
    re.I | re.M,
)
if os.path.isfile("site/index.html"):
    with open("site/index.html", encoding="utf-8", errors="replace") as f:
        m = external_resource.search(f.read())
    if m:
        bad(f"external resource in site/index.html: {m.group(0).strip()!r}")

versions = []
if os.path.isdir("site/versions"):
    on_disk = sorted(n for n in os.listdir("site/versions") if n != ".DS_Store")
    stray = [n for n in on_disk if not re.fullmatch(r"\d+", n) or not os.path.isdir(os.path.join("site/versions", n))]
    if stray:
        bad(f"stray entries in site/versions/: {', '.join(stray)} (versions are folders named 0, 1, 2, ...)")
    versions = sorted(int(n) for n in on_disk if re.fullmatch(r"\d+", n))
    expected = list(range(passes + 1))
    if versions != expected:
        bad(f"site/versions/ holds {versions or 'nothing'}, expected exactly 0..{passes} "
            f"(one folder per pass in the ledger, plus the seed at 0; older versions are never removed)")
else:
    bad("site/versions/ does not exist")

# --- every version is the three-file game ---------------------------------
for v in versions:
    d = os.path.join("site/versions", str(v))
    where = f"version {v}"
    missing = [n for n in GAME_FILES if not os.path.isfile(os.path.join(d, n))]
    if missing:
        bad(f"{where}: {d} is missing {', '.join(missing)}"); continue
    extra = [n for n in os.listdir(d) if n not in GAME_FILES and n not in ("assets", "preview.png", ".DS_Store")]
    if extra:
        bad(f"{where}: extra files in {d}: {', '.join(sorted(extra))} "
            f"(a version is exactly {', '.join(GAME_FILES)} and preview.png, plus an optional assets/ folder)")

    preview = os.path.join(d, "preview.png")
    if not os.path.isfile(preview):
        bad(f"{where}: {d} has no preview.png - run scripts/probe.sh on it to record what it looks like")
    elif os.path.getsize(preview) > 512 * 1024:
        bad(f"{where}: preview.png is {os.path.getsize(preview) // 1024} KB; keep it under about 512 KB")

    total = sum(os.path.getsize(os.path.join(d, n)) for n in GAME_FILES)
    if total > 200 * 1024:
        bad(f"{where}: {total // 1024} KB across its three files; the ceiling is about 200 KB - tighten before adding")

    assets_dir = os.path.join(d, "assets")
    assets_total = 0
    if os.path.isdir(assets_dir):
        for root, _, names in os.walk(assets_dir):
            for n in names:
                if n == ".DS_Store":
                    continue
                fp = os.path.join(root, n)
                assets_total += os.path.getsize(fp)
                ext = n.rsplit(".", 1)[-1].lower() if "." in n else ""
                if ext not in ASSET_EXT:
                    bad(f"{where}: {fp} is not an asset ({'.' + ext if ext else 'no extension'}); "
                        f"assets/ holds media and data only - code belongs in the three files")
        if assets_total > 3 * 1024 * 1024:
            bad(f"{where}: assets/ is {assets_total // 1024} KB; the ceiling is about 3 MB per version")

    sources = {}
    for n in GAME_FILES:
        with open(os.path.join(d, n), encoding="utf-8", errors="replace") as f:
            sources[n] = f.read()
        m = external.search(sources[n])
        if m:
            bad(f"{where}: external request in {os.path.join(d, n)}: {m.group(0).strip()!r}")

    html = sources["index.html"]
    if "<html" not in html.lower():
        bad(f"{where}: index.html does not look like an HTML document")
    if "../../" not in html:
        bad(f"{where}: index.html has no relative link back to the log (../../)")
    if not re.search(r"""<link\b[^>]*\bhref\s*=\s*["']\.?/?game\.css["']""", html, re.I):
        bad(f"{where}: index.html does not link its stylesheet (<link rel=\"stylesheet\" href=\"game.css\">)")
    if not re.search(r"""<script\b[^>]*\bsrc\s*=\s*["']\.?/?game\.js["']""", html, re.I):
        bad(f"{where}: index.html does not load its script (<script src=\"game.js\"></script>)")
    if re.search(r"<style\b[^>]*>(?!\s*</style>)", html, re.I):
        bad(f"{where}: index.html has an inline <style> block; all CSS belongs in game.css")
    for m in re.finditer(r"<script\b([^>]*)>", html, re.I):
        if not re.search(r"\bsrc\s*=", m.group(1), re.I):
            bad(f"{where}: index.html has an inline <script> block; all JS belongs in game.js")
            break
    if "window.game" not in sources["game.js"]:
        bad(f"{where}: game.js does not expose the fixed API (window.game)")

if problems:
    for p in problems:
        print(f"check: {p}")
    print(f"check: {len(problems)} problem(s)")
    sys.exit(1)

print(f"check: ok - {passes} pass(es) in the ledger, versions 0..{passes} on the shelf")
PY
