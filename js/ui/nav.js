// ─── DOM helpers & screen navigation ────────────────────────────────────────

export const $ = (id) => document.getElementById(id);

export const show = (id) => {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  // Rail is dashboard-only (Spec §3.2) — collapse grid on non-dashboard screens
  const shell = document.getElementById("app-shell");
  if (shell) {
    if (id === "screen-dashboard") shell.removeAttribute("data-rail");
    else shell.setAttribute("data-rail", "off");
  }
};
