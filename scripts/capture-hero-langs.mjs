#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V376 — Capture the writing-task + rubric hero shot in ES / FR / DE.
 *
 * Run with the dev server up:
 *   npm run dev          # port 3000
 *   node scripts/capture-hero-langs.mjs
 *
 * Strategy: log in as the test account, mock POST /api/writing-task so the
 * three captures are deterministic and free (no OpenAI). Only the target-
 * language prompt + the example answer differ; the Finnish situation,
 * requirements and rubric sidebar are identical across all three, so the
 * three frames are visually consistent.
 *
 * The clip rectangle is measured ONCE from the Spanish capture and reused for
 * FR/DE, guaranteeing pixel-identical dimensions → no layout shift when the
 * landing language switcher swaps the <img src>.
 *
 * Output: public/shots/app-writing-rubric-es|fr|de.png
 */
import "dotenv/config";
import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const EMAIL =
  process.env.TEST_LOGIN_EMAIL ||
  (process.env.TEST_PRO_EMAILS || "").split(",")[0].trim() ||
  "testpro123@gmail.com";
const PASS =
  process.env.TEST_LOGIN_PASSWORD || process.env.TEST_PRO_PASSWORD || "Testpro123";

const OUT_DIR = resolve(process.cwd(), "public/shots");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Shared Finnish framing — same apology task in all three languages.
const SITUATION =
  "Riitelit parhaan kaverisi kanssa eilen ja sanoit jotain loukkaavaa. Haluat nyt pyytää anteeksi.";
const REQUIREMENTS = [
  "Pyydä anteeksi ja myönnä virheesi selkeästi",
  "Selitä lyhyesti miksi reagoit niin kuin reagoit",
  "Ehdota jotain konkreettista, mitä voitte tehdä yhdessä sovinnoksi",
];

const LANGS = {
  es: {
    prompt:
      "Escríbele un mensaje a tu mejor amigo/a para pedirle perdón. Explica por qué reaccionaste así, reconoce que te equivocaste y propón hacer algo juntos para arreglar las cosas.",
    answer:
      "Hola, perdóname por lo que dije ayer. Estaba muy cansado y reaccioné fatal, lo siento mucho. Sabes que eres mi mejor amigo. ¿Tomamos un café el sábado y hablamos con calma?",
  },
  fr: {
    prompt:
      "Écris un message à ton meilleur ami / ta meilleure amie pour t'excuser. Explique pourquoi tu as réagi ainsi, reconnais que tu as eu tort et propose de faire quelque chose ensemble pour arranger les choses.",
    answer:
      "Salut, je suis vraiment désolé pour ce que j'ai dit hier. J'étais fatigué et j'ai mal réagi, je m'excuse. Tu sais que tu es mon meilleur ami. On prend un café samedi et on en parle tranquillement ?",
  },
  de: {
    prompt:
      "Schreib deiner besten Freundin / deinem besten Freund eine Nachricht, um dich zu entschuldigen. Erkläre, warum du so reagiert hast, gib zu, dass du dich geirrt hast, und schlag vor, etwas zusammen zu unternehmen.",
    answer:
      "Hallo, es tut mir wirklich leid, was ich gestern gesagt habe. Ich war müde und habe falsch reagiert. Du weißt, dass du mein bester Freund bist. Gehen wir am Samstag einen Kaffee trinken und reden in Ruhe?",
  },
};

function taskFor(lang) {
  return {
    task: {
      taskType: "short",
      points: 20,
      charMin: 160,
      charMax: 240,
      situation: SITUATION,
      prompt: LANGS[lang].prompt,
      requirements: REQUIREMENTS,
      topic: "Verbit",
    },
  };
}

async function bypassGate(page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("puheo_gate_ok_v1", "1");
    } catch {}
  });
}

async function login(page) {
  await page.goto(`${BASE}/app.html`);
  await page.waitForLoadState("domcontentloaded");
  const loginTab = page.locator("#tab-login");
  if (await loginTab.count()) await loginTab.click().catch(() => {});
  await page.locator("#auth-email").fill(EMAIL);
  await page.locator("#auth-password").fill(PASS);
  await Promise.all([
    page
      .waitForResponse(
        (r) => /\/api\/(login|auth\/login)/.test(r.url()) && r.status() < 500,
        { timeout: 20000 }
      )
      .catch(() => null),
    page.locator("#btn-auth-submit").click(),
  ]);
  await page.waitForTimeout(1000);
}

async function captureLang(page, lang, clip) {
  // Per-language deterministic task.
  await page.unroute("**/api/writing-task**").catch(() => {});
  await page.route("**/api/writing-task**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(taskFor(lang)),
    });
  });

  // Fresh home, then click the "Kirjoita ja saa arvio" card → writing mode page.
  // (Hash routing isn't applied on a cold load, so we drive the real UI.)
  await page.goto(`${BASE}/app.html`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(900);

  const writeCard = page.locator('a.dash-action--write').first();
  await writeCard.waitFor({ state: "visible", timeout: 12000 });
  await writeCard.click();

  const startBtn = page.locator("#btn-start-writing");
  await startBtn.waitFor({ state: "visible", timeout: 12000 });
  await startBtn.click();

  const input = page.locator("#writing-input");
  await input.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(400);
  await input.fill(LANGS[lang].answer);
  await input.dispatchEvent("input");
  await page.waitForTimeout(500);

  const card = page.locator(".writing-inner");
  await card.waitFor({ state: "visible", timeout: 8000 });

  // Measure once from ES; reuse the rect for FR/DE so all three match exactly.
  let rect = clip;
  if (!rect) {
    const box = await card.boundingBox();
    const pad = 16; // breathing room so the badge header isn't clipped
    rect = {
      x: Math.round(box.x),
      y: Math.max(0, Math.round(box.y) - pad),
      width: Math.round(box.width),
      height: Math.round(box.height) + pad,
    };
  }

  await page.screenshot({
    path: resolve(OUT_DIR, `app-writing-rubric-${lang}.png`),
    clip: rect,
  });
  console.log(`captured: public/shots/app-writing-rubric-${lang}.png  (${rect.width}x${rect.height})`);
  return rect;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1100 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  await bypassGate(page);

  try {
    await login(page);
    const clip = await captureLang(page, "es", null);
    await captureLang(page, "fr", clip);
    await captureLang(page, "de", clip);
  } catch (err) {
    console.error("capture failed:", err.message);
    await page
      .screenshot({ path: resolve(OUT_DIR, "capture-hero-debug.png"), fullPage: true })
      .catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
