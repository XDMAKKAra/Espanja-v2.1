/**
 * Guards design-system/DESIGN.md §8.6 feedback banner + §8.7 toast.
 *
 * Toast tests exercise the DOM API with jsdom: the happy path (show a
 * success, it auto-dismisses), the sticky path (error stays until close),
 * and the onboarding migration (alert() replaced with toast.error).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const feedbackCss = readFileSync(resolve(root, "css/components/feedback.css"), "utf8");
const onboardingJs = readFileSync(resolve(root, "js/screens/onboarding.js"), "utf8");

describe("feedback banner — CSS contract", () => {
  for (const state of ["correct", "close", "wrong", "info"]) {
    it(`declares .banner--${state}`, () => {
      expect(feedbackCss).toMatch(new RegExp(`\\.banner--${state}\\s*\\{`));
    });
  }
  it("states use semantic tokens (success/warn/error/info)", () => {
    expect(feedbackCss).toMatch(/\.banner--correct[\s\S]*?var\(--success\)/);
    expect(feedbackCss).toMatch(/\.banner--close[\s\S]*?var\(--warn\)/);
    expect(feedbackCss).toMatch(/\.banner--wrong[\s\S]*?var\(--error\)/);
  });
  it("uses color-mix for tinted background", () => {
    expect(feedbackCss).toMatch(/color-mix\(in srgb/);
  });
});

describe("toast — CSS contract", () => {
  it("declares .toast-region and .toast", () => {
    expect(feedbackCss).toMatch(/\.toast-region\s*\{/);
    expect(feedbackCss).toMatch(/\.toast\s*\{/);
  });
  it("four variants use semantic tokens", () => {
    expect(feedbackCss).toMatch(/\.toast--success[\s\S]*?var\(--success\)/);
    expect(feedbackCss).toMatch(/\.toast--error[\s\S]*?var\(--error\)/);
    expect(feedbackCss).toMatch(/\.toast--warn[\s\S]*?var\(--warn\)/);
    expect(feedbackCss).toMatch(/\.toast--info[\s\S]*?var\(--info\)/);
  });
  it("respects safe-area-inset-bottom", () => {
    expect(feedbackCss).toMatch(/env\(safe-area-inset-bottom/);
  });
  it("disables animations under prefers-reduced-motion", () => {
    expect(feedbackCss).toMatch(/prefers-reduced-motion[\s\S]*?animation:\s*none/);
  });
});

describe("toast — runtime", () => {
  let toast;
  beforeEach(async () => {
    document.body.innerHTML = "";
    // Make the reduced-motion check return false so animations run normally.
    if (!window.matchMedia) {
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    }
    // Fresh import each test so module-level region is reset.
    vi.resetModules();
    ({ toast } = await import("../js/ui/toast.js"));
  });
  afterEach(() => { document.body.innerHTML = ""; });

  it("creates the toast region on first call", () => {
    toast.info("Hei");
    expect(document.getElementById("puheo-toast-region")).toBeTruthy();
  });

  it("renders a success toast with the message + variant class", () => {
    toast.success("Tallennettu!");
    const el = document.querySelector(".toast.toast--success");
    expect(el).toBeTruthy();
    expect(el.textContent).toContain("Tallennettu!");
  });

  it("error toast has role='alert' for immediate AT announcement", () => {
    toast.error("Verkkovirhe");
    const el = document.querySelector(".toast--error");
    expect(el.getAttribute("role")).toBe("alert");
  });

  it("error toast is sticky (no auto-dismiss) — still in DOM after 5s", () => {
    vi.useFakeTimers();
    toast.error("Ei yhteyttä");
    vi.advanceTimersByTime(5000);
    expect(document.querySelectorAll(".toast--error").length).toBe(1);
    vi.useRealTimers();
  });

  it("close button removes the toast from DOM", async () => {
    toast.info("Hei");
    const btn = document.querySelector(".toast__close");
    btn.click();
    // With reduced-motion the close is synchronous; otherwise animation runs.
    // Force the safety-net timeout path.
    await new Promise((r) => setTimeout(r, 500));
    expect(document.querySelectorAll(".toast").length).toBe(0);
  });
});

describe("onboarding migrated from alert() to toast.error", () => {
  it("no alert('Tallennus...') call remains", () => {
    expect(onboardingJs).not.toMatch(/alert\(\s*["']Tallennus/);
  });
  it("imports toast from ui/toast.js", () => {
    expect(onboardingJs).toMatch(/import\s+\{\s*toast\s*\}\s+from\s+["']\.\.\/ui\/toast\.js["']/);
  });
  it("calls toast.error on save failure", () => {
    expect(onboardingJs).toMatch(/toast\.error\(\s*["']Tallennus/);
  });
});
