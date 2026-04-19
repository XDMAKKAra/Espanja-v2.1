/**
 * Guards design-system/DESIGN.md §8.8 modal shell.
 *
 * Verifies: focus trap, Escape closes, backdrop click closes, body scroll
 * lock, focus restoration, tokenised styling.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const modalCss = readFileSync(resolve(root, "css/components/modal.css"), "utf8");

function mount() {
  document.body.innerHTML = `
    <button id="opener">Avaa</button>
    <div id="m" class="modal" role="dialog" aria-modal="true" hidden>
      <div class="modal__backdrop" data-modal-dismiss></div>
      <div class="modal__panel">
        <button class="modal__close" data-modal-dismiss aria-label="Sulje">×</button>
        <h2 class="modal__title">Title</h2>
        <div class="modal__body">
          <input id="field1" />
          <input id="field2" />
        </div>
        <div class="modal__actions">
          <button id="cancel" data-modal-dismiss>Peruuta</button>
          <button id="confirm">OK</button>
        </div>
      </div>
    </div>`;
  // jsdom can't compute layout, so stub getBoundingClientRect for focusable filter.
  const boxes = document.querySelectorAll("button, input");
  boxes.forEach((el) => {
    el.getBoundingClientRect = () => ({ width: 10, height: 10, top: 0, left: 0, bottom: 10, right: 10 });
  });
}

describe("modal CSS contract", () => {
  it("backdrop is rgba + blur", () => {
    expect(modalCss).toMatch(/\.modal__backdrop[\s\S]*?background:\s*rgba\(0,\s*0,\s*0,\s*0\.6\)/);
    expect(modalCss).toMatch(/\.modal__backdrop[\s\S]*?backdrop-filter:\s*blur\(6px\)/);
  });
  it("panel uses --surface + --r-lg + --sh-lift + max-width 480px", () => {
    expect(modalCss).toMatch(/\.modal__panel[\s\S]*?background:\s*var\(--surface\)/);
    expect(modalCss).toMatch(/\.modal__panel[\s\S]*?border-radius:\s*var\(--r-lg\)/);
    expect(modalCss).toMatch(/\.modal__panel[\s\S]*?box-shadow:\s*var\(--sh-lift\)/);
    expect(modalCss).toMatch(/\.modal__panel[\s\S]*?max-width:\s*480px/);
  });
  it("close button is 44x44 minimum", () => {
    expect(modalCss).toMatch(/\.modal__close[\s\S]*?min-width:\s*44px/);
    expect(modalCss).toMatch(/\.modal__close[\s\S]*?min-height:\s*44px/);
  });
  it("no !important in new rules", () => {
    expect(modalCss).not.toMatch(/!important/);
  });
});

describe("modal runtime — focus trap, escape, backdrop, body lock", () => {
  let openModal;
  beforeEach(async () => {
    vi.resetModules();
    ({ openModal } = await import("../js/ui/modal.js"));
    mount();
  });

  it("opens and moves focus inside the panel", () => {
    document.getElementById("opener").focus();
    openModal(document.getElementById("m"));
    const active = document.activeElement;
    expect(document.querySelector(".modal__panel").contains(active)).toBe(true);
  });

  it("adds .modal-open to body while open, removes on close", () => {
    const close = openModal(document.getElementById("m"));
    expect(document.body.classList.contains("modal-open")).toBe(true);
    close();
    expect(document.body.classList.contains("modal-open")).toBe(false);
  });

  it("Escape closes the modal", () => {
    openModal(document.getElementById("m"));
    const m = document.getElementById("m");
    m.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(m.hasAttribute("hidden")).toBe(true);
  });

  it("click on [data-modal-dismiss] closes (backdrop + close button + cancel)", () => {
    openModal(document.getElementById("m"));
    document.querySelector(".modal__backdrop").click();
    expect(document.getElementById("m").hasAttribute("hidden")).toBe(true);

    mount();
    openModal(document.getElementById("m"));
    document.querySelector(".modal__close").click();
    expect(document.getElementById("m").hasAttribute("hidden")).toBe(true);

    mount();
    openModal(document.getElementById("m"));
    document.getElementById("cancel").click();
    expect(document.getElementById("m").hasAttribute("hidden")).toBe(true);
  });

  it("Tab on last element loops back to first", () => {
    openModal(document.getElementById("m"));
    const confirmBtn = document.getElementById("confirm");
    confirmBtn.focus();
    confirmBtn.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Tab", bubbles: true, cancelable: true
    }));
    // first focusable = close button (has data-modal-dismiss but still focusable)
    expect(document.activeElement.classList.contains("modal__close")).toBe(true);
  });

  it("Shift+Tab on first element loops to last", () => {
    openModal(document.getElementById("m"));
    const closeBtn = document.querySelector(".modal__close");
    closeBtn.focus();
    closeBtn.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Tab", shiftKey: true, bubbles: true, cancelable: true
    }));
    expect(document.activeElement.id).toBe("confirm");
  });

  it("restores focus to opener on close", () => {
    const opener = document.getElementById("opener");
    opener.focus();
    const close = openModal(document.getElementById("m"));
    close();
    expect(document.activeElement).toBe(opener);
  });
});
