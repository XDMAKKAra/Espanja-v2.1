/**
 * Unit test for Commit 10 — path level badge render logic.
 * Uses happy-dom and inlines the badge-rendering function to avoid
 * importing the full learningPath.js (which pulls in nav/auth deps).
 */
import { describe, it, expect, beforeEach } from "vitest";

function renderLevelBadge(data) {
  const badge = document.getElementById("path-level-badge");
  const lvl = document.getElementById("path-level-badge-level");
  const milestone = document.getElementById("path-level-badge-milestone");
  if (!badge || !lvl || !milestone) return;
  const topics = data.path || [];
  if (topics.length === 0) { badge.hidden = true; return; }
  const levelsMastered = [...new Set(topics.filter((t) => t.status === "mastered").map((t) => t.level))].sort();
  const activeLevel = levelsMastered.length
    ? levelsMastered[levelsMastered.length - 1]
    : (topics.find((t) => t.status !== "locked")?.level || topics[0].level);
  lvl.textContent = activeLevel;
  const nextTopic = topics.find((t) => t.status !== "mastered" && t.status !== "locked")
                 || topics.find((t) => t.status === "locked");
  if (nextTopic) milestone.textContent = `Seuraava virstanpylväs · ${nextTopic.label}`;
  else           milestone.textContent = "Kaikki aiheet osattu — hieno työ!";
  badge.hidden = false;
}

beforeEach(() => {
  document.body.innerHTML = `
    <div data-testid="current-level" id="path-level-badge" hidden>
      <span id="path-level-badge-level">—</span>
      <span id="path-level-badge-milestone"></span>
    </div>`;
});

describe("renderLevelBadge (Commit 10)", () => {
  it("hides badge when the path is empty", () => {
    renderLevelBadge({ path: [] });
    expect(document.getElementById("path-level-badge").hidden).toBe(true);
  });

  it("shows the highest mastered level + next non-mastered topic", () => {
    renderLevelBadge({
      path: [
        { key: "a", label: "Ser/estar",   level: "B1", status: "mastered" },
        { key: "b", label: "Hay/estar",   level: "B1", status: "mastered" },
        { key: "c", label: "Preteriti",   level: "B2", status: "in_progress" },
        { key: "d", label: "Subjunktiivi", level: "B2", status: "locked"     },
      ],
    });
    expect(document.getElementById("path-level-badge").hidden).toBe(false);
    expect(document.getElementById("path-level-badge-level").textContent).toBe("B1");
    expect(document.getElementById("path-level-badge-milestone").textContent)
      .toContain("Preteriti");
  });

  it("congratulates when every topic is mastered", () => {
    renderLevelBadge({
      path: [
        { key: "a", label: "A", level: "B1", status: "mastered" },
        { key: "b", label: "B", level: "B2", status: "mastered" },
      ],
    });
    const m = document.getElementById("path-level-badge-milestone").textContent;
    expect(m).toMatch(/Kaikki aiheet osattu/);
  });

  it("falls back to first unlocked topic level when nothing is mastered yet", () => {
    renderLevelBadge({
      path: [
        { key: "a", label: "A", level: "B1", status: "available" },
        { key: "b", label: "B", level: "B2", status: "locked" },
      ],
    });
    expect(document.getElementById("path-level-badge-level").textContent).toBe("B1");
  });
});
