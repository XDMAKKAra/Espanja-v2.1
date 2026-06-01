/* Puheo landing — anonymous live writing demo (L-V332).
   Lets a logged-out visitor write 1-3 sentences in es/fr/de and get one
   slim YTL-style grade inline. One grade per device per day:
   - server enforces the real limit (demoGradeLimiter, per IP);
   - localStorage (puheo_demo_tried_v1) keeps the result visible on return
     and avoids a wasted request.
   Vanilla, idempotent, bails out if the markup is missing. */
(function () {
  if (typeof document === "undefined") return;

  var MIN = 80;
  var MAX = 200;
  var STORE_KEY = "puheo_demo_tried_v1";

  var PROMPTS = {
    es: "Kirjoita 1-3 lausetta espanjaksi: kerro mitä teit viime kesälomalla.",
    fr: "Kirjoita 1-3 lausetta ranskaksi: kerro mitä teit viime kesälomalla.",
    de: "Kirjoita 1-3 lausetta saksaksi: kerro mitä teit viime kesälomalla.",
  };
  var PLACEHOLDERS = {
    es: "Ayer fui a la playa con mi familia…",
    fr: "Cet été, je suis allé chez mes grands-parents…",
    de: "Letzten Sommer war ich mit Freunden am See…",
  };

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeStore(obj) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) { /* private mode */ }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function init() {
    var card = document.querySelector("[data-demo]");
    if (!card) return;
    var form = card.querySelector("[data-demo-form]");
    var input = card.querySelector("[data-demo-input]");
    var promptLabel = card.querySelector("[data-demo-prompt]");
    var count = card.querySelector("[data-demo-count]");
    var hint = card.querySelector("[data-demo-hint]");
    var submit = card.querySelector("[data-demo-submit]");
    var result = card.querySelector("[data-demo-result]");
    var tabs = Array.prototype.slice.call(card.querySelectorAll(".kokeile__lang-btn"));
    if (!form || !input || !submit || !result) return;

    var lang = card.getAttribute("data-lang") || "es";

    // ── Result rendering ──────────────────────────────────────────────
    function renderResult(data) {
      result.innerHTML = "";

      var head = el("div", "kokeile__result-head");
      var max = data.scoreMax || 18;
      head.appendChild(el("span", "kokeile__score", data.score + " / " + max));
      head.appendChild(el("span", "kokeile__score-label", "viestinnällisyys"));
      result.appendChild(head);

      var errors = Array.isArray(data.errors) ? data.errors : [];
      if (errors.length) {
        var list = el("ul", "kokeile__errors");
        errors.forEach(function (e) {
          var li = el("li", "kokeile__error");
          if (e.excerpt) {
            var ex = el("span", "kokeile__error-excerpt", e.excerpt);
            li.appendChild(ex);
          }
          if (e.corrected) {
            li.appendChild(el("span", "kokeile__error-arrow", "→"));
            li.appendChild(el("span", "kokeile__error-fix", e.corrected));
          }
          if (e.explanation_fi) {
            li.appendChild(el("p", "kokeile__error-why", e.explanation_fi));
          }
          list.appendChild(li);
        });
        result.appendChild(list);
      }

      result.appendChild(el("p", "kokeile__result-foot",
        "Tämä on yksi näyte. Täyden arvioinnin saat ilmaisella tilillä."));

      var cta = el("a", "btn btn--primary kokeile__cta", "Aloita ilmaiseksi");
      cta.setAttribute("href", "/app.html#rekisteroidy");
      result.appendChild(cta);

      result.removeAttribute("hidden");
    }

    function renderError(msg, withCta) {
      result.innerHTML = "";
      result.appendChild(el("p", "kokeile__result-error", msg));
      if (withCta) {
        var cta = el("a", "btn btn--primary kokeile__cta", "Aloita ilmaiseksi");
        cta.setAttribute("href", "/app.html#rekisteroidy");
        result.appendChild(cta);
      }
      result.removeAttribute("hidden");
    }

    function renderSkeleton() {
      result.innerHTML = "";
      var sk = el("div", "kokeile__skeleton");
      sk.setAttribute("aria-label", "Arvioidaan kirjoitusta");
      for (var i = 0; i < 4; i++) sk.appendChild(el("span", "kokeile__skeleton-bar"));
      result.appendChild(sk);
      result.removeAttribute("hidden");
    }

    function lockForm() {
      input.setAttribute("disabled", "");
      submit.setAttribute("disabled", "");
      tabs.forEach(function (t) { t.setAttribute("disabled", ""); });
      form.classList.add("kokeile__form--done");
    }

    // ── Already used on this device → show the stored grade + CTA ──────
    var prior = readStore();
    if (prior && prior.result) {
      lockForm();
      renderResult(prior.result);
    }

    // ── Char counter + min-length gate ────────────────────────────────
    function updateCount() {
      var len = input.value.trim().length;
      count.textContent = input.value.length + " / " + MAX + " merkkiä";
      if (len >= MIN) {
        submit.removeAttribute("disabled");
        hint.textContent = "Valmis arvioitavaksi";
        hint.classList.add("kokeile__hint--ok");
      } else {
        submit.setAttribute("disabled", "");
        hint.textContent = "Vähintään " + MIN + " merkkiä (vielä " + (MIN - len) + ")";
        hint.classList.remove("kokeile__hint--ok");
      }
    }
    input.addEventListener("input", updateCount);

    // ── Language switch ───────────────────────────────────────────────
    function setLang(next, focusTab) {
      if (!next || !PROMPTS[next]) return;
      lang = next;
      card.setAttribute("data-lang", next);
      promptLabel.textContent = PROMPTS[next];
      input.setAttribute("placeholder", PLACEHOLDERS[next] || "");
      tabs.forEach(function (t) {
        var match = t.dataset.lang === next;
        t.setAttribute("aria-selected", match ? "true" : "false");
        t.setAttribute("tabindex", match ? "0" : "-1");
        if (match && focusTab) t.focus();
      });
    }
    tabs.forEach(function (tab, idx) {
      tab.addEventListener("click", function () { setLang(tab.dataset.lang); });
      tab.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = (idx + 1) % tabs.length;
        else if (e.key === "ArrowLeft") n = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); setLang(tabs[n].dataset.lang, true); }
      });
    });

    // ── Submit ────────────────────────────────────────────────────────
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (text.length < MIN) { updateCount(); return; }

      submit.setAttribute("disabled", "");
      submit.classList.add("is-loading");
      renderSkeleton();

      fetch("/api/writing/demo-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: lang, text: text }),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { status: res.status, body: body };
          });
        })
        .then(function (r) {
          submit.classList.remove("is-loading");
          if (r.status === 200 && r.body && typeof r.body.score === "number") {
            renderResult(r.body);
            lockForm();
            writeStore({ lang: lang, result: r.body });
            return;
          }
          if (r.status === 429) {
            renderError(
              (r.body && r.body.error) ||
              "Olet jo kokeillut tänään. Tee oma tili niin saat arvioinnit rajattomasti.",
              true);
            lockForm();
            return;
          }
          if (r.status === 400) {
            renderError((r.body && r.body.error) ||
              "Kirjoita vähintään 80 merkkiä, niin arvio on luotettava.", false);
            submit.removeAttribute("disabled");
            return;
          }
          renderError(
            "Arviointi ei nyt onnistunut. Kokeile hetken päästä uudelleen tai tee tili.", true);
          submit.removeAttribute("disabled");
        })
        .catch(function () {
          submit.classList.remove("is-loading");
          renderError(
            "Arviointi ei nyt onnistunut. Kokeile hetken päästä uudelleen tai tee tili.", true);
          submit.removeAttribute("disabled");
        });
    });

    // Initial paint
    setLang(lang);
    updateCount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
