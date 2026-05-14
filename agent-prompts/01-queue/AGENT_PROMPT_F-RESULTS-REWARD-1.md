# F-RESULTS-REWARD-1 — Lesson-results redesign: palkitseva sankarivaihe

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` ENNEN kaikkea muuta. Tämä on **FRONTEND + EXERCISE** -loop — kutsu KAIKKIEN luokkien skillit.

---

## 1. Konteksti

Käyttäjä suorittaa oppitunnin → `js/screens/lessonResults.js` näyttää tuloksen. Nykyinen näkymä on funktionaalinen mutta laimea — pisteet, "next lesson", ei palkitsevaa loppuhuipennusta. Yksi tärkeimmistä koukuista oppitunnin lopussa: jos siinä ei ole "yes!"-tunnetta, käyttäjä ei tee toista lessonia heti.

**Mitä halutaan:** lessonResults-näkymä joka tuntuu **palkinnolta**, ei kuittilta. Sankari-elementti (confetti / score-reveal), trend-sparkline (tämän kurssin viimeiset 5 lessonia → näkyvä taso-kehitys), strong "Seuraava oppitunti" CTA, ja metakognitiivinen reflektio-kysymys (1 lause, lähde `metacognitive-prompt-library`).

**Reunaehto:** ei manipulatiivinen. Ei väärää statsia. Ei "85% käyttäjistä paransi" -mielikuvaa. Vain käyttäjän oikea data, esitetty palkitsevasti.

---

## 2. Mitä tämä loop EI tee

- ❌ ÄLÄ koske grading-logiikkaan (pisteet lasketaan ennallaan)
- ❌ ÄLÄ rakenna achievement-/badge-systemiä — vain results-näkymä
- ❌ ÄLÄ lisää share-toimintoja tähän looppiin (tulee myöhemmin omana brieffinä)
- ❌ ÄLÄ keksi numeroita ("yli 80 % kysymyksistä oikein keskimäärin") — vain tämän käyttäjän data
- ❌ ÄLÄ lisää uusia kirjastoja (ei `canvas-confetti`-pakettia — kirjoita minimal vanilla)

---

## 3. Skill-set (PAKOLLINEN)

### FRONTEND-stack
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`
- `puheo-screen-template`
- `puheo-finnish-voice`
- `emil-design-eng` *(motion polish — ehdoton tämän looppin "wow"-vaihetta varten)*

### EXERCISE-stack
- `practice-problem-sequence-designer`
- `retrieval-practice-generator`
- `cognitive-load-analyser` *(älä ylikuormita — sankariruutu = max 4 elementtiä)*
- `criterion-referenced-rubric-generator` *(jos näytetään pistemurros)*
- `puheo-finnish-voice`

### Education (lisä)
- `metacognitive-prompt-library` — reflektio-prompti
- `self-efficacy-builder-sequence` — sanoma-tone matalalla tuloksella ("tämä oli vaikea taso — hyvin yritetty" vs "loistava!")
- `feedback-quality-analyser` — auditoi automaattinen sanoma

### 21st.dev-sourcing
1. **Result / score card sankarivaihe** — 21st.dev/s/result, 21st.dev/s/score, 21st.dev/s/celebration
2. **Sparkline / trend** — 21st.dev/s/sparkline, 21st.dev/s/chart
3. **Big CTA + secondary** — 21st.dev/s/cta, 21st.dev/s/button-group
4. **Confetti / particle reveal** — 21st.dev/s/confetti (poimi vanilla-CSS-pohjainen, ei React-deps)

Linear, Stripe, Cal.com, Spotify Wrapped -tasoa. Screenshot 2+ → `references/app/results/21stdev/`. Cite URLs.

---

## 4. UX-rakenne

### Sankarivaihe (top-half)
- Iso score-luku center-stage (esim. `87 %`), animoitu count-up 600 ms `cubic-bezier(.2, .8, .2, 1)`
- Yläpuolella: tähän käyttäjälle tähän tilanteeseen sopiva headline (lähde `puheo-finnish-voice`):
  - ≥80 %: "Mainio suoritus."
  - 60-79 %: "Hyvää työtä."
  - 40-59 %: "Joitakin kohtia jäi auki — katsotaan ne."
  - <40 %: "Vaikea aihe. Otetaan toinen kierros." (älä shame — `self-efficacy-builder-sequence`)
- Confetti VAIN ≥80 %, vanilla CSS-keyframe (`transform: translateY` + `opacity`), 1.2 s, `prefers-reduced-motion: reduce` → ei mitään
- Alapuolella: pieni "X / Y oikein · ~Z s/kysymys"

### Trend-strip (middle)
- Sparkline tämän kurssin viimeiset 5 lessonia (jos < 5, näytä mitä on)
- Y-akseli skaala: 0-100, ei merkitty
- Viimeisin piste = täytetty + label "Tämä lesson"
- Aiemmat pisteet = ohuita
- Jos on **3 peräkkäin nouseva trendi** → micro-rivi: "Kolmas peräkkäinen parannus." (ei muuten näytetä)

### Reflection-prompti (lower middle)
- Yksi laatikko + 1 metakognitiivinen kysymys (vaihtelee, lähde `metacognitive-prompt-library`):
  - "Mikä yksi juttu tästä lessonista jäi mieleen?"
  - "Mikä tuntui hankalimmalta? Miksi?"
  - "Miten käyttäisit tämän oppitunnin sanaston spontaanissa puheessa?"
- Vapaaehtoinen textarea (max 240 merkkiä), tallennetaan `lesson_reflections`-tauluun jos käyttäjä kirjoittaa. Tyhjä = skip, ei guilt-trip.
- ÄLÄ pisteyttää tätä, älä lähetä AI:lle — pelkkä omistus käyttäjälle, näkyy myöhemmin profiilin "muistiinpanot"-listalla (out-of-scope tässä loopissa, vain talleta)

### CTA-row (bottom)
- **Pää:** "Seuraava oppitunti →" (iso, accent-väri) — autofocus
- **Sec:** "Takaisin kurssiin" (ohut, neutral)
- Optional tertiary jos käyttäjä teki <60 %: "Toista tämä oppitunti" (ohut, alleviivattu)

---

## 5. Tekniset vaateet

### Datamalli (Supabase) — vain reflection
**Käytä MCP:tä — `mcp__claude_ai_Supabase__apply_migration`.**

```sql
CREATE TABLE IF NOT EXISTS lesson_reflections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE lesson_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own reflections" ON lesson_reflections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Backend
- `POST /api/lessons/reflection` body `{ lesson_id, text }` → tallenna jos `text.trim().length > 0`
- `GET /api/lessons/recent-scores?course_id=X&limit=5` — palauttaa viimeiset N pistettä spark-lineä varten

### Frontend
- Refaktoroi `js/screens/lessonResults.js`
- Uusi CSS `css/lesson-results.css` (jos vanha on, korvaa)
- Sparkline: vanilla SVG `<polyline>`, ei kirjastoa
- Count-up: `requestAnimationFrame`-loop, ease-out
- Confetti: ~30 absolutely-positioned span:ia, jokainen oma `animation-delay` ja `transform`-end. Vanilla CSS-keyframe.

### Reduced motion
- `@media (prefers-reduced-motion: reduce)` → ei count-up:ia, ei confettia, ei sparkline-piirto-animaatiota — kaikki näkyy heti.

---

## 6. Verifiointi

> **Ennen committia: aja `_UI_UX_CHECKLIST.md` läpi.** Kaikki priority 1–7 OK tai N/A.

Erityishuomiot:
- **Sparkline a11y**: SVG `role="img"` + `aria-label="Pistekehitys 5 viime oppituntina: 65, 72, 70, 78, 87 prosenttia"` (todelliset luvut)
- **Confetti**: oma kontti `position: fixed`, `pointer-events: none`, `z-index: var(--z-confetti)` (60), ei maskaa CTA:ta
- **Count-up + screen reader**: animoituvan numeron span `aria-hidden="true"`, erillinen `aria-live="polite"` -span lopullisella arvolla
- **Reflection-textarea**: char-counter näkyviin `0 / 240`, virhe-tila kun ylitetään
- **Headline ei vain väri-indikaattori**: ikoni (Lucide `Sparkles`/`ThumbsUp`/`Lightbulb` per tila) ennen otsikkoa
- **Sec/Tertiary CTA:t**: alleviivaus tai border, ei pelkkä väri-ero
- SVG-ikonit Lucide-setistä (ei emoji)

1. **Migraatio MCP:llä ajettu.** 
2. **Playwright e2e:**
   - kirjautuminen → suorita lesson (mock-pisteet 90 %) → tarkista confetti + count-up käynnistyy
   - sama 50 % pisteillä → ei confettia, oikea headline, "Toista tämä" -CTA näkyy
   - reflection-textarean täyttö → POST `/api/lessons/reflection` → DB:ssä rivi
3. **axe-core 0 violations** @ 1440 + 375.
4. `design-taste-frontend` review screenshoteista — confetti ei saa olla "loud", trendviiva ei meinaa kaupalliselta.
5. `emil-design-eng` motion review: animaatioiden ajoitus tuntuu polished, ei "spring-too-much".
6. SW-bumppi.
7. IMPROVEMENTS.md-rivi.

---

## 7. Lopputuotteen kriteeri

Käyttäjä päättää oppitunnin ja tuntee yhdessä silmänräpäyksessä: "Ah, tein hyvää työtä." TAI "OK, tämä oli vaikea, mutta minua ei häpäistä." Sparkline näyttää aidon kehityksen. Yksi metakognitiivinen kysymys herättää mietteitä. "Seuraava oppitunti" -nappi on iso ja kutsuva. Käyttäjä klikkaa sitä useammin kuin "takaisin".
