# L-V367 — Per-kieli-sivut eivät aukea desktopilla

**Päivä:** 2026-06-03
**Prioriteetti:** P1 (rikki konversiopinnalla, mahdollinen regressio L-V356/V358:sta)
**Rooli:** writer (Claude Code)
**Skill-stack:** TESTING-M + FRONTEND-S → `webapp-testing`, `design-taste-frontend`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`

---

## Tausta

Marcel (2026-06-03): "ne sivut mitä rakennettiin eri kielille, ne ei aukea desktop-versiossa." Kyse on L-V356:ssa rakennetuista per-kieli abikurssi-SEO-sivuista + L-V358:n kompakteista kielisivuista (es/de/fr). Mobiilissa toimivat, desktopilla eivät avaudu.

**Epäilty juuri:** L-V363 korjasi juuri saman perheen bugin (de/fr näyte-osio aukesi tyhjänä, syy = puuttuvat `</div>`-tagit jotka sulkivat kortit sisäkkäin). Tämä voi olla sama rikkinäinen markup eri breakpointilla, tai desktop-spesifi reititys/CSS joka piilottaa sisällön. **Tutki yksi juuri, älä korjaa kahta oiretta erikseen** (three-strikes: de/fr-landing on nyt rikkoutunut toistuvasti).

## Tehtävät
1. Toista bug: avaa es/de/fr per-kieli-sivut desktop-leveydellä (1440px) Playwrightilla. Dokumentoi mitä "ei aukea" tarkoittaa (tyhjä? 404? näkymätön sisältö? väärä reitti?).
2. Jäljitä juuri: markup-virhe (kuten V363), desktop-CSS joka `display:none`:aa, vai reititys joka ei matchaa desktopilla.
3. Korjaa juuri. Jos sama markup-perhe kuin V363, tarkista koko per-kieli-template kerralla.

## Acceptance
- es/de/fr per-kieli-sivut renderöivät täyden sisällön desktopilla (1440px) JA mobiilissa (390px).
- Ei konsoli-virheitä, ei tyhjää näkymää.
- Playwright-smoke kattaa kaikki kolme kieltä molemmilla leveyksillä.

## Ulkopuolella
Landingin pää-sivun hajautus + hero-slop → eri brief (V369). Tämä korjaa vain per-kieli-sivujen aukeamisen.
