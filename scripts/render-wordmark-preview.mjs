// L-V317: render wordmark previews to verify the SVG looks right.
// Output: docs/briefs/L-V317-brand-preview.png
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const briefDir = resolve(repoRoot, "docs/briefs");
mkdirSync(briefDir, { recursive: true });

const logo = readFileSync(resolve(repoRoot, "public/brand/logo.svg"), "utf8");
const logoMono = readFileSync(resolve(repoRoot, "public/brand/logo-mono.svg"), "utf8");
const logoDark = readFileSync(resolve(repoRoot, "public/brand/logo-dark.svg"), "utf8");
const favicon = readFileSync(resolve(repoRoot, "public/brand/favicon-master.svg"), "utf8");
const fontWoff2 = readFileSync(resolve(repoRoot, "fonts/inter-latin-600-normal.woff2"));
const fontBase64 = fontWoff2.toString("base64");

const html = `<!doctype html><html><head><style>
  @font-face {
    font-family: "Inter";
    font-weight: 600;
    src: url(data:font/woff2;base64,${fontBase64}) format("woff2");
  }
  html,body{margin:0;padding:0;font-family:"Inter",system-ui,sans-serif;color:#1F1714}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
  .cell{padding:40px;display:flex;flex-direction:column;gap:16px;align-items:flex-start;justify-content:center;min-height:200px}
  .cream{background:#FFFAF2}
  .ink{background:#1F1714;color:#FFFAF2}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;opacity:0.5}
  svg{height:64px;width:auto;display:block}
  .row{display:flex;gap:24px;align-items:center}
  .fav{width:48px;height:48px;display:block}
  .fav-16{width:16px;height:16px;display:block;image-rendering:pixelated}
  .fav-32{width:32px;height:32px;display:block;image-rendering:pixelated}
</style></head><body>
<div class="grid">
  <div class="cell cream">
    <div class="label">Wordmark · brick on cream</div>
    ${logo}
  </div>
  <div class="cell cream">
    <div class="label">Wordmark mono · ink on cream</div>
    ${logoMono}
  </div>
  <div class="cell ink">
    <div class="label">Wordmark dark · cream on ink</div>
    ${logoDark}
  </div>
  <div class="cell cream">
    <div class="label">Favicon master + tab sizes</div>
    <div class="row">
      ${favicon.replace("<svg ", '<svg class="fav" ')}
      ${favicon.replace("<svg ", '<svg class="fav-32" ')}
      ${favicon.replace("<svg ", '<svg class="fav-16" ')}
    </div>
  </div>
</div>
</body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.setViewportSize({ width: 960, height: 480 });
await page.setContent(html, { waitUntil: "load" });
const out = resolve(briefDir, "L-V317-brand-preview.png");
await page.screenshot({ path: out, fullPage: true });
console.log(`wrote ${out}`);
await browser.close();
