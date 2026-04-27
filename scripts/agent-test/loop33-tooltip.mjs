// Loop 33 — verify the global shadcn-style tooltip module fires on hover
// of an element carrying `data-tooltip`. We construct a tiny test surface
// directly into the DOM (avoids dragging in any auth/dashboard plumbing).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("scripts/agent-test/screenshots");
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(900);

// Inject a small probe button into the page, install the tooltip module,
// hover, and screenshot.
await page.evaluate(async () => {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const auth = document.getElementById("screen-auth");
  if (auth) auth.classList.add("active");

  const probe = document.createElement("button");
  probe.id = "tt-probe";
  probe.textContent = "Hover me";
  probe.setAttribute("data-tooltip", "Tallenna tulos PNG-kuvana");
  probe.title = "should be suppressed during hover";
  probe.style.cssText = "position:fixed; left:560px; top:420px; padding:10px 14px; font-family:Inter,sans-serif; font-size:13px; border:1px solid #ccc; border-radius:6px; background:#fff; cursor:pointer; z-index:5000;";
  document.body.appendChild(probe);

  const m = await import("/js/features/tooltip.js");
  m.installTooltip();
});

const probeBox = await page.$("#tt-probe").then((h) => h?.boundingBox());
if (!probeBox) errors.push("probe button missing");

// Hover into the centre of the probe.
await page.mouse.move(probeBox.x + probeBox.width / 2, probeBox.y + probeBox.height / 2, { steps: 6 });
// Wait past OPEN_DELAY (120 ms) + transition (140 ms).
await page.waitForTimeout(420);

const popState = await page.evaluate(() => {
  const p = document.querySelector(".tt-popover");
  if (!p) return { exists: false };
  const r = p.getBoundingClientRect();
  return {
    exists: true,
    text: p.textContent,
    placement: p.dataset.placement,
    visible: p.classList.contains("tt-popover--in"),
    left: Math.round(r.left), top: Math.round(r.top),
    width: Math.round(r.width), height: Math.round(r.height),
    titleNow: document.getElementById("tt-probe")?.getAttribute("title"),
  };
});
console.log("popState:", popState);
if (!popState.exists || !popState.visible) errors.push("tooltip did not become visible");
if (popState.titleNow !== "") errors.push(`title not suppressed during hover (got "${popState.titleNow}")`);

await page.screenshot({ path: path.join(OUT, "loop-33-tooltip-on.png"), clip: { x: 480, y: 340, width: 320, height: 220 } });

// Move away — tooltip should fade out within ~200ms.
await page.mouse.move(100, 100);
await page.waitForTimeout(360);
const afterLeave = await page.evaluate(() => {
  const p = document.querySelector(".tt-popover");
  return { hidden: p?.hidden, hasIn: p?.classList.contains("tt-popover--in"), titleNow: document.getElementById("tt-probe")?.getAttribute("title") };
});
console.log("afterLeave:", afterLeave);
if (afterLeave.hasIn) errors.push("tooltip did not hide after pointer-leave");
if (afterLeave.titleNow !== "should be suppressed during hover") errors.push("title not restored after leave");

await page.screenshot({ path: path.join(OUT, "loop-33-tooltip-off.png"), clip: { x: 480, y: 340, width: 320, height: 220 } });

await ctx.close();
await browser.close();

const real = errors.filter((e) => !/401|404|net::ERR|worker-src|script-src/.test(e));
if (real.length) { console.error("ERRORS:\n" + real.join("\n")); process.exit(1); }
else console.log("OK — tooltip screenshots saved");
