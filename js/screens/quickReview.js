import { $ } from "../ui/nav.js";
import { state } from "../state.js";
import { track } from "../analytics.js";
import { trackBlogClick } from "../features/topicBlogMap.js";

let reviewsCache = null;
let onStartDrill = null;
let currentSource = "manual";
let currentTopicKey = null;

async function loadReviews() {
  if (reviewsCache) return reviewsCache;
  try {
    const res = await fetch("/data/quick-reviews.json", { cache: "force-cache" });
    if (!res.ok) throw new Error("fetch failed");
    reviewsCache = await res.json();
  } catch {
    reviewsCache = {};
  }
  return reviewsCache;
}

function getSelectedTopic() {
  // The grammar topic picker is `.mode-topic` (with `.is-current` /
  // `aria-checked="true"`) inside `#screen-mode-grammar` — the old
  // `#grammar-topic-cards .topic-card.active` selector pointed at
  // classes that no longer exist, so the function always returned
  // "mixed" and the kertaus button stayed hidden / inert.
  return (
    document.querySelector('#screen-mode-grammar .mode-topic[aria-checked="true"]')?.dataset.topic
    || document.querySelector('#screen-mode-grammar .mode-topic.is-current')?.dataset.topic
    || "mixed"
  );
}

function renderReview(review) {
  $("quickreview-title").textContent = review.title;
  $("quickreview-rule").textContent = review.rule;

  const examplesEl = $("quickreview-examples");
  examplesEl.innerHTML = "";
  (review.examples || []).forEach((ex) => {
    const wrap = document.createElement("div");
    wrap.className = "quickreview-example";
    const es = document.createElement("div");
    es.className = "quickreview-example-es";
    es.textContent = ex.es;
    const fi = document.createElement("div");
    fi.className = "quickreview-example-fi";
    fi.textContent = ex.fi;
    wrap.appendChild(es);
    wrap.appendChild(fi);
    examplesEl.appendChild(wrap);
  });

  const mistakeEl = $("quickreview-mistake");
  mistakeEl.innerHTML = "";
  const m = review.common_mistake || {};
  const wrong = document.createElement("div");
  wrong.innerHTML = `<span class="quickreview-wrong">${escapeHtml(m.wrong || "")}</span>`;
  const right = document.createElement("div");
  right.innerHTML = `<span class="quickreview-right">${escapeHtml(m.right || "")}</span>`;
  mistakeEl.appendChild(wrong);
  mistakeEl.appendChild(right);
  if (m.note) {
    const note = document.createElement("span");
    note.className = "quickreview-mistake-note";
    note.textContent = m.note;
    mistakeEl.appendChild(note);
  }

  const blogLink = $("quickreview-blog");
  if (review.blog_url) {
    blogLink.href = review.blog_url;
    blogLink.textContent = "Lue pidempi opas →";
    blogLink.hidden = false;
  } else {
    blogLink.hidden = true;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export async function openQuickReview(topicKey, source = "manual") {
  const reviews = await loadReviews();
  const review = reviews[topicKey];
  if (!review) return false;

  currentSource = source;
  currentTopicKey = topicKey;
  renderReview(review);
  const startBtn = $("quickreview-start");
  if (startBtn) {
    startBtn.textContent = source === "autotrigger" ? "Jatka harjoitusta →" : "Aloita harjoitus →";
  }
  track("quickreview_shown", { topic: topicKey, source });
  $("quickreview-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  return true;
}

function closeQuickReview() {
  $("quickreview-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}

async function updateReviewButtonVisibility() {
  const btn = $("btn-show-quickreview");
  if (!btn) return;
  const topic = getSelectedTopic();
  const reviews = await loadReviews();
  btn.hidden = !reviews[topic];
}

export function initQuickReview({ startGrammarDrill }) {
  onStartDrill = startGrammarDrill;

  const showBtn = $("btn-show-quickreview");
  if (showBtn) {
    showBtn.addEventListener("click", async () => {
      const topic = getSelectedTopic();
      await openQuickReview(topic, "manual");
    });
  }

  // Watch the grammar topic picker; refresh button visibility whenever
  // a `.mode-topic` is clicked (radio-style selection). The pre-2026
  // markup used `#grammar-topic-cards .topic-card` — those IDs/classes
  // are gone now.
  const grammarScreen = document.getElementById("screen-mode-grammar");
  if (grammarScreen) {
    grammarScreen.addEventListener("click", (e) => {
      if (e.target.closest(".mode-topic")) {
        // Defer one frame so the click handler that flips `is-current` /
        // `aria-checked` runs first and getSelectedTopic() sees the new state.
        requestAnimationFrame(() => updateReviewButtonVisibility());
      }
    });
  }
  updateReviewButtonVisibility();

  const closeBtn = $("quickreview-close");
  if (closeBtn) closeBtn.addEventListener("click", closeQuickReview);

  const overlay = $("quickreview-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeQuickReview();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("quickreview-overlay").classList.contains("hidden")) {
      closeQuickReview();
    }
  });

  const blogLink = $("quickreview-blog");
  if (blogLink) {
    blogLink.addEventListener("click", () => {
      trackBlogClick("quickreview_modal", currentTopicKey, blogLink.getAttribute("href"));
    });
  }

  const startBtn = $("quickreview-start");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const wasManual = currentSource === "manual";
      closeQuickReview();
      if (wasManual && typeof onStartDrill === "function") onStartDrill();
    });
  }
}

// ─── Auto-trigger: 3 consecutive wrong answers in a drill session ─────────

export function resetAutoTriggerTracking() {
  state.quickReviewAutoTriggered = false;
  state.quickReviewStreak = 0;
}

export async function recordAnswerForAutoTrigger(isCorrect, topicKey) {
  if (!topicKey || topicKey === "mixed") return;
  if (state.quickReviewAutoTriggered) return;

  if (isCorrect) {
    state.quickReviewStreak = 0;
    return;
  }

  state.quickReviewStreak = (state.quickReviewStreak || 0) + 1;

  if (state.quickReviewStreak >= 3) {
    state.quickReviewAutoTriggered = true;
    track("quickreview_autotrigger", { topic: topicKey });
    await openQuickReview(topicKey, "autotrigger");
  }
}
