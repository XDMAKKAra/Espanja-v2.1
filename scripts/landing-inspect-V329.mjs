import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.URL || "http://localhost:4329/index.html";
const b = await chromium.launch();

await mkdir("screenshots/landing", { recursive: true });

// --- Mobile (iPhone 13)
const mctx = await b.newContext({ ...devices["iPhone 13"] });
await mctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
const m = await mctx.newPage();
await m.goto(base, { waitUntil: "networkidle" });
await m.waitForTimeout(800);

const mobile = await m.evaluate(() => {
  const label = document.querySelector(".hero__lang-label");
  const labelCS = label ? getComputedStyle(label) : null;
  const navSignup = document.querySelector("#nav-signup");
  const navLogin = document.querySelector("#nav-login");
  const teaser = document.querySelector(".hero__teaser");
  const sub = document.querySelector(".hero__sub");
  const secondary = document.querySelector(".hero__link-secondary");
  const proof = document.querySelector("#nayte");
  const heroEl = document.querySelector(".hero");
  const sections = Array.from(document.querySelectorAll("main > section"))
    .map((s) => ({ id: s.id || "(no-id)", cls: s.className.split(" ").slice(0, 2).join(" ") }));
  return {
    sections,
    lang_label_ff: labelCS ? labelCS.fontFamily : null,
    lang_label_ls: labelCS ? labelCS.letterSpacing : null,
    nav_signup_display: navSignup ? getComputedStyle(navSignup).display : null,
    nav_login_display: navLogin ? getComputedStyle(navLogin).display : null,
    hero_teaser_count: document.querySelectorAll(".hero__teaser").length,
    hero_sub_text: sub ? sub.textContent.trim().slice(0, 160) : null,
    hero_sub_has_br: sub ? !!sub.querySelector("br") : null,
    secondary_class: secondary ? secondary.className : null,
    secondary_border_bottom: secondary ? getComputedStyle(secondary).borderBottomWidth : null,
    proof_offset_from_hero: proof && heroEl ? Math.round(proof.getBoundingClientRect().top + window.scrollY - heroEl.getBoundingClientRect().top - window.scrollY) : null,
  };
});
console.log("MOBILE:");
console.log(JSON.stringify(mobile, null, 2));
await m.screenshot({ path: "screenshots/landing/mobile-fold-V329.png", clip: { x: 0, y: 0, width: 390, height: 844 } });

// --- Desktop 1280
const dctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await dctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
const d = await dctx.newPage();
await d.goto(base, { waitUntil: "networkidle" });
await d.waitForTimeout(800);

const desktop = await d.evaluate(() => {
  const navSignup = document.querySelector("#nav-signup");
  return {
    nav_signup_display_desktop: navSignup ? getComputedStyle(navSignup).display : null,
  };
});
console.log("DESKTOP:");
console.log(JSON.stringify(desktop, null, 2));
await d.screenshot({ path: "screenshots/landing/fullpage-after-V329.png", fullPage: true });

await b.close();
