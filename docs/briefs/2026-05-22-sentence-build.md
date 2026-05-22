# BRIEF: Sentence-build oikea tehtävä v279

**Päivä:** 2026-05-22
**Versio:** v279
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v277/v278 sidebar-työn jälkeen — ei tiukkaa riippuvuutta, mutta brand-tokenit (v276) hyvä olla mainissa
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + TESTING (webapp-testing, superpowers:test-driven-development, superpowers:verification-before-completion). Kutsu Skill-toolia aidosti.

---

## Tavoite

Rakentaa OIKEA sentence-build-tehtävä, ei vain otsikon vaihto. v241 nimettiin "Lauseiden rakentelua" → "Käännä lauseet" ilman mekaniikkaa. Tällä briefillä toteutetaan token-järjestys-vuorovaikutus: scrambled-sanat → käyttäjä järjestää oikeaan järjestykseen → submit → grading → feedback.

Backend on jo olemassa: `routes/exercises.js` `/reorder` -endpoint palauttaa `scrambled[]` + `correct[]` + `finnishHint` + `explanation`. Tämä brief on **vain frontend**.

---

## Konteksti

Backend-payload nyt (`/reorder` POST `{ level, count, language }` → response):
```json
{
  "exercises": [
    {
      "id": 1,
      "type": "reorder",
      "finnishHint": "En pidä kylmästä vedestä.",
      "scrambled": ["gusta", "fría", "el", "no", "me", "agua"],
      "correct": ["No", "me", "gusta", "el", "agua", "fría"],
      "explanation": "No me gusta + artikkeli + substantiivi + adjektiivi..."
    }
  ]
}
```

Käyttäjäpolku:
1. Käyttäjä avaa mode-screen, valitsee "Käännä lauseet" (tai vastaava CTA)
2. Frontend fetchaa `/reorder` → näyttää ensimmäisen exercise:n
3. Tokens näytetään scrambled-järjestyksessä klikattavina chipeinä
4. Käyttäjä klikkaa tokenia → token siirtyy "answer area" -alueeseen järjestyksessä
5. Vahingossa klikatun voi peruuttaa klikkaamalla sitä answer area:ssa → palaa token-poolin viimeiseksi
6. Kun answer area on täynnä (kaikki tokens) → submit-nappi aktivoituu
7. Submit → vertaa answer-arrayn ja `correct`-arrayn → näytä oikein/väärin + selitys
8. "Seuraava" → ladaa seuraava exercise
9. Lopuksi: yhteenveto + paluu mode-näyttöön

EI drag-and-drop -mekaniikkaa (mobile-rikkoinen, kompleksinen). **Click-to-add + click-to-remove** on luotettavampi ja toimii mobiilissa.

---

## Toteutus

### Step 1: HTML-template app.html:ään

Etsi sopiva paikka (`<div id="screen-sentence-build" class="screen" hidden>` tai vastaava screen-konventio):

```html
<section id="screen-sentence-build" class="screen" hidden>
  <header class="exercise-header">
    <button class="btn-back" data-action="back-to-mode" aria-label="Takaisin">←</button>
    <div class="exercise-progress">
      <span class="exercise-progress__current" id="sb-current">1</span>
      <span class="exercise-progress__total"> / <span id="sb-total">10</span></span>
    </div>
  </header>

  <div class="exercise-body">
    <p class="exercise-hint" id="sb-hint">…</p>

    <div class="sb-answer-area" id="sb-answer-area" aria-label="Vastauksesi" role="list"></div>
    <div class="sb-token-pool" id="sb-token-pool" aria-label="Saatavilla olevat sanat" role="list"></div>

    <div class="exercise-actions">
      <button class="btn btn--ghost" id="sb-reset" type="button">Tyhjennä</button>
      <button class="btn btn--primary" id="sb-submit" type="button" disabled>Tarkista</button>
    </div>

    <div class="sb-feedback" id="sb-feedback" hidden>
      <p class="sb-feedback__verdict" id="sb-verdict"></p>
      <p class="sb-feedback__correct" id="sb-correct" hidden>Oikein: <span id="sb-correct-text"></span></p>
      <p class="sb-feedback__explain" id="sb-explain"></p>
      <button class="btn btn--primary" id="sb-next" type="button">Seuraava →</button>
    </div>
  </div>
</section>
```

Käytä semanttisia luokkanimiä, ei `display--serif` -tyyppisiä mystisiä.

### Step 2: CSS — uusi `css/sentence-build.css`

```css
.exercise-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}
.exercise-progress {
  margin-left: auto;
  font-size: 14px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.exercise-body { max-width: 720px; margin: 0 auto; }

.exercise-hint {
  font-size: 18px;
  line-height: 1.5;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.sb-answer-area {
  min-height: 64px;
  padding: 12px;
  border: 2px dashed var(--border-soft);
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}
.sb-answer-area:empty::before {
  content: "Klikkaa sanoja alta järjestääksesi lauseen.";
  color: var(--text-muted);
  font-size: 14px;
  align-self: center;
}

.sb-token-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.sb-token {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  min-height: 44px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  cursor: pointer;
  transition: background 120ms ease-out, transform 100ms ease-out;
}
.sb-token:hover { background: var(--brand-brick-soft); }
.sb-token:active { transform: scale(0.97); }
.sb-token:focus-visible {
  outline: 2px solid var(--brand-brick);
  outline-offset: 2px;
}
.sb-token--used {
  opacity: 0.35;
  pointer-events: none;
  text-decoration: line-through;
}

.exercise-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.sb-feedback {
  margin-top: 24px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 12px;
}
.sb-feedback__verdict {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px;
}
.sb-feedback__verdict[data-correct="true"] { color: oklch(40% 0.12 145); /* green */ }
.sb-feedback__verdict[data-correct="false"] { color: var(--brand-brick); }
.sb-feedback__correct {
  font-family: var(--font-display, "Fraunces"), Georgia, serif;
  font-size: 20px;
  margin: 0 0 12px;
  /* No italic — direct readable answer */
}
.sb-feedback__explain {
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 16px;
}

@media (max-width: 768px) {
  .sb-token { padding: 12px 14px; font-size: 17px; }   /* slightly bigger touch */
  .exercise-actions { flex-direction: column-reverse; }
  .exercise-actions .btn { width: 100%; }
}
```

### Step 3: Screen-controller `js/screens/sentenceBuild.js`

```js
import { fetchReorderExercises, submitGrade } from "../api/exercises.js";  // tai vastaava
import { setSidebarMode } from "../components/sidebarShell.js";

const state = {
  exercises: [],
  currentIndex: 0,
  answer: [],          // ordered tokens user has picked
  pool: [],            // remaining scrambled tokens with state
  submitted: false,
};

function $(id) { return document.getElementById(id); }

export async function openSentenceBuild({ level = "B", count = 8, language = "spanish" }) {
  document.querySelectorAll(".screen").forEach(s => s.hidden = true);
  $("screen-sentence-build").hidden = false;
  setSidebarMode("mode", { /* … */ });

  state.exercises = await fetchReorderExercises({ level, count, language });
  state.currentIndex = 0;
  renderCurrent();
}

function renderCurrent() {
  const ex = state.exercises[state.currentIndex];
  if (!ex) return finishSession();
  state.answer = [];
  state.pool = ex.scrambled.map((text, i) => ({ id: i, text, used: false }));
  state.submitted = false;

  $("sb-current").textContent = state.currentIndex + 1;
  $("sb-total").textContent = state.exercises.length;
  $("sb-hint").textContent = ex.finnishHint;
  $("sb-feedback").hidden = true;
  $("sb-submit").disabled = true;

  renderPool();
  renderAnswer();
}

function renderPool() {
  const el = $("sb-token-pool");
  el.innerHTML = "";
  for (const tok of state.pool) {
    const btn = document.createElement("button");
    btn.className = "sb-token";
    if (tok.used) btn.classList.add("sb-token--used");
    btn.textContent = tok.text;
    btn.type = "button";
    btn.setAttribute("aria-pressed", tok.used);
    btn.addEventListener("click", () => addToAnswer(tok.id));
    el.appendChild(btn);
  }
}

function renderAnswer() {
  const el = $("sb-answer-area");
  el.innerHTML = "";
  for (const idx of state.answer) {
    const tok = state.pool[idx];
    const btn = document.createElement("button");
    btn.className = "sb-token";
    btn.textContent = tok.text;
    btn.type = "button";
    btn.setAttribute("aria-label", `Poista sana ${tok.text}`);
    btn.addEventListener("click", () => removeFromAnswer(idx));
    el.appendChild(btn);
  }
  $("sb-submit").disabled = state.answer.length !== state.pool.length;
}

function addToAnswer(tokenId) {
  if (state.submitted) return;
  if (state.pool[tokenId].used) return;
  state.pool[tokenId].used = true;
  state.answer.push(tokenId);
  renderPool();
  renderAnswer();
}

function removeFromAnswer(tokenId) {
  if (state.submitted) return;
  state.answer = state.answer.filter(id => id !== tokenId);
  state.pool[tokenId].used = false;
  renderPool();
  renderAnswer();
}

function reset() {
  state.answer = [];
  state.pool.forEach(t => t.used = false);
  renderPool();
  renderAnswer();
}

async function submit() {
  if (state.submitted) return;
  state.submitted = true;
  const ex = state.exercises[state.currentIndex];
  const userAnswer = state.answer.map(id => state.pool[id].text);
  const isCorrect = arraysEqual(userAnswer, ex.correct);

  // Lokal grading (correct array on payloadissa). Voit myös post-grade-advisory.
  showFeedback({
    correct: isCorrect,
    correctText: ex.correct.join(" "),
    userText: userAnswer.join(" "),
    explanation: ex.explanation,
  });

  // Log progress (fire-and-forget)
  submitGrade({
    type: "reorder",
    exerciseId: ex.id,
    correct: isCorrect ? 1 : 0,
    total: 1,
  }).catch(() => {});
}

function showFeedback({ correct, correctText, userText, explanation }) {
  $("sb-feedback").hidden = false;
  $("sb-verdict").textContent = correct ? "Oikein!" : "Ei aivan.";
  $("sb-verdict").dataset.correct = String(correct);
  $("sb-correct").hidden = correct;
  $("sb-correct-text").textContent = correctText;
  $("sb-explain").textContent = explanation;
  $("sb-submit").disabled = true;
}

function nextExercise() {
  state.currentIndex++;
  if (state.currentIndex >= state.exercises.length) return finishSession();
  renderCurrent();
}

function finishSession() {
  // Yksinkertainen palaute: alert tai navigoi mode-näyttöön. Kannattaa
  // näyttää yhteenveto: X/Y oikein. Tässä vaiheessa minimi:
  document.querySelectorAll(".screen").forEach(s => s.hidden = true);
  // Avaa mode-screen tai dashboard.
  window.location.hash = "#/sanasto";  // tai vastaava paluu
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

// Wire DOM
document.addEventListener("DOMContentLoaded", () => {
  $("sb-reset")?.addEventListener("click", reset);
  $("sb-submit")?.addEventListener("click", submit);
  $("sb-next")?.addEventListener("click", nextExercise);
  document.addEventListener("click", (e) => {
    const back = e.target.closest("[data-action='back-to-mode']");
    if (back) finishSession();
  });
});
```

Käytä olemassa olevaa `js/api/exercises.js` (tai vastaava) — jos sellaista ei ole, lisää fetch-wrapper sinne. **Älä rakenna uutta fetch-wrapperia** tähän tiedostoon, kierrätä yleinen.

### Step 4: Mode-routing

Etsi js/screens/sanasto.js tai vastaava mode-näyttö joka tarjoaa exercise-vaihtoehdot. Lisää nappi/kortti:
```html
<button class="exercise-type-card" data-action="open-sentence-build">
  <span class="exercise-type-card__title">Käännä lauseet</span>
  <span class="exercise-type-card__desc">Järjestä sanat oikeaan järjestykseen</span>
</button>
```

Click-handler:
```js
import { openSentenceBuild } from "./sentenceBuild.js";
// ...
if (action === "open-sentence-build") {
  openSentenceBuild({ level: currentLevel, count: 8, language: currentLanguage });
}
```

---

## Verifiointi

1. **Playwright happy-path** `tests/e2e/sentence-build.spec.js`:
   - Kirjaudu testpro123
   - Avaa Sanasto-mode
   - Klikkaa "Käännä lauseet"
   - Odota että `#sb-token-pool > button` -elementtejä on ≥ 4
   - Klikkaa tokenit järjestyksessä (väärin tahallaan), submit → näe "Ei aivan."
   - Klikkaa "Seuraava" → toinen exercise lautuu
2. **Mobile (375px):** napit ovat 44px tai isompia, ei horisontaali-scrollia
3. **Tab-navigaatio:** tokens ovat focusable, Enter aktivoi
4. **AI-slop-check:**
   - [ ] Ei italic-Fraunces missään muualla kuin `.sb-feedback__correct`:ssa (oikea vastaus, Fraunces lukea ammattilaisesti — EI italic edes siellä, koodissa määritelty)
   - [ ] Ei em-dashia palautteissa ("Ei aivan." ei dash)
   - [ ] Focus-statet näkyvät brick-värillä
   - [ ] Empty-state answer-areassa tekstinä (ei tyhjä div)
5. **`npm run build`** + **`npm test`** PASS
6. **`sw.js` CACHE_VERSION** bumpattu

---

## Commit + PR

- **3 commitia 1 PR:**
  - `feat(sentence-build): HTML + CSS + screen controller (v279)`
  - `feat(sentence-build): mode-screen integration` — napin lisäys mode-screeniin
  - `test(sentence-build): playwright happy-path`
- Otsikko: `feat: sentence-build oikea tehtävä v279`
- IMPROVEMENTS.md-rivi: `v279 — feat: sentence-build click-to-order -mekaniikka (token-pool + answer-area + grading)`

**Ei pushia ilman lupaa.**

---

## Don't

- ÄLÄ rakenna drag-and-drop -mekaniikkaa — click-to-add toimii mobiilissa, drag rikkoutuu
- ÄLÄ käytä native HTML5 dragstart/drop -eventejä — mobile flaky
- ÄLÄ generoi exercise:ja frontend-puolella — käytä `/reorder`-endpointtia
- ÄLÄ rakenna sub-grading-logiikkaa (osittain oikein) tähän versioon — exact match riittää, tai post-grade-advisory backendillä
- ÄLÄ käytä em-dashia palautteissa
- ÄLÄ tee Vercel-promotea — visuaalinen muutos, Marcel tarkistaa
- ÄLÄ käytä `display--serif` -luokkaa joka ei ole määritelty (v275:ssa kysytty)

## Onnistuminen

- [ ] HTML-rakenne lisätty `app.html`:ään
- [ ] `css/sentence-build.css` luotu, ladattu app.html:ään
- [ ] `js/screens/sentenceBuild.js` luotu
- [ ] Token-pool + answer-area toimii (click-to-add + click-to-remove)
- [ ] Submit toimii, feedback näkyy oikein/väärin + selitys
- [ ] Seuraava-nappi etenee, finishSession palaa mode-näyttöön
- [ ] Mobile-touch-target ≥ 44px
- [ ] Focus-state näkyy brick-värillä
- [ ] Playwright happy-path PASS
- [ ] `npm run build` + `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu
- [ ] 3 commitia, IMPROVEMENTS.md-rivi
- [ ] PR avattu, EI mergattu
