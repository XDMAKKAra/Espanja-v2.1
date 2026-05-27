import { chromium, devices } from "playwright";

const base = "http://localhost:4329/index.html";
const b = await chromium.launch();

const dctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await dctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
const d = await dctx.newPage();
await d.goto(base, { waitUntil: "networkidle" });
await d.waitForTimeout(800);
const desktop = await d.evaluate(() => {
  const c = document.querySelector("#kurssit");
  const r = c.getBoundingClientRect();
  const grid = document.querySelector(".catalog__grid");
  const gridR = grid.getBoundingClientRect();
  const cards = Array.from(document.querySelectorAll(".catalog-card"));
  return {
    catalog_height: Math.round(r.height),
    grid_height: Math.round(gridR.height),
    card_heights: cards.map((c) => Math.round(c.getBoundingClientRect().height)),
    grid_cols: getComputedStyle(grid).gridTemplateColumns,
    full_doc_height: document.documentElement.scrollHeight,
  };
});
console.log("DESKTOP 1280:");
console.log(JSON.stringify(desktop, null, 2));

const mctx = await b.newContext({ ...devices["iPhone 13"] });
await mctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
const m = await mctx.newPage();
await m.goto(base, { waitUntil: "networkidle" });
await m.waitForTimeout(800);
const mobile = await m.evaluate(() => {
  const c = document.querySelector("#kurssit");
  return {
    catalog_height: Math.round(c.getBoundingClientRect().height),
    grid_display: getComputedStyle(document.querySelector(".catalog__grid")).display,
    full_doc_height: document.documentElement.scrollHeight,
  };
});
console.log("MOBILE iPhone 13:");
console.log(JSON.stringify(mobile, null, 2));

await b.close();
