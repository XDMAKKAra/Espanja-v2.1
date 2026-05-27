// V330 Step 1 — Build 3 catalog variants in-memory, screenshot each,
// compose horizontal compare strip. No commits, no tracked variant files.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const base = "http://localhost:4329/index.html";
const out = "screenshots/landing/variants";
await mkdir(out, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));

async function newPage() {
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  return p;
}

async function shotCatalog(p, label) {
  // Always re-measure right before the shot
  const m = await p.evaluate(() => {
    const el = document.querySelector("#kurssit");
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  });
  // Scroll the catalog into view then full-page screenshot, clip to catalog box
  await p.evaluate(() => window.scrollTo(0, 0));
  const fp = `${out}/_full_${label}.png`;
  await p.screenshot({ path: fp, fullPage: true });
  const clipPath = `${out}/${label}.png`;
  await sharp(fp).extract({ left: m.x, top: m.y, width: m.w, height: Math.min(m.h, 2200) }).toFile(clipPath);
  return { ...m, file: clipPath };
}

// ── Variant A: current tabbed-by-language, with explicit emphasis on the tab
// pill (default state already; we keep it as the baseline for compare).
const pA = await newPage();
const A = await pA.evaluate(() => {
  // No DOM mutation needed — Variant A IS the current shipped state.
  // Make the active-lang pill more visually present so the comparison is fair.
  const grid = document.querySelector(".catalog__grid");
  const cards = grid?.querySelectorAll(".catalog-card");
  return { variant: "A", cards: cards?.length || 0, note: "Current tabbed-by-language. Cards swap data-i18n content on click. Section already <1200px desktop." };
});
const shotA = await shotCatalog(pA, "variant-a-tabbed");
console.log("A:", { ...A, shot: shotA });

// ── Variant B: accordion default-collapsed. Replace .catalog__grid with a
// single stat block + a "Näytä kaikki kurssit ↓" toggle. Cards stay in DOM,
// hidden until user expands.
const pB = await newPage();
const B = await pB.evaluate(() => {
  const sec = document.querySelector("#kurssit");
  const grid = sec.querySelector(".catalog__grid");
  const hint = sec.querySelector(".catalog__hint");
  if (hint) hint.style.display = "none";
  // Hide the grid via collapse.
  grid.style.display = "none";
  // Insert accordion summary above the grid.
  const summary = document.createElement("button");
  summary.type = "button";
  summary.setAttribute("aria-expanded", "false");
  summary.className = "catalog__accordion";
  summary.innerHTML = `
    <span class="catalog__accordion-stats">
      <span class="catalog__accordion-stat"><b>8 kurssia</b><span>aiheittain</span></span>
      <span class="catalog__accordion-stat"><b>3 kieltä</b><span>es · fr · de</span></span>
      <span class="catalog__accordion-stat"><b>A → E</b><span>YTL-progressio</span></span>
    </span>
    <span class="catalog__accordion-cta">Näytä kaikki kurssit
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </span>
  `;
  Object.assign(summary.style, {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    maxWidth: "920px",
    margin: "0 auto",
    padding: "32px 40px",
    background: "var(--ed-bg-card)",
    border: "1px solid var(--ed-rule)",
    borderRadius: "20px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--ed-sans)",
    color: "var(--ed-ink)",
  });
  // Inject inline styles for the inner spans
  const style = document.createElement("style");
  style.textContent = `
    .catalog__accordion-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .catalog__accordion-stat { display: flex; flex-direction: column; gap: 4px; }
    .catalog__accordion-stat b { font-family: var(--ed-display); font-size: 1.625rem; font-weight: 500; color: var(--ed-accent); letter-spacing: -0.01em; }
    .catalog__accordion-stat span { font-family: var(--ed-mono); font-size: 0.75rem; letter-spacing: 0.06em; color: var(--ed-ink-subtle); text-transform: lowercase; }
    .catalog__accordion-cta { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; color: var(--ed-accent); font-weight: 600; font-size: 0.9375rem; padding-top: 12px; border-top: 1px solid var(--ed-rule); width: 100%; }
  `;
  document.head.appendChild(style);
  grid.parentNode.insertBefore(summary, grid);
  return { variant: "B" };
});
const shotB = await shotCatalog(pB, "variant-b-accordion");
console.log("B:", { ...B, shot: shotB });

// ── Variant C: stat-row only + "Katso kaikki kurssit →" link to /kurssit.
const pC = await newPage();
const C = await pC.evaluate(() => {
  const sec = document.querySelector("#kurssit");
  const grid = sec.querySelector(".catalog__grid");
  const hint = sec.querySelector(".catalog__hint");
  if (hint) hint.style.display = "none";
  const langSwitch = sec.querySelector(".catalog__lang-switch");
  if (langSwitch) langSwitch.style.display = "none";
  grid.style.display = "none";
  const linkRow = document.createElement("div");
  linkRow.className = "catalog__linkrow";
  linkRow.innerHTML = `
    <div class="catalog__linkrow-stats">
      <span><b>8 kurssia</b> · 3 kieltä</span>
      <span class="sep">·</span>
      <span>A → E -progressio</span>
      <span class="sep">·</span>
      <span>90 oppituntia / kieli</span>
    </div>
    <a class="catalog__linkrow-cta" href="/kurssit">
      Katso kaikki kurssit
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
    </a>
  `;
  Object.assign(linkRow.style, {
    maxWidth: "920px",
    margin: "0 auto",
    padding: "28px 40px",
    background: "var(--ed-bg-card)",
    border: "1px solid var(--ed-rule)",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    alignItems: "flex-start",
    fontFamily: "var(--ed-sans)",
  });
  const style = document.createElement("style");
  style.textContent = `
    .catalog__linkrow-stats { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 0.9375rem; color: var(--ed-ink-muted); }
    .catalog__linkrow-stats b { color: var(--ed-ink); font-weight: 600; }
    .catalog__linkrow-stats .sep { color: var(--ed-ink-faint); }
    .catalog__linkrow-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--ed-accent); color: var(--ed-accent-ink); padding: 12px 22px; border-radius: 10px; font-weight: 600; font-size: 0.9375rem; text-decoration: none; }
  `;
  document.head.appendChild(style);
  grid.parentNode.insertBefore(linkRow, grid);
  return { variant: "C" };
});
const shotC = await shotCatalog(pC, "variant-c-separate-page");
console.log("C:", { ...C, shot: shotC });

await b.close();

// ── Compose horizontal compare strip
const files = [shotA.file, shotB.file, shotC.file];
const labels = ["A · TABBED  (current state, baseline)", "B · ACCORDION  (default-collapsed)", "C · LINK-ROW  (catalog → /kurssit)"];
const targetH = 1100; // cap for the strip
const padTop = 80;
const padX = 24;
const gap = 36;

const resized = [];
for (let i = 0; i < files.length; i++) {
  const meta = await sharp(files[i]).metadata();
  const scale = Math.min(1, targetH / meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);
  const buf = await sharp(files[i]).resize({ width: w, height: h }).png().toBuffer();
  resized.push({ buf, w, h });
}
const stripW = padX * 2 + resized.reduce((a, r) => a + r.w, 0) + gap * (resized.length - 1);
const stripH = padTop + targetH + 40;

const svgLabels = labels.map((t, i) => {
  let x = padX;
  for (let k = 0; k < i; k++) x += resized[k].w + gap;
  return `<text x="${x + 6}" y="${padTop - 32}" font-family="Manrope, system-ui, sans-serif" font-size="22" font-weight="700" fill="#3b1d14">${t}</text>`;
}).join("\n");

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${stripW}" height="${stripH}">
  <rect width="100%" height="100%" fill="#f6f2ec"/>
  <text x="${padX}" y="42" font-family="Manrope, system-ui, sans-serif" font-size="28" font-weight="700" fill="#3b1d14">V330 — Catalog cut · 3 variants (2026-05-27)</text>
  ${svgLabels}
</svg>`);

const composites = [{ input: svg, top: 0, left: 0 }];
let cx = padX;
for (const r of resized) {
  composites.push({ input: r.buf, top: padTop, left: cx });
  cx += r.w + gap;
}

const stripPath = "screenshots/landing/catalog-variants-compare-2026-05-27.png";
await sharp({ create: { width: stripW, height: stripH, channels: 3, background: { r: 246, g: 242, b: 236 } } })
  .composite(composites)
  .png()
  .toFile(stripPath);

console.log("\nCOMPARE STRIP:", stripPath);
console.log("Variants in strip:");
for (let i = 0; i < files.length; i++) console.log(`  ${labels[i]}  →  ${files[i]}`);
