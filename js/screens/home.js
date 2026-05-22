/**
 * HOME — v280 dashboard real-redesign (2026-05-22).
 *
 * Implements docs/briefs/2026-05-22-dashboard-v2-real-redesign.md.
 *
 * v271 was six stacked text boxes — user complained "flat ja tylsä,
 * täynnä ai sloppia, pitää olla paljon elävämpi". That diagnosis is
 * correct. This rewrite breaks the symmetry:
 *
 *   ┌──────────────────────────────────┬──────────────────┐
 *   │  HERO (cream + SVG arch motif)   │  Streak ring     │
 *   │  Location eyebrow                 │                  │
 *   │  Fraunces title (NOT italic)     ├──────────────────┤
 *   │  Sub                              │  Vinkki päivään  │
 *   │  Brick CTA pill                   │  (warm tint)     │
 *   └──────────────────────────────────┴──────────────────┘
 *   ┌──────────────────┬───────────┬───────────┐
 *   │  Active mode     │  mode B   │  mode C   │   asymmetric 2fr 1fr 1fr
 *   │  (big, progress) │           │           │
 *   └──────────────────┴───────────┴───────────┘
 *   Koeharjoitus · Vaihda kieltä · Asetukset
 *
 * Inline SVG illustration instead of stock photo: brand-cohesive Old-Spain
 * palette, no clichéd "person with laptop", no license overhead, performant
 * (no extra fetch). One arch motif per language family (ES horseshoe arch,
 * FR wrought-iron curl, DE bauhaus circle).
 */

import { API, apiFetch, isLoggedIn, authHeader } from "../api.js";
import { show } from "../ui/nav.js";
import { isProTier } from "../lib/tier.js";

const LANGS = [
  { code: "es", label: "Espanja", flag: "🇪🇸" },
  { code: "fr", label: "Ranska", flag: "🇫🇷" },
  { code: "de", label: "Saksa", flag: "🇩🇪" },
];

const ENABLED_LANGS_KEY = "puheo:enabled-langs";
const LANG_KEY = "puheo:lang";
const DEFAULT_GOAL_MIN = 15;
let _ohjaamoData = null;

// Per-language theme-and-curriculum metadata used by the hero card. Course
// titles mirror the curricula list — we don't import the whole curriculum
// module just to read 8 names, this is a deliberately small dependency.
const HERO_THEMES = {
  es: {
    label: "Espanja",
    courses: [
      { num: 1, title: "Tervehdys ja arki",      hook: "Aloita ensimmäisistä lauseista." },
      { num: 2, title: "Arjen rutiinit",         hook: "Päivän rytmi ja toistuvat tavat." },
      { num: 3, title: "Matkailu ja kaupungit",  hook: "Sanoja juna-asemalle ja kahvilaan." },
      { num: 4, title: "Ennen ja nyt",           hook: "Menneestä imperfektillä, nyt nykyisin." },
      { num: 5, title: "Ympäristö ja maisema",   hook: "Luonto, kaupunki ja kestävyys." },
      { num: 6, title: "Työ ja opiskelu",        hook: "Ammatit, suunnitelmat ja CV-sanasto." },
      { num: 7, title: "Terveys ja hyvinvointi", hook: "Vartalo, lääkäri ja arjen kunto." },
      { num: 8, title: "Kulttuuri ja taide",     hook: "Elokuva, musiikki ja kirjallisuus." },
    ],
  },
  fr: {
    label: "Ranska",
    courses: [
      { num: 1, title: "Salutations et quotidien", hook: "Aloita ensimmäisistä lauseista." },
      { num: 2, title: "Routines quotidiennes",    hook: "Päivän rytmi ja toistuvat tavat." },
      { num: 3, title: "Voyages et villes",        hook: "Sanoja juna-asemalle ja kahvilaan." },
      { num: 4, title: "Avant et maintenant",      hook: "Menneestä imperfektillä, nyt nykyisin." },
      { num: 5, title: "Environnement et paysage", hook: "Luonto, kaupunki ja kestävyys." },
      { num: 6, title: "Travail et études",        hook: "Ammatit, suunnitelmat ja CV-sanasto." },
      { num: 7, title: "Santé et bien-être",       hook: "Vartalo, lääkäri ja arjen kunto." },
      { num: 8, title: "Culture et arts",          hook: "Elokuva, musiikki ja kirjallisuus." },
    ],
  },
  de: {
    label: "Saksa",
    courses: [
      { num: 1, title: "Begrüßung und Alltag",     hook: "Aloita ensimmäisistä lauseista." },
      { num: 2, title: "Alltagsroutinen",          hook: "Päivän rytmi ja toistuvat tavat." },
      { num: 3, title: "Reisen und Städte",        hook: "Sanoja juna-asemalle ja kahvilaan." },
      { num: 4, title: "Früher und heute",         hook: "Menneestä imperfektillä, nyt nykyisin." },
      { num: 5, title: "Umwelt und Landschaft",    hook: "Luonto, kaupunki ja kestävyys." },
      { num: 6, title: "Arbeit und Studium",       hook: "Ammatit, suunnitelmat ja CV-sanasto." },
      { num: 7, title: "Gesundheit und Wohl",      hook: "Vartalo, lääkäri ja arjen kunto." },
      { num: 8, title: "Kultur und Kunst",         hook: "Elokuva, musiikki ja kirjallisuus." },
    ],
  },
};

// Daily tip — rotates by day-of-week. Per-language so the surface stays
// honest when user swaps languages. Hardcoded on the frontend because the
// brief explicitly forbids new API routes for this redesign.
const DAILY_TIPS = {
  es: [
    { title: "Subjunktiivi & ojalá",   body: "Käytä subjunktiivia kun ojalá tai querer que aloittaa lauseen." },
    { title: "Ser vs estar",           body: "Pysyvä ominaisuus = ser. Tilapäinen tila tai sijainti = estar." },
    { title: "Por vai para",           body: "Por kertoo syyn tai välineen. Para kertoo tarkoituksen tai määränpään." },
    { title: "Aksentti pelastaa",      body: "Pieni á ratkaisee onko sanasta substantiivi vai verbi." },
    { title: "Imperfekti vs preteriti",body: "Imperfekti maalaa taustaa. Preteriti kertoo mitä tapahtui." },
    { title: "Hay tai está",           body: "Hay = on olemassa (uusi tieto). Está = on tietyssä paikassa." },
    { title: "Lue ääneen päivittäin",  body: "Viisi minuuttia ääneen lukua treenaa korvaa nopeammin kuin sanalistat." },
  ],
  fr: [
    { title: "Avoir vai être",         body: "Useimmat verbit käyttävät avoir-passéssa, liikeverbit être." },
    { title: "Subjonctif & il faut que",body: "Il faut que ja je veux que vetävät verbin subjonctiviin." },
    { title: "C'est vai il est",       body: "C'est + substantiivi tai adjektiivi yksin. Il est + ammatti tai adjektiivi henkilöstä." },
    { title: "Du, de la, des",         body: "Osa-artikkeli kertoo että otat osan: du pain, de la confiture, des pommes." },
    { title: "Imparfait vai passé composé", body: "Imparfait maalaa taustaa. Passé composé kertoo päättyneen tapahtuman." },
    { title: "Y ja en pronominit",     body: "Y korvaa paikan tai à+asia. En korvaa de+asia tai määrän." },
    { title: "Lue ranskaa ääneen",     body: "Viisi minuuttia ääneen lukua opettaa korvalle nasaalit ja liaison-säännöt." },
  ],
  de: [
    { title: "Der, die, das",          body: "Suku ei seuraa logiikkaa — opettele se osana substantiivia." },
    { title: "Trennbare Verben",       body: "Aufstehen → ich stehe um sieben auf. Etuliite vaeltaa lauseen loppuun." },
    { title: "Akkusativ vai Dativ",    body: "Akkusativ = liike kohti (in die Stadt). Dativ = paikka jossa (in der Stadt)." },
    { title: "Modaaliverbit + Infinitiv",body: "Können, müssen, wollen vievät pääverbin infinitiivin lauseen loppuun." },
    { title: "Perfekti vs Imperfekti", body: "Puheessa Perfekti (ich habe gemacht). Kirjoituksessa Imperfekti (ich machte)." },
    { title: "Sanajärjestys",          body: "Verbi on lauseessa toinen elementti — vaikka edessä olisi adverbi tai aikamääre." },
    { title: "Lue saksaa ääneen",      body: "Viisi minuuttia ääneen lukua treenaa korvan ä, ö, ü ja ch-ääniin." },
  ],
};

function pickDailyTip(lang) {
  const list = DAILY_TIPS[lang] || DAILY_TIPS.es;
  const dow = new Date().getDay(); // 0-6
  return list[dow % list.length];
}

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

function finnishDateLabel(now = new Date()) {
  const weekday = now.toLocaleDateString("fi-FI", { weekday: "long" });
  const day = now.getDate();
  const month = now.toLocaleDateString("fi-FI", { month: "long" });
  const w = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${w} ${day}. ${month}`;
}

function renderTabs(activeLang) {
  const enabled = readEnabledLangs();
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

function renderTopBar(profile, activeLang) {
  const name = profile?.preferred_name
    || profile?.full_name
    || window._userProfile?.preferred_name
    || "";
  const greeting = name ? `Hei, ${escapeHtml(name)}.` : "Hei.";
  const dateLabel = escapeHtml(finnishDateLabel());
  const tabs = renderTabs(activeLang);
  return `
    <header class="home-topbar">
      <div class="home-topbar__greet">
        <p class="home-topbar__hello">${greeting}</p>
        <p class="home-topbar__date">${dateLabel}</p>
      </div>
      ${tabs ? `<div class="home-tabs" role="tablist" aria-label="Kielet">${tabs}</div>` : ""}
    </header>`;
}

// Hero SVG illustrations — per-language motif, brick stroke on cream.
// Anchored bottom-right of the hero card at low opacity. Inline SVG keeps
// it on the critical path (no extra request) and lets CSS color it via
// currentColor → --ed-accent.
function heroMotif(lang) {
  if (lang === "fr") {
    // Wrought-iron Haussmann balcony curl — repeating S-curves
    return `
      <svg class="home-hero__motif" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M20 180 C 20 130, 70 130, 70 90 S 120 50, 120 10"/>
          <path d="M60 180 C 60 130, 110 130, 110 90 S 160 50, 160 10"/>
          <path d="M100 180 C 100 130, 150 130, 150 90 S 200 50, 200 10"/>
          <path d="M140 180 C 140 130, 190 130, 190 90 S 240 50, 240 10"/>
          <circle cx="70" cy="90" r="6"/>
          <circle cx="110" cy="90" r="6"/>
          <circle cx="150" cy="90" r="6"/>
          <circle cx="190" cy="90" r="6"/>
          <path d="M0 180 L 240 180"/>
        </g>
      </svg>`;
  }
  if (lang === "de") {
    // Bauhaus circle + square + triangle — primary forms only
    return `
      <svg class="home-hero__motif" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="80" cy="100" r="60"/>
          <rect x="120" y="40" width="100" height="100"/>
          <path d="M30 180 L 90 80 L 150 180 Z"/>
        </g>
      </svg>`;
  }
  // Default ES: three Andalusian horseshoe arches with a tile band below
  return `
    <svg class="home-hero__motif" viewBox="0 0 240 200" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M20 170 L 20 100 A 30 36 0 0 1 80 100 L 80 170"/>
        <path d="M105 170 L 105 100 A 30 36 0 0 1 165 100 L 165 170"/>
        <path d="M190 170 L 190 100 A 30 36 0 0 1 250 100 L 250 170"/>
        <path d="M20 90 A 30 26 0 0 1 80 90"/>
        <path d="M105 90 A 30 26 0 0 1 165 90"/>
        <path d="M190 90 A 30 26 0 0 1 250 90"/>
        <path d="M0 170 L 240 170"/>
        <path d="M0 180 L 240 180" stroke-dasharray="6 6"/>
      </g>
    </svg>`;
}

// Hero — the dominant surface. Picks an active course (last visited from
// localStorage, falls back to course 1 for fresh accounts) and frames it
// as today's invitation. Brief: "Tänään puhutaan ympäristöstä"-tyyppinen
// otsikko, ei pelkkä "Jatka oppimispolulla".
function renderHero(dashboard, lang) {
  const sessions = Number(dashboard?.totalSessions ?? 0);
  let lastLesson = null;
  try {
    const raw = sessionStorage.getItem("currentLesson")
              || localStorage.getItem("puheo:last-lesson");
    if (raw) lastLesson = JSON.parse(raw);
  } catch { /* private mode */ }

  const theme = HERO_THEMES[lang] || HERO_THEMES.es;
  // Heuristic: progress through 8 courses scales with session count. Each
  // course is ~6 lessons of ~3 min = ~18 min of activity, so once you've
  // got ~6 sessions you're conceptually on course 2. Capped at 8.
  const courseIdx = Math.min(7, Math.max(0, Math.floor(sessions / 6)));
  const course = theme.courses[courseIdx];

  const isFresh = sessions === 0 && !lastLesson;
  const eyebrow = isFresh
    ? `${theme.label} · Aloita tästä`
    : `${theme.label} · Kurssi ${course.num}`;
  const title = isFresh
    ? `Aloita matka ${theme.label.toLowerCase()}an`
    : course.title;
  const sub = isFresh
    ? "Yksi oppitunti per päivä riittää. Aloitamme tutuilla sanoilla."
    : course.hook;
  const cta = isFresh ? "Aloita →" : "Jatka oppituntia →";

  return `
    <a class="home-hero ${isFresh ? "is-fresh" : ""}"
       href="#/oppimispolku?lang=${escapeHtml(lang)}"
       data-action="continue"
       data-lang="${escapeHtml(lang)}">
      <div class="home-hero__body">
        <p class="home-hero__eyebrow">${escapeHtml(eyebrow)}</p>
        <h2 class="home-hero__title">${escapeHtml(title)}</h2>
        <p class="home-hero__sub">${escapeHtml(sub)}</p>
        <span class="home-hero__cta">
          <span class="home-hero__cta-label">${escapeHtml(cta)}</span>
        </span>
      </div>
      <div class="home-hero__art" aria-hidden="true">
        ${heroMotif(lang)}
      </div>
    </a>`;
}

// Streak ring — SVG circle with stroke-dasharray progress against weekly
// goal (7 days). The number in the centre is the actual streak count;
// the ring fills proportionally. Visualises progress, not flat bar.
function renderStreakRing(dashboard) {
  const streak = Number(dashboard?.streak ?? 0);
  const profile = window._userProfile || {};
  const goalMin = Number(profile.preferred_session_length || DEFAULT_GOAL_MIN);

  const today = new Date().toISOString().slice(0, 10);
  const chartData = Array.isArray(dashboard?.chartData) ? dashboard.chartData : [];
  const todaySessions = chartData.filter((l) => l?.createdAt?.slice(0, 10) === today).length;
  const todayMin = Math.min(goalMin, todaySessions * 3);
  const goalMet = todayMin >= goalMin;

  // Ring math: r=46, circumference ≈ 289. Show progress against today's
  // minute goal — that's the immediate target. Streak number is the big
  // anchor; goal-met state colours the ring olive.
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, todayMin / goalMin));
  const offset = c * (1 - pct);

  const streakDisplay = streak >= 1 ? String(streak) : "0";
  const streakUnit = streak >= 1 ? "pv putki" : "aloita putki";

  return `
    <section class="home-streak ${goalMet ? "is-met" : ""} ${streak === 0 ? "is-empty" : ""}"
             aria-label="Päivän tavoite ja streak">
      <div class="home-streak__ring-wrap">
        <svg class="home-streak__ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <circle class="home-streak__track" cx="60" cy="60" r="${r}"
                  fill="none" stroke-width="8"/>
          <circle class="home-streak__fill" cx="60" cy="60" r="${r}"
                  fill="none" stroke-width="8"
                  stroke-linecap="round"
                  stroke-dasharray="${c}"
                  stroke-dashoffset="${offset}"
                  transform="rotate(-90 60 60)"/>
        </svg>
        <div class="home-streak__center">
          <span class="home-streak__num" data-target="${streak}">${streakDisplay}</span>
          <span class="home-streak__unit">${streakUnit}</span>
        </div>
      </div>
      <div class="home-streak__meta">
        <p class="home-streak__minutes">
          <span class="home-streak__minutes-val">${todayMin}</span>
          <span class="home-streak__minutes-sep">/</span>
          <span class="home-streak__minutes-goal">${goalMin}</span>
          <span class="home-streak__minutes-unit">min tänään</span>
        </p>
      </div>
    </section>`;
}

// Vinkki päivään — warm accent-tinted card that breaks the white-card
// monotony. Content rotates by day-of-week so subsequent visits in the
// same day stay stable.
function renderTipCard(lang) {
  const tip = pickDailyTip(lang);
  return `
    <section class="home-tip" aria-label="Vinkki päivään">
      <p class="home-tip__eyebrow">Vinkki päivään</p>
      <h3 class="home-tip__title">${escapeHtml(tip.title)}</h3>
      <p class="home-tip__body">${escapeHtml(tip.body)}</p>
      <a class="home-tip__more" href="#/oppimispolku?lang=${escapeHtml(lang)}">
        Lue lisää
        <span class="home-tip__arrow" aria-hidden="true">→</span>
      </a>
    </section>`;
}

// Modes snapshot — asymmetric 2fr 1fr 1fr grid on desktop. The current
// most-active mode becomes the feature card (bigger, fuller copy); the
// other two collapse into compact tiles. Kirjoitus folds under the
// feature on tall layouts so we keep 3 surfaces, not 4.
const MODES = [
  { id: "vocab",   label: "Sanasto",             sub: "Sanoja ja merkityksiä",       href: (l) => `#/oppimispolku?lang=${l}` },
  { id: "grammar", label: "Kielioppi",           sub: "Rakenteet ja muodot",         href: (l) => `#/oppimispolku?lang=${l}` },
  { id: "reading", label: "Luetun ymmärtäminen", sub: "Tekstejä ja kysymyksiä",      href: (l) => `#/luetun?lang=${l}` },
  { id: "writing", label: "Kirjoitus",           sub: "Lyhyitä omia tekstejä",       href: (l) => `#/kirjoitus?lang=${l}` },
];

function renderModes(dashboard, lang) {
  const modeStats = dashboard?.modeStats || {};
  // Pick feature mode = mode with the most sessions; default vocab if all 0.
  let featureId = "vocab";
  let max = -1;
  for (const m of MODES) {
    const s = Number(modeStats[m.id]?.sessions ?? 0);
    if (s > max) { max = s; featureId = m.id; }
  }
  const feature = MODES.find((m) => m.id === featureId);
  const rest = MODES.filter((m) => m.id !== featureId);

  const fSessions = Number(modeStats[featureId]?.sessions ?? 0);
  const fPct = Math.max(0, Math.min(100, Math.round((fSessions / 30) * 100)));
  const fMeta = fSessions === 0
    ? "Ei vielä aloitettu"
    : `${fSessions} ${fSessions === 1 ? "harjoitus" : "harjoitusta"} kertynyt`;

  const featureCard = `
    <a class="home-mode home-mode--feature" href="${feature.href(lang)}" data-mode="${feature.id}">
      <p class="home-mode__eyebrow">Vahvin reitti</p>
      <h3 class="home-mode__name">${escapeHtml(feature.label)}</h3>
      <p class="home-mode__sub">${escapeHtml(feature.sub)}</p>
      <div class="home-mode__bar" aria-hidden="true">
        <div class="home-mode__bar-fill" style="width:${fPct}%"></div>
      </div>
      <p class="home-mode__meta">${escapeHtml(fMeta)}</p>
    </a>`;

  const restTiles = rest.map((m) => {
    const s = Number(modeStats[m.id]?.sessions ?? 0);
    const meta = s === 0 ? "Ei aloitettu" : `${s} harj.`;
    return `
      <a class="home-mode home-mode--mini" href="${m.href(lang)}" data-mode="${m.id}">
        <h4 class="home-mode__name home-mode__name--mini">${escapeHtml(m.label)}</h4>
        <p class="home-mode__meta home-mode__meta--mini">${escapeHtml(meta)}</p>
        <span class="home-mode__arrow" aria-hidden="true">→</span>
      </a>`;
  }).join("");

  return `
    <section class="home-modes" aria-label="Harjoitusreitit">
      <p class="home-modes__eyebrow">Harjoitusreitit</p>
      <div class="home-modes__grid">
        ${featureCard}
        <div class="home-modes__minis">${restTiles}</div>
      </div>
    </section>`;
}

function renderQuickActions(lang, isPro) {
  const lockHint = isPro ? "" : `<span class="home-quick__lock" aria-hidden="true">🔒</span>`;
  return `
    <nav class="home-quick" aria-label="Pikatoiminnot">
      <a class="home-quick__link" href="#/koeharjoitus?lang=${escapeHtml(lang)}" data-action="exam">
        ${lockHint}Koeharjoitus
      </a>
      <span class="home-quick__sep" aria-hidden="true">·</span>
      <a class="home-quick__link" href="#/asetukset?tab=kielet">Vaihda kieltä</a>
      <span class="home-quick__sep" aria-hidden="true">·</span>
      <a class="home-quick__link" href="#/asetukset">Asetukset</a>
    </nav>`;
}

function renderShell(activeLang, data, isPro) {
  const dashboard = data?.dashboard || {};
  const profile = data?.profile?.profile || window._userProfile || null;
  return `
    <div class="home-v280">
      ${renderTopBar(profile, activeLang)}
      <div class="home-band">
        <div class="home-band__main">${renderHero(dashboard, activeLang)}</div>
        <aside class="home-band__rail">
          ${renderStreakRing(dashboard)}
          ${renderTipCard(activeLang)}
        </aside>
      </div>
      ${renderModes(dashboard, activeLang)}
      ${renderQuickActions(activeLang, isPro)}
    </div>
  `;
}

function wireTabs(root) {
  root.querySelectorAll(".home-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const lang = tab.dataset.lang;
      if (!lang) return;
      writeActiveLang(lang);
      loadHome();
    });
  });
}

function wirePaywallTriggers(root) {
  root.querySelectorAll("[data-action='exam']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const isPro = a.dataset.unlocked === "1";
      if (!isPro && !window._isPro) {
        e.preventDefault();
        import("../features/paywallModal.js")
          .then((m) => m.openPaywallModal?.())
          .catch(() => {});
      }
    });
  });
}

// Streak count-up — small Emil-style flourish. When the streak first
// renders we lerp 0 → target over 600ms with ease-out. Skipped if the
// user prefers reduced motion. No bounce, no scale-pop.
function animateStreak(root) {
  if (typeof window === "undefined") return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = root.querySelector(".home-streak__num");
  if (!el) return;
  const target = Number(el.dataset.target || el.textContent || 0);
  if (!Number.isFinite(target) || target <= 0) return;
  if (reduce) { el.textContent = String(target); return; }
  const start = performance.now();
  const dur = Math.min(900, 200 + target * 50);
  function tick(t) {
    const p = Math.min(1, (t - start) / dur);
    // ease-out-quart
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = String(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  }
  el.textContent = "0";
  requestAnimationFrame(tick);
}

// Stroke-dashoffset animation — the ring renders at final value via
// inline style, then we briefly snap it to full circumference and
// transition back. CSS handles the easing; this just kicks the param.
function animateRing(root) {
  if (typeof window === "undefined") return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const fill = root.querySelector(".home-streak__fill");
  if (!fill) return;
  const final = fill.getAttribute("stroke-dashoffset");
  const total = fill.getAttribute("stroke-dasharray");
  fill.style.transition = "none";
  fill.setAttribute("stroke-dashoffset", total);
  // Force layout, then transition back
  void fill.getBoundingClientRect();
  fill.style.transition = "stroke-dashoffset 700ms cubic-bezier(0.23, 1, 0.32, 1)";
  requestAnimationFrame(() => {
    fill.setAttribute("stroke-dashoffset", final);
  });
}

function renderShellSkeleton(activeLang) {
  return `
    <div class="home-v280 home-v280--skel" role="status" aria-live="polite">
      <span class="sr-only">Ladataan kotinäyttöä…</span>
      <header class="home-topbar" aria-hidden="true">
        <div class="home-topbar__greet">
          <span class="home-skel home-skel--hello"></span>
          <span class="home-skel home-skel--date"></span>
        </div>
      </header>
      <div class="home-band">
        <div class="home-band__main">
          <div class="home-hero home-hero--skel" aria-hidden="true">
            <div class="home-hero__body">
              <span class="home-skel home-skel--eyebrow"></span>
              <span class="home-skel home-skel--title"></span>
              <span class="home-skel home-skel--sub"></span>
              <span class="home-skel home-skel--cta"></span>
            </div>
          </div>
        </div>
        <aside class="home-band__rail" aria-hidden="true">
          <div class="home-streak home-streak--skel">
            <span class="home-skel home-skel--ring"></span>
          </div>
          <div class="home-tip home-tip--skel">
            <span class="home-skel home-skel--eyebrow"></span>
            <span class="home-skel home-skel--title"></span>
            <span class="home-skel home-skel--sub"></span>
          </div>
        </aside>
      </div>
    </div>`;
}

export async function loadHome() {
  show("screen-home");
  const root = document.getElementById("home-root");
  if (!root) return;
  const activeLang = readActiveLang();

  if (_ohjaamoData && (Date.now() - _ohjaamoData.ts) < 60_000) {
    const cached = _ohjaamoData.payload;
    const isPro = isProTier(cached?.profile?.profile);
    window._isPro = isPro;
    root.innerHTML = renderShell(activeLang, cached, isPro);
    wireTabs(root);
    wirePaywallTriggers(root);
    animateStreak(root);
    animateRing(root);
    return;
  }
  root.innerHTML = renderShellSkeleton(activeLang);
  const data = await fetchOhjaamo();
  const isPro = isProTier(data?.profile?.profile);
  window._isPro = isPro;
  root.innerHTML = renderShell(activeLang, data, isPro);
  wireTabs(root);
  wirePaywallTriggers(root);
  animateStreak(root);
  animateRing(root);
}
