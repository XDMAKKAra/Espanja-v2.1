"""
Take product screenshots for the landing page carousel.
"""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:3000"
EMAIL = "screenshot-bot2@puheo.test"
PASSWORD = "Scr33nshot!2026"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "screenshots")
os.makedirs(OUT, exist_ok=True)


def click_if_visible(page, selector, timeout=2000):
    try:
        el = page.locator(selector)
        el.wait_for(state="visible", timeout=timeout)
        el.click()
        return True
    except:
        return False


def click_visible_button_with_text(page, text, timeout=3000):
    """Click the first VISIBLE button containing text."""
    try:
        buttons = page.locator(f"button:visible:has-text('{text}')")
        if buttons.count() > 0:
            buttons.first.click()
            return True
    except:
        pass
    return False


def wait_for_screen(page, screen_id, timeout=10000):
    try:
        page.wait_for_function(
            f"document.querySelector('#{screen_id}')?.classList.contains('active')",
            timeout=timeout
        )
        return True
    except:
        return False


def get_active(page):
    try:
        return page.locator(".screen.active").get_attribute("id")
    except:
        return "unknown"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1600, "height": 1000})
        page = ctx.new_page()

        # ── LOGIN ──
        print("[1] Login...")
        page.goto(f"{BASE}/app.html")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        if get_active(page) == "screen-auth":
            page.evaluate("localStorage.clear(); sessionStorage.clear();")
            page.reload()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            # Try register first
            click_if_visible(page, "#tab-register")
            page.wait_for_timeout(300)
            page.locator("#auth-email").fill(EMAIL)
            page.locator("#auth-password").fill(PASSWORD)
            page.locator("#btn-auth-submit").click()
            page.wait_for_timeout(5000)
            page.wait_for_load_state("networkidle")

            # If register failed, try login
            if get_active(page) == "screen-auth":
                print("  Register failed, trying login...")
                click_if_visible(page, "#tab-login")
                page.wait_for_timeout(300)
                page.locator("#auth-email").fill(EMAIL)
                page.locator("#auth-password").fill(PASSWORD)
                page.locator("#btn-auth-submit").click()
                page.wait_for_timeout(5000)
                page.wait_for_load_state("networkidle")

            if get_active(page) == "screen-auth":
                print("  AUTH FAILED - aborting")
                page.screenshot(path=os.path.join(OUT, "_auth_fail.png"))
                browser.close()
                return

        print(f"  Screen: {get_active(page)}")

        # Skip onboarding/placement
        if get_active(page) == "screen-onboarding":
            click_if_visible(page, "#onboarding-skip")
            page.wait_for_timeout(2000)
        if get_active(page) == "screen-placement-intro":
            click_if_visible(page, "#placement-skip-btn")
            page.wait_for_timeout(2000)

        # ── VOCAB ──
        print("[2] Vocab...")
        page.locator("#nav-vocab").click()
        page.wait_for_timeout(2000)
        print(f"  Screen: {get_active(page)}")

        # Start vocab
        click_visible_button_with_text(page, "Aloita")
        page.wait_for_timeout(6000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        print(f"  After start: {get_active(page)}")

        if get_active(page) == "screen-exercise":
            options = page.locator(".option-btn")
            if options.count() > 0:
                options.nth(0).click()
                page.wait_for_timeout(1500)
                page.screenshot(path=os.path.join(OUT, "vocab.png"))
                print("  Saved vocab.png")

                # Answer more for dashboard data
                for i in range(4):
                    try:
                        if not click_if_visible(page, "#btn-next", timeout=2000):
                            break
                        page.wait_for_timeout(2000)
                        opts = page.locator(".option-btn:not([disabled])")
                        if opts.count() > 0:
                            opts.nth(0).click()
                            page.wait_for_timeout(1500)
                        else:
                            break
                    except:
                        break
                print("  Answered extra questions")

        # ── WRITING ──
        print("[3] Writing...")
        page.locator("#nav-writing").click()
        page.wait_for_timeout(2000)
        print(f"  Screen: {get_active(page)}")

        # Start writing
        click_visible_button_with_text(page, "Aloita")
        page.wait_for_timeout(6000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        print(f"  After start: {get_active(page)}")

        if get_active(page) == "screen-writing":
            textarea = page.locator("#writing-input")
            if textarea.is_visible():
                sample = (
                    "Querido amigo, te escribo para contarte sobre mis vacaciones "
                    "en España. Estuve en Barcelona durante dos semanas y fue una "
                    "experiencia increíble. Visité la Sagrada Familia, que es un "
                    "monumento impresionante diseñado por Gaudí. También disfruté "
                    "de la comida española, especialmente la paella y las tapas. "
                    "El tiempo fue perfecto y espero volver pronto."
                )
                textarea.fill(sample)
                page.wait_for_timeout(1000)
                page.screenshot(path=os.path.join(OUT, "writing.png"))
                print("  Saved writing.png")

                # Submit
                submit = page.locator("#btn-submit-writing")
                if submit.is_visible() and submit.is_enabled():
                    submit.click()
                    print("  Waiting for AI grading...")
                    if wait_for_screen(page, "screen-writing-feedback", timeout=30000):
                        page.wait_for_timeout(1000)
                        page.screenshot(path=os.path.join(OUT, "writing_feedback.png"))
                        print("  Saved writing_feedback.png")
                    else:
                        print(f"  Grading timeout, screen: {get_active(page)}")
                        page.screenshot(path=os.path.join(OUT, "_writing_timeout.png"))
        else:
            page.screenshot(path=os.path.join(OUT, "writing.png"))
            print(f"  Saved writing.png (on: {get_active(page)})")

        # ── EXAM ──
        print("[4] Exam...")
        page.locator("#nav-exam").click()
        page.wait_for_timeout(2000)
        print(f"  Screen: {get_active(page)}")

        # Start exam
        click_visible_button_with_text(page, "Aloita")
        page.wait_for_timeout(8000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        print(f"  After start: {get_active(page)}")
        page.screenshot(path=os.path.join(OUT, "exam.png"))
        print("  Saved exam.png")

        # ── DASHBOARD (with data now) ──
        print("[5] Dashboard...")
        page.locator("#nav-dashboard").click()
        page.wait_for_timeout(4000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(OUT, "dashboard.png"))
        print("  Saved dashboard.png")

        # ── Results ──
        print("\n--- Files ---")
        for f in sorted(os.listdir(OUT)):
            if f.startswith('.'):
                continue
            size = os.path.getsize(os.path.join(OUT, f))
            print(f"  {f}: {size // 1024}KB")

        browser.close()


if __name__ == "__main__":
    main()
