/**
 * COURSE OVERVIEW screen — PR auto/course-overview (2026-05-19).
 *
 * Sits between HOME and the per-mode flows. Shows the chosen course's
 * cover + meta + 4 mode tiles (Oppimispolku / Kirjoitustehtävä /
 * Luetun ymmärtäminen / Koeharjoitus). Free users see lock badges +
 * "Avaa Treeni" CTAs on gated modes; pro/treeni users see no badges.
 *
 * Hash route: #/kurssi/{lang}/{kurssiKey}
 */

import { API, apiFetch, isLoggedIn, authHeader } from "../api.js";
import { show } from "../ui/nav.js";

const _courseCache = new Map(); // `${lang}/${key}` → { ts, kurssi }

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function isProTier() {
  const sub = window._userProfile?.subscription_status || "";
  return ["pro", "treeni", "lifetime", "trialing", "active"].some(
    (s) => sub.toLowerCase().includes(s)
  );
}

async function fetchCourse(lang, kurssiKey) {
  const cacheKey = `${lang}/${kurssiKey}`;
  const cached = _courseCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < 60_000) return cached.kurssi;
  try {
    const res = await apiFetch(`${API}/api/curriculum?lang=${encodeURIComponent(lang)}`, {
      headers: { ...(isLoggedIn() ? authHeader() : {}) },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const kurssit = Array.isArray(data?.kurssit) ? data.kurssit : [];
    const found = kurssit.find((k) => k.key === kurssiKey) || null;
    if (found) {
      // Stash sortOrder so the hero can show "Kurssi N" prefix without
      // a second fetch. /api/curriculum lists them in order.
      found._stepNumber = kurssit.findIndex((k) => k.key === kurssiKey) + 1;
      _courseCache.set(cacheKey, { ts: Date.now(), kurssi: found });
    }
    return found;
  } catch {
    return null;
  }
}

const MODES = [
  {
    id: "path",
    title: "Oppimispolku",
    body: "Vaiheittainen kurssin sis&auml;lt&ouml; sanasto- ja kielioppi&shy;tehtavineen.",
    icon: "📚",
    gateForFree: false, // free can do 1 lesson/day per existing checkFeatureAccess
    badge: { free: "Yksi oppitunti per p&auml;iv&auml;", pro: null },
    target: ({ lang, kurssiKey }) => `#/oppimispolku?lang=${lang}&kurssi=${encodeURIComponent(kurssiKey)}`,
  },
  {
    id: "writing",
    title: "Kirjoitusteht&auml;v&auml;",
    body: "AI arvioi tuotoksen YTL-rubriikilla. Saat pisteet ja konkreettiset korjaukset.",
    icon: "✍️",
    gateForFree: false,
    badge: { free: "3 teht&auml;v&auml;&auml; per kuukausi", pro: null },
    target: () => "#/kirjoitus",
  },
  {
    id: "reading",
    title: "Luetun ymm&auml;rt&auml;minen",
    body: "Aitoja YO-tyylisi&auml; tekstej&auml; ja monivalintatehtaev&auml;t.",
    icon: "📖",
    gateForFree: false,
    badge: { free: "5 teksti&auml; per p&auml;iv&auml;", pro: null },
    target: () => "#/luetun",
  },
  {
    id: "exam",
    title: "Koeharjoitus",
    body: "Koko YO-koe simulaationa. AI-arvio kaikkiin osa-alueisiin.",
    icon: "🎓",
    gateForFree: true,
    badge: { free: "Avaa Treeni", pro: null },
    target: () => "#/koeharjoitus",
  },
];

function renderHero(kurssi, lang) {
  const stepNumber = kurssi._stepNumber || 1;
  const completed = kurssi.lessonsCompleted || 0;
  const total = kurssi.lessonCount || 10;
  const pct = Math.min(100, Math.round((completed / total) * 100));
  const hueA = (stepNumber * 47) % 360;
  const hueB = (hueA + 28) % 360;

  return `
    <nav class="co-breadcrumb" aria-label="Sijainti">
      <a class="co-breadcrumb__link" href="#/aloitus">Aloitus</a>
      <span class="co-breadcrumb__sep" aria-hidden="true">/</span>
      <span class="co-breadcrumb__crumb is-current" aria-current="page">${escapeHtml(`Kurssi ${stepNumber}`)}</span>
    </nav>
    <header class="co-hero">
      <div class="co-hero__cover"
           style="background: linear-gradient(135deg, oklch(72% 0.08 ${hueA}) 0%, oklch(58% 0.10 ${hueB}) 100%);">
        <span class="co-hero__num">${stepNumber}</span>
      </div>
      <div class="co-hero__body">
        <p class="co-hero__eyebrow">${escapeHtml(`Kurssi ${stepNumber}`)} &middot; Taso ${escapeHtml(kurssi.level || "—")}</p>
        <h1 class="co-hero__title display display--serif">${escapeHtml(kurssi.title || "")}</h1>
        ${kurssi.description ? `<p class="co-hero__desc">${escapeHtml(kurssi.description)}</p>` : ""}
        <div class="co-hero__progress">
          <div class="co-hero__progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct} % suoritettu">
            <div class="co-hero__progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="co-hero__progress-text mono-num">${completed} / ${total} oppituntia &middot; ${pct} %</span>
        </div>
      </div>
    </header>`;
}

function renderModeTile(mode, ctx, isPro) {
  const badge = isPro ? mode.badge.pro : mode.badge.free;
  const locked = !isPro && mode.gateForFree;
  const cls = ["co-mode", `co-mode--${mode.id}`, locked ? "is-locked" : ""].filter(Boolean).join(" ");
  const href = mode.target(ctx);

  return `
    <a class="${cls}" href="${href}" data-mode="${mode.id}" ${locked ? 'aria-disabled="true"' : ""}>
      <span class="co-mode__icon" aria-hidden="true">${mode.icon}</span>
      <div class="co-mode__body">
        <h3 class="co-mode__title">${escapeHtml(mode.title)}</h3>
        <p class="co-mode__desc">${mode.body}</p>
      </div>
      ${badge ? `<span class="co-mode__badge ${locked ? "is-lock" : ""}">${locked ? "🔒 " : ""}${badge}</span>` : ""}
    </a>`;
}

function renderUpgradeCallout(isPro) {
  if (isPro) return "";
  return `
    <aside class="co-upgrade">
      <p class="co-upgrade__eyebrow">Treeni</p>
      <h4 class="co-upgrade__title">Avaa kaikki harjoitukset.</h4>
      <p class="co-upgrade__body">Treeni-tilauksella saat rajoittamattoman p&auml;&auml;syn jokaiseen kurssiin, koeharjoituksiin ja kirjoitustehtaiv&auml;n AI-arvioon.</p>
      <button type="button" class="co-upgrade__cta" id="co-upgrade-cta">Tutustu Treeniin →</button>
    </aside>`;
}

function renderShell(kurssi, lang) {
  const isPro = isProTier();
  const ctx = { lang, kurssiKey: kurssi.key };
  const tiles = MODES.map((m) => renderModeTile(m, ctx, isPro)).join("");
  return `
    ${renderHero(kurssi, lang)}
    <section class="co-modes" aria-label="Harjoitustyypit">
      ${tiles}
    </section>
    ${renderUpgradeCallout(isPro)}`;
}

function renderError(root, msg) {
  root.innerHTML = `
    <nav class="co-breadcrumb" aria-label="Sijainti">
      <a class="co-breadcrumb__link" href="#/aloitus">Aloitus</a>
    </nav>
    <div class="co-error" role="alert">
      <p>${escapeHtml(msg || "Kurssia ei l&ouml;ytynyt.")}</p>
      <a class="btn-primary" href="#/aloitus">Palaa aloitukseen</a>
    </div>`;
}

export async function loadCourseOverview(lang, kurssiKey) {
  show("screen-course-overview");
  const root = document.getElementById("co-root");
  if (!root) return;
  root.innerHTML = `<p class="co-loading">Ladataan kurssia&hellip;</p>`;
  if (!kurssiKey || !lang) {
    renderError(root, "Kurssin tunnistetta ei annettu.");
    return;
  }
  const kurssi = await fetchCourse(lang, kurssiKey);
  if (!kurssi) {
    renderError(root, "Kurssia ei l&ouml;ytynyt. Onkohan tunniste oikein?");
    return;
  }
  root.innerHTML = renderShell(kurssi, lang);

  // Wire tile clicks — pre-seed the path's expanded course before the
  // hashchange routes to it, so opening Oppimispolku from here lands
  // directly on this course (not the first-active default).
  root.querySelectorAll(".co-mode").forEach((a) => {
    a.addEventListener("click", async (e) => {
      const mode = a.dataset.mode;
      if (a.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        return;
      }
      if (mode === "path") {
        e.preventDefault();
        try {
          const m = await import("./curriculum.js");
          if (m._setExpandedKurssi) m._setExpandedKurssi(kurssi.key);
          location.hash = "#/oppimispolku";
          if (m.loadCurriculum) m.loadCurriculum();
        } catch {
          location.hash = "#/oppimispolku";
        }
      }
      // Other modes use native href navigation (#/kirjoitus, #/luetun,
      // #/koeharjoitus). main.js hashchange handler dispatches them.
    });
  });

  root.querySelector("#co-upgrade-cta")?.addEventListener("click", () => {
    import("../features/paywallModal.js").then((m) => m.openPaywallModal?.()).catch(() => {});
  });
}

/**
 * Parse `#/kurssi/{lang}/{kurssiKey}` and load the screen. Returns true
 * if the hash matched, false otherwise so main.js can fall through to
 * the regular NAV_HASH dispatch.
 */
export function tryRouteCourseOverview(hash) {
  const m = /^#\/kurssi\/([a-z]{2})\/([^/?#]+)/i.exec(hash || "");
  if (!m) return false;
  const lang = m[1].toLowerCase();
  const kurssiKey = decodeURIComponent(m[2]);
  loadCourseOverview(lang, kurssiKey);
  return true;
}
