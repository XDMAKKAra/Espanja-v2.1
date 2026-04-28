import { $, show } from "../ui/nav.js";
import { API, authHeader, apiFetch, getAuthEmail, clearAuth } from "../api.js";
import { track } from "../analytics.js";
import { computeStartingLevel, YTL_LEVELS } from "../features/startingLevel.js";

const THEME_LABELS = {
  auto:  "Vaalea — seuraa järjestelmää",
  light: "Vaalea",
  dark:  "Tumma",
};
function applyThemeChoice(value) {
  const v = ["auto", "light", "dark"].includes(value) ? value : "auto";
  try { localStorage.setItem("puheo_theme", v); } catch {}
  // Real theme tokens land in a future loop. For now: visible state on the toggle
  // + a data attribute so future CSS can hook in without a re-wire.
  document.documentElement.setAttribute("data-theme", v);
  const buttons = document.querySelectorAll(".settings-theme-btn");
  buttons.forEach((b) => {
    const on = b.dataset.theme === v;
    b.classList.toggle("is-current", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
  const valueEl = document.getElementById("settings-theme-value");
  if (valueEl) valueEl.textContent = THEME_LABELS[v];
}
function wireThemeToggle() {
  document.querySelectorAll(".settings-theme-btn").forEach((b) => {
    b.addEventListener("click", () => applyThemeChoice(b.dataset.theme));
  });
  // Initial state from localStorage if set.
  try {
    const saved = localStorage.getItem("puheo_theme");
    if (saved) applyThemeChoice(saved);
  } catch {}
}
function wireAccountSection() {
  const emailEl = document.getElementById("settings-account-email");
  if (emailEl) emailEl.textContent = getAuthEmail() || "—";
  const planEl = document.getElementById("settings-account-plan");
  if (planEl) planEl.textContent = window._isPro ? "Pro" : "Ilmainen";
  const billingBtn = document.getElementById("settings-manage-billing");
  if (billingBtn && window._isPro) billingBtn.hidden = false;
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

let _deps = {};
let _profile = null;
let _editingField = null;
let _pendingValue = null;

export function initSettings(deps) {
  _deps = deps || {};
  wireModal();
  wireBumpModal();
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

const TARGET_GRADE_LABELS = {
  B: "B · Hyväksytty",
  C: "C · Tyydyttävä",
  M: "M · Hyvä",
  E: "E · Erinomainen",
  L: "L · Huippu",
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
    editor: "single",
    options: () =>
      Object.entries(TARGET_GRADE_LABELS).map(([value, label]) => ({ value, label })),
    render: (p) => TARGET_GRADE_LABELS[p.target_grade] || "Ei asetettu",
    readProfile: (p) => p.target_grade || "M",
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

    track("profile_updated", { field: field.key });

    closeEditor();
    renderRows();

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

// ─── utils ────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
