import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadBriefing, topicLabel, wireTopicPicker } from "../js/screens/mode-page.js";

function buildBriefingDom(modeId) {
  document.body.innerHTML = `
    <div id="${modeId}-briefing" class="mode-briefing">
      <p class="eyebrow"></p>
      <div class="mode-briefing__stats">
        <div><span class="mono-num mono-num--lg" id="${modeId}-last-acc">—</span></div>
        <div><span class="mono-num mono-num--lg" id="${modeId}-week-sessions">—</span></div>
        <div><span class="mono-num mono-num--lg" id="${modeId}-streak">—</span></div>
      </div>
    </div>
  `;
}

describe("loadBriefing", () => {
  beforeEach(() => {
    window._dashModeStats = undefined;
    window._dashStreak = undefined;
    window._dashModeDaysAgo = undefined;
  });
  afterEach(() => { document.body.innerHTML = ""; });

  it("renders empty state when no stats are cached", () => {
    buildBriefingDom("vocab");
    loadBriefing("vocab");
    expect(document.getElementById("vocab-briefing").classList.contains("mode-briefing--empty")).toBe(true);
    expect(document.querySelector(".eyebrow").textContent).toBe("ENSIMMÄINEN KERTA");
  });

  it("renders empty state when sessions is zero", () => {
    buildBriefingDom("vocab");
    window._dashModeStats = { vocab: { sessions: 0, avgPct: null, bestGrade: null } };
    loadBriefing("vocab");
    expect(document.getElementById("vocab-briefing").classList.contains("mode-briefing--empty")).toBe(true);
  });

  it("populates the three stats when data is available", () => {
    buildBriefingDom("grammar");
    window._dashModeStats = { grammar: { sessions: 12, avgPct: 78, bestGrade: "M" } };
    window._dashStreak = 4;
    window._dashModeDaysAgo = { grammar: 2 };
    loadBriefing("grammar");
    expect(document.getElementById("grammar-last-acc").textContent).toBe("78");
    expect(document.getElementById("grammar-week-sessions").textContent).toBe("12");
    expect(document.getElementById("grammar-streak").textContent).toBe("4");
    expect(document.querySelector("#grammar-briefing .eyebrow").textContent).toBe("VIIMEKSI · 2 PV SITTEN");
  });

  it("formats today / yesterday / null distinctly in the eyebrow", () => {
    buildBriefingDom("vocab");
    window._dashModeStats = { vocab: { sessions: 1, avgPct: 50, bestGrade: null } };

    window._dashModeDaysAgo = { vocab: 0 };
    loadBriefing("vocab");
    expect(document.querySelector("#vocab-briefing .eyebrow").textContent).toBe("VIIMEKSI · TÄNÄÄN");

    window._dashModeDaysAgo = { vocab: 1 };
    loadBriefing("vocab");
    expect(document.querySelector("#vocab-briefing .eyebrow").textContent).toBe("VIIMEKSI · EILEN");

    window._dashModeDaysAgo = { vocab: null };
    loadBriefing("vocab");
    expect(document.querySelector("#vocab-briefing .eyebrow").textContent).toBe("VIIMEKSI · —");
  });

  it("writes — when individual fields are null", () => {
    buildBriefingDom("vocab");
    window._dashModeStats = { vocab: { sessions: 5, avgPct: null, bestGrade: null } };
    window._dashStreak = null;
    window._dashModeDaysAgo = { vocab: 3 };
    loadBriefing("vocab");
    expect(document.getElementById("vocab-last-acc").textContent).toBe("—");
    expect(document.getElementById("vocab-week-sessions").textContent).toBe("5");
    expect(document.getElementById("vocab-streak").textContent).toBe("—");
  });
});

describe("topicLabel", () => {
  it("returns the Finnish label for a known topic", () => {
    expect(topicLabel("subjunctive")).toBe("Subjunktiivi");
  });

  it("falls back to the raw id for unknown topics", () => {
    expect(topicLabel("xyz_unknown")).toBe("xyz_unknown");
  });
});

describe("wireTopicPicker", () => {
  it("toggles is-current + aria-checked on row click", () => {
    document.body.innerHTML = `
      <div class="mode-topics">
        <button class="mode-topic is-current" data-topic="a" aria-checked="true"></button>
        <button class="mode-topic" data-topic="b" aria-checked="false"></button>
      </div>
    `;
    const container = document.querySelector(".mode-topics");
    wireTopicPicker(container);

    const second = container.querySelectorAll(".mode-topic")[1];
    second.click();

    const all = container.querySelectorAll(".mode-topic");
    expect(all[0].classList.contains("is-current")).toBe(false);
    expect(all[0].getAttribute("aria-checked")).toBe("false");
    expect(all[1].classList.contains("is-current")).toBe(true);
    expect(all[1].getAttribute("aria-checked")).toBe("true");
  });

  it("updates a CTA meta line via template fn on row click", () => {
    document.body.innerHTML = `
      <div class="mode-topics">
        <button class="mode-topic is-current" data-topic="alpha" aria-checked="true"></button>
        <button class="mode-topic" data-topic="beta" aria-checked="false"></button>
      </div>
      <button class="btn--cta" id="cta">
        <span class="btn--cta__meta">OLD</span>
      </button>
    `;
    const container = document.querySelector(".mode-topics");
    const ctaEl = document.getElementById("cta");
    wireTopicPicker(container, {
      ctaEl,
      ctaMetaTemplate: (id) => `META · ${id.toUpperCase()}`,
    });

    container.querySelectorAll(".mode-topic")[1].click();
    expect(ctaEl.querySelector(".btn--cta__meta").textContent).toBe("META · BETA");
  });
});
