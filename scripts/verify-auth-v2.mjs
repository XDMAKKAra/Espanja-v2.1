// L-V413 Lohko 1 verification — register-first auth screen.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const out = (n) => `docs/audits/l-v413-${n}.png`;
let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("puheo_gate_ok_v1", "1");
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${BASE}/app.html`, { waitUntil: "networkidle" });

// 1. Default = register view
check(await page.locator("#screen-auth.active").count() === 1, "auth screen active for logged-out user");
check((await page.locator("#auth-title").textContent())?.trim() === "Luo tili", "default title is 'Luo tili' (register)");
check(await page.locator("#auth-name").isVisible(), "name field visible in register mode");
check(await page.locator("#btn-forgot").isHidden(), "forgot-password hidden in register mode");
check(await page.locator("#tab-login").isVisible(), "switch-to-login link visible");
await page.screenshot({ path: out("auth-register-desktop"), fullPage: false });

// 2. Switch to login
await page.locator("#tab-login").click();
check((await page.locator("#auth-title").textContent())?.trim() === "Kirjaudu sisään", "title switches to 'Kirjaudu sisään'");
check(await page.locator("#auth-name").isHidden(), "name field hidden in login mode");
check(await page.locator("#btn-forgot").isVisible(), "forgot-password visible in login mode");
check(await page.locator("#tab-register").isVisible(), "switch-to-register link visible");
check(await page.locator("#auth-password").getAttribute("autocomplete") === "current-password", "autocomplete flips to current-password");
await page.screenshot({ path: out("auth-login-desktop") });

// 3. Switch back
await page.locator("#tab-register").click();
check((await page.locator("#auth-title").textContent())?.trim() === "Luo tili", "switch back to register works");

// 4. Register validation: empty name shows error
await page.locator("#auth-email").fill("testi@example.com");
await page.locator("#auth-password").fill("Salasana123");
await page.locator("#btn-auth-submit").click();
check((await page.locator("#auth-error").textContent())?.includes("Kerro nimesi"), "missing name produces 'Kerro nimesi'");

// 5. Deep link #kirjaudu lands on login (fresh page: hash-only goto from the
// same URL is a same-document navigation and would not re-run module code,
// which is also the real-world case — deep links always arrive as full loads)
const dl = await ctx.newPage();
await dl.goto(`${BASE}/app.html#kirjaudu`, { waitUntil: "networkidle" });
check((await dl.locator("#auth-title").textContent())?.trim() === "Kirjaudu sisään", "#kirjaudu deep link opens login");
await dl.close();

// 6. Mobile 390px: no horizontal scroll, register default
const mob = await ctx.browser().newContext({ viewport: { width: 390, height: 844 } });
const mp = await mob.newPage();
await mp.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("puheo_gate_ok_v1", "1");
});
await mp.goto(`${BASE}/app.html`, { waitUntil: "networkidle" });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check(overflow <= 0, `no horizontal scroll at 390px (overflow=${overflow}px)`);
check((await mp.locator("#auth-title").textContent())?.trim() === "Luo tili", "mobile default is register");
await mp.screenshot({ path: out("auth-register-mobile"), fullPage: true });

// 7. Even narrower 360px
await mp.setViewportSize({ width: 360, height: 800 });
const overflow2 = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check(overflow2 <= 0, `no horizontal scroll at 360px (overflow=${overflow2}px)`);

check(errors.length === 0, `no page errors (${errors.join("; ").slice(0, 300)})`);

await browser.close();
console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
