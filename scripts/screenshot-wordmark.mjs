import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BRAND = join(REPO, "public", "brand");
const OUT = join(REPO, "screenshots", "brand");
mkdirSync(OUT, { recursive: true });

const HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  body { margin: 0; font-family: system-ui; background: #F5EDE0; color: #2A1F1A; }
  .row { display: flex; align-items: center; gap: 32px; padding: 32px; border-bottom: 1px solid #2A1F1A1A; }
  .label { width: 220px; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.6; }
  .box { display: flex; align-items: center; gap: 16px; }
  .box img { display: block; }
  .dark { background: #2A1F1A; color: #F5EDE0; }
  .dark .label { opacity: 0.75; }
  .small img { width: 16px; height: 16px; }
  .medium img { width: 32px; height: 32px; }
  .large img { width: 96px; }
  .xl img { width: 240px; }
  .fav { padding: 12px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); background: #fff; }
</style></head><body>
  <div class="row"><div class="label">logo.svg @ 96 px</div><div class="box large"><img src="logo.svg"></div></div>
  <div class="row"><div class="label">logo.svg @ 240 px</div><div class="box xl"><img src="logo.svg"></div></div>
  <div class="row dark"><div class="label">logo-dark.svg @ 240 px</div><div class="box xl"><img src="logo-dark.svg"></div></div>
  <div class="row"><div class="label">logo-mono.svg @ 240 px</div><div class="box xl"><img src="logo-mono.svg"></div></div>
  <div class="row">
    <div class="label">favicon @ 16 / 32 / 96 px</div>
    <div class="box small"><img class="fav" src="favicon-master.svg"></div>
    <div class="box medium"><img class="fav" src="favicon-master.svg"></div>
    <div class="box large"><img class="fav" src="favicon-master.svg"></div>
  </div>
</body></html>`;

writeFileSync(join(BRAND, "_preview.html"), HTML);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(`file://${join(BRAND, "_preview.html").replace(/\\/g, "/")}`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: join(OUT, "wordmark-preview.png"), fullPage: true });
await browser.close();
console.log(`Saved: ${join(OUT, "wordmark-preview.png")}`);
