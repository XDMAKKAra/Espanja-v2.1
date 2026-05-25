// L-V317: render public/brand/favicon-master.svg to PNGs at the standard sizes
// using Playwright's bundled Chromium. Zero new deps.
//
// Output: public/favicon/{16,32,48,180,192,512}.png + favicon-master.png
//
// Run: node scripts/generate-favicons.mjs

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const masterSvgPath = resolve(repoRoot, "public/brand/favicon-master.svg");
const outDir = resolve(repoRoot, "public/favicon");
mkdirSync(outDir, { recursive: true });

const svg = readFileSync(masterSvgPath, "utf8");

const sizes = [
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-48.png", size: 48 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "favicon-master.png", size: 512 },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const { name, size } of sizes) {
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent}
    body{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center}
    svg{width:${size}px;height:${size}px;display:block}
  </style></head><body>${svg}</body></html>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html, { waitUntil: "load" });
  const buf = await page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
    type: "png",
  });
  writeFileSync(resolve(outDir, name), buf);
  console.log(`wrote ${name} (${size}x${size}, ${buf.length} bytes)`);
}

await browser.close();
console.log("done");
