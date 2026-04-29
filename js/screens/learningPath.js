// TODO(loading): adopt showSkeleton / showFetchError from js/ui/loading.js (Commit 9 follow-up)
/**
 * Learning path screen — visual Duolingo-style progression.
 */
import { $, show } from "../ui/nav.js";
import { API, isLoggedIn, authHeader, apiFetch } from "../api.js";
import { state } from "../state.js";
import { showLoading, showLoadingError } from "../ui/loading.js";

let _deps = {};
let _currentTopic = null;
let _currentPath = [];

export function initLearningPath({ loadDashboard }) {
  _deps = { loadDashboard };

  const startBtn = $("btn-mastery-start");
  if (startBtn) startBtn.addEventListener("click", startMasteryTest);

  const backBtn = $("btn-mastery-back");
  if (backBtn) backBtn.addEventListener("click", () => show("screen-path"));

  const continueBtn = $("btn-mastery-continue");
  if (continueBtn) continueBtn.addEventListener("click", () => {
    show("screen-path");
    loadPath();
  });

  const mixedBtn = $("btn-mixed-review");
  if (mixedBtn) mixedBtn.addEventListener("click", startMixedReview);

  // Note: the #nav-path sidebar button is handled by the central router in
  // js/main.js (navigateTo("path") → loadCurriculum). Do NOT attach a second
  // listener here — it caused a race where both screen-curriculum and
  // screen-path tried to show on the same click.
}

export async function loadPath() {
  if (!isLoggedIn()) {
    showLoadingError("Kirjaudu sisään nähdäksesi oppimispolkusi", () => show("screen-auth"));
    return;
  }

  try {
    const res = await apiFetch(`${API}/api/learning-path`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error("Polun lataus epäonnistui");
    const data = await res.json();

    _currentPath = data.path;
    renderPath(data);
  } catch (err) {
    showLoadingError(err.message, () => loadPath());
  }
}

function renderLevelBadge(data) {
  const badge = $("path-level-badge");
  const lvl = $("path-level-badge-level");
  const milestone = $("path-level-badge-milestone");
  if (!badge || !lvl || !milestone) return;

  const topics = data.path || [];
  if (topics.length === 0) { badge.hidden = true; return; }

  // "Current" level = highest level where the user has a mastered topic,
  // falling back to the lowest level that still has an unlocked/in-progress
  // topic. This matches what the student feels about "where they are."
  const levelsMastered = [...new Set(topics.filter((t) => t.status === "mastered").map((t) => t.level))].sort();
  const activeLevel = levelsMastered.length
    ? levelsMastered[levelsMastered.length - 1]
    : (topics.find((t) => t.status !== "locked")?.level || topics[0].level);

  lvl.textContent = activeLevel;

  // Next milestone = the first non-mastered topic. Guides the student's eye.
  const nextTopic = topics.find((t) => t.status !== "mastered" && t.status !== "locked")
                 || topics.find((t) => t.status === "locked");
  if (nextTopic) {
    milestone.textContent = `Seuraava virstanpylväs · ${nextTopic.label}`;
  } else {
    milestone.textContent = "Kaikki aiheet osattu — hieno työ!";
  }
  badge.hidden = false;
}

function renderPath(data) {
  const nodesEl = $("path-nodes");
  const progressFill = $("path-progress-fill");
  const progressLabel = $("path-progress-label");
  const mixedReview = $("path-mixed-review");
  const mixedSub = $("path-mixed-sub");

  renderLevelBadge(data);

  if (!nodesEl) return;

  // Progress bar
  const masteredPct = (data.masteredCount / data.totalTopics) * 100;
  if (progressFill) progressFill.style.width = masteredPct + "%";
  if (progressLabel) {
    progressLabel.textContent = `${data.masteredCount} / ${data.totalTopics} aihetta osattu`;
  }

  // Render nodes
  nodesEl.innerHTML = data.path.map((topic, i) => {
    const icon = topic.status === "mastered" ? "★" :
                 topic.status === "locked" ? "🔒" :
                 (i + 1);
    const meta = topic.status === "mastered"
      ? `<span class="mastered-tag">✓ Osattu ${topic.bestPct > 0 ? "(" + Math.round(topic.bestPct * 100) + "%)" : ""}</span>`
      : topic.status === "in_progress"
        ? `<span class="progress-tag">${Math.round(topic.bestPct * 100)}% — yritä uudelleen</span>`
        : topic.status === "locked"
          ? "Lukittu — suorita edellinen"
          : "Valmis aloitettavaksi";

    return `
      <div class="path-node ${topic.status}" data-topic="${topic.key}" data-locked="${topic.status === "locked"}">
        <div class="path-node-level">Taso ${topic.level}</div>
        <div class="path-node-circle">${icon}</div>
        <div class="path-node-body">
          <div class="path-node-label">${escapeHtml(topic.label)}</div>
          <div class="path-node-desc">${escapeHtml(topic.description)}</div>
          <div class="path-node-meta">${meta}</div>
        </div>
      </div>
    `;
  }).join("");

  // Wire up clicks
  nodesEl.querySelectorAll(".path-node").forEach(el => {
    const topicKey = el.dataset.topic;
    const locked = el.dataset.locked === "true";
    if (locked) return;
    el.addEventListener("click", () => openTopicIntro(topicKey));
  });

  // Mixed review (visible if >= 2 mastered)
  if (mixedReview) {
    if (data.masteredCount >= 2) {
      mixedReview.classList.remove("hidden");
      if (mixedSub) {
        mixedSub.textContent = `Harjoittele ${data.masteredCount} osattua aihetta yhdessä sessiossa`;
      }
    } else {
      mixedReview.classList.add("hidden");
    }
  }
}

function openTopicIntro(topicKey) {
  const topic = _currentPath.find(t => t.key === topicKey);
  if (!topic) return;

  _currentTopic = topic;
  $("mastery-intro-topic").textContent = topic.label;
  $("mastery-intro-desc").textContent = topic.description;
  show("screen-mastery-intro");
}

async function startMasteryTest() {
  if (!_currentTopic) return;
  showLoading("Luodaan mastery-testiä...");

  try {
    const res = await apiFetch(`${API}/api/mastery-test/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        topicKey: _currentTopic.key,
        language: state.language || "spanish",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Testin luonti epäonnistui");

    // Use the existing exercise flow
    state.mode = "mastery";
    state.topic = _currentTopic.key;
    state.exercises = data.exercises;
    state.current = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.batchCorrect = 0;
    state.batchNumber = 1;
    state.level = _currentTopic.level || "B";
    state.peakLevel = state.level;
    state._masteryMode = true;
    state._masteryTopicKey = _currentTopic.key;
    state._masteryTotal = data.total;

    show("screen-exercise");
    const { renderExercise } = await import("./vocab.js");
    if (renderExercise) renderExercise();
  } catch (err) {
    showLoadingError(err.message, () => startMasteryTest());
  }
}

export async function submitMasteryResult(correct, total) {
  if (!_currentTopic) return null;
  try {
    const res = await apiFetch(`${API}/api/mastery-test/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        topicKey: _currentTopic.key,
        correct,
        total,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tuloksen tallennus epäonnistui");
    showMasteryResult(data);
    return data;
  } catch (err) {
    alert("Virhe: " + err.message);
    return null;
  }
}

function showMasteryResult(result) {
  const icon = result.passed ? "🎉" : "💪";
  const iconEl = $("mastery-result-icon");
  const pctEl = $("mastery-result-pct");
  const scoreEl = $("mastery-result-score");
  const msgEl = $("mastery-result-message");
  const unlockEl = $("mastery-result-unlock");
  const unlockNameEl = $("mastery-result-next");

  if (iconEl) iconEl.textContent = icon;
  if (pctEl) {
    pctEl.textContent = result.pct + "%";
    pctEl.className = "mastery-result-pct " + (result.passed ? "pass" : "fail");
  }
  if (scoreEl) scoreEl.textContent = `${result.correct} / ${result.total} oikein`;
  if (msgEl) {
    if (result.newlyMastered) {
      msgEl.textContent = "Mahtavaa! Osaat tämän aiheen nyt.";
    } else if (result.passed) {
      msgEl.textContent = "Vahvistit osaamistasi — hienosti!";
    } else {
      msgEl.textContent = `Tarvitset 80% läpäistäksesi. Yritä uudestaan — paras tuloksesi on ${result.bestPct}%.`;
    }
  }

  if (unlockEl) {
    if (result.unlockedNext && result.nextTopicLabel) {
      unlockEl.classList.remove("hidden");
      if (unlockNameEl) unlockNameEl.textContent = result.nextTopicLabel;
    } else {
      unlockEl.classList.add("hidden");
    }
  }

  show("screen-mastery-result");
}

async function startMixedReview() {
  showLoading("Luodaan sekoitettua harjoitusta...");
  try {
    const res = await apiFetch(`${API}/api/mixed-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ count: 15, language: state.language || "spanish" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Harjoituksen luonti epäonnistui");

    state.mode = "vocab";
    state.topic = "mixed";
    state.exercises = data.exercises;
    state.current = 0;
    state.totalCorrect = 0;
    state.totalAnswered = 0;
    state.batchCorrect = 0;
    state.batchNumber = 1;
    state._masteryMode = false;

    show("screen-exercise");
    const { renderExercise } = await import("./vocab.js");
    if (renderExercise) renderExercise();
  } catch (err) {
    showLoadingError(err.message, () => startMixedReview());
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
