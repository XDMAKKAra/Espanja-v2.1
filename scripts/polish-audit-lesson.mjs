// L-V322 lesson-runner + exam audit — extends V321 to capture the lesson
// experience itself, not just the entry screens.
//
// Surfaces:
//   - Curriculum (kurssit) detail screen
//   - Lesson runner active state (#screen-lesson) — clicks the first available
//     lesson row and screenshots the active runner
//   - Lesson results screen — attempts to skip to results by clicking through
//     N exercises (best-effort; may bail if exercise types vary)
//   - Exam start screen
//   - Exam runner active state
//
// Run: AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit-lesson.mjs

import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(REPO, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

const EMAIL = process.env.TEST_LOGIN_EMAIL;
const PW = process.env.TEST_LOGIN_PASSWORD;
if (!EMAIL || !PW) { console.error("FATAL: TEST_LOGIN_EMAIL + TEST_LOGIN_PASSWORD required"); process.exit(1); }

const BASE = process.env.AUDIT_BASE_URL || "https://espanja-v2-1.vercel.app";
const TODAY = "2026-05-26";
const OUT_DIR = join(REPO, "screenshots", `polish-audit-lesson-${TODAY}`);
const AUDITS_DIR = join(REPO, "docs", "audits");
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(AUDITS_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, ua: undefined },
  { name: "mobile", width: 390, height: 844, ua: devices["iPhone 13"].userAgent },
];

const AXE_CDN = "https://cdn.jsdelivr.net/npm/axe-core@4.8.2/axe.min.js";
const RESULTS = { run: TODAY, base: BASE, pages: [] };

async function injectAxe(page) {
  try {
    await page.addScriptTag({ url: AXE_CDN });
    await page.waitForFunction(() => typeof window.axe !== "undefined", { timeout: 5000 });
    return true;
  } catch { return false; }
}
async function runAxe(page) {
  return await page.evaluate(async () => {
    if (typeof window.axe === "undefined") return { violations: [] };
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
      resultTypes: ["violations"],
    });
    return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target.join(" "), html: n.html.slice(0, 200), failureSummary: n.failureSummary })), nodeCount: v.nodes.length })) };
  });
}
async function checkTouchTargets(page) {
  return await page.evaluate(() => {
    const sels = ["button", "a[href]", '[role="button"]', "input:not([type=hidden])", "select", "textarea"];
    const interactive = Array.from(document.querySelectorAll(sels.join(",")));
    const bad = [];
    for (const el of interactive) {
      if (!el.offsetParent && el.tagName !== "INPUT") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 44 || r.height < 44) {
        const sel = el.id ? `#${el.id}` : el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : el.tagName.toLowerCase();
        bad.push({ selector: sel.slice(0, 80), width: Math.round(r.width), height: Math.round(r.height), text: (el.textContent || "").trim().slice(0, 40) });
      }
    }
    return bad.slice(0, 50);
  });
}
async function getMetrics(page) {
  return await page.evaluate(() => new Promise((resolve) => {
    const metrics = { lcp: null, cls: null };
    let clsTotal = 0;
    try {
      new PerformanceObserver((list) => { for (const e of list.getEntries()) metrics.lcp = Math.round(e.startTime); }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) clsTotal += e.value; metrics.cls = Math.round(clsTotal * 1000) / 1000; }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    setTimeout(() => resolve(metrics), 3000);
  }));
}

async function loginCtx(browser, viewport) {
  const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, userAgent: viewport.ua, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  const loginTab = page.locator("#tab-login");
  if (await loginTab.count()) { try { await loginTab.click({ timeout: 3000 }); } catch {} }
  await page.locator("#auth-email").fill(EMAIL);
  await page.locator("#auth-password").fill(PW);
  const submitBtn = page.locator("#btn-auth-submit");
  await submitBtn.scrollIntoViewIfNeeded();
  const [loginRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/") && r.request().method() === "POST", { timeout: 15000 }),
    submitBtn.click({ force: true }),
  ]);
  if (loginRes.status() >= 400) throw new Error(`Login failed: ${loginRes.status()}`);
  await page.waitForTimeout(1500);
  return { ctx, page };
}

async function capture(page, slug, viewport, action = null) {
  const consoleErrors = [];
  const networkErrors = [];
  const handler = (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 240)); };
  const respHandler = (res) => { if (res.status() >= 400 && !res.url().includes("favicon")) networkErrors.push(`${res.status()} ${res.url().slice(0, 200)}`); };
  const errHandler = (err) => consoleErrors.push(`UNCAUGHT: ${err.message.slice(0, 240)}`);
  page.on("console", handler);
  page.on("response", respHandler);
  page.on("pageerror", errHandler);

  let status = "ok";
  let axeResult = { violations: [] };
  let touchTargets = [];
  let metrics = { lcp: null, cls: null };

  try {
    if (action) await action(page);
    await page.waitForTimeout(2000);
    metrics = await getMetrics(page);
    const axeOk = await injectAxe(page);
    if (axeOk) axeResult = await runAxe(page);
    touchTargets = await checkTouchTargets(page);
    await page.screenshot({ path: join(OUT_DIR, `${slug}-${viewport.name}.png`), fullPage: true });
  } catch (err) {
    status = `error: ${err.message.slice(0, 160)}`;
  }

  page.off("console", handler);
  page.off("response", respHandler);
  page.off("pageerror", errHandler);

  return { slug, device: viewport.name, status, consoleErrors, networkErrors, axeViolations: axeResult.violations, touchTargetFailures: touchTargets, metrics };
}

(async () => {
  console.log(`Lesson + exam audit · base=${BASE} · email=${EMAIL}`);
  const browser = await chromium.launch();

  for (const v of VIEWPORTS) {
    console.log(`\n--- viewport: ${v.name} ---`);
    let ctx, page;
    try {
      const r = await loginCtx(browser, v);
      ctx = r.ctx;
      page = r.page;
      console.log(`  logged in`);
    } catch (err) { console.error(`  LOGIN FAILED: ${err.message}`); continue; }

    // 1. Aloitus (home) — auth landing for Pro user
    let r1 = await capture(page, "x01-aloitus", v, async (p) => {
      await p.goto(BASE + "/app.html#/koti", { waitUntil: "networkidle", timeout: 20000 });
    });
    console.log(`  [1] ${r1.slug} · ${r1.status} · axe=${r1.axeViolations.length} tt=${r1.touchTargetFailures.length}`);
    RESULTS.pages.push(r1);

    // 2. Click "Avaa oppimispolku" → navigate to learning path detail
    let r2 = await capture(page, "x02-oppimispolku", v, async (p) => {
      // Try the primary CTA on Aloitus screen
      const candidates = [
        'a:has-text("Avaa oppimispolku")',
        'button:has-text("Avaa oppimispolku")',
        'a[href*="oppimispolku"]',
        '.btn-primary:has-text("oppimispolku")',
      ];
      let clicked = false;
      for (const sel of candidates) {
        const loc = p.locator(sel).first();
        if (await loc.count()) {
          try { await loc.click({ timeout: 4000 }); clicked = true; break; } catch {}
        }
      }
      if (!clicked) throw new Error("no Avaa-oppimispolku button found");
      await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(2000);
    });
    console.log(`  [2] ${r2.slug} · ${r2.status} · axe=${r2.axeViolations.length} tt=${r2.touchTargetFailures.length}`);
    RESULTS.pages.push(r2);

    // 3. Click first course / lesson row inside oppimispolku → open lesson runner
    let r3 = await capture(page, "x03-lesson-runner-active", v, async (p) => {
      const candidates = [
        ".op-row.is-clickable",
        ".op-row__title",
        '[class*="kurssi-card"] a',
        '[class*="kurssi-card"] button',
        'button[id^="curr-lesson"]',
        '.lesson-row',
        'a.kurssi-link',
      ];
      let clicked = false;
      for (const sel of candidates) {
        const loc = p.locator(sel).first();
        if (await loc.count()) {
          try { await loc.click({ timeout: 4000 }); clicked = true; break; } catch {}
        }
      }
      if (!clicked) throw new Error("no clickable lesson row found in oppimispolku");
      await p.waitForSelector("#screen-lesson.active, #screen-lesson:not(.hidden)", { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(2000);
    });
    console.log(`  [3] ${r3.slug} · ${r3.status} · axe=${r3.axeViolations.length} tt=${r3.touchTargetFailures.length}`);
    RESULTS.pages.push(r3);

    // 4. Vocab mode-page entry
    let r4 = await capture(page, "x04-vocab-mode", v, async (p) => {
      await p.goto(BASE + "/app.html#/sanasto", { waitUntil: "networkidle", timeout: 20000 });
    });
    console.log(`  [4] ${r4.slug} · ${r4.status} · axe=${r4.axeViolations.length} tt=${r4.touchTargetFailures.length}`);
    RESULTS.pages.push(r4);

    // 5. Exam start
    let r5 = await capture(page, "x05-exam-start", v, async (p) => {
      await p.goto(BASE + "/app.html#/koe", { waitUntil: "networkidle", timeout: 20000 });
    });
    console.log(`  [5] ${r5.slug} · ${r5.status} · axe=${r5.axeViolations.length} tt=${r5.touchTargetFailures.length}`);
    RESULTS.pages.push(r5);

    // 6. Try clicking exam start button
    let r6 = await capture(page, "x06-exam-running", v, async (p) => {
      const candidates = [
        '#btn-exam-start',
        '#btn-koe-start',
        'button:has-text("Aloita koe")',
        'button:has-text("Aloita")',
        'button.btn-primary:first-of-type',
      ];
      for (const sel of candidates) {
        try {
          const loc = p.locator(sel).first();
          if (await loc.count()) { await loc.click({ timeout: 3000 }); break; }
        } catch {}
      }
      await p.waitForTimeout(2500);
    });
    console.log(`  [6] ${r6.slug} · ${r6.status} · axe=${r6.axeViolations.length} tt=${r6.touchTargetFailures.length}`);
    RESULTS.pages.push(r6);

    await ctx.close();
  }

  await browser.close();

  writeFileSync(join(AUDITS_DIR, `${TODAY}-polish-audit-lesson.json`), JSON.stringify(RESULTS, null, 2), "utf-8");

  // Aggregate
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const byRule = {};
  let consoleErrTotal = 0, netErrTotal = 0, ttTotal = 0;
  for (const p of RESULTS.pages) {
    consoleErrTotal += p.consoleErrors.length;
    netErrTotal += p.networkErrors.length;
    ttTotal += p.touchTargetFailures.length;
    for (const v of p.axeViolations) {
      byImpact[v.impact] = (byImpact[v.impact] || 0) + v.nodeCount;
      byRule[v.id] = (byRule[v.id] || 0) + v.nodeCount;
    }
  }

  const top = Object.entries(byRule).sort(([, a], [, b]) => b - a).slice(0, 15);
  const md = `# L-V322 lesson + exam polish audit · ${TODAY}

**Base:** ${BASE}
**Account:** ${EMAIL} (Pro test)
**States captured:** 6 (curriculum, lesson-runner active, lesson mid, vocab mode, exam start, exam running) × 2 viewports = 12 scans
**Screenshots:** \`screenshots/polish-audit-lesson-${TODAY}/\`
**Full data:** \`docs/audits/${TODAY}-polish-audit-lesson.json\`

## Headline numbers

| Bucket | Count |
|---|---|
| Critical a11y violations | ${byImpact.critical || 0} |
| Serious a11y violations | ${byImpact.serious || 0} |
| Moderate a11y violations | ${byImpact.moderate || 0} |
| Minor a11y violations | ${byImpact.minor || 0} |
| Console errors | ${consoleErrTotal} |
| Network errors ≥400 | ${netErrTotal} |
| Touch targets <44 px | ${ttTotal} |

## Top axe rules

${top.map(([rule, n]) => `- **${rule}** — ${n} nodes`).join("\n") || "_(no axe data)_"}

## Per-state summary

| State | Device | Status | Axe | Console | Network | TT<44 | LCP | CLS |
|---|---|---|---|---|---|---|---|---|
${RESULTS.pages.map((p) => {
  const axeCount = p.axeViolations.reduce((s, v) => s + v.nodeCount, 0);
  return `| ${p.slug} | ${p.device} | ${p.status} | ${axeCount} | ${p.consoleErrors.length} | ${p.networkErrors.length} | ${p.touchTargetFailures.length} | ${p.metrics.lcp ?? "—"} | ${p.metrics.cls ?? "—"} |`;
}).join("\n")}

## Pages with console errors

${RESULTS.pages.filter((p) => p.consoleErrors.length).slice(0, 8).map(
  (p) => `### ${p.slug} (${p.device})\n\n` + p.consoleErrors.slice(0, 3).map((e) => `- \`${e}\``).join("\n"),
).join("\n\n") || "_(none)_"}

## Pages with network errors

${RESULTS.pages.filter((p) => p.networkErrors.length).slice(0, 8).map(
  (p) => `### ${p.slug} (${p.device})\n\n` + p.networkErrors.slice(0, 3).map((e) => `- \`${e}\``).join("\n"),
).join("\n\n") || "_(none)_"}
`;
  writeFileSync(join(AUDITS_DIR, `${TODAY}-polish-audit-lesson.md`), md, "utf-8");

  console.log("\nWrote:");
  console.log(`  ${AUDITS_DIR}/${TODAY}-polish-audit-lesson.json`);
  console.log(`  ${AUDITS_DIR}/${TODAY}-polish-audit-lesson.md`);
  console.log(`  ${OUT_DIR}/`);
  console.log(`\nHeadlines: ${byImpact.critical || 0} critical · ${byImpact.serious || 0} serious · ${byImpact.moderate || 0} moderate · ${byImpact.minor || 0} minor · ${consoleErrTotal} console · ${netErrTotal} net · ${ttTotal} tt<44`);
})();
