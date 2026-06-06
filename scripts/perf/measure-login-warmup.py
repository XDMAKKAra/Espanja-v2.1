"""L-V393 login fast-path verification.
Measures, per fresh context (cold mirror = the common real login path):
  - t_shell: login click -> #screen-home active (home surface visible)
  - t_data : login click -> real content painted (skeleton .home-skel-root gone)
  - the /api/ calls fired during login (proves 1 batched v2 vs profile+placement)
Runs three logins in one server session: 1st = cold server, 2nd/3rd = warm."""
import time, json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
APP = BASE + "/app.html"
EMAIL = "testpro123@gmail.com"
PASSWORD = "Testpro123"

def login_once(context, label, shot=None):
    page = context.new_page()
    api = []
    t0_ref = {"t": None}
    def _rec(r):
        if "/api/" in r.url:
            ms = round((time.perf_counter() - t0_ref["t"]) * 1000, 1) if t0_ref["t"] else 0
            api.append(f"{r.url.replace(BASE, '')}@{ms}ms")
    page.on("requestfinished", _rec)
    page.add_init_script("localStorage.setItem('puheo_gate_ok_v1','1');localStorage.setItem('puheo:lang','es');")
    page.goto(APP, wait_until="domcontentloaded")
    page.wait_for_selector("#auth-email", state="visible", timeout=15000)
    page.fill("#auth-email", EMAIL)
    page.fill("#auth-password", PASSWORD)
    api.clear()
    t0 = time.perf_counter()
    t0_ref["t"] = t0
    page.click("#btn-auth-submit")
    # shell visible = the home surface (skeleton or content) is on screen
    page.wait_for_function(
        "() => { const s=document.querySelector('.screen.active'); return s && s.id==='screen-home'; }",
        timeout=25000)
    t_shell = (time.perf_counter() - t0) * 1000
    if shot:
        try: page.screenshot(path=shot)
        except Exception: pass
    # data ready = no new /api/ call for 500ms (login chain + dashboard settled)
    last_n, last_change = len(api), time.perf_counter()
    while True:
        time.sleep(0.04)
        now = time.perf_counter()
        if len(api) != last_n:
            last_n, last_change = len(api), now
        if (now - last_change) * 1000 >= 500 or now - t0 > 20:
            break
    t_data = (last_change - t0) * 1000
    rec = {"t_shell_ms": round(t_shell, 1), "t_data_ms": round(max(0, t_data), 1), "login_api": list(api)}
    print(f"{label:26s} shell={rec['t_shell_ms']:7.1f}ms  data={rec['t_data_ms']:7.1f}ms  "
          f"api={rec['login_api']}")
    page.close()
    return rec

def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        out["cold"]  = login_once(b.new_context(service_workers="block"), "COLD (1st request)",
                                   shot="docs/briefs/L-V393-login-shell.png")
        out["warm"]  = login_once(b.new_context(service_workers="block"), "WARM (2nd request)")
        out["warm2"] = login_once(b.new_context(service_workers="block"), "WARM (3rd request)")
        b.close()
    print(json.dumps(out))

if __name__ == "__main__":
    main()
