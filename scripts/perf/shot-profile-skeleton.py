"""Capture the profile skeleton (CDP latency so fetches are slow without
blocking the test thread), then the loaded state."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
APP = BASE + "/app.html"

def run():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(service_workers="block", viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.add_init_script("localStorage.setItem('puheo_gate_ok_v1','1');localStorage.setItem('puheo:lang','es');")
        page.goto(APP, wait_until="domcontentloaded")
        page.wait_for_selector("#auth-email", state="visible", timeout=15000)
        page.fill("#auth-email", "testpro123@gmail.com")
        page.fill("#auth-password", "Testpro123")
        page.click("#btn-auth-submit")
        page.wait_for_function("() => { const s=document.querySelector('.screen.active'); return s && s.id==='screen-home'; }", timeout=25000)
        # Now slow the network so the profile fetches stay in-flight while we shoot.
        cdp = ctx.new_cdp_session(page)
        cdp.send("Network.enable")
        cdp.send("Network.emulateNetworkConditions", {
            "offline": False, "latency": 2000,
            "downloadThroughput": 200_000, "uploadThroughput": 200_000,
        })
        page.evaluate("location.hash = '#/oma-sivu'")
        page.wait_for_selector("#screen-profile.active", timeout=8000)
        page.wait_for_timeout(400)  # skeleton paints; data still in-flight (2s latency)
        page.screenshot(path="docs/briefs/L-V393-profile-skeleton.png")
        print("shot skeleton")
        # Lift throttle and let real content land.
        cdp.send("Network.emulateNetworkConditions", {
            "offline": False, "latency": 0, "downloadThroughput": -1, "uploadThroughput": -1,
        })
        page.wait_for_function("() => { const m=document.getElementById('profile-modes'); return m && !m.querySelector('.skeleton__bar'); }", timeout=8000)
        page.wait_for_timeout(200)
        page.screenshot(path="docs/briefs/L-V393-profile-loaded.png")
        print("shot loaded")
        b.close()

if __name__ == "__main__":
    run()
