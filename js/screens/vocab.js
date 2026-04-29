import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch, retryable } from "../api.js";
import { state, LEVELS, BATCH_SIZE, MAX_BATCHES } from "../state.js";
import { showLoading, showLoadingError, showSkeleton, showFetchError } from "../ui/loading.js";
import { srPop, srAddWrong, srMarkCorrect, srReview, srGetDue } from "../features/spacedRepetition.js";
import { isTranslationAccepted, isTranslationPartial, translationBand, TRANSLATION_BAND_LABELS } from "../features/answerGrading.js";
import { trackExerciseStarted, trackExerciseCompleted, trackError } from "../analytics.js";
import { maybeShowFirstCelebration } from "./onboarding.js";
import { shouldShowCapBanner, CAP_BANNER_COPY } from "../../lib/dailyCap.js";
import { renderExercise } from "./exerciseRenderer.js";
import { toUnified } from "../../lib/exerciseTypes.js";
import { renderAukkotehtava }     from "../renderers/aukkotehtava.js";
import { renderYhdistaminen }     from "../renderers/yhdistaminen.js";
import { renderKaannos }          from "../renderers/kaannos.js";
import { renderLauseenMuodostus } from "../renderers/lauseenMuodostus.js";
import { renderCorrection }       from "../renderers/correction.js";
import { reportMcAdvisory } from "../features/mcAdvisory.js";
import { generateCoachLine, topicLabel, countUp } from "./mode-page.js";
import { celebrateScore } from "../features/celebrate.js";
import { generateExerciseShareCard } from "../features/shareCard.js";
import { getLessonContext } from "../lib/lessonContext.js";

function fmtElapsed(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}:${String(r).padStart(2, "0")}` : `${m} min`;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

// Mirror of routes/exercises.js extractHeadwordKey — derive a Spanish lemma
// from the correct option so we can ask the next /generate call to avoid it.
function extractClientHeadwordKey(ex) {
  try {
    if (!ex?.correct || !Array.isArray(ex.options)) return null;
    const idx = "ABCDEFGH".indexOf(String(ex.correct).trim().toUpperCase());
    if (idx < 0 || idx >= ex.options.length) return null;
    const raw = String(ex.options[idx] || "")
      .replace(/^[A-H]\)\s*/, "")
      .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, "")
      .toLowerCase()
      .trim();
    return raw || null;
  } catch { return null; }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let _deps = {};
let _scaffoldMeta = null; // { level, scaffoldLevel, scaffold, type, topic }
let _recentTypes = [];

export function initVocab({ loadDashboard, shareResult, saveProgress }) {
  _deps = { loadDashboard, shareResult, saveProgress };

  // Scaffold help button — request hints back
  const helpBtn = $("scaffold-help-btn");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      if (_scaffoldMeta) {
        _scaffoldMeta.scaffoldLevel = Math.min(3, (_scaffoldMeta.scaffoldLevel || 0) + 1);
        updateScaffoldIndicator(_scaffoldMeta.scaffoldLevel);
      }
      helpBtn.classList.add("hidden");
    });
  }
}

function updateScaffoldIndicator(scaffoldLevel) {
  const indicator = $("scaffold-indicator");
  if (!indicator) return;

  indicator.classList.remove("hidden");
  const fireEl = $("scaffold-fire");
  const textEl = $("scaffold-text");
  const helpBtn = $("scaffold-help-btn");

  if (scaffoldLevel <= 0) {
    fireEl.classList.remove("hidden");
    textEl.textContent = "Ei vihjeitä — olet tulessa!";
    helpBtn.classList.remove("hidden");
  } else if (scaffoldLevel === 1) {
    fireEl.classList.add("hidden");
    textEl.textContent = "Vain vihje";
    helpBtn.classList.remove("hidden");
  } else if (scaffoldLevel === 2) {
    fireEl.classList.add("hidden");
    textEl.textContent = "";
    helpBtn.classList.add("hidden");
  } else {
    fireEl.classList.add("hidden");
    textEl.textContent = "";
    helpBtn.classList.add("hidden");
  }
}

async function logMistake(ex, chosen) {
  if (!isLoggedIn()) return;
  try {
    // Build wrong/correct answer strings depending on type
    let question = ex.question || ex.sentence || ex.finnishSentence || "";
    let wrongAnswer = "";
    let correctAnswer = "";

    if (ex.options && ex.correct) {
      // Multiple choice
      const chosenOpt = (ex.options || []).find(o => o.trim()[0] === chosen);
      const correctOpt = (ex.options || []).find(o => o.trim()[0] === ex.correct);
      wrongAnswer = chosenOpt || chosen;
      correctAnswer = correctOpt || ex.correct;
    } else if (ex.correctAnswer !== undefined) {
      // Gap-fill
      wrongAnswer = chosen;
      correctAnswer = ex.correctAnswer;
    } else if (ex.acceptedTranslations) {
      // Translate-mini
      wrongAnswer = chosen;
      correctAnswer = ex.acceptedTranslations[0];
    } else if (ex.correct && Array.isArray(ex.correct)) {
      // Reorder
      wrongAnswer = Array.isArray(chosen) ? chosen.join(" ") : String(chosen);
      correctAnswer = ex.correct.join(" ");
    }

    await apiFetch(`${API}/api/mistake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        topics: ex.topics || [],
        exerciseType: ex.type || "multichoice",
        level: state.level,
        question: question.slice(0, 500),
        wrongAnswer: String(wrongAnswer).slice(0, 200),
        correctAnswer: String(correctAnswer).slice(0, 200),
        explanation: (ex.explanation || "").slice(0, 500),
      }),
    });
  } catch { /* silent */ }
}

function recordItem(ex, isCorrect) {
  if (!Array.isArray(state.sessionItems)) state.sessionItems = [];
  let label = ex?.correctAnswer || ex?.spanish || ex?.es || ex?.answer || ex?.finnishSentence;
  if (!label && Array.isArray(ex?.pairs)) {
    label = ex.pairs.map((p) => p.spanish).join(" / ");
  }
  if (!label && Array.isArray(ex?.correct)) {
    label = ex.correct.join(" ");
  }
  if (!label) label = "kysymys";
  state.sessionItems.push({ label: String(label).trim(), correct: !!isCorrect });
}

async function reportAdaptiveAnswer(topic, isCorrect) {
  try {
    const res = await retryable(() => apiFetch(`${API}/api/adaptive-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ topic, isCorrect }),
    }), { attempts: 2, baseDelayMs: 300 });
    const data = await res.json();
    if (data.scaffoldChanged && data.direction === "down") {
      updateScaffoldIndicator(data.scaffoldLevel);
    } else if (data.scaffoldChanged && data.direction === "up") {
      // Silently add more help — no announcement
      if (_scaffoldMeta) _scaffoldMeta.scaffoldLevel = data.scaffoldLevel;
    }
  } catch { /* silent */ }
}

export const VOCAB_TYPE_LABELS = {
  context:           "Konteksti",
  translate:         "Käännös",
  gap:               "Täydennä",
  meaning:           "Sanasto",
  gap_fill:          "Aukkotehtävä",
  matching:          "Yhdistä",
  reorder:           "Järjestä",
  translate_mini:    "Käännä",
  aukkotehtava:      "Aukkotehtävä",
  yhdistaminen:      "Yhdistä parit",
  kaannos:           "Käännä",
  lauseen_muodostus: "Muodosta lause",
  correction:        "Korjaa virhe",
};

export const GRAMMAR_TYPE_LABELS = {
  gap: "Täydennä",
  correction: "Virheen korjaus",
  transform: "Muunna",
  pick_rule: "Tunnista sääntö",
};

/**
 * Start a review-only session with due SR cards.
 */
export async function startReviewSession() {
  showLoading("Haetaan kertauskortteja...");

  try {
    const dueCards = await srGetDue(12, state.language);
    if (!dueCards.length) {
      showLoadingError("Ei kertauskortteja juuri nyt! Harjoittele ensin uusia sanoja.", () => {
        show("screen-start");
      });
      return;
    }

    state.mode = "vocab";
    state.exercises = dueCards;
    state.current = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.sessionItems = [];
    state.batchCorrect = 0;
    state.batchNumber = 1;
    state.bankId = null;
    state._reviewMode = true;
    state.sessionStartTime = Date.now();

    renderVocabQuestion();
    show("screen-exercise");
  } catch (err) {
    showLoadingError(err.message, () => startReviewSession());
  }
}

export async function loadNextBatch() {
  state.batchNumber++;
  state.batchCorrect = 0;
  state.current = 0;
  state._reviewMode = false;

  // Commit 9: inline skeleton inside #screen-exercise instead of the full-screen
  // "Loading..." swap. Student keeps chrome + orientation while we fetch.
  showSkeletonIntoExercise();
  show("screen-exercise");

  try {
    const srItems = state.batchNumber === 1 ? srPop(2) : [];

    const freshCount = BATCH_SIZE - srItems.length;

    // Mix in a new exercise type every other batch
    let mixedExercises = [];
    if (state.batchNumber >= 2 && state.batchNumber % 2 === 0) {
      try {
        const legacyTypes = ["gap-fill", "reorder", "matching"];
        const seedTypes   = ["aukkotehtava", "yhdistaminen"];
        const allTypes    = [...legacyTypes, ...seedTypes];
        const pick = allTypes[Math.floor(Math.random() * allTypes.length)];

        if (seedTypes.includes(pick)) {
          // Seed-bank endpoints
          const mixRes = await fetch(`${API}/api/${pick}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: JSON.stringify({ count: pick === "yhdistaminen" ? 5 : 1 }),
          });
          if (mixRes.ok) {
            const mixData = await mixRes.json();
            if (pick === "aukkotehtava" && mixData.items?.length) {
              // One item per exercise slot
              mixedExercises = [{ ...mixData.items[0], type: "aukkotehtava" }];
            } else if (pick === "yhdistaminen" && mixData.items?.length) {
              // Whole matching game is one exercise
              mixedExercises = [{ type: "yhdistaminen", items: mixData.items, shuffledFi: mixData.shuffledFi }];
            }
          }
        } else {
          // Legacy AI-generated endpoints
          const mixRes = await fetch(`${API}/api/${pick}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: JSON.stringify({ level: state.level, count: 1, language: state.language }),
          });
          if (mixRes.ok) {
            const mixData = await mixRes.json();
            if (pick === "matching" && mixData.exercise) {
              mixedExercises = [mixData.exercise];
            } else if (mixData.exercises?.length) {
              mixedExercises = mixData.exercises.slice(0, 1);
            }
          }
        }
      } catch { /* silent — just skip mixed type */ }
    }

    const mcCount = Math.max(1, freshCount - mixedExercises.length);
    // L-PLAN-3 — when a curriculum lesson is active, server overrides
    // level/topic/count from the lesson and injects a focus constraint
    // into the prompt. We just forward { kurssiKey, lessonIndex }.
    const lessonCtx = getLessonContext();
    const res = await fetch(`${API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        level: state.level,
        topic: state.topic,
        count: mcCount,
        language: state.language,
        recentlyShown: state.recentVocabHeadwords || [],
        ...(lessonCtx ? { lesson: lessonCtx } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tehtävien luonti epäonnistui");
    if (!data.exercises?.length) throw new Error("No exercises");

    // Track headwords from this batch so the next /generate call can ask
    // the model to avoid repeating them. Cap at 30 to keep prompt cheap.
    const newKeys = data.exercises.map(extractClientHeadwordKey).filter(Boolean);
    state.recentVocabHeadwords = [...(state.recentVocabHeadwords || []), ...newKeys].slice(-30);

    state.exercises = [...srItems, ...data.exercises, ...mixedExercises];
    state.bankId = data.bankId || null;
    if (state.batchNumber === 1) trackExerciseStarted("vocab", state.level, state.topic, state.language);
    hideExerciseSkeleton();
    renderVocabQuestion();
    show("screen-exercise");
  } catch (err) {
    // Commit 9: inline retry — student stays on #screen-exercise, no
    // full-screen loading-error flip.
    showFetchError($("exercise-skeleton-slot"), {
      title: "Tehtävien lataus epäonnistui",
      subtext: err.message,
      retryFn: () => loadNextBatch(),
    });
    $("exercise-skeleton-slot").classList.remove("hidden");
    $("exercise-question-block").classList.add("hidden");
    $("options-grid").classList.add("hidden");
  }
}

function showSkeletonIntoExercise() {
  const slot = $("exercise-skeleton-slot");
  const qb = $("exercise-question-block");
  const opts = $("options-grid");
  if (qb) qb.classList.add("hidden");
  if (opts) opts.classList.add("hidden");
  if (slot) {
    slot.classList.remove("hidden");
    showSkeleton(slot, "exercise");
  }
}
function hideExerciseSkeleton() {
  const slot = $("exercise-skeleton-slot");
  const qb = $("exercise-question-block");
  const opts = $("options-grid");
  if (slot) { slot.innerHTML = ""; slot.classList.add("hidden"); }
  if (qb) qb.classList.remove("hidden");
  if (opts) opts.classList.remove("hidden");
}

function hideAllExerciseAreas() {
  $("options-grid").innerHTML = "";
  $("options-grid").style.display = "";
  const areas = ["gap-fill-area", "matching-area", "reorder-area", "translate-area"];
  areas.forEach(id => { const el = $(id); if (el) el.classList.add("hidden"); });
  const contextEl = $("ex-context-sentence");
  if (contextEl) contextEl.classList.add("hidden");
  const kbdHint = $("vocab-kbd-hint");
  if (kbdHint) kbdHint.style.display = "";
}

// Renamed from renderExercise to avoid clashing with the imported dispatcher
// at line 9 (which is called at line 352 with a different signature).
function renderVocabQuestion() {
  const ex = state.exercises[state.current];
  const questionNum = (state.batchNumber - 1) * BATCH_SIZE + state.current + 1;
  const totalQuestions = MAX_BATCHES * BATCH_SIZE;

  // Mastery test uses different counter
  if (state._masteryMode) {
    const total = state._masteryTotal || state.exercises.length;
    $("ex-counter").textContent = `Q ${state.current + 1} / ${total}`;
  } else {
    $("ex-counter").textContent = `Q ${questionNum} / ${totalQuestions}`;
  }

  // Mastery badge
  if (state._masteryMode) {
    $("ex-round").textContent = "🎯 Mastery-testi";
    $("ex-round").classList.remove("sr-review-badge");
  } else
  // SR review badge with repetition number
  if (ex._sr) {
    const repNum = ex.reviewNumber || (ex.repetitions || 0) + 1;
    const daysSince = ex.daysSinceLearned;
    let srLabel = `🔁 Kertaus #${repNum}`;
    if (typeof daysSince === "number" && daysSince > 0) {
      srLabel += ` · opit ${daysSince}pv sitten`;
    }
    $("ex-round").textContent = srLabel;
    $("ex-round").classList.add("sr-review-badge");
  } else {
    $("ex-round").textContent = `Kierros ${state.batchNumber}/${MAX_BATCHES}`;
    $("ex-round").classList.remove("sr-review-badge");
  }

  $("ex-level-badge").textContent = state.level;
  $("progress-fill").style.width = `${((questionNum - 1) / totalQuestions) * 100}%`;

  const exType = ex.type || "meaning";
  const typeBadge = $("ex-type-badge");
  const typeLabel = VOCAB_TYPE_LABELS[exType] || GRAMMAR_TYPE_LABELS[exType] || "Sanasto";
  if (typeBadge) {
    typeBadge.textContent = typeLabel;
    typeBadge.className = `ex-type-badge type-${exType}`;
    typeBadge.classList.remove("hidden");
  }

  $("explanation-block").classList.add("hidden");
  $("explanation-text").textContent = "";
  hideAllExerciseAreas();

  // Route to type-specific renderer
  if (exType === "gap_fill") return renderGapFill(ex, questionNum, totalQuestions);
  if (exType === "matching") return renderMatching(ex);
  if (exType === "reorder") return renderReorder(ex);
  if (exType === "translate_mini") return renderTranslateMini(ex);
  if (exType === "aukkotehtava")      return renderAukkotehtava(ex, null, { onAnswer: handleSeedAnswer });
  if (exType === "yhdistaminen")      return renderYhdistaminen(ex, null, { onAnswer: handleSeedAnswer });
  if (exType === "kaannos")           return renderKaannos(ex, null, { onAnswer: handleSeedAnswer });
  if (exType === "lauseen_muodostus") return renderLauseenMuodostus(ex, null, { onAnswer: handleSeedAnswer });
  if (exType === "correction")        return renderCorrection(ex, null, { onAnswer: handleSeedAnswer });

  // Default: multiple-choice
  $("question-text").textContent = ex.question;

  const contextEl = $("ex-context-sentence");
  if (contextEl) {
    if (ex.type === "context" && ex.context) {
      contextEl.textContent = ex.context;
      contextEl.classList.remove("hidden");
    }
  }

  const labelEl = $("question-label");
  if (labelEl) {
    const labels = {
      context: "Mitä sana tarkoittaa tässä yhteydessä?",
      translate: "Valitse oikea käännös",
      gap: "Täydennä lause",
      meaning: "¿Qué significa?",
    };
    labelEl.textContent = labels[exType] || "¿Qué significa?";
  }

  const grid = $("options-grid");
  renderExercise(
    toUnified(ex, { topic: state.topic || state.mode || "vocab", skill_bucket: "vocab" }),
    grid,
    {
      onAnswer: ({ chosenIndex, correctIndex, isCorrect, button }) => {
        handleAnswer(OPTION_LETTERS[chosenIndex], button);
        reportMcAdvisory({ exerciseId: ex.id, chosenIndex, correctIndex, clientIsCorrect: isCorrect });
      },
    }
  );
}

// ─── Gap-fill renderer ────────────────────────────────────────────────────

function renderGapFill(ex) {
  $("question-label").textContent = "Kirjoita puuttuva sana";
  $("question-text").textContent = "";
  $("options-grid").style.display = "none";
  const kbdHint = $("vocab-kbd-hint");
  if (kbdHint) kbdHint.style.display = "none";

  const area = $("gap-fill-area");
  area.classList.remove("hidden");
  $("gap-fill-sentence").textContent = ex.sentence;
  $("gap-fill-hint").textContent = `Vihje: ${ex.hint}`;

  const input = $("gap-fill-input");
  input.value = "";
  input.className = "gap-fill-input";
  input.disabled = false;
  input.focus();

  const feedback = $("gap-fill-feedback");
  feedback.classList.add("hidden");

  const submitBtn = $("gap-fill-submit");
  submitBtn.disabled = false;

  const doSubmit = () => {
    const answer = input.value.trim();
    if (!answer) return;
    submitBtn.disabled = true;
    input.disabled = true;

    // Lenient matching: normalize accents for comparison
    const normalize = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const exactMatch = answer.toLowerCase() === ex.correctAnswer.toLowerCase();
    const lenientMatch = normalize(answer) === normalize(ex.correctAnswer);
    const altMatch = (ex.alternativeAnswers || []).some(
      a => answer.toLowerCase() === a.toLowerCase() || normalize(answer) === normalize(a)
    );

    const isCorrect = exactMatch || altMatch;
    const isAccentError = !exactMatch && lenientMatch;

    if (isCorrect || isAccentError) {
      input.classList.add("correct");
      state.totalCorrect++;
      state.batchCorrect++;
      state._lastCorrect = true;
      let msg = `✓ Oikein! ${ex.correctAnswer}`;
      if (isAccentError) msg += " (tarkista aksentit: " + ex.correctAnswer + ")";
      feedback.innerHTML = `<span style="color:var(--success)">${msg}</span><br>${ex.explanation}`;
    } else {
      input.classList.add("wrong");
      state._lastCorrect = false;
      feedback.innerHTML = `<span style="color:var(--error)">✗ ${ex.correctAnswer}</span><br>${ex.explanation}`;
      if (isLoggedIn()) logMistake(ex, answer);
    }

    state.totalAnswered++;
    recordItem(ex, isCorrect || isAccentError);
    feedback.classList.remove("hidden");
    $("explanation-block").classList.remove("hidden");
    $("explanation-text").textContent = ex.explanation;
  };

  submitBtn.onclick = doSubmit;
  input.onkeydown = (e) => { if (e.key === "Enter") doSubmit(); };
}

// ─── Matching renderer ────────────────────────────────────────────────────

function renderMatching(ex) {
  $("question-label").textContent = "Yhdistä parit";
  $("question-text").textContent = "";
  $("options-grid").style.display = "none";
  const kbdHint = $("vocab-kbd-hint");
  if (kbdHint) kbdHint.style.display = "none";

  const area = $("matching-area");
  area.classList.remove("hidden");

  const pairs = ex.pairs || [];
  const leftCol = $("matching-left");
  const rightCol = $("matching-right");
  const statusEl = $("matching-status");
  leftCol.innerHTML = "";
  rightCol.innerHTML = "";

  // Shuffle right side
  const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);

  let selectedLeft = null;
  let matchedCount = 0;

  // Commit 12: buttons instead of divs so tab-nav + Enter/Space works for
  // keyboard-only users. Click-to-pair flow is preserved; drag stays as a
  // progressive enhancement on top.
  pairs.forEach((pair, i) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "matching-item";
    item.textContent = pair.spanish;
    item.dataset.idx = i;
    item.setAttribute("aria-label", `Espanja: ${pair.spanish}`);
    item.addEventListener("click", () => selectLeft(item, i));
    leftCol.appendChild(item);
  });

  shuffledRight.forEach((pair) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "matching-item";
    item.textContent = pair.finnish;
    item.dataset.spanish = pair.spanish;
    item.setAttribute("aria-label", `Suomi: ${pair.finnish}`);
    item.addEventListener("click", () => selectRight(item, pair.spanish));
    rightCol.appendChild(item);
  });

  statusEl.textContent = `0 / ${pairs.length} yhdistetty`;

  function selectLeft(el, idx) {
    if (el.classList.contains("matched")) return;
    leftCol.querySelectorAll(".matching-item").forEach(i => i.classList.remove("selected"));
    el.classList.add("selected");
    selectedLeft = { el, idx, spanish: pairs[idx].spanish };
  }

  function selectRight(el, spanish) {
    if (el.classList.contains("matched") || !selectedLeft) return;

    if (selectedLeft.spanish === spanish) {
      // Correct match
      selectedLeft.el.classList.remove("selected");
      selectedLeft.el.classList.add("matched");
      el.classList.add("matched");
      matchedCount++;
      statusEl.textContent = `${matchedCount} / ${pairs.length} yhdistetty`;

      if (matchedCount === pairs.length) {
        // All matched
        state.totalCorrect++;
        state.batchCorrect++;
        state.totalAnswered++;
        recordItem(ex, true);
        state._lastCorrect = true;
        statusEl.innerHTML = `<span style="color:var(--success)">✓ Kaikki oikein!</span>`;
        $("explanation-block").classList.remove("hidden");
        $("explanation-text").textContent = "Kaikki parit yhdistetty oikein!";
      }
      selectedLeft = null;
    } else {
      // Wrong match
      el.classList.add("wrong-flash");
      setTimeout(() => el.classList.remove("wrong-flash"), 400);
    }
  }
}

// ─── Reorder renderer ─────────────────────────────────────────────────────

function renderReorder(ex) {
  $("question-label").textContent = "Järjestä sanat lauseeksi";
  $("question-text").textContent = "";
  $("options-grid").style.display = "none";
  const kbdHint = $("vocab-kbd-hint");
  if (kbdHint) kbdHint.style.display = "none";

  const area = $("reorder-area");
  area.classList.remove("hidden");
  $("reorder-hint").textContent = ex.finnishHint;

  const chipsEl = $("reorder-chips");
  const targetEl = $("reorder-target");
  const feedback = $("reorder-feedback");
  feedback.classList.add("hidden");
  chipsEl.innerHTML = "";
  targetEl.innerHTML = '<span class="reorder-placeholder">Klikkaa sanoja oikeaan järjestykseen</span>';

  const placed = [];

  ex.scrambled.forEach((word, i) => {
    const chip = document.createElement("div");
    chip.className = "reorder-chip";
    chip.textContent = word;
    chip.dataset.idx = i;
    chip.addEventListener("click", () => {
      if (chip.classList.contains("used")) return;
      chip.classList.add("used");
      placed.push({ word, chipEl: chip });
      updateTarget();
    });
    chipsEl.appendChild(chip);
  });

  function updateTarget() {
    const placeholder = targetEl.querySelector(".reorder-placeholder");
    if (placeholder) placeholder.remove();
    // Rebuild target
    targetEl.innerHTML = "";
    placed.forEach((p, i) => {
      const chip = document.createElement("div");
      chip.className = "reorder-chip";
      chip.textContent = p.word;
      chip.addEventListener("click", () => {
        // Remove from target, re-enable source
        placed.splice(i, 1);
        p.chipEl.classList.remove("used");
        updateTarget();
      });
      targetEl.appendChild(chip);
    });
    if (placed.length === 0) {
      targetEl.innerHTML = '<span class="reorder-placeholder">Klikkaa sanoja oikeaan järjestykseen</span>';
    }
  }

  $("reorder-undo").onclick = () => {
    if (placed.length === 0) return;
    const last = placed.pop();
    last.chipEl.classList.remove("used");
    updateTarget();
  };

  $("reorder-submit").onclick = () => {
    const userOrder = placed.map(p => p.word);
    const correctOrder = ex.correct;

    // Normalize comparison (case-insensitive)
    const isCorrect = userOrder.length === correctOrder.length &&
      userOrder.every((w, i) => w.toLowerCase() === correctOrder[i].toLowerCase());

    state.totalAnswered++;
    recordItem(ex, isCorrect);

    if (isCorrect) {
      state.totalCorrect++;
      state.batchCorrect++;
      state._lastCorrect = true;
      feedback.className = "reorder-feedback correct";
      feedback.textContent = "✓ Oikein! " + correctOrder.join(" ");
    } else {
      state._lastCorrect = false;
      feedback.className = "reorder-feedback wrong";
      feedback.innerHTML = `✗ Oikea järjestys: <strong>${correctOrder.join(" ")}</strong><br>${ex.explanation}`;
      if (isLoggedIn()) logMistake(ex, userOrder);
    }
    feedback.classList.remove("hidden");
    $("explanation-block").classList.remove("hidden");
    $("explanation-text").textContent = ex.explanation;

    // Disable further interaction
    chipsEl.querySelectorAll(".reorder-chip").forEach(c => c.style.pointerEvents = "none");
    targetEl.querySelectorAll(".reorder-chip").forEach(c => c.style.pointerEvents = "none");
    $("reorder-submit").disabled = true;
    $("reorder-undo").disabled = true;
  };
}

// ─── Translate-mini renderer ──────────────────────────────────────────────

function renderTranslateMini(ex) {
  $("question-label").textContent = "Käännä espanjaksi";
  $("question-text").textContent = "";
  $("options-grid").style.display = "none";
  const kbdHint = $("vocab-kbd-hint");
  if (kbdHint) kbdHint.style.display = "none";

  const area = $("translate-area");
  area.classList.remove("hidden");
  $("translate-source").textContent = ex.finnishSentence;

  const input = $("translate-input");
  input.value = "";
  input.disabled = false;
  input.focus();

  const submitBtn = $("translate-submit");
  submitBtn.disabled = false;
  submitBtn.textContent = "Lähetä arvioitavaksi →";

  const feedback = $("translate-feedback");
  feedback.classList.add("hidden");

  submitBtn.onclick = async () => {
    const answer = input.value.trim();
    if (!answer) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Arvioidaan...";
    input.disabled = true;

    try {
      const res = await fetch(`${API}/api/grade-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          userAnswer: answer,
          acceptedTranslations: ex.acceptedTranslations,
          finnishSentence: ex.finnishSentence,
        }),
      });
      const data = await res.json();

      state.totalAnswered++;
      const isCorrect = isTranslationAccepted(data.score);
      const isPartial = isTranslationPartial(data.score);
      recordItem(ex, isCorrect);
      if (isCorrect) {
        state.totalCorrect++;
        state.batchCorrect++;
      } else {
        // Commit 14: score 1 still earns XP (partial credit) — logs mistake
        // and grants half a correct toward the batch tally but does NOT
        // increment the streak (streak is counted via state.totalCorrect).
        if (isPartial) state._partialCredits = (state._partialCredits || 0) + 1;
        if (isLoggedIn()) logMistake(ex, answer);
      }
      state._lastCorrect = isCorrect;

      const band = translationBand(data.score);
      const bandLabel = TRANSLATION_BAND_LABELS[band];
      const scoreClass = data.score >= 3 ? "good" : data.score >= 2 ? "ok" : "bad";
      feedback.innerHTML = `
        <div class="translate-score ${scoreClass}">${data.score} / ${data.maxScore}</div>
        <div class="translate-band translate-band-${band}" data-testid="translate-band">${bandLabel}</div>
        <div class="translate-best">
          <strong>Paras käännös:</strong> ${data.bestTranslation}<br>
          ${data.feedback || ""}<br>
          <span style="color:var(--ink-soft)">${data.explanation || ""}</span>
        </div>
      `;
      feedback.classList.remove("hidden");
      $("explanation-block").classList.remove("hidden");
      $("explanation-text").textContent = data.explanation || ex.explanation || "";
    } catch (err) {
      // Fallback: simple check against accepted translations
      const normalize = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const isClose = ex.acceptedTranslations.some(t => normalize(answer) === normalize(t));
      state.totalAnswered++;
      recordItem(ex, isClose);
      if (isClose) { state.totalCorrect++; state.batchCorrect++; }
      state._lastCorrect = isClose;
      feedback.innerHTML = `<div class="translate-best">${isClose ? "✓" : "✗"} ${ex.acceptedTranslations[0]}<br>${ex.explanation}</div>`;
      feedback.classList.remove("hidden");
      $("explanation-block").classList.remove("hidden");
      $("explanation-text").textContent = ex.explanation;
    }

    submitBtn.textContent = "Arvioitu";
  };
}

function handleSeedAnswer({ isCorrect, band, score, maxScore, explanation, correctAnswer } = {}) {
  state.totalAnswered++;
  if (isCorrect) {
    state.totalCorrect++;
    state.batchCorrect++;
  } else if (band === "ymmarrettava" || band === "lahella") {
    state._partialCredits = (state._partialCredits || 0) + 1;
  }
  state._lastCorrect = isCorrect;

  const explText = explanation || correctAnswer || "";
  $("explanation-text").textContent = explText;
  $("explanation-block").classList.remove("hidden");

  if (!isCorrect && isLoggedIn()) {
    const ex = state.exercises[state.current];
    logMistake(ex, correctAnswer || "");
  }
  if (isLoggedIn()) {
    reportAdaptiveAnswer(state.topic || state.mode || "vocab", isCorrect);
  }
}

function handleAnswer(chosen, clickedBtn) {
  const ex = state.exercises[state.current];
  const isCorrect = chosen === ex.correct;

  if (isCorrect) {
    state.totalCorrect++;
    state.batchCorrect++;
    clickedBtn.classList.add("is-correct");
  } else {
    clickedBtn.classList.add("is-wrong");
    document.querySelectorAll(".ex-option").forEach((btn) => {
      const letter = btn.querySelector(".ex-option__l")?.textContent;
      if (letter === ex.correct) btn.classList.add("is-correct");
    });
  }

  state.totalAnswered++;
  recordItem(ex, isCorrect);
  state._lastCorrect = isCorrect;
  document.querySelectorAll(".ex-option").forEach((b) => {
    b.disabled = true;
    b.classList.add("is-disabled");
  });
  $("explanation-text").textContent = ex.explanation;
  $("explanation-block").classList.remove("hidden");

  // Report to adaptive engine (fire-and-forget)
  if (isLoggedIn()) {
    reportAdaptiveAnswer(state.topic || state.mode || "vocab", isCorrect);
    if (!isCorrect) logMistake(ex, chosen);
  }

  // Show SM-2 grade buttons
  const gradeRow = $("sr-grade-row");
  if (gradeRow) {
    gradeRow.classList.remove("hidden");
    // Pre-select based on answer
    gradeRow.querySelectorAll(".sr-grade-btn").forEach((btn) => {
      btn.classList.remove("active");
      btn.disabled = false;
    });
    // Auto-select: wrong=Again(0), correct=Good(4)
    const autoGrade = isCorrect ? 4 : 0;
    const autoBtn = gradeRow.querySelector(`.sr-grade-btn[data-grade="${autoGrade}"]`);
    if (autoBtn) autoBtn.classList.add("active");
    state._srGrade = autoGrade;
  }

  const reportBtn = $("btn-report-vocab");
  if (state.bankId) {
    reportBtn.classList.remove("hidden");
    reportBtn.disabled = false;
    reportBtn.textContent = "⚠ Virhe tehtävässä";
  } else {
    reportBtn.classList.add("hidden");
  }
}

$("btn-next").addEventListener("click", async () => {
  // Submit SR review with selected grade
  const ex = state.exercises[state.current];
  const grade = state._srGrade ?? (state._lastCorrect ? 4 : 0);

  // For review cards, wait for response and animate interval change
  if (ex._sr && isLoggedIn() && !state._srAnimationShown) {
    const srResponse = await srReview(ex, grade, state.language);
    if (srResponse) {
      showSrIntervalAnimation(srResponse, ex);
      state._srAnimationShown = true;
      return; // wait for user to click next again
    }
  } else {
    srReview(ex, grade, state.language);
  }

  state._srAnimationShown = false;

  // Hide grade row + animation
  const gradeRow = $("sr-grade-row");
  if (gradeRow) gradeRow.classList.add("hidden");
  removeSrAnimation();

  state.current++;
  if (state.current >= state.exercises.length) {
    endBatch();
  } else {
    renderVocabQuestion();
  }
});

function showSrIntervalAnimation(sr, ex) {
  const explBlock = $("explanation-block");
  if (!explBlock) return;

  const remembered = (sr.last_grade ?? 0) >= 3;
  const prev = sr.previousInterval || 0;
  const next = sr.interval_days || 1;

  // Remove any prior animation
  removeSrAnimation();

  const container = document.createElement("div");
  container.className = "sr-interval-wrap";
  container.innerHTML = `
    <div class="sr-interval-message ${remembered ? "remembered" : "forgot"}">
      ${remembered ? "✓ Muistit!" : "✗ Unohdit."}
    </div>
    <div class="sr-interval-animation">
      <div class="sr-interval-from">${prev > 0 ? prev + " pv" : "uusi"}</div>
      <div class="sr-interval-arrow">→</div>
      <div class="sr-interval-to ${remembered ? "" : "reset"}">${next} pv</div>
    </div>
    <div class="sr-review-meta" style="text-align:center">
      ${remembered
        ? `Seuraava kertaus ${next} päivän päästä`
        : `Palautetaan huomiseen`}
    </div>
  `;
  explBlock.appendChild(container);

  // Update button text
  const btn = $("btn-next");
  if (btn) btn.textContent = "Jatka →";
}

function removeSrAnimation() {
  document.querySelectorAll(".sr-interval-wrap").forEach(el => el.remove());
  const btn = $("btn-next");
  if (btn) btn.textContent = "Seuraava →";
}

// SM-2 grade button clicks
const gradeRow = $("sr-grade-row");
if (gradeRow) {
  gradeRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".sr-grade-btn");
    if (!btn) return;
    gradeRow.querySelectorAll(".sr-grade-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state._srGrade = parseInt(btn.dataset.grade);
  });
}

function endBatch() {
  // Mastery test: submit result and show mastery result screen
  if (state._masteryMode && state._masteryTopicKey) {
    const submit = window._learningPathRef?.submitMasteryResult;
    if (submit) {
      submit(state.totalCorrect, state.totalAnswered);
    }
    state._masteryMode = false;
    state._masteryTopicKey = null;
    return;
  }

  if (state.batchNumber >= MAX_BATCHES) {
    showVocabResults();
    return;
  }

  const levelIdx = LEVELS.indexOf(state.level);
  const pct = state.batchCorrect / BATCH_SIZE;

  let newLevelIdx = levelIdx;
  let arrowChar = "→";
  let arrowClass = "same";
  let subText = `${state.batchCorrect}/${BATCH_SIZE} oikein`;

  if (pct >= 0.75) {
    if (levelIdx < LEVELS.length - 1) {
      newLevelIdx = levelIdx + 1;
      arrowChar = "↑";
      arrowClass = "up";
      subText += " · taso nousee!";
    } else {
      subText += " · huipputaso saavutettu!";
    }
  } else if (state.batchCorrect === 0) {
    if (levelIdx > 0) {
      newLevelIdx = levelIdx - 1;
      arrowChar = "↓";
      arrowClass = "down";
      subText += " · taso laskee";
    } else {
      subText += " · jatketaan harjoittelua!";
    }
  } else {
    subText += ` · pysytään tasolla ${LEVELS[levelIdx]}`;
  }

  state.level = LEVELS[newLevelIdx];

  if (LEVELS.indexOf(state.level) > LEVELS.indexOf(state.peakLevel)) {
    state.peakLevel = state.level;
  }

  const arrowEl = $("level-arrow");
  arrowEl.textContent = arrowChar;
  arrowEl.className = "level-transition-arrow " + arrowClass;

  const levelDisplay = $("level-new");
  levelDisplay.className = "level-transition-display";
  if (arrowClass === "up") levelDisplay.classList.add("level-up");
  else if (arrowClass === "down") levelDisplay.classList.add("level-down");
  levelDisplay.textContent = state.level;

  $("level-sub").textContent = subText;
  $("level-next-round").textContent = state.batchNumber + 1;

  show("screen-level");
}

$("btn-continue").addEventListener("click", () => loadNextBatch());

function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  }
  return out;
}

function renderLearningBlock(items) {
  const section = $("results-learning");
  const body = $("results-learning-body");
  if (!section || !body) return;

  if (!items.length) { section.classList.add("hidden"); return; }

  const rights = dedupe(items.filter((i) => i.correct).map((i) => i.label));
  const wrongs = dedupe(items.filter((i) => !i.correct).map((i) => i.label));

  const parts = [];

  if (rights.length) {
    const shown = rights.slice(0, 5);
    const overflow = rights.length - shown.length;
    const text = shown.join(", ") + (overflow > 0 ? ` (+ ${overflow} muuta)` : "");
    parts.push(`<p class="results-learning-line ok"><span style="color:var(--success)">✓</span> <strong>Vahvistit:</strong> ${text}</p>`);
  }

  if (wrongs.length) {
    const bullets = wrongs.map((w) => `<li>${w}</li>`).join("");
    parts.push(`<p class="results-learning-line bad"><span style="color:var(--error)">✗</span> <strong>Harjoittele vielä:</strong></p><ul>${bullets}</ul>`);
  }

  body.innerHTML = parts.join("");
  section.classList.remove("hidden");
}

function showVocabResults() {
  const correct = state.totalCorrect;
  const total = state.totalAnswered;

  // L-PLAN-3 — when this session was launched from a curriculum lesson,
  // hand off to the dedicated post-session results card and skip the
  // free-practice results screen entirely. The card POSTs to /complete and
  // renders the AI tutorMessage + metacognitive prompt.
  const lessonCtx = getLessonContext();
  if (lessonCtx) {
    const items = state.sessionItems || [];
    const wrongAnswers = items
      .filter((i) => !(i.isCorrect ?? i.correct))
      .slice(0, 20)
      .map((i) => ({
        question: String(i.question || i.prompt || "").slice(0, 200),
        correctAnswer: String(i.correctAnswer || i.answer || i.label || "").slice(0, 200),
        studentAnswer: String(i.studentAnswer || "").slice(0, 200),
        topic_key: i.topic_key || null,
      }));
    try {
      _deps.saveProgress({
        mode: "vocab",
        level: state.peakLevel,
        scoreCorrect: correct,
        scoreTotal: total,
      });
    } catch { /* tracked downstream */ }
    import("./lessonResults.js").then((m) => m.showLessonResults({
      kurssiKey: lessonCtx.kurssiKey,
      lessonIndex: lessonCtx.lessonIndex,
      lessonFocus: lessonCtx.lessonFocus,
      lessonType: lessonCtx.lessonType,
      scoreCorrect: correct,
      scoreTotal: total,
      wrongAnswers,
    })).catch(() => { /* fall through to legacy screen if module fails */ });
    return;
  }

  $("results-score").textContent = `${correct} / ${total} oikein`;

  // Spec 2 §5 — populate new editorial result IDs.
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  $("res-score-tot").textContent = String(total);
  countUp($("res-score-num"), correct);
  countUp($("res-pct"), pct);
  $("res-mode-label").textContent = "VALMIS · SANASTO";
  $("res-time").textContent = new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
  const topicLbl = topicLabel(state.topic || "general vocabulary").toUpperCase();
  $("res-topic-label").textContent = topicLbl;
  const againMeta = $("res-again-meta");
  if (againMeta) againMeta.textContent = `SAMALLA AIHEELLA · ${topicLbl}`;
  $("res-coach").textContent = generateCoachLine({ scorePct: pct, sessionWeakestLabel: null });

  // Quick-glance stats strip
  const wrong = Math.max(0, total - correct);
  const elapsed = state.sessionStartTime ? Date.now() - state.sessionStartTime : 0;
  const statsEl = $("res-stats");
  if (statsEl) {
    countUp($("res-stat-correct"), correct);
    countUp($("res-stat-wrong"), wrong);
    $("res-stat-time").textContent = fmtElapsed(elapsed);
    statsEl.hidden = total === 0;
  }

  // Breakdown list — derived from state.sessionItems.
  const resList = $("res-list");
  if (resList) {
    resList.innerHTML = "";
    const items = state.sessionItems || [];
    items.forEach((it, idx) => {
      const row = document.createElement("div");
      const isCorrect = it.isCorrect ?? it.correct ?? false;
      row.className = `results__row results__row--${isCorrect ? "correct" : "wrong"}`;
      const n = String(idx + 1).padStart(2, "0");
      const q = (it.question || it.prompt || it.word || "").toString();
      const ans = (it.correctAnswer || it.answer || "").toString();
      row.innerHTML = `
        <span class="mono-num mono-num--md results__row-n">${n}</span>
        <span class="results__row-q">
          <span>${escapeHtml(q)}</span>
          ${isCorrect || !ans ? "" : `<span class="results__row-correct">${escapeHtml(ans)}</span>`}
        </span>
        <span class="results__row-mark" aria-label="${isCorrect ? "Oikein" : "Väärin"}">${isCorrect ? "✓" : "✗"}</span>
      `;
      resList.appendChild(row);
    });
  }

  const timerEl = $("results-timer");
  if (timerEl) {
    if (state.sessionStartTime) {
      const elapsed = Math.round((Date.now() - state.sessionStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      timerEl.textContent = mins > 0 ? `${mins} min ${secs} s` : `${secs} s`;
      timerEl.classList.remove("hidden");
    } else {
      timerEl.classList.add("hidden");
    }
  }

  renderLearningBlock(state.sessionItems || []);

  try {
    _deps.saveProgress({
      mode: "vocab",
      level: state.peakLevel,
      scoreCorrect: correct,
      scoreTotal: total,
    });
  } catch (err) {
    trackError("vocab_results_save", err.message);
  }

  trackExerciseCompleted(
    "vocab",
    state.peakLevel,
    correct,
    total,
    state.sessionStartTime ? Date.now() - state.sessionStartTime : 0
  );
  show("screen-results");
  // Celebration is an overlay — fire-and-forget so the result screen
  // renders underneath and is already visible when the overlay dismisses.
  maybeShowFirstCelebration();
  // Confetti for ≥80% — gated by reduced-motion inside the helper.
  if (total > 0) celebrateScore(pct);

  // Daily-cap nudge banner for free users at #15+ (Commit 10).
  renderCapBanner();
}

function renderCapBanner() {
  const host = document.querySelector("#screen-results .results");
  if (!host) return;
  // Remove any prior banner so we don't duplicate on restarts.
  host.querySelector(".results-cap-banner")?.remove();
  if (!shouldShowCapBanner()) return;
  const el = document.createElement("div");
  el.className = "results-cap-banner";
  el.textContent = CAP_BANNER_COPY;
  host.insertBefore(el, host.firstChild);
}

$("btn-restart").addEventListener("click", () => {
  state.batchNumber = 0;
  state.totalCorrect = 0;
  state.totalAnswered = 0;
  state.sessionItems = [];
  state.startLevel = state.level;
  state.peakLevel = state.level;
  state.sessionStartTime = Date.now();
  state.recentVocabHeadwords = [];
  loadNextBatch();
});

const btnBackHome = $("btn-back-home");
if (btnBackHome) {
  btnBackHome.addEventListener("click", () =>
    isLoggedIn() ? _deps.loadDashboard() : show("screen-start"),
  );
}

const shareVocabBtn = $("btn-share-vocab");
if (shareVocabBtn) {
  shareVocabBtn.addEventListener("click", async () => {
    shareVocabBtn.disabled = true;
    const original = shareVocabBtn.textContent;
    shareVocabBtn.textContent = "Luodaan kuvaa…";
    try {
      const elapsed = state.sessionStartTime ? Date.now() - state.sessionStartTime : 0;
      await generateExerciseShareCard({
        kind: "vocab",
        correct: state.totalCorrect || 0,
        total: state.totalAnswered || 0,
        topicLabel: topicLabel(state.topic || "general vocabulary"),
        level: state.level || "",
        elapsedMs: elapsed,
      });
      shareVocabBtn.textContent = "Tallennettu ✓";
      setTimeout(() => { shareVocabBtn.textContent = original; shareVocabBtn.disabled = false; }, 1800);
    } catch (err) {
      console.error("Share card generation failed:", err);
      shareVocabBtn.textContent = "Yritä uudelleen";
      setTimeout(() => { shareVocabBtn.textContent = original; shareVocabBtn.disabled = false; }, 1800);
    }
  });
}
