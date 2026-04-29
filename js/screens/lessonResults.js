/**
 * L-PLAN-3 UPDATE 2 — post-session results card for curriculum lessons.
 *
 * Shown after a vocab/grammar/reading session that was launched from
 * #screen-lesson (curriculum context active). Replaces the default mode
 * results screen for curriculum lessons; free-practice sessions keep
 * using the existing results screens.
 *
 * Sourced layout pattern: 21st.dev /s/results + /s/score-card — restrained
 * dark card with a single-stroke accuracy bar, mono score, and a stack of
 * three text blocks (score → metacognitive prompt → tutor message). No
 * animated number tickers, no celebration confetti — the curriculum loop
 * is meant to feel calm, not gamified.
 */

import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { clearLessonContext } from "../lib/lessonContext.js";

const SCREEN_ID = "screen-lesson-results";
const ROOT_ID = "lesson-results-root";

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function ensureScreen() {
  let screen = document.getElementById(SCREEN_ID);
  if (!screen) {
    screen = document.createElement("div");
    screen.id = SCREEN_ID;
    screen.className = "screen";
    document.querySelector(".app-main")?.appendChild(screen)
      || document.body.appendChild(screen);
  }
  if (!document.getElementById(ROOT_ID)) {
    screen.innerHTML = `<div id="${ROOT_ID}"></div>`;
  }
  return document.getElementById(ROOT_ID);
}

/**
 * @param {object} ctx
 * @param {string} ctx.kurssiKey
 * @param {number} ctx.lessonIndex
 * @param {string} ctx.lessonFocus
 * @param {string} ctx.lessonType - vocab|grammar|reading|writing|mixed|test
 * @param {number} ctx.scoreCorrect
 * @param {number} ctx.scoreTotal
 * @param {Array<{question:string, studentAnswer:string, correctAnswer:string, topic_key?:string}>} ctx.wrongAnswers
 */
export async function showLessonResults(ctx) {
  const root = ensureScreen();
  show(SCREEN_ID);

  const { kurssiKey, lessonIndex, lessonFocus, scoreCorrect, scoreTotal } = ctx;
  const pct = scoreTotal > 0 ? Math.round((scoreCorrect / scoreTotal) * 100) : 0;
  const tone = pct >= 80 ? "good" : pct >= 60 ? "warn" : "low";

  // Initial render — score visible, message areas in skeleton state.
  root.innerHTML = renderShell({ scoreCorrect, scoreTotal, pct, tone, lessonFocus });
  wireBackButton();

  // POST to /complete; render banner + tutorMessage + metacognitivePrompt + CTAs.
  if (!isLoggedIn()) {
    renderUnauthenticated(root, ctx);
    return;
  }

  let resp = null;
  try {
    const res = await apiFetch(
      `${API}/api/curriculum/${encodeURIComponent(kurssiKey)}/lesson/${lessonIndex}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          scoreCorrect,
          scoreTotal,
          wrongAnswers: ctx.wrongAnswers || [],
          lessonType: ctx.lessonType,
        }),
      },
    );
    if (!res.ok) throw new Error("Tallennus epäonnistui");
    resp = await res.json();
  } catch (err) {
    renderFallbackMessage(root, ctx, err.message || "Ei yhteyttä — tulokset näytetään, mutta tallennus epäonnistui.");
    return;
  }

  renderResolved(root, ctx, resp);
}

function renderShell({ scoreCorrect, scoreTotal, pct, tone, lessonFocus }) {
  return `
    <article class="lr-card" aria-live="polite">
      <header class="lr-head">
        <p class="lr-eyebrow">Oppitunti suoritettu</p>
        <h1 class="lr-focus">${escapeHtml(lessonFocus || "")}</h1>
      </header>
      <section class="lr-score lr-score--${tone}" aria-label="Tulos">
        <div class="lr-score-num"><span class="lr-score-correct">${scoreCorrect}</span><span class="lr-score-divider"> / </span><span class="lr-score-total">${scoreTotal}</span></div>
        <div class="lr-score-label">oikein${scoreTotal > 0 ? " · " + pct + " %" : ""}</div>
        <div class="lr-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="lr-bar-fill" style="width:${pct}%"></div>
        </div>
      </section>
      <section class="lr-meta" id="lr-meta">
        <div class="lr-skeleton-line" aria-busy="true"></div>
      </section>
      <section class="lr-tutor" id="lr-tutor">
        <div class="lr-skeleton-line" aria-busy="true"></div>
        <div class="lr-skeleton-line lr-skeleton-line--short"></div>
      </section>
      <section class="lr-actions" id="lr-actions"></section>
    </article>`;
}

function wireBackButton() {
  // No persistent back button on the results card — the primary CTA always
  // points back to the curriculum, so the only escape is via that CTA.
}

function renderResolved(root, ctx, resp) {
  const meta = document.getElementById("lr-meta");
  const tutor = document.getElementById("lr-tutor");
  const actions = document.getElementById("lr-actions");
  if (!meta || !tutor || !actions) return;

  meta.innerHTML = `<p class="lr-meta-prompt">${escapeHtml(resp.metacognitivePrompt || "")}</p>`;
  tutor.innerHTML = `<p class="lr-tutor-msg">${escapeHtml(resp.tutorMessage || "")}</p>`;

  const fastTrackBlock = resp.fastTrack
    ? `<div class="lr-fasttrack" role="region" aria-label="Nopea eteneminen">
         <p class="lr-fasttrack-q">Menet hienosti! Hypätäänkö suoraan seuraavaan oppituntiin?</p>
         <div class="lr-fasttrack-row">
           <button type="button" class="btn btn-primary" id="lr-fasttrack-yes">Kyllä</button>
           <button type="button" class="btn btn-secondary" id="lr-fasttrack-no">Ei, jatkan tästä</button>
         </div>
       </div>`
    : "";

  const showNextKurssi = resp.kurssiComplete && resp.nextKurssiKey;
  const ctas = `
    ${fastTrackBlock}
    <button type="button" class="btn btn-primary lr-cta-primary" id="lr-cta-back">Jatka oppimispolkua →</button>
    ${showNextKurssi ? `<button type="button" class="btn btn-secondary lr-cta-secondary" id="lr-cta-next-kurssi">Aloita ${escapeHtml(resp.nextKurssiTitle || resp.nextKurssiKey)} →</button>` : ""}
  `;
  actions.innerHTML = ctas;

  document.getElementById("lr-cta-back")?.addEventListener("click", () => goBackToCurriculum());
  document.getElementById("lr-cta-next-kurssi")?.addEventListener("click", () => goBackToCurriculum(resp.nextKurssiKey));
  document.getElementById("lr-fasttrack-yes")?.addEventListener("click", () => goBackToCurriculum(ctx.kurssiKey, ctx.lessonIndex + 1));
  document.getElementById("lr-fasttrack-no")?.addEventListener("click", () => {
    const ft = document.querySelector(".lr-fasttrack");
    if (ft) ft.remove();
  });
}

function renderUnauthenticated(root, ctx) {
  const meta = document.getElementById("lr-meta");
  const tutor = document.getElementById("lr-tutor");
  const actions = document.getElementById("lr-actions");
  if (meta) meta.innerHTML = `<p class="lr-meta-prompt">Kirjaudu sisään tallentaaksesi suoritus.</p>`;
  if (tutor) tutor.innerHTML = "";
  if (actions) {
    actions.innerHTML = `<a class="btn btn-primary" href="/app.html#kirjaudu">Kirjaudu sisään</a>`;
  }
}

function renderFallbackMessage(root, ctx, msg) {
  const meta = document.getElementById("lr-meta");
  const tutor = document.getElementById("lr-tutor");
  const actions = document.getElementById("lr-actions");
  if (meta) meta.innerHTML = "";
  if (tutor) tutor.innerHTML = `<p class="lr-tutor-msg lr-tutor-msg--err">${escapeHtml(msg)}</p>`;
  if (actions) {
    actions.innerHTML = `<button type="button" class="btn btn-primary" id="lr-cta-back">Jatka oppimispolkua →</button>`;
    document.getElementById("lr-cta-back")?.addEventListener("click", () => goBackToCurriculum());
  }
}

async function goBackToCurriculum(focusKurssiKey = null, gotoLessonIndex = null) {
  // Clear context so the next free-practice session uses default flow.
  clearLessonContext();
  // Invalidate the dashboard tutor-message cache so the next dashboard load
  // refreshes the greeting with this freshly completed session in scope.
  try { sessionStorage.removeItem("dashTutorMsg"); } catch { /* noop */ }
  const mod = await import("./curriculum.js");
  if (focusKurssiKey && Number.isInteger(gotoLessonIndex)) {
    // Fast-track: jump straight into the next lesson (currently the curriculum
    // module doesn't expose a deep-link API, so we navigate to the path screen
    // with the kurssi expanded; the user clicks the next lesson row).
    await mod.loadCurriculum();
    return;
  }
  await mod.loadCurriculum();
}
