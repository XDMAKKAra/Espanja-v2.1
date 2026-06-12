import { $, show } from "../ui/nav.js";
import { API, setAuth, fetchDashboardV2 } from "../api.js";
import { checkOnboarding } from "./onboarding.js";
import { checkPlacementNeeded, showPlacementIntro } from "./placement.js";
import { showHomeShell } from "./home.js";

const DIAG_STORAGE_KEY = "puheo_diagnostic_v1";

async function seedMasteryFromDiagnostic(token) {
  let payload;
  try {
    const raw = localStorage.getItem(DIAG_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.mastery_seed) || parsed.mastery_seed.length === 0) return;
    payload = { mastery: parsed.mastery_seed };
  } catch {
    return;
  }

  try {
    const res = await fetch(`${API}/api/profile/mastery-seed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      localStorage.removeItem(DIAG_STORAGE_KEY);
    }
  } catch {
    // Silent, diagnostic seeding is best-effort, never blocks registration
  }
}

let _deps = {};
export function initAuth({ updateSidebarState, loadDashboard }) {
  _deps = { updateSidebarState, loadDashboard };
}

// L-V413 Lohko 1 — register is the default mode: a visitor without an account
// is the common case on this screen, so "Luo tili" comes first and login is
// one click away ("Onko sinulla jo tili?").
let authMode = "register"; // "login" | "register"

const AUTH_COPY = {
  register: {
    title: "Luo tili",
    subtitle: "Tasoarviosi ja edistymisesi säilyvät, ja voit jatkaa millä tahansa laitteella.",
    submit: "Luo tili",
    busy: "Luodaan tiliä…",
  },
  login: {
    title: "Kirjaudu sisään",
    subtitle: "Jatka siitä mihin jäit.",
    submit: "Kirjaudu sisään",
    busy: "Kirjaudutaan…",
  },
};

function setAuthMode(mode) {
  authMode = mode;
  const copy = AUTH_COPY[mode];
  const inner = $("auth-inner");
  if (inner) inner.dataset.authMode = mode;
  $("auth-title").textContent = copy.title;
  $("auth-subtitle").textContent = copy.subtitle;
  $("btn-auth-submit").textContent = copy.submit;
  $("auth-error").classList.add("hidden");
  $("auth-success").classList.add("hidden");
  // Password-manager hint: offer a strong new password when registering,
  // autofill the saved one when logging in.
  $("auth-password").setAttribute("autocomplete", mode === "login" ? "current-password" : "new-password");
}

// Honour ?mode=login / ?mode=register from landing pages so returning users
// land on the login view when they click "Kirjaudu sisään" in the nav.
// Also honour #rekisteroidy / #kirjaudu hash so landing CTAs can deep-link
// without triggering NAV_HASH screen routing (which uses /-prefixed slugs).
try {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("mode");
  const hash = (window.location.hash || "").replace(/^#/, "");
  const wantRegister = requested === "register" || hash === "rekisteroidy";
  const wantLogin = requested === "login" || hash === "kirjaudu";
  if (wantRegister) {
    queueMicrotask(() => setAuthMode("register"));
  } else if (wantLogin) {
    queueMicrotask(() => setAuthMode("login"));
  }
} catch { /* ignore */ }

// #tab-login / #tab-register are the "Onko sinulla jo tili?" / "Eikö sinulla
// ole vielä tiliä?" switch links (IDs kept from the old tab pair).
$("tab-login").addEventListener("click", () => setAuthMode("login"));
$("tab-register").addEventListener("click", () => setAuthMode("register"));

$("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("auth-name").value.trim();
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  const errEl = $("auth-error");
  errEl.classList.add("hidden");

  if (authMode === "register" && !name) {
    errEl.textContent = "Kerro nimesi";
    errEl.classList.remove("hidden");
    return;
  }
  if (!email || !password) {
    errEl.textContent = "Täytä kaikki kentät";
    errEl.classList.remove("hidden");
    return;
  }

  $("btn-auth-submit").textContent = AUTH_COPY[authMode].busy;
  $("btn-auth-submit").disabled = true;

  try {
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authMode === "register" ? { name, email, password } : { email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || "Jokin meni pieleen";
      errEl.classList.remove("hidden");
      return;
    }
    setAuth(data.token, data.refreshToken, data.email);
    // Hydrate feature flags (waitlist mode + dev-Pro gate) before any Pro
    // CTA becomes interactive, fire-and-forget, the default is already safe.
    try {
      const { hydrateConfig } = await import("./writing.js");
      hydrateConfig();
    } catch { /* silent */ }
    if (authMode === "register") {
      // Fire-and-forget: seed user_mastery from landing-page mini-diagnostic
      seedMasteryFromDiagnostic(data.token);
      try { localStorage.setItem("puheo_signup_at", String(Date.now())); } catch { /* silent */ }
    }
    // L-V393 login fast-path. The old flow awaited THREE sequential round-trips
    // before showing any screen (/api/profile via checkOnboarding,
    // /api/placement/status via checkPlacementNeeded, then dashboard) — ~1.4s
    // warm (worse cold) of a frozen "Ladataan..." button. Now: paint the home
    // surface immediately (cached real content, or the content-shaped
    // skeleton), then resolve the gate from ONE batched /api/dashboard/v2 fetch
    // whose `profile` + `placement` sections feed the two checks so they skip
    // their own fetch. Null sections fall back to the legacy single-endpoint
    // calls. The final loadDashboard reuses the cached v2 payload (~1ms), so it
    // just swaps skeleton -> real content. Sidebar reveal is safe now because
    // the home surface is content-shaped, not empty cream.
    showHomeShell();
    _deps.updateSidebarState();
    const v2 = await fetchDashboardV2().catch(() => null);
    const needsOnboarding = await checkOnboarding(v2?.profile ?? undefined);
    if (!needsOnboarding) {
      const needsPlacement = await checkPlacementNeeded(v2?.placement ?? undefined);
      if (needsPlacement) {
        showPlacementIntro();
      } else {
        await _deps.loadDashboard();
      }
    }
  } catch {
    errEl.textContent = "Ei yhteyttä palvelimeen";
    errEl.classList.remove("hidden");
  } finally {
    $("btn-auth-submit").disabled = false;
    $("btn-auth-submit").textContent = AUTH_COPY[authMode].submit;
  }
});

$("btn-guest").addEventListener("click", () => {
  _deps.updateSidebarState();
  show("screen-start");
});

$("btn-forgot").addEventListener("click", async () => {
  const email = $("auth-email").value.trim();
  const errEl = $("auth-error");
  const okEl  = $("auth-success");
  errEl.classList.add("hidden");
  okEl.classList.add("hidden");

  if (!email) {
    errEl.textContent = "Kirjoita sähköpostiosoitteesi ensin";
    errEl.classList.remove("hidden");
    return;
  }

  $("btn-forgot").textContent = "Lähetetään...";
  $("btn-forgot").disabled = true;
  try {
    const res = await fetch(`${API}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      okEl.textContent = "Salasanan palautuslinkki lähetetty! Tarkista sähköpostisi.";
      okEl.classList.remove("hidden");
    } else {
      const d = await res.json();
      errEl.textContent = d.error || "Jokin meni pieleen";
      errEl.classList.remove("hidden");
    }
  } catch {
    errEl.textContent = "Ei yhteyttä palvelimeen";
    errEl.classList.remove("hidden");
  } finally {
    $("btn-forgot").disabled = false;
    $("btn-forgot").textContent = "Unohditko salasanan?";
  }
});
