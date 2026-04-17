// ─── DOM helpers & screen navigation ────────────────────────────────────────

export const $ = (id) => document.getElementById(id);

export const show = (id) => {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
};
