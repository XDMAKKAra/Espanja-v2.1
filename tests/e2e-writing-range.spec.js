// L-V354 — the writing result shows a coverage-calibrated point RANGE, not one
// exact number, and the landing proof cards show ranges too. The grading API is
// mocked (page.route) so the test is deterministic and spends no gpt-5.4-mini
// tokens. Runs under both the mobile (390px) and desktop projects.

import { test, expect } from "@playwright/test";

const MOCK_RESULT = {
  finalScore: 16,
  maxScore: 20,
  ytlGrade: "L",
  scoreRange: { lo: 25, hi: 31, mid: 28, band: "L", mode: "range", coverage: 0.87, max: 33 },
  _predNative: 22,
  viestinnallisyys: { score: 4, feedback_fi: "Tehtävä täytetty selkeästi." },
  kielen_rakenteet: { score: 4, feedback_fi: "Rakenteet pääosin hallussa." },
  sanasto:          { score: 4, feedback_fi: "Sopiva sanasto." },
  kokonaisuus:      { score: 4, feedback_fi: "Yhtenäinen teksti." },
  corrected_text: "",
  errors: [],
  annotations: [{ excerpt: "Hola Marta", comment_fi: "Luonteva aloitus.", type: "positive" }],
  overall_feedback_fi: "Aino, kutsu tulee selväksi heti ja rekisteri on juuri oikea ystävälle. Aikamuodot ovat vielä hiottavaa.",
  next_action_fi: "Kertaa preteritin ja imperfektin ero.",
  penalty: 0,
};

const SPANISH = "Hola Marta, te escribo para invitarte a mi cumpleanos el sabado que viene en mi casa a las siete de la tarde. Habra musica y comida, y espero que puedas venir con tu hermano. Dime antes del miercoles.";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo_token", "test-token-v354");
      localStorage.setItem("puheo_email", "v354@test.dev");
    } catch {}
  });
  await page.route("**/api/grade-writing", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: MOCK_RESULT }) }),
  );
  await page.route("**/api/mistake", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/progress**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
});

test("writing result shows a point RANGE, not one exact number", async ({ page }) => {
  await page.goto("/app.html");
  await page.waitForLoadState("domcontentloaded");

  // Drive the real submit handler with a task in state (bypasses the home → CTA
  // chain). The grading fetch is mocked above.
  await page.evaluate(async (text) => {
    const st = await import("/js/state.js");
    const w  = await import("/js/screens/writing.js");
    const nav = await import("/js/ui/nav.js");
    w.initWriting({ loadDashboard() {}, saveProgress() {} });
    st.state.currentWritingTask = {
      taskType: "short", points: 33, charMin: 160, charMax: 240,
      situation: "Kutsu ystävä synttäreille.", prompt: "Escribe una invitación.",
      requirements: ["aika", "paikka", "vastauspyyntö"],
    };
    nav.show("screen-writing");
    const input = document.getElementById("writing-input");
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const btn = document.getElementById("btn-submit-writing");
    btn.disabled = false;
    btn.click();
  }, SPANISH);

  await page.waitForSelector("#screen-writing-feedback", { state: "visible", timeout: 8000 });

  // The range renders as "lo–hi", denom "/ 33", with a clarifying label.
  const range = page.locator("#feedback-score-range");
  await expect(range).toBeVisible();
  await expect(range).toHaveText(/^\d+–\d+$/);
  await expect(range).toHaveText("25–31");
  await expect(page.locator("#feedback-score-denom")).toHaveText("/ 33");
  await expect(page.locator("#feedback-score-label")).toContainText("pistehaarukka");
  await expect(page.locator("#feedback-grade-badge")).toHaveText("L");

  // No single exact score is shown, and there is no "AI-arvio" stamp.
  await expect(page.locator("#feedback-score-num")).toHaveCount(0);
  await expect(page.locator("#screen-writing-feedback")).not.toContainText("AI-arvio");

  // No horizontal overflow on the feedback screen.
  const overflow = await page.evaluate(() => {
    const el = document.getElementById("screen-writing-feedback");
    return { sw: el.scrollWidth, cw: document.documentElement.clientWidth };
  });
  expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 1);
});

test("landing proof cards show point ranges, not single numbers", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle", timeout: 30_000 });

  const proof = page.locator("#nayte");
  await expect(proof.getByText("21–27 / 33", { exact: true }).first()).toBeVisible();
  // All three sample cards now carry ranges (es short, fr long, de short).
  await expect(proof.getByText("38–48 / 66", { exact: true }).first()).toHaveCount(1);
  await expect(proof.getByText("21–30 / 33", { exact: true }).first()).toHaveCount(1);

  // Caveat states it is an estimated range, not a guaranteed single point.
  await expect(page.locator(".proof__caveat")).toContainText("arvioitu pistehaarukka");

  // The "samalla tarkkuudella" parity overclaim is gone.
  await expect(page.locator(".proof__lede")).not.toContainText("samalla tarkkuudella");

  // No horizontal overflow at the proof section.
  const overflow = await page.evaluate(() => {
    const el = document.getElementById("nayte");
    return { sw: el.scrollWidth, cw: document.documentElement.clientWidth };
  });
  expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 1);
});
