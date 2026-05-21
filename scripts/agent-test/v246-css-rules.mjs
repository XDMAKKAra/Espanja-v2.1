// Find what CSS rule is setting position on #screen-settings.
import { chromium } from "playwright";
const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "testpro123@gmail.com");
  localStorage.setItem("puheo_gate_ok_v1", "1");
});
const ok = (b) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });
await page.route("**/api/profile", ok({ profile: { onboarding_completed: true, target_grade: "M", target_language: "es" } }));
await page.route("**/api/auth/me", ok({ ok: true, pro: true }));
await page.route("**/api/dashboard", ok({}));
await page.route("**/api/learning-path", ok({ path: [] }));
await page.route("**/api/sr/**", ok({}));
await page.route("**/api/placement/**", ok({ needed: false }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.evaluate(async () => { const m = await import("/js/screens/settings.js"); await m.showSettings(); });
await page.waitForTimeout(500);

const cdp = await page.context().newCDPSession(page);
await cdp.send("DOM.enable");
await cdp.send("CSS.enable");
const { root } = await cdp.send("DOM.getDocument", { depth: -1 });

// Find #screen-settings nodeId
const findId = (node) => {
  if (node?.attributes) {
    for (let i = 0; i < node.attributes.length; i += 2)
      if (node.attributes[i] === "id" && node.attributes[i+1] === "screen-settings") return node.nodeId;
  }
  if (node.children) for (const c of node.children) { const n = findId(c); if (n) return n; }
  return null;
};
const nodeId = findId(root);
console.log("nodeId:", nodeId);

const matched = await cdp.send("CSS.getMatchedStylesForNode", { nodeId });
const positionRules = [];
for (const m of matched.matchedCSSRules) {
  const props = m.rule.style.cssProperties.filter((p) => p.name === "position" || p.name === "inset" || p.name === "top" || p.name === "height");
  if (props.length) {
    positionRules.push({
      selector: m.rule.selectorList.text,
      origin: m.rule.origin,
      source: m.rule.styleSheetId,
      props,
    });
  }
}
console.log("MATCHED position/inset/top/height rules:");
console.log(JSON.stringify(positionRules, null, 2));

await ctx.close();
await browser.close();
