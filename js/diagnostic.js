// Mini-diagnostic on landing page: 3 adaptive-difficulty questions,
// instant feedback, rough level estimate. Stored in localStorage for
// seeding user_mastery on registration.
(function () {
  "use strict";

  var root = document.getElementById("mini-diag");
  if (!root) return;

  var STORAGE_KEY = "puheo_diagnostic_v1";

  // Questions modeled on YO lyhyt oppimäärä styles; topic_keys match lib/learningPath.js
  var QUESTIONS = [
    {
      id: "q1_preterite",
      level: "B",
      topic_key: "preterite",
      topicLabel: "Preteriti",
      stem: "Ayer ___ (comer) paella con mis amigos.",
      options: [
        { key: "A", text: "comí" },
        { key: "B", text: "comía" },
        { key: "C", text: "como" },
        { key: "D", text: "comería" },
      ],
      correct: "A",
      explainCorrect:
        'Oikein! "Ayer" + yksittäinen päättynyt tapahtuma → preteriti. Tämä on B-tason perusero preteriti vs. imperfekti.',
      explainWrong:
        'Oikea oli "comí". "Ayer" on selvä signaali preteritille (yksittäinen, päättynyt tapahtuma), ei imperfektille.',
    },
    {
      id: "q2_subjunctive_ojala",
      level: "C\u2013M",
      topic_key: "subjunctive_present",
      topicLabel: "Subjunktiivi (ojalá)",
      stem: "Ojalá ___ sol mañana.",
      options: [
        { key: "A", text: "haga" },
        { key: "B", text: "hace" },
        { key: "C", text: "hará" },
        { key: "D", text: "hizo" },
      ],
      correct: "A",
      explainCorrect: "Oikein! Tämä on M-tason subjunktiivi — ojalá vaatii aina subjunktiivin.",
      explainWrong:
        'Oikea oli "haga". Ojalá vaatii AINA subjunktiivin, ei futuuria tai indikatiivia. Klassinen YO-virhe.',
    },
    {
      id: "q3_pluscuamperfecto_subj",
      level: "E\u2013L",
      topic_key: "subjunctive_imperfect",
      topicLabel: "Pluscuamperfekti + si-lause",
      stem: "Si ___ estudiado más, habría aprobado.",
      options: [
        { key: "A", text: "hubiera" },
        { key: "B", text: "había" },
        { key: "C", text: "habrá" },
        { key: "D", text: "habría" },
      ],
      correct: "A",
      explainCorrect:
        'Oikein! Epätodellinen si-lause menneessä + konditionaali (habría aprobado) vaatii imperfektisubjunktiivin. E–L-tason rakenne.',
      explainWrong:
        'Oikea oli "hubiera" — si-lause + konditionaali vaatii subjunktiivin menneessä.',
    },
  ];

  var state = { idx: 0, answers: [], startedAt: 0 };

  // Analytics: use PostHog if present, fallback to custom window.puheoTrack, else no-op.
  function track(event, props) {
    try {
      if (window.posthog && typeof window.posthog.capture === "function") {
        window.posthog.capture(event, props || {});
      }
      if (typeof window.puheoTrack === "function") {
        window.puheoTrack(event, props || {});
      }
    } catch (e) {
      /* silent */
    }
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showView(view) {
    var panels = root.querySelectorAll("[data-view]");
    for (var i = 0; i < panels.length; i++) {
      panels[i].classList.toggle("hidden", panels[i].dataset.view !== view);
    }
  }

  function renderQuestion() {
    var q = QUESTIONS[state.idx];
    $("mini-diag-progress-num").textContent = state.idx + 1;
    $("mini-diag-progress-fill").style.width = (state.idx / QUESTIONS.length) * 100 + "%";
    $("mini-diag-level-tag").textContent = q.level + "-taso \u00b7 " + q.topicLabel;
    $("mini-diag-stem").textContent = q.stem;

    var opts = $("mini-diag-options");
    opts.innerHTML = "";
    q.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mini-diag-opt";
      btn.dataset.key = opt.key;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");

      var keySpan = document.createElement("span");
      keySpan.className = "mini-diag-opt-key";
      keySpan.textContent = opt.key;
      var textSpan = document.createElement("span");
      textSpan.className = "mini-diag-opt-text";
      textSpan.textContent = opt.text;

      btn.appendChild(keySpan);
      btn.appendChild(textSpan);
      btn.addEventListener("click", function () {
        selectAnswer(opt.key);
      });
      opts.appendChild(btn);
    });

    $("mini-diag-feedback").classList.add("hidden");

    track("question-start", {
      question_id: q.id,
      index: state.idx,
      level: q.level,
      topic_key: q.topic_key,
    });
  }

  function selectAnswer(key) {
    var q = QUESTIONS[state.idx];
    var isCorrect = key === q.correct;
    state.answers.push({
      qid: q.id,
      topic_key: q.topic_key,
      selected: key,
      correct: isCorrect,
    });

    // Mark options
    var buttons = $("mini-diag-options").querySelectorAll(".mini-diag-opt");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.disabled = true;
      if (b.dataset.key === q.correct) b.classList.add("is-correct");
      if (b.dataset.key === key && !isCorrect) b.classList.add("is-wrong");
    }

    var verdict = $("mini-diag-verdict");
    verdict.textContent = isCorrect ? "Oikein." : "Väärin.";
    verdict.classList.toggle("is-correct", isCorrect);
    verdict.classList.toggle("is-wrong", !isCorrect);
    $("mini-diag-explain").textContent = isCorrect ? q.explainCorrect : q.explainWrong;

    var isLast = state.idx >= QUESTIONS.length - 1;
    $("mini-diag-next").textContent = isLast ? "Näytä tulos \u2192" : "Seuraava \u2192";
    $("mini-diag-feedback").classList.remove("hidden");

    track("question-answer", {
      question_id: q.id,
      index: state.idx,
      selected: key,
      correct: isCorrect,
      topic_key: q.topic_key,
    });
  }

  function nextStep() {
    if (state.idx < QUESTIONS.length - 1) {
      state.idx++;
      renderQuestion();
    } else {
      finish();
    }
  }

  function computeResult() {
    var correct = 0;
    for (var i = 0; i < state.answers.length; i++) {
      if (state.answers[i].correct) correct++;
    }

    var grade, etaLabel;
    if (correct >= 3) {
      grade = "E";
      etaLabel = "n. 2 kk L-tasolle";
    } else if (correct === 2) {
      grade = "C";
      etaLabel = "n. 3 kk harjoittelua";
    } else if (correct === 1) {
      grade = "B";
      etaLabel = "n. 4\u20135 kk harjoittelua";
    } else {
      grade = "A";
      etaLabel = "n. 6 kk harjoittelua";
    }

    // Weakest area = highest-level question answered wrong (Q3 > Q2 > Q1)
    var weakestLabel = null;
    var weakestTopic = null;
    for (var j = state.answers.length - 1; j >= 0; j--) {
      if (!state.answers[j].correct) {
        weakestLabel = QUESTIONS[j].topicLabel;
        weakestTopic = QUESTIONS[j].topic_key;
        break;
      }
    }
    if (!weakestLabel) {
      weakestLabel = "Ei selvää heikkoutta";
      weakestTopic = null;
    }

    // Seed rows for user_mastery when user registers
    var masterySeed = QUESTIONS.map(function (q, i) {
      var a = state.answers[i];
      return {
        topic_key: q.topic_key,
        best_pct: a && a.correct ? 1.0 : 0.0,
        best_score: a && a.correct ? 20 : 0,
        attempts: 1,
        status: a && a.correct ? "available" : "locked",
      };
    });

    return {
      version: 1,
      grade: grade,
      correct: correct,
      total: QUESTIONS.length,
      eta_label: etaLabel,
      weakest: { label: weakestLabel, topic_key: weakestTopic },
      answers: state.answers,
      mastery_seed: masterySeed,
      duration_ms: Date.now() - state.startedAt,
      completed_at: new Date().toISOString(),
    };
  }

  function finish() {
    var result = computeResult();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch (e) {
      /* storage disabled — still show result */
    }

    $("mini-diag-grade").textContent = result.grade;
    $("mini-diag-weakest").textContent = result.weakest.label;
    $("mini-diag-eta").textContent = result.eta_label;

    showView("result");
    $("mini-diag-progress-fill").style.width = "100%";

    track("result-shown", {
      grade: result.grade,
      correct: result.correct,
      total: result.total,
      weakest_topic: result.weakest.topic_key,
      duration_ms: result.duration_ms,
    });
  }

  // Wire up
  $("mini-diag-start").addEventListener("click", function () {
    state.idx = 0;
    state.answers = [];
    state.startedAt = Date.now();
    showView("question");
    renderQuestion();
  });

  $("mini-diag-next").addEventListener("click", nextStep);

  $("mini-diag-register").addEventListener("click", function () {
    track("register-click", { source: "diagnostic_result" });
  });
})();
