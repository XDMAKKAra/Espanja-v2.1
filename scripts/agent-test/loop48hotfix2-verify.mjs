// L48-hotfix-2 verify: scroll-to-footer + axe + pillar-demo screenshots.
import { chromium } from "playwright";
import fs from "node:fs";

const URL = "http://localhost:3000/";
const AXE = fs.readFileSync(
  "node_modules/axe-core/axe.min.js",
  "utf8",
);

const VIEWPORTS = [
  { w: 1440, h: 900, name: "1440" },
  { w: 375, h: 812, name: "375" },
];

const b = await chromium.launch();

for (const v of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });

  // 1. All 3 demo blocks render.
  const counts = {
    vocab: await p.locator(".pillar--vocab .pillar__demo").count(),
    grammar: await p.locator(".pillar--grammar .pillar__demo").count(),
    writing: await p.locator(".pillar--writing .pillar__demo").count(),
    oldThumbs: await p.locator(".pillar__thumb").count(),
  };
  console.log(`[${v.name}] demo counts:`, counts);
  if (counts.vocab !== 1 || counts.grammar !== 1 || counts.writing !== 1) {
    throw new Error(`[${v.name}] missing demo block`);
  }
  if (counts.oldThumbs !== 0) {
    throw new Error(`[${v.name}] old .pillar__thumb still present`);
  }

  // 2. Demos don't overflow their pillar cards.
  const overflow = await p.evaluate(() => {
    const out = [];
    for (const d of document.querySelectorAll(".pillar__demo")) {
      const dr = d.getBoundingClientRect();
      const card = d.closest(".pillar").getBoundingClientRect();
      if (dr.right > card.right + 0.5 || dr.bottom > card.bottom + 0.5) {
        out.push({ pillar: d.closest(".pillar").className, dr, card });
      }
    }
    return out;
  });
  if (overflow.length) {
    console.error(`[${v.name}] OVERFLOW:`, overflow);
    throw new Error(`[${v.name}] demo overflows card`);
  }
  console.log(`[${v.name}] no overflow`);

  // 3. Page scrolls all the way to footer.
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(300);
  const footerVisible = await p.locator(".landing-footer").isVisible();
  if (!footerVisible) throw new Error(`[${v.name}] footer NOT visible after scroll-to-bottom`);
  console.log(`[${v.name}] footer visible after scroll: ${footerVisible}`);

  // 4. axe-core sweep.
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(200);
  await p.evaluate(AXE);
  const result = await p.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return r.violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodeCount: nodes.length,
      sample: nodes[0]?.html?.slice(0, 200),
      allHtml: nodes.map(n => n.html.slice(0, 160)),
    }));
  });
  console.log(`[${v.name}] axe violations: ${result.length}`);
  if (result.length) console.log(JSON.stringify(result, null, 2));
  if (result.length) throw new Error(`[${v.name}] axe violations`);

  // 5. Screenshots — pillar section + full page.
  await p.evaluate(() => document.getElementById("tuote")?.scrollIntoView({ block: "start" }));
  await p.waitForTimeout(300);
  await p.screenshot({
    path: `scripts/agent-test/screenshots/loop48hotfix2-pillars-${v.name}.png`,
    fullPage: false,
  });
  await p.screenshot({
    path: `scripts/agent-test/screenshots/loop48hotfix2-fullpage-${v.name}.png`,
    fullPage: true,
  });

  await ctx.close();
}

await b.close();
console.log("\n✓ L48-hotfix-2 verify passed");
