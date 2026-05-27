// V330 verification — accordion catalog heights closed + opened, both viewports.
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const base = "http://localhost:4329/index.html";
const b = await chromium.launch();
await mkdir("screenshots/landing", { recursive: true });

async function probe(ctx, label, viewportLabel) {
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);

  const closed = await p.evaluate(() => {
    const sec = document.querySelector("#kurssit");
    const det = document.querySelector(".catalog__accordion");
    return {
      catalog_height: Math.round(sec.getBoundingClientRect().height),
      accordion_open: det ? det.open : null,
      summary_visible: !!document.querySelector(".catalog__accordion-summary"),
    };
  });

  await p.locator(".catalog__accordion-summary").click();
  await p.waitForTimeout(400);

  const opened = await p.evaluate(() => {
    const sec = document.querySelector("#kurssit");
    const det = document.querySelector(".catalog__accordion");
    const cards = document.querySelectorAll(".catalog-card");
    return {
      catalog_height: Math.round(sec.getBoundingClientRect().height),
      accordion_open: det ? det.open : null,
      card_count: cards.length,
      label_closed_visible: getComputedStyle(document.querySelector("[data-closed]")).display !== "none",
      label_open_visible: getComputedStyle(document.querySelector("[data-open]")).display !== "none",
    };
  });

  console.log(`${viewportLabel}: ${label}`);
  console.log("  closed:", JSON.stringify(closed));
  console.log("  opened:", JSON.stringify(opened));
  await p.close();
  return { closed, opened };
}

const dctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await dctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
const desktop = await probe(dctx, "catalog", "DESKTOP 1280");

const mctx = await b.newContext({ ...devices["iPhone 13"] });
await mctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
const mobile = await probe(mctx, "catalog", "MOBILE iPhone 13");

// Anchor test: navigate to #kurssit
const a = await dctx.newPage();
await a.goto(base + "#kurssit", { waitUntil: "networkidle" });
await a.waitForTimeout(400);
const anchorY = await a.evaluate(() => {
  const sec = document.querySelector("#kurssit");
  return { id_present: !!sec, rect_top: Math.round(sec.getBoundingClientRect().top) };
});
console.log("ANCHOR #kurssit:", JSON.stringify(anchorY));
await a.close();

// Full-page after V330 screenshot (collapsed state)
const sp = await dctx.newPage();
await sp.goto(base, { waitUntil: "networkidle" });
await sp.waitForTimeout(500);
await sp.screenshot({ path: "screenshots/landing/fullpage-after-V330.png", fullPage: true });
await sp.close();

await b.close();

// Targets
console.log("\nV330 acceptance:");
console.log("  desktop closed <2000px:", desktop.closed.catalog_height < 2000, `(${desktop.closed.catalog_height})`);
console.log("  mobile  closed <1200px:", mobile.closed.catalog_height < 1200, `(${mobile.closed.catalog_height})`);
console.log("  anchor #kurssit resolves:", anchorY.id_present);
console.log("  accordion toggles open:", desktop.opened.accordion_open === true);
