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
import { clearLessonContext, getLessonContext, isDeepenRun, setDeepenRun } from "../lib/lessonContext.js";
import { state } from "../state.js";

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

  // L-PLAN-6 — when this entry is the tail of a deepen run (L-tavoite +
  // ≥85% original score → 4 follow-up exercises), skip the /complete
  // round-trip (the lesson was already marked complete on the first
  // pass) and render a deepen mini-summary instead.
  if (isDeepenRun()) {
    setDeepenRun(false);
    root.innerHTML = renderDeepenSummary({ scoreCorrect, scoreTotal, pct, lessonFocus });
    document.getElementById("lr-deepen-back")?.addEventListener("click", () => goBackToCurriculum());
    return;
  }

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

function renderDeepenSummary({ scoreCorrect, scoreTotal, pct, lessonFocus }) {
  return `
    <article class="lr-card lr-card--deepen" aria-live="polite">
      <header class="lr-head">
        <p class="lr-eyebrow">Syvennys suoritettu</p>
        <h1 class="lr-focus">${escapeHtml(lessonFocus || "")}</h1>
      </header>
      <section class="lr-score lr-score--good" aria-label="Syvennyksen tulos">
        <div class="lr-score-num"><span class="lr-score-correct">${scoreCorrect}</span><span class="lr-score-divider"> / </span><span class="lr-score-total">${scoreTotal}</span></div>
        <div class="lr-score-label">syvennyksessä oikein${scoreTotal > 0 ? " · " + pct + " %" : ""}</div>
      </section>
      <section class="lr-tutor">
        <p class="lr-tutor-msg">L-tavoite: 4 vaativampaa lisätehtävää on tehty. Aihe on automatisoitumassa.</p>
      </section>
      <section class="lr-actions">
        <button type="button" class="btn btn-primary lr-cta-primary" id="lr-deepen-back">Jatka oppimispolkua →</button>
      </section>
    </article>`;
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
        <div class="lr-bar" role="progressbar"
             aria-label="Tuloksen edistyminen, ${pct} % oikein"
             aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
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

  // L-PLAN-6 — Syvennä-callout for the L target.
  // Trigger: target_grade === 'L' AND score/total ≥ 0.85 AND not a deepen
  // run already AND the lesson type is one we have a deepen path for
  // (vocab + grammar/mixed; reading + writing don't fit a 4-item follow-up).
  // education/cognitive-load-analyser: 4 extra items is the cap — more
  // would push the L pacing past 16 items in one sitting.
  const lessonCtxNow = getLessonContext();
  const targetGrade = lessonCtxNow?.targetGrade || "B";
  const pctNow = ctx.scoreTotal > 0 ? (ctx.scoreCorrect / ctx.scoreTotal) : 0;
  const deepenable = ctx.lessonType === "vocab" || ctx.lessonType === "grammar" || ctx.lessonType === "mixed";
  const showDeepen = targetGrade === "L" && pctNow >= 0.85 && deepenable && !resp.kurssiComplete;
  const deepenBlock = showDeepen
    ? `<div class="lr-deepen" role="region" aria-label="L-tason syventävät harjoitukset">
         <h3 class="lr-deepen__title">Syvennä taitoasi</h3>
         <p class="lr-deepen__body">L-tavoitteena halutaan täydellinen hallinta. 4 lisätehtävää samasta aiheesta vaativammilla ehdoilla — tee ne nyt kun aihe on tuore.</p>
         <div class="lr-deepen__row">
           <button type="button" class="btn btn-primary" id="btn-deepen-yes">Tee 4 lisätehtävää (~6 min)</button>
           <button type="button" class="btn btn-secondary" id="btn-deepen-skip">Ohita tällä kertaa</button>
         </div>
       </div>`
    : "";

  // L-PLAN-4 UPDATE 6 — fast-leveling callout.
  // Wording per CURRICULUM_SPEC §4: offer a jump straight to the kertaustesti
  // (last lesson of the kurssi) when the AI flag fires. "yes" navigates to the
  // last lesson; "no" dismisses the callout in place — student stays on the
  // current results screen and resumes via the primary CTA. flow-state-
  // condition-designer rule: choice, not redirect.
  const fastTrackBlock = resp.fastTrack
    ? `<div class="lr-fasttrack" role="alert" aria-label="Nopea eteneminen">
         <span class="lr-fasttrack-icon" aria-hidden="true">⚡</span>
         <p class="lr-fasttrack-text">Tämä vaikuttaa tutulta — tehdäänkö suoraan kertaustesti?</p>
         <div class="lr-fasttrack-row">
           <button type="button" class="btn btn-primary" id="lr-fasttrack-yes">Siirry kertaustestiin →</button>
           <button type="button" class="btn btn-secondary" id="lr-fasttrack-no">Jatka järjestyksessä</button>
         </div>
       </div>`
    : "";

  const showNextKurssi = resp.kurssiComplete && resp.nextKurssiKey;
  const ctas = `
    ${fastTrackBlock}
    ${deepenBlock}
    <button type="button" class="btn btn-primary lr-cta-primary" id="lr-cta-back">Jatka oppimispolkua →</button>
    ${showNextKurssi ? `<button type="button" class="btn btn-secondary lr-cta-secondary" id="lr-cta-next-kurssi">Aloita ${escapeHtml(resp.nextKurssiTitle || resp.nextKurssiKey)} →</button>` : ""}
  `;
  actions.innerHTML = ctas;

  document.getElementById("lr-cta-back")?.addEventListener("click", () => goBackToCurriculum());
  document.getElementById("lr-cta-next-kurssi")?.addEventListener("click", () => goBackToCurriculum(resp.nextKurssiKey));
  document.getElementById("lr-fasttrack-yes")?.addEventListener("click", () => jumpToKertaustesti(ctx.kurssiKey));
  document.getElementById("lr-fasttrack-no")?.addEventListener("click", () => {
    const ft = document.querySelector(".lr-fasttrack");
    if (ft) ft.remove();
  });
  document.getElementById("btn-deepen-yes")?.addEventListener("click", () => startDeepenRun(ctx));
  document.getElementById("btn-deepen-skip")?.addEventListener("click", () => {
    const d = document.querySelector(".lr-deepen");
    if (d) d.remove();
  });
}

// L-PLAN-6 — kick off a 4-item deepen run for the same lesson.
// Stays in the curriculum lesson context (sessionStorage.currentLesson is
// still the original lesson so the AI prompt keeps the focus); we just
// flip the deepen flag and re-launch the appropriate loader.
async function startDeepenRun(ctx) {
  setDeepenRun(true);
  // Reset session counters so the deepen run reports its own score.
  state.batchNumber = 0;
  state.totalCorrect = 0;
  state.totalAnswered = 0;
  state.recentVocabHeadwords = [];
  state.sessionStartTime = Date.now();
  state.language = "spanish";

  if (ctx.lessonType === "vocab") {
    const vocab = await import("./vocab.js");
    state.mode = "vocab";
    state.topic = "general vocabulary";
    state.level = "B";
    state.startLevel = "B";
    state.peakLevel = "B";
    history.replaceState(null, "", "#/sanasto");
    vocab.loadNextBatch();
    return;
  }
  // grammar / mixed
  const grammar = await import("./grammar.js");
  state.mode = "grammar";
  state.grammarTopic = "mixed";
  state.grammarLevel = "C";
  history.replaceState(null, "", "#/puheoppi");
  grammar.loadGrammarDrill();
}

// Resolve the kurssi's last lesson (kertaustesti) and deep-link into it.
// Falls back to the curriculum screen if the kurssi fetch fails.
async function jumpToKertaustesti(kurssiKey) {
  clearLessonContext();
  try { sessionStorage.removeItem("dashTutorMsg"); } catch { /* noop */ }
  let lastIndex = null;
  try {
    const res = await apiFetch(`${API}/api/curriculum/${encodeURIComponent(kurssiKey)}`, {
      headers: authHeader(),
    });
    if (res.ok) {
      const { lessons } = await res.json();
      if (Array.isArray(lessons) && lessons.length > 0) {
        lastIndex = lessons[lessons.length - 1].sortOrder ?? lessons.length;
      }
    }
  } catch { /* fall through to curriculum overview */ }
  const mod = await import("./curriculum.js");
  if (lastIndex && typeof mod.openLesson === "function") {
    try { await mod.openLesson(kurssiKey, lastIndex); return; } catch { /* fall through */ }
  }
  await mod.loadCurriculum();
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
