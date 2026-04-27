// Render the L20 writing share-card with mock feedback data, save the PNG
// to scripts/agent-test/screenshots/ so we can eyeball the design without
// needing an authenticated end-to-end flow.
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 } });
const page = await ctx.newPage();

// Use the dev server so module imports resolve naturally. Land on the
// landing page (no auth needed) and run the share-card module via
// dynamic import in the page context.
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

// Capture any download triggered by the module's <a click>.
const downloadPromise = page.waitForEvent("download", { timeout: 8000 });

const result = await page.evaluate(async () => {
  // Stub CSS var so readAccent() returns something predictable.
  document.documentElement.style.setProperty("--accent", "#14B8A6");
  // Inject a <link> to /js/state.js? Not needed — module resolves on its own.
  const mod = await import("/js/features/shareCard.js");
  const mockResult = {
    finalScore: 27,
    maxScore: 33,
    ytlGrade: "M",
    viestinnallisyys: { score: 5, feedback_fi: "Selkeää viestintää." },
    kielen_rakenteet: { score: 4, feedback_fi: "Hyvät rakenteet." },
    sanasto:           { score: 4, feedback_fi: "Monipuolista sanastoa." },
    kokonaisuus:       { score: 3, feedback_fi: "Eheä kokonaisuus." },
    originalText: "Hola Marta, ..."
  };
  await mod.generateWritingShareCard(mockResult);
  return "ok";
});

console.log("module call result:", result);

const dl = await downloadPromise;
const out = path.resolve("scripts/agent-test/screenshots/loop-20-share-card.png");
await dl.saveAs(out);
const stat = await fs.stat(out);
console.log("saved:", out, stat.size, "bytes");

await browser.close();
