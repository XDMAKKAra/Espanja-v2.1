// L49 — generate /icon-192.png, /icon-512.png, /favicon.ico from a vector "P".
// Uses Playwright canvas → PNG. The pattern: dark slate square + mint Geist "P".
import { chromium } from "playwright";
import fs from "node:fs";

async function renderIcon(size, outPath) {
  const html = `<!doctype html><html><head><style>
    @font-face { font-family: "Geist"; src: url("https://fonts.gstatic.com/s/geist/v6/gyByhwUxId8gMEwYGFU3Tdi6tg.woff2") format("woff2"); font-weight: 700; }
    html, body { margin: 0; padding: 0; background: transparent; }
    .icon {
      width: ${size}px;
      height: ${size}px;
      background: #0a0a0a;
      border-radius: ${Math.round(size * 0.22)}px;
      display: grid;
      place-items: center;
      position: relative;
      overflow: hidden;
    }
    .icon::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 30% 25%, rgba(45, 212, 191, 0.35) 0%, transparent 55%);
    }
    .mark {
      font-family: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
      font-weight: 700;
      font-size: ${Math.round(size * 0.62)}px;
      color: #fafafa;
      letter-spacing: -0.04em;
      line-height: 1;
      position: relative;
      z-index: 1;
      transform: translateY(-2%);
    }
    .mark .o {
      color: #2DD4BF;
    }
  </style></head><body>
    <div class="icon"><span class="mark">P<span class="o">o</span></span></div>
  </body></html>`;

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: outPath, type: "png", omitBackground: false, clip: { x: 0, y: 0, width: size, height: size } });
  await b.close();
  console.log(`wrote ${outPath} (${size}x${size})`);
}

await renderIcon(192, "icon-192.png");
await renderIcon(512, "icon-512.png");
await renderIcon(32,  "favicon-32.png");
