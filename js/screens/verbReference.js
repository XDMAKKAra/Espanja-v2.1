import { $ } from "../ui/nav.js";
import { track } from "../analytics.js";
import {
  loadVerbs,
  PERSON_LABELS,
  TENSE_LABELS,
  IMPERATIVE_PERSONS,
  IMPERATIVE_PERSON_LABELS,
  normalize,
} from "../features/verbsData.js";

const REFERENCE_TENSES = ["present", "preterite", "imperfect", "subjunctive_present", "imperative"];
const PERSONS = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];

let currentVerb = null;
let activeSuggestionIdx = -1;
let suggestions = [];

export function initVerbReference() {
  const btn = $("verb-ref-btn");
  if (btn) btn.addEventListener("click", openModal);

  const closeBtn = $("verbref-close");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  const overlay = $("verbref-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  const input = $("verbref-input");
  if (input) {
    input.addEventListener("input", onSearchInput);
    input.addEventListener("keydown", onSearchKeydown);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("verbref-overlay").classList.contains("hidden")) {
      closeModal();
    }
  });
}

async function openModal() {
  track("verbref_opened");
  $("verbref-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const input = $("verbref-input");
  input.value = "";
  clearSuggestions();
  renderEmpty();

  // Prewarm data
  try {
    await loadVerbs();
    await renderSearchCount();
  } catch {
    $("verbref-count").textContent = "Verbidataa ei saatu";
  }
  setTimeout(() => input.focus(), 30);
}

function closeModal() {
  $("verbref-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}

async function renderSearchCount() {
  const data = await loadVerbs();
  $("verbref-count").textContent = `${data.verbs.length} verbiä`;
}

async function onSearchInput(e) {
  const q = normalize(e.target.value);
  if (!q) {
    clearSuggestions();
    renderEmpty();
    return;
  }
  const data = await loadVerbs();
  const matches = data.verbs
    .map((v) => ({ v, score: matchScore(v, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.v);

  suggestions = matches;
  activeSuggestionIdx = -1;
  renderSuggestions();

  if (matches.length === 1 && normalize(matches[0].inf) === q) {
    selectVerb(matches[0]);
  } else if (matches.length === 0) {
    renderNoMatch(e.target.value);
  } else {
    // Keep current body; user can click a suggestion.
  }
}

function matchScore(verb, q) {
  const inf = normalize(verb.inf);
  if (inf === q) return 100;
  if (inf.startsWith(q)) return 50;
  if (inf.includes(q)) return 20;
  if (normalize(verb.tr || "").includes(q)) return 5;
  return 0;
}

function onSearchKeydown(e) {
  if (!suggestions.length) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeSuggestionIdx = (activeSuggestionIdx + 1) % suggestions.length;
    renderSuggestions();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeSuggestionIdx = activeSuggestionIdx <= 0 ? suggestions.length - 1 : activeSuggestionIdx - 1;
    renderSuggestions();
  } else if (e.key === "Enter") {
    e.preventDefault();
    const pick = activeSuggestionIdx >= 0 ? suggestions[activeSuggestionIdx] : suggestions[0];
    if (pick) selectVerb(pick);
  }
}

function renderSuggestions() {
  const el = $("verbref-suggestions");
  el.innerHTML = "";
  if (!suggestions.length) {
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  suggestions.forEach((v, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "verbref-suggestion" + (i === activeSuggestionIdx ? " is-active" : "");
    btn.innerHTML = `<span class="verbref-suggestion-inf">${escapeHtml(v.inf)}</span><span class="verbref-suggestion-tr">${escapeHtml(v.tr || "")}</span>`;
    btn.addEventListener("click", () => selectVerb(v));
    el.appendChild(btn);
  });
}

function clearSuggestions() {
  suggestions = [];
  activeSuggestionIdx = -1;
  const el = $("verbref-suggestions");
  el.innerHTML = "";
  el.classList.add("hidden");
}

function selectVerb(verb) {
  currentVerb = verb;
  $("verbref-input").value = verb.inf;
  clearSuggestions();
  renderVerb(verb);
  track("verbref_verb_viewed", { verb: verb.inf });
}

function renderEmpty() {
  const body = $("verbref-body");
  body.innerHTML = `<p class="verbref-empty">Valitse verbi yllä olevasta hakukentästä.</p>`;
}

function renderNoMatch(query) {
  const body = $("verbref-body");
  body.innerHTML = `<p class="verbref-empty">Ei osumaa haulla "${escapeHtml(query)}". Koeta infinitiiviä, esim. <em>tener</em>, <em>ir</em>, <em>poner</em>.</p>`;
}

function renderVerb(verb) {
  const body = $("verbref-body");
  body.innerHTML = "";

  const header = document.createElement("div");
  header.className = "verbref-verb-header";
  header.innerHTML = `
    <h3 class="verbref-verb-title">${escapeHtml(verb.inf)}</h3>
    <span class="verbref-verb-tr">${escapeHtml(verb.tr || "")}</span>
    ${verb.irr ? '<span class="verbref-verb-badge">epäsäännöllinen</span>' : '<span class="verbref-verb-badge verbref-verb-badge-reg">säännöllinen</span>'}
  `;
  body.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "verbref-tenses";

  REFERENCE_TENSES.forEach((tense) => {
    if (tense === "imperative") {
      const block = document.createElement("div");
      block.className = "verbref-tense";
      block.innerHTML = `<div class="verbref-tense-label">${TENSE_LABELS[tense]}</div>`;
      const table = document.createElement("table");
      table.className = "verbref-table";
      IMPERATIVE_PERSONS.forEach((pk) => {
        const form = verb.imperative?.[pk] || "—";
        const row = document.createElement("tr");
        row.innerHTML = `<th>${IMPERATIVE_PERSON_LABELS[pk]}</th><td>${escapeHtml(form)}</td>`;
        table.appendChild(row);
      });
      block.appendChild(table);
      grid.appendChild(block);
      return;
    }

    const forms = verb.conj?.[tense];
    if (!forms) return;
    const block = document.createElement("div");
    block.className = "verbref-tense";
    block.innerHTML = `<div class="verbref-tense-label">${TENSE_LABELS[tense]}</div>`;
    const table = document.createElement("table");
    table.className = "verbref-table";
    PERSONS.forEach((pk, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `<th>${PERSON_LABELS[pk]}</th><td>${escapeHtml(forms[i] || "—")}</td>`;
      table.appendChild(row);
    });
    block.appendChild(table);
    grid.appendChild(block);
  });

  body.appendChild(grid);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
