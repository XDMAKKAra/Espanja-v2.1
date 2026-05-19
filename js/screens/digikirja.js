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

const KIND_PLACEHOLDER = {
  tehtava: {
    label: "Harjoitustehtävä, tulossa PR 4",
    body: "Tämän vaiheen tehtävät (monivalinta, täydennys, yhdistäminen, käännös) rendröidään tähän sivuun upotettuna. Lähde: nykyinen lesson_M.json:n items-array; ExerciseCard kuluttaa item-tyypin ja pisteyttää suoraan.",
  },
  flashcards: {
    label: "Kääntökortit, tulossa PR 5",
    body: "Pino kääntyviä kortteja oppitunnin sanastosta. Etupuoli: lähdekielinen virke. Takapuoli: suomi + sääntövihje. Tila per kortti (tiedän / harjoittele vielä) persistoituu localStorage:en, kirjautuneille Supabaseen.",
  },
  testi: {
    label: "Testi, tulossa PR 6",
    body: "Sama ExerciseCard kuin tehtävällä, mutta ilman live-palautetta per kohta. Opiskelija vastaa kaikkiin, painaa Tarkista, ja näkee yhteenvedon + per-kohta-palautteen.",
  },
  itsearviointi: {
    label: "Itsearviointi, tulossa PR 7",
    body: "Lyhyt 1–5 asteikollinen lomake: hallitsen aiheen sanaston, tunnistan rakenteet, voin keskustella. Tulokset Supabaseen, ohjaavat seuraavan oppitunnin tasoa.",
  },
};

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

  // 3. Flashcards sivu — placeholder until PR 5 wires the sanasto pack.
  out.push({
    id: "kortit-1",
    kind: "flashcards",
    num: "",
    title: `Kääntökortit · ${lesson?.meta?.title || ""}`.trim(),
    meta: "5 korttia",
  });

  // 4. Test sivut — placeholder until PR 6.
  out.push({
    id: "test-1",
    kind: "testi",
    num: "T1",
    title: "Test · Käännä",
    meta: "Pisteytys",
  });
  out.push({
    id: "test-2",
    kind: "testi",
    num: "T2",
    title: "Test · Valitse oikea muoto",
    meta: "Pisteytys",
  });

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
                aria-current="${isActive ? "page" : "false"}">
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
  const ph = KIND_PLACEHOLDER[sivu.kind] || KIND_PLACEHOLDER.tehtava;
  return `
    <div class="dk__placeholder" data-kind="${escapeHtml(sivu.kind)}">
      <p class="dk__placeholder-kind">${escapeHtml(ph.label)}</p>
      <p>${escapeHtml(ph.body)}</p>
    </div>`;
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

  const body = sivu.kind === "teoria" ? renderTeoriaContent() : renderPlaceholderContent(sivu);

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
  document.getElementById("dk-content")?.focus({ preventScroll: false });
}

function wireSidemenuRows() {
  document.getElementById("dk-sidemenu-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".dk__row");
    if (!btn) return;
    navigateSivu(btn.dataset.sivu);
  });
}

function wireContent() {
  document.querySelectorAll(".dk__content .dk__prevnext-btn[data-sivu]").forEach((btn) => {
    btn.addEventListener("click", () => navigateSivu(btn.dataset.sivu));
  });
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
