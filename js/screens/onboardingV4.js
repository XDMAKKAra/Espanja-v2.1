// L-V293-ONBOARDING-DIAGNOSTIC-1a — diagnostic-first onboarding (5 stepit).
//
// Step order: intro → test (a/b/c) → courses → biography → summary.
// Test step renders empty-state in commit 1a (content arrives in 1b-1e).
// Pause-resume: every answered question UPSERTs to backend; on next mount
// we load /diagnostic/state and skip past answered questions.
//
// Entrypoint hash: #/aloitus-v4 (V3 stays default until V4 is content-complete).

import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, apiFetch } from "../api.js";
import { setLanguage } from "../state.js";
import { track } from "../analytics.js";
import {
  loadPart,
  questionsFor,
  isPlaceholder,
  loadServerState,
  saveAnswer,
  completeDiagnostic,
  partProgress,
  renderQuestion,
  renderFeedback,
  gradeQuestion,
  renderReadingPassage,
  renderWritingPrompt,
} from "../features/miniYO.js";

const STAGE_ORDER = ["intro", "test", "courses", "biography", "textbook", "summary", "choice"];

const SCREEN_ID = {
  intro: "screen-ob-v4-intro",
  test: "screen-ob-v4-test",
  courses: "screen-ob-v4-courses",
  biography: "screen-ob-v4-biography",
  textbook: "screen-ob-v4-textbook",
  summary: "screen-ob-v4-summary",
  choice: "screen-ob-v4-choice",
};

// L-V359 — product → backend tier/billing contract (routes/stripe.js).
const PRODUCT_TIER = {
  kurssi: { tier: "mestari", billing: "package" },
  treeni: { tier: "treeni", billing: "monthly" },
};

const TEST_PARTS = ["a_grammar", "b_reading", "c_writing"];

const state = {
  language: null,
  currentPart: "a_grammar",
  partData: null,
  progress: [],
  questionIndex: 0,
  coursesCompleted: [],
  courseGrades: {},
  biography: { home_usage: null, lived_abroad: null, frequency: null },
  textbookKey: null,
  textbookFreeText: "",
  miniYoStatus: "in_progress",
};

let _deps = {};

export function initOnboardingV4(deps = {}) {
  _deps = deps;
  wireIntro();
  wireTest();
  wireCourses();
  wireBiography();
  wireTextbook();
  wireSummary();
  wireChoice();
}

export async function showOnboardingV4(opts = {}) {
  state.language = opts.language || resolveLanguage();
  if (state.language) setLanguage(state.language);
  show(SCREEN_ID.intro);
  track("ob_v4_started", { language: state.language });

  // Warm server state in the background so resume works without delay.
  if (isLoggedIn() && state.language) {
    loadServerState(state.language).then((s) => {
      state.progress = Array.isArray(s.progress) ? s.progress : [];
      renderTestProgressHint();
    });
  }
}

function resolveLanguage() {
  try {
    return localStorage.getItem("puheo:lang") || "es";
  } catch {
    return "es";
  }
}

function gotoStage(stage) {
  const id = SCREEN_ID[stage];
  if (id) show(id);
  if (stage === "test") renderTest();
  if (stage === "textbook") renderTextbook();
  if (stage === "summary") renderSummary();
}

// Decide whether to show the textbook disambiguator. Show when at least
// one course was selected (textbook signal only meaningful in that context).
// Skip when user blew through everything (no signal to disambiguate against).
function shouldShowTextbook() {
  return state.coursesCompleted.length > 0;
}

function advanceFromBiography() {
  if (shouldShowTextbook()) {
    gotoStage("textbook");
  } else {
    gotoStage("summary");
  }
}

// ─── Step 1: Intro ──────────────────────────────────────────────────────────
function wireIntro() {
  $("ob-v4-intro-start")?.addEventListener("click", () => {
    state.currentPart = "a_grammar";
    gotoStage("test");
  });
  $("ob-v4-intro-skip")?.addEventListener("click", async () => {
    state.miniYoStatus = "skipped";
    await completeDiagnostic({ language: state.language, status: "skipped" });
    track("ob_v4_skipped_at_intro", { language: state.language });
    gotoStage("courses");
  });
}

// ─── Step 2: Test runner ────────────────────────────────────────────────────
function wireTest() {
  $("ob-v4-test-skip-part")?.addEventListener("click", () => advanceTestPart("partial"));
  $("ob-v4-test-skip-all")?.addEventListener("click", async () => {
    state.miniYoStatus = "partial";
    await completeDiagnostic({ language: state.language, status: "partial" });
    gotoStage("courses");
  });
  $("ob-v4-test-next-part")?.addEventListener("click", () => advanceTestPart("partial"));
}

async function renderTest() {
  const partLabelEl = $("ob-v4-test-part-label");
  const titleEl = $("ob-v4-test-title");
  const bodyEl = $("ob-v4-test-body");
  const progressEl = $("ob-v4-test-progress");
  const nextPartBtn = $("ob-v4-test-next-part");
  if (!bodyEl) return;

  state.partData = await loadPart(state.language, state.currentPart);
  const placeholder = isPlaceholder(state.partData);

  if (partLabelEl) partLabelEl.textContent = partLabel(state.currentPart);
  if (titleEl) titleEl.textContent = partTitle(state.currentPart);

  if (placeholder) {
    bodyEl.innerHTML = `
      <p class="ob-v4-empty__hint">Tämän osion sisältö on vielä työn alla. Voit jatkaa eteenpäin, kurssi- ja biografia-vastauksesi tallennetaan silti.</p>
    `;
    if (progressEl) progressEl.textContent = "Sisältö tulossa";
    if (nextPartBtn) nextPartBtn.hidden = false;
    return;
  }

  // Real content path: resume from server progress (skip past answered questions).
  state.questionIndex = computeResumeIndex(state.progress, state.currentPart, questionsFor(state.partData).length);
  if (nextPartBtn) nextPartBtn.hidden = true;
  showCurrentQuestion();
}

function computeResumeIndex(progressArray, part, total) {
  if (!Array.isArray(progressArray)) return 0;
  const indices = progressArray
    .filter(p => p.part === part)
    .map(p => p.question_index)
    .sort((a, b) => a - b);
  // Resume at the first index that hasn't been answered yet.
  for (let i = 0; i < total; i++) {
    if (!indices.includes(i)) return i;
  }
  return total; // all done
}

function showCurrentQuestion() {
  const bodyEl = $("ob-v4-test-body");
  const progressEl = $("ob-v4-test-progress");
  const nextPartBtn = $("ob-v4-test-next-part");
  if (!bodyEl) return;

  // Part C is a single writing prompt, not a question sequence.
  if (state.currentPart === "c_writing") {
    showWritingPart(bodyEl, progressEl, nextPartBtn);
    return;
  }

  const questions = questionsFor(state.partData);
  const total = questions.length;
  const idx = state.questionIndex;

  if (idx >= total) {
    // Part complete — show summary + reveal "next part" button.
    bodyEl.innerHTML = `<p class="ob-v4-empty__hint">Tämä osa on valmis. Hyvää työtä.</p>`;
    if (progressEl) progressEl.textContent = `${total}/${total} valmis`;
    if (nextPartBtn) nextPartBtn.hidden = false;
    return;
  }

  if (progressEl) progressEl.textContent = `${idx + 1} / ${total}`;
  const question = questions[idx];

  // Part B: persist passage above the question container.
  if (state.currentPart === "b_reading") {
    ensurePassageContainer();
    renderReadingPassage($("ob-v4-test-passage"), state.partData);
  }

  const { submitBtn, getValue } = renderQuestion(bodyEl, question, { index: idx, total });
  if (!submitBtn) return;

  submitBtn.addEventListener("click", async () => {
    const userInput = getValue();
    const { correct, normalizedAnswer } = gradeQuestion(question, userInput);
    renderFeedback(bodyEl, question, normalizedAnswer, correct);

    // UPSERT to backend. Non-fatal if anonymous/offline.
    await saveAnswer({
      language: state.language,
      part: state.currentPart,
      questionIndex: idx,
      questionId: question.id,
      userAnswer: normalizedAnswer,
      isCorrect: correct,
    });

    // Update local progress cache so resume index is correct.
    state.progress = [
      ...state.progress.filter(p => !(p.part === state.currentPart && p.question_index === idx)),
      {
        part: state.currentPart,
        question_index: idx,
        question_id: question.id,
        user_answer: normalizedAnswer,
        is_correct: correct,
      },
    ];

    // Reveal a "Seuraava" button.
    const actionsEl = bodyEl.querySelector(".ob4-q__actions");
    if (actionsEl) {
      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "ob4-btn ob4-btn--primary ob4-q__next";
      nextBtn.textContent = idx + 1 >= total ? "Seuraava osa" : "Seuraava kysymys";
      nextBtn.addEventListener("click", () => {
        state.questionIndex = idx + 1;
        showCurrentQuestion();
      });
      actionsEl.appendChild(nextBtn);
    }
  });
}

function renderTestProgressHint() {
  const progressEl = $("ob-v4-test-progress");
  if (!progressEl || !state.partData) return;
  const total = questionsFor(state.partData).length;
  if (!total) return;
  const { answered } = partProgress(state.progress, state.currentPart, total);
  progressEl.textContent = `${answered}/${total} vastattu`;
}

function advanceTestPart(statusIfLast) {
  const idx = TEST_PARTS.indexOf(state.currentPart);
  if (idx < 0 || idx === TEST_PARTS.length - 1) {
    const finalStatus = statusIfLast || "partial";
    state.miniYoStatus = finalStatus === "completed" ? "completed" : finalStatus;
    completeDiagnostic({ language: state.language, status: state.miniYoStatus });
    gotoStage("courses");
    return;
  }
  state.currentPart = TEST_PARTS[idx + 1];
  renderTest();
}

// Insert a passage container above the question body if missing.
function ensurePassageContainer() {
  let el = $("ob-v4-test-passage");
  if (el) return el;
  const screen = $(SCREEN_ID.test);
  const shell = screen?.querySelector(".ob4-shell");
  const bodyEl = $("ob-v4-test-body");
  if (!shell || !bodyEl) return null;
  el = document.createElement("div");
  el.id = "ob-v4-test-passage";
  el.className = "ob4-passage-wrapper";
  shell.insertBefore(el, bodyEl);
  return el;
}

function clearPassageContainer() {
  const el = $("ob-v4-test-passage");
  if (el) { el.innerHTML = ""; el.dataset.partPassage = ""; }
}

function showWritingPart(bodyEl, progressEl, nextPartBtn) {
  clearPassageContainer();
  if (progressEl) progressEl.textContent = "Kirjoitelma";
  if (nextPartBtn) nextPartBtn.hidden = true;

  const { submitBtn, getValue } = renderWritingPrompt(bodyEl, state.partData);
  const skipBtn = bodyEl.querySelector(".ob4-q__skip");

  if (skipBtn) {
    skipBtn.addEventListener("click", async () => {
      await saveAnswer({
        language: state.language,
        part: state.currentPart,
        questionIndex: 0,
        questionId: "c_writing_skipped",
        userAnswer: { skipped: true },
        isCorrect: null,
      });
      bodyEl.innerHTML = `<p class="ob-v4-empty__hint">Kirjoitelma ohitettu. Arvio merkitään epävarmaksi, voit palata myöhemmin.</p>`;
      if (nextPartBtn) {
        nextPartBtn.hidden = false;
        nextPartBtn.textContent = "Valmis";
      }
    });
  }

  if (!submitBtn) return;
  submitBtn.addEventListener("click", async () => {
    const text = getValue();
    const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
    await saveAnswer({
      language: state.language,
      part: state.currentPart,
      questionIndex: 0,
      questionId: "c_writing_submission",
      userAnswer: { text, words },
      isCorrect: null,
    });
    bodyEl.innerHTML = `<p class="ob-v4-empty__hint">Kiitos. Kirjoitelmasi tallennettu, arviointi tehdään myöhemmin.</p>`;
    if (nextPartBtn) {
      nextPartBtn.hidden = false;
      nextPartBtn.textContent = "Valmis";
    }
  });
}

function partLabel(part) {
  if (part === "a_grammar") return "Osa A — Rakenne";
  if (part === "b_reading") return "Osa B — Luetun ymmärtäminen";
  if (part === "c_writing") return "Osa C — Kirjoitelma";
  return "Osa";
}
function partTitle(part) {
  if (part === "a_grammar") return "Lyhyitä kysymyksiä kieliopista ja sanastosta";
  if (part === "b_reading") return "Yksi pidempi teksti, muutama kysymys";
  if (part === "c_writing") return "Kirjoita lyhyt teksti annetusta aiheesta";
  return "Tehtävä";
}

// ─── Step 3: Multi-select kurssit ───────────────────────────────────────────
function wireCourses() {
  const list = $("ob-v4-courses-list");
  if (list) {
    list.addEventListener("change", (e) => {
      const t = e.target;
      if (!t || !t.dataset) return;
      const k = Number(t.dataset.courseNum);
      if (!Number.isInteger(k)) return;

      if (t instanceof HTMLInputElement && t.type === "checkbox") {
        const row = t.closest(".ob4-course");
        if (t.checked) {
          state.coursesCompleted = [...new Set([...state.coursesCompleted, k])].sort((a, b) => a - b);
          row?.classList.add("is-selected");
        } else {
          state.coursesCompleted = state.coursesCompleted.filter(n => n !== k);
          delete state.courseGrades[k];
          row?.classList.remove("is-selected");
        }
      } else if (t instanceof HTMLSelectElement) {
        const v = t.value;
        if (v === "skipped") state.courseGrades[k] = null;
        else {
          const n = Number(v);
          if (Number.isInteger(n) && n >= 4 && n <= 10) state.courseGrades[k] = n;
        }
      }
    });
  }

  $("ob-v4-courses-continue")?.addEventListener("click", async () => {
    if (!isLoggedIn()) {
      // Defer to client-only state; backend save happens after sign-up.
      gotoStage("biography");
      return;
    }
    try {
      await apiFetch(`${API}/api/onboarding/diagnostic/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: state.language,
          courses_completed: state.coursesCompleted,
          course_grades: state.courseGrades,
        }),
      });
    } catch (err) {
      console.warn("courses save failed (non-fatal):", err.message);
    }
    gotoStage("biography");
  });
}

// ─── Step 4: Biografia ──────────────────────────────────────────────────────
function wireBiography() {
  const form = $("ob-v4-bio-form");
  if (form) {
    form.addEventListener("change", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement) || t.type !== "radio") return;
      const key = t.name;
      const value = t.value;
      if (["home_usage", "lived_abroad", "frequency"].includes(key)) {
        state.biography[key] = value;
      }
    });
  }
  $("ob-v4-bio-continue")?.addEventListener("click", async () => {
    if (isLoggedIn()) {
      try {
        await apiFetch(`${API}/api/onboarding/diagnostic/biography`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: state.language, ...state.biography }),
        });
      } catch (err) {
        console.warn("biography save failed (non-fatal):", err.message);
      }
    }
    advanceFromBiography();
  });
}

// ─── Step 4: Oppikirja-disambiguator ────────────────────────────────────────
function wireTextbook() {
  const list = $("ob-v4-textbook-list");
  const freeText = $("ob-v4-textbook-other");
  const freeTextWrap = $("ob-v4-textbook-other-wrap");

  if (list) {
    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".ob4-textbook__card");
      if (!btn) return;
      const key = btn.dataset.textbookKey;
      if (!key) return;
      state.textbookKey = key;
      list.querySelectorAll(".ob4-textbook__card").forEach(el => {
        el.classList.toggle("is-selected", el === btn);
        el.setAttribute("aria-pressed", el === btn ? "true" : "false");
      });
      if (freeTextWrap) freeTextWrap.hidden = key !== "other";
      if (key !== "other" && freeText) freeText.value = "";
    });
  }

  if (freeText) {
    freeText.addEventListener("input", () => {
      state.textbookFreeText = freeText.value.trim().slice(0, 80);
    });
  }

  $("ob-v4-textbook-skip")?.addEventListener("click", () => {
    state.textbookKey = null;
    state.textbookFreeText = "";
    gotoStage("summary");
  });

  $("ob-v4-textbook-continue")?.addEventListener("click", async () => {
    if (!state.textbookKey) {
      gotoStage("summary");
      return;
    }
    const textbookKey = state.textbookKey === "other" && state.textbookFreeText
      ? `other:${state.textbookFreeText}`.slice(0, 32)
      : state.textbookKey;
    if (isLoggedIn()) {
      await completeDiagnostic({
        language: state.language,
        status: state.miniYoStatus || "in_progress",
        textbookKey,
      });
    }
    track("ob_v4_textbook_chosen", { language: state.language, textbook: state.textbookKey });
    gotoStage("summary");
  });
}

function renderTextbook() {
  const listEl = $("ob-v4-textbook-list");
  const hintEl = $("ob-v4-textbook-hint");
  if (!listEl) return;

  const books = textbooksForLanguage(state.language);
  listEl.innerHTML = books.map(b => `
    <button type="button"
            class="ob4-textbook__card"
            data-textbook-key="${escapeAttr(b.key)}"
            aria-pressed="false">
      <span class="ob4-textbook__cover" data-cover="${escapeAttr(b.key)}" aria-hidden="true">
        <span class="ob4-textbook__cover-label">${escapeHtml(b.coverLabel)}</span>
      </span>
      <span class="ob4-textbook__name">${escapeHtml(b.title)}</span>
      <span class="ob4-textbook__publisher">${escapeHtml(b.publisher)}</span>
    </button>
  `).join("");

  if (hintEl) {
    hintEl.textContent = "Ei haittaa jos et muista, taso-arvio jo kertoo paljon.";
  }
  const freeTextWrap = $("ob-v4-textbook-other-wrap");
  if (freeTextWrap) freeTextWrap.hidden = true;
  state.textbookKey = null;
  state.textbookFreeText = "";
}

// Top-3 textbooks per language. Free of fabricated stats — these are real
// Finnish lukio textbook series (publishers Otava / Sanoma Pro).
function textbooksForLanguage(lang) {
  if (lang === "es") {
    return [
      { key: "es_mi_mundo",      title: "Mi mundo",      publisher: "Sanoma Pro", coverLabel: "MM" },
      { key: "es_accion",        title: "¡Acción!",      publisher: "Otava",      coverLabel: "AC" },
      { key: "es_otra_vez",      title: "Otra vez",      publisher: "Otava",      coverLabel: "OV" },
      { key: "other",            title: "Muu",           publisher: "Kerro mikä", coverLabel: "?"  },
      { key: "unknown",          title: "En muista",     publisher: "Ohitetaan",  coverLabel: "·"  },
    ];
  }
  if (lang === "de") {
    return [
      { key: "de_panorama",      title: "Panorama Deutsch", publisher: "Sanoma Pro", coverLabel: "PD" },
      { key: "de_magazin",       title: "Magazin.de",       publisher: "Otava",      coverLabel: "MD" },
      { key: "de_kompass",       title: "Kompass",          publisher: "Otava",      coverLabel: "KO" },
      { key: "other",            title: "Muu",              publisher: "Kerro mikä", coverLabel: "?"  },
      { key: "unknown",          title: "En muista",        publisher: "Ohitetaan",  coverLabel: "·"  },
    ];
  }
  // fr
  return [
    { key: "fr_voila",           title: "Voilà!",           publisher: "Otava",      coverLabel: "VO" },
    { key: "fr_escalier",        title: "Escalier",         publisher: "Sanoma Pro", coverLabel: "ES" },
    { key: "fr_chez_moi",        title: "Chez moi",         publisher: "Otava",      coverLabel: "CM" },
    { key: "other",              title: "Muu",              publisher: "Kerro mikä", coverLabel: "?"  },
    { key: "unknown",            title: "En muista",        publisher: "Ohitetaan",  coverLabel: "·"  },
  ];
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ─── Step 5: Yhteenveto (tulokset) ──────────────────────────────────────────
function wireSummary() {
  $("ob-v4-summary-start")?.addEventListener("click", () => {
    track("ob_v4_completed", { language: state.language, courses: state.coursesCompleted.length });
    // L-V359 — results now lead into the product choice, not straight to app.
    gotoStage("choice");
  });
}

// ─── Step 6: Tuotevalinta (L-V359) ──────────────────────────────────────────
function wireChoice() {
  $("ob-v4-choice-kurssi")?.addEventListener("click", () => beginCheckout("kurssi"));
  $("ob-v4-choice-treeni")?.addEventListener("click", () => beginCheckout("treeni"));
  $("ob-v4-choice-free")?.addEventListener("click", () => finishToApp("free_continue"));
  $("ob-v4-choice-status-free")?.addEventListener("click", () => finishToApp("free_after_checkout_pending"));
}

// Calls the real checkout endpoint. When Stripe is live the response carries a
// hosted-checkout URL and we redirect; while it is unwired the endpoint answers
// 503, so we show a calm "tulossa pian" state with a free exit instead of an
// error. Same call works unchanged once Stripe is connected.
async function beginCheckout(product) {
  const map = PRODUCT_TIER[product];
  if (!map) return;
  track("ob_v4_checkout_started", { product, language: state.language });

  const btn = $(product === "kurssi" ? "ob-v4-choice-kurssi" : "ob-v4-choice-treeni");
  const original = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "Avataan maksua…"; }

  try {
    if (!isLoggedIn()) {
      // Signup precedes this step in the flow, but route safely if not.
      try { localStorage.setItem("puheo:pending_product", product); } catch { /* private mode */ }
      window.location.hash = "#/rekisteroidy";
      return;
    }
    const resp = await apiFetch(`${API}/api/stripe/checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(map),
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      if (data && data.url) {
        window.location.href = data.url; // Stripe live → hosted checkout
        return;
      }
    }
    showCheckoutPending(product); // 503 or missing url → graceful state
  } catch (_e) {
    showCheckoutPending(product);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original; }
  }
}

function showCheckoutPending(product) {
  track("ob_v4_checkout_unavailable", { product, language: state.language });
  const status = $("ob-v4-choice-status");
  if (!status) return;
  status.hidden = false;
  status.scrollIntoView({ behavior: "smooth", block: "center" });
}

function finishToApp(reason) {
  track("ob_v4_choice_resolved", { reason, language: state.language });
  if (typeof _deps.loadDashboard === "function") {
    _deps.loadDashboard();
  } else {
    window.location.hash = "#/dashboard";
  }
}

function renderSummary() {
  const recapEl = $("ob-v4-summary-recap");
  if (!recapEl) return;

  const stepEl = $("ob-v4-summary-step");
  if (stepEl) {
    const total = shouldShowTextbook() ? 6 : 5;
    stepEl.textContent = `Vaihe ${total} / ${total}`;
  }

  // Skeleton-tilaa varten käytetään heuristiikkaa rakenteen pitämiseksi
  // näytöllä siihen asti, kunnes reasoner-vastaus saapuu.
  const heuristic = synthesizeSummary(state);
  renderSummaryBody(recapEl, {
    strengths: heuristic.strengths,
    gaps: heuristic.growth,
    plan: heuristic.plan,
    note: "Rakennetaan henkilökohtaista polkua...",
    loading: true,
  });

  // Kutsu reasoneria taustalla. Jos onnistuu, korvaa heuristiikka
  // LLM-pohjaisella tuloksella. Jos epäonnistuu, jätä heuristiikka näkyviin.
  buildReasonerProfile(state.language).then((result) => {
    if (!result) return;
    const planFromResult = []
      .concat(result.plan?.week1 || [])
      .concat(result.plan?.week2 || [])
      .concat(result.plan?.week3 || []);
    renderSummaryBody(recapEl, {
      strengths: Array.isArray(result.strengths) && result.strengths.length ? result.strengths : heuristic.strengths,
      gaps: Array.isArray(result.gaps) && result.gaps.length ? result.gaps : heuristic.growth,
      plan: planFromResult.length ? planFromResult : heuristic.plan,
      note: result.meta?.planSource === "fallback"
        ? "Tarkka polku rakentuu kun ensimmäisten harjoitusten data kerääntyy."
        : "Polku perustuu kurssihistoriaasi, diagnostiikkaasi ja taustatietoihisi.",
      loading: false,
    });
  }).catch(() => {
    // pidetään heuristiikka
  });
}

function renderSummaryBody(recapEl, { strengths, gaps, plan, note, loading }) {
  const planByWeek = chunkPlanByWeek(plan);
  recapEl.innerHTML = `
    <div class="ob4-summary__col">
      <h2 class="ob4-summary__h2">Sinun vahvuutesi</h2>
      <ul class="ob4-summary__list">
        ${strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
      </ul>
    </div>
    <div class="ob4-summary__col">
      <h2 class="ob4-summary__h2">Kehittämiskohteet</h2>
      <ul class="ob4-summary__list">
        ${gaps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
      </ul>
    </div>
    <div class="ob4-summary__plan${loading ? " ob4-summary__plan--loading" : ""}">
      <h2 class="ob4-summary__h2">Ehdotettu 3 viikon polku</h2>
      <ol class="ob4-summary__plan-list">
        ${planByWeek.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
      <p class="ob4-summary__plan-note">${escapeHtml(note)}</p>
    </div>
  `;
}

function chunkPlanByWeek(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length <= 4) return items;
  // Jos LLM palautti viikot erikseen ja flatatut item:it, järjestele takaisin
  // viikko-otsikoiksi näkyvyyden vuoksi.
  const out = [];
  const week1 = items.slice(0, Math.ceil(items.length / 3));
  const week2 = items.slice(week1.length, week1.length + Math.ceil((items.length - week1.length) / 2));
  const week3 = items.slice(week1.length + week2.length);
  if (week1.length) out.push(`Viikko 1: ${week1.join(" ")}`);
  if (week2.length) out.push(`Viikko 2: ${week2.join(" ")}`);
  if (week3.length) out.push(`Viikko 3: ${week3.join(" ")}`);
  return out;
}

async function buildReasonerProfile(language) {
  try {
    if (!isLoggedIn()) return null;
    const resp = await apiFetch(`${API}/api/personalization/build-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_e) {
    return null;
  }
}

// Heuristic placeholder summary until L-V294 reasoner is live. Uses the
// captured state (courses, biography, mini-yo status) to produce something
// truthful instead of fake stats.
function synthesizeSummary(s) {
  const strengths = [];
  const growth = [];
  const plan = [];

  const courses = Array.isArray(s.coursesCompleted) ? s.coursesCompleted : [];
  const grades = s.courseGrades || {};
  const numericGrades = courses
    .map(k => grades[k])
    .filter(g => Number.isInteger(g));
  const avgGrade = numericGrades.length
    ? Math.round((numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length) * 10) / 10
    : null;
  const maxCourse = courses.length ? Math.max(...courses) : 0;

  // Strengths
  if (s.biography?.home_usage === "yes") {
    strengths.push("Kuulet kieltä päivittäin kotona, joten suullinen ymmärrys ja sanaston laajuus ovat etunasi.");
  } else if (s.biography?.home_usage === "some") {
    strengths.push("Saat kieleen kosketuspintaa kotioloissa, mikä auttaa intuitiivisessa hahmottamisessa.");
  }
  if (s.biography?.lived_abroad === "over_year" || s.biography?.lived_abroad === "months") {
    strengths.push("Olet asunut kohdemaassa, joten kuullun ymmärtäminen ja arkikieli ovat vahvempia kuin tyypillisellä lukio-opiskelijalla.");
  }
  if (maxCourse >= 6) {
    strengths.push(`Olet käynyt syvempiä kursseja (K${maxCourse} asti). Pitkän kaaren rakenteet ovat sinulle tuttuja.`);
  } else if (maxCourse >= 3) {
    strengths.push(`Perustaso ja menneen ajan rakenteet ovat hallussa (käynyt K${maxCourse} asti).`);
  }
  if (avgGrade !== null && avgGrade >= 8) {
    strengths.push(`Lukio-arvosanasi keskiarvo on ${avgGrade}, mikä viittaa hyvään tarkkuuteen.`);
  }
  if (strengths.length === 0) {
    strengths.push("Aloitat puhtaalta pöydältä. Etuna on, että polku rakentuu täysin omaan tahtiisi.");
  }

  // Growth
  if (maxCourse < 6) {
    growth.push("Subjunktiivi ja hypoteettiset rakenteet (K6+) ovat seuraava luonnollinen askel.");
  }
  if (maxCourse < 8) {
    growth.push("YO-koetehtävien rakenne ja kirjoitelman pisteytyskriteerit kannattaa käydä läpi ennen koetta.");
  }
  if (avgGrade !== null && avgGrade < 7) {
    growth.push("Peruskielioppi (preteriti, artikkelit, kongruenssit) hyötyy lisäharjoituksesta ennen edistyneitä rakenteita.");
  }
  if (s.biography?.frequency === "rarely" || s.biography?.frequency === "monthly") {
    growth.push("Säännöllinen päivittäinen kosketus (10–15 min) tuo nopeampaa edistystä kuin pidemmät harvat sessiot.");
  }
  if (growth.length === 0) {
    growth.push("Tarkka analyysi näkyy ensimmäisten harjoitusten jälkeen, kun saamme datapointit tasostasi.");
  }

  // 3-week plan
  if (maxCourse <= 2) {
    plan.push("Viikko 1: perusverbit, artikkelit ja preesens. Luot pohjan jolle myöhemmät rakenteet nojaavat.");
    plan.push("Viikko 2: arjen sanasto ja epäsäännölliset verbit, lyhyitä luetun tehtäviä.");
    plan.push("Viikko 3: ensimmäiset menneen ajan rakenteet ja mini-kirjoitelmat.");
  } else if (maxCourse <= 5) {
    plan.push("Viikko 1: preteritin ja imperfektin ero (YO-klassikko), paljon harjoitusta kontekstissa.");
    plan.push("Viikko 2: futuuri, konditionaali ja luetun ymmärtämistehtäviä YO-tyyliin.");
    plan.push("Viikko 3: kirjoitelmaharjoituksia palautteen kanssa, sanaston laajennus.");
  } else {
    plan.push("Viikko 1: subjunktiivin laukaisijat ja si-lauseet. Varmistat että edistyneet rakenteet tulevat automaattisesti.");
    plan.push("Viikko 2: koko YO-koe-rakenne harjoituksena, ajan käyttö per osio.");
    plan.push("Viikko 3: kirjoitelmien hiominen pisteytyskriteereihin ja heikoimpien aiheiden täsmäharjoittelu.");
  }

  return { strengths: strengths.slice(0, 4), growth: growth.slice(0, 4), plan };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
