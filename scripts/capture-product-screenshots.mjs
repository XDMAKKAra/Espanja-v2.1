#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V333 — Capture product screenshots for the landing hero phone mockups.
 *
 * Run with:
 *   node scripts/capture-product-screenshots.mjs
 *
 * Requires:
 *   - Dev server running on http://localhost:3000 (`npm run dev`)
 *   - .env: TEST_LOGIN_EMAIL + TEST_LOGIN_PASSWORD (testpro123@gmail.com / Testpro123)
 *   - Playwright + chromium installed (devDependency, already present)
 *
 * Output:
 *   - img/product/lesson-writing.png  (~420x900, mobile-frame ready)
 *   - img/product/lesson-grade.png    (~420x900)
 *
 * Strategy: intercept /api/writing-task and /api/grade-writing so we get
 * deterministic content + no OpenAI cost. Capture #screen-writing mid-typing,
 * then capture #screen-writing-feedback after submit.
 */
import "dotenv/config";
import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_LOGIN_EMAIL || "testpro123@gmail.com";
const PASS  = process.env.TEST_LOGIN_PASSWORD || "Testpro123";

const OUT_DIR = resolve(process.cwd(), "img/product");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Mocked writing-task: realistic short YO-task in Spanish.
const MOCK_TASK = {
  task: {
    taskType: "short",
    points: 33,
    charMin: 160,
    charMax: 240,
    situation: "Kirjoitat ystävällesi sähköpostin syntymäpäiväkutsusta espanjaksi.",
    prompt: "Kutsu ystäväsi Marta syntymäpäiväjuhliin lauantaina. Kerro juhlapaikka, aika, ja pyydä häntä tuomaan veljensä.",
    requirements: [
      "Sopiva tervehdys ja lopetus",
      "Mainitse juhlapaikka ja aika",
      "Pyydä Martaa tuomaan veljensä",
      "160–240 merkkiä",
    ],
  },
};

// Mocked grade response: 27/33 (YTL grade C), 3 errors with annotations.
const STUDENT_TEXT = "Hola Marta,\n\n¡Te escribo para invitarte a mi cumpleaños el sábado que viene! La fiesta empieza a las siete en mi casa. Mi madre va a cocinar mucha comida y tendrémos también música. Espero que vienes con tu hermano.";

// Shape matches js/state.js CRITERIA_LABELS keys + js/screens/writing.js
// renderWritingFeedback contract (originalText, errors[].excerpt/corrected,
// per-criterion {score, feedback_fi}).
const MOCK_GRADE = {
  result: {
    finalScore: 27,
    maxScore: 33,
    ytlGrade: "C",
    originalText: STUDENT_TEXT,
    viestinnallisyys: { score: 4, feedback_fi: "Tervehdys, kutsu, paikka ja aika sekä veljen pyyntö välittyvät." },
    kielen_rakenteet: { score: 3, feedback_fi: "Useimmat verbimuodot kohdallaan; subjunktiivi 'Espero que' jälkeen jäi vajaaksi." },
    sanasto:          { score: 4, feedback_fi: "Kutsutilaiseen sopiva sanasto. 'tendrémos' aksenttivirhe." },
    kokonaisuus:      { score: 4, feedback_fi: "Selkeä rakenne, lopetus puuttuu." },
    errors: [
      { excerpt: "tendrémos",        corrected: "tendremos",        category: "spelling", explanation_fi: "Painollinen tavu on toiseksi viimeinen, joten 'tendremos' kirjoitetaan ilman aksenttia." },
      { excerpt: "Espero que vienes", corrected: "Espero que vengas", category: "grammar",  explanation_fi: "Subjunktiivi pakollinen 'esperar que' jälkeen: venir → vengas." },
    ],
    annotations: [
      { excerpt: "tendrémos",        category: "spelling", corrected: "tendremos",        explanation_fi: "Painollinen tavu on toiseksi viimeinen — ei aksenttia." },
      { excerpt: "Espero que vienes", category: "grammar",  corrected: "Espero que vengas", explanation_fi: "Subjunktiivi 'esperar que' jälkeen." },
    ],
    penalty: 0,
  },
};

async function bypassGate(page) {
  await page.addInitScript(() => {
    try { window.localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
}

async function mockApi(page) {
  await page.route("**/api/writing-task**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_TASK),
    });
  });
  await page.route("**/api/writing/task**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_TASK),
    });
  });
  await page.route("**/api/grade-writing**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_GRADE),
    });
  });
  await page.route("**/api/writing/grade**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_GRADE),
    });
  });
}

async function login(page) {
  await page.goto(`${BASE}/app.html`);
  await page.waitForLoadState("domcontentloaded");
  // Open login tab.
  const loginTab = page.locator("#tab-login");
  if (await loginTab.count()) await loginTab.click().catch(() => {});
  await page.locator("#auth-email").fill(EMAIL);
  await page.locator("#auth-password").fill(PASS);
  await Promise.all([
    page.waitForResponse(r => /\/api\/(login|auth\/login)/.test(r.url()) && r.status() < 500, { timeout: 15000 }).catch(() => null),
    page.locator("#btn-auth-submit").click(),
  ]);
  await page.waitForTimeout(800);
}

async function captureWriting(page) {
  // SPA hash for writing mode-page: #/kirjoitus?lang=es (cf. js/app-prepaint.js
  // "kirjoitus" → "screen-mode-writing"). The legacy #kirjoittaminen hash
  // routes to the dashboard.
  await page.goto(`${BASE}/app.html#/kirjoitus?lang=es`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);
  // Click "Aloita kirjoitustehtävä" (id=btn-start-writing).
  const startBtn = page.locator("#btn-start-writing");
  await startBtn.waitFor({ state: "visible", timeout: 10000 });
  await startBtn.click();
  // Wait for the writing screen / textarea.
  await page.locator("#writing-input").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(500);
  // Pre-fill with partial Spanish text (mid-writing).
  await page.locator("#writing-input").fill("Hola Marta,\n\n¡Te escribo para invitarte a mi cumpleaños el sábado que viene! La fiesta empieza a las siete en mi casa. Mi madre va a cocinar mucha comida y tendrémos también música.");
  await page.waitForTimeout(400);
  // Screenshot the writing screen.
  const screen = page.locator("#screen-writing");
  const target = (await screen.count()) ? screen : page.locator("body");
  await target.screenshot({ path: resolve(OUT_DIR, "lesson-writing.png") });
  console.log("captured: img/product/lesson-writing.png");
}

async function captureGrade(page, mockGrade) {
  // Listen for console errors so we can see what's breaking.
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[console.error]", msg.text());
  });
  // Bypass the flaky submit→fetch→render dance: directly populate the
  // feedback DOM with our deterministic mock and show the screen.
  await page.evaluate((result) => {
    const $ = (id) => document.getElementById(id);
    const CRITERIA_LABELS = {
      viestinnallisyys: "Viestinnällisyys",
      kielen_rakenteet:  "Kielen rakenteet",
      sanasto:           "Sanasto",
      kokonaisuus:       "Kokonaisuus",
    };
    const CATEGORY_LABELS = {
      grammar: "Kielioppi",
      vocabulary: "Sanasto",
      spelling: "Oikeinkirjoitus",
      register: "Rekisteri",
    };
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

    if ($("feedback-score-num"))   $("feedback-score-num").textContent = result.finalScore;
    if ($("feedback-score-denom")) $("feedback-score-denom").textContent = `/ ${result.maxScore}`;
    const gradeBadge = $("feedback-grade-badge");
    if (gradeBadge) {
      gradeBadge.textContent = result.ytlGrade;
      gradeBadge.className = "feedback-grade-badge grade-" + result.ytlGrade;
    }

    // Inline annotated text: simple span-wrap matching errors[].excerpt.
    const annContainer = $("feedback-annotated-text");
    if (annContainer) {
      let html = escapeHtml(result.originalText || "");
      for (const e of result.errors || []) {
        const exc = escapeHtml(e.excerpt);
        html = html.replace(exc, `<span class="annotation-span annotation-error" data-annotation="${escapeHtml(e.excerpt)}" tabindex="0">${exc}</span>`);
      }
      annContainer.innerHTML = html;
    }

    // Criteria with score bars.
    const critEl = $("feedback-criteria");
    if (critEl) {
      critEl.innerHTML = "";
      for (const [key, label] of Object.entries(CRITERIA_LABELS)) {
        const c = result[key];
        if (!c) continue;
        const pct = Math.round((c.score / 5) * 100);
        const barColor = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--accent)" : "var(--error)";
        const block = document.createElement("div");
        block.className = "criteria-block";
        block.innerHTML = `
          <div class="criteria-header">
            <span class="criteria-label">${label}</span>
            <span class="criteria-score">${c.score} / 5</span>
          </div>
          <div class="criteria-bar"><div class="criteria-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
          <p class="criteria-comment">${escapeHtml(c.feedback_fi || "")}</p>
        `;
        critEl.appendChild(block);
      }
    }

    // Errors summary.
    const errsEl = $("feedback-errors");
    const errsSec = $("feedback-errors-section");
    if (errsEl && errsSec) {
      errsEl.innerHTML = "";
      if (result.errors?.length) {
        errsSec.classList.remove("hidden");
        for (const err of result.errors) {
          const catLabel = CATEGORY_LABELS[err.category] || err.category || "";
          const el = document.createElement("div");
          el.className = "error-item";
          el.innerHTML = `
            <div class="error-diff">
              <span class="error-cat-tag">${escapeHtml(catLabel)}</span>
              <div class="error-comparison">
                <span class="error-wrong"><del>${escapeHtml(err.excerpt || "")}</del></span>
                <span class="error-arrow">→</span>
                <span class="error-correct"><ins>${escapeHtml(err.corrected || "")}</ins></span>
              </div>
            </div>
            <p class="error-explanation">${escapeHtml(err.explanation_fi || "")}</p>
          `;
          errsEl.appendChild(el);
        }
      }
    }

    // Swap screens.
    document.querySelectorAll(".screen.active").forEach(el => el.classList.remove("active"));
    const fb = $("screen-writing-feedback");
    if (fb) {
      fb.classList.add("active");
      fb.style.display = "";
      window.scrollTo(0, 0);
    }
  }, mockGrade.result);

  await page.waitForTimeout(600);
  const screen = page.locator("#screen-writing-feedback");
  const target = (await screen.count()) ? screen : page.locator("body");
  await target.screenshot({ path: resolve(OUT_DIR, "lesson-grade.png") });
  console.log("captured: img/product/lesson-grade.png");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  // 420x900 ≈ iPhone-ish frame at @2x, fits in phone mockup nicely.
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  });
  const page = await context.newPage();
  await bypassGate(page);
  await mockApi(page);

  try {
    await login(page);
    await captureWriting(page);
    await captureGrade(page, MOCK_GRADE);
  } catch (err) {
    console.error("capture failed:", err.message);
    // Always dump a diagnostic full-page screenshot.
    await page.screenshot({ path: resolve(OUT_DIR, "capture-debug.png"), fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
