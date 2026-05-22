# v283 Runtime Audit Report

**Päivä:** 2026-05-22
**Audit-kohde:** prod `https://espanja-v2-1.vercel.app`
**Tili:** `testpro123@gmail.com` (Pro)
**Specit ajettu:**
- `tests/e2e-_runtime-audit.spec.js` — shallow (✅ passed, 50s)
- `tests/e2e-_runtime-audit-deep.spec.js` — deep (❌ timeout 15min @ Reading flow; ennen timeoutia kerätty arvokasta dataa)

Screenshotit `audit-screens/runtime-audit/` ja `audit-screens/runtime-audit-deep/`.

---

## Yhteenveto

| Severity | Lukumäärä |
|---|---|
| P0 | 3 |
| P1 | 4 |
| P2 | 3 |

Login + Aloitus + Oppimispolku + Asetukset toimivat. Mode-tile-flowit (writing/reading) eivät resolvoidu kunnolliseen tehtävä-näkymään yhden Aloita-klikin sisällä. Koeharjoitus jää ikuiseen "Tarkistetaan aktiivista koetta…" -spinneriin koska aiempi keskeneräinen koe blokkaa.

---

## P0 — Käyttäjä blokattu

### P0-1: Koeharjoitus jumii "Tarkistetaan aktiivista koetta…" -loaderiin
- **Where:** Aloitus → Koeharjoitus-tile → screen-loading
- **Repro:** kirjaudu testpro:lla, klikkaa "Koeharjoitus"-korttia kotinäytöllä.
- **Evidence:** loader näkyvissä >8s, `active=screen-loading`. Modaali "Sinulla on keskeneräinen Yo-koe" peittää alaosan ja siinä on toimiva CTA ("Jatka kesken olevaa" / "Aloita uusi koe"), mutta itse spinner-näyttö ei missään vaiheessa korvaudu sisällöllä modaalin alle.
- **Screenshot:** `audit-screens/runtime-audit/tile-T_YSI_YO-SIMULAATIO_Koeharjoitus_Koko_.png`
- **Spec-kohta:** shallow-spec rivi 230 — "Loader stuck >8s on mode screen"

### P0-2: Aloitus-näytön ensimmäinen render on skeleton-only ≥7s
- **Where:** post-login → screen-home
- **Repro:** kirjaudu, mittaa kahta peräkkäistä snapshottia (heti vs +5500ms).
- **Evidence:** shallow-spec otti `03-dashboard.png` ~7s login-klikistä → näkyy pelkkä skeleton-pulse (otsikko-placeholder + 5-sarakkeinen ohjaamo-skeleton + 4 mode-card-skeletonia). Deep-spec sama mittaus +5500ms odottelun jälkeen → `00-home.png` näyttää oikean sisällön ("Iltaa.", 116 pv, mode-kortit). Eli sisältö ladataan, mutta `networkidle` fired ennen kuin client-side fetchit ovat valmiit.
- **Screenshotit:** `audit-screens/runtime-audit/03-dashboard.png` (skeleton) vs `audit-screens/runtime-audit-deep/00-home.png` (resolved).
- **Impact:** käyttäjä näkee 5-7 sekuntia tyhjää skeletonia joka tunnistettu lyhyt-näkö-bugiksi useamman kerran.

### P0-3: `/api/adaptive/status?mode=writing` palauttaa 400
- **Where:** background fetch heti login-jälkeen home-näytöllä
- **Evidence (console + network):**
  - `[NET] 400 https://espanja-v2-1.vercel.app/api/adaptive/status?mode=writing`
  - `[CONSOLE ERROR] Failed to load resource: the server responded with a status of 400 ()`
- **Reproduces:** sekä shallow että deep audit, login → home.
- **Impact:** writing-mode-statusta ei saada → 65%/6/0pv-tilastojen alkuperä epäselvä (näkyykö cachattu vai virhe-tilan default?). 400-vastaus ei muuten näytä blokkaavan UI-rakennusta, mutta sentry-pakottava virhe joka pitää korjata. **Marker P0 koska prod console-virhe puhtaalla kotipoluulla.**

---

## P1 — Rikki mutta workaround

### P1-1: Sidebar piiloutuu hetkeksi home-renderin aikana
- **Where:** post-login transition
- **Evidence:** deep-spec lokaali `Sidebar on home: {"exists":true,"visible":false,"w":220}` — `offsetParent` palautti `null` mittaushetkellä vaikka leveys oli 220px. Visuaalisesti `home-no-sidebar.png` osoittaa että sidebar IS rendattu samalla otoksella. → flicker / display-toggle race ennen kuin pääkontti positionoituu.
- **Impact:** lyhyt visuaalinen vilkku ensikäynnillä; korjattavissa CSS-init-tilalla.

### P1-2: Kirjoitustehtävä-näytöllä ei näy "Aloita"-CTA:ta yhden klikkauksen päässä
- **Where:** Aloitus → Kirjoitustehtävä-tile → screen-writing
- **Evidence:** deep-spec lokaali "No 'Aloita' button on writing screen". Screenshotissa `10-writing.png` ja `writing-no-start.png` näkyy "Tehtävätyyppi → Lyhyt/Laajempi" + "Aihe → Sekalaiset/Ympäristö/…"-valikko, alaspäin scrollattava. Käyttäjän pitää scrollata + klikata ennen kuin AI-generoitu tehtävä syntyy. Ei ole varsinaisesti bugi, mutta "Aloita"-CTA ei ole näkyvissä eikä floattaa → käyttäjä luulee että näyttö on rikki.
- **Impact:** UX-tikku; helposti korjattavissa sticky-CTA:lla tai esivalitulla rivillä.

### P1-3: Oppimispolun lessonit eivät jäsentyneet deep-specin loctorille
- **Where:** Oppimispolku-näyttö
- **Evidence:** deep-spec `Course rows: []` — locator `.course, [data-course], li, article, button` ei löytänyt teksti-regexillä "Kurssi N" mitään, vaikka näyttö renderöi 8 kurssirivin listan (`01-path.png`). Eli kurssit eivät käytä semanttisia rooleita (article/li/data-course) — kaikki div-pohjaisia.
- **Impact:** ei suoraa käyttäjäongelmaa, mutta a11y + future-test-stability — ScreenReader näkee kurssilistan div-suppana. **Suositus: lisää `<ol>/<li>` + `data-course` -hookit.**

### P1-4: Reading-flow jumii — deep audit timeout
- **Where:** Aloitus → Luetun ymmärtäminen-tile → klikkasi "Aloita"
- **Evidence:** deep-spec ylitti 15min timeoutin rivillä 157 odottaessaan reading-screenin resolvoitumista. Joko AI-generaattori vastasi hitaasti tai locator klikkasi väärää elementtiä.
- **Impact:** vahvistettava regressio-specillä, mutta indikoi että reading-flow voi olla yhtä jumi-kohde kuin Koeharjoitus.

---

## P2 — Pienempi / visuaalinen

### P2-1: Oppimispolun "Lukittu"-merkkejä 7 kpl Pro-tilille
- Memory-rajaus: tämä on **suunnittelutarkoitus** ("Etene järjestyksessä."), ei bugi.
- Mainittu raportissa koska deep-spec markaa P1-tasoiseksi automaattisesti — toi-saalla downgrade P2.

### P2-2: User-avatar "TE" vs "KÄ" header-painikkeessa
- Shallow-spec lokaali "Nav items: [{i:9, tag:BUTTON, text:'KÄ'}]" — eli home-näytöllä ennen sidebarin resolvoitumista ainoa nav-painike oli pyöreä avatar-nappi tekstillä "KÄ".
- Deep-spec ottanut "TE" (post-resolve `screen-home`). Initials-fallback laskee jossakin transition-tilassa ihme tekstin.

### P2-3: Modaali "Sinulla on keskeneräinen Yo-koe" floattaa myös Asetukset-näytöllä
- Evidence: `audit-screens/runtime-audit/settings.png` näyttää modaalin alalaidassa Asetuksissa.
- Tämä on backdrop-jossitus, ei z-index-bugi, mutta hämmentää: modaali kuuluu Koeharjoitukselle, ei Asetuksille. Sulje navigaatiossa.

---

## Performance-havainnot

- Shallow audit: full run 50.1s (login + 4 nav-klikkausta + settings + logout). OK budjetissa.
- Aloitus-näytön sisältö resolvoituu 5-7s login-klikistä → P0-2 yllä.
- Deep audit timeout 15min @ reading-flow → P1-4 yllä.
- `/api/adaptive/status` 400 nopea (alle 200ms), eli ei latency-ongelma — pelkkä virhe-status.

---

## AI-slop-merkit screenshoteista

Tarkistettu memory-listan `feedback_ai_slop_check_every_frontend.md` -markerit:
- ❌ Em-dashia: `01-path.png` "Kurssi 1 — Kuka olen", `02-kurssi1.png` "1.1 Sanasto — Perhe ja kansallisuudet — perussanasto". Yli 3 em-dashia per näkymä → **AI-slop-flag**. Suositus: vaihda osa "·"-erottimiksi tai aseta hierarkia eri elementeiksi.
- ❌ "Ladataan…" placeholderia: ei näkyvissä (skeleton sen sijaan).
- ❌ italic-Fraunces "Ladataan…": ei näkyvissä.
- ❌ mono UPPERCASE chip: "ESPANJA · YO-KOEVALMENNUS", "8 KURSSIA · 80 OPPITUNTIA", "LYHYT + PITKÄ", "180 TEKSTIÄ", "TÄYSI YO-SIMULAATIO" — useita per näkymä. Memorystä `feedback_ai_slop_check_every_frontend.md`: "mono UPPERCASE chipit" = automaattinen rewrite. **Tämä on iso löytö** — jokainen mode-kortti, breadcrumb ja section-label käyttää mono-uppercase-eyebrowta. Suositus: vähennä yhteen per screen (esim. vain breadcrumb).
- ✅ identical card grid: 4 mode-korttia samanlaisia → on grid, mutta tarkoituksellinen ohjaamo-näkymä. Tähän voi elää.

---

## Suositukset — 5 isointa korjattavaa

1. **L-ADAPTIVE-FIX:** korjaa `/api/adaptive/status?mode=writing` 400 — joko query-parametrin validointi serverissä tai client-side syöte. Sentryyn pitäisi vuotaa runsaasti tästä jo nyt.
2. **L-EXAM-LOADER:** Koeharjoitus screen-loading-spinner ei saa jäädä päälle modaalin alle. Joko piilota spinneri kun modaali näkyy, tai resolvoi screen pre-modal ja näytä modaali confirm-overlay-tyyliin.
3. **L-HOME-PAINT:** estä skeleton-jakso ≥3s. Joko SSR-prefetch (tai välimuistiin tallennettu home-snapshot localStorageen) tai piilota skeleton heti kun ensimmäinen oikea bytea tulee.
4. **L-MONO-EYEBROW:** vähennä mono-uppercase-eyebrowit yhteen per screen. Memorystä **feedback_ai_slop_check_every_frontend.md** — pakollinen AI-slop-fix.
5. **L-WRITING-CTA:** kirjoitustehtävä-näyttö tarvitsee näkyvän "Aloita"-CTA:n yläosaan tai sticky-bottomiin. Nykyiset valikot ovat hyödyllisiä, mutta käyttäjä luulee että näyttö ei vielä toiminut.

---

## Screenshot-liite

`audit-screens/runtime-audit/`:
- 01-landing.png, 02-auth-screen.png, 03-dashboard.png
- nav-K_.png
- tile-{8_KURSSIA, LYHYT_PITK, 180_TEKSTI, T_YSI_YO}-*.png
- settings.png, after-logout.png
- REPORT.json

`audit-screens/runtime-audit-deep/`:
- 00-home.png, 01-path.png, 02-kurssi1.png
- 10-writing.png, writing-no-start.png
- home-no-sidebar.png
- (deep audit timeoutti ennen reading/exam-flowja → ei `20-*`, `30-*`, `40-*`, `50-*` screenshotteja)

---

## Seuraavat askeleet

- Lue tämä raportti
- Käynnistä korjausbriefit aiheittain (L-ADAPTIVE-FIX, L-EXAM-LOADER, L-HOME-PAINT, L-MONO-EYEBROW, L-WRITING-CTA)
- Säilytä `audit-screens/`-screenshotit before-state-evidenssinä
- Kun korjaukset on tehty: aja `tests/e2e-_runtime-audit*.spec.js` uudelleen ja vertaa

---

*Tuotettu Playwright-runtime-auditilla 2026-05-22, brief `docs/briefs/2026-05-22-playwright-runtime-audit.md`.*
