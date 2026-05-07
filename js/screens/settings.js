import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch, getAuthEmail, clearAuth, invalidateProfileCache } from "../api.js";
import { state, setLanguage } from "../state.js";
import { track } from "../analytics.js";
import { computeStartingLevel, YTL_LEVELS } from "../features/startingLevel.js";
import { toast } from "../ui/toast.js";
import { initPaywallModal } from "../features/paywallModal.js";

const THEME_LABELS = {
  auto:  "Vaalea — seuraa järjestelmää",
  light: "Vaalea",
  dark:  "Tumma",
};
function resolveEffectiveTheme(choice) {
  if (choice === "auto") {
    const m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    return m && m.matches ? "dark" : "light";
  }
  return choice;
}
function applyThemeChoice(value) {
  const v = ["auto", "light", "dark"].includes(value) ? value : "auto";
  try { localStorage.setItem("puheo_theme", v); } catch {}
  // Auto resolves to light/dark via prefers-color-scheme — write the
  // effective value to data-theme so the CSS [data-theme="dark"] block
  // matches whether the user chose Dark explicitly or Auto-on-dark-OS.
  document.documentElement.setAttribute("data-theme", resolveEffectiveTheme(v));
  const buttons = document.querySelectorAll(".settings-theme-btn");
  buttons.forEach((b) => {
    const on = b.dataset.theme === v;
    b.classList.toggle("is-current", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
  const valueEl = document.getElementById("settings-theme-value");
  if (valueEl) valueEl.textContent = THEME_LABELS[v];
}

// L-LIVE-AUDIT-P2 UPDATE 7 — Magic UI animated-theme-toggler ported to vanilla.
// View Transitions API expands a clip-path circle from the click point so the
// new theme reveals as a wipe instead of a hard flash. Falls back to instant
// when the browser lacks the API or the user prefers reduced motion.
function applyThemeChoiceWithTransition(value, evt) {
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) {
    applyThemeChoice(value);
    return;
  }
  let originX, originY;
  if (evt && Number.isFinite(evt.clientX) && evt.clientX > 0) {
    originX = evt.clientX;
    originY = evt.clientY;
  } else {
    // Keyboard / programmatic click — origin from the active element's centre.
    const target = (evt?.currentTarget) || document.activeElement;
    if (target?.getBoundingClientRect) {
      const r = target.getBoundingClientRect();
      originX = r.left + r.width / 2;
      originY = r.top + r.height / 2;
    } else {
      originX = window.innerWidth / 2;
      originY = window.innerHeight / 2;
    }
  }
  document.documentElement.style.setProperty("--vt-origin-x", `${originX}px`);
  document.documentElement.style.setProperty("--vt-origin-y", `${originY}px`);
  document.startViewTransition(() => applyThemeChoice(value));
}

let _themeMqlBound = false;
function wireThemeToggle() {
  document.querySelectorAll(".settings-theme-btn").forEach((b) => {
    b.addEventListener("click", (evt) => applyThemeChoiceWithTransition(b.dataset.theme, evt));
  });
  // Initial state from localStorage if set.
  try {
    const saved = localStorage.getItem("puheo_theme");
    if (saved) applyThemeChoice(saved);
  } catch {}

  // Re-apply when the OS-level scheme flips, but only when the user
  // is on Auto. Explicit Light/Dark choices win.
  if (!_themeMqlBound && window.matchMedia) {
    _themeMqlBound = true;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let saved = "auto";
      try { saved = localStorage.getItem("puheo_theme") || "auto"; } catch {}
      if (saved === "auto") applyThemeChoice("auto");
    };
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else if (mql.addListener) mql.addListener(onChange);
  }
}
function wireAccountSection() {
  const emailEl = document.getElementById("settings-account-email");
  if (emailEl) emailEl.textContent = getAuthEmail() || "—";
  const signOutBtn = document.getElementById("settings-signout");
  if (signOutBtn && !signOutBtn.dataset.wired) {
    signOutBtn.dataset.wired = "1";
    signOutBtn.addEventListener("click", () => {
      clearAuth();
      // updateSidebarState lives in main.js — fall back to a hard reload that
      // re-enters the auth screen via the bootstrap path.
      try { document.querySelector(".app-sidebar")?.style && (document.querySelector(".app-sidebar").style.display = "none"); } catch {}
      show("screen-auth");
    });
  }
}

// ─── Subscription section ─────────────────────────────────────────────────────

const TIER_LABELS = {
  free:    "Ilmainen",
  treeni:  "Treeni",
  mestari: "Mestari",
  pro:     "Pro",         // legacy
};

async function wireSubscriptionSection(profile) {
  const container = document.getElementById("settings-subscription-rows");
  if (!container) return;
  container.setAttribute("aria-busy", "false");

  const tier    = profile?.subscription_tier || "free";
  const billing = profile?.subscription_billing;
  const status  = profile?.subscription_status;
  const expires = profile?.subscription_expires_at;

  const tierLabel = TIER_LABELS[tier] || escapeHtml(String(tier));
  const tierClass =
    tier === "mestari" ? "settings-tier-badge--mestari"
    : tier === "treeni" || tier === "pro" ? "settings-tier-badge--treeni"
    : "settings-tier-badge--free";

  let expiresHtml = "";
  if (billing === "package" && expires) {
    const d = new Date(expires);
    if (!Number.isNaN(d.getTime())) {
      const fmt = new Intl.DateTimeFormat("fi-FI", { day: "numeric", month: "long", year: "numeric" });
      expiresHtml = `<p class="settings-tier-expires">Voimassa: ${escapeHtml(fmt.format(d))}</p>`;
    }
  }

  let actionsHtml = "";
  if (tier === "free") {
    actionsHtml = `
      <div class="settings-tier-actions">
        <a href="/pricing.html?from=settings&tier=treeni" class="btn-secondary">Avaa Treeni</a>
        <a href="/pricing.html?from=settings&tier=mestari" class="btn-primary">Avaa Mestari</a>
      </div>`;
  } else {
    // treeni, mestari, pro — show Stripe portal button
    actionsHtml = `
      <div class="settings-tier-actions">
        <button type="button" class="btn-secondary" id="settings-portal-btn">Hallinnoi tilausta</button>
      </div>
      <p class="settings-portal-error hidden" id="settings-portal-error" role="alert"></p>`;
  }

  container.innerHTML = `
    <div class="settings-row">
      <div class="settings-row-main" style="flex-direction:column;align-items:flex-start;gap:6px;">
        <span class="settings-tier-badge ${escapeHtml(tierClass)}">${escapeHtml(tierLabel)}</span>
        ${expiresHtml}
        ${actionsHtml}
      </div>
    </div>`;

  // Wire portal button
  const portalBtn = document.getElementById("settings-portal-btn");
  if (portalBtn && !portalBtn.dataset.wired) {
    portalBtn.dataset.wired = "1";
    portalBtn.addEventListener("click", () => openBillingPortal(portalBtn));
  }
}

async function openBillingPortal(btn) {
  const errorEl = document.getElementById("settings-portal-error");
  if (btn) { btn.disabled = true; btn.textContent = "Ladataan…"; }
  if (errorEl) errorEl.classList.add("hidden");
  try {
    const res = await apiFetch(`${API}/api/stripe/portal-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const { url } = await res.json();
    if (!url) throw new Error("no_url");
    window.location.href = url;
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = "Portaalin avaaminen epäonnistui. Kokeile hetken kuluttua uudelleen.";
      errorEl.classList.remove("hidden");
    }
    if (btn) { btn.disabled = false; btn.textContent = "Hallinnoi tilausta"; }
    track("billing_portal_error", { message: String(err?.message || err) });
  }
}

let _deps = {};
let _profile = null;
let _editingField = null;
let _pendingValue = null;

export function initSettings(deps) {
  _deps = deps || {};
  wireModal();
  wireBumpModal();
  wireLangModal();
  initPaywallModal();
  // Sidebar click is handled centrally in main.js — it calls showSettings().
}

// ─── Field descriptors ─────────────────────────────────────────────────────

const MONTH_LABELS = {
  "2026-03": "Kevät 2026",
  "2026-09": "Syksy 2026",
  "2027-03": "Kevät 2027",
  "2027-09": "Syksy 2027",
  "2028-03": "Kevät 2028",
};

function formatExamDate(val) {
  if (!val) return "Ei asetettu";
  const ym = String(val).slice(0, 7);
  return MONTH_LABELS[ym] || val;
}

function examDateOptions() {
  // Offer current + next 3 half-years + unknown.
  const opts = [];
  const now = new Date();
  const year = now.getFullYear();
  const inH2 = now.getMonth() >= 6;
  let y = year;
  let h = inH2 ? 2 : 1;
  for (let i = 0; i < 4; i++) {
    const yms = `${y}-${h === 1 ? "03" : "09"}`;
    opts.push({
      value: yms,
      label: MONTH_LABELS[yms] || (h === 1 ? `Kevät ${y}` : `Syksy ${y}`),
    });
    if (h === 1) { h = 2; } else { h = 1; y++; }
  }
  opts.push({ value: "unknown", label: "Ei vielä päätöksiä" });
  return opts;
}

const AREA_LABELS = {
  vocabulary: "📚 Sanasto",
  grammar: "🔧 Puheoppi yleisesti",
  ser_estar: "🔄 Ser / Estar",
  subjunctive: "🌀 Subjunktiivi",
  preterite_imperfect: "⏳ Pret. vs. imperf.",
  writing: "✍️ Kirjoittaminen",
  reading: "📖 Luetun ymmärt.",
  verbs: "🏃 Verbit yleisesti",
  conditional: "💭 Konditionaali",
  pronouns: "👉 Pronominit",
  idioms: "💬 Idiomit",
  unknown: "🤷 En tiedä",
};

const STUDY_BG_LABELS = {
  lukio: "Vain lukiossa",
  ylakoulu_lukio: "Yläkoulusta alkaen (B2-kieli)",
  alakoulu: "Alakoulusta tai A-kielenä",
  asunut: "Asunut espanjankielisessä maassa",
  kotikieli: "Puhun espanjaa kotona / suvun kanssa",
};

// L-PLAN-6 — full I..L ladder. The pace + multiplier + tutor tone all
// adapt per pick (CURRICULUM_SPEC §2; lib/lessonContext.js mirrors the
// thresholds). Order matches the picker pill row in onboarding OB-1.
const TARGET_GRADE_LABELS = {
  I: "I · Improbatur",
  A: "A · Approbatur",
  B: "B · Hyväksytty",
  C: "C · Tyydyttävä",
  M: "M · Hyvä",
  E: "E · Erinomainen",
  L: "L · Huippu",
};
const TARGET_GRADE_PACE_HINTS = {
  I: "hidas tahti, paljon toistoa",
  A: "hidas-normaali tahti",
  B: "normaali tahti, baseline",
  C: "normaali tahti",
  M: "nopea tahti, vaativammat tehtävät",
  E: "nopea tahti, vivahde-erot",
  L: "erittäin nopea, syventävät lisätehtävät",
};

const FIELDS = [
  {
    key: "exam_date",
    label: "Kokeen päivä",
    editor: "single",
    options: examDateOptions,
    render: (p) => formatExamDate(p.exam_date),
    readProfile: (p) => (p.exam_date ? String(p.exam_date).slice(0, 7) : "unknown"),
    toPayload: (v) => (v === "unknown" ? null : `${v}-15`),
  },
  {
    key: "spanish_courses_completed",
    label: "Kursseja suoritettu",
    editor: "single",
    options: () => [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: String(n) })),
      { value: "unknown", label: "En tiedä" },
    ],
    render: (p) =>
      p.spanish_courses_completed == null ? "Ei asetettu" : String(p.spanish_courses_completed),
    readProfile: (p) =>
      p.spanish_courses_completed == null ? "unknown" : String(p.spanish_courses_completed),
    toPayload: (v) => (v === "unknown" ? null : Number(v)),
  },
  {
    key: "spanish_grade_average",
    label: "Keskiarvo",
    hint: "Karkea arvio riittää.",
    editor: "single",
    options: () => [
      ...[5, 6, 7, 8, 9, 10].map((n) => ({ value: String(n), label: String(n) })),
      { value: "unknown", label: "En tiedä" },
    ],
    render: (p) => (p.spanish_grade_average == null ? "Ei asetettu" : String(p.spanish_grade_average)),
    readProfile: (p) => (p.spanish_grade_average == null ? "unknown" : String(p.spanish_grade_average)),
    toPayload: (v) => (v === "unknown" ? null : Number(v)),
  },
  {
    key: "study_background",
    label: "Opiskelutausta",
    editor: "single",
    options: () =>
      Object.entries(STUDY_BG_LABELS).map(([value, label]) => ({ value, label })),
    render: (p) => STUDY_BG_LABELS[p.study_background] || "Ei asetettu",
    readProfile: (p) => p.study_background || "",
    toPayload: (v) => v || null,
  },
  {
    key: "weak_areas",
    label: "Heikkoudet",
    hint: "Valitse 1–3. Painotamme harjoittelua näihin.",
    editor: "multi",
    max: 3,
    options: () =>
      ["vocabulary", "grammar", "ser_estar", "subjunctive", "preterite_imperfect",
       "writing", "reading", "verbs", "unknown"].map((v) => ({ value: v, label: AREA_LABELS[v] })),
    render: (p) => renderAreaList(p.weak_areas),
    readProfile: (p) => (Array.isArray(p.weak_areas) ? p.weak_areas.slice() : []),
    toPayload: (v) => (Array.isArray(v) ? v : []),
    overlapWith: "strong_areas",
  },
  {
    key: "strong_areas",
    label: "Vahvuudet",
    hint: "Valinnainen. 0–3 aluetta jossa tunnet vahvuutta.",
    editor: "multi",
    max: 3,
    allowEmpty: true,
    options: () =>
      ["vocabulary", "grammar", "ser_estar", "subjunctive", "preterite_imperfect",
       "writing", "reading"].map((v) => ({ value: v, label: AREA_LABELS[v] })),
    render: (p) =>
      Array.isArray(p.strong_areas) && p.strong_areas.length
        ? renderAreaList(p.strong_areas)
        : "Ei asetettu",
    readProfile: (p) => (Array.isArray(p.strong_areas) ? p.strong_areas.slice() : []),
    toPayload: (v) => (Array.isArray(v) && v.length > 0 ? v : null),
    overlapWith: "weak_areas",
  },
  {
    key: "preferred_session_length",
    label: "Päivätavoite",
    editor: "single",
    options: () =>
      [10, 20, 30, 45, 60].map((n) => ({ value: String(n), label: `${n} min` })),
    render: (p) =>
      p.preferred_session_length ? `${p.preferred_session_length} min` : "Ei asetettu",
    readProfile: (p) =>
      p.preferred_session_length ? String(p.preferred_session_length) : "20",
    toPayload: (v) => Number(v),
    sideEffects: (payload, v) => {
      payload.weekly_goal_minutes = Number(v) * 7;
    },
  },
  {
    key: "target_grade",
    label: "Tavoitearvosana",
    hint: "Tavoitteesi YO-kokeessa määrittää harjoituksen määrää ja vaikeutta. Voit muuttaa sitä koska tahansa — suoritetut oppitunnit säilyvät.",
    editor: "single",
    options: () =>
      Object.entries(TARGET_GRADE_LABELS).map(([value, label]) => ({ value, label })),
    render: (p) => {
      const grade = p.target_grade;
      if (!grade || !TARGET_GRADE_LABELS[grade]) return "Ei asetettu";
      const pace = TARGET_GRADE_PACE_HINTS[grade];
      return pace ? `${TARGET_GRADE_LABELS[grade]} · ${pace}` : TARGET_GRADE_LABELS[grade];
    },
    readProfile: (p) => p.target_grade || "B",
    toPayload: (v) => v,
  },
];

function renderAreaList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "Ei asetettu";
  return arr.map((a) => stripEmoji(AREA_LABELS[a] || a)).join(", ");
}

function stripEmoji(s) {
  return s.replace(/^[^\w]+/u, "").trim();
}

// ─── Page rendering ────────────────────────────────────────────────────────

// Public helper used by the profile-screen chips. Ensures the profile is
// loaded into module state, opens the modal for the requested field, and
// dispatches `puheo:profile-updated` after a successful save so the
// caller can re-render its values without doing its own /api/profile fetch.
export async function openSettingsEditor(fieldKey) {
  if (!_profile) {
    try {
      const res = await apiFetch(`${API}/api/profile`, { headers: authHeader() });
      if (res.ok) {
        const { profile } = await res.json();
        _profile = profile || {};
        window._userProfile = _profile;
      }
    } catch { /* fall through — openEditor will still work with empty state */ }
  }
  openEditor(fieldKey);
}

export async function showSettings() {
  show("screen-settings");
  // Wire the theme toggle + account section once per session — idempotent.
  wireThemeToggle();
  wireAccountSection();
  const rowsEl = $("settings-profile-rows");
  rowsEl.setAttribute("aria-busy", "true");
  rowsEl.innerHTML = `<p class="settings-loading">Ladataan profiilia…</p>`;

  try {
    const res = await apiFetch(`${API}/api/profile`, { headers: authHeader() });
    if (!res.ok) throw new Error("fetch failed");
    const { profile } = await res.json();
    _profile = profile || {};
    window._userProfile = _profile;
    renderRows();
    wireSubscriptionSection(_profile);
    renderLanguageSection(_profile);
  } catch {
    rowsEl.innerHTML = `<p class="settings-loading">Profiilin lataus epäonnistui. Kokeile myöhemmin uudelleen.</p>`;
  } finally {
    rowsEl.setAttribute("aria-busy", "false");
  }
}

function renderRows() {
  const rowsEl = $("settings-profile-rows");
  rowsEl.innerHTML = "";
  FIELDS.forEach((field) => {
    const row = document.createElement("div");
    row.className = "settings-row";
    row.dataset.field = field.key;
    row.innerHTML = `
      <div class="settings-row-main">
        <div class="settings-row-label">${field.label}</div>
        <div class="settings-row-value">${escapeHtml(field.render(_profile))}</div>
      </div>
      <button type="button" class="settings-row-edit" data-field="${field.key}" aria-label="Muokkaa ${field.label}">Muokkaa</button>
    `;
    rowsEl.appendChild(row);
  });

  rowsEl.querySelectorAll(".settings-row-edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditor(btn.dataset.field));
  });
}

// ─── Edit modal ────────────────────────────────────────────────────────────

function wireModal() {
  const overlay = $("settings-modal-overlay");
  if (!overlay) return;
  $("settings-modal-close").addEventListener("click", closeEditor);
  $("settings-modal-cancel").addEventListener("click", closeEditor);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeEditor();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeEditor();
  });
  $("settings-modal-save").addEventListener("click", saveEditor);
}

function openEditor(fieldKey) {
  const field = FIELDS.find((f) => f.key === fieldKey);
  if (!field) return;
  _editingField = field;
  _pendingValue = field.readProfile(_profile);

  $("settings-modal-title").textContent = field.label;
  $("settings-modal-hint").textContent = field.hint || "";
  $("settings-modal-hint").style.display = field.hint ? "" : "none";
  hideError();

  const body = $("settings-modal-body");
  body.innerHTML = "";

  const opts = field.options();
  opts.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "settings-opt";
    btn.dataset.value = opt.value;
    btn.textContent = opt.label;

    if (field.editor === "single") {
      if (String(_pendingValue) === String(opt.value)) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        body.querySelectorAll(".settings-opt").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        _pendingValue = opt.value;
      });
    } else if (field.editor === "multi") {
      if (Array.isArray(_pendingValue) && _pendingValue.includes(opt.value)) btn.classList.add("selected");
      btn.addEventListener("click", () => toggleMulti(btn, field, opt.value));
    }
    body.appendChild(btn);
  });

  $("settings-modal-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function toggleMulti(btn, field, value) {
  if (!Array.isArray(_pendingValue)) _pendingValue = [];

  // Overlap check
  if (field.overlapWith && !btn.classList.contains("selected")) {
    const other = _profile?.[field.overlapWith];
    if (Array.isArray(other) && other.includes(value)) {
      flashError("Sama alue voi olla vain heikkous tai vahvuus.");
      return;
    }
  }

  if (btn.classList.contains("selected")) {
    btn.classList.remove("selected");
    _pendingValue = _pendingValue.filter((v) => v !== value);
  } else {
    if (field.max && _pendingValue.length >= field.max) {
      flashError(`Enintään ${field.max} valintaa.`);
      return;
    }
    btn.classList.add("selected");
    _pendingValue.push(value);
  }
  hideError();
}

function closeEditor() {
  $("settings-modal-overlay").classList.add("hidden");
  document.body.style.overflow = "";
  _editingField = null;
  _pendingValue = null;
}

async function saveEditor() {
  if (!_editingField) return;
  const field = _editingField;

  // Read-side validation
  if (field.editor === "multi") {
    if (!Array.isArray(_pendingValue) || (_pendingValue.length === 0 && !field.allowEmpty)) {
      flashError("Valitse vähintään yksi.");
      return;
    }
  }

  const oldRaw = _profile?.[field.key];
  const newVal = field.toPayload(_pendingValue);

  const payload = { [field.key]: newVal };
  if (typeof field.sideEffects === "function") field.sideEffects(payload, _pendingValue);

  const saveBtn = $("settings-modal-save");
  saveBtn.disabled = true;
  saveBtn.textContent = "Tallennetaan…";

  try {
    const res = await apiFetch(`${API}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      flashError(data.error || "Tallennus epäonnistui.");
      saveBtn.disabled = false;
      saveBtn.textContent = "Tallenna";
      return;
    }
    const { profile } = await res.json();
    _profile = profile || { ..._profile, ...payload };
    window._userProfile = _profile;
    // L-LIVE-AUDIT-P2 UPDATE 4 — drop the in-memory profile cache so the next
    // getProfile() call returns the fresh row instead of a stale 5-min copy.
    invalidateProfileCache();

    track("profile_updated", { field: field.key });

    closeEditor();
    renderRows();

    // L-PLAN-6 — target_grade-specific toast confirms the adaptive shift
    // and reassures that completed lessons survive. Other fields stay
    // toast-less so the modal close itself signals success.
    if (field.key === "target_grade" && newVal && TARGET_GRADE_LABELS[newVal]) {
      const pace = TARGET_GRADE_PACE_HINTS[newVal] || "";
      toast.success(
        `Tavoite päivitetty: ${newVal}. Seuraavat oppitunnit ovat ${pace || "tavoitteen mukaisia"} — suoritetut säilyvät ennallaan.`,
      );
    }

    // Notify any other screen (profile chips, dashboard) that the profile
    // changed so they can re-render their values without re-fetching.
    document.dispatchEvent(new CustomEvent("puheo:profile-updated", {
      detail: { field: field.key, profile: _profile },
    }));

    // Follow-up: if grade avg went up, offer to bump starting level.
    if (field.key === "spanish_grade_average") {
      maybePromptLevelBump(oldRaw, newVal);
    }
  } catch {
    flashError("Verkkovirhe. Kokeile uudelleen.");
    saveBtn.disabled = false;
    saveBtn.textContent = "Tallenna";
  }
}

function flashError(msg) {
  const el = $("settings-modal-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}
function hideError() {
  $("settings-modal-error").classList.add("hidden");
}

// ─── Level-bump prompt ─────────────────────────────────────────────────────

function wireBumpModal() {
  const overlay = $("level-bump-overlay");
  if (!overlay) return;
  $("level-bump-close").addEventListener("click", closeBump);
  $("level-bump-skip").addEventListener("click", () => {
    track("profile_level_bump", { action: "skip" });
    closeBump();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeBump();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeBump();
  });

  $("level-bump-apply").addEventListener("click", applyLevelBump);
  $("level-bump-placement").addEventListener("click", goToPlacement);
}

function maybePromptLevelBump(oldAvg, newAvg) {
  const oldN = Number(oldAvg);
  const newN = Number(newAvg);
  if (!Number.isFinite(newN)) return;
  if (Number.isFinite(oldN) && newN <= oldN) return;

  const currentLevel = _profile?.current_grade;
  const suggested = computeStartingLevel(
    _profile?.spanish_courses_completed,
    newN,
    _profile?.study_background,
  );
  if (!suggested) return;
  if (currentLevel && YTL_LEVELS.indexOf(suggested) <= YTL_LEVELS.indexOf(currentLevel)) return;

  const suggestionEl = $("level-bump-suggestion");
  suggestionEl.innerHTML = `
    <span class="level-bump-current">${escapeHtml(currentLevel || "—")}</span>
    <span class="level-bump-arrow">→</span>
    <span class="level-bump-new">${escapeHtml(suggested)}</span>
  `;
  $("level-bump-apply").dataset.suggested = suggested;
  $("level-bump-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  track("profile_level_bump", { action: "shown", suggested, old: currentLevel });
}

function closeBump() {
  $("level-bump-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}

async function applyLevelBump() {
  const suggested = $("level-bump-apply").dataset.suggested;
  if (!suggested) { closeBump(); return; }
  try {
    const res = await apiFetch(`${API}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ current_grade: suggested }),
    });
    if (res.ok) {
      const { profile } = await res.json();
      _profile = profile || { ..._profile, current_grade: suggested };
      window._userProfile = _profile;
      invalidateProfileCache();
      track("profile_level_bump", { action: "apply", suggested });
      track("profile_updated", { field: "current_grade" });
      renderRows();
    }
  } catch { /* silent */ }
  closeBump();
}

function goToPlacement() {
  track("profile_level_bump", { action: "placement" });
  closeBump();
  const ref = window._placementRef;
  if (ref && typeof ref.showPlacementIntro === "function") {
    ref.showPlacementIntro();
  }
}

// ─── Language section (L-LANG-INFRA-1) ───────────────────────────────────────
// Three radio options: Espanja / Saksa / Ranska.
// Changing away from Espanja requires a confirmation modal (warns about losing
// Spanish progress). On confirm → PATCH /api/onboarding/complete (only the
// target_language field), update state.language, re-route.

const LANG_OPTIONS = [
  { value: "es", label: "Espanja", flag: "🇪🇸" },
  { value: "de", label: "Saksa",   flag: "🇩🇪" },
  { value: "fr", label: "Ranska",  flag: "🇫🇷" },
];

let _pendingLang = null;

export function renderLanguageSection(profile) {
  const container = document.getElementById("settings-language-rows");
  if (!container) return;

  const current = profile?.target_language || state.language || "es";
  const currentLabel = LANG_OPTIONS.find((o) => o.value === current)?.label || "Espanja";

  container.innerHTML = `
    <div class="settings-row" data-field="target_language">
      <div class="settings-row-main">
        <div class="settings-row-label">Opiskelukieli</div>
        <div class="settings-row-value" id="settings-lang-value">${escapeHtml(currentLabel)}</div>
      </div>
      <button type="button" class="settings-row-edit" id="settings-lang-edit"
              aria-label="Vaihda opiskelukieli">Vaihda kieli</button>
    </div>`;

  const editBtn = document.getElementById("settings-lang-edit");
  if (editBtn && !editBtn.dataset.wired) {
    editBtn.dataset.wired = "1";
    editBtn.addEventListener("click", () => openLangEditor(profile?.target_language || "es"));
  }
}

function openLangEditor(currentLang) {
  const overlay = document.getElementById("settings-lang-overlay");
  if (!overlay) return;
  _pendingLang = currentLang;

  // Render radio options
  const body = document.getElementById("settings-lang-body");
  if (body) {
    body.innerHTML = LANG_OPTIONS.map((opt) => `
      <label class="settings-lang-option${opt.value === currentLang ? " is-selected" : ""}"
             data-value="${escapeHtml(opt.value)}">
        <input type="radio" name="settings-lang-radio" value="${escapeHtml(opt.value)}"
               ${opt.value === currentLang ? "checked" : ""}
               class="sr-only" aria-label="${escapeHtml(opt.flag + " " + opt.label)}">
        <span class="settings-lang-flag" aria-hidden="true">${escapeHtml(opt.flag)}</span>
        <span class="settings-lang-label">${escapeHtml(opt.label)}</span>
        <span class="settings-lang-check" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      </label>`).join("");

    body.querySelectorAll("label.settings-lang-option").forEach((lbl) => {
      lbl.addEventListener("click", () => {
        _pendingLang = lbl.dataset.value;
        body.querySelectorAll("label.settings-lang-option").forEach((l) =>
          l.classList.toggle("is-selected", l.dataset.value === _pendingLang));
      });
    });
  }

  const errEl = document.getElementById("settings-lang-error");
  if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); }

  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  document.getElementById("settings-lang-save")?.focus();
}

function closeLangEditor() {
  const overlay = document.getElementById("settings-lang-overlay");
  if (overlay) overlay.classList.add("hidden");
  document.body.style.overflow = "";
  _pendingLang = null;
}

// Focus-trap helper: cycles Tab among focusable descendants of `container`.
function trapTab(e, container) {
  if (e.key !== "Tab" || !container) return;
  const f = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const focusables = Array.from(f).filter((el) => !el.disabled && el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last  = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function wireLangModal() {
  const overlay = document.getElementById("settings-lang-overlay");
  if (!overlay) return;

  document.getElementById("settings-lang-close")?.addEventListener("click", closeLangEditor);
  document.getElementById("settings-lang-cancel")?.addEventListener("click", closeLangEditor);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLangEditor(); });

  // Confirmation modal
  const confirmOverlay = document.getElementById("settings-lang-confirm-overlay");

  document.addEventListener("keydown", (e) => {
    const langOpen     = !overlay.classList.contains("hidden");
    const confirmOpen  = confirmOverlay && !confirmOverlay.classList.contains("hidden");
    if (e.key === "Escape") {
      if (confirmOpen) {
        confirmOverlay.classList.add("hidden");
        openLangEditor(state.language); // reopen lang picker
      } else if (langOpen) {
        closeLangEditor();
      }
      return;
    }
    if (e.key === "Tab") {
      if (confirmOpen) trapTab(e, confirmOverlay.querySelector(".settings-lang-confirm-modal"));
      else if (langOpen) trapTab(e, overlay.querySelector(".settings-lang-modal"));
    }
  });

  document.getElementById("settings-lang-save")?.addEventListener("click", handleLangSave);

  if (!confirmOverlay) return;
  document.getElementById("settings-lang-confirm-cancel")?.addEventListener("click", () => {
    confirmOverlay.classList.add("hidden");
    document.body.style.overflow = "hidden"; // lang modal still open
    openLangEditor(state.language); // reopen with current selection
  });
  document.getElementById("settings-lang-confirm-ok")?.addEventListener("click", async () => {
    confirmOverlay.classList.add("hidden");
    await saveLang(_pendingLang);
  });
  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) {
      confirmOverlay.classList.add("hidden");
      openLangEditor(state.language);
    }
  });
}

async function handleLangSave() {
  if (!_pendingLang) { closeLangEditor(); return; }
  const currentLang = state.language || "es";
  if (_pendingLang === currentLang) { closeLangEditor(); return; }

  // Switching away from ES → warn about losing Spanish progress.
  if (currentLang === "es" && _pendingLang !== "es") {
    closeLangEditor();
    const confirmOverlay = document.getElementById("settings-lang-confirm-overlay");
    if (confirmOverlay) {
      confirmOverlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      // Focus the non-destructive option first (WCAG: prevent accidental Enter).
      document.getElementById("settings-lang-confirm-cancel")?.focus();
    }
    return;
  }

  // Switching from non-ES to another non-ES (or back to ES) — no warning.
  await saveLang(_pendingLang);
}

async function saveLang(lang) {
  const saveBtn = document.getElementById("settings-lang-save");
  const errEl = document.getElementById("settings-lang-error");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Tallennetaan…"; }
  if (errEl) errEl.classList.add("hidden");

  try {
    const res = await apiFetch(`${API}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ target_language: lang }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `HTTP ${res.status}`);
    }
    // Update in-memory state.
    setLanguage(lang);
    invalidateProfileCache();
    track("settings_language_changed", { lang });

    closeLangEditor();
    document.getElementById("settings-lang-confirm-overlay")?.classList.add("hidden");
    document.body.style.overflow = "";

    // Re-route: non-ES → coming-soon; ES → dashboard.
    if (lang !== "es") {
      import("./comingSoon.js")
        .then((m) => m.showComingSoon())
        .catch(() => show("screen-coming-soon"));
    } else {
      if (_deps.loadDashboard) _deps.loadDashboard();
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = "Tallennus epäonnistui. Kokeile uudelleen.";
      errEl.classList.remove("hidden");
    }
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Tallenna"; }
  }
}

// ─── utils ────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
