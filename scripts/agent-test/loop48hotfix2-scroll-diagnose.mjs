// Diagnose landing-page scroll lock on localhost.
import { chromium } from "playwright";

const URL = "http://localhost:3000/";

const b = await chromium.launch();
// Run twice — once with SW blocked (clean slate), once with SW allowed (user-real).
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

await p.goto(URL, { waitUntil: "networkidle" });

// 1. Inspect computed overflow / position-fixed offenders on every element.
const offenders = await p.evaluate(() => {
  const out = [];
  const all = document.querySelectorAll("*");
  for (const el of all) {
    const cs = getComputedStyle(el);
    const flag = [];
    if (cs.overflow === "hidden" && (el === document.documentElement || el === document.body)) flag.push("overflow:hidden");
    if (cs.position === "fixed" && parseFloat(cs.zIndex) >= 1) {
      const r = el.getBoundingClientRect();
      if (r.width >= window.innerWidth * 0.5 && r.height >= window.innerHeight * 0.5) {
        flag.push(`position:fixed-large(${Math.round(r.width)}x${Math.round(r.height)})`);
      }
    }
    if (cs.height && cs.height.endsWith("vh") && parseFloat(cs.height) >= 100) flag.push(`height:${cs.height}`);
    if (flag.length) {
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        cls: (el.className && typeof el.className === "string") ? el.className.slice(0, 80) : null,
        flag,
      });
    }
  }
  return out;
});
console.log("\n=== potential scroll blockers ===");
console.log(JSON.stringify(offenders, null, 2));

// 2. Page scroll height vs viewport.
const dims = await p.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  clientHeight: document.documentElement.clientHeight,
  bodyOverflow: getComputedStyle(document.body).overflow,
  htmlOverflow: getComputedStyle(document.documentElement).overflow,
}));
console.log("\n=== page dims ===");
console.log(JSON.stringify(dims, null, 2));

// 3. Try to wheel-scroll past the steps section.
await p.evaluate(() => {
  const steps = document.getElementById("miten");
  if (steps) steps.scrollIntoView({ block: "end" });
});
await p.waitForTimeout(300);
const yAtSteps = await p.evaluate(() => window.scrollY);
console.log(`\n=== scrollY at end of #miten === ${yAtSteps}`);

// Now wheel-scroll 2000 px further.
for (let i = 0; i < 10; i++) {
  await p.mouse.wheel(0, 200);
  await p.waitForTimeout(50);
}
const yAfterWheel = await p.evaluate(() => window.scrollY);
console.log(`=== scrollY after wheel(0, 2000) === ${yAfterWheel}`);

await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await p.waitForTimeout(300);
const finalScroll = await p.evaluate(() => window.scrollY);
console.log(`=== scrollY after scrollTo(bottom) === ${finalScroll}`);

const footerVisible = await p.locator(".landing-footer").isVisible();
console.log(`footer visible: ${footerVisible}`);

// 4. Linked stylesheets actually present on the page.
const sheets = await p.evaluate(() =>
  Array.from(document.styleSheets).map((s) => s.href).filter(Boolean)
);
console.log("\n=== loaded stylesheets ===");
console.log(JSON.stringify(sheets, null, 2));

await p.screenshot({ path: "scripts/agent-test/screenshots/loop48hotfix2-diag-fullpage.png", fullPage: true });

await b.close();
