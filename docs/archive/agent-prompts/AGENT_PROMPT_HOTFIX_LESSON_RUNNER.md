# Agent Prompt — Hotfix: Lesson runner + Oppimispolku layout, kokokorjaus, jumitus-fix + Batch 1 regenerointi

> Iso hotfix L-COURSE-1:n jälkeen. Useita käyttäjälle näkyviä bugeja ja layout-virheitä jotka tekevät Oppimispolusta käyttökelvottoman. Tämä on Puheon **päätuote** — ei voi olla rikki.
> Lisäksi Batch 1:n sisältö on ~5x liian vähän tehtäviä L-tasolle, joten regeneroidaan se.
> Yksi loop, useita committeja, kaikki yhdellä istunnolla. Älä lähde scope creepiin — keskity tähän listaan.

---

## Lue ensin

1. `AGENT_PROMPT_STANDARDS.md` — tavanomaisesti
2. `js/screens/lessonRunner.js` ja `css/components/lesson-runner.css` (luotu L-COURSE-1:ssä)
3. `js/screens/curriculum.js` ja `css/components/curriculum.css` (Oppimispolku-näkymä)
4. `app.html` — `#screen-lesson-runner` + `#screen-curriculum` rakenteet
5. `css/components/app-shell.css` — main + side-rail layout, hahmota miten näkymät istuvat kokonaisuuteen
6. `js/lib/lessonAdapter.js` — L-COURSE-1:ssä luotu, normalisoi vanhat ja uudet vastaukset
7. Auditin lähtötila: `AUDIT_LIVE_DASHBOARD.md` — Oppimispolku-näkymä toimi auditin aikaan, joten tämä on **regressio L-COURSE-1:stä**

---

## Bugi-raportti (käyttäjältä, 2026-05-04)

Käyttäjä testasi L-COURSE-1:tä localhostilla heti shippauksen jälkeen. **Useita kriittisiä ongelmia ~1 minuutin testauksessa**:

### Bugi 1 — Oppimispolku-näkymä rikki, vaatii zoom 67%

100% zoomilla (oletus) Oppimispolku-listan kortit työntyvät niin oikealle että iso osa jää näkyvistä. Käyttäjän pitää zoomata 67%:iin nähdäkseen koko näkymän. Tämä on absurdia — sivun pitää sopia 100% zoomille.

Lisäksi vasen puoli näkymästä (sidepalkin ja kurssi-listan välinen tila) on **isolta osin tyhjä** — Oppimispolku-lista vie vain ~35-40% leveydestä, loput on mustaa tilaa.

Käyttäjän raportin mukaan Oppimispolku on Puheon päätuote ja sen tulisi vaikuttaa siltä — täyttää ruudun, dominoida visuaalisesti. Nyt se näyttää pieneltä sivuhuomautukselta.

### Bugi 2 — "Ladataan oppituntia..." jää jumiin paluusivulla

Kun käyttäjä avaa oppitunnin ja palaa "Takaisin Oppimispolkuun" (tai navigoi muuten takaisin), Oppimispolku-näkymässä Kurssi 1:n kortti näyttää "Ladataan oppituntia..." -tekstiä **eikä koskaan vaihdu** ladatuksi tilaksi. Käyttäjän pitää reload sivu nähdäkseen oikean tilan.

Tämä on regressio L-COURSE-1:stä. Todennäköisesti `loadCurriculum()`-funktiossa loading-tila ei vapaudu kun adapter normalisoi datan, tai jossain on race condition.

### Bugi 3 — Lesson runner: side-panel renderöityy keskellä/oikealla yläkulmassa, ei oikealla sivupalkkina

Kun käyttäjä avaa oppitunnin, lesson runner -näkymä rikkoo:
- Side-panel-tabit (Sanasto, YO-vinkki, Opetussivu) renderöityvät **kelluvina painikkeina top-barin alueella**, ei side-panelin sisäisinä tabbeina
- Side-panelin sisältö (sanasto-lista) renderöityy ruudun **oikeassa yläkulmassa**, irrallaan
- Tehtävä-alue jää vasempaan keskelle — ei skaalaudu kun panel on auki

### Bugi 4 — Side-panel overlappaa profiilipainikkeen

Top-barissa olevat side-panelin tabit (Sanasto, YO-vinkki, Opetussivu) **peittävät** käyttäjän profiilipainikkeen (TE-kuvake). Z-index-konflikti.

### Bugi 5 — Tehtävä-alue liian pieni Oppimispolun päätuotteena

Vaikka Bugit 3 ja 4 olisi korjattu, tehtäväkortti itse on visuaalisesti vaisu:
- Kortti vie ~30% leveydestä, ~25% korkeudesta
- Kysymys-fontti pieni (~18px)
- Vastaus-input pieni
- Padding kortin sisällä riittävä, mutta KORTTI ITSE on liian pieni

Vertaile Duolingo, Babbel, Quizlet — niissä tehtäväkortti on **näkymän pääsisältö**, dominoi tilan.

### Bugi 6 — Batch 1:n sisältö 5x liian vähän tehtäviä L-tasolle

Batch 1:n raportti: 5 oppituntia, 21 vaihetta yhteensä (4-5 per oppitunti), 108 tehtäväyksikköä yhteensä = ~21 tehtävää per oppitunti.

L-tason oppilas tarvitsee 9-10 vaihetta ja **90-120 tehtäväyksikköä per oppitunti**. Tämä on Puheon brand-promise YO-koevalmennuksena — L-tavoite-oppilaalle pitää tarjota kunnon työkuorma joka vastaa Otavan/Edukustannuksen YO-valmennusoppikirjojen tasoa.

Käyttäjä on päivittänyt `PROMPT_GENERATE_LESSON.md`-promptin uusilla target_grade-skaalaussäännöillä (vaiheiden määrä, tehtävien määrä per vaihe). Batch 1 pitää **regeneroida** näiden uusien sääntöjen mukaan.

---

## Skills + design plugins käyttöön

- `puheo-screen-template` — KAIKKI näkymät noudattavat tätä reseptiä, layout grid + spacing + breakpointit
- `ui-ux-pro-max` — typography-skaala, kontrasti, focus management, z-index-skaala, motion
- `design:design-critique` — Playwright-screenshotit @ 1920 + 1440 + 1024 + 768 + 375 ENNEN ja JÄLKEEN
- `design:accessibility-review` — pakollinen jälkeen
- `design:taste-frontend` jos saatavilla — KAIKKI muutokset

**21st.dev sourcing — pakollinen näille:**

| Komponentti | Hakusanat |
|---|---|
| Lesson runner: split-pane (tehtävä + side-panel oikealla) | `21st.dev/s/split-pane`, `21st.dev/s/side-panel`, `21st.dev/s/drawer`, `21st.dev/s/help-panel` |
| Lesson runner: tehtäväkortti dominoiva, ilmava | `21st.dev/s/quiz-card`, `21st.dev/s/lesson-card`, `21st.dev/s/exercise-screen`, `21st.dev/s/flashcard` |
| Side-panelin sisäiset tabit | `21st.dev/s/tabs`, `21st.dev/s/pill-tabs` |
| Bottom sheet mobiilille | `21st.dev/s/bottom-sheet`, `21st.dev/s/mobile-drawer` |
| Oppimispolku: kurssi-kortti laaja, expand-tila | `21st.dev/s/course-card`, `21st.dev/s/learning-path`, `21st.dev/s/timeline-card`, `21st.dev/s/journey-card` |

Käytä Duolingon ja Babbelin desktop-screenshotteja vertailupisteenä **erityisesti tehtäväkortille ja Oppimispolku-listalle**. Cite EXACT URLit IMPROVEMENTS.md-rivissä.

---

## Tehtävä — kuusi fixiä yhdessä loopissa

Suositusjärjestys:
1. Bugi 2 (jumitus) ensin koska se estää testauksen
2. Bugi 1 (Oppimispolku-mitoitus)
3. Bugit 3+4+5 (lesson runner kerralla)
4. **Bugi 6 (Batch 1 regenerointi) viimeisenä** koska se vaatii että UI-puoli toimii ennen kuin sisältöä voi testata kunnolla

### Fix 1 — "Ladataan oppituntia..." jumi (Bugi 2)

Etsi `js/screens/curriculum.js` `loadCurriculum()` tai vastaava funktio joka renderöi kurssi-kortit + niiden oppitunti-listat.

Tarkista:
- Onko async-funktiossa `try/finally`-blokki joka asettaa `isLoading = false`?
- Mistä L-COURSE-1:n adapteri saa kurssin oppitunti-data — jos uusi rakenne (`payload.phases`-pohjainen) palautetaan kurssi-tason endpointista vahingossa, parser saattaa jämähtää
- Onko race condition: jos käyttäjä klikkaa nopeasti useaan kurssiin, vanha pyyntö palauttaa loading-tilan vaikka uusi pyyntö meni läpi
- Onko event listener joka cancel-aborttaa edellisen latauksen kun navigoidaan toiseen kurssiin

Kirjoita yksinkertainen testi `tests/e2e/curriculum-back-navigation.spec.js`:
1. Avaa Oppimispolku
2. Klikkaa Kurssi 1
3. Avaa oppitunti 1
4. Klikkaa "Takaisin"
5. Assert: Kurssi 1 -kortin oppitunti-lista renderöityy **ilman** "Ladataan oppituntia..." -tekstiä 2 sekunnin sisällä

### Fix 2 — Oppimispolku-näkymä laajemmaksi (Bugi 1)

Tämä on Puheon päätuote. Sen pitää dominoida näkymää.

Tarkista nykyinen layout:
- Mihin Oppimispolku-näkymä on nykyiset reunat (max-width, padding)?
- Miksi ruutu jää vasemmalta tyhjäksi 100%-zoomilla? Onko `margin-left: auto`-ongelma vai sidepalkin huomiointi väärin?

Korjaa siten että:
- **Desktop ≥ 1440px:** Oppimispolku-näkymä täyttää viewportin keskittäen sisällön. Max-width esimerkiksi 1280px tai 1400px (tarpeeksi iso että kurssi-kortit hengittävät, ei niin iso että teksti rikkoutuu). Padding 32-48px joka puolelta.
- **1024-1439px:** Sopiva sopeutuminen, kortti-leveys 100% saatavilla olevasta tilasta.
- **768-1023px:** Mobile-tablet, kortit pinottuvat siisti pystysarakkeena.
- **≤ 767px:** Mobile gutterilla 16px.

Kurssi-kortit itse:
- "Aktiivinen" kortti (Kurssi 1, jota käyttäjä etenee) on selvästi **suurempi** kuin lukitut kortit. Se on näkymän hero. Sen sisällä oppitunti-lista on auki näkyvissä.
- Lukitut kurssit ovat pienempiä (mutta yhä luettavia), pinottuna alle.
- Kurssi 1:n kortti voi olla esimerkiksi 1.5x-2x suurempi tekstikoolla / paddingilla kuin lukitut.

Sourcaa 21st.dev:stä `course-card`, `learning-path`, `journey-card` -hakusanoilla referenssiä. Vertaile Duolingon learning path -näkymää.

### Fix 3 — Lesson runner: side-panel oikealle (Bugi 3)

CSS Grid tai flexbox split-pane:
- **Desktop ≥ 1024px** (panel suljettu): tehtävä-alue 100% leveydestä, max-width ~960px keskellä
- **Desktop ≥ 1024px** (panel auki): split 70/30 tai 65/35 tehtävä/panel
- **Tablet 768-1023px** (panel auki): split 60/40
- **Mobile ≤ 767px** (panel auki): bottom sheet, slide-up animaatio (ei split)

Sourcaa 21st.dev split-pane / drawer / help-panel -pohja.

### Fix 4 — Tabit side-panelin sisällä, eivät top-barissa (Bugi 3 + 4)

Sanasto, YO-vinkki, Opetussivu -tabit ovat **side-panelin sisäisiä**, näkyvissä **vain kun panel on auki**. Top-barissa on yksi "Apua"-painike (tai "Avaa apua") joka avaa side-panelin.

Top-barissa profiilipainikkeen viereen vähintään 16px gap "Apua"-painikkeesta. Z-index: top-bar > side-panel kun panel on bottom sheet (mobile), side-panel ja tehtävä-alue samalla z-index:llä split-paneessa (desktop).

### Fix 5 — Tehtäväkortti dominoiva, isompi (Bugi 5)

Kohdedimensiot **panel suljettu, desktop ≥ 1440px**:
- Tehtäväkortti max-width: 880-960px
- Min-height: 520px (tunnistettavasti pää-sisältö, ei sivuhuomautus)
- Padding sisällä: 48-64px (luksusta ilmaa)
- Margin yläosassa: ~80-100px (vaihe-otsikon yläpuolella tilaa)

Fontti-skaala (käytä `ui-ux-pro-max` + `puheo-screen-template` -tokeneita, ei raakaa px):
- Vaihe-otsikko ("Lauseen täydennys", "Tunnista — perhesanat"): `--text-3xl` tai vastaava ~28-32px
- Vaihe-ohje ("Täydennä lause oikealla sanalla"): `--text-base` ~16-18px
- Kysymys / sentence-stem: `--text-2xl` ~22-26px (input-kentät tarpeeksi suuria)
- Vastausvaihtoehdot / input-text: ~18-20px
- KYSYMYS X / Y -metadata: caps + letter-spacing pieni (12-13px)

**Panel auki:** kortti automaattisesti pienempi (60-70% leveydestä), mutta kaikki paddingit ja fontit säilyvät.

**Mobile @ 375px:** kortti täyttää viewportin (16px gutters), fontit aavistus pienemmät mutta yhä isot ja luettavat.

### Fix 6 — Regeneroi Batch 1 uusilla target_grade-skaalaussäännöillä

`PROMPT_GENERATE_LESSON.md` on päivitetty käyttäjän toimesta. Nykyinen Batch 1 (5 tiedostoa `data/courses/kurssi_1/lesson_1.json` ... `lesson_5.json`) on liian niukka — vain ~21 tehtävää per oppitunti, kun L-tavoite vaatii 90-120.

**Tee:**
1. Lue päivitetty `PROMPT_GENERATE_LESSON.md` kokonaisuudessaan — erityisesti uudet osiot:
   - "Sanasto-listan koko — skaalautuu target_grade-keskiarvon mukaan" (vocab 25-35 sanaa L-tasolle)
   - "Vaihe-rakenne — education-skillit määräävät TYYPIT, tämä prompti määrittää MÄÄRÄT" (9-10 vaihetta vocab-oppituntiin L-tasolle, 12-15 tehtävää per recognition_mc-vaihe)
2. Lue ja sisäistä education-skillit jotka prompti listaa (practice-problem-sequence-designer, retrieval-practice-generator, jne.)
3. **Päällikirjoita** kaikki 5 tiedostoa `data/courses/kurssi_1/lesson_{1..5}.json` uusilla isommilla sisällöillä:
   - lesson_1 (vocab "Perhe ja kansallisuudet"): 9-10 vaihetta, 90-120 tehtäväyksikköä, 25-35 sanaa sanastoon
   - lesson_2 (grammar "-ar-verbit preesensissä — säännöllinen taivutus"): 9-10 vaihetta, 90-120 tehtäväyksikköä
   - lesson_3 (grammar "-er- ja -ir-verbit preesensissä"): 9-10 vaihetta, 90-120 tehtäväyksikköä
   - lesson_4 (vocab "Koulu ja värit"): 9-10 vaihetta, 90-120 tehtäväyksikköä
   - lesson_5 (mixed "Ser vs estar — perusteet"): 10-11 vaihetta, 100-130 tehtäväyksikköä
4. Aja `npm run validate:lessons` — exit 0
5. Päivitä side-panelin `vocab`-tabin `content_md` kattamaan koko sanasto (Kurssi 1 lesson 1 esim. 30+ sana-paria, ryhmiteltynä "Perhe — ydin", "Perhe — laajempi suku", "Kansallisuudet — yleiset", "Kansallisuudet — laajemmin")
6. Yhtenäisyys aiempaan: säilytä Batch 1:n tyyli (suomenkielinen sävy, esimerkkien rytmi), vain määrät kasvavat

**Älä:** generoi muita oppitunteja kuin nämä 5. Tämä on regenerointi, ei laajennus. Loput oppitunnit generoidaan myöhemmin Batch 2 + 3 yhteydessä.

---

## Verify (kaikki viisi fixiä)

### Bugi 2 — Jumitus
- E2E: avaa Kurssi 1 → oppitunti 1 → takaisin → Kurssi 1:n oppitunti-lista latautuu < 2s, ei "Ladataan oppituntia..." -tekstiä
- Manuaalitesti useaan kertaan: navigaatio toimii ilman jumia

### Bugi 1 — Oppimispolku-mitoitus
- 1920px viewport: Oppimispolku-näkymä keskellä, max ~1400px, paddingit selkeät, ei ylivuotoa oikealle
- 1440px: täyttää viewportin keskittäen, ei tyhjää tilaa vasemmalla
- 1024px: kortit täyttävät leveyden
- 375px: kortit pinotussa pystysarakkeessa, gutters 16px
- Kurssi 1:n (aktiivinen) kortti **selvästi isompi** kuin lukitut (Kurssi 2-8)

### Bugit 3+4 — Lesson runner side-panel
- Tehtävä-alue + side-panel split 70/30 desktopilla, kun panel auki
- Side-panelin tabit näkyvät VAIN side-panelin sisällä, eivät top-barissa
- Profiilipainike (TE) näkyvissä top-barissa, ei overlapia
- "Apua"-painike top-barissa erillään profiilipainikkeesta (≥16px gap)
- Mobile: bottom sheet slide-up, ei split

### Bugi 5 — Tehtäväkortti
- Tehtäväkortti dominoi näkymää, ei piene laatikko vasemmassa yläkulmassa
- Kysymys-fontti ≥22px desktopilla
- Riittävä padding kortin sisällä (≥48px)
- Hengittävä margin kortin yläpuolella

### Bugi 6 — Batch 1 regenerointi
- `npm run validate:lessons` exit 0
- Jokainen 5 tiedostoa sisältää 9-10 vaihetta (vocab/grammar) tai 10-11 (mixed)
- Tehtäväyksiköitä JSON:in `items[]`-array:eissa yhteensä **yli 90** per oppitunti
- Sanasto-lista (`vocab[]`) sisältää 25-35 sanaa vocab-oppituntiin
- Side-panelin Sanasto-tabi listaa koko sanaston ryhmiteltynä
- Yhtenäisyys: tyyli säilynyt, vain määrät kasvaneet

### Yleiset
- `design:design-critique` 5 viewporttia (1920, 1440, 1024, 768, 375), molemmista näkymistä (Oppimispolku + lesson runner)
- `design:accessibility-review` 0 violations
- Tests: `npm test` 1067/1067 ✓ + uusi E2E
- `node --check` clean kaikki muokatut JS-tiedostot
- Manuaalitesti localhostilla 100% zoomilla — kaikki näkymät mahtuvat ilman zoom-kompensointia
- **Käyttäjän loppumanuaalitesti:** avaa Kurssi 1 lesson 1 (regeneroitu) Pro-tunnuksilla `target_grade: L` → tehtäväyksiköitä on selvästi enemmän kuin aikaisemmin, oppitunti kestää realistisesti 20-30 min L-tasolla

---

## Commit-konventio

Erilliset commitit per fix-ryhmä:
- `fix(curriculum): clear loading state on lesson back-navigation [hotfix bug 2]`
- `fix(curriculum): widen oppimispolku to fill viewport, scale active course card [hotfix bug 1]`
- `fix(lesson-runner): side-panel right layout, tabs inside, no profile overlap [hotfix bug 3+4]`
- `fix(lesson-runner): scale up task surface to feel like primary product [hotfix bug 5]`
- `feat(content): regenerate kurssi_1 lessons 1-5 with target_grade scaling [hotfix bug 6]`

Push → Vercel deploy → käyttäjä testaa kaikki kuusi.

## Mitä EI saa tehdä

- ÄLÄ refaktoroi koko lesson runneria
- ÄLÄ koske JSON-skemaan tai backend-endpointteihin
- ÄLÄ generoi MUITA kuin Batch 1:n 5 oppituntia (Bugi 6) — Batch 2+3 tulevat erikseen myöhemmin
- ÄLÄ muuta tehtävän logiikkaa (mc / typed / gap_fill -komponentteja) — vain layout + tyypografia
- ÄLÄ koske mastery-bannereihin tai vaihe-progression logiikkaan
- ÄLÄ koske dashboard-näkymään tai muihin sivuihin (tämä on hotfix, ei iso loop)
- ÄLÄ keksi uutta UI-komponenttia ilman 21st.dev-sourcing-passia

## Lopuksi

Raportoi käyttäjälle:
- Mitkä 5 bugia korjattu, missä commiteissa
- Screenshotit ennen/jälkeen kaikista 5 viewportista
- Manuaalitesti-tulokset (toimiiko 100% zoom?)
- Onko vielä regressioita joihin törmäsit testauksessa
