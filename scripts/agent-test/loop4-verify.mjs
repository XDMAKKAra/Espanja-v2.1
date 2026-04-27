// Loop 4 verify — render the results screens with mock data, screenshot,
// confirm the new stats strip is visible, confetti dynamic-imports cleanly.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let failures = 0;

function check(label, ok, detail) {
  const tag = ok ? "PASS" : "FAIL";
  console.log(`${tag}  ${label}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
}

for (const vp of [{ n: "1440", w: 1440, h: 900 }, { n: "375", w: 375, h: 812 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[${vp.n}] ${e.message}`));
  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  // Vocab results — mock fill
  await page.evaluate(() => {
    document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-results")?.classList.add("active");
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("res-score-num", "11"); set("res-score-tot", "12"); set("res-pct", "92");
    set("res-mode-label", "VALMIS · SANASTO"); set("res-time", "20:30"); set("res-topic-label", "YHTEISKUNTA");
    set("res-coach", "Tämä taitaa olla sinun juttu. Vahva preteritti.");
    set("res-stat-correct", "11"); set("res-stat-wrong", "1"); set("res-stat-time", "4:32");
    const stats = document.getElementById("res-stats");
    if (stats) stats.hidden = false;
    // Mock breakdown
    const list = document.getElementById("res-list");
    if (list) {
      list.innerHTML = ["matkustaa","ystävä","ympäristö","tasa-arvo"].map((q,i) => {
        const ok = i !== 2;
        return `<div class="results__row results__row--${ok?"correct":"wrong"}">
          <span class="mono-num mono-num--md results__row-n">${String(i+1).padStart(2,"0")}</span>
          <span class="results__row-q"><span>${q}</span>${ok?"":'<span class="results__row-correct">medio ambiente</span>'}</span>
          <span class="results__row-mark">${ok?"✓":"✗"}</span></div>`;
      }).join("");
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `loop-4-results-vocab-${vp.n}.png`), fullPage: true });

  // Stats strip visible
  const statsVisible = await page.evaluate(() => {
    const el = document.getElementById("res-stats");
    return el && !el.hidden && el.offsetHeight > 0;
  });
  check(`stats strip visible @${vp.n}`, statsVisible);

  // Confetti module loads — manually trigger
  const confettiOk = await page.evaluate(async () => {
    try {
      const m = await import("/js/features/celebrate.js");
      if (typeof m.celebrateScore !== "function") return "no celebrateScore export";
      // Don't actually fire confetti (visual side-effect on test) — but confirm import didn't throw
      return "ok";
    } catch (e) {
      return "import error: " + e.message;
    }
  });
  check(`celebrate.js loads @${vp.n}`, confettiOk === "ok", confettiOk);

  // Reading results screen
  await page.evaluate(() => {
    document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-reading-results")?.classList.add("active");
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("reading-res-num", "5"); set("reading-res-tot", "6"); set("reading-res-pct", "83");
    set("reading-res-time", "20:34");
    set("reading-res-coach", "Hyvin meni. Pari yksityiskohtaa karkasi — palataan niihin.");
    set("reading-res-stat-correct", "5"); set("reading-res-stat-wrong", "1"); set("reading-res-stat-time", "7:12");
    const stats = document.getElementById("reading-res-stats");
    if (stats) stats.hidden = false;
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `loop-4-results-reading-${vp.n}.png`), fullPage: true });

  // Grammar results screen
  await page.evaluate(() => {
    document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
    document.getElementById("screen-grammar-results")?.classList.add("active");
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("gram-res-num", "8"); set("gram-res-tot", "10"); set("gram-res-pct", "80");
    set("gram-res-time", "20:36"); set("gram-res-topic", "PRETERITTI");
    set("gram-res-coach", "Yhteenveto: preteritti vahva, imperfekti vielä epävarma.");
    set("gram-res-stat-correct", "8"); set("gram-res-stat-wrong", "2"); set("gram-res-stat-time", "5:48");
    const stats = document.getElementById("gram-res-stats");
    if (stats) stats.hidden = false;
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `loop-4-results-grammar-${vp.n}.png`), fullPage: true });

  await ctx.close();
}

await browser.close();

if (errors.length) console.error("PAGEERRORS:\n" + errors.join("\n"));
console.log(`Done. failures=${failures} pageerrors=${errors.length}`);
process.exit(failures || errors.length ? 1 : 0);
