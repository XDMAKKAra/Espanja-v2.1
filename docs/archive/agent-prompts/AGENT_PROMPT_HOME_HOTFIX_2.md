# L-HOME-HOTFIX-2 — etusivun layout, YO-valmius-data, Opetussivu-napin uudelleenkäyttö

> Lue ENSIN: `AGENT_PROMPT_STANDARDS.md` ja `AGENT_STATE.md` (juuressa). Loop-merkintä `AGENT_STATE.md`:hen on max 7 riviä (STANDARDS §7).
>
> **Tausta:** Hotfix #18 yhdisti Oma sivun ja Oppimispolun `screen-path`:iin, mutta layout, dataintegriteetti ja UX-yksityiskohdat ovat rikki. Tämä loop korjaa ne. **ÄLÄ poista mitään olemassa olevaa rakennetta** — tämä on chirurginen korjaus, ei refaktori.

---

## 1. Konteksti — kolme dokumentoitua bugia ja yksi UX-parannus

Käyttäjän tuotantotesti 4.5.2026 (https://espanja-v2-1.vercel.app, testpro123-tili, viewport ~1456×816) paljasti:

### Bug A — Layout: sisältö on vasemmassa keskellä, oikea puoli on tyhjä

`#screen-path` näyttää nyt:
- Vasemmassa yläkulmassa: `dash-greeting__streak` chip ("2 PÄIVÄN PUTKI") yksinään kapeana ~660 px sarakkeena
- Sen alla: "Kertaa nyt — 35 korttia" valkoinen nappi, sama leveys
- Sen alla: "Oppimispolku" -otsikko + kurssikortit ~640 px sarakkeena
- **Sivun oikea kolmannes (~500 px) on täysin tyhjää.** Sisältö ei keskity, ei käytä `--w-desktop`-leveyttä, eivätkä viimeisimmät harjoitukset / kehityskäyrä asetu desktop-grididin oikeaan palstaan.

**Juuri:** `.path-inner` on `max-width: var(--w-desktop); width: 100%;` (`style.css` ~r4071), mutta `screen-path` itse ei keskitä. Lisäksi uudet komponentit (greeting, day-cta, kurssikortit, yo-readiness, recent+chart) eivät käytä `dash-grid-row`-luokkaa joka tarjoaa 2-palsta-layoutin desktopilla (`css/components/dashboard.css` r130–142).

### Bug B — YO-valmius näyttää 20 % vaikka käyttäjä on tehnyt 1/10 oppituntia

Screenshotissa näkyy "20 % valmius · 3 / 14 osa-aluetta hallinnassa · alkuvaiheessa" samalla kun kurssikortti yläpuolella sanoo "1 / 10 oppituntia" eikä käyttäjä ole edennyt mihinkään muuhun kurssiin.

**Juuri:** `dashboard.js`:n `map.readinessPct` (r1431–1472) laskee SR-mastery-dataa eri kategorioista (sanasto/kielioppi/luetun ymm./kirjoitus per taso), JOKA SISÄLTÄÄ vanhan harjoitteludatan ennen kurssipolun käyttöönottoa. Datalähde on epäkoherentti kurssin edistymisen kanssa. Käyttäjä näkee yhdellä sivulla kaksi numeroa jotka ovat ristiriidassa.

**Mitä tehdään:** korvaa YO-valmius-osion datalähde **kurssin edistymisellä** (suoritetut oppitunnit / kaikki oppitunnit kaikissa kursseissa). Tämä on yksiselitteistä ja matchaa mitä käyttäjä näkee kurssikorteissa. Säilytä SR-mastery-data sisäisesti adaptive engineä varten, mutta ÄLÄ näytä sitä YO-valmiutena.

Uusi laskukaava:
```
readinessPct = round(100 * completed_lessons / total_lessons_across_all_courses)
masteredCells = total mastered courses (kurssin kaikki oppitunnit suoritettu)
totalCells = 8 (kurssit) — EI 14
```

Heikot kohdat -lista voi tulla SR-datasta erikseen, se on ok — siellä epäjohdonmukaisuutta on vähemmän.

### Bug C — "Opetussivu"-nappi oikeassa yläkulmassa on dead-end etusivulla

`teachingPanel.js`-trigger renderöityy globaalisti ja näkyy myös `screen-path`-näkymässä, mutta sillä ei ole `lessonFocus`-kontekstia ennen oppitunnin avaamista. Painaminen → "Tämän oppitunnin opetussivu ei ole vielä saatavilla. Voit jatkaa tehtävää."

Käyttäjä ehdotti: **muuta nappi etusivulla "Miten Puheo toimii?" -tutoriaaliksi**. Oppitunnin sisällä se säilyy "Opetussivu"-nappina kuten ennen.

**Mitä tehdään:**
- `teachingPanel.js`:ssä lisää tila-tunnistus: jos `currentScreen === "screen-path"` (tai vastaava etusivu) → muuta napin label "Miten Puheo toimii" ja avaa eri sisältö
- Etusivun panel-sisältö: 4–6 step-tutorial Puheon päämekaniikoista (kurssipolku, oppitunnin vaiheet recognition→recall→application→synthesis, mastery on signaali ei gate, kertaukset SR-pohjainen, YO-valmius ja täyskoe). Käytä `puheo-finnish-voice/SKILL.md` copylle.
- Storage: ei tarvitse omaa tilaa, sisältö voi olla static markdown/HTML `js/features/teachingPanel.js`:ssä tai uudessa `js/features/howPuheoWorks.js`-tiedostossa
- Kun käyttäjä avaa oppitunnin → nappi vaihtuu takaisin "Opetussivu"-tilaan ja näyttää tunnin oman opetussivun (jos olemassa)

### UX-parannus — yksi visuaalinen hierarkia, ei kahta CTA:ta

Screenshotissa "Kertaa nyt — 35 korttia" on isona valkoisena palkkina YLEMPÄNÄ kuin kurssikortit. Tämä antaa väärän viestin: kertaaminen näyttää ensisijaiselta toiminnalta, vaikka kurssipolku on Puheon päämekaniikka.

**Mitä tehdään:**
- Vaihda järjestys: kurssikortit ENSIN, kertaa-CTA toissijaisena
- Tai paremmin: yhdistä Jatka-CTA ja Kertaa-CTA yhdeksi älykkääksi napiksi (kuten edellinen prompti määritteli §2 osio 2)
- Päivän putki -chip ei tarvitse omaa riviä — siirrä se `dash-greeting`-headerin sisään tervehdyksen viereen tai sen alariviin

---

## 2. Mitä EI muuteta tässä loopissa

- ÄLÄ poista `screen-dashboard`-divia jos se on vielä `app.html`:ssä — siihen voidaan viitata route-redirect-koodista
- ÄLÄ koske kurssin sisältöön (`data/courses/**/*.json`)
- ÄLÄ refaktoroi `dashboard.js`:ää kokonaan — vain ne funktiot jotka liittyvät YO-valmiuden laskentaan
- ÄLÄ koske SR-engineen tai adaptive-logiikkaan — vain UI-osio joka näyttää SR-dataa "YO-valmiutena" muuttuu
- ÄLÄ poista `teachingPanel.js`:n oppituntikäyttöä — se säilyy ennallaan, vain etusivu-tila on uusi
- ÄLÄ aja Supabase-migraatioita — kurssin edistymisdata on jo olemassa `user_lesson_progress`-taulussa tai vastaavassa, käytä olemassa olevaa endpointia (todennäköisesti `/api/curriculum/progress` tai `/api/learning-path` — tarkista ensin)

---

## 3. Pakolliset skillit ja workflow

Lue ENNEN koodaamista (STANDARDS §1):

**Puheon omat:**
- `.claude/skills/puheo-screen-template/SKILL.md` — layout, spacing
- `.claude/skills/puheo-finnish-voice/SKILL.md` — uusi tutorial-copy
- `.claude/skills/ui-ux-pro-max/SKILL.md` — a11y

**Education-skillit:**
- `education/cognitive-load-analyser/SKILL.md` — kahden ristiriitaisen YO-valmius-luvun poistaminen, hierarkian selkeyttäminen
- `education/self-efficacy-builder-sequence/SKILL.md` — "Miten Puheo toimii" -tutoriaalin sävy: rohkaiseva, ei hämmentävä

**Design-pluginit:**
- `design:ux-copy` — uusi nappi-label "Miten Puheo toimii", tutoriaalin step-otsikot, päivitetty YO-valmius-summary
- `design:design-critique` — Playwright-screenshotit @ 1440 + 375 ENNEN ja JÄLKEEN
- `design:accessibility-review` — axe-core sweep loop:n päättyessä

**21st.dev-sourcing (STANDARDS §3):**
- "Miten Puheo toimii" -tutoriaali on uusi UI-pattern → sourcaa. Hakusanat: `tutorial`, `onboarding-steps`, `feature-walkthrough`, `step-overlay`, `hint-popover`. Screenshot 2–3 kandidaattia → `references/how-puheo-works/21stdev/`. Cite URL `IMPROVEMENTS.md`-rivissä.
- Layout-korjaukset käyttävät olemassa olevia `dash-grid-row`-, `path-inner`- ja `dashboard-inner`-luokkia → ei sourcing-passia.

---

## 4. Toteutusjärjestys (UPDATEt)

### UPDATE 1 — Bug A: layout-korjaus

Tavoite: sisältö keskittyy ja täyttää `--w-desktop`-leveyden, recent + chart -alarivi käyttää 2-palsta-grididä desktopilla.

Toimenpiteet:
1. Tarkista `app.html`:n `<div id="screen-path"><div class="path-inner">` -rakenne. Onko greeting/day-cta/kurssikortit/yo-readiness/recent+chart `path-inner`:n sisällä? Jos ovat eri wrappereissa, yhtenäistä.
2. `style.css` `.path-inner` (~r4071): tarkista että `max-width: var(--w-desktop); width: 100%; margin-inline: auto;` (lisää `margin-inline: auto` jos puuttuu — tämä keskittää).
3. Käytä `dash-grid-row`-luokkaa (`css/components/dashboard.css` r130–142) wrappina recent + chart -alarivin desktop-2-palsta-layoutille:
   ```html
   <div class="dash-grid-row">
     <section class="recent-exercises">...</section>
     <section class="progress-mini-chart">...</section>
   </div>
   ```
4. Mobile (<768px): kaikki stack pystyssä — `dash-grid-row` collapsoi automaattisesti, ei lisätyötä
5. Tarkista että `padding: 0 8px 48px 0;` `.path-inner`:ssä ei katkaise oikeaa puolta — voi olla syynä että oikea puoli näyttää tyhjältä. Korjaa muotoon `padding: 0 8px 48px 8px;` tai käytä `padding-inline`

Verify: Playwright screenshot 1456×816 + 375×812. Ennen/jälkeen vertailu: oikean puolen tyhjä alue katoaa, sisältö keskittyy, alarivi 2 palstaa desktopilla.

### UPDATE 2 — Bug B: YO-valmius-datan vaihto kurssin edistymiseen

Toimenpiteet:
1. Etsi `routes/curriculum.js` ja/tai `routes/learning-path.js` — onko valmis endpointti joka palauttaa total/completed lessons koko polulle? Jos on, käytä sitä. Jos ei, lisää uusi `GET /api/curriculum/overall-progress` joka palauttaa:
   ```json
   {
     "completedLessons": 1,
     "totalLessons": 86,
     "completedCourses": 0,
     "totalCourses": 8,
     "perCourse": [
       { "courseKey": "kurssi_1", "completed": 1, "total": 10, "mastered": false },
       ...
     ]
   }
   ```
2. `dashboard.js`:n `renderYoReadiness` (tai vastaava ympäri r1430–1472) — vaihda datalähde tähän uuteen endpointiin
3. Uusi laskukaava (§1 Bug B mukaisesti):
   - `readinessPct = round(100 * completedLessons / totalLessons)`
   - `masteredCells = completedCourses` (kuinka moni kurssi on suoritettu kokonaan)
   - `totalCells = totalCourses` (= 8)
4. Päivitä summary-teksti: `"${completedCourses} / 8 kurssia hallinnassa · ${qual}"` — ei enää "14 osa-aluetta"
5. Solut/neliöt: 8 kpl, ei 14 — yksi per kurssi, värikoodi: harmaa (lukittu/aloittamatta) / turkoosi-outline (kesken) / täysi turkoosi (mastered)
6. ÄLÄ poista vanhaa SR-mastery-dataa engineä varten — se elää erillään. Vain UI-renderöinti vaihtuu.
7. Heikot kohdat -lista: pidä SR-pohjaisena, mutta päivitä otsikko "Heikot aiheet" tai "Kerrattavat aiheet" — jotta se ei sotke kurssin edistymistä lukijan mielessä.

Verify: 1/10 oppituntia tehty → näyttää 1 % (tai pyöristys 1 %), ei 20 %. 8 kurssia näkyvissä, ei 14. Käyttäjä ymmärtää suhteen kurssikorttien ja YO-valmiuden välillä.

### UPDATE 3 — Bug C: Opetussivu-nappi → "Miten Puheo toimii" etusivulla

Toimenpiteet:
1. `js/features/teachingPanel.js`:n `init` tai vastaava — lisää tila-tunnistus joka kuuntelee aktiivista screeniä (`document.querySelector(".screen.active")?.id`)
2. Jos aktiivinen screen on `screen-path` (etusivu) → trigger-nappi:
   - Label: "Miten Puheo toimii" (ei ikonia kirja vaan kysymysmerkki — 21st.dev hint-icon tai ui-ux-pro-max ikoni)
   - Klikkaus → avaa panel jossa "Miten Puheo toimii" -sisältö (ei lesson focus -error)
3. Jos aktiivinen screen on `screen-lesson` tai vastaava → säilytä nykyinen "Opetussivu"-toiminnallisuus
4. Tutorial-sisältö (suositeltu rakenne, käytä `puheo-finnish-voice/SKILL.md`):
   - **1. Kurssipolku on ydin.** "8 kurssia, jokainen rakentuu YO-koetta varten. Etene omassa tahdissasi — kurssi 1 on auki, muut avautuvat kun edellinen on hallinnassa."
   - **2. Oppitunnin neljä vaihetta.** "Tunnista → Muista → Sovella → Yhdistä. Jokainen vaihe rakentaa edellisen päälle."
   - **3. Mastery on signaali, ei lukko.** "Voit aina edetä. Järjestelmä merkitsee mitkä aiheet hallitset, mitä kannattaa kerrata."
   - **4. Kertaukset ovat tieteen tueksi.** "SR (spaced repetition) tuo aiheet takaisin juuri ennen kuin unohtaisit ne. Klikkaa 'Kertaa nyt' kun kortteja odottaa."
   - **5. YO-valmius kertoo missä olet.** "Prosentti perustuu kurssien edistymiseen. Kun kurssi 8 on tehty, olet valmis kokeeseen."
   - **6. Täyskoesimulaatio.** "Tee oikea YO-koe Koeharjoitus-välilehdellä — sama aikapaine, sama muoto, sama arvostelu kuin oikeassa kokeessa."
5. Step-by-step UI: 21st.dev-sourcing-passi (§3) + design:ux-copy stepien copylle
6. Sulkemisen jälkeen: storage `localStorage["puheoTutorialSeen"] = true` — jos käyttäjä on nähnyt sen kerran, nappi pysyy mutta voi näyttää eri otsikkoa ("Vinkit" tai pelkkä ?-ikoni)

Verify: etusivulta painaminen avaa tutoriaalin (ei error-tekstiä), oppitunnista painaminen avaa nykyisen opetussivun.

### UPDATE 4 — UX-parannus: hierarkia

Toimenpiteet:
1. `app.html` `screen-path` -wrapperissa: vaihda elementtien järjestystä:
   - 1. `dash-greeting` (sisältäen putki-chipin tervehdyksen alapuolella, ei omana rivinä)
   - 2. `path-courses` (kurssikortit + Oppimispolku-otsikko) — ensimmäisenä ja dominoivana
   - 3. `dash-day-cta` Jatka-/Kertaa-yhdistetty-CTA — kurssikorttien JÄLKEEN, pienempänä kuin nyt
   - 4. `yo-readiness` (uusi data UPDATE 2:sta)
   - 5. `dash-grid-row` (recent + chart)
2. Putki-chip (`dash-greeting__streak`) — sisennä `dash-greeting`-blockin sisään niin että se renderöityy tervehdyksen alapuolella, ei omana ylimääräisenä rivinään
3. Yhdistetty CTA-logiikka (kuten edellinen prompti määritteli):
   - Jos kesken oleva oppitunti → "Jatka oppituntia: K1L2 — Esittäytyminen" → `screen-lesson`
   - Muuten jos `repetitions_due > 0` → "Kertaa nyt — N korttia" → `screen-quick-review`
   - Muuten jos kurssi aloittamatta → "Aloita Kurssi 1 — Kuka olen" → `screen-lesson` K1L1
   - Muuten → "Tee tämän päivän kertaus"
4. Vain YKSI nappi näkyvissä, ei kahta

Verify: hierarkia silmällä luettavissa — kurssikortit ensin ja suurin, CTA yksi, putki ei ole oma raita.

### UPDATE 5 — copy + final sweep

- `design:ux-copy` jokainen näkyvä teksti
- `puheo-finnish-voice/SKILL.md` -sweep tutoriaalin tekstille
- axe-core 0 violations @ 1456 + 375
- `design:design-critique` ennen/jälkeen-vertailu screenshoteilla
- E2E-testi: kirjautuminen → etusivu renderöityy oikein → "Miten Puheo toimii" -nappi avaa tutoriaalin → CTA-klikkaus vie oikeaan kohteeseen → YO-valmius näyttää 1 % (1/86 oppituntia) eikä 20 %

---

## 5. Verifiointi-checklist

- [ ] `npm test` 1064/1064 ✓ (uusia testejä saa lisätä)
- [ ] `npm run build` clean
- [ ] axe-core 0 violations @ 1456 + 375
- [ ] Playwright screenshot 1456 + 375 → design:design-critique applattu
- [ ] Sisältö keskittyy `screen-path`:lla, oikea puoli ei ole tyhjää
- [ ] Recent + chart 2-palsta-griddissä desktopilla, stackaa mobilella
- [ ] YO-valmius näyttää lukemia jotka matchaavat kurssikorttien edistymistä (1/10 oppituntia → ~1 %, ei 20 %)
- [ ] YO-valmius-grid 8 solua (= 8 kurssia), ei 14
- [ ] "Opetussivu"-nappi etusivulla → "Miten Puheo toimii" -tutoriaali aukeaa, EI error-tekstiä
- [ ] Oppitunnin sisällä nappi toimii kuten ennen (Opetussivu-toiminnallisuus säilyy)
- [ ] Kurssikortit visuaalisesti dominoivat — suurin osio sivulla
- [ ] Yksi CTA Jatka-/Kertaa-osiossa, ei kahta
- [ ] Putki-chip integroitu greeting-headeriin, ei omana rivinä
- [ ] 21st.dev URL citettu `IMPROVEMENTS.md`-rivissä tutoriaali-komponentille
- [ ] `AGENT_STATE.md` päivitetty (max 7 riviä, vanhin arkistoon jos ylittyi)
- [ ] `IMPROVEMENTS.md` päivitetty (max 3 riviä per UPDATE)
- [ ] SW-bumppi vain jos STATIC_ASSETS muuttui
- [ ] PR-otsikko: `fix(home): layout + yo-readiness data + opetussivu→tutorial [L-HOME-HOTFIX-2]`

---

## 6. Pending / käyttäjälle ACTION REQUIRED

Lopuksi `IMPROVEMENTS.md`:hen:
- Onko olemassa `/api/curriculum/overall-progress` tai vastaava endpointti? Jos uusi luotiin, mainitse migraatiossa
- Tutoriaali-sisältö: 6 stepiä on ehdotus — käyttäjä voi muokata tekstit jos pedagogisesti vaativat tarkennusta
- Heikot kohdat -lista käyttää edelleen SR-dataa — tämä on tietoinen valinta (UPDATE 2 §6). Käyttäjä voi seuraavassa loopissa päättää siirretäänkö se kurssin osa-aluepohjaiseksi
