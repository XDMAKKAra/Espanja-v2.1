import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, "docs", "briefs", "L-V318-slop-gate-comparison.png");

// Render Puheo favicon @ 16 px next to other product favicons. We pull
// public favicons directly from each company's CDN — this is the same kind of
// view a lukio rep would see if they bookmarked all five tabs.
const HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #fafafa; padding: 40px; }
  h1 { font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; color: #888; margin: 0 0 24px; }
  .tab-row { display: flex; align-items: center; gap: 0; background: #ececec; border-radius: 8px 8px 0 0; padding: 6px 6px 0; max-width: 880px; }
  .tab { display: flex; align-items: center; gap: 8px; background: #fff; padding: 8px 14px; border-radius: 6px 6px 0 0; font-size: 12px; color: #333; margin-right: 2px; min-width: 0; max-width: 160px; }
  .tab img { width: 16px; height: 16px; flex-shrink: 0; }
  .tab span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tab.puheo { background: #fff8f0; font-weight: 600; }
  .big { margin-top: 36px; display: flex; gap: 24px; align-items: flex-end; }
  .big > div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; color: #666; }
  .big img.s16 { width: 16px; height: 16px; image-rendering: pixelated; }
  .big img.s32 { width: 32px; height: 32px; }
  .big img.s64 { width: 64px; height: 64px; }
</style></head><body>
  <h1>Slop-gate: Puheo favicon vs other products (tab strip)</h1>
  <div class="tab-row">
    <div class="tab puheo"><img src="/favicon-32.png"><span>Puheo — Pärjää YO-kokeessa</span></div>
    <div class="tab"><img src="https://www.vercel.com/favicon.ico"><span>Vercel</span></div>
    <div class="tab"><img src="https://linear.app/favicon.ico"><span>Linear</span></div>
    <div class="tab"><img src="https://stripe.com/favicon.ico"><span>Stripe</span></div>
    <div class="tab"><img src="https://www.otava.fi/favicon.ico"><span>Otava</span></div>
    <div class="tab"><img src="https://www.sanomapro.fi/favicon.ico"><span>SanomaPro</span></div>
  </div>

  <h1 style="margin-top: 48px">Puheo favicon at increasing sizes</h1>
  <div class="big">
    <div><img class="s16" src="/favicon-32.png"><span>16 px (browser tab)</span></div>
    <div><img class="s32" src="/favicon-32.png"><span>32 px (high-dpi)</span></div>
    <div><img class="s64" src="/icon-192.png"><span>64 px (home screen)</span></div>
  </div>
</body></html>`;

writeFileSync(join(REPO, "public", "_slop-gate.html"), HTML);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 480 }, deviceScaleFactor: 2 });
await page.goto(`http://localhost:3000/public/_slop-gate.html`);
await page.waitForLoadState("networkidle");
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log(`Saved: ${OUT}`);
