/**
 * HOME — PR auto/ohjaamo (2026-05-19).
 *
 * Rewritten per docs/superpowers/specs/2026-05-19-mode-first-hierarchy-design.md.
 * Top tabs pick language. Below: greeting + ohjaamo (student stats,
 * level + YO-valmius gated for free) + 4 mode cards
 * (Oppimispolku / Kirjoitustehtävä / Luetun ymmärt. / Koeharjoitus).
 *
 * The earlier course-library grid is gone — modes are now top-level,
 * Oppimispolku opens its own kurssilista at #/oppimispolku?lang=X.
 */

import { API, apiFetch, isLoggedIn, authHeader } from "../api.js";
import { show } from "../ui/nav.js";
import { isProTier } from "../lib/tier.js";

const LANGS = [
  { code: "es", label: "Espanja", flag: "🇪🇸" },
  { code: "fr", label: "Ranska", flag: "🇫🇷" },
  { code: "de", label: "Saksa", flag: "🇩🇪" },
];

// User explicitly asked to drop the Ranska + Saksa tabs from the home
// screen unless the student opted into multiple languages during
// onboarding. localStorage["puheo:enabled-langs"] is a JSON array of
// language codes the student picked; default is ["es"] for new accounts.
const ENABLED_LANGS_KEY = "puheo:enabled-langs";
function readEnabledLangs() {
  try {
    const raw = localStorage.getItem(ENABLED_LANGS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch { /* private mode */ }
  return ["es"];
}

const LANG_KEY = "puheo:lang";
let _ohjaamoData = null;

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function readActiveLang() {
  const enabled = readEnabledLangs();
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && enabled.includes(v)) return v;
  } catch { /* private mode */ }
  return enabled[0] || "es";
}

function writeActiveLang(code) {
  try { localStorage.setItem(LANG_KEY, code); } catch { /* ignore */ }
}

async function fetchOhjaamo() {
  if (_ohjaamoData && (Date.now() - _ohjaamoData.ts) < 60_000) {
    return _ohjaamoData.payload;
  }
  try {
    const res = await apiFetch(`${API}/api/dashboard/v2`, {
      headers: { ...(isLoggedIn() ? authHeader() : {}) },
    });
    if (!res.ok) return null;
    const data = await res.json();
    _ohjaamoData = { ts: Date.now(), payload: data };
    return data;
  } catch {
    return null;
  }
}

function renderTabs(activeLang) {
  const enabled = readEnabledLangs();
  // Show the tab strip ONLY when 2+ langs are enabled. A single-lang user
  // sees no tab row at all (one tab is pure chrome).
  const visible = LANGS.filter((l) => enabled.includes(l.code));
  if (visible.length < 2) return "";
  return visible.map((l) => `
    <button type="button"
            class="home-tab ${l.code === activeLang ? "is-active" : ""}"
            data-lang="${l.code}"
            role="tab"
            aria-selected="${l.code === activeLang ? "true" : "false"}">
      <span class="home-tab__flag" aria-hidden="true">${l.flag}</span>
      <span class="home-tab__label">${escapeHtml(l.label)}</span>
    </button>
  `).join("");
}

function renderOhjaamoCell({ label, value, locked }) {
  return `
    <div class="ohjaamo-cell ${locked ? "is-locked" : ""}">
      <span class="ohjaamo-cell__label">${escapeHtml(label)}</span>
      <span class="ohjaamo-cell__value">${locked ? '<span class="ohjaamo-cell__lock" aria-hidden="true">🔒</span>' : ""}${locked ? "—" : escapeHtml(value)}</span>
    </div>`;
}

function daysUntilExam(profile) {
  // exam_date is stored as "YYYY-MM-DD" in user_profile. Spring exam falls
  // mid-March, autumn mid-September; settings.js writes "${YYYY-MM}-15".
  const raw = profile?.exam_date;
  if (!raw) return null;
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const ms = d.getTime() - now.setHours(0, 0, 0, 0);
  const days = Math.round(ms / 86_400_000);
  return Number.isFinite(days) ? days : null;
}

function renderOhjaamo(data, isPro) {
  const dashboard = data?.dashboard || {};
  const streak = dashboard.streak ?? 0;
  const sessions = dashboard.totalSessions ?? 0;
  const level = dashboard.estLevel || dashboard.currentLevel || "—";
  const yoReadiness = dashboard.yoReadinessPct != null ? `${dashboard.yoReadinessPct} %` : "—";
  const examDays = daysUntilExam(data?.profile?.profile);
  const examCell = examDays == null
    ? "Aseta päivä"
    : examDays < 0 ? "Mennyt"
    : examDays === 0 ? "Tänään"
    : `${examDays} pv`;

  const upgradeRow = isPro ? "" : `
    <div class="ohjaamo-upgrade">
      <p class="ohjaamo-upgrade__body">Avaa Treeni nähdäksesi tasosi ja YO-valmiusarvion sekä rajoittamattomat harjoitukset.</p>
      <button type="button" class="ohjaamo-upgrade__cta" id="ohjaamo-upgrade-cta">Tutustu Treeniin →</button>
    </div>`;

  return `
    <section class="ohjaamo" aria-label="Ohjaamo">
      <p class="ohjaamo__eyebrow">Ohjaamo</p>
      <div class="ohjaamo__grid">
        ${renderOhjaamoCell({ label: "YO-kokeeseen", value: examCell, locked: false })}
        ${renderOhjaamoCell({ label: "Päivän putki", value: `${streak} pv`, locked: false })}
        ${renderOhjaamoCell({ label: "Harjoituksia", value: `${sessions}`, locked: false })}
        ${renderOhjaamoCell({ label: "Tasosi", value: level, locked: !isPro })}
        ${renderOhjaamoCell({ label: "YO-valmius", value: yoReadiness, locked: !isPro })}
      </div>
      ${upgradeRow}
    </section>`;
}

const MODES = [
  {
    id: "path",
    title: "Oppimispolku",
    body: "Vaiheittainen kurssi sanasto- ja kielioppitehtävineen.",
    chip: "8 kurssia · 80 oppituntia",
    freeBadge: "Yksi oppitunti per päivä",
    locked: false,
    target: (lang) => `#/oppimispolku?lang=${lang}`,
  },
  {
    id: "writing",
    title: "Kirjoitustehtävä",
    body: "AI arvioi tuotoksesi YTL-rubriikilla ja antaa konkreettiset korjaukset.",
    chip: "Lyhyt + pitkä",
    freeBadge: "3 tehtävää per kuukausi",
    locked: false,
    target: (lang) => `#/kirjoitus?lang=${lang}`,
  },
  {
    id: "reading",
    title: "Luetun ymmärtäminen",
    body: "Aitoja YO-tyylisiä tekstejä monivalintatehtävineen.",
    chip: "180 tekstiä",
    freeBadge: "5 tekstiä per päivä",
    locked: false,
    target: (lang) => `#/luetun?lang=${lang}`,
  },
  {
    id: "exam",
    title: "Koeharjoitus",
    body: "Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",
    chip: "Täysi YO-simulaatio",
    freeBadge: "Avaa Treeni",
    locked: true, // hard-locked for free
    target: (lang) => `#/koeharjoitus?lang=${lang}`,
  },
];

function renderModeCard(mode, lang, isPro) {
  const showLock = mode.locked && !isPro;
  const cls = ["home-mode", `home-mode--${mode.id}`, showLock ? "is-locked" : ""].filter(Boolean).join(" ");
  const badge = !isPro
    ? `<span class="home-mode__badge ${showLock ? "is-lock" : ""}">${showLock ? "🔒 " : ""}${escapeHtml(mode.freeBadge)}</span>`
    : "";
  return `
    <a class="${cls}" href="${mode.target(lang)}" data-mode="${mode.id}" ${showLock ? 'aria-disabled="true"' : ""}>
      <div class="home-mode__body">
        <p class="home-mode__chip">${escapeHtml(mode.chip)}</p>
        <h3 class="home-mode__title">${escapeHtml(mode.title)}</h3>
        <p class="home-mode__desc">${escapeHtml(mode.body)}</p>
      </div>
      ${badge}
    </a>`;
}

function renderShell(activeLang, data, isPro) {
  const tabs = renderTabs(activeLang);
  const tiles = MODES.map((m) => renderModeCard(m, activeLang, isPro)).join("");
  const userName = data?.profile?.profile?.preferred_name
    || data?.profile?.profile?.full_name
    || window._userProfile?.preferred_name
    || "";
  const hour = new Date().getHours();
  const greet = hour < 11 ? "Huomenta" : hour < 18 ? "Päivää" : "Iltaa";
  const greeting = userName ? `${greet}, ${userName}.` : `${greet}.`;

  return `
    <header class="home-head">
      <h1 class="home-greeting display display--serif">${escapeHtml(greeting)}</h1>
    </header>
    <div class="home-tabs" role="tablist" aria-label="Kielet">${tabs}</div>
    <div id="ohjaamo-root">${renderOhjaamo(data, isPro)}</div>
    <section class="home-modes" aria-label="Harjoitustyypit">${tiles}</section>`;
}

function wireTabs(root, isPro) {
  root.querySelectorAll(".home-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const lang = tab.dataset.lang;
      if (!lang) return;
      writeActiveLang(lang);
      root.querySelectorAll(".home-tab").forEach((t) => {
        const isThis = t === tab;
        t.classList.toggle("is-active", isThis);
        t.setAttribute("aria-selected", isThis ? "true" : "false");
      });
      // Re-render mode card hrefs with the new lang.
      root.querySelectorAll(".home-mode").forEach((a) => {
        const id = a.dataset.mode;
        const mode = MODES.find((m) => m.id === id);
        if (mode) a.setAttribute("href", mode.target(lang));
      });
    });
  });
}

function wireUpgrade(root) {
  root.querySelector("#ohjaamo-upgrade-cta")?.addEventListener("click", () => {
    import("../features/paywallModal.js").then((m) => m.openPaywallModal?.()).catch(() => {});
  });
  // Locked ohjaamo cells also open paywall.
  root.querySelectorAll(".ohjaamo-cell.is-locked").forEach((cell) => {
    cell.addEventListener("click", () => {
      import("../features/paywallModal.js").then((m) => m.openPaywallModal?.()).catch(() => {});
    });
    cell.style.cursor = "pointer";
  });
}

function wireModes(root, isPro) {
  root.querySelectorAll(".home-mode").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (a.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        import("../features/paywallModal.js").then((m) => m.openPaywallModal?.()).catch(() => {});
      }
    });
  });
}

// v247 — Layout-matching skeleton for the home shell. Replaces the empty
// `home-loading` div that left the cream content area blank for ~820 ms
// after login while /api/dashboard/v2 resolved. Mirrors the real shell
// structure (greeting, ohjaamo grid, four mode tiles) so the swap into
// the live render doesn't reflow the page.
function renderShellSkeleton(activeLang) {
  const tabs = renderTabs(activeLang);
  const cells = Array.from({ length: 5 }).map(() => `
    <div class="ohjaamo-cell ohjaamo-cell--skel" aria-hidden="true">
      <span class="ohjaamo-cell__label home-skel home-skel--label"></span>
      <span class="ohjaamo-cell__value home-skel home-skel--value"></span>
    </div>`).join("");
  const tiles = Array.from({ length: 4 }).map(() => `
    <div class="home-mode home-mode--skel" aria-hidden="true">
      <div class="home-mode__body">
        <p class="home-mode__chip home-skel home-skel--chip"></p>
        <h3 class="home-mode__title home-skel home-skel--title"></h3>
        <p class="home-mode__desc home-skel home-skel--desc"></p>
      </div>
    </div>`).join("");
  return `
    <div class="home-skel-root" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotinäyttöä…</span>
      <header class="home-head" aria-hidden="true">
        <h1 class="home-greeting display display--serif home-skel home-skel--greeting"></h1>
      </header>
      <div class="home-tabs" aria-hidden="true">${tabs}</div>
      <div id="ohjaamo-root">
        <section class="ohjaamo" aria-hidden="true">
          <p class="ohjaamo__eyebrow home-skel home-skel--eyebrow"></p>
          <div class="ohjaamo__grid">${cells}</div>
        </section>
      </div>
      <section class="home-modes" aria-hidden="true">${tiles}</section>
    </div>`;
}

export async function loadHome() {
  show("screen-home");
  const root = document.getElementById("home-root");
  if (!root) return;
  const activeLang = readActiveLang();
  // Repeat-visit fast path: if we already have ohjaamo data cached
  // (TTL 60 s, see fetchOhjaamo), paint the real shell synchronously
  // so subsequent home-loads have no skeleton frame at all.
  if (_ohjaamoData && (Date.now() - _ohjaamoData.ts) < 60_000) {
    const cached = _ohjaamoData.payload;
    const isPro = isProTier(cached?.profile?.profile);
    root.innerHTML = renderShell(activeLang, cached, isPro);
    wireTabs(root, isPro);
    wireUpgrade(root);
    wireModes(root, isPro);
    return;
  }
  root.innerHTML = renderShellSkeleton(activeLang);
  const data = await fetchOhjaamo();
  const isPro = isProTier(data?.profile?.profile);
  root.innerHTML = renderShell(activeLang, data, isPro);
  wireTabs(root, isPro);
  wireUpgrade(root);
  wireModes(root, isPro);
}
