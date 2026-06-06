"""
L-V393 perf baseline measurement.

Drives a REAL logged-in session (no mocked routes) and measures, per app screen:
  - wall time from nav trigger -> all /api/ calls settled (network-quiesce)
  - the exact list of /api/ calls fired, with TTFB + total duration
  - 1st open vs 2nd open (back-to-back) -> proves JS-cache vs re-fetch
  - heap growth over a ~24-cycle navigation session (leak signal)
  - bundle sizes

Run via:
  python .claude/skills/webapp-testing/scripts/with_server.py \
    --server "npm run dev" --port 3000 --timeout 60 \
    -- python scripts/perf/measure-v393.py
"""
import json, time, os, glob
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
APP = BASE + "/app.html"
EMAIL = "testpro123@gmail.com"
PASSWORD = "Testpro123"
OUT = "docs/briefs/L-V393-PERF-RAW.json"

api_calls = []                 # every /api/ call, tagged with the active phase
current_phase = {"name": "boot"}

def on_request_finished(request):
    try:
        url = request.url
        if "/api/" not in url:
            return
        t = request.timing or {}
        rs = t.get("requestStart", -1)
        rstart = t.get("responseStart", -1)
        re_ = t.get("responseEnd", -1)
        total = re_ if re_ >= 0 else None
        ttfb = (rstart - rs) if (rstart >= 0 and rs >= 0) else None
        api_calls.append({
            "phase": current_phase["name"],
            "method": request.method,
            "url": url.replace(BASE, ""),
            "ttfb_ms": round(ttfb, 1) if ttfb is not None else None,
            "total_ms": round(total, 1) if total is not None else None,
        })
    except Exception:
        pass

def calls_for(label):
    return [c for c in api_calls if c["phase"] == label]

def quiesce(t0, settle_ms=500, timeout_s=14):
    """Block until no new api call for settle_ms (or timeout). Returns wall ms
    from t0 to the moment the last call settled (settle window subtracted)."""
    last_count = len(api_calls)
    last_change = time.perf_counter()
    deadline = t0 + timeout_s
    while True:
        time.sleep(0.04)
        now = time.perf_counter()
        cur = len(api_calls)
        if cur != last_count:
            last_count = cur
            last_change = now
        if (now - last_change) * 1000 >= settle_ms:
            break
        if now > deadline:
            break
    settled_at = last_change
    return max(0.0, (settled_at - t0) * 1000)

def loading_indicator(page):
    return page.evaluate("""() => {
       const sel = ['#loading-spinner','.spinner','.op-loading','.dk__loading','.loading-shimmer'];
       for (const s of sel){ const el=document.querySelector(s);
         if(el){ const r=el.getBoundingClientRect(); const st=getComputedStyle(el);
           if(r.width>0&&r.height>0&&st.display!=='none'&&st.visibility!=='hidden') return s; } }
       return null;
    }""")

def measure(page, label, target_hash, settle_ms=500):
    current_phase["name"] = label
    t0 = time.perf_counter()
    page.evaluate("h => { location.hash = h; }", target_hash)
    wall = quiesce(t0, settle_ms=settle_ms)
    active = page.evaluate("() => (document.querySelector('.screen.active')||{}).id || null")
    calls = calls_for(label)
    rec = {
        "label": label,
        "hash": target_hash,
        "wall_ms_to_data_ready": round(wall, 1),
        "active_screen": active,
        "api_call_count": len(calls),
        "api_calls": calls,
        "loading_indicator_at_end": loading_indicator(page),
    }
    print(f"  {label:22s} wall={rec['wall_ms_to_data_ready']:7.1f}ms  "
          f"api={len(calls):2d}  screen={active}  load={rec['loading_indicator_at_end']}")
    return rec

def goto_neutral(page, neutral_hash):
    current_phase["name"] = "neutral"
    page.evaluate("h => { location.hash = h; }", neutral_hash)
    quiesce(time.perf_counter(), settle_ms=400)

def measure_pair(page, name, target_hash, neutral_hash):
    first = measure(page, f"{name}#1", target_hash)
    goto_neutral(page, neutral_hash)
    second = measure(page, f"{name}#2", target_hash)
    return {"first": first, "second": second}

def bundle_sizes():
    def sz(p):
        try: return os.path.getsize(p)
        except OSError: return None
    chunks = glob.glob("chunks/*.js")
    return {
        "app.bundle.js": sz("app.bundle.js"),
        "app.bundle.css": sz("app.bundle.css"),
        "chunks_count": len(chunks),
        "chunks_total_bytes": sum(os.path.getsize(f) for f in chunks),
        "biggest_chunks": sorted(
            [[os.path.basename(f), os.path.getsize(f)] for f in chunks],
            key=lambda x: -x[1])[:10],
    }

def main():
    result = {"base": BASE, "account": EMAIL, "screens": {}, "memory": [], "bundle": {}, "notes": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True,
                                    args=["--enable-precise-memory-info", "--js-flags=--expose-gc"])
        context = browser.new_context(service_workers="block")  # isolate JS-cache from SW/HTTP cache
        page = context.new_page()
        page.on("requestfinished", on_request_finished)
        page.add_init_script("""
            localStorage.setItem('puheo_gate_ok_v1','1');
            localStorage.setItem('puheo:lang','es');
        """)

        # --- COLD LOAD ---
        current_phase["name"] = "cold_load"
        t0 = time.perf_counter()
        page.goto(APP, wait_until="domcontentloaded")
        try:
            page.wait_for_selector("#auth-email", state="visible", timeout=15000)
        except Exception:
            active = page.evaluate("() => (document.querySelector('.screen.active')||{}).id || null")
            result["notes"].append(f"auth form not found; active screen={active}")
            page.screenshot(path="docs/briefs/L-V393-debug.png", full_page=True)
            print("ERROR: auth form not visible, active screen:", active)
            browser.close()
            with open(OUT, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            return
        cold_dcl = (time.perf_counter() - t0) * 1000
        result["cold_load_to_auth_ms"] = round(cold_dcl, 1)
        print(f"cold load -> auth form: {cold_dcl:.1f}ms")

        # --- LOGIN (measured) ---
        current_phase["name"] = "login"
        page.fill("#auth-email", EMAIL)
        page.fill("#auth-password", PASSWORD)
        t0 = time.perf_counter()
        page.click("#btn-auth-submit")
        try:
            page.wait_for_function(
                "() => { const s=document.querySelector('.screen.active'); return s && (s.id==='screen-home'); }",
                timeout=25000)
        except Exception:
            active = page.evaluate("() => (document.querySelector('.screen.active')||{}).id || null")
            result["notes"].append(f"post-login did not reach screen-home; active={active}")
            print("WARN: post-login active screen:", active)
        login_wall = quiesce(t0, settle_ms=600)
        result["login_to_home_ms"] = round(login_wall, 1)
        result["screens"]["login"] = {"wall_ms": round(login_wall, 1), "api_calls": calls_for("login")}
        print(f"login -> home ready: {login_wall:.1f}ms  ({len(calls_for('login'))} api calls)")
        token_key = page.evaluate("""() => {
            const keys = Object.keys(localStorage);
            return keys.filter(k => /token/i.test(k));
        }""")
        result["notes"].append("token localStorage keys: " + json.dumps(token_key))

        # --- grab a real course key from the oppimispolku index ---
        result["screens"]["oppimispolku"] = measure_pair(page, "oppimispolku", "#/oppimispolku", "#/aloitus")
        course_key = page.evaluate("""() => {
            const a = document.querySelector('a[href*="/oppimispolku/"]');
            if(!a) return null;
            const m=/oppimispolku\\/[a-z]{2}\\/([^/?#]+)/.exec(a.getAttribute('href')||'');
            return m?decodeURIComponent(m[1]):null;
        }""")
        result["notes"].append(f"course_key={course_key}")
        print("course key:", course_key)

        if course_key:
            ch = "#/oppimispolku/es/" + course_key
            result["screens"]["courseDetail"] = measure_pair(page, "courseDetail", ch, "#/aloitus")
            dh = f"#/oppitunti/es/{course_key}/0/teoria"
            result["screens"]["digikirja"] = measure_pair(page, "digikirja", dh, "#/aloitus")

        result["screens"]["profile"] = measure_pair(page, "profile", "#/oma-sivu", "#/aloitus")
        result["screens"]["home"] = measure_pair(page, "home", "#/aloitus", "#/oppimispolku")

        # --- MEMORY: navigation churn + heap sampling ---
        cdp = context.new_cdp_session(page)
        def heap_used():
            try: cdp.send("HeapProfiler.collectGarbage")
            except Exception: pass
            time.sleep(0.15)
            r = cdp.send("Runtime.evaluate", {
                "expression": "performance.memory ? performance.memory.usedJSHeapSize : 0",
                "returnByValue": True})
            return r.get("result", {}).get("value", 0)

        churn = ["#/aloitus", "#/oppimispolku", "#/oma-sivu"]
        current_phase["name"] = "memory_churn"
        result["memory"].append({"cycle": 0, "heap_used_bytes": heap_used()})
        for i in range(1, 25):
            h = churn[i % len(churn)]
            page.evaluate("x => { location.hash = x; }", h)
            quiesce(time.perf_counter(), settle_ms=250)
            if i % 4 == 0:
                result["memory"].append({"cycle": i, "heap_used_bytes": heap_used()})
                print(f"  heap @cycle {i}: {result['memory'][-1]['heap_used_bytes']/1e6:.1f} MB")

        result["bundle"] = bundle_sizes()
        browser.close()

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print("\nwrote", OUT)

if __name__ == "__main__":
    main()
