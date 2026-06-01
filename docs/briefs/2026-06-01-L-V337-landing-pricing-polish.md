# BRIEF: L-V337 — Landing pricing polish (pieni, landing-scope)

**Päivä:** 2026-06-01
**Status:** Ship-brief, pieni. Aja viimeisenä — landing on jo yli-kiillotettu, tämä on viimeinen oikea slop-jäänne siellä.
**Trigger:** Marcel 2026-06-01 (kuva 4): pricing-kortit näyttävät slopilta.
**Skill-stack:** FRONTEND-M → `frontend-design`, `ui-ux-pro-max`, `humanizer` (jos kortti-copy muuttuu), `superpowers:verification-before-completion`

---

## Mitä korjataan

### 1. Vino "Suosituin"-badge
Mestari-kortin "Suosituin"-merkki on kallistettu (rotate) ruskea tarra. Halpa, tarra-mainen. Tee siitä suora, integroitu badge joka istuu kortin reunaan tai yläosaan ilman tilt-temppua. Brick tai accent, ei ruskea jos ruskea ei ole paletissa muualla.

### 2. Kolme lähes identtistä korttia (rule-of-three -gridi)
Free / Mestari / Treeni ovat kolme samankokoista, samanrakenteista korttia rivissä (eyebrow-pill + nimi + kuvaus + hinta + check-lista + nappi) — tasan se identical-card-grid jota CLAUDE.md kieltää. Mestari on jo korostettu (brick-reuna), mutta rakenne on monotoninen.

Älä riko hinnoittelun luettavuutta, mutta tuo hierarkiaa: Mestari (suositeltu) visuaalisesti dominantti, Free ja Treeni kevyemmät/sekundäärit. Voit esim. tehdä Mestarista leveämmän tai nostaa sen, ja Free/Treeni kompaktimmiksi. Intent: silmä menee Mestariin ensin, ei kolmeen tasavahvaan laatikkoon.

### 3. Eyebrow-pillit mono-UPPERCASE
"Vapaa luku", "Koko teos", "Harjoituskirja" -pillit ovat mono-uppercase (sama slop kuin app-sweepissä). Vaihda sans, normaali casing. Sketchy offset-reunat/varjot korteissa: hillitse jos ne näyttävät käsin-piirretyiltä.

---

## Acceptance criteria
1. "Suosituin"-badge ei ole kallistettu; integroitu siististi
2. Pricing-korteissa on selkeä hierarkia (Mestari dominantti), ei kolmea tasavahvaa identtistä laatikkoa
3. Eyebrow-pillit sans + normaali casing, ei mono-uppercase
4. Kortti-reunat/varjot hillityt, ei käsin-piirretyn näköisiä
5. Jos copy muuttuu, humanizer-pass
6. `npm run test:bug-scan` + brand-e2e PASS, `npm run build`, `sw.js` CACHE_VERSION bump
7. Mobile: kortit pinoutuvat siististi, ei vaakavieritystä

## Out-of-scope
- App-näkymät (= L-V335, L-V336)
- Hinnoittelun rakenteen / hintojen muutos (vain visuaalinen hierarkia)
