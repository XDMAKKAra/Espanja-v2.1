"""
Capture clean product screenshots of Puheo app for landing page.
Server must be running at http://localhost:3000. Read-only — no app code changes.
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")

import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "shots"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL  = "http://localhost:3000"
EMAIL     = "testpro123@gmail.com"
PASSWORD  = "Testpro123"

manifest = []

def log(msg):
    print(f"[capture] {msg}")

def active_screens(page):
    return page.evaluate("[...document.querySelectorAll('.screen.active')].map(s => s.id)")

def wait_active(page, screen_id, timeout=10):
    for _ in range(timeout * 4):
        if screen_id in active_screens(page):
            return True
        time.sleep(0.25)
    return False

def go_hash(page, hash_val):
    """Navigate via hash and fire hashchange, then wait for React/JS to settle."""
    page.evaluate(f"""
        () => {{
            history.replaceState(null, '', '{hash_val}');
            window.dispatchEvent(new HashChangeEvent('hashchange', {{
                oldURL: location.href,
                newURL: location.origin + '{hash_val}'
            }}));
        }}
    """)
    time.sleep(0.3)

def shot_element(page, selector, path):
    """Screenshot best matching element. Returns (box, which_selector) or (None, None)."""
    for sel in selector if isinstance(selector, list) else [selector]:
        try:
            el = page.query_selector(sel)
            if el and el.is_visible():
                el.screenshot(path=str(path))
                return el.bounding_box(), sel
        except Exception as e:
            log(f"    shot_element({sel}): {e}")
    return None, None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 1440, "height": 900},
        device_scale_factor=2,
    )
    ctx.add_init_script("localStorage.setItem('puheo_gate_ok_v1', '1')")
    page = ctx.new_page()

    # ── Login ────────────────────────────────────────────────────────────────
    log("Loading app.html ...")
    page.goto(f"{BASE_URL}/app.html", wait_until="domcontentloaded")
    time.sleep(1)
    page.fill("#auth-email", EMAIL)
    page.fill("#auth-password", PASSWORD)
    page.click("#btn-auth-submit")
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except Exception:
        pass
    time.sleep(3)
    screens_after = active_screens(page)
    log(f"After login: {screens_after}")
    if "screen-home" not in screens_after and "screen-auth" in screens_after:
        log("  ERROR: still on auth screen — login may have failed")
        err = page.evaluate("document.getElementById('auth-error')?.textContent?.trim()")
        log(f"  auth error: {err}")

    # ═══════════════════════════════════════════════════════════════════════
    # SHOT 2 — Home / dashboard
    # loadHome() shows #screen-home with #home-root content (course path CTA etc.)
    # ═══════════════════════════════════════════════════════════════════════
    log("\n--- SHOT 2: Home/dashboard ---")
    try:
        # Should already be on screen-home. If not, navigate there.
        if "screen-home" not in active_screens(page):
            go_hash(page, "#/aloitus")
            time.sleep(2)
        log(f"  active: {active_screens(page)}")

        # Wait for home-root to have meaningful content
        for _ in range(20):
            txt = page.evaluate("document.getElementById('home-root')?.textContent?.trim() || ''")
            if len(txt) > 30:
                break
            time.sleep(0.5)
        time.sleep(1)

        # Try: capture just the home-shell (excludes app sidebar)
        box, used = shot_element(page, [".home-shell", "#screen-home"], OUTPUT_DIR / "app-home-path.png")
        if box:
            w, h = round(box["width"] * 2), round(box["height"] * 2)
            has_sidebar = used != ".home-shell"
            manifest.append({
                "file": "app-home-path.png", "px": f"{w}x{h}",
                "screen": "home (home-root with course path CTA)",
                "personal_data": "minimal — home-root text says 'Hei.' + streak only" if not has_sidebar else "yes — full screen includes sidebar"
            })
            log(f"  saved via {used}: {w}x{h}")
        else:
            manifest.append({"file": "app-home-path.png", "skip_reason": "element not visible"})
    except Exception as e:
        log(f"  ERROR: {e}")
        manifest.append({"file": "app-home-path.png", "skip_reason": str(e)})

    # ═══════════════════════════════════════════════════════════════════════
    # SHOT 1 — Writing task + rubric (PRIORITY)
    # Navigate to #/kirjoitus => screen-mode-writing => click btn-start-writing
    # => loadWritingTask() API call => screen-writing
    # ═══════════════════════════════════════════════════════════════════════
    log("\n--- SHOT 1: Writing task + rubric ---")
    try:
        # Navigate to writing mode page
        go_hash(page, "#/kirjoitus")
        time.sleep(1.5)
        log(f"  active after #/kirjoitus: {active_screens(page)}")

        if "screen-mode-writing" not in active_screens(page):
            # Force direct show
            page.evaluate("""
                () => {
                    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                    const s = document.getElementById('screen-mode-writing');
                    if (s) s.classList.add('active');
                }
            """)
            time.sleep(0.5)
            log(f"  active after force: {active_screens(page)}")

        # Click btn-start-writing
        try:
            page.click("#btn-start-writing", timeout=5000)
            log("  clicked btn-start-writing — waiting for API (writing prompt)...")
        except Exception as e2:
            log(f"  could not click btn-start-writing: {e2}")

        # Wait up to 20s for writing prompt (AI API call)
        prompt_loaded = False
        for i in range(40):
            txt = page.evaluate("document.getElementById('writing-prompt-text')?.textContent?.trim() || ''")
            if txt and "Generoidaan" not in txt and "Ladataan" not in txt and len(txt) > 20:
                prompt_loaded = True
                log(f"  prompt loaded ({i*0.5:.1f}s): {txt[:80]}")
                break
            time.sleep(0.5)

        if not prompt_loaded:
            log("  WARNING: prompt text not loaded (shimmer still showing) — capturing anyway")

        log(f"  active: {active_screens(page)}")

        if "screen-writing" in active_screens(page):
            # Type sample Spanish text (do NOT click Tarkista)
            try:
                page.fill("#writing-input",
                    "En Espana hay muchas ciudades bonitas. Me gusta mucho Madrid y Barcelona. "
                    "El verano pasado fui a Valencia con mi familia. Comimos paella y visitamos la playa. "
                    "Fue una experiencia increible que nunca olvidare.")
                time.sleep(0.3)
                log("  typed Spanish sample text")
            except Exception as fill_err:
                log(f"  fill error: {fill_err}")

            # Capture .writing-inner (excludes app sidebar — just the writing canvas + rubric)
            box, used = shot_element(page,
                [".writing-inner", ".writing-grid", "#screen-writing"],
                OUTPUT_DIR / "app-writing-rubric.png")
            if box:
                w, h = round(box["width"] * 2), round(box["height"] * 2)
                manifest.append({
                    "file": "app-writing-rubric.png", "px": f"{w}x{h}",
                    "screen": "writing task with textarea + rubric sidebar",
                    "personal_data": "no — sidebar excluded (.writing-inner crop)"
                })
                log(f"  saved via {used}: {w}x{h}")
            else:
                manifest.append({"file": "app-writing-rubric.png", "skip_reason": "element not visible after navigation"})
        else:
            log(f"  screen-writing not active. Current: {active_screens(page)}")
            manifest.append({"file": "app-writing-rubric.png", "skip_reason": "screen-writing not active after start click"})

    except Exception as e:
        log(f"  ERROR: {e}")
        manifest.append({"file": "app-writing-rubric.png", "skip_reason": str(e)})

    # ═══════════════════════════════════════════════════════════════════════
    # SHOT 3 — Oppimispolku course index
    # Hash: #/oppimispolku → screen-oppimispolku-index (no AI call, static list)
    # ═══════════════════════════════════════════════════════════════════════
    log("\n--- SHOT 3: Oppimispolku course index ---")
    try:
        go_hash(page, "#/oppimispolku")
        time.sleep(2)
        log(f"  active: {active_screens(page)}")

        # Wait for op-root to have content
        for _ in range(20):
            txt = page.evaluate("document.getElementById('op-root')?.textContent?.trim() || ''")
            if len(txt) > 50:
                break
            time.sleep(0.3)

        txt = page.evaluate("document.getElementById('op-root')?.textContent?.trim().slice(0, 100) || ''")
        log(f"  op-root preview: {txt}")

        # Capture the op-shell (course list, no sidebar)
        box, used = shot_element(page,
            [".op-shell", "#screen-oppimispolku-index"],
            OUTPUT_DIR / "app-lesson.png")
        if box:
            w, h = round(box["width"] * 2), round(box["height"] * 2)
            manifest.append({
                "file": "app-lesson.png", "px": f"{w}x{h}",
                "screen": "oppimispolku course index (8-course list)",
                "personal_data": "no — op-shell only, sidebar excluded"
            })
            log(f"  saved via {used}: {w}x{h}")
        else:
            manifest.append({"file": "app-lesson.png", "skip_reason": "op-shell not visible"})

    except Exception as e:
        log(f"  ERROR: {e}")
        manifest.append({"file": "app-lesson.png", "skip_reason": str(e)})

    # ═══════════════════════════════════════════════════════════════════════
    # SHOT 4 — Course detail (lesson list) — click first course in oppimispolku
    # ═══════════════════════════════════════════════════════════════════════
    log("\n--- SHOT 4: Course detail (lesson list) ---")
    try:
        # Find and click the first course link in op-root
        course_link = page.query_selector("#op-root a, #op-root .course-card, #op-root .shelf-row, #op-root button")
        if course_link and course_link.is_visible():
            course_link.click()
            time.sleep(2)
            log(f"  active after course click: {active_screens(page)}")
        else:
            log("  no course link found in op-root")

        if "screen-course-detail" in active_screens(page):
            # Wait for cd-root
            for _ in range(15):
                txt = page.evaluate("document.getElementById('cd-root')?.textContent?.trim() || ''")
                if len(txt) > 30:
                    break
                time.sleep(0.3)

            box, used = shot_element(page, [".op-shell", "#screen-course-detail"], OUTPUT_DIR / "app-results.png")
            if box:
                w, h = round(box["width"] * 2), round(box["height"] * 2)
                manifest.append({
                    "file": "app-results.png", "px": f"{w}x{h}",
                    "screen": "course detail (lesson list)",
                    "personal_data": "no — op-shell only, sidebar excluded"
                })
                log(f"  saved via {used}: {w}x{h}")
            else:
                manifest.append({"file": "app-results.png", "skip_reason": "element not visible"})
        else:
            log(f"  screen-course-detail not active. Current: {active_screens(page)}")
            manifest.append({"file": "app-results.png", "skip_reason": "course-detail screen not reached"})

    except Exception as e:
        log(f"  ERROR: {e}")
        manifest.append({"file": "app-results.png", "skip_reason": str(e)})

    browser.close()

# ── Print manifest ──────────────────────────────────────────────────────────
print("\n" + "="*60)
print("MANIFEST")
print("="*60)
for item in manifest:
    print(f"\n  {item['file']}")
    for k, v in item.items():
        if k != "file":
            label = k.replace("_", " ").ljust(14)
            print(f"    {label}: {v}")
