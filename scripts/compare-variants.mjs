// Generate 3 variants side-by-side for Marcel to pick from.
import { execSync } from "node:child_process";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync, readFileSync, copyFileSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BRAND = join(REPO, "public", "brand");
const OUT = join(REPO, "screenshots", "brand");

const variants = ["naked", "accent", "underline"];
const collected = {};

for (const v of variants) {
  execSync(`python scripts/generate-wordmark.py --variant ${v}`, { cwd: REPO, stdio: "inherit" });
  collected[v] = {
    logo: readFileSync(join(BRAND, "logo.svg"), "utf-8"),
    dark: readFileSync(join(BRAND, "logo-dark.svg"), "utf-8"),
    mono: readFileSync(join(BRAND, "logo-mono.svg"), "utf-8"),
  };
}

const escape = (s) => "data:image/svg+xml;utf8," + encodeURIComponent(s);

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #F5EDE0; color: #2A1F1A; }
  h1 { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; opacity: 0.55; font-weight: 600; }
  .variant { padding: 40px 48px; border-bottom: 1px solid rgba(42,31,26,0.1); }
  .variant + .variant { border-top: 1px dashed rgba(42,31,26,0.08); }
  .row { display: flex; align-items: center; gap: 56px; margin-top: 24px; }
  .stack { display: flex; flex-direction: column; gap: 8px; }
  .stack img { display: block; }
  .lg img { height: 96px; width: auto; }
  .md img { height: 56px; width: auto; }
  .dark { background: #2A1F1A; padding: 16px 20px; border-radius: 8px; }
  .label { font-size: 10px; opacity: 0.5; letter-spacing: 0.05em; }
  .pick { display: inline-block; margin-top: 6px; font-size: 13px; padding: 2px 10px; background: #A0341F; color: #F5EDE0; border-radius: 3px; font-weight: 600; }
  .note { font-size: 13px; line-height: 1.6; max-width: 640px; margin-top: 8px; opacity: 0.75; }
</style></head><body>
${variants.map((v) => `
<div class="variant">
  <h1>V — ${v}</h1>
  <p class="note">${
    v === "naked"
      ? "Pelkkä wordmark, ei ornamenttia. Lukio-konventio (SanomaPro, Otava, Mafy, Wilma — kaikki naked)."
      : v === "accent"
      ? "Espanjan akuutti (´) o-kirjaimen yllä — kontekstuaalinen viittaus että espanjan-yo-koe. Toimii myös typografisesti foreign-language-hint:nä."
      : "Brick-paksu underline koko wordmarkin alla. Highlight-gesture, viittaa että 'tämä on tärkeä sana'. Vahvempi tekstuaalinen läsnäolo."
  }</p>
  <div class="row">
    <div class="stack lg"><img src="${escape(collected[v].logo)}"><span class="label">light · 96 px</span></div>
    <div class="stack lg dark"><img src="${escape(collected[v].dark)}"><span class="label" style="color:#F5EDE0BF">dark</span></div>
    <div class="stack md"><img src="${escape(collected[v].mono)}"><span class="label">mono · 56 px</span></div>
  </div>
</div>
`).join("\n")}
</body></html>`;

writeFileSync(join(BRAND, "_variants.html"), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(`file://${join(BRAND, "_variants.html").replace(/\\/g, "/")}`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: join(OUT, "wordmark-variants.png"), fullPage: true });
await browser.close();
console.log(`Saved: ${join(OUT, "wordmark-variants.png")}`);

// Restore naked as the default committed state (cheapest revert if Marcel picks something else)
execSync(`python scripts/generate-wordmark.py --variant naked`, { cwd: REPO, stdio: "inherit" });
