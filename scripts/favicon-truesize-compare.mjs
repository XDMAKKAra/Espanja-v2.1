// L-V325 follow-up — render OLD master, variant A, variant B at *exactly*
// 16 / 32 / 48 px in Chromium (same engine as Chrome) with deviceScaleFactor:2,
// the way Windows hi-DPI Chrome rasterises favicons. Composes a tight grid
// at 4× display zoom so each glyph is judgable without comparison-strip
// container styling that could mask sub-pixel issues.
//
// Output: screenshots/brand/favicon-truesize.png

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_PATH = resolve(REPO, "screenshots/brand/favicon-truesize.png");
mkdirSync(dirname(OUT_PATH), { recursive: true });

const READ = (p) => readFileSync(p, "utf-8");
const VARIANTS = [
  { name: "OLD (font-size 42)",         svg: READ(resolve(REPO, "old-master-tmp.svg")) },
  { name: "A · current ship (font-size 52)",        svg: READ(resolve(REPO, "public/brand/favicon-master.svg")) },
  { name: "B · outline path (fontTools)", svg: READ(resolve(REPO, "public/brand/variants/favicon-variant-B.svg")) },
];
const SIZES = [16, 32, 48];

const browser = await chromium.launch();

async function renderToPng(svg, size) {
  const ctx = await browser.newContext({ deviceScaleFactor: 2 }); // Hi-DPI rasterisation
  const page = await ctx.newPage();
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent}
    body{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center}
    svg{width:${size}px;height:${size}px;display:block}
  </style></head><body>${svg.replace(/<svg /, "<svg ")}</body></html>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(150); // let embedded @font-face decode (variant A)
  const buf = await page.screenshot({
    omitBackground: false,
    clip: { x: 0, y: 0, width: size, height: size },
    type: "png",
  });
  await ctx.close();
  return buf;
}

// Render every variant × size, then build an HTML grid that shows each PNG at
// its native pixel size AND at 6× zoom for inspection. Then screenshot that
// grid as the final compare.
const cells = [];
for (const v of VARIANTS) {
  const row = [];
  for (const s of SIZES) {
    const png = await renderToPng(v.svg, s);
    const b64 = png.toString("base64");
    row.push({ size: s, b64 });
  }
  cells.push({ name: v.name, row });
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #FBF7F0; color: #2A1F1A;
  font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
.frame { padding: 32px; }
h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
.sub { color: #6B5E55; font-size: 12px; margin-bottom: 22px; }
table { border-collapse: collapse; }
th, td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #E5DBCB; vertical-align: middle; }
th { font-size: 11px; color: #6B5E55; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.name { font-weight: 700; font-size: 13px; min-width: 220px; }
.pair { display: inline-flex; flex-direction: column; align-items: center; gap: 8px; margin-right: 28px; }
.pair img.native { display: block; image-rendering: pixelated; background: #F4ECDD; }
.pair img.zoomed { image-rendering: pixelated; }
.lbl { font-size: 10px; color: #6B5E55; }
.tabstrip { display: inline-flex; gap: 0; padding: 4px 6px; background: #DEDAD2; border-radius: 6px 6px 0 0; border: 1px solid #C9C2B6; border-bottom: none; align-items: center; }
.tab { display: flex; align-items: center; gap: 5px; padding: 4px 9px; background: #FFFFFF; border-radius: 5px 5px 0 0; font-size: 10px; color: #2A1F1A; max-width: 130px; overflow: hidden; white-space: nowrap; }
.tab img { width: 16px; height: 16px; display: block; image-rendering: pixelated; }
</style></head>
<body>
<div class="frame">
  <h1>Favicon true-size compare · OLD vs A (shipped) vs B</h1>
  <div class="sub">Playwright/Chromium @ devicePixelRatio = 2, same engine Chrome uses on Windows hi-DPI. 1× = native pixels, 6× = zoom for inspection.</div>
  <table>
    <thead><tr><th>Variant</th><th>16 px</th><th>32 px</th><th>48 px</th><th>tab-strip mock (16 px)</th></tr></thead>
    <tbody>
      ${cells.map(({ name, row }) => `
        <tr>
          <td class="name">${name}</td>
          ${row.map(({ size, b64 }) => `
            <td>
              <div class="pair">
                <img class="native" src="data:image/png;base64,${b64}" width="${size}" height="${size}">
                <img class="zoomed" src="data:image/png;base64,${b64}" width="${size * 6}" height="${size * 6}">
                <span class="lbl">1× / 6× zoom</span>
              </div>
            </td>`).join("")}
          <td>
            <div class="tabstrip">
              <span class="tab" style="background:#EFEAE0"><span style="width:16px;height:16px;background:#000;border-radius:3px"></span>Vercel</span>
              <span class="tab"><img src="data:image/png;base64,${row[0].b64}">Puheo</span>
              <span class="tab" style="background:#EFEAE0"><span style="width:16px;height:16px;background:#635BFF;border-radius:3px"></span>Stripe</span>
            </div>
          </td>
        </tr>`).join("")}
    </tbody>
  </table>
</div>
</body></html>`;

const page = await (await browser.newContext({ deviceScaleFactor: 2 })).newPage();
await page.setViewportSize({ width: 1400, height: 1200 });
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(200);

const frame = await page.locator(".frame").boundingBox();
const buf = await page.screenshot({
  clip: { x: 0, y: 0, width: Math.ceil(frame.width + 40), height: Math.ceil(frame.height + 40) },
  type: "png",
});
writeFileSync(OUT_PATH, buf);
console.log(`wrote ${OUT_PATH} (${buf.length} bytes)`);

await browser.close();
