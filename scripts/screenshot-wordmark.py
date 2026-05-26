"""Quick smoke test: render the 4 brand SVGs at multiple sizes and save PNGs."""

from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]
BRAND = REPO / "public" / "brand"
OUT = REPO / "screenshots" / "brand"
OUT.mkdir(parents=True, exist_ok=True)

HTML = """
<!doctype html>
<html><head><meta charset="utf-8">
<style>
body { margin: 0; font-family: system-ui; background: #F5EDE0; }
.row { display: flex; align-items: center; gap: 32px; padding: 32px; border-bottom: 1px solid #2A1F1A1A; }
.label { width: 220px; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: #2A1F1A99; }
.box { display: flex; align-items: center; gap: 16px; }
.box img { display: block; }
.dark { background: #2A1F1A; color: #F5EDE0; }
.dark .label { color: #F5EDE0BF; }
.size-tiny img { width: 16px; height: 16px; }
.size-small img { width: 32px; height: 32px; }
.size-med img { width: 96px; }
.size-large img { width: 240px; }
.fav { background: #fff; padding: 12px; border-radius: 4px; box-shadow: 0 2px 6px #0001; }
</style></head><body>

<div class="row">
  <div class="label">logo.svg @ 96 px</div>
  <div class="box size-med"><img src="logo.svg"></div>
</div>

<div class="row">
  <div class="label">logo.svg @ 240 px</div>
  <div class="box size-large"><img src="logo.svg"></div>
</div>

<div class="row dark">
  <div class="label">logo-dark.svg @ 240 px</div>
  <div class="box size-large"><img src="logo-dark.svg"></div>
</div>

<div class="row">
  <div class="label">logo-mono.svg @ 240 px</div>
  <div class="box size-large"><img src="logo-mono.svg"></div>
</div>

<div class="row">
  <div class="label">favicon-master @ 16 / 32 / 96 px</div>
  <div class="box size-tiny"><img class="fav" src="favicon-master.svg"></div>
  <div class="box size-small"><img class="fav" src="favicon-master.svg"></div>
  <div class="box size-med"><img class="fav" src="favicon-master.svg"></div>
</div>

</body></html>
"""

(BRAND / "_preview.html").write_text(HTML, encoding="utf-8")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 900, "height": 900}, device_scale_factor=2)
    page.goto(f"file:///{(BRAND / '_preview.html').as_posix()}")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(OUT / "wordmark-preview.png"), full_page=True)
    browser.close()
print(f"Saved: {OUT / 'wordmark-preview.png'}")
