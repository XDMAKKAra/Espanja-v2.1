// REMONTTI audit — user-path-based discovery (NO fixes here, only findings).
// Each test logs its findings as console.log lines prefixed with "AUDIT:"
// so the agent can post-process them into REMONTTI_AUDIT.md.
// All tests are tolerant (no assertion failures): the goal is inventory.

import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SHOT_DIR = "tests/screenshots/audit";
fs.mkdirSync(SHOT_DIR, { recursive: true });

const FINDINGS_FILE = path.join(SHOT_DIR, "_findings.jsonl");
try { fs.unlinkSync(FINDINGS_FILE); } catch {}

function logFinding(obj) {
  fs.appendFileSync(FINDINGS_FILE, JSON.stringify(obj) + "\n");
  console.log("AUDIT:", JSON.stringify(obj));
}

async function bypassGate(page) {
  await page.addInitScript(() => {
    try { window.localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
}

async function snap(page, name) {
  const project = test.info().project.name;
  const file = `${SHOT_DIR}/${name}-${project}.png`;
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

function attachConsole(page, sink) {
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      sink.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => sink.push({ type: "pageerror", text: err.message }));
  page.on("requestfailed", (req) => {
    sink.push({ type: "requestfailed", text: `${req.method()} ${req.url()} - ${req.failure()?.errorText || "?"}` });
  });
  page.on("response", (resp) => {
    const status = resp.status();
    if (status >= 400) sink.push({ type: "http", text: `${status} ${resp.url()}` });
  });
}

// ---------------------------------------------------------------------------
// Path F — landings (es/fr/de). Verifies countdown-vs-hero placement and
// captures mobile+desktop screenshots, measures scroll-to-hero distance.
// ---------------------------------------------------------------------------
const LANDINGS = [
  { lang: "es", path: "/public/landing/espanja.html" },
  { lang: "fr", path: "/public/landing/ranska.html" },
  { lang: "de", path: "/public/landing/saksa.html" },
];

for (const { lang, path: lpath } of LANDINGS) {
  test(`F: landing ${lang} — countdown vs hero, console`, async ({ page }) => {
    const sink = [];
    attachConsole(page, sink);
    await bypassGate(page);
    await page.goto(lpath);
    await page.waitForLoadState("networkidle").catch(() => {});

    const top = await snap(page, `F-${lang}-top`);

    // Measure where hero H1 sits and where countdown sits.
    const layout = await page.evaluate(() => {
      const $ = (sel) => document.querySelector(sel);
      const h1 = $(".hero h1") || $("h1");
      const countdown =
        $(".hero-countdown") ||
        $(".yo-countdown") ||
        $('[class*="countdown"]') ||
        $('[data-countdown]');
      const rect = (el) => (el ? el.getBoundingClientRect() : null);
      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        scrollY: window.scrollY,
        docHeight: document.documentElement.scrollHeight,
        h1: rect(h1) && { top: rect(h1).top + window.scrollY, text: h1.textContent.trim().slice(0, 80) },
        countdown: rect(countdown) && { top: rect(countdown).top + window.scrollY, text: countdown.textContent.trim().slice(0, 100), tag: countdown.tagName, className: countdown.className },
      };
    });

    // Scroll until hero h1 in viewport.
    let scrolled = null;
    if (layout.h1) {
      scrolled = Math.max(0, layout.h1.top - 80);
    }

    logFinding({
      path: "F",
      id: `F-${lang}-layout`,
      project: test.info().project.name,
      url: lpath,
      layout,
      heroScrollDistancePx: scrolled,
      countdownAboveHero:
        layout.countdown && layout.h1 ? layout.countdown.top < layout.h1.top : null,
      heroAboveFold:
        layout.h1 && layout.viewport ? layout.h1.top < layout.viewport.h : null,
      consoleIssues: sink.slice(0, 30),
      screenshots: { top },
    });

    // Click-all: scroll to bottom, capture again.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const bottom = await snap(page, `F-${lang}-bottom`);

    // Hero CTA presence
    const ctas = await page.evaluate(() => {
      const list = Array.from(document.querySelectorAll("a, button"));
      return list
        .filter((el) => /aloita|kokeile|rekister/i.test(el.textContent || ""))
        .slice(0, 10)
        .map((el) => ({
          text: el.textContent.trim().slice(0, 60),
          href: el.getAttribute("href") || null,
          tag: el.tagName,
        }));
    });
    logFinding({
      path: "F",
      id: `F-${lang}-ctas`,
      project: test.info().project.name,
      ctas,
      screenshots: { bottom },
    });
  });
}

// ---------------------------------------------------------------------------
// Path C — Pricing page
// ---------------------------------------------------------------------------
test("C: pricing layout + overflow", async ({ page }) => {
  const sink = [];
  attachConsole(page, sink);
  await bypassGate(page);
  await page.goto("/pricing.html");
  await page.waitForLoadState("networkidle").catch(() => {});
  const shot = await snap(page, "C-pricing");

  const info = await page.evaluate(() => {
    const tiers = Array.from(document.querySelectorAll('[class*="tier"], [class*="plan"], [class*="price-card"], .card'));
    const recommended = document.querySelector('[class*="recommended"], [class*="popular"], [class*="suosit"]');
    return {
      tierCount: tiers.length,
      tierHeights: tiers.slice(0, 6).map((t) => Math.round(t.getBoundingClientRect().height)),
      hasRecommendedBadge: !!recommended,
      docHasOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  logFinding({
    path: "C",
    id: "C-pricing",
    project: test.info().project.name,
    info,
    consoleIssues: sink.slice(0, 30),
    screenshots: { shot },
  });
});

// ---------------------------------------------------------------------------
// Path G — Public SPA routes: load each, check console, screenshot, scan
// for forbidden-pattern text artifacts.
// ---------------------------------------------------------------------------
const PUBLIC_HASHES = [
  "#kotinakyma",
  "#oppimispolku",
  "#asetukset",
  "#tilastot",
  "#vocab",
  "#kielioppi",
  "#luetunymmarrys",
  "#kirjoittaminen",
  "#tulokset",
  "#rekisteroidy",
];

for (const hash of PUBLIC_HASHES) {
  test(`G: public app route ${hash}`, async ({ page }) => {
    const sink = [];
    attachConsole(page, sink);
    await bypassGate(page);
    await page.goto(`/app.html${hash}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(400);

    const shot = await snap(page, `G${hash.replace(/[^a-z]/gi, "")}`);

    // Forbidden pattern scan
    const body = await page.evaluate(() => document.body.innerText || "");
    const matches = body.match(/\[object Object\]|\bundefined\b|NaN%|NaN\/\d+/g) || [];

    // Sticky / fixed elements that may cover content
    const overlays = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("header, nav, aside, .top-bar, .topbar, [class*='topbar'], [class*='sticky'], [class*='fixed']"));
      return all.slice(0, 10).map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          className: el.className.toString().slice(0, 80),
          position: cs.position,
          top: Math.round(r.top),
          height: Math.round(r.height),
          z: cs.zIndex,
          visible: cs.display !== "none" && cs.visibility !== "hidden",
        };
      });
    });

    logFinding({
      path: "G",
      id: `G-${hash.replace(/[^a-z]/gi, "")}`,
      project: test.info().project.name,
      hash,
      forbiddenMatches: matches.slice(0, 10),
      stickyOverlays: overlays,
      consoleIssues: sink.slice(0, 30),
      screenshots: { shot },
    });
  });
}

// ---------------------------------------------------------------------------
// Path B — Vocab card masking. Scroll the exercise-card on mobile and
// desktop, take screenshots at three positions, and read whether any sticky
// element overlaps the card.
// ---------------------------------------------------------------------------
const EXERCISE_HASHES = ["#vocab", "#kielioppi", "#luetunymmarrys", "#kirjoittaminen"];
for (const hash of EXERCISE_HASHES) {
  test(`B: exercise card scroll ${hash}`, async ({ page }) => {
    const sink = [];
    attachConsole(page, sink);
    await bypassGate(page);
    await page.goto(`/app.html${hash}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(600);

    const baseName = `B${hash.replace(/[^a-z]/gi, "")}`;
    const a = await snap(page, `${baseName}-top`);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(200);
    const b = await snap(page, `${baseName}-mid`);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const c = await snap(page, `${baseName}-bot`);

    const overlap = await page.evaluate(() => {
      const card =
        document.querySelector(".exercise-card") ||
        document.querySelector("[class*='exercise']") ||
        document.querySelector("main");
      const sticky = Array.from(document.querySelectorAll("*")).filter((el) => {
        const cs = getComputedStyle(el);
        return cs.position === "fixed" || cs.position === "sticky";
      });
      const cardRect = card ? card.getBoundingClientRect() : null;
      return {
        card: cardRect && { top: cardRect.top, height: cardRect.height },
        stickies: sticky.slice(0, 6).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            className: el.className.toString().slice(0, 60),
            top: r.top,
            bottom: r.bottom,
            overlapsCard: cardRect ? r.bottom > cardRect.top && r.top < cardRect.bottom : null,
          };
        }),
      };
    });

    logFinding({
      path: "B",
      id: `B-${hash.replace(/[^a-z]/gi, "")}`,
      project: test.info().project.name,
      hash,
      overlap,
      consoleIssues: sink.slice(0, 30),
      screenshots: { top: a, mid: b, bot: c },
    });
  });
}

// ---------------------------------------------------------------------------
// Path A — Onboarding + level test routing (no real signup; explore screens)
// ---------------------------------------------------------------------------
test("A: onboarding entry + level-test discovery", async ({ page }) => {
  const sink = [];
  attachConsole(page, sink);
  await bypassGate(page);
  await page.goto(`/app.html`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
  const a = await snap(page, "A-app-entry");

  // Try to reach onboardingV3 directly via hash if exposed.
  for (const h of ["#onboarding", "#tasotesti", "#placement", "#rekisteroidy"]) {
    await page.goto(`/app.html${h}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(300);
    const s = await snap(page, `A-${h.replace(/[^a-z]/gi, "")}`);
    const visible = await page.evaluate(() => {
      const txt = document.body.innerText || "";
      return {
        hasPlacementHints: /tasotesti|suosittel|kurssi/i.test(txt),
        snippet: txt.slice(0, 400),
      };
    });
    logFinding({
      path: "A",
      id: `A-${h.replace(/[^a-z]/gi, "")}`,
      project: test.info().project.name,
      hash: h,
      visible,
      screenshots: { s },
    });
  }
  logFinding({
    path: "A",
    id: "A-entry-console",
    project: test.info().project.name,
    consoleIssues: sink.slice(0, 30),
    screenshots: { a },
  });
});

// ---------------------------------------------------------------------------
// Path D — Re-routing: back/forward, deep-link, logout-login landing
// ---------------------------------------------------------------------------
test("D: back/forward + deep links", async ({ page }) => {
  const sink = [];
  attachConsole(page, sink);
  await bypassGate(page);
  await page.goto("/app.html#kotinakyma");
  await page.waitForLoadState("networkidle").catch(() => {});
  const visited = [];
  for (const h of ["#oppimispolku", "#vocab", "#asetukset", "#tilastot"]) {
    await page.goto(`/app.html${h}`);
    await page.waitForTimeout(250);
    visited.push({ to: h, currentHash: await page.evaluate(() => location.hash) });
  }
  // Back button cycle
  const backTrail = [];
  for (let i = 0; i < 4; i++) {
    await page.goBack().catch(() => {});
    await page.waitForTimeout(200);
    backTrail.push(await page.evaluate(() => location.hash));
  }
  // Deep link cold (new context not available here, so just goto fresh)
  await page.goto("/app.html#vocab");
  await page.waitForTimeout(400);
  const deepLinkLanded = await page.evaluate(() => location.hash);

  logFinding({
    path: "D",
    id: "D-routing",
    project: test.info().project.name,
    visited,
    backTrail,
    deepLinkLanded,
    consoleIssues: sink.slice(0, 30),
  });
});

// ---------------------------------------------------------------------------
// Authenticated walk-through. Requires PW_LOGIN_EMAIL / PW_LOGIN_PASSWORD.
// ---------------------------------------------------------------------------
const LOGIN_EMAIL = process.env.PW_LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.PW_LOGIN_PASSWORD;

// NOTE: LIVE pass keeps hanging during login (page navigation never settles
// for unknown reasons — even with domcontentloaded + click on the visible
// submit button, the test times out and the browser context closes). Left
// here as a hook for a follow-up audit pass; deliberately .skip()-ed so the
// unauthed inventory below remains useful.
test.skip("LIVE: authed walk-through (BROKEN — login hang)", async ({ page }) => {
  test.skip(!LOGIN_EMAIL || !LOGIN_PASSWORD, "no auth creds");
  test.setTimeout(180_000);
  const sink = [];
  attachConsole(page, sink);
  await bypassGate(page);
  await page.goto("/app.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.locator('input[type="email"]').first().fill(LOGIN_EMAIL).catch(() => {});
  await page.locator('input[type="password"]').first().fill(LOGIN_PASSWORD).catch(() => {});
  await page.locator('button:has-text("Kirjaudu sisään")').first().click().catch(() => {});
  await page.waitForTimeout(4000);
  const afterLogin = await snap(page, "LIVE-after-login");
  logFinding({ path: "LIVE", id: "LIVE-login", project: test.info().project.name, landedUrl: page.url(), consoleIssues: sink.slice(0, 30), screenshots: { afterLogin } });

  for (const hash of ["#kotinakyma", "#oppimispolku", "#vocab", "#kielioppi", "#luetunymmarrys", "#kirjoittaminen", "#asetukset", "#tilastot"]) {
    await page.goto(`/app.html${hash}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const shot = await snap(page, `LIVE${hash.replace(/[^a-z]/gi, "")}`);
    const overlap = await page.evaluate(() => {
      const card =
        document.querySelector(".exercise-card") ||
        document.querySelector("[class*='exercise-card']") ||
        document.querySelector("main");
      const sticky = Array.from(document.querySelectorAll("*")).filter((el) => {
        const cs = getComputedStyle(el);
        return (cs.position === "fixed" || cs.position === "sticky") && cs.display !== "none" && cs.visibility !== "hidden";
      });
      const cardRect = card ? card.getBoundingClientRect() : null;
      const body = document.body.innerText || "";
      return {
        card: cardRect && { top: Math.round(cardRect.top), height: Math.round(cardRect.height) },
        stickies: sticky.slice(0, 8).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            className: el.className.toString().slice(0, 60),
            top: Math.round(r.top),
            height: Math.round(r.height),
            overlapsCard: cardRect ? r.bottom > cardRect.top && r.top < cardRect.bottom : null,
          };
        }),
        forbidden: (body.match(/\[object Object\]|\bundefined\b|NaN%|NaN\/\d+/g) || []).slice(0, 5),
        snippet: body.slice(0, 240),
      };
    });
    logFinding({ path: "LIVE", id: `LIVE-${hash.replace(/[^a-z]/gi, "")}`, project: test.info().project.name, hash, overlap, consoleIssues: sink.slice(-12), screenshots: { shot } });
  }
});

// ---------------------------------------------------------------------------
// Path E — Settings: visible tiers, paywall CTA targets
// ---------------------------------------------------------------------------
test("E: settings + paywall CTA", async ({ page }) => {
  const sink = [];
  attachConsole(page, sink);
  await bypassGate(page);
  await page.goto("/app.html#asetukset");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
  const shot = await snap(page, "E-settings");

  const data = await page.evaluate(() => {
    const txt = document.body.innerText || "";
    const ctas = Array.from(document.querySelectorAll("a, button"))
      .filter((el) => /pro|päivit|tilaa|portal|stripe|hallinno/i.test(el.textContent || ""))
      .slice(0, 10)
      .map((el) => ({
        text: el.textContent.trim().slice(0, 80),
        href: el.getAttribute("href") || null,
        tag: el.tagName,
      }));
    return {
      hasUpgradeText: /pro|päivit|tilaa/i.test(txt),
      hasCustomerPortal: /portal|hallinno/i.test(txt),
      ctas,
    };
  });
  logFinding({
    path: "E",
    id: "E-settings",
    project: test.info().project.name,
    data,
    consoleIssues: sink.slice(0, 30),
    screenshots: { shot },
  });
});
