// L49 responsive + a11y sweep across 4 viewports.
// Captures full-page screenshots, measures horizontal overflow, runs axe-core.
import { chromium } from "playwright";
import fs from "node:fs";

const URL = "http://localhost:3000/";
const AXE = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const VIEWPORTS = [
  { w: 375,  h: 812,  name: "375"  },
  { w: 768,  h: 1024, name: "768"  },
  { w: 1024, h: 768,  name: "1024" },
  { w: 1920, h: 1080, name: "1920" },
];

const SHOTDIR = "scripts/agent-test/screenshots";
fs.mkdirSync(SHOTDIR, { recursive: true });

const b = await chromium.launch();
const summary = [];

for (const v of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.waitForTimeout(400); // settle fonts / hero blur-in

  // 1. Horizontal-overflow probe.
  const overflow = await p.evaluate(() => {
    const docW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const offenders = [];
    if (docW > clientW) {
      // Find descendants that exceed viewport.
      const all = document.querySelectorAll("*");
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > clientW + 0.5 && r.width > 0 && r.height > 0) {
          // Skip absolutely positioned decorations.
          const cs = getComputedStyle(el);
          if (cs.position === "fixed") continue;
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: el.className && typeof el.className === "string"
              ? el.className.slice(0, 80) : "",
            id: el.id || "",
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
          if (offenders.length >= 8) break;
        }
      }
    }
    return { docW, clientW, hScroll: docW > clientW, offenders };
  });

  // 2. Full-page screenshot.
  const shotPath = `${SHOTDIR}/loop49-${v.name}-full.png`;
  await p.screenshot({ path: shotPath, fullPage: true });

  // 3. axe-core sweep.
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(150);
  await p.evaluate(AXE);
  const violations = await p.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return r.violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodeCount: nodes.length,
      sample: nodes[0]?.html?.slice(0, 220),
    }));
  });

  // 4. Heading hierarchy probe (no jumps).
  const headings = await p.evaluate(() => {
    const list = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(h => ({
      level: Number(h.tagName.slice(1)),
      text: (h.textContent || "").trim().slice(0, 60),
    }));
    const jumps = [];
    for (let i = 1; i < list.length; i++) {
      const diff = list[i].level - list[i - 1].level;
      if (diff > 1) jumps.push({ from: list[i-1], to: list[i], diff });
    }
    return { count: list.length, jumps };
  });

  // 5. target=_blank without rel safety probe.
  const blankTargets = await p.evaluate(() => {
    return [...document.querySelectorAll('a[target="_blank"]')]
      .filter(a => {
        const rel = (a.getAttribute("rel") || "").toLowerCase();
        return !rel.includes("noopener");
      })
      .map(a => a.outerHTML.slice(0, 200));
  });

  // 6. Images missing alt or width/height.
  const imgIssues = await p.evaluate(() => {
    return [...document.querySelectorAll("img")]
      .map(img => ({
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt"),
        w: img.getAttribute("width"),
        h: img.getAttribute("height"),
        loading: img.getAttribute("loading"),
      }));
  });

  console.log(`\n[${v.name}×${v.h}] ────────────────────────`);
  console.log(`  hScroll: ${overflow.hScroll}  doc=${overflow.docW}  client=${overflow.clientW}`);
  if (overflow.offenders.length) {
    console.log(`  Offenders:`);
    overflow.offenders.forEach(o => console.log(`    ${o.tag}.${o.cls} #${o.id}  right=${o.right}  w=${o.width}`));
  }
  console.log(`  axe violations: ${violations.length}`);
  violations.forEach(v => console.log(`    [${v.impact}] ${v.id}: ${v.description}  (${v.nodeCount} nodes)`));
  console.log(`  headings: ${headings.count}  jumps: ${headings.jumps.length}`);
  headings.jumps.forEach(j => console.log(`    H${j.from.level}→H${j.to.level}: "${j.to.text}"`));
  console.log(`  blank-targets without noopener: ${blankTargets.length}`);
  console.log(`  images: ${imgIssues.length}`);
  imgIssues.forEach(i => console.log(`    src=${i.src.slice(0,60)}  alt="${i.alt}"  w=${i.w}  h=${i.h}  loading=${i.loading}`));
  console.log(`  shot: ${shotPath}`);

  summary.push({
    viewport: v.name,
    hScroll: overflow.hScroll,
    overflowCount: overflow.offenders.length,
    axeViolations: violations.length,
    headingJumps: headings.jumps.length,
    unsafeBlankTargets: blankTargets.length,
  });

  await ctx.close();
}

await b.close();

console.log("\n\nSUMMARY ──────────────────────────────");
console.table(summary);

const totalAxe = summary.reduce((s, r) => s + r.axeViolations, 0);
const totalOverflow = summary.reduce((s, r) => s + r.overflowCount, 0);
const totalJumps = summary.reduce((s, r) => s + r.headingJumps, 0);
const totalBlank = summary.reduce((s, r) => s + r.unsafeBlankTargets, 0);

console.log(`\nTOTALS  axe=${totalAxe}  overflow=${totalOverflow}  headingJumps=${totalJumps}  unsafeBlank=${totalBlank}`);

if (totalAxe > 0 || totalOverflow > 0 || totalJumps > 0 || totalBlank > 0) {
  process.exitCode = 1;
}
