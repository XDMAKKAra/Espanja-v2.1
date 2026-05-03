# Agent Prompt — L-LIVE-AUDIT-P1
# Visuaaliset polish-fixit dashboardiin + harjoitusscreeneihin: dash-tutor-kortti, B→C-laatikko, datavisualisaatio, mono-fontit pois, SR-painikkeet, Konteksti-badge, kategoriavärit

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **visuaalinen polish-loop**, ei feature-loop. Kaikki kohdat ovat näkyviä ongelmia tuotannossa juuri nyt — käyttäjä on sanonut suoraan että "Oma sivu on ruma".

---

## Edellytys

- L-LIVE-AUDIT-P0 on shipattu kokonaisuudessaan. Verify: `grep '\[L-LIVE-AUDIT-P0\]' IMPROVEMENTS.md` näyttää 5 riviä.
- Jos ei, STOP ja aja P0 ensin.

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, 21st.dev sourcing-säännöt. PAKOLLINEN jokaiseen UPDATEen.**
2. `AUDIT_LIVE_DASHBOARD.md` repon juuressa — koko tiedosto. Lähde-aineistoni; täältä toistettavuus, screenshotit, mittaukset.
3. `AGENT_STATE.md` — varmista L-LIVE-AUDIT-P0 shipattu.
4. `app.html` `#screen-dashboard` -lohko + `js/screens/dashboard.js` + `css/components/dashboard.css` — kaikki UPDATE 1–3 koskee tätä
5. `js/screens/vocab.js` + `js/screens/grammar.js` + `js/screens/reading.js` + `js/screens/writing.js` — ja niiden CSS:t (`css/components/exercise.css`, `results.css`, `feedback.css`)
6. `js/screens/fullExam.js` + sen CSS — UPDATE 5 koskee tätä
7. `style.css` + design tokenit (etsi `:root { --... }` -lohko) — käytä olemassa olevia tokeneita, älä lisää uusia ilman painavaa syytä
8. IMPROVEMENTS.md viimeiset 80 riviä — älä toista työtä jonka L-PLAN-7 tai L-PLAN-8 jo teki dashboardille

---

## Konteksti

Live-audit (`AUDIT_LIVE_DASHBOARD.md`) löysi 7 P1-tason visuaalista ongelmaa. Käyttäjä on sanonut suoraan: "Oma sivu on ruma." Suurin osa fixeistä keskittyy dashboardiin, mutta osa myös harjoitusscreeneihin (mono-fontit selityksissä ja lukuteksteissä, SR-painikkeet jotka näyttävät disabledilta, violetti Konteksti-badge).

**Käyttäjän vahvistettu lopputavoite:**
> "Dashboard tuntuu yhtä viimeistellyltä kuin Linear tai Vercel. Tehtäväsivut näyttävät opetussisällöltä, eivät terminaalilta. Brand-värit eivät klashaa keskenään."

**Tämä loop ei muuta toiminnallisuutta** — vain visuaalinen polish. Ei uusia API:ja, ei uutta logiikkaa.

**ÄLÄ keksi tyhjästä mitään mitä `puheo-screen-template`-skill määrittelee.** Käytä sen tokeneita, breakpointteja, ja state-patterneja.

---

## Skills + design plugins käyttöön

**Aktivoi nämä, lue niiden SKILL.md ennen kunkin UPDATEn aloittamista** (STANDARDS-pohjan päälle):

- `puheo-screen-template` — KAIKKI UPDATEt — design tokenit, spacing, kortti-radius, breakpointit
- `puheo-finnish-voice` — UPDATE 2 (B→C-laatikon copy), UPDATE 3 (osa-aluekortit), UPDATE 6 (SR-painikkeet — varmista että "Helppo / Hyvä / Vaikea / Uudelleen" ovat oikeassa sävyssä)
- `ui-ux-pro-max` — KAIKKI UPDATEt — typography, color, contrast, hover-states, focus-ringit

Education-skillit:
- `education/cognitive-load-analyser` — UPDATE 3 (osa-aluedata muotoiltuna — älä yritä viestiä 8 asiaa kerralla, max 4)
- `education/self-efficacy-builder-sequence` — UPDATE 2 (B→C-laatikko: "matka tasolle C", ei "et ole vielä C-tasolla"), UPDATE 6 (SR-arvointi: "miten muistit?" ei "miten huonosti muistit?")
- `education/formative-assessment-loop-designer` — UPDATE 4 (selitys-kortti vastauksen jälkeen — välitön opetus → seuraava askel)

Design plugins:
- `design:ux-copy` — UPDATE 2 (B→C otsikot + body), UPDATE 3 (osa-alueiden labelit). AJA ENNEN copyn lopullistamista.
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen, viimeisenä UPDATE 8 vetää koko dashboardin + harjoitussivun läpi
- `design:design-critique` — Playwright-screenshotit jokaisesta muutetusta näkymästä @ 1440 + 375. Erityisesti dashboard ennen/jälkeen — vertaa lähtötilan screenshotteihin AUDIT_LIVE_DASHBOARD.md:ssä
- `design:design-system` — UPDATE 7 (kategoriavärien selvitys) → jos päätös on harmonisoida, tämä on design-system-työtä
- `design:taste-frontend` jos saatavilla — KAIKKI UPDATEt

**21st.dev sourcing — pakollinen seuraaville:**

| UPDATE | Komponentti | Hakusanat |
|---|---|---|
| 1 | Tutor-viesti hero-kortissa (subtle accent left-border tai eyebrow + body) | `21st.dev/s/callout`, `21st.dev/s/announcement-card`, `21st.dev/s/info-card` |
| 2 | Level-progress-card jossa eyebrow + otsikko + 4 progress-palkkia | `21st.dev/s/progress-card`, `21st.dev/s/stats-card`, `21st.dev/s/goal-tracker` |
| 3 | Horizontal bar chart per osa-alue arvosanalla | `21st.dev/s/horizontal-bar`, `21st.dev/s/skill-bar`, `21st.dev/s/rating-bar` |
| 6 | SR-arviointipainikkeet selkeällä ratingilla (4 painiketta) | `21st.dev/s/rating-buttons`, `21st.dev/s/quality-rating`, `21st.dev/s/segmented` |

Cite EXACT 21st.dev URL IMPROVEMENTS.md-rivissä.

---

## UPDATE 1 — `dash-tutor`-osio uimassa ilman containeria

**Mitä näkyy:** Dashboardilla heti H1:n ("Iltaa, testpro123.") jälkeen tulee leveä leipäteksti ("Aloitetaan vahvalla pohjalla, joten tänään...") joka renderöityy paljaana `<p>`-elementtinä ilman korttia, paddingia, tai borderia. Line-height on `normal` (~1.2), liian tiukka. Sitten tulee vaakaviiva ja heti perään iso H1-kokoinen "Tee 10 harjoitusta...". Hierarkia rikki.

**Korjaus:** `css/components/dashboard.css` — lisää `.dash-tutor`:lle kortti-design `puheo-screen-template`-tokeneilla:

```css
.dash-tutor {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);  /* 16px screen-template-spec */
  padding: 24px;
  margin: var(--space-6) 0;  /* 32px */
}
@media (max-width: 768px) {
  .dash-tutor {
    padding: 20px;
  }
}
.dash-tutor__msg {
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink-soft);
  margin: 0;
}
```

Sourcaa 21st.dev info-card-pohja jos olemassa olevassa pattern-libraryssä ei ole vastaavaa. Käytä subtle accent left-borderia (esim. `border-left: 2px solid var(--accent)`) jos haluat tutor-viestin erottuvan ilman että se näyttää alert-laatikolta.

**Verify:**
- Renderöi dashboard 1440 + 375 → tutor-viesti on selkeästi rajatussa kortissa
- Line-height näyttää väljemmältä, ei tiukalta
- `design:design-critique` molemmilla viewporteilla
- `design:accessibility-review` — kontrasti AA

---

## UPDATE 2 — "B → C" -laatikko ilman otsikkoa

**Mitä näkyy:** Iso laatikko jossa lukee vain `B → C` ja sen alla:
```
Kysymyksiä: 0/50
Sessioita: 0/5
Päiviä tasolla: 0/7
Keskiarvo: 0%/78%
```

Käyttäjä ei tiedä mitä tämä on. Numerot raakana tekstinä.

**Korjaus:** Etsi tämän renderöintilogiikka (todennäköisesti `js/screens/dashboard.js`). Refaktoroi:

```html
<section class="level-progress-card">
  <p class="eyebrow">Tasosi edistyminen</p>
  <h3>Matka tasolle C</h3>
  <p class="hint">Kun täytät kaikki neljä tavoitetta, sinut päivitetään C-tasolle.</p>

  <div class="level-progress-grid">
    <div class="level-metric">
      <div class="level-metric__row">
        <span>Kysymyksiä</span>
        <span class="num">0/50</span>
      </div>
      <div class="progress-bar"><div class="fill" style="width: 0%"></div></div>
    </div>
    <!-- toista 4 metricille -->
  </div>

  <span class="level-badge">B → C</span>
</section>
```

Run `design:ux-copy` otsikoille. "Matka tasolle C" / "Kun täytät kaikki neljä tavoitetta..." pitää tarkistaa `puheo-finnish-voice`-skillillä.

Käytä `puheo-screen-template`-tokeneita (`--r-lg`, `--space-4`, `--accent`).

Sourcaa 21st.dev:stä `progress-card` tai `goal-tracker` -pohja.

**Verify:**
- Käyttäjä ymmärtää yhdellä silmäyksellä että hän on B-tasolla matkalla C:hen
- 4 metrickaa progress-palkkeina, ei raakatekstinä
- Mobile @ 375 → metricka pinottu, ei wrap-rikkoutunutta
- `design:design-critique`

---

## UPDATE 3 — Dashboardin osa-aluedata raakana tekstinä

**Mitä näkyy:** Dashboardilla scrollatessa lohko jossa raakatekstinä:
```
YO-valmiuskartta
3 / 14 osa-aluetta hallinnassa · 20% valmius · alkuvaiheessa
vähän hyvin
Kirjoittamisen osa-alueet — viim. 5 kertaa
Viestinnällisyys→ 3.5 / 5
Kielen rakenteet→ 2.5 / 5
Sanasto→ 3.5 / 5
Kokonaisuus→ 3.0 / 5
```

"vähän hyvin" lukee ilman kontekstia, "→ 3.5 / 5" näyttää keskeneräiseltä template-syntaxilta.

**Korjaus:** Etsi tämän lohko `js/screens/dashboard.js`:stä. Refaktoroi kahdeksi sectioniksi:

### YO-valmiuskartta (yläsection)
- Eyebrow: "YO-VALMIUS"
- Iso luku: "20%" + label "valmius" pienempänä
- Edistyspalkki täytettynä 20%:in asti, taustalla `var(--surface-2)`
- Alarivi: "3 / 14 osa-aluetta hallinnassa · alkuvaiheessa" (yhdistetty)
- **Poista:** "vähän hyvin" — tämä näyttää olevan keskeneräinen status-luokitus jolla ei ole kontekstia

### Kirjoittamisen osa-alueet (alasection)
- Otsikko: "Kirjoittamisen osa-alueet · viimeiset 5 kertaa"
- 4 horisontaalista palkkia, jokainen yhdellä rivillä:
  - Vasen: etiketti (Viestinnällisyys / Kielen rakenteet / Sanasto / Kokonaisuus)
  - Oikealla: arvosana muodossa "3,5/5" (suomalainen desimaalipilkku — `puheo-finnish-voice`)
  - Palkki: täytetty arvosanan suhteen (3.5/5 = 70%), taustalla harmaa
  - Optional: pieni delta-indikaattori jos arvosana on muuttunut viime viikosta

Sourcaa 21st.dev:stä `horizontal-bar` tai `skill-bar` -pohja. Run `education/cognitive-load-analyser` — varmista ettei tämä section ylikuormita (max 4-6 elementtiä näkyvissä yhtaikaa).

**Verify:**
- Käyttäjä näkee yhdellä silmäyksellä missä on vahvuudet/heikkoudet
- Numerot on muotoiltu "3,5/5" pilkulla, ei "3.5 / 5"
- Mobile @ 375 → palkit eivät wrap-rikkoudu
- `design:design-critique`

---

## UPDATE 4 — Vastausvaihtoehtojen selitys monospace-fontilla

**Mitä näkyy:** Sanastotehtävässä, vastauksen jälkeen, näkyy harmaa tekstilaatikko jossa selitys: `el alcalde = pormestari (mayor). Anunciar = ilmoittaa, medidas = toimenpiteet.` DM Mono -fontilla (terminal-fontti), tummanharmaalla, pienellä, tiukalla rivivälillä.

**Korjaus:** `css/components/exercise.css` (tai missä feedback/explanation-luokka on — etsi DOM-rakenne ensin).

```css
.exercise__explanation,  /* TARKISTA todellinen luokka */
.exercise__feedback,
.exercise__hint {
  font-family: var(--font-sans);  /* Inter */
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);  /* ei muted — tämä on tärkeää opetussisältöä */
}
```

Säilytä korttirajan harmaa tausta jos se on tunnusmerkki — vain fontti ja luettavuus. Sama kuvio sovellettavissa kaikissa harjoitustyypeissä joissa selitys-/feedback-paneeli on.

**Verify:**
- Vastaa sanastokysymys → selitys ilmestyy → fontti Inter, helppolukuinen
- Toista kuviota grammar/reading/writing-screeneille
- `design:accessibility-review` — kontrasti AA

---

## UPDATE 5 — Koeharjoituksen lukuteksti monospace-fontilla

**Mitä näkyy:** Koeharjoitus → Luetun ymmärtäminen → eka tehtävä. Koko espanjankielinen lukuteksti (200+ sanaa) DM Mono:lla. Tukala lukea.

**Korjaus:** `css/components/exercise.css` tai `fullExam`-spesifinen CSS. Etsi reading passage selectorit (etsi DOM-rakenne ensin):

```css
.reading-passage,
.passage-text,
.exam__reading-text {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  color: var(--ink);
  /* preserve serif jos käytössä passageille — mutta ei mono */
}
```

**Verify:**
- Koeharjoitus → Luetun ymmärtäminen → ekan tehtävän teksti renderöityy Interillä, ei mono:lla
- Sama tarkistus Luetun ymmärtäminen-välilehdellä yksinään (`/luetun`)
- `design:design-critique` 1440 + 375

---

## UPDATE 6 — SR-arviointipainikkeiden visuaalinen ristiriita

**Mitä näkyy:** Sanastotehtävässä vastauksen jälkeen 4 painiketta: Uudelleen (oranssi outline), Vaikea (keltainen outline), Hyvä (vihreä outline), Helppo (sininen outline). Outline-värit ok, mutta tausta tumma + teksti harmaa = näyttää disabledilta.

**Korjaus:** Tee teksti samansävyiseksi kuin outline. Lisää hover-state hennolla täytöllä:

```css
.sr-rating__btn--again {
  border-color: var(--color-rating-again);  /* TARKISTA token-nimet */
  color: var(--color-rating-again);
}
.sr-rating__btn--again:hover {
  background: rgba(var(--color-rating-again-rgb), 0.1);
}
/* sama kuvio: vaikea, hyvä, helppo */
```

Run `puheo-finnish-voice`:
- "Uudelleen" — neutraali, ei "väärin"
- "Vaikea" — ei "huono"
- "Hyvä" — ei superlatiivi
- "Helppo" — ei "täydellinen"

(Nämä ovat ehkä jo oikein — `education/self-efficacy-builder-sequence` ohjaa että neutraali-positiivinen sävy on parempi kuin onnistumis-/epäonnistumiskielenkäyttö.)

Sourcaa 21st.dev:stä `rating-buttons` tai `quality-rating` -pohja jos haluat refaktoroida koko komponentin. Muuten pelkkä CSS-fix riittää.

**Verify:**
- Vastaa kysymys → 4 painiketta. Jokaisessa on tunnistettava väri (oranssi/keltainen/vihreä/sininen) sekä outlinella että tekstillä
- Hover antaa palautteen
- Touch target ≥ 44px (`ui-ux-pro-max`)
- Focus-ringi keyboardilla tab:ttaen
- `design:accessibility-review`

---

## UPDATE 7 — "Konteksti"-badge violetti, klashaa brand-värin kanssa

**Mitä näkyy:** Sanastotehtävän yläosassa pieni violetti badge "Konteksti". Koko app käyttää muuten mintunvihreää.

**Korjaus:** Etsi `.context-badge` (tarkista DOM ensin). Vaihda väritys:

```css
.context-badge {
  background: rgba(var(--accent-rgb), 0.15);
  color: var(--accent);
  /* säilytä border-radius, padding, font-size */
}
```

Vaihtoehtoisesti neutraali (jos kategoriaerottelu ei ole tärkeä tässä):
```css
.context-badge {
  background: var(--surface-2);
  color: var(--ink-soft);
}
```

Päätös: brand-mintti kommunikoi "tämä on kontekstuaalista lisätietoa" säilyttäen branding-yhtenäisyyden. Mene sillä ellei kategoria-erottelua tarvitaan visuaalisena erona.

**Verify:**
- Sanastokysymys → "Konteksti"-badge mintunvihreänä, ei violettina
- Toista jokaiselle harjoitustyypille jossa badge esiintyy

---

## UPDATE 8 — Kategoriavärien selvitys + päätös

**Mitä näkyy:** Joka pääsivulla on oma kategoriaväri eyebrowissa + accenteissa:

| Sivu | Väri |
|------|------|
| Sanasto | mintunvihreä (brand) |
| Puheoppi | violetti |
| Verbisprintti | pinkki |
| Luetun ymmärt. | oranssi |
| Kirjoittaminen | sininen |
| Oppimispolku | mintunvihreä (brand) |
| Koeharjoitus | mintunvihreä (brand) |

**Mitä tehdä — kaksiosainen:**

### A. Selvitys (älä koske vielä koodiin)

```bash
grep -rn "color-puheoppi\|color-sanasto\|color-verbisprintti\|color-luetun\|color-kirjoittaminen\|category-color" css/ js/
```

Raportoi käyttäjälle:
- Onko nämä määritelty CSS-vakioina (tokeneina)?
- Käytetäänkö niitä yhdenmukaisesti vai sirpaleisesti (esim. eri sivuilla eri syyllä)?
- Onko design-token-tiedostoa joka olisi yhden paikan totuus?

Run `design:design-system` — auditoi naming + käyttö.

### B. Päätös käyttäjälle

Anna käyttäjälle 3 vaihtoehtoa:
1. **Pidä eri värit kategorisointina** — dokumentoi `puheo-screen-template`-skilliin että kategoriavärit ovat tietoinen design-päätös. Lisää tokenit jos puuttuu (`--cat-puheoppi`, `--cat-verbisprintti`, jne.).
2. **Harmonisoi kaikki brand-mintunvihreäksi** — yhtenäisempi, mutta menettää kategoria-erottelun.
3. **Harmonisoi neutraaleihin** (kaikki harmaa eyebrow + accent) — kompromissi: säilyttää järjestystä mutta ei klashaa brand-värin kanssa.

**ÄLÄ TEE päätöstä yksin** — anna pelkkä raportti + suositus, käyttäjä päättää.

---

## Verifiointi loop:in lopussa

1. **axe-core sweep** kaikilla muutetuilla screeneillä @ 1440 + 375 → 0 violations.
2. **Playwright screenshot + design:design-critique** kaikista muutetuista näkymistä:
   - Dashboard kokonaisuudessaan (UPDATE 1, 2, 3) — vertaa lähtötila vs. nyt
   - Sanastotehtävä vastauksella + selityksellä (UPDATE 4, 6, 7)
   - Koeharjoitus → Luetun ymmärtäminen (UPDATE 5)
3. **E2E-testit:**
   - `tests/e2e/dashboard-render.spec.js` — varmista että dashboard renderöityy ilman virheitä
   - `tests/e2e/exercise-feedback.spec.js` — varmista että selitys + SR-painikkeet toimivat
4. **Manuaalitesti tuotannossa** kun shipattu:
   - Avaa Pro-tunnuksilla `/app.html`
   - Käy dashboard läpi (kaikki sectionit näyttävät polishedilta)
   - Tee yksi sanastokysymys → vastaa → tarkista selityksen fontti + SR-painikkeiden klikattavuus
   - Avaa Koeharjoitus → tarkista lukutekstin fontti
5. **IMPROVEMENTS.md** — yksi rivi per UPDATE, prefix `[2026-05-03 L-LIVE-AUDIT-P1]`, mainitsee skillit + 21st.dev URLit.
6. **AGENT_STATE.md** — `Last completed loop: L-LIVE-AUDIT-P1`, `Next loop: L-LIVE-AUDIT-P2`.
7. **SW-bumppi** jos lisättiin uusia .css/.js tiedostoja.

---

## Mitä EI saa tehdä tässä loopissa

- ÄLÄ koske P0- tai P2-bugeihin
- ÄLÄ lisää uutta toiminnallisuutta — vain visuaalinen polish
- ÄLÄ lisää AI-generoituja kuvia tai stock-kuvia mihinkään
- ÄLÄ koske landing-pageen
- ÄLÄ keksi kategoriavärille ratkaisua yksin (UPDATE 8) — anna käyttäjän päättää
- ÄLÄ kirjoita uutta copya ilman `design:ux-copy` + `puheo-finnish-voice`-tarkistusta
- ÄLÄ tee uusia tokeneita `:root`:iin ellei `design:design-system`-pass sano että vanhat ovat riittämättömiä
- ÄLÄ keksi UI-komponenttia ilman 21st.dev-sourcing-passia (paitsi triviaali laajennus olemassa olevasta)

---

## Commit-konventio

Yksi commit per UPDATE:
- `fix(dashboard): wrap dash-tutor in card with proper line-height [L-LIVE-AUDIT-P1 UPDATE 1]`
- `feat(dashboard): replace level-up text block with progress-card (B→C) [L-LIVE-AUDIT-P1 UPDATE 2]`
- `feat(dashboard): replace skill text with horizontal bar charts [L-LIVE-AUDIT-P1 UPDATE 3]`
- `fix(exercise): use Inter font for explanation panel [L-LIVE-AUDIT-P1 UPDATE 4]`
- `fix(exam): use Inter font for reading passages [L-LIVE-AUDIT-P1 UPDATE 5]`
- `fix(exercise): make SR rating buttons visually clickable with colored text [L-LIVE-AUDIT-P1 UPDATE 6]`
- `style(exercise): use brand mint for Konteksti badge [L-LIVE-AUDIT-P1 UPDATE 7]`
- `docs(design-system): audit category colors and propose decision [L-LIVE-AUDIT-P1 UPDATE 8]`

Push → Vercel deploy → manuaalitesti tuotannossa → IMPROVEMENTS.md + AGENT_STATE.md.
