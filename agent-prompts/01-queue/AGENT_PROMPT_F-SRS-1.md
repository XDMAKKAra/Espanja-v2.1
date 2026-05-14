# F-SRS-1 — Sanasto-SRS oma näkymä (Anki-tyyppinen flashcard-deck virheistä)

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` ENNEN kaikkea muuta. Tämä on **FRONTEND + EXERCISE + SUPABASE** -loop — kutsu KAIKKIEN kolmen luokan skill-stack.

---

## 1. Konteksti

Käyttäjä tekee sanasto-, kielioppi- ja kirjoitustehtäviä ja kerää virheitä. Tällä hetkellä virheitä ei kerätä mihinkään, eikä käyttäjä voi palata niihin. Retrieval on hajautettu lessonien sisään, ei systemaattista uusintaa.

**Mitä halutaan:** oma `#screen-srs`-näkymä, jossa käyttäjä näkee päivän SRS-pinon (kortit jotka FSRS-algoritmi nostaa esiin tänään), tekee ne, ja näkee progress. Kortit luodaan automaattisesti, kun käyttäjä tekee virheen missä tahansa exercise-tyypissä.

**Kohdetuntuma:** ohut Anki-klooni Linear-tier-estetiikalla. Ei gamifioitu, ei loud. Kortin etu/kääntö, 4 nappia (`En osaa` / `Vaikea` / `Hyvä` / `Helppo`), seuraava kortti. Minimalistinen.

---

## 2. Mitä tämä loop EI tee

- ❌ ÄLÄ kirjoita omaa SRS-algoritmiä — käytä `ts-fsrs`-paketin korvaajana **vanilla-FSRS-pseudokoodi** (alla §5). Ei uusia npm-paketteja.
- ❌ ÄLÄ koske lesson-runner-flowhun muuten kuin lisäämällä "tallenna kortti SRS:ään" -kutsu virheen yhteyteen
- ❌ ÄLÄ tee kortteja ELI:lle (Espanja Lyhyt/Long Immersion) -mainoksiksi tai gamifikaatioiksi
- ❌ ÄLÄ rakenna manuaalista "lisää kortti" -UI:ta — kortit luodaan vain virheistä automaattisesti
- ❌ ÄLÄ lisää uusia animation/UI-kirjastoja

---

## 3. Skill-set (PAKOLLINEN — kutsu Skill-toolilla)

### FRONTEND-stack
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`
- `puheo-screen-template`
- `puheo-finnish-voice`

### EXERCISE-stack
- `practice-problem-sequence-designer`
- `retrieval-practice-generator`
- `spaced-practice-scheduler` *(jos saatavilla — muuten skip)*
- `cognitive-load-analyser`
- `adaptive-hint-sequence-designer`

### Education (lisä)
- `error-analysis-protocol` — kortin "miksi tämä on virhe" -takaosa
- `metacognitive-prompt-library` — "Mitä muistat tästä?" -prompt itse-kysymykseen ennen flippiä

### SUPABASE-stack
- `supabase`
- `supabase-postgres-best-practices`

### 21st.dev-sourcing (PAKOLLINEN — hae 2+ referenssiä per komponentti)
1. **Flashcard / flip-card** — 21st.dev/s/flashcard, 21st.dev/s/flip-card
2. **Rating-buttons (4-step difficulty)** — 21st.dev/s/segmented-control, 21st.dev/s/rating
3. **Empty-state SRS** — 21st.dev/s/empty-state (kun pino on tyhjä = "Tänään tehty, palaa huomenna")
4. **Day-streak / pino-progress** — 21st.dev/s/progress, 21st.dev/s/stepper

Fallback-järjestys: Magic UI → shadcn → Aceternity → Tailwind UI free. Screenshot → `references/app/srs/21stdev/`. Cite EXACT URL IMPROVEMENTS.md-rivissä.

---

## 4. UX-rakenne

### Reitti
`#screen-home` → uusi "Toista virheet" -kortti home-railiin → klikkaus → `#screen-srs`. Lisäksi sidenavissa "Toistot" -kohta.

### `#screen-srs` -näkymä
**Topbar:** "Tänään: X / Y", takaisin-nappi, streak-pieni (jos käyttäjä haluaa motivaatiota; pidä neutraalina).

**Card-pino-tila:**
- Iso flip-card center-stage (max-width 560 px)
- Etu: kysymys (esim. `"el coche"` tai cloze `"Yo ___ (ir) al cine ayer"`)
- Kääntö: vastaus + alkuperäisen virheen konteksti + "miksi" -mini-selitys (1-2 lausetta, lähde `error-analysis-protocol`)
- 4 nappia: **En osaa** (punainen ohut) · **Vaikea** (kellertävä) · **Hyvä** (default-aksentti) · **Helppo** (ohut ääriviiva)
- Keyboard: 1-4 mapataan 4 nappiin, Space = flip

**Tyhjä tila:**
- "Et ole vielä virheillyt." (huumorin sijaan neutraali) → CTA "Aloita oppitunti"
- Tai jos ei tänään tehtävää: "Tänään tehty. Palaa huomenna." + näytä mitä kortteja huomenna nousee

---

## 5. Tekniset vaateet

### Datamalli (Supabase)
**Käytä MCP:tä — `mcp__claude_ai_Supabase__apply_migration`. ÄLÄ jätä SQL ACTION REQUIRED:iin (per feedback memory).**

```sql
CREATE TABLE IF NOT EXISTS srs_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lang            TEXT NOT NULL,                  -- 'es' | 'de' | 'fr'
  card_type       TEXT NOT NULL,                  -- 'vocab' | 'grammar' | 'cloze'
  front           TEXT NOT NULL,
  back            TEXT NOT NULL,
  context         TEXT,                           -- alkuperäinen lause
  source          TEXT,                           -- 'vocab' | 'grammar' | 'writing' | 'reading'
  -- FSRS-state
  difficulty      REAL NOT NULL DEFAULT 5.0,
  stability       REAL NOT NULL DEFAULT 1.0,
  reps            INT NOT NULL DEFAULT 0,
  lapses          INT NOT NULL DEFAULT 0,
  state           TEXT NOT NULL DEFAULT 'new',    -- 'new' | 'learning' | 'review' | 'relearning'
  due_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_review_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS srs_cards_user_due ON srs_cards (user_id, due_at) WHERE state != 'suspended';
CREATE INDEX IF NOT EXISTS srs_cards_user_front ON srs_cards (user_id, lang, front);

ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own srs cards" ON srs_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Backend
- `routes/srs.js` (uusi):
  - `GET  /api/srs/today` — palauttaa korttipinon `due_at <= now()` order by `due_at`, max 30
  - `POST /api/srs/review` — body: `{ card_id, rating: 1|2|3|4 }` → laskee FSRS-päivityksen ja tallentaa
  - `POST /api/srs/cards` — body: `{ lang, card_type, front, back, context, source }` → idempotentti dedup `(user_id, lang, front)`
- Mounttaa `server.js`:ssä `app.use('/api/srs', requireAuth, srsRouter)`.

### FSRS-pseudo (yksinkertaistettu)
Pidä omassa `lib/fsrs.js`-modulissa. Standardi parametrit:

```javascript
const W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];
const REQUEST_RETENTION = 0.9;
const FACTOR = 19 / 81;
const DECAY = -0.5;

export function nextState(card, rating) {
  // rating: 1=Again, 2=Hard, 3=Good, 4=Easy
  // Palauttaa: { difficulty, stability, state, due_at, reps, lapses }
  // Standardi FSRS-4.5 -kaava. Toteuta vanilla JS:llä, ei kirjastoa.
  // Reference: https://github.com/open-spaced-repetition/fsrs.js (älä importtaa, kopioi math)
}
```

### Frontend
- Uusi `js/screens/srs.js` -moduli (samaan tyyliin kuin `vocab.js`, `grammar.js`)
- HTML-screen `app.html`:ään: `<div id="screen-srs" class="screen" hidden>...</div>`
- CSS `css/srs.css` — TUO Puheo design tokens (`--accent`, `--surface`, `--text` jne.), ei hardcode
- Flip-anim: `transform: rotateY(180deg)`, `transition: 250ms`, `prefers-reduced-motion: reduce` → pelkkä opacity
- Tila hallinnoidaan `js/screens/srs.js`:ssä, ei globaaliin store-stateen

### Virheen → kortti -kytkös
Kytke nykyiset exercise-pisteytyspisteet:
- `routes/exercises.js` `/grade`-endpointissa: jos virhe → `await fetch('/api/srs/cards', { method:'POST', body: { ... } })` server-server (tai suora DB-insert)
- `routes/writing.js`:ssä saman tapainen — virhe-spotit muutetaan kortiksi (front = lause-cloze, back = korjattu)
- Dedup: jos kortti `(user_id, lang, front)` on jo, älä lisää uutta

---

## 6. Verifiointi (per STANDARDS §4)

> **Ennen committia: aja `_UI_UX_CHECKLIST.md` läpi.** Kaikki priority 1–6 -kohdat OK tai eksplisiittisesti N/A. Liitä täytetty lista IMPROVEMENTS.md-riviin.

Erityishuomiot tälle loopille:
- 4-step rating-napit (En osaa/Vaikea/Hyvä/Helppo): mobile-leveydellä < 360 px vaihdetaan 2×2-gridiin → 44×44 px touch target säilyy
- `GET /api/srs/today` loading-tila: kortin muotoinen skeleton, ei spinner
- `POST /api/srs/review` virhetilanteessa: retry + lokaali queue, käyttäjälle aria-live-error inputin lähellä
- Pino-tyhjäksi-reveal: positiivinen mikro-anim (pieni rasti scale 0→1, 250 ms, reduced-motion → opacity)
- Flip-card SVG-ikonit: Lucide-set (ei emoji)

1. **Migraatio MCP:llä ajettu.** Tarkista `mcp__claude_ai_Supabase__list_tables` → `srs_cards` näkyy + RLS päällä.
2. `graphify update .` koodi-muutosten jälkeen.
3. **Playwright e2e:** 
   - testi-käyttäjä tekee sanasto-tehtävän, vastaa väärin → odota POST `/api/srs/cards` → tarkista DB:stä että kortti syntyi
   - sama käyttäjä navigoi `#screen-srs` → näkee kortin pinossa → flip → review "Hyvä" → kortti poistuu pinosta tänään
   - Bypass gate `addInitScript`:llä per feedback memory
4. **axe-core 0 violations** `#screen-srs`:llä @ 1440 + 375.
5. `design-taste-frontend` review screenshoteista — "Linear-tier, ei loud".
6. SW-bumppi (uusi `js/screens/srs.js` + `css/srs.css` STATIC_ASSETSissa).
7. IMPROVEMENTS.md-rivi (3 riviä max, mainitse skillit + 21st.dev URL).

---

## 7. Lopputuotteen kriteeri

Käyttäjä tekee oppitunnin, virhe → automaattisesti kortti syntyy. Seuraavana päivänä `#screen-srs` näyttää kortin, käyttäjä reviewaa 4-step-napilla, FSRS päivittää `due_at`:n oikein. Kortit nousevat takaisin oikealla rytmillä (1d, 3d, 7d, 14d, ... riippuen ratingista). Näkymä tuntuu kevyeltä, ei pelkältä.
