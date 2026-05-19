# Next session prompt — paste this verbatim

---

Olet jatkamassa Puheo-projektia (espanjan/ranskan/saksan lyhyt-oppimäärän
YO-koevalmennus). Edellinen istunto teki ison arkkitehtuuri-pivot:in
**mode-first**-hierarkiaan PRs #109–#115. Nyt **referenssi-rakenne on
päivitetty**: malli on **Otava Fokus 7 (LOPS21) Digikirja** — kolmen
paneelin layout teoriasivu + numeroidut tehtävät + kääntökortit + testit.

## Lue ENSIN nämä

1. `memory/MEMORY.md` — käy läpi feedback-* ja project-* tiedostot.
   Erityisen tärkeät:
   - `project_mode_first_hierarchy.md` — nykyinen flow HOME → mode-cards →
     oppimispolku-index → course-detail → lesson + deprecoidut osat
   - `feedback_design_direction_eduix_old_spain.md` — Old-Spain palette +
     anti-AI-slop -checklist. **Lue ENNEN ekaa UI-PR:ää.**
   - `project_open_issues_2026_05_19.md` — hand-off lista
   - `feedback_user_does_not_code.md`, `feedback_auto_push_workflow.md`,
     `feedback_skip_measurement_gates.md`, `feedback_humanizer_required.md`
2. Tämän tiedoston **alempana** oleva **Otava Fokus 7 -malli** — se on
   sitova rakenne-spec
3. CLAUDE.md — skill-stack pakollinen ennen Write/Edit/Bash-kutsuja

## P0 — Bugit jotka pitää selvittää HETI

### 1. Asetukset + Oma profiili eivät VIELÄKÄÄN avaudu (vahvistettu 2026-05-19 lopussa)

Sidebar-klikkaus ei aukaise screen-settings tai screen-profile. PR #114
poisti confirmDialog-gaten mikä saattoi blokata, mutta bug pysyy. **Pyydä
käyttäjältä browser devtools console -screenshot kun klikkaa "Asetukset"
tai sidebar-user-painiketta.** Sieltä näkyy onko lazy-loader importti
404, throwaako initSettings, vai estääkö joku CSS click-eventin.

### 2. Punainen viiva aloitus-sivulla (screenshot 224754)

Sidebar-itemin (Aloitus) vasemmassa reunassa näkyy punainen pystyviiva
joka bleeditää ulos rivistä. Tarkista `.sidebar-item.active::before` ja
`.path-toc__item.is-active::before` ja `.op-row.is-progress::before` —
jokin näistä ::before-pseudoista työntyy `left: -X` -arvolla parent-
border:in ulkopuolelle ja sidebarissa näkyy hairline-pala.

### 3. Vahvista että #screen-path -kill toimii live-Vercelillä

PR #113 + #114 hidetti `display:none-CSS:llä` + redirektoi loadDashboard →
loadHome. Käyttäjä saattaa vielä nähdä rikkonaisen "SISÄLLYS Ladataan… /
Aloita päivän treeni 20 SANAA · 5 MIN" -näkymän jos cache on stale.
Pyydä hard refresh + verify; jos vielä toistuu, etsi mikä koodipolku
ohittaa redirektin.

---

## ISO PROJEKTI — Otava Fokus 7 -mallin mukaiseksi (käyttäjän brief 2026-05-19)

### Tavoite

Replikoida Otava Fokus 7 LOPS21 Digikirjan rakenne YO-espanjan
kertaussivustolle. Esim. Kurssi 2 → Oppitunti 3 → Subjuntiivi sisältää
teoriasivun + vasemman sivupaneelin tehtävälistan.

### Yleisrakenne (3-paneelinen layout)

**Yläpalkki (TopBar)**
- Vasen: Logo/paluulinkki ("Palaa etusivulle"), Etusivu-linkki,
  hampurilaisvalikon toggle
- Keski: Sivun otsikko (esim. "YO Espanja Kertaus | Subjuntiivi")
- Oikea: Sanakirja, Haku, Analytiikka, Opas, Sivuvalikko-painike

**Vasen sivupaneeli (Sisällysluettelo / Tehtävälista) — kollapsoituva**
- Listaa oppitunnin kaikki sivut yhdellä silmäyksellä
- ENSIMMÄINEN ITEM = **teoriasivu** (esim. "Subjuntiivi")
- Sitten numeroitu lista tehtäviä: "1 Muodosta verbimuotoja", "2a Yhdistä",
  "2b Täydennä", "3a…", jne. Paritehtävät erottuvat a/b-merkinnällä.
- Lopussa: **Kääntökortit** (flashcards) eri aihealueista
- Lopussa: **Testit** ("Test 1a Käännä", "Test 2 Valitse"...)
- Aivan lopussa: **"Arvioi omia taitojasi"** -itsearviointi
- Aktiivinen sivu korostuu sivuvalikossa

**Pääsisältöalue (Main content)**
- Sivunumeromerkintä (esim. "s. 191–194")
- Otsikko (H1)
- Teoriatekstit + esimerkkilauseet **kaksikielisinä taulukoina**
  (espanja | suomi)
- Alaotsikot (esim. "Indikatiivin ja subjuntiivin vertailu")
- **"Obs!"-laatikot** huomioille / poikkeuksille (eri taustaväri)
- Vertailutaulukoita
- **Edellinen/Seuraava-sivu -navigointi sekä YLÄ- että ALAOSASSA**
- Kommentointialue (myöhemmin)

### Sivutyyppien kategoriat

1. **Teoriasivu** — sääntöjä, esimerkkejä, taulukoita
2. **Harjoitustehtävät** numeroituna (1, 2a, 2b, 3a, 3b...) — täydennys,
   yhdistäminen, kääntäminen, paritehtävät, kirjoitustehtävät
3. **Kääntökortit / Flashcardit** sanaston harjoitteluun
4. **Testit** (Käännä, Yhdistä, Valitse)
5. **Itsearviointi**

### Hierarkinen reitti-rakenne

```
Etusivu
 └─ Kurssi 2 (YO Espanja Kertaus)
    └─ Oppitunti 3 (Subjuntiivi)
        ├─ Teoriasivu (oletus)
        ├─ 1 Muodosta...
        ├─ 2a Yhdistä
        ├─ 2b Täydennä
        ├─ ...
        ├─ Kääntökortit 1–5
        ├─ Test 1a, 1b, 2, 3
        └─ Arvioi omia taitojasi
```

URL-malli: `/kurssi/:kurssiId/oppitunti/:oppituntiId/:sivuId`
Eli laajennettava Puheo:n nykyinen `#/oppitunti/{lang}/{kurssi}/{n}` →
`#/oppitunti/{lang}/{kurssi}/{lessonId}/{sivuId}`.

### Keskeiset UI-komponentit

| Komponentti | Tehtävä |
|---|---|
| `TopBar` | Kiinteä yläpalkki kurssin nimellä ja työkalupainikkeilla |
| `SideMenu` | Kollapsoituva sivuvalikko (toggle), aktiivinen sivu korostettuna |
| `LessonContent` | Pääsisältöalue, vaihtuu URL:n mukaan |
| `BilingualTable` | Espanja/suomi-vertailutaulukko (2 saraketta) |
| `InfoBox` ("Obs!") | Korostettu huomiolaatikko |
| `ExerciseCard` | Tehtäväkomponentti (gap-fill, matching, multiple-choice, translate) |
| `Flashcard` | Käännettävä kortti (etupuoli/takapuoli) |
| `PrevNext` | Navigointipainikkeet sivun ylä- ja alaosassa |
| `ProgressIndicator` | Analytiikka / edistyminen |
| `SelfAssessment` | Itsearviointilomake |

### Tietorakenne (JSON)

```json
{
  "kurssit": [
    {
      "id": "kurssi-2",
      "nimi": "YO Espanja Kertaus",
      "oppitunnit": [
        {
          "id": "oppitunti-3",
          "nimi": "Subjuntiivi",
          "sivut": [
            { "id": "teoria", "tyyppi": "teoria", "otsikko": "Subjuntiivi", "sisalto": "..." },
            { "id": "1", "tyyppi": "tehtava", "alatyyppi": "muodosta", "otsikko": "1 Muodosta verbit" },
            { "id": "2a", "tyyppi": "tehtava", "alatyyppi": "yhdista", "otsikko": "2a Yhdistä" },
            { "id": "2b", "tyyppi": "tehtava", "alatyyppi": "taydenna", "otsikko": "2b Täydennä" },
            { "id": "kortit-1", "tyyppi": "flashcards", "otsikko": "Kääntökortit 1" },
            { "id": "test-1a", "tyyppi": "testi", "alatyyppi": "kaanna", "otsikko": "Test 1a Käännä" },
            { "id": "arvio", "tyyppi": "itsearviointi", "otsikko": "Arvioi omia taitojasi" }
          ]
        }
      ]
    }
  ]
}
```

Skaalata `data/courses/{lang}/kurssi_N/lesson_M.json` → uusi `sivut`-array
joka sisältää teoria + tehtävät + kortit + testit + itsearvio.

### UX-periaatteet (Otavan toteutuksesta)

1. **Sivuvalikon auki/kiinni-toggle** — käyttäjä voi keskittyä sisältöön
2. Teoriasivu on AINA oppitunnin **ensimmäinen** sivu
3. Tehtävät numeroitu johdonmukaisesti (1, 2a, 2b, 3a…), paritehtävät
   erottuvat a/b-merkinnällä
4. **Edellinen/Seuraava**-navigointi sekä ylä- että alaosassa
5. Esimerkit aina kaksikielisinä taulukoissa (lähdekieli vasemmalla,
   suomi oikealla)
6. **"Obs!"-laatikot** poikkeuksille ja muistisäännöille
7. Aktiivinen sivu korostuu sivuvalikossa
8. Sivunumero näkyy (esim. "s. 191–194") jos viitataan painettuun kirjaan

### Toteutusjärjestys (PR-sequence)

**PR 1** — pohjarakenne: TopBar + SideMenu + LessonContent layout +
              routing `/oppitunti/{lang}/{kurssi}/{lesson}/{sivu}`,
              sivuvalikon toggle. Käytä yhden oppitunnin testidata
              ("Subjuntiivi") hardcodattuna.

**PR 2** — Teoriasivu-komponentti + BilingualTable + InfoBox ("Obs!")
              + PrevNext-navigointi.

**PR 3** — SideMenu:n aktiivinen-tila + scroll-to-active + kollapsoitu
              tila persistoituu localStorage:en. Sivu-tyyppi-glyphit:
              teoria 📖, tehtävä 📝, kortit 🃏, testi ✓, arvio ⭐.

**PR 4** — ExerciseCard-komponentti, yksi tehtävätyyppi kerrallaan.
              Aloita gap-fill ja matching (ne meillä on jo lessonRunneriin).

**PR 5** — Flashcard-komponentti (etupuoli/takapuoli, käännettävä,
              localStorage-tila per kortti: "tiedän" / "harjoittele
              vielä"). 5 korttipakkaa per oppitunti.

**PR 6** — Testit (Käännä, Yhdistä, Valitse) — vaikuttavat samalta kuin
              ExerciseCardit mutta pisteytys + lopputulos näytetään
              testin jälkeen, ei live-feedbackia per kohta.

**PR 7** — Itsearviointi-lomake: 4-5 kohtaa
              ("Hallitsen subjuntiivin perussäännöt", asteikko 1-5).
              Lähetä Supabaseen.

**PR 8** — localStorage-tallennus edistymiselle (oppitunnin sivu-progressi,
              flashcard-tilat, test-tulokset). Synkkaa Supabaseen
              kirjautuneille.

**PR 9** — Lisää oppitunteja: 3 parallel sonnet-agenttia generoivat
              sisältöä Subjuntiivin lisäksi (Preteriti vs imperfekti, Ser
              vs Estar, Konditionaali, Persoonapronominit, Refleksiiviverbit).
              Per lesson: teoria + 6-10 tehtävää + 1-2 flashcard-pakkaa +
              1-2 testiä + itsearvio. Output `data/courses/es/...`-jsoneihin.

### Tekninen stack — pysytään nykyisessä (EI React)

Käyttäjän brief mainitsi React/Vite/TS/Tailwind/Zustand, mutta meillä on
**vanilla JS + ES-modules + esbuild + omat tokens.css/Old-Spain**.
Älä uudelleenkirjoita stäkkiä — replikoi rakenne nykyisellä infrallä:

- `js/screens/lessonRunner.js` saa sivu-tyypin: teoria | tehtava |
  flashcards | testi | arvio. RenderItem-dispatcher case per tyyppi.
- `js/screens/lessonRunner.js renderLessonTOC` lisää teoria-rivin ENSIN
  + flashcards-rivit lopuksi + testi-rivit + arvio-rivin.
- Uusi komponenttitiedosto `js/features/bilingualTable.js` +
  `js/features/infoBox.js` + `js/features/flashcard.js` + uusi tyyli
  `css/components/digikirja.css` (TopBar, SideMenu, content widths).
- Tietorakenne `data/courses/{lang}/kurssi_N/lesson_M.json` laajenee
  `sivut`-arraylla. Backwards-compat: jos `sivut` puuttuu, fallback
  vanhaan phase-renderiin.

---

## Sääntöjä koko sessiolle

- **Anti-AI-slop checklist** ennen ekaa Write:ia
- **Auto-push workflow**: `auto/<slug>` branch → `gh pr create` →
  `gh pr merge --squash --delete-branch --admin`
- **Bump sw.js** STATIC_ASSETS-muutoksissa
- **node --check** ennen committia
- **Älä lisää uutta sidebar-nav-itemiä** — vain Aloitus + Asetukset +
  Logout
- **Älä lisää "Lopetetaanko"-modaalia takaisin**
- **Käyttäjä ei koodaa**; älä pyydä lue/kirjoita-komentoja
- **Skip per-step measurement gates**: ship koko queue chain:ina
- **Humanizer** kaikkeen suomenkieliseen UI-tekstiin

---

Aloita lukemalla muistit. Korjaa P0 #1-#3 ENSIN (Asetukset bug + punainen
viiva + #screen-path verify). Sitten kysy käyttäjältä haluaako aloittaa
PR 1:n (pohjarakenne) heti vai katsella ekat korjaukset live.
