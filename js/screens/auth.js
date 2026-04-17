import { $, show } from "../ui/nav.js";
import { API, setAuth, clearAuth } from "../api.js";
import { state } from "../state.js";

let _deps = {};
export function initAuth({ updateSidebarState, loadDashboard }) {
  _deps = { updateSidebarState, loadDashboard };
}

let authMode = "login"; // "login" | "register"

$("tab-login").addEventListener("click", () => {
  authMode = "login";
  $("tab-login").classList.add("active");
  $("tab-register").classList.remove("active");
  $("auth-title").textContent = "Kirjaudu sisään";
  $("btn-auth-submit").textContent = "Kirjaudu sisään →";
  $("auth-error").classList.add("hidden");
});

$("tab-register").addEventListener("click", () => {
  authMode = "register";
  $("tab-register").classList.add("active");
  $("tab-login").classList.remove("active");
  $("auth-title").textContent = "Luo tili";
  $("btn-auth-submit").textContent = "Luo tili →";
  $("auth-error").classList.add("hidden");
});

$("btn-auth-submit").addEventListener("click", async () => {
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  const errEl = $("auth-error");
  errEl.classList.add("hidden");

  if (!email || !password) {
    errEl.textContent = "Täytä kaikki kentät";
    errEl.classList.remove("hidden");
    return;
  }

  $("btn-auth-submit").textContent = "Ladataan...";
  $("btn-auth-submit").disabled = true;

  try {
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || "Jokin meni pieleen";
      errEl.classList.remove("hidden");
      return;
    }
    setAuth(data.token, data.refreshToken, data.email);
    _deps.updateSidebarState();
    await _deps.loadDashboard();
  } catch {
    errEl.textContent = "Ei yhteyttä palvelimeen";
    errEl.classList.remove("hidden");
  } finally {
    $("btn-auth-submit").disabled = false;
    $("btn-auth-submit").textContent = authMode === "login" ? "Kirjaudu sisään →" : "Luo tili →";
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
