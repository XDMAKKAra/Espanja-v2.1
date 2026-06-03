from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1200, "height": 700})
    pg.goto("http://localhost:8099/styleguide-tailwind.html", wait_until="networkidle")
    pg.hover(".site-nav__dropdown-trigger")
    pg.wait_for_timeout(400)
    items = pg.locator(".site-nav__dropdown-item")
    print("dropdown items:", items.count(), [items.nth(i).inner_text() for i in range(items.count())])
    op = pg.eval_on_selector(".site-nav__dropdown-menu", "el => getComputedStyle(el).opacity")
    print("menu opacity on hover:", op)
    pg.screenshot(path="screenshots/v374/dropdown_open_fixed.png")
    b.close()
