# BRIEF: L-V316 — Wire /next-topic Aloitukseen + humanisoi lesson-sisältö

**Päivä:** 2026-05-25
**Edellinen:** L-V315b shipped (`48192ae`, `ab9d9df`, `676081a`). Reasoner toimii prodissa, weighting-helper + endpoint olemassa, ratio 5:1 Marcelin profiilille. Mutta **mikään frontend-CTA ei kutsu endpointtia** → räätälöinti ei näy käyttäjälle.
**Lähde-screenshot:** `C:\Users\marce\OneDrive\Pictures\Screenshots\Screenshot 2026-05-25 194853.png` — espanjan oppitunnin yhteenveto-kortti, näkyvät slop-merkit: em-dashit bulleteissa, "Muista nämä" mono-eyebrow, rule-of-four numbered card.

---

## Executive

Kaksi tehtävää **rinnakkain** (eri tiedostot, ei riippuvuutta):

1. **L-V316a — Wire `/next-topic` Aloitus-näytön "Jatka opintoja" -CTA:han** niin että reasoner-räätälöinti näkyy käyttäjälle ekan kerran
2. **L-V316b — Humanisoi lesson-generaatio-prompt + kor­jaa "Muista nämä"-eyebrow CSS + skannaa olemassa olevat lessonit em-dasheista**

Tämä on **kolmas kerta** kun reasonerin todellinen käyttäjävaikutus tulee scopeen — älä lykkää toimitusta enää follow-uppiin. Jos jokin osa paljastaa että rakenne ei kanna, restrukturoi tässä loopissa.

---

## L-V316a — Wire `/next-topic` Aloitus → "Jatka opintoja"

**Tavoite:** Kun käyttäjä klikkaa Aloitus-näytön "Jatka opintoja" -CTA:ta (tai mikä lopullinen nimi onkin), seuraava tehtävä valitaan weighted-poolista — heikot topicit 3x todennäköisemmin kuin vahvat.

### Selvitä ensin (älä prescribe ennen lukemista)

1. **Lue `js/screens/home.js`** (tai mikä Aloitus-screen nyt on — voi olla `home`, `aloitus`, `dashboard`). Tunnista CTA-elementti joka laukaisee seuraavan tehtävän generoinnin.
2. **Kartoita kutsupolku:** click handler → mikä API-endpoint kutsutaan nyt? Onko se `/generate`, `/adaptive-exercise`, `/checkpoint/start`, vai joku muu?
3. **Tunnista decision-point** missä topic valitaan ennen exercise-generointia. Tämä on missä `/next-topic`-kutsu lisätään.

### Toteutus

- Aloitus "Jatka opintoja" -CTA:n click-handler:
  1. Tarkista `state.user.skill_profile`-olemassa olo (cached frontendissä L-V315:stä) tai fetchaa `/api/personalization/profile`
  2. Jos profile olemassa → kutsu `POST /api/personalization/next-topic` ennen exercise-generointia, käytä palautuvaa `topic`-arvoa generointi-parametrina
  3. Jos profile puuttuu (user ei tehnyt diagnostiikkaa) → vanhaa curriculum-default-polkua, ei refaktorointia
- **Älä** tee tätä Kurssit-näytön lesson-launcherista (käyttäjä valitsi kurssin eksplisiittisesti → curriculum-fixed)
- **Älä** tee tätä Koeharjoituksesta (exam-spec mukainen)
- Treeni / Focus-session: jos olemassa adaptive-mode-toggle, lisää weighting sinne; jos ei, jätä rauhaan

### Loading-state

- Kun "Jatka opintoja" klikataan, näytä skeleton (ei "Ladataan…" italicilla — `feedback_ai_slop_check_every_frontend`)
- Jos `/next-topic` failaa (500, timeout 5 s) → fallback uniform-sampleen + log virhe, ei käyttäjälle näkyvää virhettä

### Verify

1. **Lokaali manuaalitesti:** kirjaudu Marcelin testi-tilillä (homeUsage=yes, K3+K4+K6+K7, subjunktiivi heikko), klikkaa "Jatka opintoja" 10 kertaa, kerää valitut topicit, vahvista että heikot aiheet dominoivat (≥ 5/10 heikoista)
2. **Playwright-spec:** uusi `tests/personalization-wire-aloitus.spec.js` joka simuloi click 10 kertaa, mockaa `/next-topic` palauttamaan deterministisesti, vahvistaa että generointi-kutsun `topic`-param on weighted-arvo eikä uniform
3. **Console-virheet:** 0 punaista frontendissä
4. **Bug-scan 38/38** + audit 26/26 säilyy

### Commit

- `feat(personalization): wire /next-topic into Aloitus "Jatka opintoja" CTA (L-V316a-WIRE-NEXT-TOPIC, v309)`
- `npm run build` + SW-bump v308→v309
- IMPROVEMENTS.md-rivi: ennen/jälkeen topic-frequency Marcelin profiilille 10 klikistä

---

## L-V316b — Humanisoi lesson-sisältö

**Tavoite:** Espanjan (ja DE/FR kun sisältöä generoituu) oppituntien generointi tuottaa Finnish-natiivilta kuulostavaa tekstiä, ei AI-slopia. Olemassa olevat 90 lesson-JSONia siivotaan em-dasheista.

### Slop-merkit screenshotista

- **Em-dashit:** "Subjekti (yo, tú, él…) jätetään yleensä pois — verbi kertoo persoonan." ja "Subjektipronominit yleensä pois — verbi paljastaa persoonan."
- **"Muista nämä" -eyebrow** rendöityy DM-Mono / monospace + wide letter-spacing → AI-slop-pattern (vrt. L-V306 "HARJOITTELUTAPA")
- **Rule-of-four numbered summary card** — pakkomielle yhteenvetoon, parallel construction joka virkkeessä
- **"yleisin ansa"**, "**paljastaa persoonan**" — fake-Finnish AI-tone, ei luonnollista oppikirjakieltä

### Tehtävä 2.1 — Lesson-generaatio-prompt humanisointi

1. **Etsi prompt:** lokaation kandidaatit — `lib/openai.js`, `lib/lessonGenerator.js`, `routes/exercises.js`, tai `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_*.md`. Lue ja tunnista missä lesson-takeaways / summary-card -copy generoidaan.

2. **Lisää prompt-templateen humanizer-säännöt** (kovat kiellot, ei suosituksia):
   - **EI em-dashia (—)** — käytä pilkkua, kaksoispistettä, sulkeita, tai erillistä virkettä
   - **EI rule-of-three / -four -pakkomielle** — jos asia kannattaa kahdella tai viidellä bulletilla, käytä sitä; symmetria ei ole arvo
   - **EI AI-brand-sanoja suomeksi:** "kalibroitu", "räätälöity", "monipuolinen", "intuitiivinen", "saumaton", "elevate-tyyppinen"
   - **EI sycophantic openers:** "Hienoa että opit X!", "Erinomainen kysymys!"
   - **EI generic conclusions:** "Toivottavasti tämä auttoi!", "Onnea matkaan!"
   - **EI fake-Finnish AI-tone:** "yleisin ansa", "paljastaa persoonan" -tyyppiset — kysy "kirjoittaako lukio-opettaja näin"

3. **Lisää positiivinen ohje:** "Kirjoita kuin lukio-opettaja, ei kuin AI. Lyhyet virkkeet ovat hyväksi. Konkreettiset esimerkit (yo hablo, tú hablas) toimivat paremmin kuin abstraktit määritelmät. Saa olla suora ja epämuodollinen."

4. **Aja regen-testi:** generoi 3 uutta lesson-takeaway-osiota, vahvista että em-dashit puuttuvat ja teksti kuulostaa luonnollisemmalta. Älä shippaa jos vielä slop.

### Tehtävä 2.2 — "Muista nämä" -eyebrow CSS

1. **Etsi luokka:** todennäköisesti `.lesson-summary__eyebrow` / `.callout__label` / `.muista-card__title` — grep `Muista nämä` tai vastaavaa
2. **Korjaa:**
   - `font-family: inherit` (ei DM-Mono)
   - `text-transform: none` (ei UPPERCASE)
   - `letter-spacing: normal` tai pieni 0.01em (ei wide-tracking)
   - Sama hierarkia kuin muilla h3/h4-tason etiketeillä — käytä olemassa olevia design-tokeneita, älä keksi uutta tyyliä
3. Sama korjaus kaikkiin "eyebrow"-luokkiin jotka käyttävät DM-Monoa staattisissa ohjekorteissa

### Tehtävä 2.3 — Olemassa olevien lessonien em-dash-skannaus

1. **Skannaa `data/courses/es/**/*.json`** (+ `data/courses/de/`, `data/courses/fr/` jos sisältöä):
   ```bash
   grep -rn " — " data/courses/ | wc -l
   ```
2. Jos N > 0:
   - Korvaa kaikki ` — ` → `, ` tai `: ` tai `. ` (kontekstista riippuen)
   - Älä blindly sed-replace jos tilanne vaatii uudelleenmuotoilua (esim. "X — Y" missä Y on selitys → "X, eli Y" toimii usein)
   - Aja `npm run validate:lessons` jokaisen muokkauksen jälkeen — JSON-rakenne ei saa rikkoutua

3. **Älä** regeneroi koko lesson-sisältöä — pidä autorin valinnat. Vain em-dash-fix + suora slop-poisto.

### Verify (L-V316b kokonaisuutena)

1. **Regen-test:** 3 uutta lesson-takeaway, 0 em-dashia, läpäisee silmäilytestin (kuulostaa opettajalta)
2. **CSS-test:** Avaa lesson Step 4 -näyttö Playwrightilla, screenshot "Muista nämä" -kortista. Eyebrow ei ole monospace, ei UPPERCASE.
3. **Lesson-skann:** `grep -rn " — " data/courses/` palaa 0 matchia (tai pelkkä escape-sekvenssi koodi-blokeissa)
4. **`npm run validate:lessons`** 90+/90+ PASS
5. **Bug-scan 38/38** + audit 26/26

### Commit

- `feat(lessons): humanize lesson generation prompt + clean em-dashes + "Muista nämä" eyebrow CSS (L-V316b-HUMANIZE-LESSONS, v309 tai v310)`
- `npm run build` + SW-bump jos CSS/JS muuttuu
- IMPROVEMENTS.md-rivi: ennen/jälkeen em-dash-count + screenshot eyebrow-fixistä + 3 regenerated takeaways esimerkkinä

---

## Yleisohjeet

- **Skill-stack:** Lataa Skill-toolilla CLAUDE.md:n EXERCISE/LESSON + FRONTEND + TESTING -taulukon mukaiset
- **Älä lykkää.** Jos L-V316a paljastaa että home.js-CTA-rakenne ei salli puhdasta wiringia, korjaa rakenne (yksi extra commit, ei follow-up-brief). Three-strikes-rule pätee tähän — reasoner-frontend-integraatio on lykätty jo kahdesti
- **Älä regeneroi koko lesson-sisältöä.** Vain prompt + olemassa olevien em-dash-fix
- **Älä lisää carouselia tai animaatiota Aloitus-näyttöön** wiringin yhteydessä — vain CTA wiring, ei UX-refaktoria
- **Push** per tehtävä (L-V316a yksi commit, L-V316b yksi commit, mahdollinen CSS-fix kolmas pieni commit)

---

## Acceptance L-V316:lle

1. Marcelin testi-tilillä "Jatka opintoja" 10 klikistä ≥ 5 heikkoa-aiheen tehtävää (manual + Playwright spec)
2. 3 regenerated lesson-takeaway, 0 em-dashia, kuulostaa opettajalta
3. "Muista nämä"-eyebrow ei ole monospace + UPPERCASE
4. `grep " — " data/courses/` palaa 0
5. Bug-scan 38/38, audit 26/26 säilyy
6. IMPROVEMENTS.md-rivit kummallekin loopille

---

## Out-of-scope

- `GET /api/personalization/why` transparency endpoint
- Aloitus-näytön visual-refaktori (siirretään L-V317:ään jos tarvitaan)
- DE/FR lesson-sisällön humanisointi — kun lessonit on generoitu, sama promppi koskee niitä automaattisesti
- Treeni / Koeharjoitus weighting-integraatio
