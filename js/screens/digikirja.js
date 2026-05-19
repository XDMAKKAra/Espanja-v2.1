/**
 * digikirja.js — Otava Fokus 7 -style three-panel lesson screen.
 *
 * PR 1 (pohjarakenne, 2026-05-19): renders the TopBar + SideMenu +
 * LessonContent shell with one hardcoded demo lesson ("Subjuntiivi").
 * Real lesson data wiring lands in later PRs — for now every sivu type
 * renders an inline placeholder so navigation, toggle, and routing can
 * be exercised end-to-end.
 *
 * Route: #/oppitunti/{lang}/{kurssi}/{lesson}/{sivu}
 *   lang     two-letter target language (es | fr | de)
 *   kurssi   slug (e.g. kurssi-2)
 *   lesson   numeric sortOrder
 *   sivu     virtual sivu id from the sivut array
 *
 * SideMenu open/collapsed state persists in localStorage under
 * "puheo:dk:sidemenu" so the student's preference survives navigation.
 */

import { show } from "../ui/nav.js";

const LS_SIDEMENU = "puheo:dk:sidemenu";
const SIDEMENU_OPEN = "open";
const SIDEMENU_COLLAPSED = "collapsed";

// ─── Demo lesson ───────────────────────────────────────────────────────
// Subjuntiivi, mirroring the Otava Fokus 7 sample chapter. One sivu per
// row in the SideMenu list. `kind` drives the placeholder rendering; PRs
// 2–7 swap each kind for a real component (BilingualTable, Flashcard,
// ExerciseCard, Testi, SelfAssessment).
const DEMO_LESSON = {
  meta: {
    lang: "es",
    kurssiKey: "kurssi-2",
    kurssiTitle: "YO Espanja kertaus",
    lessonIndex: 3,
    lessonTitle: "Subjuntiivi",
    printedPages: "s. 191–194",
  },
  sivut: [
    { id: "teoria",   kind: "teoria",         num: "",   title: "Subjuntiivi",                       meta: "Opetussivu" },
    { id: "1",        kind: "tehtava",        num: "1",  title: "Muodosta verbimuotoja",             meta: "Drilli" },
    { id: "2a",       kind: "tehtava",        num: "2a", title: "Yhdistä lauseenosat",               meta: "Yhdistä" },
    { id: "2b",       kind: "tehtava",        num: "2b", title: "Täydennä subjuntiivilla",           meta: "Täydennä" },
    { id: "3",        kind: "tehtava",        num: "3",  title: "Käännä suomesta espanjaksi",        meta: "Käännä" },
    { id: "kortit-1", kind: "flashcards",     num: "",   title: "Kääntökortit · Subjuntiivin liipaisimet", meta: "5 korttia" },
    { id: "test-1a",  kind: "testi",          num: "T1", title: "Test 1a · Käännä",                  meta: "Pisteytys" },
    { id: "test-2",   kind: "testi",          num: "T2", title: "Test 2 · Valitse oikea muoto",      meta: "Pisteytys" },
    { id: "arvio",    kind: "itsearviointi",  num: "",   title: "Arvioi omia taitojasi",             meta: "Itsearvio" },
  ],
};

const KIND_GROUP = {
  teoria: "Opetus",
  tehtava: "Harjoitukset",
  flashcards: "Kortit",
  testi: "Testit",
  itsearviointi: "Itsearvio",
};

const KIND_PLACEHOLDER = {
  teoria: {
    label: "Teoriasivu — tulossa PR 2",
    body: "Subjuntiivin perussäännöt, käyttötilanteet, ja indikatiivi/subjuntiivi-vertailu kaksikielisinä taulukoina. Pieni Obs!-laatikko yleisimmille poikkeuksille (verbit jotka pakottavat subjuntiivin: querer que, esperar que, dudar que, no creer que). PR 2 vie sisällön nykyisistä lesson_M.json:in teaching-kentistä tähän.",
  },
  tehtava: {
    label: "Harjoitustehtävä — tulossa PR 4",
    body: "Yksittäinen drill / yhdistä / täydennä / käännä -tehtävä. Renderöinti tulee lessonRunneristä mutta upotettuna tähän sivuun (ei modaali, ei screen-swap). Lähde: nykyinen lesson_M.json:in items-array; PR 4 mappaa item-tyypin (multiple-choice, fill-blank, …) tämän sivun tehtäväksi.",
  },
  flashcards: {
    label: "Kääntökortit — tulossa PR 5",
    body: "Pino kääntyviä kortteja (etupuoli: lähdekielinen virke, takapuoli: suomi + sääntö). Tila per kortti: ”tiedän” / ”harjoittele vielä”, persistoitu localStorage:en + Supabaseen kirjautuneille.",
  },
  testi: {
    label: "Testi — tulossa PR 6",
    body: "Sama UI kuin tehtävällä, mutta ilman live-feedbackia per kohta. Käyttäjä vastaa kaikkiin, painaa ”Tarkista” ja näkee lopputuloksen + per-kohta-palautteen.",
  },
  itsearviointi: {
    label: "Itsearviointi — tulossa PR 7",
    body: "4–5 väittämää 1–5-asteikolla (”Hallitsen subjuntiivin perussäännöt”, ”Tunnistan liipaisinverbit”, …). Tulokset Supabaseen, ohjaavat seuraavan oppitunnin tasoa.",
  },
};

let _wired = false;
let _state = { lang: "es", kurssiKey: "kurssi-2", lessonIndex: 3, sivuId: "teoria" };

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

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function findSivuIndex(sivuId) {
  const i = DEMO_LESSON.sivut.findIndex((s) => s.id === sivuId);
  return i >= 0 ? i : 0;
}

// ─── Rendering ─────────────────────────────────────────────────────────

function renderTopbar() {
  const { meta } = DEMO_LESSON;
  const langLabel = meta.lang === "es" ? "Espanja" : meta.lang === "fr" ? "Ranska" : "Saksa";
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
        <a href="#/oppimispolku?lang=${escapeHtml(meta.lang)}">${escapeHtml(langLabel)}</a>
        <span class="dk__breadcrumb-sep">/</span>
        <a href="#/oppimispolku/${escapeHtml(meta.lang)}/${encodeURIComponent(meta.kurssiKey)}">${escapeHtml(meta.kurssiTitle)}</a>
      </nav>
      <h1 class="dk__title">${escapeHtml(meta.lessonTitle)}</h1>
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
  for (const s of DEMO_LESSON.sivut) {
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
      const isActive = s.id === _state.sivuId;
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
        <span class="dk__sidemenu-count">${DEMO_LESSON.sivut.length} sivua</span>
      </div>
      <nav class="dk__sidemenu-list" id="dk-sidemenu-list">
        ${rows}
      </nav>
    </aside>
    <div class="dk__sidemenu-backdrop" id="dk-sidemenu-backdrop" aria-hidden="true"></div>`;
}

function renderContent() {
  const { meta } = DEMO_LESSON;
  const idx = findSivuIndex(_state.sivuId);
  const sivu = DEMO_LESSON.sivut[idx];
  const prev = idx > 0 ? DEMO_LESSON.sivut[idx - 1] : null;
  const next = idx < DEMO_LESSON.sivut.length - 1 ? DEMO_LESSON.sivut[idx + 1] : null;

  const placeholder = KIND_PLACEHOLDER[sivu.kind] || KIND_PLACEHOLDER.tehtava;
  const titleHtml = sivu.kind === "teoria"
    ? `<em>${escapeHtml(sivu.title)}</em>`
    : `${sivu.num ? `${escapeHtml(sivu.num)} · ` : ""}${escapeHtml(sivu.title)}`;

  return `
    <main class="dk__content" id="dk-content" tabindex="-1">
      ${renderPrevNext(prev, next, "top")}
      <p class="dk__page-meta">${escapeHtml(meta.kurssiTitle)} · Oppitunti ${escapeHtml(String(meta.lessonIndex))} · ${escapeHtml(meta.printedPages)}</p>
      <h2 class="dk__page-title">${titleHtml}</h2>
      <div class="dk__placeholder" data-kind="${escapeHtml(sivu.kind)}">
        <p class="dk__placeholder-kind">${escapeHtml(placeholder.label)}</p>
        <p>${escapeHtml(placeholder.body)}</p>
      </div>
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
      // Mobile: SideMenu acts as a slide-in drawer (open/closed).
      const next = dk.dataset.sidemenu === SIDEMENU_OPEN ? SIDEMENU_COLLAPSED : SIDEMENU_OPEN;
      applySidemenuState(next);
      // Don't persist mobile drawer state — it's a transient overlay.
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
  if (!sivuId || sivuId === _state.sivuId) return;
  const i = DEMO_LESSON.sivut.findIndex((s) => s.id === sivuId);
  if (i < 0) return;
  _state.sivuId = sivuId;
  const { meta } = DEMO_LESSON;
  const target = `#/oppitunti/${meta.lang}/${encodeURIComponent(meta.kurssiKey)}/${meta.lessonIndex}/${encodeURIComponent(sivuId)}`;
  if (location.hash !== target) {
    history.replaceState(null, "", target);
  }
  // Re-render only the SideMenu list (active state) + content.
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
  // On mobile, close the drawer after a row click.
  if (window.matchMedia("(max-width: 1023px)").matches) {
    applySidemenuState(SIDEMENU_COLLAPSED);
  }
  // Keep focus on the new content for screen readers.
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

/**
 * Open the digikirja screen at a specific sivu.
 * @param {object} route { lang, kurssiKey, lessonIndex, sivuId }
 */
export function showDigikirja(route = {}) {
  if (!_wired) initDigikirja();

  // PR 1: only the hardcoded demo lesson is supported. Any other route
  // value still renders the same demo lesson so the navigation skeleton
  // can be exercised end-to-end. PR 2+ wire real lesson lookup.
  _state.lang = route.lang || DEMO_LESSON.meta.lang;
  _state.kurssiKey = route.kurssiKey || DEMO_LESSON.meta.kurssiKey;
  _state.lessonIndex = Number(route.lessonIndex) || DEMO_LESSON.meta.lessonIndex;
  _state.sivuId = route.sivuId && DEMO_LESSON.sivut.some((s) => s.id === route.sivuId)
    ? route.sivuId
    : DEMO_LESSON.sivut[0].id;

  const host = document.getElementById("screen-digikirja");
  if (!host) return;

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

  show("screen-digikirja");
}

/**
 * Parse a digikirja hash and open the screen if it matches.
 * Returns true if the hash was consumed.
 */
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
