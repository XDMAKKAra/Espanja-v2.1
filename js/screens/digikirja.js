/**
 * digikirja.js — Otava Fokus 7 -style three-panel lesson screen.
 *
 * PR 1 (2026-05-19): shipped the pohjarakenne with hardcoded sample data.
 * PR 2 (2026-05-19): fetch real lesson JSON from data/courses/{lang}/
 *   {kurssi_key}/lesson_{n}.json. Derive a virtual sivut array — teoria
 *   (rendered from teaching.intro_md via markdownLite), one exercise
 *   sivu per phase, plus flashcards + testi + arvio placeholders that
 *   PRs 4–7 will replace with real components.
 *
 * Route: #/oppitunti/{lang}/{kurssi}/{lesson}/{sivu}
 */

import { show } from "../ui/nav.js";
import { renderTeoriaMarkdown } from "../lib/markdownLite.js";
import { isAcceptable } from "../lib/accentTolerance.js";

const LS_SIDEMENU = "puheo:dk:sidemenu";
const SIDEMENU_OPEN = "open";
const SIDEMENU_COLLAPSED = "collapsed";

const KIND_GROUP = {
  teoria: "Opetus",
  tehtava: "Harjoitukset",
  flashcards: "Kortit",
  testi: "Testit",
  itsearviointi: "Itsearvio",
};

// PR3 — distinct minimal-stroke SVG per sivu kind. Following impeccable
// + ui-ux-pro-max bans, we do NOT use emoji glyphs. Each path uses a
// 24×24 viewBox + 1.6 stroke and inherits currentColor so the active /
// muted states match the row text colour.
const KIND_GLYPH = {
  teoria: `<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 5.5a1.5 1.5 0 0 1 1.5-1.5h5A2.5 2.5 0 0 1 13 6.5V20"/>
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4h-5A2.5 2.5 0 0 0 11 6.5V20"/>
    <path d="M4 5.5V19a1 1 0 0 0 1 1h5"/>
    <path d="M20 5.5V19a1 1 0 0 1-1 1h-5"/>
  </svg>`,
  tehtava: `<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="m18 2 4 4-9.5 9.5L8 17l1.5-4.5L18 2.5"/>
  </svg>`,
  flashcards: `<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3.5" y="6.5" width="13" height="11" rx="2"/>
    <path d="M7.5 4.5h11a2 2 0 0 1 2 2v9"/>
  </svg>`,
  testi: `<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
    <path d="m8.5 12.5 2.5 2.5 4.5-5"/>
  </svg>`,
  itsearviointi: `<svg class="dk__row-glyph" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3.5 14.6 9l6 .55-4.55 4.05L17.4 20 12 16.9 6.6 20l1.35-6.4L3.4 9.55 9.4 9z"/>
  </svg>`,
};
function glyphFor(kind) {
  return KIND_GLYPH[kind] || KIND_GLYPH.tehtava;
}

const FLASHCARD_PACK_SIZE = 5;
const LS_FLASHCARD_PREFIX = "puheo:dk:flashcards";

const KIND_PLACEHOLDER = {};

let _wired = false;
let _route = { lang: "es", kurssiKey: "kurssi_2", lessonIndex: 3, sivuId: "teoria" };
let _lesson = null;     // { meta, teaching, phases, vocab, side_panel }
let _sivut = [];        // virtual sivu list derived from _lesson
let _loadKey = "";      // dedupe / cancellation token

// ─── Helpers ─────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function readSidemenuPref() {
  try {
    const v = localStorage.getItem(LS_SIDEMENU);
    return v === SIDEMENU_COLLAPSED ? SIDEMENU_COLLAPSED : SIDEMENU_OPEN;
  } catch {
    return SIDEMENU_OPEN;
  }
}
function writeSidemenuPref(v) {
  try { localStorage.setItem(LS_SIDEMENU, v); } catch { /* noop */ }
}

function langLabel(lang) {
  return lang === "fr" ? "Ranska" : lang === "de" ? "Saksa" : "Espanja";
}

function lessonFileUrl(route) {
  // The static repo root is mounted at /, so data/courses/... is fetchable
  // directly without an API hop. This keeps the digikirja screen working
  // even when USE_PREGENERATED_LESSONS=false on the server.
  return `/data/courses/${encodeURIComponent(route.lang)}/${encodeURIComponent(route.kurssiKey)}/lesson_${encodeURIComponent(route.lessonIndex)}.json`;
}

async function fetchLesson(route) {
  const url = lessonFileUrl(route);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`lesson fetch ${res.status}`);
  return res.json();
}

// Build the SideMenu sivut array from real lesson data. PR 2 keeps the
// phase mapping simple: one numbered exercise sivu per phase. PR 3+ may
// split long phases into a/b sub-sivu pairs to match the Otava idiom.
function buildSivut(lesson) {
  const out = [];
  // 1. Teoriasivu — always first.
  out.push({
    id: "teoria",
    kind: "teoria",
    num: "",
    title: lesson?.meta?.title || "Opetus",
    meta: "Opetussivu",
  });

  // 2. Exercise sivut — one per phase, numbered 1..N.
  const phases = Array.isArray(lesson?.phases) ? lesson.phases : [];
  phases.forEach((phase, i) => {
    const num = String(i + 1);
    const title = phase.title || `Vaihe ${num}`;
    const itemCount = Array.isArray(phase.items) ? phase.items.length : 0;
    out.push({
      id: `phase-${i}`,
      kind: "tehtava",
      num,
      title,
      meta: itemCount ? `${itemCount} kohtaa` : "Tehtävä",
    });
  });

  // 3. Flashcards sivu — first FLASHCARD_PACK_SIZE entries from lesson.vocab.
  const vocab = Array.isArray(lesson?.vocab) ? lesson.vocab : [];
  const cardCount = Math.min(vocab.length, FLASHCARD_PACK_SIZE);
  if (cardCount > 0) {
    out.push({
      id: "kortit-1",
      kind: "flashcards",
      num: "",
      title: `Kääntökortit · ${lesson?.meta?.title || ""}`.trim(),
      meta: `${cardCount} korttia`,
    });
  }

  // 4. Test sivut — sample real items from existing phases. The student
  // experience is summative (no live feedback per kohta) so we want the
  // test to draw on material they've already practised in the exercise
  // phases above. Pick translate (fi → es) and mc as the two anchors.
  const findPhaseByItemType = (kind) => phases.findIndex(
    (p) => Array.isArray(p.items) && p.items[0]?.item_type === kind,
  );
  const translatePhase = findPhaseByItemType("translate");
  const mcPhase = findPhaseByItemType("mc");
  const TEST_LIMIT = 6;
  if (translatePhase >= 0) {
    const count = Math.min(TEST_LIMIT, (phases[translatePhase].items || []).length);
    out.push({
      id: "test-1",
      kind: "testi",
      num: "T1",
      title: "Test 1 · Käännä",
      meta: `${count} kohtaa`,
      testDef: { sourcePhase: translatePhase, count, label: "Käännä espanjaksi" },
    });
  }
  if (mcPhase >= 0) {
    const count = Math.min(TEST_LIMIT, (phases[mcPhase].items || []).length);
    out.push({
      id: "test-2",
      kind: "testi",
      num: "T2",
      title: "Test 2 · Valitse",
      meta: `${count} kohtaa`,
      testDef: { sourcePhase: mcPhase, count, label: "Valitse oikea vaihtoehto" },
    });
  }

  // 5. Itsearviointi — always last.
  out.push({
    id: "arvio",
    kind: "itsearviointi",
    num: "",
    title: "Arvioi omia taitojasi",
    meta: "Itsearvio",
  });

  return out;
}

function findSivuIndex(sivuId) {
  const i = _sivut.findIndex((s) => s.id === sivuId);
  return i >= 0 ? i : 0;
}

// ─── Rendering ─────────────────────────────────────────────────────────

function renderTopbar() {
  const meta = _lesson?.meta || {};
  const courseTitle = meta.course_key || _route.kurssiKey || "";
  const title = meta.title || "Oppitunti";
  return `
    <header class="dk__topbar" role="banner">
      <button type="button" class="dk__tool" id="dk-toggle-sidemenu"
              aria-label="Avaa tai sulje sisällysluettelo"
              aria-pressed="false">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="12" x2="14" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>
      <nav class="dk__breadcrumb" aria-label="Navigointi">
        <a href="#/aloitus">Etusivu</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku?lang=${escapeHtml(_route.lang)}">${escapeHtml(langLabel(_route.lang))}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${escapeHtml(_route.lang)}/${encodeURIComponent(_route.kurssiKey)}">${escapeHtml(courseTitle)}</a>
      </nav>
      <h1 class="dk__title">${escapeHtml(title)}</h1>
      <div class="dk__tools">
        <button type="button" class="dk__tool" id="dk-search" aria-label="Etsi" title="Etsi (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="21" y2="21"/>
          </svg>
        </button>
        <button type="button" class="dk__tool" id="dk-help" aria-label="Opas" title="Opas (tulossa)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2"/>
            <circle cx="12" cy="17" r="0.5"/>
          </svg>
        </button>
      </div>
    </header>`;
}

function renderSidemenu() {
  const groups = [];
  let lastGroup = null;
  for (const s of _sivut) {
    const g = KIND_GROUP[s.kind] || "Muut";
    if (g !== lastGroup) {
      groups.push({ title: g, items: [] });
      lastGroup = g;
    }
    groups[groups.length - 1].items.push(s);
  }

  const rows = groups.map((g) => {
    const head = `<span class="dk__group-title">${escapeHtml(g.title)}</span>`;
    const items = g.items.map((s) => {
      const isActive = s.id === _route.sivuId;
      const num = s.num || "·";
      return `
        <button type="button"
                class="dk__row${isActive ? " is-active" : ""}"
                data-sivu="${escapeHtml(s.id)}"
                data-kind="${escapeHtml(s.kind)}"
                aria-current="${isActive ? "page" : "false"}"
                aria-label="${escapeHtml(s.title)}">
          <span class="dk__row-glyph-wrap" aria-hidden="true">${glyphFor(s.kind)}</span>
          <span class="dk__row-num">${escapeHtml(num)}</span>
          <span class="dk__row-title">${escapeHtml(s.title)}</span>
          <span class="dk__row-meta">${escapeHtml(s.meta || "")}</span>
        </button>`;
    }).join("");
    return head + items;
  }).join("");

  return `
    <aside class="dk__sidemenu" id="dk-sidemenu" aria-label="Oppitunnin sisällys">
      <div class="dk__sidemenu-head">
        <span class="dk__sidemenu-eyebrow">Sisällys</span>
        <span class="dk__sidemenu-count">${_sivut.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${rows}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`;
}

function renderTeoriaContent() {
  const teaching = _lesson?.teaching || {};
  const md = teaching.intro_md || "";
  const keyPoints = Array.isArray(teaching.key_points) ? teaching.key_points : [];

  const body = renderTeoriaMarkdown(md) || `
    <p class="dk__teoria-p">Tällä oppitunnilla ei ole vielä opetusmateriaalia. Voit siirtyä suoraan harjoituksiin sivuvalikosta.</p>`;

  const kp = keyPoints.length
    ? `<aside class="dk__key-points" aria-label="Ydinpoiminnat">
         <p class="dk__key-points-title">Muista nämä</p>
         <ol>${keyPoints.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ol>
       </aside>`
    : "";

  return body + kp;
}

function renderPlaceholderContent(sivu) {
  const ph = KIND_PLACEHOLDER[sivu.kind] || KIND_PLACEHOLDER.flashcards;
  return `
    <div class="dk__placeholder" data-kind="${escapeHtml(sivu.kind)}">
      <p class="dk__placeholder-kind">${escapeHtml(ph.label)}</p>
      <p>${escapeHtml(ph.body)}</p>
    </div>`;
}

// ─── Testi (PR6) ──────────────────────────────────────────────────────
// Same item types as the ExerciseCard but summative: all items rendered
// stacked, single "Tarkista testi" submit, result chip + per-kohta
// breakdown after submit. The student experience is exam-like.

const _testiState = new Map(); // sivuId → { submitted, results: [{ raw, graded }], answers: [..] }

function testiItems(sivu) {
  const def = sivu?.testDef;
  if (!def) return [];
  const phases = Array.isArray(_lesson?.phases) ? _lesson.phases : [];
  const items = (phases[def.sourcePhase]?.items || []).slice(0, def.count);
  return items.filter((it) => SUPPORTED_ITEM_TYPES.has(it.item_type));
}

function ensureTestiState(sivuId, items) {
  let st = _testiState.get(sivuId);
  if (!st) {
    st = {
      submitted: false,
      answers: items.map((it) => (
        it.item_type === "mc" ? null
        : it.item_type === "gap_fill" ? new Array(
            (String(it.sentence_template || "").match(/\{\d+\}/g) || []).length
          ).fill("")
        : ""
      )),
      results: items.map(() => null),
      scoreCorrect: 0,
    };
    _testiState.set(sivuId, st);
  }
  return st;
}

function renderTestiContent(sivu) {
  const items = testiItems(sivu);
  if (items.length === 0) {
    return `
      <div class="dk__placeholder" data-kind="testi">
        <p>Tällä testillä ei ole vielä kohtia.</p>
      </div>`;
  }
  const st = ensureTestiState(sivu.id, items);
  const label = sivu.testDef?.label || sivu.title || "Testi";

  const itemsHtml = items.map((item, i) => renderTestiItem(item, i, st)).join("");
  const summary = st.submitted ? renderTestiSummary(items, st) : "";
  const submitBtn = st.submitted
    ? `<button type="button" class="dk__btn dk__btn--ghost" id="dk-testi-reset">Tee uudelleen</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-testi-next-sivu">Seuraava sivu →</button>`
    : `<button type="button" class="dk__btn dk__btn--primary" id="dk-testi-submit">Tarkista testi</button>`;

  return `
    <section class="dk__testi" data-sivu="${escapeHtml(sivu.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Testi · ${escapeHtml(label)}</span>
        <span class="dk__exercise-score">${items.length} kohtaa</span>
      </header>
      ${summary}
      <ol class="dk__testi-list">${itemsHtml}</ol>
      <div class="dk__exercise-actions dk__testi-actions">${submitBtn}</div>
    </section>`;
}

function renderTestiItem(item, i, st) {
  const submitted = st.submitted;
  const result = st.results[i];
  const stem = item.item_type === "translate"
    ? (item.source || "")
    : item.item_type === "typed"
    ? (item.prompt || "")
    : item.item_type === "gap_fill"
    ? null
    : item.stem || "";

  const chip = submitted
    ? `<span class="dk__feedback-chip ${result?.correct ? "is-correct" : "is-wrong"}">${result?.correct ? "Oikein" : "Vielä ei"}</span>`
    : `<span class="dk__testi-itemnum">${i + 1}</span>`;

  // Render the input per item_type. Reuses the bodies from ExerciseCard
  // but suppresses the per-item submit button and feedback strip.
  let body = "";
  switch (item.item_type) {
    case "mc": {
      const chosen = submitted ? result?.choiceIndex : (st.answers[i] === null ? -1 : st.answers[i]);
      const correctIdx = item.correct_index;
      body = `
        <p class="dk__exercise-stem dk__testi-stem">${escapeHtml(stem)}</p>
        <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
          ${(item.choices || []).map((c, idx) => {
            const isChosen = chosen === idx;
            const isRight = idx === correctIdx;
            const cls = ["dk__choice"];
            if (submitted) {
              if (isChosen && isRight) cls.push("is-correct");
              else if (isChosen && !isRight) cls.push("is-wrong");
              else if (isRight) cls.push("is-revealed");
            } else if (isChosen) {
              cls.push("is-selected");
            }
            return `
              <li>
                <button type="button" class="${cls.join(" ")}"
                        data-testi-item="${i}" data-choice="${idx}"
                        ${submitted ? "disabled" : ""}>
                  <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65 + idx)}</span>
                  <span class="dk__choice-text">${escapeHtml(c)}</span>
                </button>
              </li>`;
          }).join("")}
        </ol>`;
      break;
    }
    case "typed":
    case "translate": {
      const value = submitted ? (result?.userAnswer || "") : (st.answers[i] || "");
      body = `
        <p class="dk__exercise-stem dk__testi-stem">${escapeHtml(stem)}</p>
        <div class="dk__input-row">
          <label class="dk__input-label" for="dk-testi-input-${i}">Vastauksesi</label>
          <${item.item_type === "translate" ? `textarea rows="2" id="dk-testi-input-${i}" class="dk__input dk__input--multiline"` : `input id="dk-testi-input-${i}" type="text" class="dk__input"`}
                  data-testi-item="${i}" autocomplete="off" autocapitalize="off" spellcheck="false"
                  ${submitted ? "disabled" : ""}${item.item_type === "translate" ? `>${escapeHtml(value)}</textarea>` : ` value="${escapeHtml(value)}">`}
        </div>`;
      break;
    }
    case "gap_fill": {
      const tpl = String(item.sentence_template || "");
      const vals = submitted ? (result?.userAnswer || []) : (st.answers[i] || []);
      let blankIdx = 0;
      const rendered = escapeHtml(tpl).replace(/\{(\d+)\}/g, () => {
        const v = vals[blankIdx] || "";
        const id = `dk-testi-${i}-gap-${blankIdx}`;
        const cur = blankIdx;
        blankIdx++;
        return `<input id="${id}" type="text" class="dk__input dk__input--gap"
                       data-testi-item="${i}" data-testi-gap="${cur}"
                       autocomplete="off" spellcheck="false"
                       value="${escapeHtml(v)}" ${submitted ? "disabled" : ""}>`;
      });
      const bank = Array.isArray(item.word_bank) && item.word_bank.length
        ? `<ul class="dk__wordbank" aria-label="Sanapankki">
             ${item.word_bank.map((w) => `<li><span>${escapeHtml(w)}</span></li>`).join("")}
           </ul>`
        : "";
      body = `<p class="dk__exercise-stem dk__exercise-stem--gap dk__testi-stem">${rendered}</p>${bank}`;
      break;
    }
    default:
      body = `<p>${escapeHtml(stem)}</p>`;
  }

  // Per-item expected/explanation row revealed AFTER submit.
  const reveal = submitted
    ? `<div class="dk__testi-reveal">
         ${result?.correct ? "" : `<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${escapeHtml(canonicalExpected(item) || "")}</p>`}
         ${item.explanation ? `<p class="dk__feedback-text">${escapeHtml(item.explanation)}</p>` : ""}
       </div>`
    : "";

  return `
    <li class="dk__testi-item ${submitted ? (result?.correct ? "is-correct" : "is-wrong") : ""}" data-testi-item="${i}">
      <div class="dk__testi-itemhead">
        ${chip}
      </div>
      <div class="dk__testi-itembody">
        ${body}
        ${reveal}
      </div>
    </li>`;
}

function renderTestiSummary(items, st) {
  const total = items.length;
  const correct = st.scoreCorrect;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const headline = pct >= 80 ? "Hyvin meni." : pct >= 50 ? "Hyvä alku — kertaa virheelliset kohdat." : "Kertaa vielä ja yritä uudelleen.";
  return `
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${correct} / ${total}</span>
        <span class="dk__testi-summary-pct">${pct}%</span>
      </div>
      <p class="dk__testi-summary-headline">${escapeHtml(headline)}</p>
    </div>`;
}

function readTestiInputs(items, st) {
  const next = items.map((item, i) => {
    switch (item.item_type) {
      case "mc": return st.answers[i]; // captured on click
      case "typed":
      case "translate": {
        const el = document.getElementById(`dk-testi-input-${i}`);
        return el ? el.value : "";
      }
      case "gap_fill": {
        const els = document.querySelectorAll(`[data-testi-item="${i}"][data-testi-gap]`);
        return [...els].map((e) => e.value);
      }
      default: return null;
    }
  });
  return next;
}

function reRenderTestiInPlace() {
  const idx = findSivuIndex(_route.sivuId);
  const sivu = _sivut[idx];
  const slot = document.querySelector(".dk__content .dk__testi");
  if (!slot) return;
  const next = document.createElement("div");
  next.innerHTML = renderTestiContent(sivu);
  slot.replaceWith(next.firstElementChild);
  wireTesti();
}

function wireTesti() {
  const root = document.querySelector(".dk__testi");
  if (!root) return;
  const sivuId = root.dataset.sivu;
  const sivu = _sivut.find((s) => s.id === sivuId);
  const items = testiItems(sivu);
  const st = ensureTestiState(sivuId, items);

  // Capture MC clicks pre-submit so the chosen index persists across re-renders.
  root.querySelectorAll(".dk__choice[data-testi-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (st.submitted) return;
      const i = Number(btn.dataset.testiItem);
      const c = Number(btn.dataset.choice);
      st.answers[i] = c;
      // Light-touch update: mark only the row's choices.
      const li = root.querySelector(`.dk__testi-item[data-testi-item="${i}"]`);
      li?.querySelectorAll(".dk__choice").forEach((b) => {
        b.classList.toggle("is-selected", Number(b.dataset.choice) === c);
      });
    });
  });

  // Submit grades everything.
  document.getElementById("dk-testi-submit")?.addEventListener("click", () => {
    if (st.submitted) return;
    // Capture current inputs.
    st.answers = readTestiInputs(items, st);
    let scoreCorrect = 0;
    st.results = items.map((item, i) => {
      const graded = gradeItem(item, st.answers[i]);
      if (graded.correct) scoreCorrect++;
      return graded;
    });
    st.scoreCorrect = scoreCorrect;
    st.submitted = true;
    reRenderTestiInPlace();
    // Scroll the summary into view so the student sees their score first.
    requestAnimationFrame(() => {
      document.querySelector(".dk__testi-summary")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  });

  // Reset wipes the in-memory state and re-renders fresh.
  document.getElementById("dk-testi-reset")?.addEventListener("click", () => {
    _testiState.delete(sivuId);
    reRenderTestiInPlace();
  });

  // Advance.
  document.getElementById("dk-testi-next-sivu")?.addEventListener("click", () => {
    const idx = findSivuIndex(_route.sivuId);
    const next = _sivut[idx + 1];
    if (next) navigateSivu(next.id);
  });
}

// ─── Itsearviointi (PR7) ──────────────────────────────────────────────
// 4 generic statements rated 1–5. Submission persists to localStorage
// under "puheo:dk:itsearvio:{lang}:{kurssi}:{lesson}" with the ratings
// + an ISO timestamp. No Supabase wiring this PR — the schema + RLS
// policy + route need their own change set. PR 7b can add the sync.

const LS_ARVIO_PREFIX = "puheo:dk:itsearvio";

const ARVIO_STATEMENTS = [
  { id: "vocab",   text: "Hallitsen tämän oppitunnin sanaston." },
  { id: "grammar", text: "Pystyn käyttämään uutta kielioppia omissa lauseissani." },
  { id: "input",   text: "Ymmärrän aiheen tekstiä ja keskusteluja." },
  { id: "output",  text: "Voin puhua ja kirjoittaa tästä aiheesta espanjaksi." },
];
const ARVIO_LABELS = ["heikko", "vajaa", "kohtuu", "vahva", "hallitsen"];

function arvioLsKey() {
  return `${LS_ARVIO_PREFIX}:${_route.lang}:${_route.kurssiKey}:${_route.lessonIndex}`;
}
function readArvio() {
  try { return JSON.parse(localStorage.getItem(arvioLsKey()) || "null"); }
  catch { return null; }
}
function writeArvio(payload) {
  try { localStorage.setItem(arvioLsKey(), JSON.stringify(payload)); }
  catch { /* noop */ }
}

const _arvioDraft = new Map(); // sivuId → { [statementId]: 1..5 }

function ensureArvioDraft(sivuId) {
  let d = _arvioDraft.get(sivuId);
  if (!d) {
    const saved = readArvio();
    d = { ...(saved?.ratings || {}) };
    _arvioDraft.set(sivuId, d);
  }
  return d;
}

function renderArvioContent(sivu) {
  const draft = ensureArvioDraft(sivu.id);
  const saved = readArvio();
  const submitted = !!saved;

  const rows = ARVIO_STATEMENTS.map((s) => {
    const current = submitted ? (saved.ratings?.[s.id] ?? 0) : (draft[s.id] ?? 0);
    const scale = [1, 2, 3, 4, 5].map((n) => `
      <button type="button"
              class="dk__arvio-btn ${current === n ? "is-chosen" : ""}"
              data-statement="${escapeHtml(s.id)}"
              data-value="${n}"
              aria-pressed="${current === n}"
              aria-label="${n}, ${escapeHtml(ARVIO_LABELS[n - 1])}"
              ${submitted ? "disabled" : ""}>
        <span class="dk__arvio-num">${n}</span>
      </button>`).join("");
    return `
      <div class="dk__arvio-row" data-statement="${escapeHtml(s.id)}">
        <p class="dk__arvio-statement">${escapeHtml(s.text)}</p>
        <div class="dk__arvio-scale" role="radiogroup" aria-label="${escapeHtml(s.text)}">
          ${scale}
        </div>
        <div class="dk__arvio-scale-axis" aria-hidden="true">
          <span>1 · heikko</span>
          <span>5 · hallitsen</span>
        </div>
      </div>`;
  }).join("");

  const allRated = ARVIO_STATEMENTS.every((s) => Number.isInteger(draft[s.id]) && draft[s.id] > 0);
  const action = submitted
    ? `<button type="button" class="dk__btn dk__btn--ghost" id="dk-arvio-reset">Päivitä arvio</button>
       <button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-back">Takaisin oppimispolulle</button>`
    : `<button type="button" class="dk__btn dk__btn--primary" id="dk-arvio-submit" ${allRated ? "" : "disabled"}>Tallenna arvio</button>`;

  const summary = submitted ? renderArvioSummary(saved) : "";

  return `
    <section class="dk__arvio" data-sivu="${escapeHtml(sivu.id)}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Itsearviointi</span>
        <span class="dk__exercise-score">${ARVIO_STATEMENTS.length} väittämää</span>
      </header>
      <p class="dk__arvio-lede">Tämä on oma kompassisi, ei arvosana. Ole rehellinen — vastaukset ohjaavat seuraavan oppitunnin tasoa.</p>
      ${summary}
      <div class="dk__arvio-list">${rows}</div>
      <div class="dk__exercise-actions dk__arvio-actions">${action}</div>
    </section>`;
}

function renderArvioSummary(saved) {
  const ratings = saved?.ratings || {};
  const values = ARVIO_STATEMENTS.map((s) => ratings[s.id]).filter(Number.isInteger);
  if (values.length === 0) return "";
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const headline = avg >= 4 ? "Olet vahvalla pohjalla."
    : avg >= 3 ? "Hyvä, suuntaa työ heikoimpiin kohtiin."
    : "Kannattaa kerrata oppitunti ennen seuraavaa.";
  return `
    <div class="dk__testi-summary" aria-live="polite">
      <div class="dk__testi-summary-score">
        <span class="dk__testi-summary-num">${avg.toFixed(1)} / 5</span>
        <span class="dk__testi-summary-pct">Keskiarvo</span>
      </div>
      <p class="dk__testi-summary-headline">${escapeHtml(headline)}</p>
    </div>`;
}

function reRenderArvioInPlace() {
  const sivuIdx = findSivuIndex(_route.sivuId);
  const sivu = _sivut[sivuIdx];
  const slot = document.querySelector(".dk__content .dk__arvio");
  if (!slot) return;
  const next = document.createElement("div");
  next.innerHTML = renderArvioContent(sivu);
  slot.replaceWith(next.firstElementChild);
  wireArvio();
}

function wireArvio() {
  const root = document.querySelector(".dk__arvio");
  if (!root) return;
  const sivuId = root.dataset.sivu;
  const draft = ensureArvioDraft(sivuId);

  root.querySelectorAll(".dk__arvio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.statement;
      const value = Number(btn.dataset.value);
      draft[id] = value;
      // Light update: only flip the chosen state in this row.
      const row = root.querySelector(`.dk__arvio-row[data-statement="${id}"]`);
      row?.querySelectorAll(".dk__arvio-btn").forEach((b) => {
        const on = Number(b.dataset.value) === value;
        b.classList.toggle("is-chosen", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      // Enable submit only when all four statements are rated.
      const submit = document.getElementById("dk-arvio-submit");
      if (submit) {
        const ready = ARVIO_STATEMENTS.every((s) => Number.isInteger(draft[s.id]) && draft[s.id] > 0);
        submit.disabled = !ready;
      }
    });
  });

  document.getElementById("dk-arvio-submit")?.addEventListener("click", () => {
    const payload = {
      ratings: { ...draft },
      submittedAt: new Date().toISOString(),
      lang: _route.lang,
      kurssiKey: _route.kurssiKey,
      lessonIndex: _route.lessonIndex,
    };
    writeArvio(payload);
    reRenderArvioInPlace();
    // PR 7b — sync to Supabase here once the user_self_assessments table
    // + route lands. For now the localStorage save is the single source
    // of truth.
  });

  document.getElementById("dk-arvio-reset")?.addEventListener("click", () => {
    try { localStorage.removeItem(arvioLsKey()); } catch { /* noop */ }
    _arvioDraft.delete(sivuId);
    reRenderArvioInPlace();
  });

  document.getElementById("dk-arvio-back")?.addEventListener("click", () => {
    location.hash = `#/oppimispolku/${_route.lang}/${encodeURIComponent(_route.kurssiKey)}`;
  });
}

// ─── Flashcards (PR5) ─────────────────────────────────────────────────
// One pack per lesson, FLASHCARD_PACK_SIZE entries sampled from
// lesson.vocab. Per-card status persists to localStorage so the student's
// "tiedän / harjoittele" decisions survive a page reload. Once every card
// is marked "tiedän", the deck shows a completion state with a reset.

const _flashState = new Map(); // sivuId → { cardIndex, flipped }
const FLASHCARD_KNOW = "know";
const FLASHCARD_AGAIN = "again";

function flashcardPack(lesson) {
  const vocab = Array.isArray(lesson?.vocab) ? lesson.vocab : [];
  return vocab.slice(0, FLASHCARD_PACK_SIZE);
}

function flashcardLsKey() {
  return `${LS_FLASHCARD_PREFIX}:${_route.lang}:${_route.kurssiKey}:${_route.lessonIndex}`;
}

function readFlashcardStatuses() {
  try {
    const raw = localStorage.getItem(flashcardLsKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeFlashcardStatus(cardId, status) {
  try {
    const all = readFlashcardStatuses();
    all[cardId] = status;
    localStorage.setItem(flashcardLsKey(), JSON.stringify(all));
  } catch { /* noop */ }
}
function resetFlashcardStatuses() {
  try { localStorage.removeItem(flashcardLsKey()); } catch { /* noop */ }
}

function ensureFlashState(sivuId) {
  let st = _flashState.get(sivuId);
  if (!st) {
    st = { cardIndex: 0, flipped: false };
    _flashState.set(sivuId, st);
  }
  return st;
}

function cardIdFor(card, idx) {
  return card?.es ? `${idx}:${card.es}` : `${idx}`;
}

function renderFlashcardsContent(sivu) {
  const pack = flashcardPack(_lesson);
  if (pack.length === 0) {
    return `<div class="dk__placeholder"><p>Tämän oppitunnin sanasto on tyhjä.</p></div>`;
  }

  const statuses = readFlashcardStatuses();
  const knownCount = pack.filter((c, i) => statuses[cardIdFor(c, i)] === FLASHCARD_KNOW).length;
  const allKnown = knownCount === pack.length;

  if (allKnown) {
    return `
      <section class="dk__flashpack" data-sivu="${escapeHtml(sivu.id)}" data-done="true">
        <header class="dk__exercise-head">
          <span class="dk__exercise-eyebrow">Kääntökortit</span>
          <span class="dk__exercise-score">${knownCount} / ${pack.length}</span>
        </header>
        <div class="dk__flashdone">
          <p class="dk__flashdone-headline">Pakka käyty läpi.</p>
          <p class="dk__flashdone-sub">Voit palata kortteihin myöhemmin, tai nollata edistymisesi ja harjoitella uudelleen.</p>
          <div class="dk__exercise-actions">
            <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-reset">Aloita alusta</button>
            <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-next-sivu">Seuraava sivu →</button>
          </div>
        </div>
      </section>`;
  }

  const st = ensureFlashState(sivu.id);
  // Skip cards already marked "know" so the active card is always something
  // the student wants to revisit. This implements a tiny in-memory review
  // queue without needing a real SRS schedule yet.
  let i = Math.min(st.cardIndex, pack.length - 1);
  const visitOrder = orderedCards(pack, statuses, i);
  const activeIdx = visitOrder[0] ?? i;
  const card = pack[activeIdx];
  const cardId = cardIdFor(card, activeIdx);
  const cardStatus = statuses[cardId] || null;

  return `
    <section class="dk__flashpack" data-sivu="${escapeHtml(sivu.id)}" data-index="${activeIdx}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Kortti ${activeIdx + 1} / ${pack.length}</span>
        <span class="dk__exercise-score" aria-label="Hallinnassa">${knownCount} / ${pack.length} hallinnassa</span>
      </header>
      ${renderFlashcard(card, cardId, st.flipped, cardStatus)}
      <p class="dk__flash-hint">${st.flipped
        ? "Merkitse kortti hallinnaksi tai palaa siihen myöhemmin."
        : "Yritä muistaa ensin omasta päästäsi. Sitten käännä kortti."}</p>
    </section>`;
}

function orderedCards(pack, statuses, startIdx) {
  // Visit start → end, then 0 → start, skipping any cards already "know".
  const order = [];
  for (let i = startIdx; i < pack.length; i++) {
    const id = cardIdFor(pack[i], i);
    if (statuses[id] !== FLASHCARD_KNOW) order.push(i);
  }
  for (let i = 0; i < startIdx; i++) {
    const id = cardIdFor(pack[i], i);
    if (statuses[id] !== FLASHCARD_KNOW) order.push(i);
  }
  return order;
}

function renderFlashcard(card, cardId, flipped, status) {
  const genderChip = card.gender
    ? `<span class="dk__flashcard-tag">${escapeHtml(card.gender === "m" ? "Maskuliini" : card.gender === "f" ? "Feminiini" : card.gender)}</span>`
    : "";
  const statusChip = status === FLASHCARD_AGAIN
    ? `<span class="dk__flashcard-tag dk__flashcard-tag--again">Harjoittelussa</span>`
    : status === FLASHCARD_KNOW
    ? `<span class="dk__flashcard-tag dk__flashcard-tag--know">Hallinnassa</span>`
    : "";

  return `
    <div class="dk__flashcard ${flipped ? "is-flipped" : ""}"
         id="dk-flashcard"
         role="button"
         tabindex="0"
         data-card="${escapeHtml(cardId)}"
         aria-pressed="${flipped ? "true" : "false"}"
         aria-label="${escapeHtml(flipped ? "Näytä etupuoli" : "Käännä kortti")}">
      <div class="dk__flashcard-inner">
        <div class="dk__flashcard-face dk__flashcard-face--front">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Etupuoli</span>
            ${genderChip}${statusChip}
          </div>
          <p class="dk__flashcard-word">${escapeHtml(card.es || "")}</p>
          <p class="dk__flashcard-hint-pad">Yritä muistaa, sitten käännä.</p>
        </div>
        <div class="dk__flashcard-face dk__flashcard-face--back">
          <div class="dk__flashcard-meta">
            <span class="dk__flashcard-eyebrow">Takapuoli</span>
            ${statusChip}
          </div>
          <p class="dk__flashcard-word">${escapeHtml(card.fi || "")}</p>
          ${card.example_es ? `<p class="dk__flashcard-example"><span lang="es">${escapeHtml(card.example_es)}</span></p>` : ""}
          ${card.example_fi ? `<p class="dk__flashcard-example dk__flashcard-example--fi">${escapeHtml(card.example_fi)}</p>` : ""}
        </div>
      </div>
    </div>
    <div class="dk__exercise-actions dk__flash-actions">
      <button type="button" class="dk__btn dk__btn--ghost" id="dk-flash-again" ${flipped ? "" : "hidden"}>Harjoittele vielä</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-know" ${flipped ? "" : "hidden"}>Tiedän</button>
      <button type="button" class="dk__btn dk__btn--primary" id="dk-flash-flip" ${flipped ? "hidden" : ""}>Käännä kortti</button>
    </div>`;
}

function reRenderFlashcardsInPlace() {
  const sivuIdx = findSivuIndex(_route.sivuId);
  const sivu = _sivut[sivuIdx];
  const slot = document.querySelector(".dk__content .dk__flashpack");
  if (!slot) return;
  const next = document.createElement("div");
  next.innerHTML = renderFlashcardsContent(sivu);
  slot.replaceWith(next.firstElementChild);
  wireFlashcards();
}

function wireFlashcards() {
  const root = document.querySelector(".dk__flashpack");
  if (!root) return;
  const sivuId = root.dataset.sivu;

  // Empty/done state: reset + advance.
  document.getElementById("dk-flash-reset")?.addEventListener("click", () => {
    resetFlashcardStatuses();
    _flashState.delete(sivuId);
    reRenderFlashcardsInPlace();
  });
  document.getElementById("dk-flash-next-sivu")?.addEventListener("click", () => {
    const idx = findSivuIndex(_route.sivuId);
    const next = _sivut[idx + 1];
    if (next) navigateSivu(next.id);
  });

  if (root.dataset.done === "true") return;

  const st = ensureFlashState(sivuId);
  const activeIdx = Number(root.dataset.index);
  const card = flashcardPack(_lesson)[activeIdx];
  if (!card) return;
  const cardId = cardIdFor(card, activeIdx);

  const flipFn = () => {
    st.flipped = !st.flipped;
    reRenderFlashcardsInPlace();
  };
  document.getElementById("dk-flashcard")?.addEventListener("click", flipFn);
  document.getElementById("dk-flashcard")?.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flipFn();
    }
  });
  document.getElementById("dk-flash-flip")?.addEventListener("click", flipFn);

  const commit = (status) => {
    writeFlashcardStatus(cardId, status);
    st.flipped = false;
    // Move on to whatever the next not-yet-known card is.
    const statuses = readFlashcardStatuses();
    const pack = flashcardPack(_lesson);
    const order = orderedCards(pack, statuses, activeIdx + 1 < pack.length ? activeIdx + 1 : 0);
    st.cardIndex = order[0] ?? activeIdx;
    reRenderFlashcardsInPlace();
  };
  document.getElementById("dk-flash-again")?.addEventListener("click", () => commit(FLASHCARD_AGAIN));
  document.getElementById("dk-flash-know")?.addEventListener("click", () => commit(FLASHCARD_KNOW));
}

// ─── ExerciseCard (PR4) ───────────────────────────────────────────────
// Per-item state is held in _exerciseState; it's keyed by sivuId so that
// switching away and coming back resumes where the student left off.

const _exerciseState = new Map(); // sivuId → { itemIndex, answered, scoreCorrect, scoreTotal }
const SUPPORTED_ITEM_TYPES = new Set(["mc", "typed", "gap_fill", "translate"]);

function phaseForSivu(sivu) {
  if (!sivu || sivu.kind !== "tehtava") return null;
  const m = /^phase-(\d+)$/.exec(sivu.id);
  if (!m) return null;
  const idx = Number(m[1]);
  const phases = Array.isArray(_lesson?.phases) ? _lesson.phases : [];
  return phases[idx] || null;
}

function ensureExerciseState(sivuId, items) {
  let st = _exerciseState.get(sivuId);
  if (!st) {
    st = {
      itemIndex: 0,
      answered: new Array(items.length).fill(null), // null | {correct, userAnswer}
      scoreCorrect: 0,
      scoreTotal: 0,
    };
    _exerciseState.set(sivuId, st);
  }
  return st;
}

function renderExerciseContent(sivu) {
  const phase = phaseForSivu(sivu);
  if (!phase) return renderPlaceholderContent(sivu);
  const items = Array.isArray(phase.items) ? phase.items : [];
  if (items.length === 0) {
    return `<div class="dk__placeholder"><p>Tällä vaiheella ei ole tehtäviä.</p></div>`;
  }
  // Bail to placeholder for unsupported item types (match, writing) until
  // their PRs land — keeps the SideMenu navigable end-to-end.
  const firstKind = items[0].item_type;
  if (!SUPPORTED_ITEM_TYPES.has(firstKind)) {
    const label = firstKind === "match"
      ? "Yhdistämistehtävä, tulossa PR 4b"
      : firstKind === "writing"
      ? "Kirjoitustehtävä, tulossa PR 7"
      : `Tehtävätyyppi "${firstKind}" tulossa myöhemmin`;
    return `
      <div class="dk__placeholder" data-kind="tehtava">
        <p class="dk__placeholder-kind">${escapeHtml(label)}</p>
        <p>Vaihe ${escapeHtml(String((phaseIndexOfSivu(sivu) ?? 0) + 1))}: ${escapeHtml(phase.title || "")}. Vaiheessa ${items.length} tehtävää tätä tyyppiä.</p>
      </div>`;
  }

  const st = ensureExerciseState(sivu.id, items);
  const i = Math.min(st.itemIndex, items.length - 1);
  const item = items[i];
  const answer = st.answered[i];

  return `
    <section class="dk__exercise" data-sivu="${escapeHtml(sivu.id)}" data-index="${i}">
      <header class="dk__exercise-head">
        <span class="dk__exercise-eyebrow">Tehtävä ${i + 1} / ${items.length}</span>
        <span class="dk__exercise-score" aria-label="Tulos">${st.scoreCorrect} / ${st.scoreTotal}</span>
      </header>
      ${renderItemBody(item, answer)}
      ${renderExerciseFooter(item, answer, i, items.length)}
    </section>`;
}

function phaseIndexOfSivu(sivu) {
  const m = /^phase-(\d+)$/.exec(sivu.id);
  return m ? Number(m[1]) : null;
}

function renderItemBody(item, answer) {
  switch (item.item_type) {
    case "mc":        return renderItemMc(item, answer);
    case "typed":     return renderItemTyped(item, answer);
    case "gap_fill":  return renderItemGapFill(item, answer);
    case "translate": return renderItemTranslate(item, answer);
    default:          return `<p class="dk__teoria-p">Tehtävätyyppi ”${escapeHtml(item.item_type)}” ei ole vielä käytettävissä.</p>`;
  }
}

function renderItemMc(item, answer) {
  const choices = Array.isArray(item.choices) ? item.choices : [];
  const correct = Number.isInteger(item.correct_index) ? item.correct_index : -1;
  const disabled = !!answer;
  const chosen = answer?.choiceIndex;
  return `
    <p class="dk__exercise-stem">${escapeHtml(item.stem || "")}</p>
    <ol class="dk__choices" role="radiogroup" aria-label="Vaihtoehdot">
      ${choices.map((c, idx) => {
        const isChosen = disabled && chosen === idx;
        const isRight = disabled && idx === correct;
        const cls = ["dk__choice"];
        if (isChosen && isRight) cls.push("is-correct");
        else if (isChosen && !isRight) cls.push("is-wrong");
        else if (disabled && isRight) cls.push("is-revealed");
        return `
          <li>
            <button type="button" class="${cls.join(" ")}"
                    data-choice="${idx}"
                    ${disabled ? "disabled" : ""}>
              <span class="dk__choice-marker" aria-hidden="true">${String.fromCharCode(65 + idx)}</span>
              <span class="dk__choice-text">${escapeHtml(c)}</span>
            </button>
          </li>`;
      }).join("")}
    </ol>`;
}

function renderItemTyped(item, answer) {
  const hint = item.hint || "";
  const value = answer?.userAnswer || "";
  const disabled = !!answer;
  return `
    <p class="dk__exercise-stem">${escapeHtml(item.prompt || "")}</p>
    ${hint ? `<p class="dk__exercise-hint">${escapeHtml(hint)}</p>` : ""}
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <input id="dk-input" type="text" class="dk__input"
             autocomplete="off" autocapitalize="off" spellcheck="false"
             value="${escapeHtml(value)}"
             ${disabled ? "disabled" : ""}>
    </div>`;
}

function renderItemGapFill(item, answer) {
  // Replace `{1}` ... `{N}` with input slots.
  const tpl = String(item.sentence_template || "");
  const blanks = (tpl.match(/\{(\d+)\}/g) || []).length;
  const values = answer?.userAnswer || new Array(blanks).fill("");
  const disabled = !!answer;
  let inputIdx = 0;
  const rendered = escapeHtml(tpl).replace(/\{(\d+)\}/g, () => {
    const v = values[inputIdx] || "";
    const id = `dk-gap-${inputIdx}`;
    inputIdx++;
    return `<input id="${id}" type="text" class="dk__input dk__input--gap"
                   data-gap="${inputIdx - 1}" autocomplete="off" spellcheck="false"
                   value="${escapeHtml(v)}" ${disabled ? "disabled" : ""}>`;
  });
  const bank = Array.isArray(item.word_bank) && item.word_bank.length
    ? `<ul class="dk__wordbank" aria-label="Sanapankki">
         ${item.word_bank.map((w) => `<li><span>${escapeHtml(w)}</span></li>`).join("")}
       </ul>`
    : "";
  return `
    <p class="dk__exercise-stem dk__exercise-stem--gap">${rendered}</p>
    ${bank}`;
}

function renderItemTranslate(item, answer) {
  const dir = item.direction === "es_to_fi" ? "espanjasta suomeksi"
            : item.direction === "fi_to_es" ? "suomesta espanjaksi"
            : "käännös";
  const value = answer?.userAnswer || "";
  const disabled = !!answer;
  return `
    <p class="dk__exercise-eyebrow-tag">Käännös, ${escapeHtml(dir)}</p>
    <p class="dk__exercise-stem">${escapeHtml(item.source || item.prompt || "")}</p>
    <div class="dk__input-row">
      <label class="dk__input-label" for="dk-input">Vastauksesi</label>
      <textarea id="dk-input" class="dk__input dk__input--multiline"
                rows="3" autocomplete="off" spellcheck="false"
                ${disabled ? "disabled" : ""}>${escapeHtml(value)}</textarea>
    </div>`;
}

function renderExerciseFooter(item, answer, i, total) {
  if (!answer) {
    return `
      <div class="dk__exercise-actions">
        <button type="button" class="dk__btn dk__btn--primary" id="dk-check">Tarkista</button>
      </div>`;
  }
  const correct = answer.correct;
  const chipCls = correct ? "is-correct" : "is-wrong";
  const chipText = correct ? "Oikein" : "Vielä ei aivan";
  const expl = renderItemExplanation(item, answer);
  const isLast = i >= total - 1;
  return `
    <div class="dk__feedback" aria-live="polite">
      <span class="dk__feedback-chip ${chipCls}">${chipText}</span>
      ${expl}
    </div>
    <div class="dk__exercise-actions">
      <button type="button" class="dk__btn dk__btn--primary" id="dk-next-item">
        ${isLast ? "Vaihe valmis →" : "Seuraava →"}
      </button>
    </div>`;
}

function renderItemExplanation(item, answer) {
  const expected = canonicalExpected(item);
  const expectedHtml = expected
    ? `<p class="dk__feedback-expected"><span>Oikea vastaus:</span> ${escapeHtml(expected)}</p>`
    : "";
  const expl = item.explanation
    ? `<p class="dk__feedback-text">${escapeHtml(item.explanation)}</p>`
    : "";
  const accentHint = answer?.accentHint
    ? `<p class="dk__feedback-text dk__feedback-hint">${escapeHtml(answer.accentHint)}</p>`
    : "";
  return `${expectedHtml}${accentHint}${expl}`;
}

function canonicalExpected(item) {
  switch (item.item_type) {
    case "mc":
      return Array.isArray(item.choices) && Number.isInteger(item.correct_index)
        ? item.choices[item.correct_index] : "";
    case "typed":
      return Array.isArray(item.accept) ? item.accept[0] || "" : "";
    case "translate":
      return Array.isArray(item.accept) ? item.accept[0] || "" : "";
    case "gap_fill": {
      const tpl = String(item.sentence_template || "");
      const answers = Array.isArray(item.answers) ? item.answers : [];
      let idx = 0;
      return tpl.replace(/\{(\d+)\}/g, () => {
        const cell = answers[idx++];
        return Array.isArray(cell) ? (cell[0] || "—") : "—";
      });
    }
    default: return "";
  }
}

function gradeItem(item, raw) {
  switch (item.item_type) {
    case "mc": {
      const idx = Number(raw);
      return { correct: idx === item.correct_index, choiceIndex: idx };
    }
    case "typed":
    case "translate": {
      const userAnswer = String(raw || "").trim();
      const accepts = Array.isArray(item.accept) ? item.accept : [];
      for (const exp of accepts) {
        const r = isAcceptable(userAnswer, exp, _route.lang || "es");
        if (r.ok) return { correct: true, userAnswer, accentHint: r.hint || null };
      }
      return { correct: false, userAnswer };
    }
    case "gap_fill": {
      const vals = Array.isArray(raw) ? raw : [];
      const answers = Array.isArray(item.answers) ? item.answers : [];
      let allOk = true;
      for (let i = 0; i < answers.length; i++) {
        const accepts = Array.isArray(answers[i]) ? answers[i] : [answers[i]];
        const userAnswer = String(vals[i] || "").trim();
        let ok = false;
        for (const exp of accepts) {
          if (isAcceptable(userAnswer, String(exp), _route.lang || "es").ok) { ok = true; break; }
        }
        if (!ok) { allOk = false; break; }
      }
      return { correct: allOk, userAnswer: vals };
    }
    default:
      return { correct: false };
  }
}

function readExerciseInput(item) {
  const root = document.querySelector(".dk__exercise");
  if (!root) return null;
  switch (item.item_type) {
    case "typed":
    case "translate": {
      const el = root.querySelector("#dk-input");
      return el ? el.value : "";
    }
    case "gap_fill": {
      return [...root.querySelectorAll(".dk__input--gap")].map((el) => el.value);
    }
    default: return null;
  }
}

function reRenderExerciseInPlace() {
  const idx = findSivuIndex(_route.sivuId);
  const sivu = _sivut[idx];
  const slot = document.querySelector(".dk__content .dk__exercise");
  if (!slot) return;
  const next = document.createElement("div");
  next.innerHTML = renderExerciseContent(sivu);
  slot.replaceWith(next.firstElementChild);
  wireExerciseCard();
}

function wireExerciseCard() {
  const root = document.querySelector(".dk__exercise");
  if (!root) return;
  const sivuId = root.dataset.sivu;
  const sivu = _sivut.find((s) => s.id === sivuId);
  const phase = phaseForSivu(sivu);
  if (!phase) return;
  const items = phase.items || [];
  const i = Number(root.dataset.index);
  const item = items[i];
  if (!item) return;
  const st = ensureExerciseState(sivuId, items);

  // MC: clicking a choice both selects + commits the answer (Otava idiom).
  root.querySelectorAll(".dk__choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (st.answered[i]) return;
      const choice = Number(btn.dataset.choice);
      const result = gradeItem(item, choice);
      st.answered[i] = result;
      if (result.correct) st.scoreCorrect++;
      st.scoreTotal++;
      reRenderExerciseInPlace();
    });
  });

  // Typed / translate / gap_fill: Tarkista commits the input.
  document.getElementById("dk-check")?.addEventListener("click", () => {
    if (st.answered[i]) return;
    const raw = readExerciseInput(item);
    const result = gradeItem(item, raw);
    st.answered[i] = result;
    if (result.correct) st.scoreCorrect++;
    st.scoreTotal++;
    reRenderExerciseInPlace();
  });

  // Enter submits typed/translate inputs.
  const input = root.querySelector("#dk-input");
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !st.answered[i]) {
      e.preventDefault();
      document.getElementById("dk-check")?.click();
    }
  });

  // Next item — advance within the phase or jump to the next sivu when done.
  document.getElementById("dk-next-item")?.addEventListener("click", () => {
    if (i < items.length - 1) {
      st.itemIndex = i + 1;
      reRenderExerciseInPlace();
    } else {
      const sivuIdx = findSivuIndex(_route.sivuId);
      const nextSivu = _sivut[sivuIdx + 1];
      if (nextSivu) navigateSivu(nextSivu.id);
    }
  });
}

function renderContent() {
  const meta = _lesson?.meta || {};
  const idx = findSivuIndex(_route.sivuId);
  const sivu = _sivut[idx];
  const prev = idx > 0 ? _sivut[idx - 1] : null;
  const next = idx < _sivut.length - 1 ? _sivut[idx + 1] : null;

  const pageMeta = [
    meta.course_key || _route.kurssiKey,
    `Oppitunti ${meta.lesson_index || _route.lessonIndex}`,
  ].filter(Boolean).join(" · ");

  const titleHtml = sivu.kind === "teoria"
    ? `<em>${escapeHtml(sivu.title)}</em>`
    : `${sivu.num ? `${escapeHtml(sivu.num)} · ` : ""}${escapeHtml(sivu.title)}`;

  const body = sivu.kind === "teoria"
    ? renderTeoriaContent()
    : sivu.kind === "tehtava"
    ? renderExerciseContent(sivu)
    : sivu.kind === "flashcards"
    ? renderFlashcardsContent(sivu)
    : sivu.kind === "testi"
    ? renderTestiContent(sivu)
    : sivu.kind === "itsearviointi"
    ? renderArvioContent(sivu)
    : renderPlaceholderContent(sivu);

  return `
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${renderPrevNext(prev, next, "top")}
      <p class="dk__page-meta">${escapeHtml(pageMeta)}</p>
      <h2 class="dk__page-title">${titleHtml}</h2>
      ${body}
      ${renderPrevNext(prev, next, "bottom")}
    </main>`;
}

function renderPrevNext(prev, next, where) {
  const cls = `dk__prevnext dk__prevnext--${where}`;
  const prevBtn = prev
    ? `<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" data-sivu="${escapeHtml(prev.id)}">
         <span class="dk__prevnext-dir">← Edellinen</span>
         <span class="dk__prevnext-label">${escapeHtml(prev.num ? prev.num + " · " + prev.title : prev.title)}</span>
       </button>`
    : `<button type="button" class="dk__prevnext-btn dk__prevnext-btn--prev" disabled>
         <span class="dk__prevnext-dir">← Edellinen</span>
         <span class="dk__prevnext-label">Oppitunnin alku</span>
       </button>`;
  const nextBtn = next
    ? `<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" data-sivu="${escapeHtml(next.id)}">
         <span class="dk__prevnext-dir">Seuraava →</span>
         <span class="dk__prevnext-label">${escapeHtml(next.num ? next.num + " · " + next.title : next.title)}</span>
       </button>`
    : `<button type="button" class="dk__prevnext-btn dk__prevnext-btn--next" disabled>
         <span class="dk__prevnext-dir">Seuraava →</span>
         <span class="dk__prevnext-label">Oppitunti valmis</span>
       </button>`;
  return `<div class="${cls}">${prevBtn}${nextBtn}</div>`;
}

function renderLoadingShell() {
  return `
    <div class="dk" id="dk-root" data-sidemenu="open">
      <header class="dk__topbar" role="banner">
        <span></span>
        <span class="dk__title" style="font-style: normal; color: var(--ed-ink-muted);">Ladataan oppituntia…</span>
        <span></span>
      </header>
      <div class="dk__body">
        <aside class="dk__sidemenu"><div class="dk__sidemenu-head"><span class="dk__sidemenu-eyebrow">Sisällys</span></div></aside>
        <main class="dk__content">
          <div class="dk__loading">Haetaan oppituntia palvelimelta…</div>
        </main>
      </div>
    </div>`;
}

function renderErrorShell(err) {
  return `
    <div class="dk" id="dk-root" data-sidemenu="open">
      <header class="dk__topbar" role="banner">
        <nav class="dk__breadcrumb">
          <a href="#/aloitus">Etusivu</a>
        </nav>
        <span class="dk__title">Oppitunti ei latautunut</span>
        <span></span>
      </header>
      <div class="dk__body">
        <aside class="dk__sidemenu"></aside>
        <main class="dk__content">
          <div class="dk__error">
            <strong>Oppituntia ei löytynyt.</strong>
            <p>${escapeHtml(String(err?.message || err || "Tuntematon virhe"))}</p>
            <p>Palaa <a href="#/oppimispolku?lang=${escapeHtml(_route.lang)}">Oppimispolulle</a> ja kokeile toista oppituntia.</p>
          </div>
        </main>
      </div>
    </div>`;
}

// ─── Wiring ────────────────────────────────────────────────────────────

function applySidemenuState(state) {
  const dk = document.getElementById("dk-root");
  if (!dk) return;
  dk.dataset.sidemenu = state;
  const toggle = document.getElementById("dk-toggle-sidemenu");
  if (toggle) toggle.setAttribute("aria-pressed", state === SIDEMENU_COLLAPSED ? "true" : "false");
}

function wireSidemenu() {
  const toggle = document.getElementById("dk-toggle-sidemenu");
  const backdrop = document.getElementById("dk-sidemenu-backdrop");

  toggle?.addEventListener("click", () => {
    const dk = document.getElementById("dk-root");
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) {
      const next = dk.dataset.sidemenu === SIDEMENU_OPEN ? SIDEMENU_COLLAPSED : SIDEMENU_OPEN;
      applySidemenuState(next);
    } else {
      const next = dk.dataset.sidemenu === SIDEMENU_COLLAPSED ? SIDEMENU_OPEN : SIDEMENU_COLLAPSED;
      applySidemenuState(next);
      writeSidemenuPref(next);
    }
  });

  backdrop?.addEventListener("click", () => {
    applySidemenuState(SIDEMENU_COLLAPSED);
  });
}

function navigateSivu(sivuId) {
  if (!sivuId || sivuId === _route.sivuId) return;
  const i = _sivut.findIndex((s) => s.id === sivuId);
  if (i < 0) return;
  _route.sivuId = sivuId;
  const target = `#/oppitunti/${_route.lang}/${encodeURIComponent(_route.kurssiKey)}/${_route.lessonIndex}/${encodeURIComponent(sivuId)}`;
  if (location.hash !== target) {
    history.replaceState(null, "", target);
  }
  const dk = document.getElementById("dk-root");
  if (!dk) return;
  const list = dk.querySelector(".dk__sidemenu-list");
  if (list) {
    list.querySelectorAll(".dk__row").forEach((row) => {
      const active = row.dataset.sivu === sivuId;
      row.classList.toggle("is-active", active);
      row.setAttribute("aria-current", active ? "page" : "false");
    });
  }
  const contentSlot = dk.querySelector(".dk__content");
  if (contentSlot) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderContent();
    contentSlot.replaceWith(wrapper.firstElementChild);
    wireContent();
  }
  if (window.matchMedia("(max-width: 1023px)").matches) {
    applySidemenuState(SIDEMENU_COLLAPSED);
  }
  scrollActiveIntoView();
  document.getElementById("dk-content")?.focus({ preventScroll: false });
}

function wireSidemenuRows() {
  document.getElementById("dk-sidemenu-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".dk__row");
    if (!btn) return;
    navigateSivu(btn.dataset.sivu);
  });
}

// PR3 — scroll the active SideMenu row into view. Long lessons have 15+
// sivut and the student lands on whatever sivu the URL points to; if it's
// past the fold the SideMenu shows the top rows and the active item is
// off-screen. Use scrollIntoView with "nearest" so we don't yank the
// list when the active row is already visible.
function scrollActiveIntoView() {
  const list = document.getElementById("dk-sidemenu-list");
  if (!list) return;
  const active = list.querySelector(".dk__row.is-active");
  if (!active) return;
  // Use rAF so the scroll runs after layout settles (otherwise the
  // computed scrollTop is 0 on first paint and the call is a no-op).
  requestAnimationFrame(() => {
    try {
      active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    } catch {
      // Older browsers without options-form scrollIntoView — fall back
      // to a direct scrollTop adjustment.
      const top = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
      list.scrollTop = Math.max(0, top);
    }
  });
}

function wireContent() {
  document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach((btn) => {
    btn.addEventListener("click", () => navigateSivu(btn.dataset.sivu));
  });
  wireExerciseCard();
  wireFlashcards();
  wireTesti();
  wireArvio();
}

// ─── Public entry ─────────────────────────────────────────────────────

export function initDigikirja() {
  _wired = true;
}

export async function showDigikirja(route = {}) {
  if (!_wired) initDigikirja();

  _route.lang = route.lang || _route.lang;
  _route.kurssiKey = route.kurssiKey || _route.kurssiKey;
  _route.lessonIndex = Number(route.lessonIndex) || _route.lessonIndex;
  // sivuId fallback resolves after the lesson is fetched (only then do we
  // know which sivu ids are valid).
  _route.sivuId = route.sivuId || _route.sivuId || "teoria";

  const host = document.getElementById("screen-digikirja");
  if (!host) return;

  // Render a loading shell synchronously so the screen swap is instant
  // and the user sees we're working.
  host.innerHTML = renderLoadingShell();
  show("screen-digikirja");

  const loadKey = `${_route.lang}/${_route.kurssiKey}/${_route.lessonIndex}`;
  _loadKey = loadKey;

  try {
    const lesson = await fetchLesson(_route);
    // Bail out if the user navigated to a different lesson while this
    // fetch was in flight.
    if (_loadKey !== loadKey) return;

    _lesson = lesson;
    _sivut = buildSivut(lesson);
    // Resolve sivuId against the freshly built sivut list.
    if (!_sivut.some((s) => s.id === _route.sivuId)) {
      _route.sivuId = _sivut[0]?.id || "teoria";
    }

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const initialState = isMobile ? SIDEMENU_COLLAPSED : readSidemenuPref();

    host.innerHTML = `
      <div class="dk" id="dk-root" data-sidemenu="${initialState}">
        ${renderTopbar()}
        <div class="dk__body">
          ${renderSidemenu()}
          ${renderContent()}
        </div>
      </div>`;

    applySidemenuState(initialState);
    wireSidemenu();
    wireSidemenuRows();
    wireContent();
    scrollActiveIntoView();
  } catch (err) {
    if (_loadKey !== loadKey) return;
    host.innerHTML = renderErrorShell(err);
  }
}

export function tryRouteDigikirja(hash) {
  const m = /^#\/oppitunti\/([a-z]{2})\/([^/?#]+)\/(\d+)\/([^/?#]+)/i.exec(hash || location.hash);
  if (!m) return false;
  showDigikirja({
    lang: m[1].toLowerCase(),
    kurssiKey: decodeURIComponent(m[2]),
    lessonIndex: Number(m[3]),
    sivuId: decodeURIComponent(m[4]),
  });
  return true;
}
