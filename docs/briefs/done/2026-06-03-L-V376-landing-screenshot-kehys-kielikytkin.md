# L-V376 — Landing-polish: screenshotin kehys + monikielinen hero-kytkin

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — V373:n näkyvät puutteet (Marcel: kuva kelluu, hero vain espanjaksi).
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + TESTING-M → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`
**Riippuvuus:** V373 (landing screenshot-redesign) ensin.
**Malli:** **Opus** (maku-kriittinen). Screenshot-kaappaus FR/DE → Sonnet/Haiku-subagentti.

## 🛑 PYHÄ RAJA — älä koske app-puoleen
ÄLÄ muokkaa `app.html`, `app.js`, `js/**`. Screenshotit KAAPATAAN app-puolelta (vain luku), app-koodia ei muuteta. Muutat vain `index.html` + landing-CSS:ää.

---

## Konteksti
V373 toi oikeat tuotekuvat landingille, mutta (1) screenshotit **kelluvat** cream-taustalla ilman selvää kehystä → näyttää keskeneräiseltä, ja (2) hero-screenshot on **vain espanjaksi** → ranskan/saksan kävijä näkee pelkkää espanjaa. Marcel: "kunnon outline tolle screenshotille" + "miten saadaan landing että kaikki ovat iloisia".

## Tehtävä 1 — Screenshotin kehys (älä jätä kellumaan)
Anna jokaiselle tuote-screenshotille selvä, premium-kehys. Valitse komposition itse, mutta sen TÄYTYY erottaa kuva creamista. Suositus (Linear/Notion-malli):
- Selaimen-ikkuna-kehys: pyöristetty yläpalkki (vaalea), pieni osoite-pilli "puheo.fi" tai 3 hillittyä pistettä vasemmalla.
- Itse screenshot alla, pyöristetyt kulmat (16–20px container).
- 1px reuna (ink/warm low-opacity) + pehmeä **kerrosvarjo** (taustaan tintattu, EI musta hard-shadow, EI glow).
- Harkitse hentoa paneelia/taustaympyrää kuvan takana josta se nousee esiin creamista.
Sama kehyskäsittely kaikille landingin tuotekuville (hero + feature-osio) johdonmukaisesti.

## Tehtävä 2 — Monikielinen hero (kaikki iloisia)
Tee hero-eyebrown `Espanja / Ranska / Saksa` -linkeistä **toimiva kielikytkin**:
- Klikkaus vaihtaa hero-screenshotin sen kielen versioon (ES/FR/DE). Aktiivinen kieli korostettu.
- Kaappaa FR- ja DE-versiot samasta näkymästä kuin ES (AI-arviointi/kirjoitustehtävä) Playwrightilla. Vaihda testitilin/näkymän kieli (sisältö on jo es/de/fr). Croppaa henkilökohtainen data pois. Tallenna `public/shots/`.
- Default = espanja (tai käyttäjän selainkieli jos helppo). Vähintään: kaikki kolme saavutettavissa yhdellä klikillä.
- Jos täysi kytkin on liian iso tähän, MINIMI: näytä hero-alueella merkki että tuote kattaa kaikki kolme kieltä (esim. pieni FR/DE-esikatselu tai selkeä "sama myös ranskaksi ja saksaksi" -elementti) — mutta toimiva kytkin on tavoite.

## Acceptance
- Yksikään screenshot ei kellu — kaikilla selvä kehys + pehmeä varjo, erottuvat creamista.
- ES/FR/DE-kytkin toimii: ranskan kävijä saa ranskankielisen hero-kuvan yhdellä klikillä.
- Brändi ennallaan (cream/brick/keltainen/vihreä flat, Fredoka/Mulish). Ei gradient/glow/hard-shadow-slopia.
- Ei vaakavieritystä 390px, renderöi 1440px. `npm run build` PASS, sw.js CACHE_VERSION bump.
- Ota Playwright-screenshotit valmiista (1440px + 390px, ja yksi kunkin kielen herosta) → `screenshots/`. Marcel katsoo.
- ÄLÄ pushaa/committaa.

## Ulkopuolella
App-puoli. Muut staattiset sivut (V374). Per-kieli-sivujen oma kieli hoidetaan V374:ssä.
