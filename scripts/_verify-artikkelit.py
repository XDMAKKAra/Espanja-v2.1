import sys, json, os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
arts = json.load(open(os.path.join(ROOT, "data", "articles.json"), encoding="utf8"))
slugs = [a["slug"] for a in arts]

problems = []
shots = {"espanja-yo-koe-2026-lyhyt-oppimaara": "yokoe", "saksa-adjektiivin-taivutus": "table", "ranska-mielipidekirjoitus": "writing"}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def check(path, name, w=390, h=844, shot=None):
        page = browser.new_page(viewport={"width": w, "height": h})
        errs = []
        page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        resp = page.goto(BASE + path, wait_until="networkidle")
        st = resp.status if resp else 0
        if st != 200:
            problems.append(f"{name}: HTTP {st}")
        ov = page.evaluate("Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
        if ov > 1:
            problems.append(f"{name}: overflow {ov}px @ {w}")
        txt = page.evaluate("document.body.innerText")
        if "&lt;" in txt or "<p>" in txt or "class=\"example\"" in txt:
            problems.append(f"{name}: näkyy enkoodattua/raakaa HTML:ää tekstinä")
        if errs:
            problems.append(f"{name}: console {errs[:2]}")
        if shot:
            page.screenshot(path=f"/tmp/art-{shot}.png", full_page=True)
        page.close()

    check("/artikkelit/", "hub", 390)
    check("/artikkelit/", "hub-d", 1440)
    for s in slugs:
        check(f"/artikkelit/{s}", s, 390)
        # rendered content present?
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(BASE + f"/artikkelit/{s}", wait_until="networkidle")
        h2 = page.evaluate("document.querySelectorAll('.art-body h2').length")
        if h2 < 1:
            problems.append(f"{s}: ei renderöityjä h2-sektioita")
        if s in shots:
            page.screenshot(path=f"/tmp/art-{shots[s]}.png", full_page=True)
        page.close()
    browser.close()

if problems:
    print("PROBLEMS:")
    for x in problems: print(" -", x)
    sys.exit(1)
print(f"OK: hub + {len(slugs)} artikkelia, kaikki 200, ei overflowia @390, HTML renderöity, ei console-virheitä")
