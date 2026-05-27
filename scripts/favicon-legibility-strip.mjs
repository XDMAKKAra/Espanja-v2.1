// L-V325 — render a side-by-side strip comparing the current favicon-master
// against three legibility variants at the actual sizes browsers use:
//   16px (tab strip), 32px (bookmark bar), 48px (Android home-screen).
// Plus a faux tab-strip row at 16px so each variant can be judged in the
// context that matters most.
//
// Output: screenshots/brand/favicon-legibility-compare.png

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_PATH = resolve(REPO, "screenshots/brand/favicon-legibility-compare.png");
mkdirSync(dirname(OUT_PATH), { recursive: true });

const VARIANTS = [
  { label: "Current",   path: "public/brand/favicon-master.svg",          note: "font-size 42, brick on cream" },
  { label: "A · bigger",   path: "public/brand/variants/favicon-variant-A.svg", note: "font-size 52, letter-spacing -2.0" },
  { label: "B · outline",  path: "public/brand/variants/favicon-variant-B.svg", note: "fontTools path, 75% glyph height" },
  { label: "C · inverted", path: "public/brand/variants/favicon-variant-C.svg", note: "cream bg, brick p, font-size 52" },
];

const SIZES = [16, 32, 48];

const svgFor = (rel) => {
  const p = resolve(REPO, rel);
  if (!existsSync(p)) throw new Error(`missing: ${rel}`);
  return readFileSync(p, "utf-8");
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const page = await ctx.newPage();

// Compose: a single HTML page with all variants laid out, screenshot the whole page.
const cellsHtml = VARIANTS.map((v) => {
  const sizesHtml = SIZES.map((s) => {
    const inlineSvg = svgFor(v.path)
      .replace(/<svg /, `<svg style="width:${s}px;height:${s}px;display:block" `);
    return `
      <div class="cell" style="--s:${s}px">
        <div class="canvas">${inlineSvg}</div>
        <div class="label">${s} px</div>
      </div>`;
  }).join("");

  // Tab-strip mock: 4 fake browser tabs with the variant as the third favicon.
  const tabSvg = svgFor(v.path).replace(/<svg /, `<svg style="width:16px;height:16px;display:block" `);
  const tabStripHtml = `
    <div class="tabstrip">
      <span class="tab"><span class="t-fav fav-vercel"></span>Vercel</span>
      <span class="tab"><span class="t-fav fav-stripe"></span>Stripe</span>
      <span class="tab tab--ours">${tabSvg}<span class="t-name">Puheo · YO-koe</span></span>
      <span class="tab"><span class="t-fav fav-otava"></span>Otava</span>
    </div>`;

  return `
    <div class="row">
      <div class="row-label">
        <div class="row-title">${v.label}</div>
        <div class="row-note">${v.note}</div>
      </div>
      ${sizesHtml}
      ${tabStripHtml}
    </div>`;
}).join("");

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
:root { color-scheme: light; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #FBF7F0; color: #2A1F1A;
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
}
.frame { padding: 40px; max-width: 1200px; }
.frame > h1 {
  font-size: 24px; margin: 0 0 4px;
  letter-spacing: -0.01em; font-weight: 700;
}
.frame > .sub { color: #6B5E55; margin-bottom: 28px; font-size: 13px; }
.row {
  display: grid;
  grid-template-columns: 220px repeat(${SIZES.length}, 1fr) 1.6fr;
  gap: 18px; align-items: center;
  padding: 16px 18px;
  border: 1px solid #E5DBCB;
  border-radius: 14px;
  background: #FFFFFF;
  margin-bottom: 14px;
}
.row-label .row-title { font-weight: 700; font-size: 15px; }
.row-label .row-note  { font-size: 12px; color: #6B5E55; margin-top: 3px; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.cell .canvas {
  width: 96px; height: 96px;
  display: grid; place-items: center;
  background: #F4ECDD;
  border-radius: 10px;
}
.cell .canvas svg { /* size already set inline */ image-rendering: -webkit-optimize-contrast; }
.cell .label { font-size: 11px; color: #6B5E55; letter-spacing: 0.02em; }

.tabstrip {
  display: flex; gap: 2px;
  padding: 6px 8px;
  background: #DEDAD2; border-radius: 8px 8px 0 0;
  border: 1px solid #C9C2B6; border-bottom: none;
  height: 36px; align-items: center;
}
.tab {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: #EFEAE0; border-radius: 6px 6px 0 0;
  font-size: 11px; color: #463A2F;
  max-width: 150px; overflow: hidden; white-space: nowrap;
}
.tab--ours { background: #FFFFFF; }
.tab--ours .t-name { color: #2A1F1A; font-weight: 600; }
.t-fav { width: 16px; height: 16px; border-radius: 3px; background: #C7BBA8; flex-shrink: 0; }
.fav-vercel { background: #000; }
.fav-stripe { background: #635BFF; }
.fav-otava  { background: #E63946; }
</style></head>
<body>
  <div class="frame">
    <h1>Favicon legibility · 16/32/48 px</h1>
    <div class="sub">L-V325 · current master + 3 variants · faux tab-strip on the right shows browser context</div>
    ${cellsHtml}
  </div>
</body></html>`;

await page.setViewportSize({ width: 1280, height: 800 });
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(200); // let embedded fonts decode

const frame = await page.locator(".frame").boundingBox();
const buf = await page.screenshot({
  clip: { x: 0, y: 0, width: Math.ceil(frame.width + 40), height: Math.ceil(frame.height + 40) },
  type: "png",
});
writeFileSync(OUT_PATH, buf);
console.log(`wrote ${OUT_PATH.replace(REPO + "\\", "").replace(REPO + "/", "")} (${buf.length} bytes, ${Math.ceil(frame.width)}×${Math.ceil(frame.height)})`);

await browser.close();
