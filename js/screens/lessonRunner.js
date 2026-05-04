/**
 * L-COURSE-1 UPDATE 4-6 — phase-based lesson runner for pre-generated lesson JSON.
 *
 * Activates only when /api/curriculum/:k/lesson/:i returns a `pregenerated`
 * payload (schemas/lesson.json shape). Legacy runtime-OpenAI lessons keep using
 * js/screens/curriculum.js renderLessonPage().
 *
 * Pedagogy (skills referenced):
 *  - education/practice-problem-sequence-designer — phase order is authored, runner executes
 *  - education/formative-assessment-loop-designer — instant feedback per item
 *  - education/self-efficacy-builder-sequence — mastery banner copy never shames
 *  - education/spaced-practice-scheduler — failedItems carry into compatible later phases
 *  - puheo-finnish-voice — all copy is sinä-form, concrete, no superlatives
 */
import { show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { masteryThresholdFor, isPhaseSkipped } from "../lib/lessonAdapter.js";

const ROOT_ID = "lesson-runner-root";

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Normalise answers for typed/translate: lowercase, trim, strip diacritics.
function normalizeAnswer(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}
function answerMatches(input, accepts) {
  const norm = normalizeAnswer(input);
  if (!norm) return false;
  return (accepts || []).some((a) => normalizeAnswer(a) === norm);
}

// ── Lesson runner state ────────────────────────────────────────────────────

function makeState(lesson, targetGrade, kurssiKey, lessonIndex) {
  const phases = (lesson.phases || []).filter((p) => !isPhaseSkipped(p, targetGrade));
  return {
    lesson,
    kurssiKey,
    lessonIndex,
    targetGrade,
    phases,
    currentPhaseIdx: 0,
    currentItemIdx: 0,
    correctInPhase: 0,
    answeredInPhase: 0,
    phaseResults: [], // { phaseId, title, correct, total, mastered, skipped }
    sidePanelOpen: false,
    sidePanelOpenMs: 0,
    sidePanelOpenedAt: 0,
    startedAt: Date.now(),
    finished: false,
  };
}

// ── Public entry ───────────────────────────────────────────────────────────

export function runPregeneratedLesson(payload, kurssiKey, lessonIndex, targetGrade) {
  const lesson = payload.pregenerated || payload;
  ensureRoot();
  show("screen-lesson");
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  const state = makeState(lesson, targetGrade || "B", kurssiKey, lessonIndex);
  // Persist context for nav-away guards.
  try {
    sessionStorage.setItem("currentLesson", JSON.stringify({
      kurssiKey, lessonIndex,
      lessonFocus: lesson.meta?.title || "",
      lessonType: lesson.meta?.lesson_type || "",
      targetGrade: state.targetGrade,
      isPregenerated: true,
    }));
  } catch { /* private mode */ }
  renderTeaching(root, state);
}

function ensureRoot() {
  let screen = document.getElementById("screen-lesson");
  if (!screen) {
    screen = document.createElement("div");
    screen.id = "screen-lesson";
    screen.className = "screen";
    document.querySelector(".app-main")?.appendChild(screen) || document.body.appendChild(screen);
  }
  if (!document.getElementById(ROOT_ID)) {
    screen.innerHTML = `<div id="${ROOT_ID}"></div>`;
  }
}

// ── Step 1: teaching page ──────────────────────────────────────────────────

function renderTeaching(root, state) {
  const meta = state.lesson.meta || {};
  const teaching = state.lesson.teaching || {};
  const intro = renderSimpleMd(teaching.intro_md || "");
  const keyPoints = Array.isArray(teaching.key_points) ? teaching.key_points : [];
  const keyHtml = keyPoints.length
    ? `<ul class="lr-keypoints">${keyPoints.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul>`
    : "";

  root.innerHTML = `
    <div class="lr-shell">
      <button type="button" class="lr-back" id="lr-back">← Oppimispolku</button>
      <header class="lr-hero">
        <p class="lr-eyebrow">${escapeHtml(meta.course_key || "")} · Oppitunti ${escapeHtml(String(meta.lesson_index || ""))}</p>
        <h1>${escapeHtml(meta.title || "Oppitunti")}</h1>
        ${meta.description ? `<p class="lr-desc">${escapeHtml(meta.description)}</p>` : ""}
      </header>
      <article class="lr-teaching">${intro}${keyHtml}</article>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-start">Aloita harjoittelu →</button>
        <p class="lr-hint">Voit avata Apua-paneelin milloin tahansa harjoituksen aikana.</p>
      </div>
    </div>`;
  document.getElementById("lr-back")?.addEventListener("click", () => {
    import("./curriculum.js").then((m) => m.loadCurriculum());
  });
  document.getElementById("lr-start")?.addEventListener("click", () => {
    state.startedAt = Date.now();
    renderPhase(root, state);
  });
}

// ── Step 2: phase + item rendering ─────────────────────────────────────────

function renderPhase(root, state) {
  const phase = state.phases[state.currentPhaseIdx];
  if (!phase) return finalizeLesson(root, state);

  const totalPhases = state.phases.length;
  const stepper = phaseStepper(state);
  const item = phase.items[state.currentItemIdx];
  if (!item) {
    // Phase complete — show banner.
    return renderPhaseBanner(root, state, phase, "completed");
  }

  root.innerHTML = `
    <div class="lr-shell lr-shell--exercise">
      <div class="lr-topbar">
        <div class="lr-topbar-progress">
          <span class="lr-step-label">Vaihe ${state.currentPhaseIdx + 1} / ${totalPhases}</span>
          ${stepper}
        </div>
        <div class="lr-topbar-actions">
          <button type="button" class="lr-help-btn" id="lr-help-toggle" aria-expanded="${state.sidePanelOpen ? "true" : "false"}" aria-controls="lr-side-panel">📖 Apua</button>
          <button type="button" class="lr-skip-btn" id="lr-skip">Olen valmis tästä</button>
        </div>
      </div>
      <header class="lr-phase-head">
        <h2 class="lr-phase-title">${escapeHtml(phase.title || "Vaihe")}</h2>
        ${phase.instruction ? `<p class="lr-phase-instr">${escapeHtml(phase.instruction)}</p>` : ""}
        <p class="lr-item-counter">Kysymys ${state.currentItemIdx + 1} / ${phase.items.length}</p>
      </header>
      <div class="lr-item" id="lr-item">${renderItem(item, state)}</div>
      ${renderSidePanel(state)}
    </div>`;

  wireExerciseHandlers(root, state, item);
}

function phaseStepper(state) {
  const dots = state.phases.map((_, i) => {
    if (i < state.currentPhaseIdx) return '<span class="lr-step lr-step--done" aria-hidden="true">●</span>';
    if (i === state.currentPhaseIdx) return '<span class="lr-step lr-step--current" aria-hidden="true">●</span>';
    return '<span class="lr-step" aria-hidden="true">○</span>';
  }).join("");
  return `<span class="lr-stepper" aria-hidden="true">${dots}</span>`;
}

// ── Item type renderers ────────────────────────────────────────────────────

function renderItem(item, _state) {
  switch (item.item_type) {
    case "mc": return renderMC(item);
    case "typed": return renderTyped(item);
    case "translate": return renderTranslate(item);
    case "match": return renderMatch(item);
    case "gap_fill": return renderGapFill(item);
    case "writing": return renderWritingItem(item);
    case "reading_mc": return renderReadingMC(item);
    default:
      return `<p class="lr-unsupported">Tehtävätyyppiä "${escapeHtml(item.item_type || "?")}" ei tueta — ohitetaan.</p>
        <button type="button" class="btn btn-primary" data-lr-skip-item>Jatka</button>`;
  }
}

function renderMC(item) {
  const ctx = item.context ? `<p class="lr-mc-context">${escapeHtml(item.context)}</p>` : "";
  return `
    <div class="lr-mc">
      ${ctx}
      <p class="lr-mc-stem">${escapeHtml(item.stem || "")}</p>
      <div class="lr-mc-choices" role="radiogroup">
        ${(item.choices || []).map((c, i) => `
          <button type="button" class="lr-mc-choice" data-mc-idx="${i}" role="radio" aria-checked="false">${escapeHtml(c)}</button>
        `).join("")}
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderTyped(item) {
  const dirLabel = item.direction === "es_to_fi" ? "Käännä suomeksi" : "Käännä espanjaksi";
  return `
    <div class="lr-typed">
      <p class="lr-typed-dir">${dirLabel}</p>
      <p class="lr-typed-prompt">${escapeHtml(item.prompt || "")}</p>
      ${item.hint ? `<p class="lr-typed-hint">Vihje: ${escapeHtml(item.hint)}</p>` : ""}
      <input type="text" class="lr-typed-input" id="lr-typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <button type="button" class="btn btn-primary" id="lr-typed-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderTranslate(item) {
  return renderTyped({ ...item, prompt: item.source });
}

function renderMatch(item) {
  const lefts = (item.pairs || []).map((p) => p.left);
  const rights = shuffle((item.pairs || []).map((p) => p.right));
  return `
    <div class="lr-match" data-match>
      <p class="lr-match-instr">Yhdistä parit klikkaamalla.</p>
      <div class="lr-match-cols">
        <div class="lr-match-col">
          ${lefts.map((l, i) => `<button type="button" class="lr-match-cell" data-side="left" data-idx="${i}">${escapeHtml(l)}</button>`).join("")}
        </div>
        <div class="lr-match-col">
          ${rights.map((r) => `<button type="button" class="lr-match-cell" data-side="right" data-val="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join("")}
        </div>
      </div>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderGapFill(item) {
  // Replace {1} {2} ... with input slots.
  const tpl = item.sentence_template || "";
  const html = escapeHtml(tpl).replace(/\{(\d+)\}/g, (_m, n) =>
    `<input type="text" class="lr-gap-input" data-gap="${n}" autocomplete="off" autocapitalize="off" spellcheck="false" />`
  );
  const bank = Array.isArray(item.word_bank) && item.word_bank.length
    ? `<div class="lr-gap-bank">${item.word_bank.map((w) => `<span class="lr-gap-chip">${escapeHtml(w)}</span>`).join("")}</div>`
    : "";
  return `
    <div class="lr-gap">
      <p class="lr-gap-sentence">${html}</p>
      ${bank}
      <button type="button" class="btn btn-primary" id="lr-gap-submit">Tarkista</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderWritingItem(item) {
  return `
    <div class="lr-writing">
      <p class="lr-writing-prompt">${escapeHtml(item.prompt || "")}</p>
      <p class="lr-writing-meta">${item.min_words || 0}–${item.max_words || 0} sanaa</p>
      <textarea class="lr-writing-input" id="lr-writing-input" rows="8"></textarea>
      <button type="button" class="btn btn-primary" id="lr-writing-submit">Lähetä</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

function renderReadingMC(item) {
  const passage = escapeHtml(item.passage || "").replace(/\n/g, "<br>");
  const qs = (item.questions || []).map((q, qi) => `
    <fieldset class="lr-reading-q" data-q="${qi}">
      <legend>${escapeHtml(q.question_fi || "")}</legend>
      ${(q.choices || []).map((c, ci) => `
        <label class="lr-reading-choice"><input type="radio" name="lr-q-${qi}" value="${ci}"> ${escapeHtml(c)}</label>
      `).join("")}
    </fieldset>
  `).join("");
  return `
    <div class="lr-reading">
      <article class="lr-reading-passage">${passage}</article>
      <div class="lr-reading-qs">${qs}</div>
      <button type="button" class="btn btn-primary" id="lr-reading-submit">Tarkista vastaukset</button>
      <div class="lr-feedback" id="lr-feedback" hidden></div>
    </div>`;
}

// ── Item handlers ──────────────────────────────────────────────────────────

function wireExerciseHandlers(root, state, item) {
  document.getElementById("lr-help-toggle")?.addEventListener("click", () => toggleSidePanel(root, state));
  document.getElementById("lr-skip")?.addEventListener("click", () => onSkipPhase(root, state));
  root.querySelector("[data-lr-skip-item]")?.addEventListener("click", () => advanceItem(root, state, true));

  if (item.item_type === "mc") {
    root.querySelectorAll(".lr-mc-choice").forEach((b) => {
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.mcIdx);
        const correct = idx === Number(item.correct_index);
        showItemFeedback(root, correct, item.explanation || "");
        markChoices(root, item.correct_index, idx);
        recordAnswer(state, correct);
        scheduleAdvance(root, state);
      });
    });
  } else if (item.item_type === "typed" || item.item_type === "translate") {
    const input = document.getElementById("lr-typed-input");
    const submit = document.getElementById("lr-typed-submit");
    const tryIt = () => {
      const accepts = item.item_type === "translate" ? item.accept : item.accept;
      const ok = answerMatches(input.value, accepts);
      const expected = (accepts && accepts[0]) || "";
      showItemFeedback(root, ok, ok ? "" : `Oikea vastaus: ${expected}`);
      recordAnswer(state, ok);
      scheduleAdvance(root, state);
    };
    submit?.addEventListener("click", tryIt);
    input?.addEventListener("keydown", (e) => { if (e.key === "Enter") tryIt(); });
    input?.focus();
  } else if (item.item_type === "match") {
    wireMatch(root, state, item);
  } else if (item.item_type === "gap_fill") {
    document.getElementById("lr-gap-submit")?.addEventListener("click", () => {
      const inputs = root.querySelectorAll(".lr-gap-input");
      let allOk = true;
      const expected = [];
      inputs.forEach((inp, i) => {
        const accepts = (item.answers && item.answers[i]) || [];
        const ok = answerMatches(inp.value, accepts);
        if (!ok) allOk = false;
        expected.push((accepts[0] || "?"));
      });
      showItemFeedback(root, allOk, allOk ? "" : `Oikeat vastaukset: ${expected.join(", ")}`);
      recordAnswer(state, allOk);
      scheduleAdvance(root, state);
    });
  } else if (item.item_type === "writing") {
    document.getElementById("lr-writing-submit")?.addEventListener("click", () => {
      const text = document.getElementById("lr-writing-input")?.value || "";
      const wc = (text.trim().match(/\S+/g) || []).length;
      const ok = wc >= (item.min_words || 0);
      showItemFeedback(root, ok, ok ? "Kirjoituksesi on tallennettu." : `Sanamäärä on ${wc} — tavoite vähintään ${item.min_words}.`);
      recordAnswer(state, ok);
      scheduleAdvance(root, state);
    });
  } else if (item.item_type === "reading_mc") {
    document.getElementById("lr-reading-submit")?.addEventListener("click", () => {
      let correct = 0;
      const total = (item.questions || []).length;
      (item.questions || []).forEach((q, qi) => {
        const checked = root.querySelector(`input[name="lr-q-${qi}"]:checked`);
        if (checked && Number(checked.value) === Number(q.correct_index)) correct++;
      });
      const ok = correct === total;
      showItemFeedback(root, ok, ok ? "Kaikki oikein." : `${correct}/${total} oikein.`);
      // Reading items count as one item but proportional credit.
      state.correctInPhase += (correct / total);
      state.answeredInPhase += 1;
      scheduleAdvance(root, state, false);
    });
  }
}

function wireMatch(root, state, item) {
  let leftSel = null;
  const matched = new Set();
  const total = (item.pairs || []).length;
  let correct = 0;
  root.querySelectorAll(".lr-match-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      if (matched.has(cell)) return;
      const side = cell.dataset.side;
      if (side === "left") {
        root.querySelectorAll('.lr-match-cell[data-side="left"]').forEach((c) => c.classList.remove("is-active"));
        cell.classList.add("is-active");
        leftSel = cell;
      } else if (leftSel) {
        const li = Number(leftSel.dataset.idx);
        const expected = item.pairs[li]?.right;
        const got = cell.dataset.val;
        if (expected && got && normalizeAnswer(expected) === normalizeAnswer(got)) {
          leftSel.classList.add("is-matched");
          cell.classList.add("is-matched");
          matched.add(leftSel); matched.add(cell);
          leftSel = null;
          correct++;
          if (correct === total) {
            showItemFeedback(root, true, "Kaikki parit oikein.");
            recordAnswer(state, true);
            scheduleAdvance(root, state);
          }
        } else {
          cell.classList.add("is-wrong");
          setTimeout(() => cell.classList.remove("is-wrong"), 600);
        }
      }
    });
  });
}

function showItemFeedback(root, correct, msg) {
  const fb = root.querySelector("#lr-feedback");
  if (!fb) return;
  fb.hidden = false;
  fb.className = `lr-feedback ${correct ? "is-correct" : "is-wrong"}`;
  fb.textContent = correct
    ? (msg || "Oikein.")
    : (msg || "Ei aivan.");
}

function markChoices(root, correctIdx, pickedIdx) {
  root.querySelectorAll(".lr-mc-choice").forEach((b) => {
    const i = Number(b.dataset.mcIdx);
    b.disabled = true;
    if (i === correctIdx) b.classList.add("is-correct");
    if (i === pickedIdx && pickedIdx !== correctIdx) b.classList.add("is-wrong");
  });
}

function recordAnswer(state, correct) {
  state.answeredInPhase += 1;
  if (correct) state.correctInPhase += 1;
}

function scheduleAdvance(root, state, advanceItem_ = true) {
  setTimeout(() => advanceItem_ ? advanceItem(root, state, false) : advanceItem(root, state, false), 1100);
}

function advanceItem(root, state, _skipped) {
  const phase = state.phases[state.currentPhaseIdx];
  state.currentItemIdx += 1;
  if (state.currentItemIdx >= phase.items.length) {
    return renderPhaseBanner(root, state, phase, "completed");
  }
  renderPhase(root, state);
}

// ── Phase end ─────────────────────────────────────────────────────────────

function renderPhaseBanner(root, state, phase, mode) {
  const total = state.answeredInPhase || phase.items.length;
  const correct = Math.round(state.correctInPhase);
  const pct = total > 0 ? state.correctInPhase / total : 0;
  const threshold = masteryThresholdFor(phase, state.targetGrade);
  const skipped = mode === "skipped";
  const mastered = !skipped && pct >= threshold;
  state.phaseResults.push({
    phaseId: phase.phase_id,
    title: phase.title,
    correct,
    total,
    pct,
    threshold,
    mastered,
    skipped,
  });

  let title, message;
  if (skipped) {
    title = "Vaihe ohitettu";
    message = "Sanat palaavat kertaussessioon myöhemmin — niitä ei jätetä unohduksiin.";
  } else if (mastered) {
    title = "Hallitset tämän";
    message = `Sait ${correct} / ${total} oikein — jatketaan seuraavaan vaiheeseen.`;
  } else if (pct >= 0.5) {
    title = "Lähellä — vielä yksi pyyhkäisy";
    message = `${correct} / ${total} oikein. Sanat joissa horjuit palaavat seuraavissa vaiheissa.`;
  } else {
    title = "Tämä kaipaa toistoa";
    message = `${correct} / ${total} oikein. Et ole yksin — tämä rakenne vaatii toistoa, ei eri sääntöä.`;
  }

  const isLast = state.currentPhaseIdx + 1 >= state.phases.length;

  root.innerHTML = `
    <div class="lr-shell lr-shell--banner">
      <div class="lr-banner ${mastered ? "is-mastered" : skipped ? "is-skipped" : "is-almost"}">
        <p class="lr-banner-eyebrow">${escapeHtml(phase.title || "Vaihe")}</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <button type="button" class="btn btn-primary" id="lr-next">${isLast ? "Näytä yhteenveto" : "Seuraava vaihe →"}</button>
      </div>
    </div>`;
  document.getElementById("lr-next")?.addEventListener("click", () => {
    state.currentPhaseIdx += 1;
    state.currentItemIdx = 0;
    state.correctInPhase = 0;
    state.answeredInPhase = 0;
    if (state.currentPhaseIdx >= state.phases.length) {
      finalizeLesson(root, state);
    } else {
      renderPhase(root, state);
    }
  });
}

function onSkipPhase(root, state) {
  const ok = window.confirm("Ohita tämä vaihe? Sanat palaavat kertaussessioon myöhemmin.");
  if (!ok) return;
  const phase = state.phases[state.currentPhaseIdx];
  renderPhaseBanner(root, state, phase, "skipped");
}

// ── Step 4: lesson results ─────────────────────────────────────────────────

function finalizeLesson(root, state) {
  if (state.finished) return;
  state.finished = true;
  const totalCorrect = state.phaseResults.reduce((s, p) => s + (p.skipped ? 0 : p.correct), 0);
  const totalAsked = state.phaseResults.reduce((s, p) => s + (p.skipped ? 0 : p.total), 0);
  const elapsedMin = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
  const tg = state.targetGrade;
  const tutorMsg = buildTutorMessage(tg, state.phaseResults);
  const yo = state.lesson.meta?.yo_relevance || "";

  const phasesHtml = state.phaseResults.map((r) => {
    const cls = r.skipped ? "lr-result-skipped" : r.mastered ? "lr-result-mastered" : "lr-result-almost";
    const status = r.skipped ? "Ohitettu" : r.mastered ? "Hallitset" : "Lähellä";
    return `<li class="lr-result-row ${cls}">
      <span class="lr-result-title">${escapeHtml(r.title || "")}</span>
      <span class="lr-result-status">${status}${r.skipped ? "" : ` · ${r.correct}/${r.total}`}</span>
    </li>`;
  }).join("");

  root.innerHTML = `
    <div class="lr-shell lr-shell--results">
      <header class="lr-hero">
        <p class="lr-eyebrow">Yhteenveto</p>
        <h1>${escapeHtml(state.lesson.meta?.title || "Oppitunti")}</h1>
      </header>
      <div class="lr-result-summary">
        <div class="lr-result-stat"><span class="lr-result-num">${totalCorrect}/${totalAsked || 0}</span><span class="lr-result-lbl">oikein</span></div>
        <div class="lr-result-stat"><span class="lr-result-num">${elapsedMin}</span><span class="lr-result-lbl">min</span></div>
      </div>
      <div class="lr-tutor">${escapeHtml(tutorMsg)}</div>
      ${yo ? `<aside class="lr-yo">
        <p class="lr-yo-eyebrow">Tämä YO-kokeessa</p>
        <p>${escapeHtml(yo)}</p>
      </aside>` : ""}
      <ol class="lr-results-list">${phasesHtml}</ol>
      <div class="lr-actions">
        <button type="button" class="btn btn-primary" id="lr-done">Takaisin oppimispolulle →</button>
      </div>
    </div>`;
  document.getElementById("lr-done")?.addEventListener("click", () => {
    import("./curriculum.js").then((m) => m.loadCurriculum());
  });

  // Persist completion to backend (best-effort).
  if (isLoggedIn() && totalAsked > 0) {
    apiFetch(`${API}/api/curriculum/${encodeURIComponent(state.kurssiKey)}/lesson/${state.lessonIndex}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        scoreCorrect: totalCorrect,
        scoreTotal: totalAsked,
        wrongAnswers: [],
        reviewItems: [],
      }),
    }).catch(() => { /* non-critical */ });
  }
}

function buildTutorMessage(targetGrade, phaseResults) {
  const skipped = phaseResults.filter((r) => r.skipped).length;
  const mastered = phaseResults.filter((r) => !r.skipped && r.mastered).length;
  const almost = phaseResults.filter((r) => !r.skipped && !r.mastered).length;
  if (targetGrade === "L" || targetGrade === "E") {
    if (almost === 0 && skipped === 0) return "L/E-tavoite vaatii ~85–95 % YO-kokeessa — tämän tunnin sanat ovat sinulla automaattisia. Eteenpäin.";
    return `${almost} vaihe${almost === 1 ? "" : "tta"} jäi alle hallintarajan. L/E-tavoite ei salli horjuvia perusrakenteita — palaa näihin huomenna kertauksessa.`;
  }
  if (targetGrade === "I" || targetGrade === "A") {
    if (almost === 0 && skipped === 0) return "Hyvä alku. I/A-tavoite tarvitsee perussanaston tunnistustasolla — olet nyt siellä.";
    return `Et ole yksin. I/A-tavoitteelle riittää tunnistus, ei kaikki sanat tarvitse olla automaattisia heti. Sanat palaavat kertauksessa.`;
  }
  if (mastered === phaseResults.length) return "Tunti meni kuten pitikin. Jatketaan seuraavaan oppituntiin samalla rytmillä.";
  if (almost > 0) return `${almost} vaihetta jäi alle hallintarajan. Sanat palaavat seuraavassa kertaussessiossa — tämä on osa rytmiä, ei takaisku.`;
  return "Tunti suoritettu.";
}

// ── Side panel ─────────────────────────────────────────────────────────────

function renderSidePanel(state) {
  const tabs = state.lesson.side_panel?.tabs || [];
  if (!tabs.length) return "";
  const tabsHtml = tabs.map((t, i) => `
    <button type="button" class="lr-tab ${i === 0 ? "is-active" : ""}" data-tab="${escapeHtml(t.id)}">${escapeHtml(t.title || t.id)}</button>
  `).join("");
  const panesHtml = tabs.map((t, i) => `
    <div class="lr-tab-pane ${i === 0 ? "is-active" : ""}" data-pane="${escapeHtml(t.id)}">
      ${renderSimpleMd(t.content_md || "")}
    </div>
  `).join("");
  return `
    <aside id="lr-side-panel" class="lr-side-panel ${state.sidePanelOpen ? "is-open" : ""}" aria-hidden="${state.sidePanelOpen ? "false" : "true"}">
      <div class="lr-side-tabs" role="tablist">${tabsHtml}</div>
      <div class="lr-side-panes">${panesHtml}</div>
    </aside>`;
}

function toggleSidePanel(root, state) {
  state.sidePanelOpen = !state.sidePanelOpen;
  if (state.sidePanelOpen) state.sidePanelOpenedAt = Date.now();
  else if (state.sidePanelOpenedAt) {
    state.sidePanelOpenMs += Date.now() - state.sidePanelOpenedAt;
    state.sidePanelOpenedAt = 0;
  }
  const panel = root.querySelector("#lr-side-panel");
  const btn = root.querySelector("#lr-help-toggle");
  if (panel) {
    panel.classList.toggle("is-open", state.sidePanelOpen);
    panel.setAttribute("aria-hidden", state.sidePanelOpen ? "false" : "true");
  }
  if (btn) {
    btn.setAttribute("aria-expanded", state.sidePanelOpen ? "true" : "false");
    btn.textContent = state.sidePanelOpen ? "✕ Sulje" : "📖 Apua";
  }
  // Wire tabs lazily.
  root.querySelectorAll(".lr-tab").forEach((t) => {
    t.onclick = () => {
      root.querySelectorAll(".lr-tab").forEach((x) => x.classList.toggle("is-active", x === t));
      const id = t.dataset.tab;
      root.querySelectorAll(".lr-tab-pane").forEach((p) => p.classList.toggle("is-active", p.dataset.pane === id));
    };
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tiny markdown subset: headers, paragraphs, lists, bold/italic, code.
function renderSimpleMd(md) {
  if (!md) return "";
  const lines = String(md).split(/\r?\n/);
  const out = [];
  let para = [];
  let inList = false;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  function inline(s) {
    let t = escapeHtml(s);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    return t;
  }
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (/^#{1,3}\s/.test(line)) {
      flushPara(); flushList();
      const lvl = line.startsWith("### ") ? 3 : line.startsWith("## ") ? 2 : 1;
      out.push(`<h${lvl}>${inline(line.replace(/^#{1,3}\s+/, ""))}</h${lvl}>`);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
    } else if (/^\s*$/.test(line)) {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();
  return out.join("\n");
}
