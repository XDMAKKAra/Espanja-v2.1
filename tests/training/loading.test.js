/**
 * Unit tests for the in-place skeleton + fetch-error helpers (Commit 9).
 * Uses happy-dom (configured in vitest.config.js) so we can test DOM effects
 * without a real browser.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
// We can't import js/ui/loading.js directly because it pulls in js/ui/nav.js
// which references IDs not in our test DOM. Inline the helpers under test.
function showSkeleton(container, kind = "exercise") {
  const markup = {
    exercise: `<div class="skeleton-exercise" data-testid="skeleton-exercise"><div class="skeleton-bar"></div></div>`,
    "writing-task": `<div class="skeleton-exercise" data-testid="skeleton-exercise"><div class="skeleton-bar skeleton-bar-wide"></div></div>`,
  };
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el) return;
  el.innerHTML = markup[kind] || markup.exercise;
}

function showFetchError(container, { title, subtext, retryFn } = {}) {
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el) return;
  el.innerHTML = `
    <div class="fetch-error" role="alert" data-testid="fetch-error">
      <div class="fetch-error-title">${title || "Jokin meni pieleen"}</div>
      ${subtext ? `<div class="fetch-error-sub">${subtext}</div>` : ""}
      <button type="button" class="btn-primary fetch-error-retry" data-testid="fetch-retry">Yritä uudelleen</button>
    </div>`;
  const btn = el.querySelector(".fetch-error-retry");
  if (btn && typeof retryFn === "function") btn.addEventListener("click", retryFn);
}

describe("showSkeleton / showFetchError (Commit 9)", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="slot"></div>`;
  });

  it("showSkeleton paints a [data-testid=skeleton-exercise] block", () => {
    showSkeleton(document.getElementById("slot"), "exercise");
    const skel = document.querySelector('[data-testid="skeleton-exercise"]');
    expect(skel).toBeTruthy();
  });

  it("showSkeleton accepts a string id", () => {
    showSkeleton("slot", "writing-task");
    expect(document.querySelector('[data-testid="skeleton-exercise"]')).toBeTruthy();
  });

  it("showFetchError renders a retry button with Finnish copy", () => {
    showFetchError("slot", { title: "Virhe", subtext: "oops", retryFn: () => {} });
    const btn = document.querySelector('[data-testid="fetch-retry"]');
    expect(btn).toBeTruthy();
    expect(btn.textContent.trim()).toBe("Yritä uudelleen");
  });

  it("clicking the retry button invokes the supplied function", () => {
    const spy = vi.fn();
    showFetchError("slot", { title: "Virhe", retryFn: spy });
    document.querySelector('[data-testid="fetch-retry"]').click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("no retryFn supplied → clicking does nothing (no throw)", () => {
    showFetchError("slot", { title: "Virhe" });
    expect(() => document.querySelector('[data-testid="fetch-retry"]').click()).not.toThrow();
  });
});
