// Loop 5 verify — re-axe the screens we touched + screenshot the new exercise
// card containment.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

function check(label, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
}

// Helper: count color-contrast violations for a given target
async function colorContrastViolations(page, includeSelector) {
  const ax = new AxeBuilder({ page });
  if (includeSelector) ax.include(includeSelector);
  const results = await ax.analyze();
  return results.violations.filter((v) => v.id === "color-contrast");
}

for (const vp of [{ n: "1440", w: 1440, h: 900 }, { n: "375", w: 375, h: 812 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();

  // 1) Landing — hc-opt + hero-proof-kicker
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const landingViolations = await colorContrastViolations(page);
  const stillBad = landingViolations.flatMap((v) => v.nodes.map((n) => n.html.slice(0, 110)))
    .filter((h) => /hc-opt correct|hero-proof-kicker/.test(h));
  check(`landing@${vp.n}: hc-opt.correct + hero-proof-kicker contrast clean`, stillBad.length === 0, stillBad.length ? stillBad.join(" || ") : null);

  // 2) Vocab results — btn--cta__meta
  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-results")?.classList.add("active");
  });
  await page.waitForTimeout(200);
  const resultsViolations = await colorContrastViolations(page, "#screen-results");
  const ctaMetaBad = resultsViolations.flatMap((v) => v.nodes.map((n) => n.html.slice(0, 110)))
    .filter((h) => /btn--cta__meta/.test(h));
  check(`vocab results@${vp.n}: btn--cta__meta contrast clean`, ctaMetaBad.length === 0, ctaMetaBad.length ? ctaMetaBad.join(" || ") : null);

  // 3) Placement test — placement-test-badge
  await page.evaluate(() => {
    document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-placement-test")?.classList.add("active");
  });
  await page.waitForTimeout(200);
  const placementViolations = await colorContrastViolations(page, "#screen-placement-test");
  const badgeBad = placementViolations.flatMap((v) => v.nodes.map((n) => n.html.slice(0, 110)))
    .filter((h) => /placement-test-badge/.test(h));
  check(`placement@${vp.n}: placement-test-badge contrast clean`, badgeBad.length === 0, badgeBad.length ? badgeBad.join(" || ") : null);

  // 4) Exercise card containment — visible at 1440 inside its bordered surface
  await page.evaluate(() => {
    document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-exercise")?.classList.add("active");
    // populate dummy options so the card has substance
    const grid = document.getElementById("options-grid");
    if (grid && grid.children.length === 0) {
      ["A","B","C","D"].forEach((l, i) => {
        const div = document.createElement("button");
        div.className = "ex-option";
        div.innerHTML = `<span class="ex-option__l">${l}</span><span class="ex-option__t">${["viajar","cocinar","leer","cantar"][i]}</span>`;
        grid.appendChild(div);
      });
    }
    document.getElementById("question-text").textContent = "matkustaa";
    document.getElementById("question-text").classList.remove("loading-shimmer");
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `loop-5-exercise-${vp.n}.png`), fullPage: true });

  // 5) Writing screen with disabled submit — confirm new neutral state
  await page.evaluate(() => {
    document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-writing")?.classList.add("active");
    const btn = document.getElementById("btn-submit-writing");
    if (btn) btn.disabled = true;
  });
  await page.waitForTimeout(200);
  const submitContrast = await colorContrastViolations(page, "#screen-writing");
  const submitBad = submitContrast.flatMap((v) => v.nodes.map((n) => n.html.slice(0, 110)))
    .filter((h) => /btn-submit-writing/.test(h));
  check(`writing@${vp.n}: disabled submit contrast clean`, submitBad.length === 0, submitBad.length ? submitBad.join(" || ") : null);
  await page.screenshot({ path: path.join(OUT, `loop-5-writing-${vp.n}.png`), fullPage: true });

  await ctx.close();
}

await browser.close();
console.log(`Done. failures=${failures}`);
process.exit(failures ? 1 : 0);
