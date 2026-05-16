# Dashboard widget consolidation — design brief

**Status:** Plan B, phase 2. Deferred for a separate loop. The L-SURGICAL-2 loop on 2026-05-17 shipped only the surgical fixes (typos, decorative ordinals, mastery hierarchy flip, dash-hero-grade info icon). The bigger restructure documented here needs more thought and a dashboard.js audit before code touches.

**Anchored by:** PRODUCT.md (product register), `puheo-screen-template`, `puheo-finnish-voice`. App-register tasks override the brand-register defaults; app keeps the existing `style.css` Cuaderno tokens.

## Problem (from L-SURGICAL-2 critique)

**1. 14 ehdollista widgetiä yhdellä näytöllä.** The `#screen-path` and its legacy-hidden sibling `#screen-dashboard` populate these IDs conditionally:

- `dash-tutor` (daily AI tutor greeting)
- `dash-tutor-skeleton`
- `dash-hero-grade` (Arvioitu YO-arvosana)
- `daily-challenge`
- `dash-weak-topics`
- `dash-heatmap` (30 päivän aktiivisuus)
- `dash-forecast-section` (tulevat kertaukset)
- `dash-adaptive-card`
- `dash-ai-usage`
- `dash-writing-progression`
- `dash-modes`
- `dash-recommendations`
- `dash-full-exam-card`
- `dash-empty`
- `dash-placement-retake`
- Plus `#screen-path`-specific: `dash-free-chip-root`, `dash-readiness`, `dash-recent-wrap`, `dash-empty-rail`, `dash-chart`

A new user sees 2 widgets. A power user sees 11. Saman näytön mentaalimalli muuttuu täysin riippuen datasta.

**2. Sama numero näytetään 5 kertaa.** Putki näkyy:
- `dash-greeting__streak`-chip
- `dash-kpi-row` -tile
- `vocab-streak` mode-briefingissä
- `grammar-streak` mode-briefingissä
- `writing-streak` mode-briefingissä
- (`reading-streak` jos olemassa)

## Goal

Vakioi dashboard 5 always-visible osaan + max 2-3 conditional carditk (poikkeustilanteissa). Käyttäjä tietää joka aamuna mitä klikata, datan tilasta riippumatta.

## Proposed structure (`#screen-path`)

**Aina näkyvissä (5 ydintä):**

1. **Tervehdys + streak** (jo on, `dash-greeting`) — *säilytä*
2. **KPI-rivi** (jo on, `dash-kpi-row`) — *säilytä*, mutta Putki esitetään VAIN täällä; tervehdyksessä se siirtyy "...päivän putki" -mikrokopiaksi tervehdyksen sisään, ei erilliseksi chipiksi
3. **Päivän treeni -CTA** (jo on, `dash-day-cta`) — *säilytä*
4. **Kurssipolku** (jo on, `path-courses`) — *säilytä, päärooli*
5. **Edistyminen ajan myötä** (`dash-chart` / `dash-recent-wrap` yhdistäen) — *yhdistä yhdeksi "Tämän viikon edistys" -lohkoksi*

**Conditional, max 2 samanaikaisesti:**

A. **Heikot kohtasi (jos > 3 viime viikossa)** — yhdistää `dash-weak-topics` ja `dash-writing-progression`
B. **Tulevat kertaukset (jos SR-jonossa > 5 korttia)** — `dash-forecast-section`
C. **Täyskoesimulaatio (näkyy jos user > kurssi 5)** — `dash-full-exam-card`

**Cut entirely:**
- `dash-tutor` (tervehdys jo tekee saman, AI-tutor-msg on toiston yläpuolella)
- `daily-challenge` (compete kanssa `dash-day-cta`:n — kaksi CTA:ta yhdellä näytöllä)
- `dash-heatmap` (30 päivän aktiivisuus on dataa data-fanille, ei oppimisen syylle; käytä tilaa)
- `dash-adaptive-card` (sisäinen-systeemi-tila ei kuulu user-facing dashboardiin)
- `dash-ai-usage` (jää settings-näytölle jos tarpeen)
- `dash-modes` (mode-painikkeet ovat jo navissa)
- `dash-recommendations` (jos algoritmi on tarpeeksi älykäs, "päivän treeni" pitää tämän roolin)
- `dash-placement-retake` (siirrä settingsiin)
- Legacy `#screen-dashboard` -markup kokonaan (alusta asti komentin mukaan inert)

**Mode-briefing__stats neljältä mode-sivulta:** kokonaan poistetaan visuaalisesti. dashboard.js voi edelleen renderöidä IDs:n (vältä null-deref); CSS:llä `display: none` neljään `.mode-briefing` -wrapperiin.

## Tehtäväpinnat (vocab/grammar/reading/writing)

- **Smart-default kaikkiin "Aloita"-CTA:hin.** Kun käyttäjä on jo navigoinut moodiin, intent on selvä. Yksi CTA, käyttää viime kerralla valittua aihetta/tyyppiä tai järkevää defaulttia. Pieni "Vaihda aihetta" -linkki CTA:n alla niille jotka haluavat erilaisen.
- **Writing-moden kaksi pre-flight-valintaa (Tehtävätyyppi + Aihe) yhdistetään yhteen kysymykseen** "Tee lyhyt vai laaja?" -toggle + viime kerralla käytetty aihe. Mikäli ei valintaa: lyhyt + Sekalainen.

## Out of scope tällä briefillä

- Settings, profile, onboarding, full-exam-flow — eivät kuulu tähän loopiin
- Mastery-result hierarkia — jo korjattu L-SURGICAL-2:ssa
- Dash-hero-grade affordance — jo korjattu L-SURGICAL-2:ssa

## Implementation order (kun execution-loop alkaa)

1. **Audit dashboard.js** mitä se renderöi mihin ID:hen. Documentoi mitkä ID:t voi poistaa DOM:sta ilman null-derefiä, mitkä pitää säilyttää CSS-piilotettuna.
2. **CSS-only piilotus ensimmäisellä loopilla** — laita `display: none` kaikkiin cut-listan ID:hen. Validoi että mikään ei kaadu Playwright e2e-testissä.
3. **HTML-puhdistus toisella loopilla** — kun JS-puoli on todistetusti turvallinen, poista DOM-elementit. Validoi.
4. **Mode-page smart defaults kolmannessa loopissa** — koodimuutos kaikkiin neljään mode-sivuun. Validoi click-to-exercise <2 klikkiä.
5. **Visuaalinen audit** Playwrightilla 375/768/1440px joka loopin jälkeen.

Each loop committed separately; rollback-tasoinen if metrics tankkaa.

## Open questions

- **Kuka päättää että `daily-challenge` kannattaa cuttaa?** Se on tällä hetkellä joko nykyinen päivän AI-tutor-ehdotelma TAI nakuun kaikki conditional widgetit ja päivän-treeni on ainoa. Tarvitsen sinun nodisi.
- **Heatmap-fanit:** Joku ehkä rakastaa GitHub-streakin näköistä 30-päivän heatmappia. Jos haluat säilyttää sen, se siirretään profile-sivulle (`#screen-profile`) tai progress-näkymään (`#screen-progress`).
- **Mode-briefing-stats:** jos haluat säilyttää PER-mode-tarkkuuden (esim. "Viime sanasto-treenissä 84%"), se on eri datapiste kuin aggregoidut stats — voidaan säilyttää **yhtenä rivinä**, ei 3 statin blockina.

---

**Tämä brief odottaa nodisi. Kun haluat aloittaa, sano "execute B2" tai vastaava.**
