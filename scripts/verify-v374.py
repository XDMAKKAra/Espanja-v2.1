import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8099"
OUT = os.environ.get("OUTDIR", "/tmp/v374")
os.makedirs(OUT, exist_ok=True)

# pages to audit for horizontal scroll at 390px
PAGES = [
    "/styleguide-tailwind.html",
    "/404.html",
    "/offline.html",
    "/pricing.html",
    "/privacy.html",
    "/terms.html",
    "/refund.html",
    "/diagnose.html",
    "/public/landing/espanja.html",
    "/public/landing/ranska.html",
    "/public/landing/saksa.html",
]

def slug(p):
    return p.strip("/").replace("/", "_").replace(".html", "")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)

    print("=== 390px horizontal-scroll audit ===")
    page = browser.new_page(viewport={"width": 390, "height": 844})
    for p in PAGES:
        page.goto(BASE + p, wait_until="networkidle")
        page.wait_for_timeout(300)
        sw = page.evaluate("document.documentElement.scrollWidth")
        iw = page.evaluate("window.innerWidth")
        flag = "  <-- OVERFLOW" if sw > iw + 1 else ""
        print(f"{p:42s} scrollWidth={sw} innerWidth={iw}{flag}")
        page.screenshot(path=f"{OUT}/{slug(p)}_390.png", full_page=True)
    page.close()

    print("\n=== desktop 1440px render check (per-lang + new pages) ===")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    for p in ["/public/landing/espanja.html", "/public/landing/ranska.html",
              "/public/landing/saksa.html", "/styleguide-tailwind.html",
              "/404.html", "/pricing.html"]:
        page.goto(BASE + p, wait_until="networkidle")
        page.wait_for_timeout(400)
        # heuristics for "page didn't open": near-empty body height
        bh = page.evaluate("document.body.getBoundingClientRect().height")
        vis = page.evaluate("!!document.querySelector('main, .landing, section') && document.body.innerText.trim().length")
        print(f"{p:42s} bodyHeight={bh:.0f} textLen={vis}")
        page.screenshot(path=f"{OUT}/{slug(p)}_1440.png", full_page=True)
    page.close()

    # capture the dropdown open state on the styleguide
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(BASE + "/styleguide-tailwind.html", wait_until="networkidle")
    page.wait_for_timeout(300)
    try:
        page.hover(".site-nav__dropdown-trigger")
        page.wait_for_timeout(350)
        page.screenshot(path=f"{OUT}/styleguide_dropdown_open.png")
        print("\ndropdown hover screenshot captured")
    except Exception as e:
        print("dropdown hover failed:", e)
    page.close()

    browser.close()
print("\nDONE ->", OUT)
