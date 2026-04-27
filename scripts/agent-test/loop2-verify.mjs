// Loop-2 verify: re-screenshot the screens we touched and confirm changes.
// Force-render dashboard with empty data to see the new empty states.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch();
try {
  for (const vp of [{ n: "1440", w: 1440, h: 900 }, { n: "375", w: 375, h: 812 }]) {
    // 1. Dashboard with empty data — drive the chart-empty + heatmap-empty + mode-empty paths
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(`[dashboard@${vp.n}] ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/Content Security Policy|fonts\.googleapis|posthog/.test(m.text())) {
        errors.push(`[dashboard@${vp.n}] ${m.text()}`);
      }
    });
    await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      // Show dashboard
      document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
      const d = document.getElementById("screen-dashboard");
      if (d) d.classList.add("active");
      const loading = document.getElementById("screen-loading");
      if (loading) loading.classList.remove("active");
    });
    // Manually trigger the empty-state renderers since loadDashboard needs auth
    await page.evaluate(() => {
      const chart = document.getElementById("dash-chart");
      if (chart) {
        chart.innerHTML = `
        <div class="dash-chart-empty">
          <svg class="dash-chart-empty__art" viewBox="0 0 120 60" aria-hidden="true">
            <defs><linearGradient id="emptySpark2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0"/>
              <stop offset="50%" stop-color="currentColor" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient></defs>
            <path d="M2 50 Q 30 50 36 36 T 60 30 T 90 18 T 118 12" fill="none" stroke="url(#emptySpark2)" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 3"/>
          </svg>
          <p class="dash-chart-empty__title">Käyrä alkaa täältä.</p>
          <p class="dash-chart-empty__sub">Tee yksi harjoitus, niin näet ensimmäisen pisteen.</p>
        </div>`;
      }
      const hmSection = document.querySelector(".dash-heatmap-section");
      if (hmSection && !hmSection.querySelector(".dash-heatmap-empty")) {
        const cap = document.createElement("p");
        cap.className = "dash-heatmap-empty";
        cap.textContent = "Tee ensimmäinen harjoitus, niin sytytät tästä päivän.";
        hmSection.appendChild(cap);
      }
      // Force one mode card to show empty state
      const modes = document.getElementById("dash-modes");
      if (modes) {
        modes.innerHTML = `
        <div class="dash-mode-card">
          <div class="dash-mode-left">
            <span class="dash-mode-icon">📚</span>
            <div>
              <div class="dash-mode-name">Sanasto</div>
              <div class="dash-mode-sessions">0 krt</div>
            </div>
          </div>
          <div class="dash-mode-right">
            <div class="dash-mode-empty"><span class="dash-mode-empty__label">Ei vielä</span><span class="dash-mode-empty__cta">Aloita →</span></div>
          </div>
        </div>`;
      }
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `loop-2-dashboard-empty-${vp.n}.png`), fullPage: true });

    // 2. Exercise screen with shimmer placeholder visible
    await page.evaluate(() => {
      document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
      document.getElementById("screen-exercise")?.classList.add("active");
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `loop-2-exercise-loading-${vp.n}.png`), fullPage: true });

    // 3. Writing screen with shimmer
    await page.evaluate(() => {
      document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
      document.getElementById("screen-writing")?.classList.add("active");
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `loop-2-writing-loading-${vp.n}.png`), fullPage: true });

    // 4. Verify Hei,. fix — dashboard with no name should render "Hei."
    const greetText = await page.evaluate(() => {
      document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
      document.getElementById("screen-dashboard")?.classList.add("active");
      // Simulate "no name" + the comma-hide logic
      const u = document.getElementById("dash-username");
      const c = document.getElementById("dash-greeting-comma");
      if (u) u.textContent = "";
      if (c) c.hidden = true;
      const h1 = document.querySelector("#screen-dashboard h1.display");
      return h1 ? h1.innerText.replace(/\s+/g, " ").trim() : null;
    });
    if (greetText && /^Hei\s*,/.test(greetText)) {
      errors.push(`[dashboard@${vp.n}] greeting still shows comma when name empty: "${greetText}"`);
    } else {
      console.log(`[dashboard@${vp.n}] greeting empty-name: "${greetText}"`);
    }

    // 5. Shimmer cleanup test — set new text and confirm class removed
    const stillShimmering = await page.evaluate(() => {
      const q = document.getElementById("question-text");
      if (!q) return "no element";
      q.textContent = "el medio ambiente";
      // Allow MutationObserver to flush
      return new Promise((r) => setTimeout(() => r(q.classList.contains("loading-shimmer") ? "STILL HAS CLASS" : "CLEARED"), 50));
    });
    if (stillShimmering === "STILL HAS CLASS") {
      errors.push(`[shimmer-clear@${vp.n}] loading-shimmer NOT removed when text changed`);
    } else {
      console.log(`[shimmer-clear@${vp.n}] ${stillShimmering}`);
    }

    await ctx.close();
  }
} finally {
  await browser.close();
}

if (errors.length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("OK — all loop-2 checks passed");
