import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

const dl1 = page.waitForEvent("download", { timeout: 8000 });
await page.evaluate(async () => {
  document.documentElement.style.setProperty("--accent", "#14B8A6");
  const mod = await import("/js/features/shareCard.js");
  await mod.generateExerciseShareCard({
    kind: "vocab",
    correct: 9,
    total: 12,
    topicLabel: "Yleinen sanasto",
    level: "C",
    elapsedMs: 4 * 60 * 1000 + 27 * 1000,
  });
});
const d1 = await dl1;
await d1.saveAs(path.resolve("scripts/agent-test/screenshots/loop-21-vocab-card.png"));

const dl2 = page.waitForEvent("download", { timeout: 8000 });
await page.evaluate(async () => {
  const mod = await import("/js/features/shareCard.js");
  await mod.generateExerciseShareCard({
    kind: "grammar",
    correct: 5,
    total: 6,
    topicLabel: "Sekoitus",
    level: "C",
    elapsedMs: 3 * 60 * 1000 + 12 * 1000,
  });
});
const d2 = await dl2;
await d2.saveAs(path.resolve("scripts/agent-test/screenshots/loop-21-grammar-card.png"));

console.log("done");
await browser.close();
