# L-HOME-HOTFIX-3 — kahden palstan layout, kurssin avautuminen, CTA-väri, tiivistys

> Lue ENSIN: `AGENT_PROMPT_STANDARDS.md` ja `AGENT_STATE.md` (juuressa). Loop-merkintä `AGENT_STATE.md`:hen on max 7 riviä (STANDARDS §7).
>
> **Tausta:** L-MERGE-DASH-PATH (#20) ja L-HOME-HOTFIX-2 (#21) yhdistivät Oma sivun ja Oppimispolun, mutta layout on edelleen rikki. Käyttäjän tuotantotesti 4.5.2026 paljasti neljä bugia jotka korjataan tässä loopissa.

---

## 1. Konteksti — neljä konkreettista bugia

Tuotantotesti https://espanja-v2-1.vercel.app, viewport 1920×1080 / sisältöalue ~1675 px (sivupalkin jälkeen):

### Bug A — sisältö ei käytä leveyttä, oikea puoli on tyhjä

`.path-inner` on `max-width: 1320px` ja keskittyy, MUTTA sisältö on yksi pystysuora kolonni → kurssikortit eivät täytä leveyttään luonnollisesti, oikea puoli (~700 px) jää tyhjäksi.

**Korjaus:** kahden palstan grid desktopilla (≥1024 px). Vasen 60–62% / oikea 38–40%, sticky-oikea-palsta. Mobile (<1024 px): stack pystyssä kuten nyt.

```
[ DESKTOP LAYOUT ]
┌─────────────── path-inner (max 1320px, centred) ──────────────┐
│ ┌── greeting (full width) ────────────────────────────────────┐│
│ │ Iltaa, testpro123. + putki-chip integroituna headeriin       │
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌── PATH-MAIN (60%) ─────────┐ ┌── PATH-RAIL (40%, sticky) ──┐ │
│ │ Oppimispolku (h1)            │ │ Jatka tästä (CTA)             │ │
│ │ 8 kurssia · 0/8 suoritettu   │ │ [Kurssi 1 — Kuka olen        │ │
│ │                              │ │  Oppitunti 2: Esittäytyminen]│ │
│ │ ┌── KURSSI 1 (avattu) ────┐  │ │                               │ │
│ │ │ Kurssi 1 — Kuka olen   │  │ │ ── YO-valmius                 │ │
│ │ │ A · 1/10 oppituntia    │  │ │ 1 % valmiina                  │ │
│ │ │ ── ─────────────       │  │ │ 0/8 kurssia hallinnassa       │ │
│ │ │ ✓ Oppitunti 1 (tehty)  │  │ │ ▢▢▢▢▢▢▢▢                      │ │
│ │ │ → Oppitunti 2 (kesken) │  │ │                               │ │
│ │ │ 🔒 Oppitunti 3         │  │ │ ── Heikot kohdat              │ │
│ │ │ ... (10 kpl)           │  │ │ Artikkelit · 2 virhettä       │ │
│ │ └────────────────────────┘  │ │ Relatiivipronominit · 1       │ │
│ │                              │ │                               │ │
│ │ Kurssi 2 — Arki ja elämä 🔒  │ │                               │ │
│ │ Kurssi 3 — Mitä tein 🔒      │ │                               │ │
│ │ ... (loput 7 kompaktina)    │ │                               │ │
│ └──────────────────────────────┘ └───────────────────────────────┘ │
│                                                                    │
│ ┌── footer-grid (full width) ───────────────────────────────────┐ │
│ │ Viimeisimmät harjoitukset │ Kehitys ajan mittaan              │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘

[ MOBILE LAYOUT ]
header → path-main (auki kurssi 1) → path-rail-tiivistetty → footer
```

### Bug B — Aktiivinen kurssikortti pitää avautua ja näyttää oppituntilista

Nyt aktiivinen Kurssi 1 -kortti näyttää vain "1/10 oppituntia" yhtenä laatikkona. Käyttäjä ei näe **mitkä** oppitunnit on tehty / kesken / lukittu.

**Korjaus:** aktiivinen kurssikortti renderöityy avattuna ja näyttää oppituntilistan:
- Otsikko + taso-badge säilyy
- Sen alle 10 oppituntirivin lista:
  - ✓-ikoni + lesson title (suoritettu, mute väri)
  - →-ikoni + lesson title (kesken / seuraava, accent-väri, koko rivi nappi joka vie suoraan oppituntiin)
  - 🔒-ikoni + lesson title (lukittu, harmaa, ei klikattavissa)
- Lukitut kurssit (2–8) pysyvät kompaktina (kuten nyt) — vain aktiivinen aukeaa
- Kun käyttäjä suorittaa kurssin → seuraava kurssi avautuu automaattisesti (sama logiikka kuin nyt)

Datalähde: `routes/curriculum.js` (`lessonsCompleted` per course on jo siellä). Tarkista palauttaako endpoint per-lesson-statuksen — jos ei, lisää.

### Bug C — "Kertaa nyt" / day-CTA väri ennen hoveria näyttää disabled-tummalta

`.btn--cta`-tyyli on `background: var(--ink); color: var(--bg);` — alkuperäinen tumma navy bar. Hoverissa kirkastuu `#1F2937`:een. Tämä toimi alkuperäisellä Oma sivulla joka oli vaaleampi konteksti, mutta uudessa tummassa Oppimispolku-sivussa nappi näyttää lähes mustalta laatikolta.

**Korjaus:** päivän CTA käyttää **accent-pohjaista tyyliä** kun se on `screen-path`-kontekstissa:
- Background: `var(--accent)` (turkoosi)
- Text: `var(--ink)` (tumma)
- Arrow: `var(--ink)` tai `currentColor`
- Hover: pieni elevation + slightly darker accent
- Säilytä alkuperäinen tumma `.btn--cta` -tyyli oppituntien sisällä — ei breikata muita kontekstoja

Tee tämä joko:
- (a) Uusi modifier `.btn--cta--accent` jota käytetään vain `#dash-day-cta`:ssa
- (b) `:where(#screen-path) .btn--cta` -override

Suositus: (a) — selkeämpi ja eksplisiittinen.

### Bug D — Yläreunassa on tyhjää, sisältö pitää nostaa

`.path-inner` `padding: 0 16px 48px;` + `.dash-greeting` `min-height: 96px;` jättää yläreunaan väljyyttä. Sisältö ei ala heti viewport-yläreunasta, vaikka pitäisi.

**Korjaus:**
- Vähennä `.dash-greeting` `min-height` arvosta `96px` arvoon `auto` (tai `48px` jos meteor-fx tarvitsee)
- Vähennä `.dash-greeting` `margin-bottom: 32px` arvoon `16px`
- `.path-inner` ensimmäinen child saa `padding-top: 24px` (ei 0) jotta on hieman hengittävää tilaa headerille, mutta ei niin paljon kuin nyt
- Tarkista että `top-nav` / `app-sidebar` ei syö pystytilaa turhaan

Tavoite: kun käyttäjä avaa sivun, `Oppimispolku`-otsikko on näkyvissä viewportin yläosassa ilman skrollausta.

---

## 2. Mitä SÄILYTETÄÄN ennallaan

- Kaikki nykyiset komponentit ja niiden datalähteet (greeting, putki, day-CTA, kurssikortit, YO-valmius, footer-grid)
- Sivupalkin / bottom-navin rakenne (jo korjattu PR #20)
- "Miten Puheo toimii" -nappi (jo lisätty PR #21)
- Mobile-layout — kaikki uusi grid on desktop-only `@media (min-width: 1024px)` -wrappereissa
- `.btn--cta` alkuperäinen tumma tyyli — sitä käytetään muualla (oppitunneissa)
- YO-valmius-laskenta (kurssipohjainen, korjattu PR #21)

---

## 3. Mitä EI tehdä

- ÄLÄ refaktoroi `dashboard.js`:ää
- ÄLÄ koske kurssin sisältöön (`data/courses/**/*.json`)
- ÄLÄ koske oppitunnin sisäisiin näkymiin (`screen-lesson`, `screen-mode-*`)
- ÄLÄ poista mitään komponenttia — vain järjestele uudelleen layout-griddiin
- ÄLÄ aja Supabase-migraatioita
- ÄLÄ koske SR-engineen
- ÄLÄ muuta `.btn--cta` perustyyliä — tee uusi modifier
- ÄLÄ bumppaa SW jos STATIC_ASSETS ei muuttunut

---

## 4. Pakolliset skillit ja workflow

**Puheon omat (lue ENNEN koodaamista):**
- `.claude/skills/puheo-screen-template/SKILL.md` — layout, spacing, two-column patterns
- `.claude/skills/ui-ux-pro-max/SKILL.md` — sticky-elementit, scroll-behavior, focus-järjestys 2-palsta-griddissä
- `.claude/skills/puheo-finnish-voice/SKILL.md` — uusi copy oppituntilistalle (oppitunti 1, 2, 3 -nimet jos ei ole vielä)

**Education-skillit:**
- `education/cognitive-load-analyser/SKILL.md` — kahden palstan layout EI saa lisätä kuormaa, sen pitää tasapainottaa
- `education/flow-state-condition-designer/SKILL.md` — yksi selkeä CTA, oppitunti 2 -nappi rivillä on luonnollinen seuraava askel
- `education/curriculum-knowledge-architecture-designer/SKILL.md` — oppituntilista näyttää koherenssin kurssin sisällä

**Design-pluginit:**
- `design:ux-copy` — lesson-listan rivien copy ("Oppitunti 1 — Perhe ja kansallisuudet ✓", "Oppitunti 2 — Esittäytyminen →", "Oppitunti 3 🔒")
- `design:design-critique` — Playwright @ 1920 + 1440 + 1024 + 375 ENNEN ja JÄLKEEN
- `design:accessibility-review` — sticky-rail focus-järjestys, keyboard nav grid:n yli, screen reader -järjestys

**21st.dev-sourcing (STANDARDS §3):**
- Avattu kurssikortti + oppituntilista on uusi UI-pattern → sourcaa. Hakusanat: `lesson-list`, `course-progress`, `expandable-card`, `accordion-progress`, `learning-path-list`. Screenshot 2–3 kandidaattia → `references/lesson-list/21stdev/`. Cite URL `IMPROVEMENTS.md`-rivissä.
- Sticky-rail (oikea palsta): hakusanat `sticky-sidebar`, `sidebar-rail`, `dashboard-rail`. Tämä on yleisempi pattern, mutta sourcaa silti yksi referenssi.
- 2-palstaa grid + accent-CTA-modifier: olemassa olevia patterneja, ei sourcing-passia.

---

## 5. Toteutusjärjestys (UPDATEt)

### UPDATE 1 — Bug A: kahden palstan grid desktopilla

1. `app.html` `screen-path` -wrapperin sisällä: kääri `path-courses` ja uusi `path-rail` -elementti yhteiseen `path-grid`-divaan:
   ```html
   <div class="path-grid">
     <main class="path-main">
       <section class="path-courses">...</section>
     </main>
     <aside class="path-rail">
       <button id="dash-day-cta" class="btn--cta btn--cta--accent">...</button>
       <div id="dash-readiness" class="dash-readiness hidden"></div>
       <div id="dash-weak-topics" class="dash-weak-topics hidden">...</div>
     </aside>
   </div>
   ```
2. Siirrä `dash-day-cta`, `dash-readiness` ja heikot kohdat -lista `path-rail`:n sisään (DOM-järjestys muuttuu)
3. `style.css` -uudet säännöt:
   ```css
   .path-grid { display: block; }
   @media (min-width: 1024px) {
     .path-grid {
       display: grid;
       grid-template-columns: minmax(0, 1fr) 380px;
       gap: 32px;
       align-items: start;
     }
     .path-rail {
       position: sticky;
       top: 24px;
       max-height: calc(100vh - 48px);
       overflow-y: auto;
       display: flex;
       flex-direction: column;
       gap: 24px;
     }
   }
   ```
4. Tarkista että greeting + footer-grid jää `path-grid`:n ULKOPUOLELLE (full-width)
5. Tarkista että rail-elementit eivät hajoa <1024 px viewportissa — `display: block` + olemassa olevat margins toimivat mobilella

Verify: Playwright @ 1920 + 1440 + 1024 + 375. Desktop näyttää kahta palstaa, tablet/mobile stackaa kuten nyt. Oikea puoli ei ole enää tyhjä.

### UPDATE 2 — Bug B: aktiivinen kurssikortti aukeaa, oppituntilista

1. `routes/curriculum.js` — tarkista `GET /api/learning-path` (tai vastaava) -endpointin response. Sisältääkö per-lesson-statuksen aktiiviselle kurssille? Jos ei:
   - Lisää `lessons: [{ index, title, status, completed_at }]` -array kurssin objektiin (vain ACTIVE-kurssille tarvitaan, lukitut voivat jäädä ilman)
   - Status-arvot: `"completed"` / `"current"` / `"locked"`
2. `js/screens/curriculum.js` r366 — `path-courses-root`-renderöijä:
   - Aktiivinen kurssi: renderöi `<details open>` tai aina-auki-blokki, jonka sisällä `<ul class="lesson-list">`
   - Jokainen `<li class="lesson-row" data-status="completed|current|locked">`:
     - Ikoni (✓ / → / 🔒) — käytä lucide-tyylisiä SVG:itä, älä emojeja
     - Lesson title (esim. "Oppitunti 2 — Esittäytyminen")
     - Statusvärin token: completed = `var(--ink-soft)`, current = `var(--accent)`, locked = `var(--ink-muted)`
   - Klikkaus rivillä (jos status !== locked) → vie `screen-lesson`iin sopivalla `lesson_index`-paramilla
   - Lukitut kurssit (2–8): renderöi nykyinen kompakti kortti, ei avata
3. CSS: uusi `.lesson-list` ja `.lesson-row` -tyylit, sourced 21st.devistä (§4)
4. Mobile: oppituntilista skaalautuu täysleveäksi, ei murru

Verify: aktiivinen kurssi 1 näyttää 10 oppituntiriviä, oikeat statukset, klikkaus toimii. Lukitut kurssit eivät avaudu.

### UPDATE 3 — Bug C: accent-CTA-modifier

1. `css/components/button.css` — lisää uusi modifier `.btn--cta--accent`:
   ```css
   .btn--cta--accent {
     background: var(--accent);
     color: var(--ink);
     box-shadow: 0 1px 0 rgba(13, 148, 136, 0.15), 0 18px 32px -22px rgba(13, 148, 136, 0.45);
   }
   .btn--cta--accent:hover {
     background: color-mix(in oklab, var(--accent) 92%, var(--ink) 8%);
     box-shadow: 0 1px 0 rgba(13, 148, 136, 0.2), 0 22px 36px -22px rgba(13, 148, 136, 0.5);
   }
   .btn--cta--accent .btn--cta__title { color: var(--ink); }
   .btn--cta--accent .btn--cta__meta { color: rgba(15, 23, 42, 0.72); }
   .btn--cta--accent .btn--cta__arrow { color: var(--ink); }
   ```
2. `app.html` — lisää `btn--cta--accent` luokka `dash-day-cta`-elementtiin (`#screen-path`-kontekstissa)
3. Tarkista AA-kontrasti: `var(--ink)` mustalla `var(--accent)` taustalla — pitäisi olla yli 7:1, mutta varmista axe-corella
4. Älä koske `.btn--cta` perustyyliin — säilyy oppituntien sisällä

Verify: päivän CTA on turkoosi (näkyvä, accent-väri), ei tummansininen. Oppitunnin sisällä `.btn--cta` on edelleen tumma.

### UPDATE 4 — Bug D: tiivistä yläosa

1. `style.css` `.path-inner`:
   - `padding: 24px 16px 48px;` (oli `0 16px 48px`)
2. `css/components/dashboard.css` `.dash-greeting`:
   - `min-height: auto;` (oli `96px`)
   - `margin-bottom: 16px;` (oli `32px`)
3. Tarkista `.path-courses` ensimmäinen `h1.path-title` — pienennä `margin-bottom` jos tarvitsee (oli 24 px → 12 px)
4. Putki-chip jo integroitu greetingin sisään (PR #21:ssä) — tarkista että ei ole oma rivi ylimääräistä margins

Verify: avattu sivu näyttää viewportissa 1080 px korkeudella sekä headerin ETTÄ Kurssi 1:n + osan oppituntilistasta. Ei tyhjää yläreunaa.

### UPDATE 5 — copy + final sweep

- `design:ux-copy` jokainen näkyvä uusi teksti (lesson-list rivien copy, status-tilat)
- `puheo-finnish-voice/SKILL.md` -sweep oppituntien nimille (jos `data/courses/kurssi_1/lesson_*.json` `meta.title` puuttuu jostain → ei lisätä omia, vaan placeholder "Oppitunti N")
- axe-core 0 violations @ 1920 + 1440 + 1024 + 375
- `design:design-critique` ennen/jälkeen-vertailu kaikilla viewport-kokoisilla
- E2E-testi: kirjautuminen → etusivu → kurssi 1 avautuu listana → oppitunti 2 -rivi klikkaus → menee `screen-lesson`iin
- Pieni snapshot-testi: `path-grid` desktopilla on `display: grid`, mobilella `block`

---

## 6. Verifiointi-checklist

- [ ] `npm test` 1064/1064 ✓ (uusia testejä saa lisätä)
- [ ] `npm run build` clean
- [ ] axe-core 0 violations @ 1920 + 1440 + 1024 + 375
- [ ] Playwright screenshot kaikki 4 viewport-kokoa → design:design-critique applattu
- [ ] Desktop ≥1024 px: kaksi palstaa, oikea puoli on täynnä (rail), ei tyhjää avaruutta
- [ ] Mobile <1024 px: kaikki stackaa pystyssä, ei breakaa
- [ ] Aktiivinen Kurssi 1 -kortti aukeaa ja näyttää 10 oppituntiriviä oikeilla statuksilla
- [ ] Lukitut kurssit 2–8 eivät avaudu (kompakti kortti kuten nyt)
- [ ] Lesson-rivin klikkaus vie suoraan oppituntiin oikealla `lesson_index`-paramilla
- [ ] Päivän CTA on accent-värinen (turkoosi), ei tumma navy
- [ ] `.btn--cta` perustyyli oppituntien sisällä on edelleen tumma (ei rikki)
- [ ] Yläreunassa ei ole tyhjää avaruutta — Oppimispolku-otsikko ja Kurssi 1 näkyvät heti viewportissa
- [ ] Sticky-rail pysyy näkyvissä kun käyttäjä skrollaa kurssikortteja alas
- [ ] AA-kontrasti accent-CTA:ssa OK
- [ ] 21st.dev URLit citettyinä `IMPROVEMENTS.md`-rivissä lesson-list + sticky-rail komponenteille
- [ ] `AGENT_STATE.md` päivitetty (max 7 riviä)
- [ ] `IMPROVEMENTS.md` päivitetty (max 3 riviä per UPDATE)
- [ ] SW-bumppi vain jos STATIC_ASSETS muuttui
- [ ] PR-otsikko: `fix(home): two-column layout + course expansion + accent CTA + tighten top [L-HOME-HOTFIX-3]`

---

## 7. Pending / käyttäjälle ACTION REQUIRED

Lopuksi `IMPROVEMENTS.md`:hen:
- Onko `routes/curriculum.js` `GET /api/learning-path` palauttanut per-lesson-statuksen vai lisätiinkö uutena? Jos uusi field, dokumentoi
- Lesson-rivien copy: kurssin sisällön JSON-tiedostoissa pitää olla `meta.title` jokaiselle oppitunnille — jos puuttuu, lisätään Batch 2 -generointissa
- 21st.dev-referenssit lesson-list ja sticky-rail komponenteille
