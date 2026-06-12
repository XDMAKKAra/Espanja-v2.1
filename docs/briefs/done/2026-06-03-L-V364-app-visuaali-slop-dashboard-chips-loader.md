# L-V364 — App-puolen visuaalinen siivous: dashboard-slop, kirjoitusteht. top bar/chipit, loader

**Päivä:** 2026-06-03
**Prioriteetti:** P2 (P0-V362 ja P1-V363 ensin)
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`. (Loaderin/microcopyn suomi-teksti → `humanizer`.)

---

## 1. Dashboard = 8 identtistä stat-korttia (AI-slop)

Kotinäkymän mittaristo on 8 lähes identtistä korttia ruudukossa (Putki · Yhteensä · Tällä viikolla · YO-valmius · Sanasto · Kielioppi · Lukeminen · Kirjoittaminen). Tämä on tasan se identtinen-korttiruudukko-pattern joka on slop-listalla (CLAUDE.md: "4/3 samankokoista samanmuotoista korttia rivissä").

**Korjaus:** rakenna mittaristo hierarkialla, ei tasaisella 8-ruudukolla.
- Nosta tärkein (esim. YO-valmius / YO-koe-countdown) isommaksi/eri muotoiseksi ankkuriksi.
- Ryhmittele osa-aluemittarit (Sanasto/Kielioppi/Lukeminen/Kirjoittaminen) omaksi tiiviiksi ryhmäksi, erota streak/määrä-luvuista.
- Eri kokoja, eri painoja — ei 8× sama kortti. Brändi cream/brick, ei lähes-mustia laatikoita.
- Huom V362: jos taso/YO-valmius on "ei vielä luotettava" -tilassa, mittari näyttää neutraalin tilan, ei väärää 0%/E:tä.

## 2. Kirjoitustehtävän top bar + chipit

Kirjoitustehtävä-näkymän yläpalkin väri istuu huonosti ja chipit ("Lyhyt tehtävä", "Verbit", pistemäärä-ympyrä "20 p") näyttävät slopilta (ikonit + muoto).

**Korjaus:** yhtenäistä top bar brändiin (ei riitelevää väriä); chipit siistiksi, johdonmukainen tyyli (ei satunnaisia ikoneja). Pistemäärä-merkki selkeä mutta brändinmukainen. Säilytä luettavuus (merkkilaskuri, tehtävänanto).

## 3. "Arvioidaan vastaustasi…" loader → vaiheistettu

Kirjoitustehtävän arviointi näyttää pelkän spinnerin + "Arvioidaan vastaustasi…". Tee parempi: kerro mitä vaihetta tehdään (esim. lukee vastausta → arvioi kielen rakenteet → kokoaa perustelun → viimeistelee). Vaiheet voivat edetä ajan/oikeiden tapahtumien mukaan. Ei "Ladataan…"-italicia, ei em-dashia, käytä skeleton/progress-henkeä. Suomi-teksti humanizerin läpi.

## Brändi-vartijat

- Cream/brick, Fredoka+Mulish, tasaiset värit. EI identtistä korttiruudukkoa, EI lähes-mustia laatikoita, EI mono-UPPERCASE-chippejä ilman syytä, EI em-dashia, EI italic-"Ladataan…".

## Acceptance criteria

- Dashboard ei ole 8 identtistä korttia; selkeä hierarkia, tärkein erottuu.
- Kirjoitustehtävän top bar + chipit brändinmukaiset, ei riitelevää väriä/slop-ikoneja.
- Loader näyttää vaiheet, ei pelkkää spinneriä; ei kiellettyjä slop-patterneja.
- 390px ei vaakavieritystä; desktop OK.

## Verify (writer tekee)

- Screenshot before/after: dashboard + kirjoitustehtävä-näkymä + loader-tila, 390px.
- `npm run build`; sw CACHE_VERSION bump jos STATIC_ASSETS muuttuu.
- Pushaa mainiin.

## Skaala

Keskikokoinen-iso: kolme app-näkymän visuaalista korjausta. Älä tee koko app-shellin redesignia — kohdenna näihin kolmeen.
